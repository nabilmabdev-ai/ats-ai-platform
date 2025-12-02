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

prompt = """
Act as a Senior Technical Recruiter. 
Extract specific job details for a template. Do NOT write a full job description text.

JOB TITLE: comptable
HIRING NOTES: ""

INSTRUCTIONS:
- Populate 'summary' with a brief role overview.
- Populate 'responsibilities' with a list of key duties.
- Populate 'requirements' with a list of skills.
- Populate 'salary_range' with an estimated range.
- Leave 'description' empty as we are in template mode.
"""

def test_model(model_name):
    print(f"\nTesting {model_name}...")
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
        print(f"Success! Time: {time.time() - start:.2f}s")
        print(f"Response snippet: {response.text[:100]}")
    except Exception as e:
        print(f"Failed! Time: {time.time() - start:.2f}s")
        print(f"Error: {e}")

test_model('gemini-1.5-pro')
test_model('gemini-2.0-flash')
# test_model('gemini-2.5-pro') # We know this hangs or is problematic, skipping to save time or running last
