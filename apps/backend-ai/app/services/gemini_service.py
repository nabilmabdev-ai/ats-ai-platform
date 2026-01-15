import google.generativeai as genai
import logging
from app.core.config import settings
from app.utils.json_parser import clean_and_parse_json

logger = logging.getLogger("uvicorn")

class GeminiService:
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            self.model_pro = genai.GenerativeModel('gemini-2.0-flash-exp') # Updated to latest fast model or use 1.5-pro
            # User preferences and original code used 2.5-pro and 2.5-flash
            self.model_pro = genai.GenerativeModel('gemini-2.5-pro') 
            self.model_flash = genai.GenerativeModel('gemini-2.5-flash')
            self.embedding_model = "models/text-embedding-004"
        else:
            logger.warning("GEMINI_API_KEY not set. AI features will fail.")

    def generate_json(self, prompt: str, schema=None):
        try:
            generation_config = genai.GenerationConfig(
                response_mime_type="application/json",
                # response_schema=schema, # Optional: passing schema object directly often helps
                max_output_tokens=8192,
                temperature=0.3
            )
            
            response = self.model_pro.generate_content(
                prompt, 
                generation_config=generation_config
            )
            return clean_and_parse_json(response.text)
        except Exception as e:
            logger.error(f"Gemini Generation Error: {e}")
            raise e

    def generate_with_vision(self, prompt: str, file_path: str, mime_type="application/pdf"):
        try:
            uploaded_file = genai.upload_file(file_path, mime_type=mime_type)
            response = self.model_flash.generate_content(
                [prompt, uploaded_file],
                generation_config=genai.GenerationConfig(
                    response_mime_type="application/json"
                )
            )
            return clean_and_parse_json(response.text)
        except Exception as e:
            logger.error(f"Gemini Vision Error: {e}")
            raise e

    def embed_text(self, text: str, task_type="retrieval_document", title=None):
        try:
            args = {
                "model": self.embedding_model,
                "content": text,
                "task_type": task_type
            }
            if title:
                args["title"] = title
            
            result = genai.embed_content(**args)
            return result['embedding']
        except Exception as e:
            logger.error(f"Embedding Error: {e}")
            raise e

gemini_service = GeminiService()
