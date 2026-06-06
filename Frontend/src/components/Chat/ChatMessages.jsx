// src/components/Chat/ChatMessages.jsx
// Scrollable message list. Drops in where your current messages container lives.

import React, { useEffect, useRef } from 'react';
import MessageBubble, { TypingIndicator } from './MessageBubble';
import EmptyState from './EmptyState';

/**
 * @param {Object[]}  messages     - Array of { role: "user"|"assistant", content: string }
 * @param {boolean}   isStreaming  - Show typing indicator while AI is responding
 * @param {Function}  onChipClick  - Passed through to EmptyState chips
 */
const ChatMessages = ({ messages = [], isStreaming = false, onChipClick }) => {
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (!messages.length && !isStreaming) {
    return (
      <div className="pm-messages">
        <EmptyState onChipClick={onChipClick} />
      </div>
    );
  }

  return (
    <div className="pm-messages" role="log" aria-live="polite" aria-label="Conversation">
      {messages.map((msg, i) => (
        // FIX m2: Using only the array index as a key causes React to reuse
        // the wrong DOM nodes if messages are ever prepended or removed mid-list.
        // A composite of index + role + a content prefix is stable for the
        // append-only pattern used here while remaining unique per position.
        <MessageBubble
          key={`${i}-${msg.role}-${String(msg.content).slice(0, 20)}`}
          message={msg}
        />
      ))}

      {isStreaming && <TypingIndicator />}

      {/* Invisible anchor for scroll-to-bottom */}
      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;