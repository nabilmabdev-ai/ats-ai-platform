import os
import json
import re
import logging
import enum
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from dotenv import load_dotenv
import google.generativeai as genai
from pypdf import PdfReader
import io
from pymilvus import connections, FieldSchema, CollectionSchema, DataType, Collection, utility
from fastapi.middleware.cors import CORSMiddleware

from contextlib import asynccontextmanager

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("uvicorn")

# 1. Load Config
load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    logger.info("Configured Gemini API with key.")
    logger.info("Using Gemini Model: gemini-2.5-pro")

# Global Database State (Milvus)
candidate_collection = None
COLLECTION_NAME = "candidate_profiles_v3" # Bumped version to force new collection
DIMENSION = 768 

@asynccontextmanager
async def lifespan(app: FastAPI):
    global candidate_collection
    MILVUS_HOST = os.getenv("MILVUS_HOST", "localhost") 
    MILVUS_PORT = os.getenv("MILVUS_PORT", "19530")

    try:
        logger.info(f"Connecting to Milvus at {MILVUS_HOST}:{MILVUS_PORT}...")
        if not connections.has_connection("default"):
            connections.connect(alias="default", host=MILVUS_HOST, port=MILVUS_PORT)

        # Check if collection exists
        if utility.has_collection(COLLECTION_NAME):
            candidate_collection = Collection(COLLECTION_NAME)
            candidate_collection.load()
            logger.info(f"Loaded existing collection: {COLLECTION_NAME}")
        else:
            # Define Schema with Scalar Fields
            fields = [
                FieldSchema(name="candidate_id", dtype=DataType.VARCHAR, max_length=100, is_primary=True),
                FieldSchema(name="embedding", dtype=DataType.FLOAT_VECTOR, dim=DIMENSION),
                # New Scalar Fields
                FieldSchema(name="location", dtype=DataType.VARCHAR, max_length=200),
                FieldSchema(name="experience", dtype=DataType.INT64),
                # Array Field for Location Tokens (for "contains" search)
                FieldSchema(name="location_tokens", dtype=DataType.ARRAY, element_type=DataType.VARCHAR, max_capacity=50, max_length=100)
            ]
            schema = CollectionSchema(fields, "Candidate Skill Embeddings with Metadata")
            candidate_collection = Collection(COLLECTION_NAME, schema)
            
            # Index for Vector
            index_params = {"metric_type": "L2", "index_type": "IVF_FLAT", "params": {"nlist": 128}}
            candidate_collection.create_index(field_name="embedding", index_params=index_params)
            
            # Index for Scalars (Optional but good for performance)
            # candidate_collection.create_index(field_name="experience", index_name="exp_index")
            
            candidate_collection.load()
            logger.info(f"Created and loaded new collection: {COLLECTION_NAME}")

    except Exception as e:
        logger.error(f"❌ Milvus Connection Failed: {e}")
        # We might want to raise here to fail startup if DB is critical
        # raise e 
    
    yield
    
    # Clean up if needed (e.g. release collection)
    # if candidate_collection:
    #     candidate_collection.release()

app = FastAPI(title="ATS AI Service", version="2.5", lifespan=lifespan) # Bumped Version

