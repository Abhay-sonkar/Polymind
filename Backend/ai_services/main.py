"""
PolyMind RAG service — Step 1: upload + text extraction.

Run with: uvicorn main:app --reload --port 8001
Test with: curl -F "file=@somefile.pdf" http://localhost:8001/upload
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pypdf import PdfReader
from docx import Document
import io

app = FastAPI(title="PolyMind RAG Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


def extract_text_from_pdf(file_bytes: bytes) -> str:
    reader = PdfReader(io.BytesIO(file_bytes))
    if reader.is_encrypted:
        raise HTTPException(status_code=400, detail="Encrypted PDFs are not supported")

    pages_text = []
    for page in reader.pages:
        text = page.extract_text() or ""
        pages_text.append(text)

    full_text = "\n".join(pages_text).strip()
    if not full_text:
        raise HTTPException(
            status_code=400,
            detail="No extractable text found (file may be a scanned image PDF)"
        )
    return full_text


def extract_text_from_docx(file_bytes: bytes) -> str:
    doc = Document(io.BytesIO(file_bytes))
    full_text = "\n".join(p.text for p in doc.paragraphs).strip()
    if not full_text:
        raise HTTPException(status_code=400, detail="No extractable text found in DOCX")
    return full_text


def extract_text_from_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8").strip()
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="File is not valid UTF-8 text")


@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    filename = file.filename or ""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext not in ("pdf", "docx", "txt", "md"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Use PDF, DOCX, TXT, or MD."
        )

    file_bytes = await file.read()
    if not file_bytes:
        raise HTTPException(status_code=400, detail="Uploaded file is empty")

    if ext == "pdf":
        text = extract_text_from_pdf(file_bytes)
    elif ext == "docx":
        text = extract_text_from_docx(file_bytes)
    else:  
        text = extract_text_from_txt(file_bytes)

    return {
        "filename": filename,
        "char_count": len(text),
        "word_count": len(text.split()),
        "preview": text[:500],
        "full_text": text,
    }