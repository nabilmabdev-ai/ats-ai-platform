import logging
import google.generativeai as genai
from fastapi import APIRouter, HTTPException
from pymilvus import Collection

from app.schemas import (
    JobGenRequest, MatchJobRequest, SectionGenRequest, ScorecardGenRequest,
    RejectionGenRequest, RejectionEmailResponse
)
from app.utils.json_parser import clean_and_parse_json
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger("uvicorn")

def get_milvus_collection():
    from pymilvus import utility
    if utility.has_collection(settings.COLLECTION_NAME):
        return Collection(settings.COLLECTION_NAME)
    return None

@router.post("/generate-job-description")
def generate_job_desc(request: JobGenRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-pro') 
        
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
            
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        return clean_and_parse_json(response.text)
    except Exception as e:
        logger.error(f"Generation Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate-template-section")
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

@router.post("/generate-scorecard")
def generate_scorecard(request: ScorecardGenRequest):
    try:
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
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json"
            )
        )
        return clean_and_parse_json(response.text)
        
    except Exception as e:
        logger.error(f"Scorecard Gen Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/match-job")
def match_job(request: MatchJobRequest):
    collection = get_milvus_collection()
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

@router.post("/generate-rejection-email")
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
           - Gently explain that we are proceeding with other candidates who matched the specific needs closer.
           - Wish them luck.
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
        logger.error(f"Rejection Gen Error: {e}")
        return {
            "subject": f"Application Status: {request.job_title}",
            "body": f"Dear {request.candidate_name},\n\nThank you for applying. Unfortunately, we are not proceeding with your application at this time.\n\nBest,\nRecruiting Team"
        }
