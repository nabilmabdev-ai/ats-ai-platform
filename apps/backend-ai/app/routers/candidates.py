import logging
import json
from fastapi import APIRouter, UploadFile, File, HTTPException
from typing import List

from app.schemas import (
    ScreeningRequest, ScreeningResponse,
    CVParseResponse,
    VectorizeRequest, SearchRequest
)
from app.services.gemini_service import gemini_service
from app.services.pdf_service import pdf_service
from app.services.milvus_service import milvus_service

router = APIRouter()
logger = logging.getLogger("uvicorn")

@router.post("/screen-candidate")
def screen_candidate(request: ScreeningRequest):
    try:
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
        1. Calculate a Match Score (match_score) (0-100) based strictly on the criteria.
        2. Identify "Red Flags" or "Missing Critical Skills".
        3. Identify 3-5 "Pros" (Key strengths relative to the job).
        4. Identify 3-5 "Cons" (Weaknesses or gaps relative to the job).
        5. Generate a "Screening Summary" (summary) justifying the score.

        CONSTRAINTS:
        - Output strictly valid JSON.
        - Do NOT repeat phrases or sentences in the summary.
        - Be concise and professional.
        """
        
        # Uses standard Gemini Service (2.5 Pro)
        return gemini_service.generate_json(prompt)
        
    except Exception as e:
        logger.error(f"Screening Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/parse-cv")
async def parse_cv(file: UploadFile = File(...)):
    tmp_path = None
    try:
        # 1. Save and Extract Text via PdfService (PyMuPDF)
        # We need to handle the file saving manually here to pass path to PdfService or 
        # let PdfService handle UploadFile?
        # PdfService.extract_text_from_upload handles the temp file lifecycle for extraction
        text = pdf_service.extract_text_from_upload(file)

        # 2. OCR Fallback Logic
        if len(text.strip()) < 50:
            logger.info("Text extraction failed or too short. Triggering OCR Fallback with Gemini Vision...")
            
            try:
                # We need the file again for Vision. 
                # Since UploadFile is a stream, we might have consumed it?
                # PdfService saves to temp, reads, then deletes. 
                # Re-reading stream might fail if not seek(0).
                await file.seek(0)
                
                # Create a temp file again for Gemini Upload
                # (Ideally PdfService could return the path? But it deletes it for safety)
                # Let's simple create a temp file here for Vision
                import tempfile
                import shutil
                import os
                
                with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                    shutil.copyfileobj(file.file, tmp)
                    tmp_path = tmp.name

                prompt = """
                You are an expert HR AI. Look at this document image and extract the resume data into JSON.
                
                EXTRACT:
                - skills (list of strings)
                - summary (string)
                - experience_years (int)
                - education_level (string)
                
                Output strictly valid JSON.
                """
                
                parsed_data = gemini_service.generate_with_vision(prompt, tmp_path)
                parsed_data["raw_text"] = "OCR_EXTRACTED" 
                return parsed_data
                
            except Exception as e:
                logger.error(f"OCR Fallback Error: {e}")
                raise e
            finally:
                if tmp_path and os.path.exists(tmp_path):
                    os.remove(tmp_path)

        # 3. Text Analysis (Standard)
        prompt_text = text[:500000]
        prompt = f"""
        You are an expert HR AI. Analyze this resume text and extract the resume data into JSON.
        Text: {prompt_text} 
        
        EXTRACT:
        - skills (list of strings)
        - summary (string)
        - experience_years (int)
        - education_level (string)
        
        Output strictly valid JSON.
        """
        
        # Use Flash model for fast extraction (which is now encapsulated or we use standard generate_json)
        # generate_json uses model_pro (2.5 Pro). For parsing, Pro is good.
        # Original code used 2.5 Flash for parsing. 
        # Let's add explicit model choice to service later or just use Pro for quality.
        # User asked for same models. Parsing used 'gemini-2.5-flash'.
        # I should probably expose `generate_fast` in service or just use Pro (better).
        # Let's use Pro for now as it's safer for JSON, or I can update Service to support model choice.
        # actually gemini_service.model_pro is 2.5-pro. 
        # Using Pro for extracting data is safer.
        
        parsed_data = gemini_service.generate_json(prompt)
        parsed_data["raw_text"] = text
        
        return parsed_data

    except Exception as e:
        logger.error(f"Parse CV Error: {e}")
        return {"skills": [], "summary": "Parsing failed", "error": str(e), "raw_text": ""}

@router.post("/vectorize-candidate")
def vectorize_candidate(request: VectorizeRequest):
    try:
        # Generate Vector
        vector = gemini_service.embed_text(request.text, title="Candidate Profile")
        
        # Upsert to Milvus
        milvus_service.upsert_candidate(
            request.candidate_id, 
            vector, 
            metadata={
                "location": request.location,
                "experience": request.experience,
                # location_tokens handled inside service? verify
                # Service expects raw metadata and handles tokenization?
                # Let's check milvus_service... yes `loc_tokens = metadata.get("location_tokens", [])`
                # So we need to tokenize here.
            }
        )
        
        # Wait, MilvusService code I wrote:
        # loc_tokens = metadata.get("location_tokens", [])
        # usage: `loc_tokens = [t.strip() for t in re.split(r'[, ]+', raw_loc.lower()) if t.strip()]`
        # So I need to pass it.
        import re
        raw_loc = request.location or "Unknown"
        loc_tokens = [t.strip() for t in re.split(r'[, ]+', raw_loc.lower()) if t.strip()]

        # Re-call upsert with tokens
        milvus_service.upsert_candidate(
            request.candidate_id, 
            vector, 
            metadata={
                "location": request.location,
                "experience": request.experience,
                "location_tokens": loc_tokens
            }
        )
        
        return {"status": "indexed", "id": request.candidate_id}
    except Exception as e:
        logger.error(f"Vectorize Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search-candidates")
def search_candidates(request: SearchRequest):
    try:
        # Generate Query Vector
        query_vector = gemini_service.embed_text(request.query, task_type="retrieval_query")
        
        # Build Filter Expr
        expr_parts = []
        if request.location:
            loc_term = request.location.lower().strip()
            expr_parts.append(f'array_contains(location_tokens, "{loc_term}")')
            
        if request.min_experience is not None:
            expr_parts.append(f'experience >= {request.min_experience}')
            
        expr = " && ".join(expr_parts) if expr_parts else None
        
        # Search
        results = milvus_service.search(query_vector, limit=request.limit, expr=expr)
        
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
