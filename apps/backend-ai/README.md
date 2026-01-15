# ATS AI Service

The dedicated AI microservice for the HT Recruitment OS. Built with **FastAPI** and **Python 3.9+**, it handles high-intensity tasks like PDF parsing, vector embedding generation, and LLM-based reasoning.

It communicates with **Google Gemini (2.5 Pro)** for intelligence and **Milvus** for vector storage.

## 🛠️ Tech Stack

*   **Framework**: FastAPI
*   **LLM**: Google Gemini 2.5 Pro (`google-generativeai`)
*   **Vector DB**: pymilvus (Client for Milvus)
*   **PDF Parsing**: PyMuPDF (fitz)
*   **Environment**: Python 3.9+

## 🧠 Core Capabilities

1.  **PDF Parsing & Extraction**: Converts resume PDFs into structured JSON (Contact info, Skills, Experience) using a hybrid approach (Text extraction + Gemini Vision fallback).
2.  **Vectorization**: Converts candidate skills and job descriptions into high-dimensional vectors for semantic search.
3.  **Scoring & Ranking**: AI-based suitability scoring of candidates against job descriptions.

## 🏗️ API Structure

*   **/candidates**: Endpoints for parsing resumes and managing candidate vectors.
*   **/jobs**: Vectorization of job descriptions for matching.
*   **/interviews**: Potential AI scheduling assistants (experimental).
*   **/health**: Service health check.

## 📂 Project Structure

The service is modularized for testability and separation of concerns:

*   **`app/routers/`**: FastAPI route handlers (Controller layer).
*   **`app/services/`**: Business logic and external integrations.
    *   `GeminiService`: Wrapper for Google Generative AI.
    *   `MilvusService`: Manages Vector DB connections and search.
    *   `PdfService`: Handles PDF text extraction and cleanup.
*   **`app/models/`**: Pydantic data schemas.

## 🏃‍♂️ Getting Started

### Prerequisites

*   Python 3.9+ installed
*   Milvus running (via Docker)
*   Google Gemini API Key

### Installation

```bash
# Navigate to backend-ai
cd apps/backend-ai

# Create Virtual Environment (Recommended)
python -m venv venv

# Activate Venv
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
```

### Configuration

Create a `.env` file from `.env.example`:

```ini
GEMINI_API_KEY="your_api_key_here"
MILVUS_HOST="localhost"
MILVUS_PORT="19530"
AI_SERVICE_PORT=8000
```

### Running the Service

```bash
# Using uvicorn directly
uvicorn main:app --reload --port 8000
```
or 
```bash
# Using Python script
python main.py
```

## 🔍 Visualizing Vectors

This service automatically manages a Milvus collection named `candidate_skill_embeddings` (or similar configured name). It uses an **IVF_FLAT** index for efficient similarity search.

## 🧪 Testing

There are currently no dedicated unit tests for the AI service. Validation is done via integration with the Backend Core.