# NEW: Add CORS Middleware
origins = [
    "http://localhost",
    "http://localhost:3000",
    "http://localhost:3001",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_milvus_connection():
    global candidate_collection
    return candidate_collection

def clean_and_parse_json(text: str):
    try:
        # Remove markdown code blocks
        text = re.sub(r'^```json\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'^```\s*', '', text, flags=re.MULTILINE)
        text = re.sub(r'\s*```$', '', text, flags=re.MULTILINE)
        return json.loads(text)
    except json.JSONDecodeError:
        # Fallback: try to find the first '{' and last '}'
        start = text.find('{')
        end = text.rfind('}')
        if start != -1 and end != -1:
            try:
                return json.loads(text[start:end+1])
            except:
                pass
        logger.error(f"Failed to parse JSON: {text}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response")

# --- DTOs for Requests ---
class JobGenRequest(BaseModel):
    title: str
    notes: Optional[str] = ""
    template_mode: Optional[bool] = False
    tone: Optional[str] = "Professional"
    company_description: Optional[str] = ""

class VectorizeRequest(BaseModel):
    candidate_id: str
    text: str
    location: Optional[str] = "Unknown"
    experience: Optional[int] = 0

class SearchRequest(BaseModel):
    query: str
    limit: int = 5
    offset: int = 0
    location: Optional[str] = None
    min_experience: Optional[int] = None

class MatchJobRequest(BaseModel):
    job_description: str
    limit: int = 10
    offset: int = 0

class RejectionGenRequest(BaseModel):
    candidate_name: str
    job_title: str
    job_description: Optional[str] = ""
    candidate_summary: Optional[str] = ""
    recruiter_notes: Optional[str] = "" 
    
class InterviewAnalysisRequest(BaseModel):
    job_title: str
    job_description: str
    requirements: List[str] = [] 
    candidate_name: str
    interview_notes: str

class ScreeningRequest(BaseModel):
    resume_text: str
    criteria: Dict[str, Any]
    job_description: Optional[str] = ""

class ScorecardGenRequest(BaseModel):
    role_title: str

class SectionGenRequest(BaseModel):
    job_title: str
    section_type: str
    context: str
    tone: Optional[str] = "Professional"
    skills: Optional[List[str]] = []

# --- Response Schemas ---
class ScreeningResponse(BaseModel):
    match_score: int
    red_flags: List[str]
    missing_critical_skills: List[str]
    screening_summary: str

class CVParseResponse(BaseModel):
    skills: List[str]
    summary: str
    experience_years: int
    education_level: str

class RejectionEmailResponse(BaseModel):
    subject: str
    body: str

class InterviewAnalysisResponse(BaseModel):
    rating: int
    pros: List[str]
    cons: List[str]
    summary: str

# ...

@app.post("/screen-candidate")
def screen_candidate(request: ScreeningRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        # safely extract criteria
        required = request.criteria.get('requiredSkills', [])
        nice = request.criteria.get('niceToHaves', [])
        weights = request.criteria.get('scoringWeights', { "skills": 0.7, "experience": 0.3 })
        
        prompt = f"""
        Act as a strict Technical Recruiter. Evaluate this resume against specific criteria.
        
        JOB DESCRIPTION CONTEXT:
        {request.job_description[:5000]}

        RESUME TEXT:
        {request.resume_text[:100000]}
        
        SCREENING CRITERIA:
        1. MUST HAVE SKILLS: {", ".join(required)}
        2. NICE TO HAVE: {", ".join(nice)}
        3. WEIGHTING: {json.dumps(weights)}
        
        TASK:
        1. Calculate a Match Score (0-100) based strictly on the criteria.
        2. Identify "Red Flags" or "Missing Critical Skills".
        3. Generate a "Screening Summary" justifying the score.
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=ScreeningResponse
            )
        )
        return clean_and_parse_json(response.text)
        
    except Exception as e:
        logger.error(f"Screening Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: Generate Single Section Endpoint ---
@app.post("/generate-template-section")
def generate_template_section(request: SectionGenRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        section_map = {
            'SUMMARY': "Write a professional 2-3 sentence role summary.",
            'RESPONSIBILITIES': "Write a bulleted list of 5 key responsibilities.",
            'REQUIREMENTS': "Write a bulleted list of 5 key technical requirements and soft skills.",
            'LEGAL': "Write a standard equal opportunity employer disclaimer."
        }
        
        instruction = section_map.get(request.section_type, "Write content for this section.")
        
        # Build skills instruction if provided
        skills_instruction = ""
        if request.skills:
            skills_list = ", ".join(request.skills)
            skills_instruction = f"CRITICAL: You MUST include the following required skills in the text: {skills_list}."

        prompt = f"""
        Act as a Senior Recruiter.
        JOB TITLE: {request.job_title}
        TONE: {request.tone}
        CONTEXT: {request.context}
        
        TASK: {instruction}
        {skills_instruction}
        
        Output ONLY the content (no markdown headers like ##).
        """
        
        response = model.generate_content(prompt)
        return {"content": response.text.strip()}
        
    except Exception as e:
        logger.error(f"Section Gen Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- NEW: Generate Scorecard Endpoint ---
@app.post("/generate-scorecard")
def generate_scorecard(request: ScorecardGenRequest):
    logger.info(f"Received scorecard generation request for: {request.role_title}")
    try:
        # NOTE: The user's instructions specified 'gemini-2.5-pro' but the existing code uses 'gemini-pro'.
        # I will use 'gemini-2.5-pro' as requested in the plan.
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        prompt = f"""
        Act as a Hiring Manager. Create a screening scorecard for the role: "{request.role_title}".
        
        OUTPUT FORMAT (JSON):
        {{
            "requiredSkills": ["List", "of", "5", "hard", "skills"],
            "niceToHaves": ["List", "of", "3", "bonus", "skills"],
            "scoringWeights": {{
                "skills_match": 0.6,
                "experience_years": 0.3,
                "education_level": 0.1
            }}
        }}
        
        INSTRUCTIONS:
        1. Weights MUST sum exactly to 1.0.
        2. Use standard keys for weights if possible (skills_match, experience_years, education_level, culture_fit), but you can invent others if critical for the role.
        """
        
        logger.info("Sending prompt to Gemini...")
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        logger.info("Received response from Gemini.")
        logger.info(f"Raw response text: {response.text[:100]}...")
        
        return clean_and_parse_json(response.text)
        
    except Exception as e:
        logger.error(f"Scorecard Gen Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-job-description")
def generate_job_desc(request: JobGenRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-pro') 
        
        # Explicit JSON instruction to replace schema
        json_structure = """
        Output strictly valid JSON with this structure:
        {
            "description": "Full markdown job description (or empty string)",
            "summary": "Brief summary",
            "responsibilities": ["list", "of", "strings"],
            "requirements": ["list", "of", "strings"],
            "salary_range": {"min": 1000, "max": 2000}
        }
        """

        if request.template_mode:
            prompt = f"""
            Act as a Senior Technical Recruiter. 
            Extract specific job details for a template. Do NOT write a full job description text.
            
            JOB TITLE: {request.title}
            TONE: {request.tone}
            HIRING NOTES: "{request.notes}"
            COMPANY CONTEXT: "{request.company_description}"

            INSTRUCTIONS:
            - Populate 'summary' with a brief role overview.
            - Populate 'responsibilities' with a list of key duties.
            - Populate 'requirements' with a list of skills.
            - Populate 'salary_range' with an estimated range.
            - Leave 'description' empty as we are in template mode.
            
            {json_structure}
            """
        else:
            prompt = f"""
            Act as a Senior Technical Recruiter. Create a structured job posting.
            
            JOB TITLE: {request.title}
            TONE: {request.tone}
            HIRING NOTES: "{request.notes}"
            COMPANY CONTEXT: "{request.company_description}"

            INSTRUCTIONS:
            - Write a full markdown job description in the 'description' field.
            - Also extract 'requirements' and 'salary_range' into their respective fields.
            - You can leave 'summary' and 'responsibilities' empty if the full description covers it.
            
            {json_structure}
            """
            
        logger.info(f"Generating job description for: {request.title}")
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        logger.info("Gemini response received.")
        return clean_and_parse_json(response.text)
    except Exception as e:
        logger.error(f"Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/parse-cv")
async def parse_cv(file: UploadFile = File(...)):
    try:
        content = await file.read()
        pdf = PdfReader(io.BytesIO(content))
        text = ""
        for page in pdf.pages:
            text += page.extract_text() + "\n"

        # Limit text length to avoid token limits
        prompt_text = text[:500000]

        model = genai.GenerativeModel('gemini-2.5-pro')
        prompt = f"""
        You are an expert HR AI. Analyze this resume text.
        Text: {prompt_text} 
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=CVParseResponse
            ),
            request_options={"timeout": 120}
        )
        parsed_data = clean_and_parse_json(response.text)
        
        # Append raw text for downstream tasks (like screening)
        parsed_data["raw_text"] = text
        
        return parsed_data
    except Exception as e:
        return {"skills": [], "summary": "Parsing failed", "error": str(e), "raw_text": ""}

@app.post("/vectorize-candidate")
def vectorize_candidate(request: VectorizeRequest):
    collection = get_milvus_connection()
    if not collection:
        raise HTTPException(status_code=503, detail="Vector Database unavailable.")

    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=request.text,
            task_type="retrieval_document",
            title="Candidate Profile"
        )
        vector = result['embedding']
        
        # Tokenize location for Array field
        # Simple tokenization: lowercase, split by comma and space, filter empty
        raw_loc = request.location or "Unknown"
        loc_tokens = [t.strip() for t in re.split(r'[, ]+', raw_loc.lower()) if t.strip()]
        
        # Insert with metadata
        # Milvus expects list of columns: [[ids], [vectors], [locs], [exps], [loc_tokens]]
        data = [
            [request.candidate_id],
            [vector],
            [raw_loc], # Store original location for display
            [request.experience or 0],
            [loc_tokens] # Store tokens for filtering
        ]
        
        # Check if candidate already exists and delete if so (to avoid Duplicate PK error)
        # Note: Milvus upsert might be supported in newer versions, but delete-insert is safer for compatibility
        if collection.has_partition("_default"): # basic check
             collection.delete(f'candidate_id in ["{request.candidate_id}"]')
        
        collection.insert(data)
        collection.flush()
        return {"status": "indexed", "id": request.candidate_id}
    except Exception as e:
        logger.error(f"Vectorize Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/search-candidates")
def search_candidates(request: SearchRequest):
    collection = get_milvus_connection()
    if not collection:
        raise HTTPException(status_code=503, detail="Vector Database unavailable.")

    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=request.query,
            task_type="retrieval_query"
        )
        query_vector = result['embedding']
        search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
        
        # Build Boolean Expression for Filtering
        expr_parts = []
        if request.location:
            # Use Array Contains for filtering
            # We search if ANY of the tokens in the query match the stored tokens
            # For strict "contains", we can check if the query term exists in the array
            loc_term = request.location.lower().strip()
            expr_parts.append(f'array_contains(location_tokens, "{loc_term}")')
            
        if request.min_experience is not None:
            expr_parts.append(f'experience >= {request.min_experience}')
            
        expr = " && ".join(expr_parts) if expr_parts else None
        
        results = collection.search(
            data=[query_vector], 
            anns_field="embedding", 
            param=search_params, 
            limit=request.limit,
            offset=request.offset,
            expr=expr, # <--- Apply Filter
            output_fields=["candidate_id", "location", "experience"] 
        )
        matches = []
        for hits in results:
            for hit in hits:
                matches.append({
                    "candidate_id": hit.id, 
                    "score": hit.distance,
                    "location": hit.entity.get("location"),
                    "experience": hit.entity.get("experience")
                })
        return {"matches": matches}
    except Exception as e:
        logger.error(f"Search Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/match-job")
