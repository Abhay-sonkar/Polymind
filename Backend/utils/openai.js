import OpenAI from "openai";

const client = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:8080",
        "X-Title": "PolyMind",
    },
});

// ─────────────────────────────────────────────────────────────────────────────
// FREE MODEL IDs ON OPENROUTER (verify current list at openrouter.ai/models):
//
//   google/gemma-4-27b-it:free           ← Gemma 4 dense 31B (best quality)
//   google/gemma-4-26b-a4b-it:free       ← Gemma 4 MoE (fast, near-31B quality)
//   deepseek/deepseek-chat-v3-0324:free  ← reliable DeepSeek fallback
//   deepseek/deepseek-r1:free            ← reasoning model
//   meta-llama/llama-3.3-70b-instruct:free
//
// "404 No endpoints found" means no providers are serving that model's free
// tier right now — swap to any of the above IDs to fix it.
// ─────────────────────────────────────────────────────────────────────────────
const MODEL = "google/gemma-4-31b-it:free";   // ← only line you need to edit to swap models

const getOpenAIAPIResponse = async (messages) => {
    try {
        const completion = await client.chat.completions.create({
            model: MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are PolyMind, a helpful AI assistant.",
                },
                ...messages.map(m => ({
                    role: m.role,
                    content: m.content,
                }))
            ],
        });

        const text = completion.choices?.[0]?.message?.content;
        if (!text) {
            throw new Error("AI model returned an empty response");
        }
        return text;

    } catch (err) {
        console.error("OpenRouter API Error:", err?.message || err);
        throw new Error(err?.message || "OpenRouter API failed");
    }
};

// Generates a short thread title from the first user message.
// max_tokens:20 keeps it fast. Falls back to substring on any API failure.
export const generateTitle = async (firstMessage) => {
    try {
        const completion = await client.chat.completions.create({
            model: MODEL,
            max_completion_tokens: 20,
            messages: [{
                role: "user",
                content: `Write a concise 4-6 word title for a chat that starts with: "${firstMessage.substring(0, 200)}". Reply with ONLY the title, no quotes, no trailing punctuation.`
            }]
        });
        const title = completion.choices?.[0]?.message?.content?.trim();
        return title ? title.substring(0, 60) : firstMessage.trim().substring(0, 50);
    } catch {
        return firstMessage.trim().substring(0, 50);
    }
};

// BUG FIX: was `export default getOpenrouterAIAPIResponse`
// getOpenrouterAIAPIResponse does not exist — the function is named
// getOpenAIAPIResponse. The wrong name exported `undefined`, so
// chat.js received undefined instead of the function, and calling
// undefined(thread.messages) threw "TypeError: ... is not a function".
// That 500 triggered the frontend catch block which ran
// setPrevChats(prev => prev.slice(0, -1)) — silently deleting the
// user's message from the screen.
export default getOpenAIAPIResponse;