import google.generativeai as genai
import os
from dotenv import load_dotenv
import time
from pydantic import BaseModel, Field
from typing import List

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

class SalaryRange(BaseModel):
    min: int
    max: int

class JobDescriptionResponse(BaseModel):
    description: str = Field(description="Full markdown job description")
    summary: str = Field(description="Brief summary")
    responsibilities: List[str] = Field(description="List of responsibilities")
    requirements: List[str] = Field(description="List of required skills")
    salary_range: SalaryRange = Field(description="Salary range")

model_name = "gemini-2.5-pro"
prompt = """
Act as a Senior Technical Recruiter. Create a structured job posting.

JOB TITLE: Software Engineer
HIRING NOTES: "Test job"
"""

print(f"Testing model: {model_name} with Schema...")
try:
    model = genai.GenerativeModel(model_name)
    start = time.time()
    response = model.generate_content(
        prompt,
        generation_config=genai.GenerationConfig(
            response_mime_type="application/json",
            response_schema=JobDescriptionResponse
        )
    )
    duration = time.time() - start
    print(f"✅ Success ({duration:.2f}s)")
    print(response.text[:200])
except Exception as e:
    print(f"❌ Failed: {e}")
