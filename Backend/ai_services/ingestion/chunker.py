"""
Text chunking for RAG.

Splits long text into overlapping chunks so each chunk is small enough
to embed meaningfully and retrieve precisely. Overlap prevents losing
context at chunk boundaries (a sentence cut in half at chunk N still
appears whole in chunk N+1).

This is a word-based splitter — simple, dependency-free, good enough
for a first working version. Swap for a tokenizer-based splitter
(tiktoken) later if you want chunk sizes to match the embedding
model's token limit exactly.
"""

from dataclasses import dataclass


@dataclass
class Chunk:
    text: str
    chunk_index: int
    char_start: int
    char_end: int


def chunk_text(
    text: str,
    chunk_size: int = 500,      # words per chunk
    chunk_overlap: int = 75,    # words repeated between consecutive chunks
) -> list[Chunk]:
    """
    Split `text` into overlapping word-based chunks.

    chunk_size=500 words ≈ 650-700 tokens for most English text —
    comfortably under the input limit of small embedding models.
    chunk_overlap=75 words (~15%) is a reasonable default; raise it
    for dense technical text, lower it for narrative text.
    """
    if chunk_size <= chunk_overlap:
        raise ValueError("chunk_size must be greater than chunk_overlap")

    words = text.split()
    if not words:
        return []

    chunks: list[Chunk] = []
    step = chunk_size - chunk_overlap
    idx = 0
    position = 0  # word index into `words`

    while position < len(words):
        window = words[position : position + chunk_size]
        chunk_str = " ".join(window)

        # Track approximate char offsets — useful later if you want to
        # highlight the exact source passage in the UI.
        char_start = len(" ".join(words[:position])) + (1 if position > 0 else 0)
        char_end = char_start + len(chunk_str)

        chunks.append(
            Chunk(
                text=chunk_str,
                chunk_index=idx,
                char_start=char_start,
                char_end=char_end,
            )
        )

        idx += 1
        position += step

        # Last window already reached the end — stop instead of emitting
        # a tiny near-duplicate final chunk.
        if position + chunk_size >= len(words) and position < len(words):
            window = words[position:]
            chunk_str = " ".join(window)
            char_start = len(" ".join(words[:position])) + 1
            chunks.append(
                Chunk(
                    text=chunk_str,
                    chunk_index=idx,
                    char_start=char_start,
                    char_end=char_start + len(chunk_str),
                )
            )
            break

    return chunks
