import logging
import google.generativeai as genai
from fastapi import APIRouter
import json

from app.schemas import (
    InterviewAnalysisRequest, InterviewAnalysisResponse,
    GenerateQuestionsRequest, GenerateQuestionsResponse
)
from app.utils.json_parser import clean_and_parse_json

router = APIRouter()
logger = logging.getLogger("uvicorn")

@router.post("/analyze-interview")
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
        4. Write a professional summary (MAX 3-4 sentences).
        
        IMPORTANT:
        - Be concise.
        - Do NOT repeat the same points.
        - Do NOT repeat phrases like "I do not recommend" excessively.
        - Output strictly valid JSON.
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=InterviewAnalysisResponse,
                max_output_tokens=4096, 
                temperature=0.7
            )
        )

        if not response.parts:
            logger.warning(f"AI Response blocked or empty. Finish Reason: {response.candidates[0].finish_reason}")
            return {
                "rating": 0,
                "pros": [],
                "cons": [],
                "summary": "AI Analysis could not be completed. The model returned an empty response (likely due to safety filters or token limits)."
            }

        return clean_and_parse_json(response.text)
    except Exception as e:
        logger.error(f"Interview Analysis Error: {e}")
        return {
                "rating": 0,
                "pros": [],
                "cons": [],
                "summary": "AI Service Error"
            }

@router.post("/generate-interview-questions")
def generate_interview_questions(request: GenerateQuestionsRequest):
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        
        skills_str = ", ".join(request.skills) if request.skills else "General"
        
        prompt = f"""
        Act as an expert Interviewer. Generate a list of interview questions for a candidate apply specifically for this role.
        
        ROLE: {request.job_title}
        DESCRIPTION_CTX: {request.job_description[:500]}...
        SKILLS TO VERIFY: {skills_str}
        CANDIDATE: {request.candidate_name}
        
        TASK:
        Generate exactly:
        - 5 "Role Specific" questions testing technical/role knowledge.
        - 3 "Behavioral" questions testing soft skills and culture fit.
        - 3 "Red Flag" probers (questions to ask if you suspect weakness in key areas).
        
        Questions should be challenging but fair.
        """
        
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                response_mime_type="application/json",
                response_schema=GenerateQuestionsResponse,
                max_output_tokens=2048,
                temperature=0.8
            )
        )
        
        if not response.parts:
            return {
                "role_specific": [],
                "behavioral": [],
                "red_flags": []
            }
            
        return clean_and_parse_json(response.text)

    except Exception as e:
        logger.error(f"Question Generation Error: {e}")
        return {
            "role_specific": ["Error generating questions"],
            "behavioral": [],
            "red_flags": []
        }
