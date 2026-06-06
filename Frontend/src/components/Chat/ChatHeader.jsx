// src/components/Chat/ChatHeader.jsx
import React, { useState, useRef, useEffect } from 'react';

const ChatHeader = ({ title = 'New conversation', model = 'Gemma 4', user = {}, onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!menuOpen) return;
        const handleClickOutside = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [menuOpen]);

    const userInitial = user.name?.[0]?.toUpperCase() || 'U';

    // BUG FIX #3: the logout button was inside a parent div that also had an
    // onClick toggling the menu. Clicking "Log out" fired handleLogoutClick,
    // then the event bubbled up and immediately re-opened the menu. In the
    // time between the two handlers React would batch a setMenuOpen(false)
    // then setMenuOpen(true) — making the menu flash or stay open.
    // Fix: stopPropagation on the button click so the parent never sees it.
    const handleLogoutClick = (e) => {
        e.stopPropagation();
        setMenuOpen(false);
        onLogout?.();
    };

    return (
        <header className="pm-header">
            <div className="pm-header__left">
                <span className="pm-header__title" title={title}>{title}</span>
                <span className="pm-model-badge">{model}</span>
            </div>

            <div className="pm-header__avatar-wrap" ref={menuRef}>
                <div
                    className="pm-avatar pm-avatar--sm pm-avatar--header"
                    onClick={() => setMenuOpen((prev) => !prev)}
                    role="button"
                    tabIndex={0}
                    aria-label="User menu"
                    aria-expanded={menuOpen}
                    onKeyDown={(e) => e.key === 'Enter' && setMenuOpen((p) => !p)}
                >
                    {userInitial}
                </div>

                {menuOpen && (
                    <div className="pm-user-menu" role="menu">
                        <div className="pm-user-menu__info">
                            <div className="pm-user-menu__name">{user.name || 'User'}</div>
                            <div className="pm-user-menu__plan">{user.plan || 'Free plan'}</div>
                        </div>

                        <div className="pm-user-menu__divider" />

                        <button
                            className="pm-user-menu__item pm-user-menu__item--danger"
                            onClick={handleLogoutClick}
                            role="menuitem"
                        >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                                stroke="currentColor" strokeWidth="2"
                                strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                                <polyline points="16 17 21 12 16 7"/>
                                <line x1="21" y1="12" x2="9" y2="12"/>
                            </svg>
                            Log out
                        </button>
                    </div>
                )}
            </div>
        </header>
    );
};

export default ChatHeader;
