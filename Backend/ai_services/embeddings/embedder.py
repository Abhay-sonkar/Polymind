"""
Embedding generation for RAG.

Uses `sentence-transformers` running locally — deliberately NOT an API
call to OpenAI/OpenRouter. Reasons:
  1. You're already on free-tier LLM models for chat; embeddings are a
     separate cost you don't need to take on for a portfolio project.
  2. No API key to manage, no rate limits, works offline.
  3. `all-MiniLM-L6-v2` is small (~80MB), fast on CPU, and good enough
     for retrieval quality at this scale.

Trade-off to be upfront about: this model loads into memory once and
stays there — fine locally, but adds ~200-400MB RAM to whatever process
runs main.py. On a free Render instance (512MB RAM) this is tight
alongside FastAPI + pypdf + python-docx. Two ways out if you hit that
wall: (a) run ai_services on a separate free instance from the rest of
Backend, or (b) switch to a hosted embedding API once you're past the
portfolio stage.
"""

from functools import lru_cache

from sentence_transformers import SentenceTransformer

MODEL_NAME = "all-MiniLM-L6-v2"  # 384-dim output, ~80MB, fast on CPU


@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    # Loaded once per process (lru_cache), not once per request.
    return SentenceTransformer(MODEL_NAME)


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Embed a batch of chunk texts. Returns one vector per input string."""
    if not texts:
        return []
    model = _get_model()
    vectors = model.encode(texts, show_progress_bar=False, normalize_embeddings=True)
    return vectors.tolist()


def embed_query(query: str) -> list[float]:
    """Embed a single user question for similarity search against stored chunks."""
    return embed_texts([query])[0]
