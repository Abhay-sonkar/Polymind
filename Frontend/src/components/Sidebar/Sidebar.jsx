// src/components/Sidebar/Sidebar.jsx
import React, { useState } from 'react';
import { Plus, PanelLeftClose, Settings, Trash2 } from 'lucide-react';

const GROUP_LABELS = {
    today:     'Today',
    yesterday: 'Yesterday',
    week:      'Previous 7 Days',
};

const Sidebar = ({
    threads = [],
    activeThreadId,
    onNewChat,
    onSelectThread,
    onDeleteThread,   // BUG FIX #2 (cont.): receive and wire delete handler
    user = {},
    onSettings,
    collapsed = false,
    onCollapse,
}) => {
    const [hoveredId, setHoveredId] = useState(null);

    const grouped = threads.reduce((acc, thread) => {
        const key = thread.group || 'week';
        if (!acc[key]) acc[key] = [];
        acc[key].push(thread);
        return acc;
    }, {});

    const userInitial = user.name?.[0]?.toUpperCase() || 'U';

    return (
        <aside className="pm-sidebar">

            {/* ── Brand ── */}
            <div className="pm-sidebar__brand">
                <div className="pm-sidebar__logo-group">
                    <div className="pm-sidebar__logo">P</div>
                    {!collapsed && <span className="pm-sidebar__name">PolyMind</span>}
                </div>
                <button
                    className="pm-icon-btn"
                    onClick={onCollapse}
                    aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                >
                    <PanelLeftClose size={16} />
                </button>
            </div>

            {/* ── New Conversation ── */}
            <button className="pm-new-chat" onClick={onNewChat}>
                <Plus size={16} aria-hidden="true" />
                {!collapsed && 'New conversation'}
            </button>

            {/* ── Thread List ── */}
            {!collapsed && (
                <div className="pm-thread-list" role="navigation" aria-label="Conversation history">
                    {threads.length === 0 && (
                        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.18)', textAlign: 'center', padding: '24px 12px', margin: 0 }}>
                            No conversations yet
                        </p>
                    )}

                    {Object.entries(GROUP_LABELS).map(([key, label]) => {
                        const group = grouped[key];
                        if (!group?.length) return null;

                        return (
                            <div key={key}>
                                <div className="pm-thread-group-label">{label}</div>

                                {group.map((thread) => {
                                    const id       = thread.id || thread.threadId;
                                    const isActive = activeThreadId === id;
                                    const isHovered = hoveredId === id;

                                    return (
                                        <div
                                            key={id}
                                            className={`pm-thread${isActive ? ' pm-thread--active' : ''}`}
                                            onClick={() => onSelectThread(id)}
                                            onMouseEnter={() => setHoveredId(id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => e.key === 'Enter' && onSelectThread(id)}
                                            aria-current={isActive ? 'true' : undefined}
                                        >
                                            <span
                                                className={`pm-thread__dot${isActive ? ' pm-thread__dot--active' : ''}`}
                                                aria-hidden="true"
                                            />
                                            <span className="pm-thread__title">{thread.title}</span>

                                            {/* BUG FIX #2: delete button shown on hover */}
                                            {isHovered && onDeleteThread && (
                                                <button
                                                    className="pm-thread__delete"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // don't trigger onSelectThread
                                                        onDeleteThread(id);
                                                    }}
                                                    aria-label="Delete conversation"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} />
                                                </button>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* ── User Bar ── */}
            <div className="pm-sidebar__user">
                <div className="pm-avatar pm-avatar--sm pm-avatar--user" aria-hidden="true">
                    {userInitial}
                </div>
                {!collapsed && (
                    <div className="pm-sidebar__user-info">
                        <div className="pm-sidebar__user-name">{user.name || 'User'}</div>
                        <div className="pm-sidebar__user-plan">{user.plan || 'Free plan'}</div>
                    </div>
                )}
                <button className="pm-icon-btn" onClick={onSettings} aria-label="Settings">
                    <Settings size={15} />
                </button>
            </div>

        </aside>
    );
};

export default Sidebar;