def match_job(request: MatchJobRequest):
    collection = get_milvus_connection()
    if not collection:
        raise HTTPException(status_code=503, detail="Vector Database unavailable.")

    try:
        result = genai.embed_content(
            model="models/text-embedding-004",
            content=request.job_description,
            task_type="retrieval_query" 
        )
        query_vector = result['embedding']
        search_params = {"metric_type": "L2", "params": {"nprobe": 10}}
        results = collection.search(
            data=[query_vector], 
            anns_field="embedding", 
            param=search_params, 
            limit=request.limit,
            offset=request.offset,
            output_fields=["candidate_id"] 
        )
        matches = []
        for hits in results:
            for hit in hits:
                matches.append({"candidate_id": hit.id, "score": hit.distance})
        return {"matches": matches}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-rejection-email")
def generate_rejection_email(request: RejectionGenRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        prompt = f"""
        Act as a compassionate and professional Recruiter at a top tech company.
        Write a rejection email for a candidate.
        
        CANDIDATE NAME: {request.candidate_name}
        JOB TITLE: {request.job_title}
        
        CONTEXT:
        - Job Description Snippet: "{request.job_description[:500]}..."
        - Candidate Strengths/Summary: "{request.candidate_summary}"
        - Specific Rejection Reason (if any): "{request.recruiter_notes}"
        
        INSTRUCTIONS:
        1. Subject Line: Professional and clear.
        2. Tone: Empathetic, encouraging, but firm (decision is final).
        3. Content: 
           - Thank them for their time.
           - Mention a specific positive trait if 'Candidate Strengths' is provided (make it personalized).
           - Gently explain that we are proceeding with other candidates who matched the specific needs closer (use the specific reason if provided).
           - Wish them luck and suggest staying in touch.
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=RejectionEmailResponse
            )
        )
        return clean_and_parse_json(response.text)
        
    except Exception as e:
        logger.error(f"❌ Rejection Gen Critical Error: {e}")
        return {
            "subject": f"Application Status: {request.job_title}",
            "body": f"Dear {request.candidate_name},\n\nThank you for applying. Unfortunately, we are not proceeding with your application at this time.\n\nBest,\nRecruiting Team"
        }

@app.post("/analyze-interview")
def analyze_interview(request: InterviewAnalysisRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        req_list = ", ".join(request.requirements) if request.requirements else "General Fit"

        prompt = f"""
        Act as an expert Hiring Manager. Evaluate this candidate's interview performance based on the notes provided.
        
        POSITION: {request.job_title}
        REQUIRED SKILLS: {req_list}
        CANDIDATE: {request.candidate_name}
        
        INTERVIEWER NOTES (Raw):
        "{request.interview_notes}"
        
        TASK:
        1. Assign a Rating (1-10).
        2. Extract 3 Pros and 3 Cons.
        3. Compare notes against the REQUIRED SKILLS specifically. Did they demonstrate them?
        4. Write a professional summary.
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=InterviewAnalysisResponse
            )
        )
        return clean_and_parse_json(response.text)
        
    except Exception as e:
        logger.error(f"Interview Analysis Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))