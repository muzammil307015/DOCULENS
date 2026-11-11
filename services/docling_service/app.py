"""
DOCULENS — Official Docling Document Conversion Microservice
FastAPI service exposing Docling's AI-based document conversion pipeline.
Extracts structured paragraphs, headings, lists, tables with cells, page numbers,
and reading order from PDF, DOCX, PPTX, HTML, and images.
"""

import os
import re
import time
import logging
import tempfile
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("docling-service")

MAX_UPLOAD_BYTES = int(os.environ.get("DOCLING_MAX_UPLOAD_BYTES", 50 * 1024 * 1024))
ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("DOCLING_CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")
    if origin.strip()
]

app = FastAPI(
    title="DOCULENS Docling Document Extraction Service",
    version="2.1.0",
    description="High-fidelity structured document conversion using Docling"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS else ["*"],
    allow_credentials=bool(ALLOWED_ORIGINS and "*" not in ALLOWED_ORIGINS),
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# Attempt to import Docling
DOCLING_AVAILABLE = False
try:
    from docling.document_converter import DocumentConverter
    converter = DocumentConverter()
    DOCLING_AVAILABLE = True
    logger.info("Docling DocumentConverter successfully initialized.")
except Exception as e:
    logger.warning(f"Docling not directly importable in this environment: {e}")
    converter = None


class TableCell(BaseModel):
    row: int
    col: int
    text: str


class ExtractedTable(BaseModel):
    table_index: int
    page: Optional[int] = 1
    num_rows: int
    num_cols: int
    headers: List[str]
    rows: List[List[str]]
    markdown: str


class HeadingItem(BaseModel):
    title: str
    level: int = 1
    page: Optional[int] = 1


class PageItem(BaseModel):
    page_number: int
    text: str
    headings: Optional[List[str]] = []


class ExtractionResponse(BaseModel):
    status: str
    engine: str
    fileName: str
    fileSizeBytes: int
    pageCount: int
    wordCount: int
    tableCount: int
    fullText: str
    markdown: str
    pages: List[PageItem]
    tables: List[ExtractedTable]
    headings: List[HeadingItem]
    ocrApplied: bool
    qualityScore: int
    warnings: Optional[List[str]] = []
    processingTimeMs: int


def is_binary_payload(contents: bytes, filename: str) -> bool:
    """Detects binary signatures or extensions that must never be decoded directly as UTF-8."""
    if contents.startswith(b"%PDF"):
        return True
    if contents.startswith(b"PK\x03\x04"):
        return True
    if contents.startswith(b"\xd0\xcf\x11\xe0"):
        return True
    if contents.startswith(b"\x89PNG") or contents.startswith(b"\xff\xd8\xff") or contents.startswith(b"RIFF"):
        return True
    ext = os.path.splitext(filename.lower())[1]
    if ext in {".pdf", ".docx", ".doc", ".xlsx", ".xls", ".ods", ".pptx", ".ppt", ".odp", ".odt", ".png", ".jpg", ".jpeg", ".webp", ".tiff"}:
        return True
    # Check null byte ratio in first 4KB
    sample = contents[:4096]
    if b"\x00" in sample:
        return True
    return False


@app.get("/health")
def health_check():
    """Health check endpoint probe for DOCULENS backend"""
    return {
        "status": "ok",
        "service": "docling-microservice",
        "docling_available": DOCLING_AVAILABLE,
        "engine_version": "2.1.0",
        "supported_formats": [
            "pdf", "docx", "doc", "pptx", "xlsx", "html", "png", "jpeg", "webp", "tiff"
        ]
    }


@app.post("/v1/convert", response_model=ExtractionResponse)
async def convert_document(file: UploadFile = File(...)):
    """
    Converts document using Docling pipeline.
    Preserves document hierarchy, tables, lists, and page reading order.
    Never decodes binary documents as raw UTF-8 or reports false extraction success.
    """
    start_time = time.time()
    raw_filename = file.filename or "uploaded_document"
    safe_filename = re.sub(r"[^A-Za-z0-9._-]", "_", os.path.basename(raw_filename)) or "uploaded_document"
    ext = os.path.splitext(safe_filename.lower())[1]

    contents = await file.read()
    file_size = len(contents)

    if file_size == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty (0 bytes).")

    if file_size > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=413,
            detail=f"Uploaded file ({file_size} bytes) exceeds maximum limit of {MAX_UPLOAD_BYTES} bytes."
        )

    if DOCLING_AVAILABLE and converter:
        tmp_path: Optional[str] = None
        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix=f"_{safe_filename}") as tmp:
                tmp.write(contents)
                tmp_path = tmp.name

            conv_result = converter.convert(tmp_path)
            doc = conv_result.document
            markdown_content = doc.export_to_markdown() if hasattr(doc, "export_to_markdown") else ""
            full_text = doc.export_to_text() if hasattr(doc, "export_to_text") else markdown_content

            # Reject suspicious binary garbage
            if full_text.lstrip().startswith("%PDF-"):
                raise ValueError("Docling output contained raw PDF binary header instead of extracted text.")

            warnings: List[str] = []

            # Extract tables and map by page
            tables_data: List[ExtractedTable] = []
            page_text_buckets: dict[int, List[str]] = {}

            if hasattr(doc, "tables") and doc.tables:
                for t_idx, table in enumerate(doc.tables):
                    t_page = 1
                    if hasattr(table, "prov") and table.prov:
                        t_page = getattr(table.prov[0], "page_no", 1) or 1
                    elif hasattr(table, "page_no"):
                        t_page = getattr(table, "page_no", 1) or 1

                    headers: List[str] = []
                    rows: List[List[str]] = []
                    t_md = table.export_to_markdown() if hasattr(table, "export_to_markdown") else ""
                    try:
                        t_df = table.export_to_dataframe()
                        headers = [str(c) for c in t_df.columns]
                        rows = [[str(val) for val in row] for row in t_df.values.tolist()]
                    except Exception as t_err:
                        warnings.append(f"Table {t_idx + 1} dataframe conversion notice: {t_err}")

                    tables_data.append(ExtractedTable(
                        table_index=t_idx + 1,
                        page=t_page,
                        num_rows=len(rows),
                        num_cols=len(headers),
                        headers=headers,
                        rows=rows,
                        markdown=t_md
                    ))
                    if t_md:
                        page_text_buckets.setdefault(t_page, []).append(t_md)

            # Extract headings and group text items by page number
            headings_data: List[HeadingItem] = []
            if hasattr(doc, "texts") and doc.texts:
                for text_item in doc.texts:
                    item_text = getattr(text_item, "text", "").strip()
                    if not item_text:
                        continue
                    page_no = 1
                    if hasattr(text_item, "prov") and text_item.prov:
                        page_no = getattr(text_item.prov[0], "page_no", 1) or 1

                    page_text_buckets.setdefault(page_no, []).append(item_text)

                    label = str(getattr(text_item, "label", "")).lower()
                    if "header" in label or "title" in label or "heading" in label:
                        headings_data.append(HeadingItem(
                            title=item_text,
                            level=1 if "title" in label else 2,
                            page=page_no
                        ))

            # Determine total page count
            num_pages = 1
            if callable(getattr(doc, "num_pages", None)):
                num_pages = doc.num_pages() or 1
            elif hasattr(doc, "num_pages") and isinstance(getattr(doc, "num_pages"), int):
                num_pages = getattr(doc, "num_pages") or 1
            elif hasattr(doc, "pages") and doc.pages:
                num_pages = len(doc.pages)
            elif page_text_buckets:
                num_pages = max(page_text_buckets.keys())

            # Build per-page items without duplicating full_text across every page
            pages_data: List[PageItem] = []
            if page_text_buckets:
                for p_no in range(1, max(num_pages, max(page_text_buckets.keys())) + 1):
                    p_chunks = page_text_buckets.get(p_no, [])
                    p_text = "\n".join(p_chunks).strip()
                    if not p_text:
                        warnings.append(f"Page {p_no} yielded no selectable text items.")
                    pages_data.append(PageItem(
                        page_number=p_no,
                        text=p_text,
                        headings=[h.title for h in headings_data if h.page == p_no]
                    ))
            elif hasattr(doc, "pages") and doc.pages:
                raw_pages = doc.pages.values() if isinstance(doc.pages, dict) else doc.pages
                for idx, p_data in enumerate(raw_pages, start=1):
                    p_no = getattr(p_data, "page_no", idx) or idx
                    p_text = (getattr(p_data, "text", "") or "").strip()
                    pages_data.append(PageItem(
                        page_number=p_no,
                        text=p_text,
                        headings=[h.title for h in headings_data if h.page == p_no]
                    ))
                # If doc.pages had no direct .text attribute, assign full_text only if single page
                if all(not p.text for p in pages_data):
                    if len(pages_data) == 1:
                        pages_data[0].text = full_text
                    else:
                        warnings.append("Page-level provenance unavailable; text aggregated on page 1.")
                        pages_data[0].text = full_text
            else:
                pages_data.append(PageItem(
                    page_number=1,
                    text=full_text,
                    headings=[h.title for h in headings_data]
                ))

            if not full_text.strip() and any(p.text for p in pages_data):
                full_text = "\n\n".join(
                    f"--- [Page {p.page_number}] ---\n{p.text}" for p in pages_data if p.text
                )

            words = len(full_text.split())
            if words == 0:
                raise HTTPException(
                    status_code=422,
                    detail="Docling extracted 0 words from document. Document may be empty or unreadable."
                )

            is_image_format = ext in {".png", ".jpg", ".jpeg", ".webp", ".tiff"}
            ocr_applied = bool(
                is_image_format
                or getattr(conv_result, "ocr_applied", False)
            )

            quality_score = min(100, max(20, int((words / max(1, words + 50)) * 100)))
            elapsed = int((time.time() - start_time) * 1000)

            return ExtractionResponse(
                status="success",
                engine="docling-native",
                fileName=raw_filename,
                fileSizeBytes=file_size,
                pageCount=len(pages_data),
                wordCount=words,
                tableCount=len(tables_data),
                fullText=full_text,
                markdown=markdown_content or full_text,
                pages=pages_data,
                tables=tables_data,
                headings=headings_data,
                ocrApplied=ocr_applied,
                qualityScore=quality_score,
                warnings=warnings,
                processingTimeMs=elapsed
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Docling processing failed for {safe_filename}: {e}", exc_info=True)
            raise HTTPException(
                status_code=422,
                detail=f"Docling conversion failed: {str(e)}"
            )
        finally:
            if tmp_path and os.path.exists(tmp_path):
                try:
                    os.unlink(tmp_path)
                except OSError as cleanup_err:
                    logger.warning(f"Failed to remove temporary file {tmp_path}: {cleanup_err}")

    # When Docling library is not installed in the Python environment:
    # NEVER decode binary PDFs, Office archives, or images as UTF-8!
    if is_binary_payload(contents, safe_filename):
        raise HTTPException(
            status_code=503,
            detail=f"Docling library is not available in this Python runtime to convert binary format '{ext or 'binary'}'. Use native format parsers."
        )

    try:
        text_content = contents.decode("utf-8")
    except UnicodeDecodeError:
        raise HTTPException(
            status_code=422,
            detail="File is not valid UTF-8 text and Docling binary converter is unavailable."
        )

    if not text_content.strip():
        raise HTTPException(status_code=422, detail="Uploaded text file contains no readable text.")

    lines = [l.strip() for l in text_content.splitlines() if l.strip()]
    headings_data = []
    for line in lines[:20]:
        if line.startswith("# ") or (len(line) < 70 and (line.isupper() or line.endswith(":"))):
            headings_data.append(HeadingItem(
                title=line.lstrip("#").strip(),
                level=1,
                page=1
            ))

    words = len(text_content.split())
    elapsed = int((time.time() - start_time) * 1000)

    return ExtractionResponse(
        status="success",
        engine="docling-text-passthrough",
        fileName=raw_filename,
        fileSizeBytes=file_size,
        pageCount=1,
        wordCount=words,
        tableCount=0,
        fullText=text_content,
        markdown=text_content,
        pages=[PageItem(page_number=1, text=text_content, headings=[h.title for h in headings_data])],
        tables=[],
        headings=headings_data,
        ocrApplied=False,
        qualityScore=85 if words > 20 else 40,
        warnings=[],
        processingTimeMs=elapsed
    )


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("DOCLING_PORT", 8001))
    uvicorn.run(app, host="0.0.0.0", port=port)

