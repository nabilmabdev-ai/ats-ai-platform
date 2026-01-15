import fitz  # PyMuPDF
import os
import shutil
import tempfile
import logging
from fastapi import UploadFile

logger = logging.getLogger("uvicorn")

class PdfService:
    def extract_text_from_upload(self, file: UploadFile) -> str:
        """
        Saves upload to temp, extracts text via PyMuPDF.
        """
        tmp_path = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
                shutil.copyfileobj(file.file, tmp)
                tmp_path = tmp.name
            
            return self.extract_text(tmp_path)
            
        except Exception as e:
            logger.error(f"PDF Upload Error: {e}")
            raise e
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except:
                    pass

    def extract_text(self, file_path: str) -> str:
        text = ""
        try:
            with fitz.open(file_path) as doc:
                for page in doc:
                    text += page.get_text() + "\n"
            return text
        except Exception as e:
            logger.error(f"PDF Extraction Error: {e}")
            return ""

pdf_service = PdfService()
