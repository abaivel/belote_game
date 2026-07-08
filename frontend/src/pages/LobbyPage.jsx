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
    <div className='div-lobby'>
      {/* Header */}
      <div className='div-lobby-header'>
        <div className='div-lobby-header-logo'>
          ♠ BELOTE
        </div>
        <div className='div-lobby-header-user'>
          <span className='span-lobby-header-user-hello'>
            Bonjour, <strong>{user?.pseudo}</strong>
          </span>
          <span className="material-symbols-outlined span-lobby-header-user-icon-profile" onClick={()=>setIsProfileOpen(true)}>
            person
          </span>
          <button onClick={logout}>Déconnexion</button>
        </div>
      </div>
      

      {/* Panel principal */}
      <div className='div-lobby-principal-panel'>
        {/* Créer une partie */}
        <section className='section-lobby-create-game'>
          <h2>Nouvelle partie</h2>
          <p>
            Créez une partie et partagez le code à vos amis.
          </p>
          <button onClick={handleCreate} disabled={loading}>
            {loading ? 'Création...' : '+ Créer une partie'}
          </button>
        </section>

        <div className='div-lobby-separator'/>

        {/* Rejoindre par code */}
        <section className='section-lobby-join-code'>
          <h2>Rejoindre par code</h2>
          <div>
            <input
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="CODE"
              maxLength={6}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              onBlur={e => e.target.style.borderColor = 'rgba(201,168,76,0.25)'}
            />
            <button onClick={() => handleJoin()} disabled={loading}>
              Rejoindre
            </button>
          </div>
        </section>

        <div className='div-lobby-separator'/>

        {/* Liste des parties */}
        <section className='section-lobby-list-games'>
          <h2>Parties ouvertes</h2>
          {games.length === 0 ? (
            <p>
              Aucune partie en cours. Créez-en une !
            </p>
          ) : (
            <div className='div-lobby-list-games'>
              {games.map(g => (
                <div key={g.id} className='div-lobby-game'>
                  <div>
                    <span className='span-lobby-game-code'>
                      {g.code}
                    </span>
                    <span className='span-lobby-game-nb-players'>
                      {g.player_count}/4 joueurs
                    </span>
                    <span className='span-lobby-game-players-pseudos'>
                      · {g.pseudos}
                    </span>
                  </div>
                  <div>
                    <span className='span-lobby-game-status' style={{
                      background: g.status === 'waiting' ? 'rgba(46,213,115,0.15)' : 'rgba(255,165,0,0.15)',
                      color: g.status === 'waiting' ? '#2ed573' : '#ffa502',
                      border: `1px solid ${g.status === 'waiting' ? 'rgba(46,213,115,0.3)' : 'rgba(255,165,0,0.3)'}`,
                    }}>
                      {STATUS_LABELS[g.status]}
                    </span>
                    {g.status === 'waiting' && g.player_count < 4 ? (
                      <button className='button-lobby-game-join' onClick={() => handleJoin(g.code)}>Rejoindre</button> ):
                      (g.players_ids.split(", ").includes(user.id.toString()) && <button className='button-lobby-game-join' onClick={() => handleJoinAgain(g)}>Ouvrir</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {error && (
          <div className='div-lobby-error'>
            {error}
          </div>
        )}

      </div>
    </div>
    </>
  );
}
