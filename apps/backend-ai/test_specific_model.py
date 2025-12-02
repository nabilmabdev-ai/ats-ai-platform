import google.generativeai as genai
import os
from dotenv import load_dotenv
import time

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models_to_test = [
    "gemini-2.5-pro",
    "gemini-2.5-pro-preview-tts",
    "models/gemini-2.5-pro-preview-tts"
]

prompt = "Hello"

for model_name in models_to_test:
    print(f"Testing model: {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        start = time.time()
        # Set a short timeout to fail fast if it hangs
        response = model.generate_content(prompt) 
        duration = time.time() - start
        print(f"✅ Success ({duration:.2f}s)")
    except Exception as e:
        print(f"❌ Failed: {e}")
    print("-" * 20)
