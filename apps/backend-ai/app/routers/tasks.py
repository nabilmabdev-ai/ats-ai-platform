from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel
from typing import List, Optional
from app.services.gemini_service import gemini_service
import logging

logger = logging.getLogger("uvicorn")

router = APIRouter(
    prefix="/tasks",
    tags=["tasks"],
    responses={404: {"description": "Not found"}},
)

class TaskSuggestionRequest(BaseModel):
    context: str # e.g. "I just interviewed John Doe for Senior Engineer"
    limit: Optional[int] = 3

class TaskSuggestion(BaseModel):
    title: str
    description: str
    priority: str # LOW, MEDIUM, HIGH, URGENT
    dueInDays: int

@router.post("/suggest", response_model=List[TaskSuggestion])
async def suggest_tasks(request: TaskSuggestionRequest):
    try:
        prompt = f"""
        You are an expert AI recruiting assistant.
        Based on the following context: "{request.context}",
        suggest {request.limit} actionable tasks for the recruiter.
        
        Return a JSON array of objects with these fields:
        - title: Short, actionable title
        - description: Brief explanation of why this task is needed
        - priority: One of [LOW, MEDIUM, HIGH, URGENT]
        - dueInDays: Recommended number of days from now to complete (e.g. 0 for today, 1 for tomorrow)
        
        Example JSON:
        [
            {{ "title": "Send follow-up email", "description": "Thank candidate for time", "priority": "MEDIUM", "dueInDays": 1 }}
        ]
        """
        
        response = gemini_service.generate_json(prompt)
        
        # Validate/Filter if needed, but for now trust the AI's JSON structure
        if isinstance(response, list):
            return response
        else:
            return []
            
    except Exception as e:
        logger.error(f"Task Suggestion Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
