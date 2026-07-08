// ============================================================
// components/Chat.jsx — Chat en cours de partie
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api.js';
import "../styles/Chat.css"

export function Chat({ gameId, messages, pseudo }) {
  const [text, setText]       = useState('');
  const [open, setOpen]       = useState(false);
  const [unread, setUnread]   = useState(0);
  const messagesEndRef = useRef(null);
  const prevMsgCount   = useRef(messages.length);

  useEffect(() => {
    if (open) {
      setUnread(0);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      prevMsgCount.current = messages.length;
    } else if (messages.length > prevMsgCount.current) {
      setUnread(u => u + messages.length - prevMsgCount.current);
      prevMsgCount.current = messages.length;
    }
  }, [messages, open]);

  const send = async () => {
    const content = text.trim();
    if (!content) return;
    setText('');
    try { await api.sendMessage(gameId, content); }
    catch (error) {
      console.error(error)
    }
  };

  return (
    <>
      {/* Bouton toggle */}
      <button className='button-open-chat' onClick={() => setOpen(o => !o)}>
        💬
        {unread > 0 && (
          <span>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panneau chat */}
      {open && (
        <div className='div-chat'>
          {/* Header */}
          <div className='div-chat-header'>
            <span>
              CHAT
            </span>
            <button onClick={() => setOpen(false)}>×</button>
          </div>

          {/* Messages */}
          <div className='div-chat-messages'>
            {messages.length === 0 && (
              <p>
                Aucun message pour l'instant...
              </p>
            )}
            {messages.map((m, i) => {
              const isMe = m.pseudo === pseudo;
              return (
                <div key={i} className='div-chat-message' style={{ alignSelf: isMe ? 'flex-end' : 'flex-start'}}>
                  {!isMe && <div className='div-chat-message-sender'>{m.pseudo}</div>}
                  <div className='div-chat-message-content' style={{
                    borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: isMe ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${isMe ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.1)'}`
                  }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className='div-input-message'>
            <input
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Message..."
            />
            <button onClick={send}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
