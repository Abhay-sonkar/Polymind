"""
POST /query — retrieval endpoint.

chat.js calls this BEFORE calling getOpenAIAPIResponse, and prepends
the returned context block to the system message. This is the step
that was completely missing before — without it, "RAG" is just file
upload with no effect on the chat at all.
"""

from fastapi import APIRouter, Header
from pydantic import BaseModel

from retrieval.retriever import retrieve_context, build_context_block

router = APIRouter()


class QueryRequest(BaseModel):
    query: str
    top_k: int = 4


@router.post("/query")
async def query_documents(
    body: QueryRequest,
    x_user_id: str = Header(..., alias="X-User-Id"),
):
    hits = retrieve_context(body.query, user_id=x_user_id, top_k=body.top_k)
    context_block = build_context_block(hits)

    return {
        "context": context_block,
        "sources": [{"filename": h["filename"], "similarity": round(h["similarity"], 3)} for h in hits],
        "hit_count": len(hits),
    }
