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
  onUpload,
  uploadStatus,
  model = 'V4 Flash',
  isStreaming = false,
  prefill = '',
  onPrefillConsumed,
}) => {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file && onUpload) onUpload(file);
    e.target.value = ''; // allow re-selecting the same file later
  };

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

            {/* Model selector pill — display-only for now; model switching isn't built yet */}
            <button
              className="pm-pill-btn"
              title={`Active model: ${model} (switching coming soon)`}
              aria-label={`Active model: ${model}`}
              disabled
            >
              <Cpu size={13} aria-hidden="true" />
              Smart · {model}
            </button>

            {/* Attach file */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt,.md"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <button
              className="pm-pill-btn pm-pill-btn--icon"
              title="Attach file"
              aria-label="Attach file"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadStatus?.state === 'uploading'}
            >
              <Paperclip size={13} aria-hidden="true" />
            </button>

            {/* Web search toggle — not implemented yet */}
            <button
              className="pm-pill-btn pm-pill-btn--icon"
              title="Web search (coming soon)"
              aria-label="Web search (coming soon)"
              disabled
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

      {uploadStatus?.state === 'uploading' && (
        <p className="pm-upload-status">Indexing {uploadStatus.filename}…</p>
      )}
      {uploadStatus?.state === 'done' && (
        <p className="pm-upload-status">
          {uploadStatus.filename} indexed ({uploadStatus.chunkCount} chunks) — ask me about it
        </p>
      )}
      {uploadStatus?.state === 'error' && (
        <p className="pm-upload-status pm-upload-status--error">
          Couldn't index {uploadStatus.filename}: {uploadStatus.message}
        </p>
      )}

      <p className="pm-disclaimer">
        PolyMind can make mistakes. Verify important information.
      </p>
    </div>
  );
};

export default ChatInput;
