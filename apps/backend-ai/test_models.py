import google.generativeai as genai
import os
from dotenv import load_dotenv
import time

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=api_key)

models_to_test = [
    "gemini-2.0-pro-exp",
    "gemini-2.5-pro-preview-tts",
    "gemini-1.5-pro"
]

prompt = "Explain quantum computing in 1 sentence."

for model_name in models_to_test:
    print(f"Testing model: {model_name}...")
    try:
        model = genai.GenerativeModel(model_name)
        start = time.time()
        response = model.generate_content(prompt)
        duration = time.time() - start
        print(f"✅ Success ({duration:.2f}s): {response.text[:50]}...")
    except Exception as e:
        print(f"❌ Failed: {e}")
    print("-" * 20)
