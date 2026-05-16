// ============================================================
// components/Chat.jsx — Chat en cours de partie
// ============================================================

import { useState, useRef, useEffect } from 'react';
import { api } from '../utils/api.js';

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
    catch {}
  };

  return (
    <>
      {/* Bouton toggle */}
      <button onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 20, right: 20,
          width: 48, height: 48, borderRadius: '50%',
          background: 'linear-gradient(135deg,#c9a84c,#e8c96d)',
          border: 'none', cursor: 'pointer',
          fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          zIndex: 200,
        }}>
        💬
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 0, right: 0,
            width: 18, height: 18, borderRadius: '50%',
            background: '#c0392b', color: '#fff',
            fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: "'Cinzel', serif",
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Panneau chat */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 80, right: 20,
          width: 300, height: 380,
          background: 'rgba(5,20,10,0.97)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 12,
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 10px 40px rgba(0,0,0,0.7)',
          zIndex: 200,
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px', borderBottom: '1px solid rgba(201,168,76,0.2)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontFamily: "'Cinzel', serif", fontSize: 12, color: '#c9a84c', letterSpacing: '0.1em' }}>
              CHAT
            </span>
            <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(245,234,213,0.4)', cursor: 'pointer', fontSize: 16 }}>×</button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {messages.length === 0 && (
              <p style={{ color: 'rgba(245,234,213,0.3)', fontSize: 12, textAlign: 'center', marginTop: 20 }}>
                Aucun message pour l'instant...
              </p>
            )}
            {messages.map((m, i) => {
              const isMe = m.pseudo === pseudo;
              return (
                <div key={i} style={{ alignSelf: isMe ? 'flex-end' : 'flex-start', maxWidth: '85%' }}>
                  {!isMe && <div style={{ fontSize: 10, color: '#c9a84c', marginBottom: 2 }}>{m.pseudo}</div>}
                  <div style={{
                    padding: '7px 11px', borderRadius: isMe ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                    background: isMe ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.07)',
                    border: `1px solid ${isMe ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.1)'}`,
                    color: '#f5ead5', fontSize: 13,
                    wordBreak: 'break-word',
                  }}>
                    {m.content}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(201,168,76,0.2)', display: 'flex', gap: 8 }}>
            <input
              value={text} onChange={e => setText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="Message..."
              style={{
                flex: 1, padding: '8px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(201,168,76,0.2)',
                borderRadius: 8, color: '#f5ead5', fontSize: 13,
                outline: 'none',
              }}
            />
            <button onClick={send} style={{
              padding: '8px 12px', borderRadius: 8, border: 'none',
              background: 'rgba(201,168,76,0.2)', color: '#c9a84c',
              cursor: 'pointer', fontSize: 16,
            }}>➤</button>
          </div>
        </div>
      )}
    </>
  );
}
