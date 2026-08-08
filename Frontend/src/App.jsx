import './App.css';
import ChatPage from "./components/Chat/ChatPage.jsx";
import Auth    from "./Auth.jsx";
import { MyContext } from "./MyContext.jsx";
import { useState, useEffect, useCallback } from 'react';

function App() {
    const [prompt,      setPrompt]      = useState("");
    const [reply,       setReply]       = useState(null);
    const [currThreadId,setCurrThreadId]= useState(null);
    const [prevChats,   setPrevChats]   = useState([]);
    const [newChat,     setNewChat]     = useState(true);
    const [allThreads,  setAllThreads]  = useState([]);
    const [isStreaming, setIsStreaming] = useState(false);

    // ── Auth ─────────────────────────────────────────────────────
    const [user, setUser] = useState(() => {
        try {
            const saved = localStorage.getItem("user");
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    });

    const handleLogin  = (userData) => setUser(userData);

    const handleLogout = useCallback(() => {
        localStorage.clear();
        setUser(null);
        setCurrThreadId(null);
        setPrevChats([]);
        setAllThreads([]);
        setNewChat(true);
    }, []);

    // ── Fetch thread list ────────────────────────────────────────
    const fetchThreads = useCallback(async () => {
        const token = localStorage.getItem("token");
        if (!token) return;

        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/thread`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.status === 401) { handleLogout(); return; }
            if (!res.ok) return;

            const data = await res.json();

            const todayStart     = new Date().setHours(0, 0, 0, 0);
            const yesterdayStart = todayStart - 86_400_000;

            const normalized = data.map(({ _id, ...rest }) => {
                const ts    = new Date(rest.updatedAt || rest.createdAt).getTime();
                const group = ts >= todayStart     ? 'today'
                            : ts >= yesterdayStart ? 'yesterday'
                            : 'week';
                return { ...rest, id: rest.threadId, group };
            });

            setAllThreads(normalized);
        } catch (err) {
            console.error("Failed to fetch threads:", err);
        }
    }, [handleLogout]);

    useEffect(() => {
        if (user) fetchThreads();
    }, [user, fetchThreads]);

    if (!user) return <Auth onLogin={handleLogin} />;

    // ── Handlers ─────────────────────────────────────────────────

    const handleNewChat = () => {
        setCurrThreadId(null);
        setPrevChats([]);
        setNewChat(true);
    };

    const handleSelectThread = async (threadId) => {
        setCurrThreadId(threadId);
        setNewChat(false);
        setPrevChats([]);

        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/thread/${threadId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.status === 401) { handleLogout(); return; }
            if (!res.ok) throw new Error("Failed to load thread");
            setPrevChats(await res.json());
        } catch (err) {
            console.error("Failed to load thread:", err);
            setPrevChats([]);
        }
    };

    // BUG FIX #1: fetchThreads was only called when a brand-new thread was
    // created (data.threadId !== currThreadId). For every subsequent message
    // in an existing thread the sidebar never refreshed, so the thread order
    // stayed stale and newly created threads only appeared after a hard reload.
    // Fix: always call fetchThreads after any successful reply.
    const handleSend = async (text) => {
        if (!text.trim() || isStreaming) return;

        setPrevChats((prev) => [...prev, { role: "user", content: text.trim() }]);
        setIsStreaming(true);
        setNewChat(false);

        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization:  `Bearer ${token}`,
                },
                body: JSON.stringify({ message: text.trim(), threadId: currThreadId }),
            });

            if (response.status === 401) { handleLogout(); return; }

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Update currThreadId first (may be a new UUID if this was the first msg)
            if (data.threadId && data.threadId !== currThreadId) {
                setCurrThreadId(data.threadId);
            }

            setPrevChats((prev) => [...prev, { role: "assistant", content: data.reply, sources: data.sources }]);

            // Always refresh so sidebar order/titles stay current
            await fetchThreads();

        } catch (err) {
            console.error("Send error:", err);
            setPrevChats((prev) => [
                ...prev,
                { role: "assistant", content: `⚠️ ${err.message || "Something went wrong. Please try again."}`, isError: true },
            ]);
        } finally {
            setIsStreaming(false);
        }
    };

    // BUG FIX #2: delete thread was entirely missing from the new design —
    // a clear regression. App owns the delete logic, passes handler down via props.
    const handleDeleteThread = async (threadId) => {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(
                `${import.meta.env.VITE_API_URL}/api/thread/${threadId}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.status === 401) { handleLogout(); return; }

            // Optimistic removal — no need to re-fetch the full list
            setAllThreads((prev) => prev.filter((t) => t.id !== threadId));

            // If the deleted thread is the currently open one, go to new chat
            if (threadId === currThreadId) handleNewChat();

        } catch (err) {
            console.error("Failed to delete thread:", err);
        }
    };

    const handleSettings = () => console.info("Settings — not yet implemented");

    // NEW: called from ChatInput's paperclip button. Uploads the file to
    // Backend's /api/upload, which forwards it to the Python RAG service.
    // On success, drops a system-style note into the chat so the user gets
    // feedback that indexing happened — this endpoint does NOT trigger a
    // chat reply, it just makes the document retrievable for future messages.
    const [uploadStatus, setUploadStatus] = useState(null); // { state: 'uploading'|'done'|'error', filename }

    const handleUpload = async (file) => {
        const token = localStorage.getItem("token");
        setUploadStatus({ state: "uploading", filename: file.name });

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.status === 401) { handleLogout(); return; }

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Upload failed");

            setUploadStatus({ state: "done", filename: file.name, chunkCount: data.chunk_count });

        } catch (err) {
            console.error("Upload error:", err);
            setUploadStatus({ state: "error", filename: file.name, message: err.message });
        }
    };

    const providerValues = {
        prompt, setPrompt, reply, setReply,
        currThreadId, setCurrThreadId,
        newChat, setNewChat,
        prevChats, setPrevChats,
        allThreads, setAllThreads,
        isStreaming, setIsStreaming,
        user, handleLogout,
    };

    return (
        <div className="app">
            <MyContext.Provider value={providerValues}>
                <ChatPage
                    threads={allThreads}
                    activeThreadId={currThreadId}
                    messages={prevChats}
                    isStreaming={isStreaming}
                    activeModel="Gemma 4"
                    user={{ name: user.username || user.name || user.email, plan: "Free plan" }}
                    onNewChat={handleNewChat}
                    onSelectThread={handleSelectThread}
                    onDeleteThread={handleDeleteThread}
                    onSend={handleSend}
                    onUpload={handleUpload}
                    uploadStatus={uploadStatus}
                    onSettings={handleSettings}
                    onLogout={handleLogout}
                />
            </MyContext.Provider>
        </div>
    );
}

export default App;
