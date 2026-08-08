"""
Retrieval — the piece that turns "user asked a question" into
"relevant chunks from their uploaded docs".

This is the module chat.js will call (via the /query route) before
sending a message to the LLM.
"""

from embeddings.embedder import embed_query
from vectorstore.store import query_similar

MIN_SIMILARITY = 0.3  # below this, a chunk is probably noise — tune after testing


def retrieve_context(query: str, user_id: str, top_k: int = 4) -> list[dict]:
    """
    Embed the user's question and fetch the top_k most similar chunks
    from their own uploaded documents. Filters out low-similarity
    matches so an unrelated document doesn't get stuffed into context
    just because it was the "least bad" of what's available.
    """
    query_vector = embed_query(query)
    hits = query_similar(query_vector, user_id=user_id, top_k=top_k)
    return [h for h in hits if h["similarity"] >= MIN_SIMILARITY]


def build_context_block(hits: list[dict]) -> str:
    """
    Format retrieved chunks into a block you can prepend to the LLM's
    system message. Keeping filename + chunk_index in there lets the
    model (and eventually your UI) cite the source.
    """
    if not hits:
        return ""

    parts = ["Relevant excerpts from the user's uploaded documents:\n"]
    for h in hits:
        parts.append(f"[Source: {h['filename']}, section {h['chunk_index']}]\n{h['text']}\n")

    return "\n".join(parts)
