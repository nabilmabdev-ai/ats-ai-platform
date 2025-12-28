import unittest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from main import app
import io

class TestOCRFallback(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    @patch('main.connections')
    @patch('main.Collection')
    @patch('main.utility')
    @patch('main.PdfReader')
    @patch('main.genai')
    def test_ocr_fallback_triggered(self, mock_genai, mock_pdf_reader, mock_utility, mock_collection, mock_connections):
        # Mock Milvus connection to avoid hang
        mock_connections.has_connection.return_value = True
        mock_utility.has_collection.return_value = True

        # 1. Mock PdfReader to return empty text
        mock_pdf_instance = MagicMock()
        mock_page = MagicMock()
        mock_page.extract_text.return_value = "" # Empty text
        mock_pdf_instance.pages = [mock_page]
        mock_pdf_reader.return_value = mock_pdf_instance

        # 2. Mock genai.upload_file
        mock_uploaded_file = MagicMock()
        mock_uploaded_file.name = "mock_file_uri"
        mock_genai.upload_file.return_value = mock_uploaded_file

        # 3. Mock model.generate_content
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"skills": ["OCR Skill"], "summary": "OCR Summary", "experience_years": 5, "education_level": "Bachelor"}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        # 4. Create a dummy PDF file
        file_content = b"%PDF-1.4 dummy content"
        files = {'file': ('test.pdf', file_content, 'application/pdf')}

        # 5. Make the request
        response = self.client.post("/parse-cv", files=files)

        # 6. Assertions
        self.assertEqual(response.status_code, 200)
        data = response.json()
        
        # Verify OCR fallback was used
        self.assertEqual(data['raw_text'], "OCR_EXTRACTED")
        self.assertEqual(data['summary'], "OCR Summary")
        
        # Verify upload_file was called
        mock_genai.upload_file.assert_called_once()
        
        # Verify generate_content was called with the file
        args, kwargs = mock_model.generate_content.call_args
        self.assertIn(mock_uploaded_file, args[0])

if __name__ == '__main__':
    unittest.main()
