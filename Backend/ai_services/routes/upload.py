"""
POST /upload — the full ingestion pipeline.

Before: extract text and hand it back to the caller (your old main.py).
Now: extract -> chunk -> embed -> store in the vector DB, scoped to
the uploading user. This is the step that actually makes the document
retrievable later.
"""

import uuid

from fastapi import APIRouter, UploadFile, File, HTTPException, Header

from ingestion.extractors import (
    extract_text_from_pdf,
    extract_text_from_docx,
    extract_text_from_txt,
)
from ingestion.chunker import chunk_text
from embeddings.embedder import embed_texts
from vectorstore.store import add_chunks

router = APIRouter()


@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    x_user_id: str = Header(..., alias="X-User-Id"),
    # ^ Node backend forwards the authenticated user's Mongo _id here after
    # verifying the JWT — this Python service never sees or checks the JWT
    # itself, it trusts the Node layer that already sits in front of it.
):
    filename = file.filename or ""
    ext = filename.lower().rsplit(".", 1)[-1] if "." in filename else ""

    if ext not in ("pdf", "docx", "txt", "md"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: .{ext}. Use PDF, DOCX, TXT, or MD.",
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

    chunks = chunk_text(text)
    if not chunks:
        raise HTTPException(status_code=400, detail="No content to index after chunking")

    chunk_strings = [c.text for c in chunks]
    vectors = embed_texts(chunk_strings)

    document_id = str(uuid.uuid4())
    add_chunks(
        document_id=document_id,
        user_id=x_user_id,
        filename=filename,
        chunk_texts=chunk_strings,
        chunk_embeddings=vectors,
    )

    return {
        "document_id": document_id,
        "filename": filename,
        "char_count": len(text),
        "chunk_count": len(chunks),
        "status": "indexed",
    }
