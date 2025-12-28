Here is **`apps/backend-ai/AI_MODELS.md`**. This document provides a deep dive into the Python service, detailing the LLM strategies, prompt engineering, vector database schema, and parsing logic.

***

# AI Models & Engineering Documentation

This document details the internal workings of the **AI Service** (`apps/backend-ai`). It covers the Generative AI strategies, Prompt Engineering, Vector Database schema, and the specific logic used for Resume Parsing and Candidate Screening.

---

## 1. Core Technology Stack

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **LLM Provider** | Google Gemini (`gemini-2.5-pro`) | Reasoning, Parsing, Scoring, Content Generation. |
| **Embeddings** | `text-embedding-004` | Generating 768-dim vectors for semantic search. |
| **Vector DB** | Milvus (Docker) | Storing and querying candidate embeddings. |
| **PDF Processing** | `PyMuPDF` (Fitz) | High-speed text extraction from PDFs. |
| **OCR** | Gemini Vision | Fallback for image-based/scanned resumes. |
| **API Framework** | FastAPI | Async Python server handling requests from Node.js. |

---

## 2. Resume Parsing Strategy

The system employs a **Hybrid Parsing Strategy** to handle both digital-native PDFs and scanned images.

### Workflow
1.  **Ingestion:** File is streamed from Node.js to Python.
2.  **Fast Path (Text Extraction):**
    *   Uses `PyMuPDF` to extract raw text.
    *   **Check:** If extracted text length > 50 characters, proceed to LLM extraction.
3.  **Slow Path (Vision/OCR Fallback):**
    *   **Trigger:** If text length < 50 characters (indicates scanned image).
    *   **Action:** The PDF binary is uploaded directly to Gemini.
    *   **Prompt:** Uses a specific multimodal prompt to "Look at this document image and extract..."
4.  **Structured Output:** The raw text (or image context) is fed to Gemini to extract a JSON object adhering to the `CVParseResponse` schema.

### JSON Output Schema (`CVParseResponse`)
```json
{
  "skills": ["React", "TypeScript", "Node.js", "AWS"],
  "summary": "Senior Full Stack Engineer with 7 years of experience...",
  "experience_years": 7,
  "education_level": "Master's Degree",
  "raw_text": "..." // Preserved for downstream screening
}
```

---

## 3. Vectorization & Semantic Search

We use **Milvus** to enable conceptual searching (e.g., searching "Finance expert" finds candidates with "CPA" or "Audit experience").

### Embedding Model
*   **Model:** `models/text-embedding-004`
*   **Dimension:** 768
*   **Metric Type:** L2 (Euclidean Distance)

### Milvus Collection Schema (`candidate_profiles_v3`)

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `candidate_id` | `VARCHAR` (Primary) | UUID matching PostgreSQL Candidate ID. |
| `embedding` | `FLOAT_VECTOR(768)` | The semantic vector of the resume. |
| `location` | `VARCHAR` | Raw location string. |
| `experience` | `INT64` | Years of experience (used for scalar filtering). |
| `location_tokens` | `ARRAY<VARCHAR>` | Tokenized location for "contains" filtering. |

### Indexing Logic
1.  **Input:** Resume text is concatenated with the Candidate Name.
2.  **Process:** Text is sent to `genai.embed_content`.
3.  **Storage:** Vector + Metadata is upserted into Milvus.
    *   *Note:* We use `delete` + `insert` to simulate upsert behavior in Milvus to avoid duplicates.

---

## 4. Candidate Screening Logic

The screening endpoint (`/screen-candidate`) acts as an automated Technical Recruiter. It does not just "match keywords"; it evaluates context.

### The Persona
> "Act as a strict Technical Recruiter. Evaluate this resume against specific criteria."

### Inputs
1.  **Resume Text:** Extracted during parsing.
2.  **Job Description:** Full text from the Job opening.
3.  **Criteria:** A JSON object defining `requiredSkills`, `niceToHaves`, and `weights`.

### Scoring Algorithm
The LLM is instructed to calculate a score (0-100) based on the weighted criteria provided in the prompt.
*   **Hard Skills Match:** ~60-70% weight.
*   **Experience Match:** ~20-30% weight.
*   **Education/Other:** ~10% weight.

### JSON Output Schema (`ScreeningResponse`)
```json
{
  "match_score": 85,
  "red_flags": ["Short tenure at last 3 jobs"],
  "missing_critical_skills": ["Kubernetes"],
  "screening_summary": "Strong candidate for the React role, but lacks containerization experience.",
  "pros": ["Excellent communication", "Relevant industry experience"],
  "cons": ["High salary expectation implied", "No K8s"]
}
```

---

## 5. Interview Analysis

The `/analyze-interview` endpoint processes raw interviewer notes to generate structured feedback.

### Logic
1.  **Input:** Raw unstructured notes (e.g., "Good guy, knew React well, failed the algo question").
2.  **Context:** Job Title and Required Skills.
3.  **Task:** The LLM extracts:
    *   **Rating (1-10):** Calculated sentiment.
    *   **Pros/Cons:** extracted bullet points.
    *   **Skill Validation:** Did they demonstrate the specific required skills?

---

## 6. Error Handling & JSON Repair

LLMs sometimes output "chatty" JSON (e.g., "Here is your JSON: ```json ... ```").

To ensure API reliability, we use a custom **Robust JSON Parser** (`clean_and_parse_json` in `main.py`):
1.  **Fast Path:** Try `json.loads()` immediately.
2.  **Markdown Strip:** Regex remove ```json and ``` code blocks.
3.  **Brace Extraction:** Finds the first outer `{` and last `}` to isolate the JSON object from conversational filler.
4.  **Fallback:** Logs the raw error to `json_parse_error.log` for debugging.

---

## 7. Configuration Variables

| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | **Critical.** Access to Google's GenAI models. |
| `MILVUS_HOST` | Host address for vector DB (default: `localhost`). |
| `MILVUS_PORT` | Port for vector DB (default: `19530`). |

---

## 8. Future Improvements (Roadmap)

1.  **RAG for Chat:** Implement a "Chat with Candidate" feature using the vector store to answer questions like "Does this candidate have management experience?".
2.  **Fine-tuning:** Fine-tune a smaller model (e.g., Llama 3) for JSON extraction to reduce costs and latency compared to Gemini Pro.
3.  **Pipl/Clearbit Integration:** Enrich candidate profiles with external data before vectorization.