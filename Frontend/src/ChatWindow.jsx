// NOTE: This component is no longer rendered by App.jsx — it has been
// superseded by the ChatPage / ChatMessages / ChatInput component tree.
// Kept here for reference only.
//
// FIX m4: Removed `import Chat from "./Chat.jsx"` — Chat.jsx does not exist
// anywhere in the project.  This would cause a Vite module-resolution error
// ("Failed to resolve import") and crash the build if ChatWindow were ever
// imported again.  Replaced with inline rendering of prevChats via the new
// MessageBubble component.

import "./ChatWindow.css";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import MessageBubble from "./components/Chat/MessageBubble.jsx";

function ChatWindow() {
    const {
        prompt, setPrompt,
        reply, setReply,
        currThreadId, setCurrThreadId,
        prevChats, setPrevChats,
        setNewChat,
        user, handleLogout
    } = useContext(MyContext);

    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen]   = useState(false);
    const [error, setError]     = useState(null);
    const dropdownRef           = useRef(null);

    // Reset state when switching threads
    useEffect(() => {
        setReply(null);
        setError(null);
        setLoading(false);
    }, [currThreadId]);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const authHeaders = () => ({
        "Content-Type": "application/json",
        "Authorization": `Bearer ${localStorage.getItem("token")}`
    });

    const getReply = async () => {
        if (!prompt.trim() || loading) return;

        setLoading(true);
        setError(null);
        setNewChat(false);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat`, {
                method: "POST",
                headers: authHeaders(),
                body: JSON.stringify({ message: prompt, threadId: currThreadId })
            });

            if (response.status === 401) { handleLogout(); return; }

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const res = await response.json();

            if (res.error) {
                setError(res.error);
            } else {
                if (res.threadId && res.threadId !== currThreadId) {
                    setCurrThreadId(res.threadId);
                }
                setReply(res.reply);
            }
        } catch (err) {
            console.error("API Error:", err);
            setError("Failed to connect to the server. Please check your connection.");
        }

        setLoading(false);
    };

    // Append exchange to prevChats after reply arrives
    useEffect(() => {
        if (prompt && reply) {
            setPrevChats(prev => ([
                ...prev,
                { role: "user", content: prompt },
                { role: "assistant", content: reply }
            ]));
        }
        setPrompt("");
    }, [reply]);

    return (
        <div className="chatWindow">
            <div className="navbar">
                <span>PolyMind <i className="fa-solid fa-chevron-down"></i></span>

                <div className="userIconDiv" onClick={() => setIsOpen(!isOpen)} ref={dropdownRef}>
                    <span className="userIcon"><i className="fa-solid fa-user"></i></span>

                    {isOpen && (
                        <div className="dropDown">
                            <div className="dropDownItem">
                                <i className="fa-solid fa-user"></i> {user?.username}
                            </div>
                            <div className="dropDownItem dropDownDisabled">
                                <i className="fa-solid fa-gear"></i> Settings <span className="comingSoon">soon</span>
                            </div>
                            <div className="dropDownItem dropDownDisabled">
                                <i className="fa-solid fa-cloud-arrow-up"></i> Upgrade plan <span className="comingSoon">soon</span>
                            </div>
                            <div className="dropDownItem" onClick={handleLogout}>
                                <i className="fa-solid fa-arrow-right-from-bracket"></i> Log out
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Inline message list — replaces the missing <Chat /> component */}
            <div className="chatMessages">
                {prevChats.map((msg, i) => (
                    <MessageBubble key={`${i}-${msg.role}`} message={msg} />
                ))}
            </div>

            {error && (
                <div className="errorMessage">
                    <p><i className="fa-solid fa-exclamation-circle"></i> {error}</p>
                </div>
            )}

            <ScaleLoader color="#339cff" loading={loading} />

            <div className="chatInput">
                <div className="inputBox">
                    <input
                        placeholder="Ask anything"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !loading ? getReply() : null}
                        disabled={loading}
                    />
                    <div
                        id="submit"
                        onClick={getReply}
                        style={{ opacity: loading ? 0.4 : 1, cursor: loading ? "not-allowed" : "pointer" }}
                    >
                        <i className="fa-solid fa-paper-plane"></i>
                    </div>
                </div>
                <p className="info">
                    PolyMind can make mistakes. Check important info.<br />
                    <span style={{ fontSize: "0.75rem", color: "#888" }}>Made by Abhay 💙</span>
                </p>
            </div>
        </div>
    );
}

export default ChatWindow;