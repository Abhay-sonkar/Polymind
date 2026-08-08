// Backend/utils/ragService.js
//
// Thin client for the Python ai_services RAG microservice. Node never
// talks to the vector DB or embedding model directly — it just forwards
// the authenticated user's id and the question, and gets back a context
// block (or an empty string if the user has no relevant documents).
//
// Fails open: if the RAG service is down or slow, chat still works —
// it just runs without document context instead of erroring the whole
// request. RAG augments the assistant, it shouldn't be a single point
// of failure for basic chat.

const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:8001";
const RAG_TIMEOUT_MS = 4000;

export const getRagContext = async (query, userId) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), RAG_TIMEOUT_MS);

    try {
        const res = await fetch(`${RAG_SERVICE_URL}/query`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Id": userId,
            },
            body: JSON.stringify({ query, top_k: 4 }),
            signal: controller.signal,
        });

        if (!res.ok) {
            console.error("RAG service returned", res.status);
            return { context: "", sources: [] };
        }

        const data = await res.json();
        return { context: data.context || "", sources: data.sources || [] };

    } catch (err) {
        // Timeout, network error, or service down — log and continue
        // without RAG context rather than failing the chat request.
        console.error("RAG service unreachable:", err.message);
        return { context: "", sources: [] };

    } finally {
        clearTimeout(timeout);
    }
};

export const uploadDocument = async (fileBuffer, filename, mimetype, userId) => {
    const formData = new FormData();
    formData.append("file", new Blob([fileBuffer], { type: mimetype }), filename);

    const res = await fetch(`${RAG_SERVICE_URL}/upload`, {
        method: "POST",
        headers: { "X-User-Id": userId },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || "Document upload failed");
    }

    return res.json();
};
