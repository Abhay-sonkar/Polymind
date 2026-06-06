// src/components/Chat/MessageBubble.jsx
// Renders a single message. Role must be "user" or "assistant".

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

/* ── User message ──────────────────────────────────────────── */
export const UserMessage = ({ content }) => (
  <div className="pm-msg-user">
    <div className="pm-msg-user__bubble">{content}</div>
  </div>
);

/* ── AI message ────────────────────────────────────────────── */
// FIX M4: Previously used dangerouslySetInnerHTML={{ __html: content }} with
// no sanitisation. A model response containing <script> tags or inline event
// handlers (onerror, onload, etc.) would execute arbitrary JavaScript in the
// user's browser.
//
// Replaced with ReactMarkdown + rehype-highlight, which:
//   • Renders only Markdown syntax — never executes raw HTML/scripts.
//   • Gives proper code-block highlighting for technical responses.
//   • Both packages are already listed in Frontend/package.json.
export const AIMessage = ({ content }) => (
  <div className="pm-msg-ai">
    <div className="pm-msg-avatar" aria-label="PolyMind">PM</div>
    <div className="pm-msg-ai__body">
      <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
        {content}
      </ReactMarkdown>
    </div>
  </div>
);

/* ── Typing indicator ──────────────────────────────────────── */
export const TypingIndicator = () => (
  <div className="pm-msg-ai pm-typing">
    <div className="pm-msg-avatar" aria-label="PolyMind is typing">PM</div>
    <div className="pm-typing__dots" aria-label="Typing">
      <span className="pm-typing__dot" />
      <span className="pm-typing__dot" />
      <span className="pm-typing__dot" />
    </div>
  </div>
);

/* ── Auto-picker ───────────────────────────────────────────── */
/**
 * Pass the raw message object from your state.
 * role: "user" | "assistant"   (also accepts "u" / "a" for backwards-compat)
 * content: string
 */
const MessageBubble = ({ message }) => {
  const { role, content } = message;
  const isUser = role === 'user' || role === 'u';
  return isUser
    ? <UserMessage content={content} />
    : <AIMessage   content={content} />;
};

export default MessageBubble;