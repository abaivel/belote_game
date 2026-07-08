// ============================================================
// pages/LoginPage.jsx — Page de connexion / inscription
// ============================================================

import { useState } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../utils/auth.jsx';
import { InputField } from '../components/InputField.jsx';
import "../styles/LoginPage.css"


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
    <div className='div-login-background'>
      <div className='div-login-container'>
        {/* Logo */}
        <div className='div-login-container-logo'>
          <div className='div-login-logo-title'>
            ♠ BELOTE ♥
          </div>
          <div className='div-login-logo-subtitle'>
            JEU DE CARTES EN LIGNE
          </div>
        </div>

        {/* Onglets */}
        <div className='div-login-tabs'>
          {['login', 'register'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError(''); }}
              style={{
                background: mode === m ? 'rgba(201,168,76,0.2)' : 'transparent',
                color: mode === m ? '#c9a84c' : 'rgba(245,234,213,0.5)',
              }}>
              {m === 'login' ? 'CONNEXION' : 'INSCRIPTION'}
            </button>
          ))}
        </div>

        {/* Formulaire */}
        <div className='div-login-form'>
          <InputField label="Pseudo" value={pseudo} onChange={setPseudo} placeholder="Votre pseudo" />
          <InputField label="Mot de passe" value={password} onChange={setPass} placeholder="••••••••" type="password"
            onEnter={handleSubmit} />
        </div>

        {error && (
          <div className='div-login-error'>
            {error}
          </div>
        )}

        <button className='button-login' onClick={handleSubmit} disabled={loading}>
          {loading ? '...' : (mode === 'login' ? 'SE CONNECTER' : 'CRÉER MON COMPTE')}
        </button>
      </div>
    </div>
  );
}

