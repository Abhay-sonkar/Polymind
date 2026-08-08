"""
PolyMind RAG service — full pipeline: upload -> chunk -> embed -> store,
and query -> embed -> retrieve.

Run with: uvicorn main:app --reload --port 8001
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.upload import router as upload_router
from routes.query import router as query_router

app = FastAPI(title="PolyMind RAG Service")

app.add_middleware(
    CORSMiddleware,
    # Only the Node backend calls this service directly (server-to-server),
    # not the browser — so this can be tightened to just your backend's
    # own origin/IP once deployed, rather than left open to localhost only.
    allow_origins=["http://localhost:5173", "http://localhost:8080"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(query_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
