Here is **`docs/DEPLOYMENT.md`**. This document covers how to take your local development setup and move it to a production environment, focusing on Dockerization and Reverse Proxy configuration to handle the multiple services.

***

# Deployment Guide

This guide outlines the strategy for deploying the **HT Recruitment OS** to a production environment (e.g., AWS EC2, DigitalOcean Droplet, or Kubernetes).

Since the system architecture consists of three distinct services plus infrastructure databases, **Docker Compose** is the recommended deployment strategy.

---

## 1. Production Architecture

In production, we do not expose ports `3001` or `8000` to the public. Instead, we use a **Reverse Proxy (Nginx)** to route traffic.

*   `ats.com` -> **Frontend** (Next.js)
*   `ats.com/api/*` -> **Backend Core** (NestJS)
*   *Internal Network Only* -> **Backend AI** (Python)
*   *Internal Network Only* -> **Databases** (Postgres, Redis, Milvus, Meili)

---

## 2. Dockerfile Configuration

You need to create `Dockerfile`s for each service if they don't exist.

### A. Backend Core (`apps/backend-core/Dockerfile`)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma
# Copy templates/assets if any
CMD ["npm", "run", "start:prod"]
```

### B. Backend AI (`apps/backend-ai/Dockerfile`)
```dockerfile
FROM python:3.10-slim
WORKDIR /app

# Install system dependencies for PyMuPDF/OCR if needed
RUN apt-get update && apt-get install -y build-essential libpoppler-cpp-dev

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Run with Gunicorn for production instead of Uvicorn directly
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### C. Frontend (`apps/frontend/Dockerfile`)
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# Set env var to ensure build optimizes for production
ENV NEXT_PUBLIC_API_URL=https://api.your-domain.com
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

CMD ["npm", "start"]
```

---

## 3. Production `docker-compose.prod.yml`

Create a production-specific compose file in the root directory.

```yaml
version: '3.8'

services:
  # --- INFRASTRUCTURE ---
  postgres:
    image: postgres:15
    volumes:
      - pg_data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_DB: ats_db
    restart: always

  redis:
    image: redis:alpine
    restart: always

  meilisearch:
    image: getmeili/meilisearch:v1.3
    environment:
      - MEILI_MASTER_KEY=${MEILI_KEY}
    volumes:
      - meili_data:/meili_data
    restart: always

  milvus:
    image: milvusdb/milvus:v2.3.0
    # (Simplified for brevity, Milvus usually requires etcd/minio as well)
    # Ensure you use the official Milvus docker-compose for full setup

  # --- APPLICATIONS ---
  backend-core:
    build: ./apps/backend-core
    environment:
      DATABASE_URL: postgres://${DB_USER}:${DB_PASS}@postgres:5432/ats_db
      REDIS_HOST: redis
      MEILI_HOST: http://meilisearch:7700
      AI_SERVICE_URL: http://backend-ai:8000
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - redis
    restart: always

  backend-ai:
    build: ./apps/backend-ai
    environment:
      GEMINI_API_KEY: ${GEMINI_API_KEY}
      MILVUS_HOST: milvus
    depends_on:
      - milvus
    restart: always

  frontend:
    build: ./apps/frontend
    restart: always

  # --- REVERSE PROXY ---
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - frontend
      - backend-core

volumes:
  pg_data:
  meili_data:
```

---

## 4. Nginx Configuration (`nginx.conf`)

This handles routing traffic to the correct container.

```nginx
server {
    listen 80;
    server_name ats.your-domain.com;

    # Frontend
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        # Rewrite /api/users -> /users if your NestJS app doesn't use a global prefix
        # Or configure NestJS to use /api prefix.
        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://backend-core:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    # Static Uploads (If using Local Storage driver)
    location /uploads/ {
        proxy_pass http://backend-core:3001/uploads/;
    }
}
```

---

## 5. Deployment Checklist

1.  **Database Migrations:**
    *   When the `backend-core` container starts for the first time, you must run migrations.
    *   You can automate this in the `CMD` or run it manually:
        ```bash
        docker-compose exec backend-core npx prisma migrate deploy
        ```

2.  **Milvus Dependencies:**
    *   Milvus is complex. In production, ensure you are running its dependencies (`etcd`, `minio`) as specified in the [Milvus Docs](https://milvus.io/docs/install_standalone-docker.md).

3.  **S3 Storage:**
    *   For production, switch `STORAGE_DRIVER=s3` in `backend-core` to avoid losing resumes if the container is rebuilt (unless you mount the `/uploads` volume).

4.  **SSL/HTTPS:**
    *   Use **Certbot** with Nginx to generate Let's Encrypt certificates. Do not serve this app over HTTP in production.

---

## 6. Scaling Strategy

*   **Horizontal Scaling:**
    *   **Frontend:** Stateless. Can run multiple replicas behind Nginx.
    *   **Backend Core:** Stateless (mostly). Can run replicas, but ensure Redis is used for all Pub/Sub and Queueing.
    *   **Backend AI:** Stateless. Can run multiple replicas to handle heavy parsing loads.
*   **Vertical Scaling:**
    *   **Milvus & Postgres:** These are resource-intensive. Increase RAM/CPU for these containers first if search becomes slow.