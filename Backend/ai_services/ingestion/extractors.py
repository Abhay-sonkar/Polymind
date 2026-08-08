"""
File text extraction — unchanged logic from your original main.py,
just moved here so main.py can stay a thin app-wiring file instead of
growing into a dumping ground as more routes get added.
"""

import io

from fastapi import HTTPException
from pypdf import PdfReader
from docx import Document


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
            detail="No extractable text found (file may be a scanned image PDF)",
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
