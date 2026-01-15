from pydantic import BaseModel
from typing import Optional, List, Dict, Any

# --- Request Schemas ---

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
    pros: List[str]
    cons: List[str]

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

class GenerateQuestionsRequest(BaseModel):
    job_title: str
    job_description: Optional[str] = ""
    skills: Optional[List[str]] = []
    candidate_name: Optional[str] = "Candidate"

class GenerateQuestionsResponse(BaseModel):
    role_specific: List[str]
    behavioral: List[str]
    red_flags: List[str]
