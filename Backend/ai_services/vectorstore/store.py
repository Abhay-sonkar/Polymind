"""
Vector store wrapper around ChromaDB.

Why Chroma over Pinecone/Qdrant Cloud for this project: it runs
in-process, persists to a local folder, and needs zero external
infra or API keys — matches your free-tier constraints. If this ever
needs to survive a Render free-tier redeploy (which wipes disk), swap
the PersistentClient path for Chroma's hosted offering or Qdrant Cloud's
free tier — the interface below (add / query) stays the same either way,
so nothing calling this module has to change.

Documents are namespaced by user_id so one user can never retrieve
another user's uploaded content — this mirrors the userId scoping
already enforced in your Thread model on the Node side.
"""

import chromadb
from chromadb.config import Settings

_CLIENT = None
_COLLECTION_NAME = "polymind_documents"


def _get_client() -> chromadb.ClientAPI:
    global _CLIENT
    if _CLIENT is None:
        _CLIENT = chromadb.PersistentClient(
            path="./chroma_data",  # gitignore this directory
            settings=Settings(anonymized_telemetry=False),
        )
    return _CLIENT


def _get_collection():
    client = _get_client()
    return client.get_or_create_collection(
        name=_COLLECTION_NAME,
        metadata={"hnsw:space": "cosine"},  # matches normalize_embeddings=True in embedder.py
    )


def add_chunks(
    document_id: str,
    user_id: str,
    filename: str,
    chunk_texts: list[str],
    chunk_embeddings: list[list[float]],
) -> None:
    """Store embedded chunks for one uploaded document."""
    if len(chunk_texts) != len(chunk_embeddings):
        raise ValueError("chunk_texts and chunk_embeddings must be the same length")

    collection = _get_collection()
    ids = [f"{document_id}:{i}" for i in range(len(chunk_texts))]
    metadatas = [
        {"document_id": document_id, "user_id": user_id, "filename": filename, "chunk_index": i}
        for i in range(len(chunk_texts))
    ]

    collection.add(
        ids=ids,
        embeddings=chunk_embeddings,
        documents=chunk_texts,
        metadatas=metadatas,
    )


def query_similar(
    query_embedding: list[float],
    user_id: str,
    top_k: int = 4,
) -> list[dict]:
    """
    Return the top_k chunks most similar to query_embedding, scoped to
    this user's own uploaded documents only.
    """
    collection = _get_collection()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        where={"user_id": user_id},
    )

    hits = []
    docs = results.get("documents", [[]])[0]
    metas = results.get("metadatas", [[]])[0]
    distances = results.get("distances", [[]])[0]

    for text, meta, distance in zip(docs, metas, distances):
        hits.append({
            "text": text,
            "filename": meta.get("filename"),
            "chunk_index": meta.get("chunk_index"),
            "similarity": 1 - distance,  # cosine distance -> similarity
        })

    return hits


def delete_document(document_id: str) -> None:
    """Remove all chunks belonging to one document (e.g. user deletes an upload)."""
    collection = _get_collection()
    collection.delete(where={"document_id": document_id})
