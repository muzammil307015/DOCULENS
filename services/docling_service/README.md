# DOCULENS Docling Extraction Microservice

DOCULENS integrates the open-source **Docling** project (https://github.com/docling-project/docling) as its primary deep document conversion engine for high-fidelity extraction of PDF, DOCX, PPTX, HTML, and images.

## Architecture

1. **Primary Route**: When the Docling microservice is active at `DOCLING_SERVICE_URL` (default: `http://localhost:8001`), DOCULENS routes document conversions directly to Docling to preserve headings, tables with row/column cells, reading order, and OCR text.
2. **Automated Failover**: If the microservice is offline or warming up, DOCULENS seamlessly runs its built-in high-performance native extraction pipeline (pdfjs-dist, Mammoth, SheetJS, Tesseract OCR), verifying quality and preserving source locations.

## Deployment Options

### 1. Local Python Environment
```bash
cd services/docling_service
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
DOCLING_PORT=8001 python app.py
```

### 2. Docker Container
```bash
cd services/docling_service
docker build -t doculens-docling:latest .
docker run -d -p 8001:8001 --name docling-service doculens-docling:latest
```

### 3. Google Cloud Run / Docker Compose
Set the environment variable in your root `.env`:
```env
DOCLING_SERVICE_URL="http://localhost:8001"
```

## API Endpoints

- `GET /health` — Health check & status probe
- `POST /v1/convert` — Ingests binary document, returns structured JSON with markdown, page count, tables, and quality score.
