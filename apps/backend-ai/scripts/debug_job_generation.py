import google.generativeai as genai
import os
from dotenv import load_dotenv
import time
from pydantic import BaseModel, Field
from typing import List

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

# Original Schema
class SalaryRange(BaseModel):
    min: int
    max: int

class JobDescriptionResponse(BaseModel):
    description: str = Field(description="Full markdown job description")
    summary: str = Field(description="Brief summary")
    responsibilities: List[str] = Field(description="List of responsibilities")
    requirements: List[str] = Field(description="List of required skills")
    salary_range: SalaryRange = Field(description="Salary range")

prompt_template = """
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

def test_config(name, use_schema=True):
    print(f"\nTesting Config: {name} (Schema: {use_schema})")
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        start = time.time()
        
        config = genai.GenerationConfig(
            response_mime_type="application/json"
        )
        if use_schema:
            config.response_schema = JobDescriptionResponse

        response = model.generate_content(
            prompt_template,
            generation_config=config
        )
        print(f"Success! Time: {time.time() - start:.2f}s")
        # print(f"Response snippet: {response.text[:100]}")
    except Exception as e:
        print(f"Failed! Time: {time.time() - start:.2f}s")
        print(f"Error: {e}")

# Test 1: With Schema (Baseline - expected to fail/hang)
# test_config("With Schema", use_schema=True) 

# Test 2: Without Schema (JSON Mode only)
test_config("Without Schema (JSON Mode)", use_schema=False)
