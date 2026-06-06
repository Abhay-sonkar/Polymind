// src/components/Chat/ChatInput.jsx
// Two-row input: text field on top, toolbar + send on the bottom row.

import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Globe, Cpu } from 'lucide-react';

/**
 * @param {Function} onSend       - Called with the message string when user submits
 * @param {string}   model        - Display name for the active model, e.g. "V4 Flash"
 * @param {boolean}  isStreaming  - Disable input while the AI is responding
 * @param {string}   prefill      - Optional initial value (e.g. from empty-state chip click)
 * @param {Function} onPrefillConsumed - Clear prefill after it's been picked up
 */
const ChatInput = ({
  onSend,
  model = 'V4 Flash',
  isStreaming = false,
  prefill = '',
  onPrefillConsumed,
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  // Pick up the chip text from EmptyState
  useEffect(() => {
    if (prefill) {
      setValue(prefill);
      inputRef.current?.focus();
      onPrefillConsumed?.();
    }
  }, [prefill, onPrefillConsumed]);

  const canSend = value.trim().length > 0 && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value.trim());
    setValue('');
  };

  const handleKeyDown = (e) => {
    // Enter sends; Shift+Enter inserts newline (if you switch to <textarea>)
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="pm-input-area">
      <div className="pm-input-box">

        {/* ── Row 1: text ─────────────────────────── */}
        <div className="pm-input-row">
          <input
            ref={inputRef}
            className="pm-input-field"
            type="text"
            placeholder="Message PolyMind..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            aria-label="Message input"
            autoComplete="off"
          />
        </div>

        {/* ── Row 2: toolbar + send ────────────────── */}
        <div className="pm-input-toolbar">
          <div className="pm-toolbar-left">

            {/* Model selector pill */}
            <button
              className="pm-pill-btn"
              title="Change model"
              aria-label={`Active model: ${model}`}
            >
              <Cpu size={13} aria-hidden="true" />
              Smart · {model}
            </button>

            {/* Attach file */}
            <button
              className="pm-pill-btn pm-pill-btn--icon"
              title="Attach file"
              aria-label="Attach file"
            >
              <Paperclip size={13} aria-hidden="true" />
            </button>

            {/* Web search toggle */}
            <button
              className="pm-pill-btn pm-pill-btn--icon"
              title="Toggle web search"
              aria-label="Toggle web search"
            >
              <Globe size={13} aria-hidden="true" />
            </button>

          </div>

          {/* Send */}
          <button
            className="pm-send-btn"
            onClick={handleSend}
            disabled={!canSend}
            aria-label="Send message"
          >
            <ArrowUp size={16} aria-hidden="true" />
          </button>
        </div>

      </div>

      <p className="pm-disclaimer">
        PolyMind can make mistakes. Verify important information.
      </p>
    </div>
  );
};

export default ChatInput;
