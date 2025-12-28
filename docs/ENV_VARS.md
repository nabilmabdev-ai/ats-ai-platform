Here is the \*\*`docs/ENV\_VARS.md`\*\* file. This is an extensive reference guide for every environment variable required to run the system.



\*\*\*



\# Environment Variables Reference



This document provides a comprehensive list of all environment variables required to configure the \*\*HT Recruitment OS\*\*.



The system is distributed across three services. You must create a `.env` file in the root of each application directory.



> \*\*⚠️ Security Warning:\*\* Never commit `.env` files to version control. These files contain sensitive API keys and database credentials.



---



\## 1. Backend Core (`apps/backend-core/.env`)



This is the main Node.js application. It orchestrates the database, authentication, and external integrations.



\### \*\*Core Infrastructure\*\*



| Variable | Description | Required | Default | Example |

| :--- | :--- | :--- | :--- | :--- |

| `PORT` | The port the NestJS server listens on. | No | `3001` | `3001` |

| `API\_URL` | The public URL of the backend. Used for generating links in emails (e.g., Invite links). | \*\*Yes\*\* | `http://localhost:3001` | `https://api.myapp.com` |

| `JWT\_SECRET` | Secret key used to sign and verify JSON Web Tokens for authentication. | \*\*Yes\*\* | | `long-random-string-here` |

| `AI\_SERVICE\_URL` | Internal URL to reach the Python AI Service. | \*\*Yes\*\* | | `http://localhost:8000` |



\### \*\*Database (PostgreSQL)\*\*



| Variable | Description | Required | Example |

| :--- | :--- | :--- | :--- |

| `DATABASE\_URL` | Connection string for PostgreSQL (Prisma). | \*\*Yes\*\* | `postgresql://user:pass@localhost:5432/ats\_db?schema=public` |



\### \*\*Message Queue (Redis)\*\*



| Variable | Description | Required | Default | Example |

| :--- | :--- | :--- | :--- | :--- |

| `REDIS\_HOST` | Hostname of the Redis server. | \*\*Yes\*\* | `localhost` | `127.0.0.1` |

| `REDIS\_PORT` | Port of the Redis server. | \*\*Yes\*\* | `6379` | `6379` |



\### \*\*Search Engine (MeiliSearch)\*\*



| Variable | Description | Required | Default | Example |

| :--- | :--- | :--- | :--- | :--- |

| `MEILI\_HOST` | URL of the MeiliSearch instance. | \*\*Yes\*\* | | `http://localhost:7700` |

| `MEILI\_KEY` | The Master Key for MeiliSearch. Must match the key used to start the Meili Docker container. | \*\*Yes\*\* | | `masterKey123` |



\### \*\*File Storage (Local vs S3)\*\*



| Variable | Description | Required | Options |

| :--- | :--- | :--- | :--- |

| `STORAGE\_DRIVER` | Determines where files (resumes, PDFs) are stored. | No | `local`, `s3` |



\*\*If `STORAGE\_DRIVER=s3`:\*\*



| Variable | Description |

| :--- | :--- |

| `AWS\_ACCESS\_KEY\_ID` | AWS IAM Access Key. |

| `AWS\_SECRET\_ACCESS\_KEY` | AWS IAM Secret Key. |

| `AWS\_REGION` | AWS Region (e.g., `us-east-1`). |

| `AWS\_S3\_BUCKET` | Name of the S3 bucket. |



\### \*\*Google Calendar Integration (Optional)\*\*



Used for Smart Scheduling to check interviewer availability.



| Variable | Description | Required |

| :--- | :--- | :--- |

| `GOOGLE\_CLIENT\_ID` | OAuth2 Client ID from Google Cloud Console. | No |

| `GOOGLE\_CLIENT\_SECRET` | OAuth2 Client Secret. | No |

| `GOOGLE\_REDIRECT\_URI` | Authorized redirect URI (e.g., `http://localhost:3001/auth/google/callback`). | No |



---



\## 2. Backend AI (`apps/backend-ai/.env`)



This is the Python/FastAPI service handling LLM logic and Vectorization.



\### \*\*Generative AI\*\*



| Variable | Description | Required | Notes |

| :--- | :--- | :--- | :--- |

| `GEMINI\_API\_KEY` | API Key for Google Gemini (AI Studio). | \*\*Yes\*\* | Used for Resume Parsing, Scoring, and Embeddings. |



\### \*\*Vector Database (Milvus)\*\*



| Variable | Description | Required | Default |

| :--- | :--- | :--- | :--- |

| `MILVUS\_HOST` | Hostname of the Milvus server. | \*\*Yes\*\* | `localhost` |

| `MILVUS\_PORT` | Port of the Milvus server. | \*\*Yes\*\* | `19530` |



---



\## 3. Frontend (`apps/frontend/.env.local`)



This is the Next.js application.



> \*\*Note:\*\* Variables prefixed with `NEXT\_PUBLIC\_` are exposed to the browser.



| Variable | Description | Required | Example |

| :--- | :--- | :--- | :--- |

| `NEXT\_PUBLIC\_API\_URL` | The public URL of the Backend Core API. Used by the React client to fetch data. | \*\*Yes\*\* | `http://localhost:3001` |



---



\## 🔑 How to Obtain Credentials



\### 1. Google Gemini API Key

\*   Go to \[Google AI Studio](https://aistudio.google.com/).

\*   Click "Get API Key".

\*   Create a key in a new or existing Google Cloud project.



\### 2. MeiliSearch Master Key

\*   This is self-hosted via Docker.

\*   You define this key yourself when starting the Docker container:

&nbsp;   ```bash

&nbsp;   docker run -e MEILI\_MASTER\_KEY="myMasterKey123" ...

&nbsp;   ```

\*   Ensure the `.env` in `backend-core` matches this key.



\### 3. Google OAuth (Calendar)

\*   Go to \[Google Cloud Console](https://console.cloud.google.com/).

\*   Create a Project -> APIs \& Services -> Credentials.

\*   Create \*\*OAuth 2.0 Client ID\*\*.

\*   Enable \*\*Google Calendar API\*\*.

\*   Add your redirect URI (e.g., `http://localhost:3001/auth/google/callback`).



\### 4. AWS S3 (Production Only)

\*   Go to AWS Console -> IAM.

\*   Create a User with `AmazonS3FullAccess` (or a specific policy for your bucket).

\*   Generate an Access Key pair.

\*   Create a Bucket in S3 and ensure CORS is configured if accessing directly from frontend (though this app proxies via backend).



---



\## 📝 Example Configuration (Local Development)



\### `apps/backend-core/.env`

```ini

PORT=3001

API\_URL="http://localhost:3001"

DATABASE\_URL="postgresql://postgres:postgres@localhost:5432/ats?schema=public"



REDIS\_HOST="localhost"

REDIS\_PORT=6379



JWT\_SECRET="dev-secret-do-not-use-in-prod"

AI\_SERVICE\_URL="http://localhost:8000"



MEILI\_HOST="http://localhost:7700"

MEILI\_KEY="masterKey"



STORAGE\_DRIVER="local"

```



\### `apps/backend-ai/.env`

```ini

GEMINI\_API\_KEY="AIzaSyD..."

MILVUS\_HOST="localhost"

MILVUS\_PORT=19530

```



\### `apps/frontend/.env.local`

```ini

NEXT\_PUBLIC\_API\_URL="http://localhost:3001"

```

