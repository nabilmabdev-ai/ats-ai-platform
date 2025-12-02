import requests
import json

URL = "http://localhost:8000/generate-template-section"

def test_template_gen(tone, skills):
    payload = {
        "job_title": "Senior React Developer",
        "section_type": "REQUIREMENTS",
        "context": "Requirements",
        "tone": tone,
        "skills": skills
    }
    
    print(f"\n--- Testing with Tone: {tone}, Skills: {skills} ---")
    try:
        response = requests.post(URL, json=payload, timeout=30)
        if response.status_code == 200:
            content = response.json().get("content", "")
            print("Response Content Preview:")
            print(content[:500])
            
            # Verification Checks
            if tone == "Casual" and ("!" in content or "love" in content.lower() or "awesome" in content.lower()):
                print("✅ Tone Check Passed (Casual indicators found)")
            elif tone == "Professional" and "!" not in content:
                 print("✅ Tone Check Passed (Professional)")
            
            if skills:
                missing_skills = [s for s in skills if s.lower() not in content.lower()]
                if not missing_skills:
                    print("✅ Skills Check Passed (All skills found)")
                else:
                    print(f"❌ Skills Check Failed. Missing: {missing_skills}")
        else:
            print(f"❌ Error: {response.status_code} - {response.text}")
            
    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    # Test 1: Casual Tone
    test_template_gen("Casual", [])
    
    # Test 2: Professional with Skills
    test_template_gen("Professional", ["React", "TypeScript", "Redux"])
