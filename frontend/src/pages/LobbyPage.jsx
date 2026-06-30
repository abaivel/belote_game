// ============================================================
// pages/LobbyPage.jsx — Lobby : créer / rejoindre une partie
// ============================================================

import { useState, useEffect } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../utils/auth.jsx';
import { ProfilePublic } from '../components/ProfilePublic.jsx';
import { DialogWindow } from '../components/DialogWindow.jsx';
import '../styles/LobbyPage.css';

//const SEAT_NAMES = ['Nord', 'Est', 'Sud', 'Ouest'];
const STATUS_LABELS = { waiting: 'En attente', bidding: 'Enchères', playing: 'En cours', finished: 'Terminée' };

export function LobbyPage({ onJoinGame }) {
  const { user, logout }  = useAuth();
  const [code, setCode]   = useState('');
  const [games, setGames] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  //const [tab, setTab]     = useState('join'); // 'join' | 'list'
  const [isProfileOpen, setIsProfileOpen] = useState(false)

  useEffect(() => {
    loadGames();
    const t = setInterval(loadGames, 5000);
    return () => clearInterval(t);
  }, []);

  const loadGames = async () => {
    try {
      const data = await api.listGames();
      if (data.code != null && data.code == 401){
        logout();
      }
      setGames(data.games);
    } catch (error) {
      console.error(error)
    }
  };

  const handleCreate = async () => {
    setError(''); setLoading(true);
    try {
      const data = await api.createGame();
      onJoinGame(data.gameId, data.code, data.seat, data.team);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleJoin = async (codeOverride) => {
    const c = (codeOverride || code).toUpperCase().trim();
    if (c.length !== 6) { setError('Code à 6 caractères requis'); return; }
    setError(''); setLoading(true);
    try {
      const data = await api.joinGame(c);
      onJoinGame(data.gameId, data.code, data.seat, data.team);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  const handleJoinAgain = async (game) => {
    var seat = game.players_ids.split(", ").indexOf(user.id.toString());
    onJoinGame(game.id, game.code, seat, (seat)%2 +1);
  };

  return (
    <>
      {isProfileOpen && (
        <DialogWindow setOpen={setIsProfileOpen}>
          <ProfilePublic setNewPseudo={(p)=>user.pseudo = p } userId={null} />
        </DialogWindow>
      )}
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: 600, marginBottom: 40, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 28, color: '#c9a84c', letterSpacing: '0.1em' }}>
          ♠ BELOTE
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'rgba(245,234,213,0.7)', fontSize: 14 }}>
            Bonjour, <strong style={{ color: '#e8c96d' }}>{user?.pseudo}</strong>
          </span>
          <span className="material-symbols-outlined" style={{color:"#e2c367",cursor: "pointer"}} onClick={()=>setIsProfileOpen(true)}>
            person
          </span>
          <button onClick={logout} style={btnStyle('ghost')}>Déconnexion</button>
        </div>
      </div>
      

      {/* Panel principal */}
      <div style={panelStyle}>
        {/* Créer une partie */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={sectionTitle}>Nouvelle partie</h2>
          <p style={{ color: 'rgba(245,234,213,0.6)', fontSize: 14, marginBottom: 16 }}>
            Créez une partie et partagez le code à vos amis.
          </p>
          <button onClick={handleCreate} disabled={loading} style={btnStyle('primary')}>
            {loading ? 'Création...' : '+ Créer une partie'}
          </button>
        </section>

        <div style={{ borderTop: '1px solid rgba(201,168,76,0.2)', margin: '0 -32px 32px', padding: '0' }} />

        {/* Rejoindre par code */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={sectionTitle}>Rejoindre par code</h2>
          <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
            <input
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              style={{
                flex: 1, padding: '11px 14px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(201,168,76,0.25)',
                borderRadius: 8, color: '#f5ead5',
                fontSize: 18, fontFamily: "'Cinzel', serif",
                letterSpacing: '0.3em', textAlign: 'center', outline: 'none',
                minWidth: '100%'
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(201,168,76,0.7)'}
              onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.25)'}
            />
            <button onClick={() => handleJoin()} disabled={loading} style={btnStyle('primary')}>
              Rejoindre
            </button>
          </div>
        </section>

        <div style={{ borderTop: '1px solid rgba(201,168,76,0.2)', margin: '0 -32px 28px' }} />

        {/* Liste des parties */}
        <section>
          <h2 style={sectionTitle}>Parties ouvertes</h2>
          {games.length === 0 ? (
            <p style={{ color: 'rgba(245,234,213,0.4)', fontSize: 14, marginTop: 12 }}>
              Aucune partie en cours. Créez-en une !
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {games.map(g => (
                <div key={g.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(201,168,76,0.15)',
                  borderRadius: 8,
                  flexWrap: 'wrap'
                }}>
                  <div>
                    <span style={{ fontFamily: "'Cinzel', serif", color: '#c9a84c', letterSpacing: '0.15em', fontSize: 16 }}>
                      {g.code}
                    </span>
                    <span style={{ marginLeft: 12, color: 'rgba(245,234,213,0.5)', fontSize: 13 }}>
                      {g.player_count}/4 joueurs
                    </span>
                    <span style={{ marginLeft: 8, color: 'rgba(245,234,213,0.4)', fontSize: 11 }}>
                      · {g.pseudos}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      fontSize: 11, padding: '3px 8px', borderRadius: 12,
                      background: g.status === 'waiting' ? 'rgba(46,213,115,0.15)' : 'rgba(255,165,0,0.15)',
                      color: g.status === 'waiting' ? '#2ed573' : '#ffa502',
                      border: `1px solid ${g.status === 'waiting' ? 'rgba(46,213,115,0.3)' : 'rgba(255,165,0,0.3)'}`,
                    }}>
                      {STATUS_LABELS[g.status]}
                    </span>
                    {g.status === 'waiting' && g.player_count < 4 ? (
                      <button onClick={() => handleJoin(g.code)} style={btnStyle('small')}>Rejoindre</button> ):
                      (g.players_ids.split(", ").includes(user.id.toString()) && <button onClick={() => handleJoinAgain(g)} style={btnStyle('small')}>Ouvrir</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div style={{ marginTop: 20, padding: '10px 14px', background: 'rgba(192,57,43,0.2)', border: '1px solid rgba(192,57,43,0.4)', borderRadius: 8, color: '#e74c3c', fontSize: 13 }}>
            {error}
          </div>
        )}

      </div>
    </div>
    </>
  );
}

const panelStyle = {
  background: 'rgba(0,0,0,0.4)',
  border: '1px solid rgba(201,168,76,0.25)',
  borderRadius: 16,
  padding: '32px 32px',
  width: '100%',
  maxWidth: 600,
  backdropFilter: 'blur(4px)',
};

const sectionTitle = {
  fontFamily: "'Cinzel', serif",
  fontSize: 15,
  color: '#c9a84c',
  letterSpacing: '0.1em',
  marginBottom: 4,
};

function btnStyle(variant) {
  const base = {
    border: 'none', borderRadius: 8, cursor: 'pointer',
    fontFamily: "'Cinzel', serif", letterSpacing: '0.1em',
    transition: 'all 0.2s', whiteSpace: 'nowrap',
  };
  if (variant === 'primary') return {
    ...base, padding: '11px 22px', fontSize: 13,
    background: 'linear-gradient(135deg, #c9a84c, #e8c96d)',
    color: '#1a0a00', fontWeight: 700,
    boxShadow: '0 4px 12px rgba(201,168,76,0.25)',
  };
  if (variant === 'ghost') return {
    ...base, padding: '8px 16px', fontSize: 12,
    background: 'transparent',
    border: '1px solid rgba(201,168,76,0.3)',
    color: 'rgba(245,234,213,0.6)',
  };
  if (variant === 'small') return {
    ...base, padding: '6px 14px', fontSize: 11,
    background: 'rgba(201,168,76,0.15)',
    border: '1px solid rgba(201,168,76,0.3)',
    color: '#c9a84c',
  };
}
