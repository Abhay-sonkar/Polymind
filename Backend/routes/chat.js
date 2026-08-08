import express from "express";
import { v4 as uuidv4 } from "uuid";
import Thread from "../models/Thread.js";
// ✅ FIX (Quality): import the new generateTitle named export
import getOpenAIAPIResponse, { generateTitle } from "../utils/openai.js";
import { getRagContext } from "../utils/ragService.js";
import authMiddleware from "../middlewares/auth.js";

const router = express.Router();

// ✅ Every route below requires a valid JWT
router.use(authMiddleware);

// Get all threads — only the logged-in user's threads
router.get("/thread", async (req, res) => {
    try {
        const threads = await Thread.find({ userId: req.user.userId })
            .sort({ updatedAt: -1 })
            .select("threadId title updatedAt");
        res.json(threads);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

// Get messages for a single thread — must belong to this user
router.get("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;

    try {
        const thread = await Thread.findOne({ threadId, userId: req.user.userId });

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.json(thread.messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

// Delete a thread — must belong to this user
router.delete("/thread/:threadId", async (req, res) => {
    const { threadId } = req.params;

    try {
        const deletedThread = await Thread.findOneAndDelete({
            threadId,
            userId: req.user.userId   // ✅ can't delete another user's thread
        });

        if (!deletedThread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.status(200).json({ success: "Thread deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

// Send a message — create thread if new, always scoped to this user
router.post("/chat", async (req, res) => {
    const { threadId, message } = req.body;

    if (!message || typeof message !== "string" || !message.trim()) {
        return res.status(400).json({ error: "Message is required" });
    }

    if (message.length > 4000) {
        return res.status(400).json({ error: "Message too long (max 4000 characters)" });
    }

    const resolvedThreadId = threadId || uuidv4();

    try {
        let thread = await Thread.findOne({ threadId: resolvedThreadId, userId: req.user.userId });

        if (!thread) {
            // ✅ FIX (Quality): Generate a proper title via a separate LLM call.
            // Before: title = message.substring(0, 50)  → "Can you help me write a cover..."
            // After:  title = await generateTitle(msg)  → "Writing a Cover Letter"
            // generateTitle uses max_tokens:20 so it's fast; falls back to substring on error.
            const title = await generateTitle(message.trim());

            thread = new Thread({
                threadId: resolvedThreadId,
                userId: req.user.userId,    // ✅ always from JWT, never from client body
                title,
                messages: [{ role: "user", content: message.trim() }]
            });
        } else {
            thread.messages.push({ role: "user", content: message.trim() });
        }

        // NEW: retrieve relevant chunks from this user's uploaded documents,
        // if any, before asking the LLM. Fails open — if the RAG service is
        // unreachable, ragContext is just "" and chat behaves as before.
        const { context: ragContext, sources } = await getRagContext(message.trim(), req.user.userId);

        const assistantReply = await getOpenAIAPIResponse(thread.messages, ragContext);

        if (!assistantReply) {
            return res.status(500).json({ error: "Failed to get response from AI" });
        }

        thread.messages.push({ role: "assistant", content: assistantReply });

        // ✅ FIX (Quality): Removed `thread.updatedAt = new Date()`.
        // Thread.js now uses `{ timestamps: true }` so Mongoose updates the
        // field automatically on every .save() — no risk of forgetting it.

        await thread.save();

        res.json({ reply: assistantReply, threadId: resolvedThreadId, sources });

    } catch (err) {
        console.error("Chat error:", err.message);

        let errorMessage = "Failed to process chat request";

        if (err.message.includes("401")) {
            errorMessage = "Invalid API key. Please check your .env file";
        } else if (err.message.includes("429")) {
            errorMessage = "API rate limit exceeded. Please try again later";
        } else if (err.message.includes("API")) {
            errorMessage = `API Error: ${err.message}`;
        }

        res.status(500).json({ error: errorMessage });
    }
});

export default router;
