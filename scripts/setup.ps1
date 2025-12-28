# Setup Script for ATS AI Platform
# Run this from the project root (e.g., C:\apps\ats-ai-platform)

Write-Host "--- Starting ATS AI Platform Setup ---" -ForegroundColor Cyan

# 1. Directory Check (Safe to run if folders exist)
$directories = @(
    "apps/backend-core",
    "apps/backend-ai",
    "apps/frontend",
    "infra"
)

foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "Created directory: $dir" -ForegroundColor Green
    } else {
        # Silent or low-key message since you confirmed they exist
        Write-Host "Verifying: $dir exists... OK" -ForegroundColor Gray
    }
}

# 2. Define Docker Compose Content (The fix for the empty file)
$dockerComposeContent = @"
version: '3.8'

services:
  # 1. PostgreSQL (Database)
  postgres:
    container_name: ats_postgres
    image: postgres:15-alpine
    restart: always
    environment:
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: adminpassword
      POSTGRES_DB: ats_db
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - ats_network

  # 2. Redis (Cache/Queue)
  redis:
    container_name: ats_redis
    image: redis:7-alpine
    restart: always
    ports:
      - "6379:6379"
    networks:
      - ats_network

  # 3. MinIO (S3 Object Storage)
  minio:
    container_name: ats_minio
    image: minio/minio:latest
    restart: always
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000" # API
      - "9001:9001" # Console UI
    volumes:
      - minio_data:/data
    networks:
      - ats_network

  # 4. Etcd (Required by Milvus)
  etcd:
    container_name: milvus_etcd
    image: quay.io/coreos/etcd:v3.5.0
    environment:
      - ETCD_AUTO_COMPACTION_MODE=revision
      - ETCD_AUTO_COMPACTION_RETENTION=1000
      - ETCD_QUOTA_BACKEND_BYTES=4294967296
      - ETCD_SNAPSHOT_COUNT=50000
    volumes:
      - etcd_data:/etcd
    command: etcd -advertise-client-urls=http://127.0.0.1:2379 -listen-client-urls http://0.0.0.0:2379 --data-dir /etcd
    networks:
      - ats_network

  # 5. Milvus (Vector Database for AI)
  milvus:
    container_name: ats_milvus
    image: milvusdb/milvus:v2.3.0
    command: ["milvus", "run", "standalone"]
    environment:
      ETCD_ENDPOINTS: milvus_etcd:2379
      MINIO_ADDRESS: ats_minio:9000
      MINIO_ACCESS_KEY_ID: minioadmin
      MINIO_SECRET_ACCESS_KEY: minioadmin
      MINIO_BUCKET_NAME: milvus-bucket
    volumes:
      - milvus_data:/var/lib/milvus
    ports:
      - "19530:19530"
      - "9091:9091"
    depends_on:
      - "etcd"
      - "minio"
    networks:
      - ats_network

volumes:
  postgres_data:
  minio_data:
  etcd_data:
  milvus_data:

networks:
  ats_network:
    driver: bridge
"@

# 3. Write the Docker Compose file (Overwrites empty file)
$composeFilePath = "infra/docker-compose.yml"
Set-Content -Path $composeFilePath -Value $dockerComposeContent -Encoding UTF8
Write-Host "Configuration written to: $composeFilePath" -ForegroundColor Green

# 4. Start Docker Containers
if (Get-Command "docker" -ErrorAction SilentlyContinue) {
    Write-Host "Starting infrastructure..." -ForegroundColor Cyan
    docker compose -f $composeFilePath up -d
    
    Write-Host "`n--- Status Check ---" -ForegroundColor Cyan
    docker ps
} else {
    Write-Host "Error: Docker is not installed or not in PATH." -ForegroundColor Red
}