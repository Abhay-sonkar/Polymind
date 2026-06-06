// src/components/Chat/EmptyState.jsx

import React from 'react';

const CHIPS = [
  'Debug my code',
  'Explain a concept',
  'Review my project',
  'Help me study',
];

/**
 * @param {Function} onChipClick  - Called with the chip text string.
 *                                  Typically sets the input value and focuses it.
 */
const EmptyState = ({ onChipClick }) => (
  <div className="pm-empty">
    <span className="pm-empty__wordmark">PolyMind</span>
    <span className="pm-empty__subtitle">What can I help you with today?</span>
    <div className="pm-empty__chips">
      {CHIPS.map((chip) => (
        <button
          key={chip}
          className="pm-chip"
          onClick={() => onChipClick?.(chip)}
        >
          {chip}
        </button>
      ))}
    </div>
  </div>
);

export default EmptyState;
