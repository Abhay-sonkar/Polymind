// src/components/Chat/ChatPage.jsx
import React, { useState } from 'react';
import Sidebar     from '../Sidebar/Sidebar';
import ChatHeader  from './ChatHeader';
import ChatMessages from './ChatMessages';
import ChatInput   from './ChatInput';

const ChatPage = ({
    threads        = [],
    activeThreadId,
    messages       = [],
    isStreaming    = false,
    activeModel    = 'Gemma 4',
    user           = {},
    onNewChat,
    onSelectThread,
    onDeleteThread,   // BUG FIX #2 (cont.): accept and forward delete handler
    onSend,
    onUpload,
    uploadStatus,
    onSettings,
    onLogout,
}) => {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [inputPrefill,     setInputPrefill]     = useState('');

    const activeThread = threads.find((t) => t.id === activeThreadId);
    const threadTitle  = activeThread?.title || 'New conversation';

    return (
        <div className="pm-layout">

            <Sidebar
                threads={threads}
                activeThreadId={activeThreadId}
                onNewChat={onNewChat}
                onSelectThread={onSelectThread}
                onDeleteThread={onDeleteThread}
                user={user}
                onSettings={onSettings}
                collapsed={sidebarCollapsed}
                onCollapse={() => setSidebarCollapsed((p) => !p)}
            />

            <main className="pm-main">
                <ChatHeader
                    title={threadTitle}
                    model={activeModel}
                    user={user}
                    onLogout={onLogout}
                />

                <ChatMessages
                    messages={messages}
                    isStreaming={isStreaming}
                    onChipClick={(chip) => setInputPrefill(chip)}
                />

                <ChatInput
                    onSend={onSend}
                    onUpload={onUpload}
                    uploadStatus={uploadStatus}
                    model={activeModel}
                    isStreaming={isStreaming}
                    prefill={inputPrefill}
                    onPrefillConsumed={() => setInputPrefill('')}
                />
            </main>

        </div>
    );
};

export default ChatPage;
