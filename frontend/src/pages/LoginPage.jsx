// ============================================================
// pages/LoginPage.jsx — Page de connexion / inscription
// ============================================================

import { useState } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../utils/auth.jsx';
import { InputField } from '../components/InputField.jsx';


export function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode]       = useState('login'); // 'login' | 'register'
  const [pseudo, setPseudo]   = useState('');
  const [password, setPass]   = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!pseudo.trim() || !password) return;
    setError(''); setLoading(true);
    try {
      const data = await api.login(pseudo.trim(), password, mode);
      login(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.45)',
        border: '1px solid rgba(201,168,76,0.3)',
        borderRadius: 16,
        padding: '48px 40px',
        width: '100%',
        maxWidth: 400,
        backdropFilter: 'blur(4px)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontFamily: "'Cinzel', serif",
            fontSize: 42,
            color: '#c9a84c',
            letterSpacing: '0.15em',
            textShadow: '0 2px 12px rgba(201,168,76,0.4)',
          }}>
            ♠ BELOTE ♥
          </div>
          <div style={{ color: 'rgba(245,234,213,0.5)', fontSize: 13, marginTop: 4, letterSpacing: '0.3em' }}>
            JEU DE CARTES EN LIGNE
          </div>
        </div>

        {/* Onglets */}
        <div style={{ display: 'flex', marginBottom: 28, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(201,168,76,0.3)' }}>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{
                flex: 1, padding: '10px 0',
                background: mode === m ? 'rgba(201,168,76,0.2)' : 'transparent',
                border: 'none',
                color: mode === m ? '#c9a84c' : 'rgba(245,234,213,0.5)',
                fontFamily: "'Cinzel', serif",
                fontSize: 12,
                letterSpacing: '0.1em',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
              {m === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InputField label="Pseudo" value={pseudo} onChange={setPseudo} placeholder="Votre pseudo" />
          <InputField label="Mot de passe" value={password} onChange={setPass} placeholder="••••••••" type="password"
            onEnter={handleSubmit} />
        </div>

        {error && (
          <div style={{
            marginTop: 16, padding: '10px 14px',
            background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)',
            borderRadius: 8, color: '#e74c3c', fontSize: 13,
          }}>
            {error}
          </div>
        )}

        <button onClick={handleSubmit} disabled={loading}
          style={{
            width: '100%', marginTop: 24, padding: '14px 0',
            background: loading ? 'rgba(201,168,76,0.2)' : 'linear-gradient(135deg, #c9a84c, #e8c96d)',
            border: 'none', borderRadius: 8,
            color: loading ? '#c9a84c' : '#1a0a00',
            fontFamily: "'Cinzel', serif", fontSize: 14,
            letterSpacing: '0.15em', fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            boxShadow: loading ? 'none' : '0 4px 16px rgba(201,168,76,0.3)',
          }}>
          {loading ? '...' : (mode === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE')}
        </button>
      </div>
    </div>
  );
}

