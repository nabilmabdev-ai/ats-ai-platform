
import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
print(f"API Key present: {bool(api_key)}")

if api_key:
    genai.configure(api_key=api_key)
    try:
        model = genai.GenerativeModel('gemini-2.5-pro')
        response = model.generate_content("Hello")
        print("Success!")
        print(response.text)
    except Exception as e:
        print(f"Error with gemini-2.5-pro: {e}")
        
    print("-" * 20)
    print("Trying gemini-1.5-pro...")
    try:
        model = genai.GenerativeModel('gemini-1.5-pro')
        response = model.generate_content("Hello")
        print("Success with 1.5-pro!")
        print(response.text)
    except Exception as e:
        print(f"Error with gemini-1.5-pro: {e}")
