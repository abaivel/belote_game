/**
 * BeloteGame.jsx — Composant React principal
 * Tapis de jeu Belote Multijoueur avec polling toutes les 2 secondes.
 *
 * Dépendances : React, Tailwind CSS (CDN ou build)
 * Usage : <BeloteGame apiUrl="/api.php" />
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// ─── Config ───────────────────────────────────────────────────────────────────
const API_URL      = '/api.php';
const POLL_INTERVAL = 2000;

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const SUIT_COLORS  = { hearts: '#e53e3e', diamonds: '#e53e3e', clubs: '#1a202c', spades: '#1a202c' };
const SUIT_LABELS  = { hearts: 'Cœur', diamonds: 'Carreau', clubs: 'Trèfle', spades: 'Pique' };
const RANK_DISPLAY = { J: 'V', Q: 'D', K: 'R', A: 'A', '10': '10', '9': '9', '8': '8', '7': '7' };
const POSITION_LABELS = { 0: 'Nord', 1: 'Est', 2: 'Sud', 3: 'Ouest' };
const TEAM_NS = [0, 2];
const TEAM_EO = [1, 3];

// ─── Hook API ─────────────────────────────────────────────────────────────────
function useApi() {
  const call = useCallback(async (action, body = {}) => {
    const isGet = !body || Object.keys(body).length === 0;
    const url = `${API_URL}?action=${action}`;
    const res = await fetch(isGet ? url : url, {
      method: isGet ? 'GET' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    isGet ? undefined : JSON.stringify(body),
    });
    return res.json();
  }, []);
  return call;
}

// ─── Composant Carte ──────────────────────────────────────────────────────────
function Card({ card, onClick, playable, small, faceDown, highlight }) {
  if (faceDown) {
    return (
      <div className={`card card-back ${small ? 'card-sm' : ''}`}
           style={{
             width: small ? 36 : 64, height: small ? 54 : 96,
             background: 'linear-gradient(135deg, #1a3a5c 25%, #0d2137 25%, #0d2137 50%, #1a3a5c 50%, #1a3a5c 75%, #0d2137 75%)',
             backgroundSize: '8px 8px',
             borderRadius: 6, border: '1px solid #2d5a8e',
             boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
           }} />
    );
  }

  if (!card) return null;

  const color = SUIT_COLORS[card.suit];
  const isPlayableCard = playable;

  return (
    <div
      onClick={isPlayableCard ? onClick : undefined}
      style={{
        width: small ? 36 : 64,
        height: small ? 54 : 96,
        background: '#fff',
        borderRadius: 6,
        border: highlight ? `2px solid #f6ad55` : isPlayableCard ? '2px solid #68d391' : '1px solid #cbd5e0',
        boxShadow: isPlayableCard
          ? '0 0 12px rgba(104,211,145,0.6), 0 4px 12px rgba(0,0,0,0.3)'
          : '0 2px 6px rgba(0,0,0,0.3)',
        cursor: isPlayableCard ? 'pointer' : 'default',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: small ? '2px 3px' : '4px 6px',
        transform: isPlayableCard ? 'translateY(-4px)' : 'none',
        transition: 'all 0.15s ease',
        userSelect: 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={e => { if (isPlayableCard) e.currentTarget.style.transform = 'translateY(-8px) scale(1.05)'; }}
      onMouseLeave={e => { if (isPlayableCard) e.currentTarget.style.transform = 'translateY(-4px)'; }}
    >
      <div style={{ color, fontWeight: 'bold', fontSize: small ? 10 : 14, lineHeight: 1 }}>
        {RANK_DISPLAY[card.rank] || card.rank}
        <span style={{ fontSize: small ? 8 : 11 }}>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
      <div style={{ color, fontSize: small ? 16 : 28, textAlign: 'center', lineHeight: 1 }}>
        {SUIT_SYMBOLS[card.suit]}
      </div>
      <div style={{ color, fontWeight: 'bold', fontSize: small ? 10 : 14, lineHeight: 1, transform: 'rotate(180deg)' }}>
        {RANK_DISPLAY[card.rank] || card.rank}
        <span style={{ fontSize: small ? 8 : 11 }}>{SUIT_SYMBOLS[card.suit]}</span>
      </div>
    </div>
  );
}

// ─── Tapis de jeu ─────────────────────────────────────────────────────────────
function GameTable({ gameState, myPosition, myHand, playableCards, onPlayCard, onBid }) {
  const { game, players } = gameState;
  const trick = game.current_trick || [];

  const getPlayer = pos => players.find(p => p.position === pos);

  const isMyTurn = game.current_turn === myPosition;
  const inBidding = game.status === 'bidding' || game.status === 'bidding2';

  const isPlayable = (card) => playableCards.some(c => c.suit === card.suit && c.rank === card.rank);
  const getTrickCard = pos => trick.find(c => c.player === pos);

  const teamLabel = pos => TEAM_NS.includes(pos) ? 'NS' : 'EO';
  const teamColor = pos => TEAM_NS.includes(pos) ? '#68d391' : '#63b3ed';

  return (
    <div style={{
      width: '100%', maxWidth: 900, margin: '0 auto',
      background: 'radial-gradient(ellipse at center, #1a6b3a 0%, #0f4a28 60%, #0a3020 100%)',
      borderRadius: 24,
      boxShadow: 'inset 0 0 80px rgba(0,0,0,0.5), 0 20px 60px rgba(0,0,0,0.8)',
      border: '8px solid #2d5016',
      outline: '3px solid #4a7c2a',
      position: 'relative',
      padding: 16,
      minHeight: 600,
    }}>

      {/* Score */}
      <div style={{
        position: 'absolute', top: 12, left: 12, right: 12,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10
      }}>
        <ScoreBadge label="Équipe N-S" score={game.score_ns} color="#68d391" />
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#f6e05e', fontWeight: 'bold', fontSize: 12 }}>Manche {game.current_round}</div>
          {game.trump_suit && (
            <div style={{
              background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '2px 10px',
              color: SUIT_COLORS[game.trump_suit], fontWeight: 'bold', fontSize: 16, marginTop: 2
            }}>
              Atout : {SUIT_SYMBOLS[game.trump_suit]}
            </div>
          )}
        </div>
        <ScoreBadge label="Équipe E-O" score={game.score_eo} color="#63b3ed" />
      </div>

      {/* NORD (position 0) */}
      <PlayerSlot
        player={getPlayer(0)} position={0} isTurn={game.current_turn === 0}
        myPosition={myPosition} trickCard={getTrickCard(0)} teamColor={teamColor(0)}
        handSize={myPosition === 0 ? 0 : 8}
        style={{ position: 'absolute', top: 56, left: '50%', transform: 'translateX(-50%)' }}
      />

      {/* EST (position 1) */}
      <PlayerSlot
        player={getPlayer(1)} position={1} isTurn={game.current_turn === 1}
        myPosition={myPosition} trickCard={getTrickCard(1)} teamColor={teamColor(1)}
        handSize={myPosition === 1 ? 0 : 8} horizontal
        style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* SUD (position 2) */}
      <PlayerSlot
        player={getPlayer(2)} position={2} isTurn={game.current_turn === 2}
        myPosition={myPosition} trickCard={getTrickCard(2)} teamColor={teamColor(2)}
        handSize={myPosition === 2 ? 0 : 8}
        style={{ position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)' }}
      />

      {/* OUEST (position 3) */}
      <PlayerSlot
        player={getPlayer(3)} position={3} isTurn={game.current_turn === 3}
        myPosition={myPosition} trickCard={getTrickCard(3)} teamColor={teamColor(3)}
        handSize={myPosition === 3 ? 0 : 8} horizontal
        style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)' }}
      />

      {/* Centre du tapis : pli en cours + carte retournée */}
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
        justifyContent: 'center', width: 280, zIndex: 5,
      }}>
        {trick.map((c, i) => (
          <div key={i} style={{ position: 'relative' }}>
            <Card card={c} small />
            <div style={{
              position: 'absolute', bottom: -14, left: '50%', transform: 'translateX(-50%)',
              fontSize: 9, color: '#a0aec0', whiteSpace: 'nowrap'
            }}>
              {POSITION_LABELS[c.player]}
            </div>
          </div>
        ))}
        {inBidding && game.turned_card && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#f6e05e', fontSize: 10, marginBottom: 4 }}>Retournée</div>
            <Card card={game.turned_card} highlight />
          </div>
        )}
      </div>

      {/* Zone d'enchères */}
      {inBidding && isMyTurn && (
        <BiddingPanel
          game={game} onBid={onBid}
          style={{ position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)', zIndex: 20 }}
        />
      )}
      {inBidding && !isMyTurn && (
        <div style={{
          position: 'absolute', bottom: 130, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.7)', borderRadius: 8, padding: '6px 16px',
          color: '#a0aec0', fontSize: 13, zIndex: 20
        }}>
          En attente des enchères de {getPlayer(game.current_turn)?.name}…
        </div>
      )}

      {/* Ma main */}
      <div style={{
        position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: '90%', zIndex: 15,
      }}>
        {myHand.map((card, i) => (
          <Card
            key={`${card.suit}-${card.rank}`}
            card={card}
            playable={game.status === 'playing' && isMyTurn && isPlayable(card)}
            onClick={() => onPlayCard(card)}
          />
        ))}
      </div>

      {/* Fin de partie */}
      {game.status === 'game_end' && (
        <GameEndOverlay game={game} myPosition={myPosition} />
      )}
    </div>
  );
}

function ScoreBadge({ label, score, color }) {
  return (
    <div style={{
      background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 12px',
      border: `1px solid ${color}33`, textAlign: 'center'
    }}>
      <div style={{ color: '#a0aec0', fontSize: 10 }}>{label}</div>
      <div style={{ color, fontWeight: 'bold', fontSize: 20 }}>{score}</div>
      <div style={{ color: '#718096', fontSize: 9 }}>/ {501}</div>
    </div>
  );
}

function PlayerSlot({ player, position, isTurn, myPosition, trickCard, teamColor, handSize, horizontal, style }) {
  const isMe = position === myPosition;
  if (!player) {
    return (
      <div style={{ ...style, textAlign: 'center' }}>
        <div style={{
          background: 'rgba(0,0,0,0.4)', borderRadius: 8, padding: '4px 12px',
          color: '#4a5568', fontSize: 12, border: '1px dashed #4a5568'
        }}>
          En attente…
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...style, textAlign: 'center', zIndex: 8 }}>
      <div style={{
        background: isTurn ? 'rgba(246,173,85,0.15)' : 'rgba(0,0,0,0.6)',
        border: `1px solid ${isTurn ? '#f6ad55' : teamColor + '44'}`,
        borderRadius: 8, padding: '3px 10px', marginBottom: 4,
        boxShadow: isTurn ? '0 0 12px rgba(246,173,85,0.4)' : 'none',
        transition: 'all 0.3s ease',
      }}>
        <div style={{ color: isTurn ? '#f6ad55' : '#e2e8f0', fontWeight: 'bold', fontSize: 12 }}>
          {isMe ? '★ ' : ''}{player.name}
        </div>
        <div style={{ color: teamColor, fontSize: 9 }}>{POSITION_LABELS[position]}</div>
      </div>
      {/* Cartes dos pour les adversaires */}
      {!isMe && handSize > 0 && (
        <div style={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 160 }}>
          {Array.from({ length: Math.min(handSize, 8) }).map((_, i) => (
            <Card key={i} faceDown small />
          ))}
        </div>
      )}
    </div>
  );
}

function BiddingPanel({ game, onBid, style }) {
  const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
  const turned = game.turned_card;
  const isBidding2 = game.status === 'bidding2';

  return (
    <div style={{
      ...style,
      background: 'rgba(0,0,0,0.85)', borderRadius: 12, padding: 16,
      border: '1px solid #f6ad55', boxShadow: '0 0 20px rgba(246,173,85,0.3)',
      textAlign: 'center', minWidth: 260,
    }}>
      <div style={{ color: '#f6e05e', fontWeight: 'bold', fontSize: 14, marginBottom: 10 }}>
        {isBidding2 ? '2e tour — Choisissez une couleur' : '1er tour — Prenez-vous ?'}
      </div>
      {!isBidding2 && turned && (
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginBottom: 12 }}>
          <button onClick={() => onBid('take')} style={btnStyle('#68d391')}>
            Prendre {SUIT_SYMBOLS[turned.suit]}
          </button>
          <button onClick={() => onBid('pass')} style={btnStyle('#fc8181')}>
            Passer
          </button>
        </div>
      )}
      {isBidding2 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 8 }}>
          {suits.filter(s => s !== turned?.suit).map(s => (
            <button key={s} onClick={() => onBid(s)} style={btnSuitStyle(s)}>
              {SUIT_SYMBOLS[s]} {SUIT_LABELS[s]}
            </button>
          ))}
          <button onClick={() => onBid('pass')} style={btnStyle('#fc8181')}>
            Passer
          </button>
        </div>
      )}
    </div>
  );
}

const btnStyle = (color) => ({
  background: `${color}22`, border: `1px solid ${color}`,
  color, borderRadius: 8, padding: '6px 16px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: 14, transition: 'all 0.15s',
});
const btnSuitStyle = (suit) => ({
  background: 'rgba(255,255,255,0.08)',
  border: `1px solid ${SUIT_COLORS[suit]}66`,
  color: SUIT_COLORS[suit] === '#e53e3e' ? '#fc8181' : '#e2e8f0',
  borderRadius: 8, padding: '6px 12px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: 15, transition: 'all 0.15s',
});

function GameEndOverlay({ game, myPosition }) {
  const myTeam = TEAM_NS.includes(myPosition) ? 'NS' : 'EO';
  const won = (myTeam === 'NS' && game.score_ns >= 501) || (myTeam === 'EO' && game.score_eo >= 501);
  return (
    <div style={{
      position: 'absolute', inset: 0, borderRadius: 16,
      background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', zIndex: 50,
    }}>
      <div style={{ fontSize: 56, marginBottom: 8 }}>{won ? '🏆' : '😔'}</div>
      <div style={{
        fontSize: 32, fontWeight: 'bold',
        color: won ? '#f6ad55' : '#fc8181', marginBottom: 8
      }}>
        {won ? 'Victoire !' : 'Défaite'}
      </div>
      <div style={{ color: '#e2e8f0', fontSize: 16 }}>
        N-S : {game.score_ns} pts — E-O : {game.score_eo} pts
      </div>
    </div>
  );
}

// ─── Lobby ────────────────────────────────────────────────────────────────────
function Lobby({ onGameJoined }) {
  const api = useApi();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [mode, setMode] = useState(null); // 'create' | 'join'
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return setError('Entrez votre prénom');
    setLoading(true); setError('');
    const res = await api('create_game', { name: name.trim() });
    setLoading(false);
    if (res.ok) onGameJoined(res.game_id, res.position, res.code);
    else setError(res.error || 'Erreur');
  };

  const handleJoin = async () => {
    if (!name.trim() || !code.trim()) return setError('Remplissez tous les champs');
    setLoading(true); setError('');
    const res = await api('join_game', { name: name.trim(), code: code.toUpperCase().trim() });
    setLoading(false);
    if (res.ok) onGameJoined(res.game_id, res.position);
    else setError(res.error || 'Erreur');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a3020 0%, #0d2137 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: 40,
        border: '1px solid #2d5016', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        width: '100%', maxWidth: 400, textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🃏</div>
        <h1 style={{ color: '#f6e05e', fontSize: 28, fontWeight: 'bold', margin: '0 0 4px' }}>
          Belote
        </h1>
        <p style={{ color: '#68d391', fontSize: 13, marginBottom: 28 }}>
          Multijoueur en ligne — 4 joueurs
        </p>

        <input
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Votre prénom"
          style={inputStyle}
          maxLength={32}
        />

        {!mode && (
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => setMode('create')} style={primaryBtn}>
              Créer une table
            </button>
            <button onClick={() => setMode('join')} style={secondaryBtn}>
              Rejoindre
            </button>
          </div>
        )}

        {mode === 'create' && (
          <div style={{ marginTop: 16 }}>
            <button onClick={handleCreate} disabled={loading} style={primaryBtn}>
              {loading ? '…' : 'Créer la partie'}
            </button>
            <button onClick={() => setMode(null)} style={{ ...secondaryBtn, marginTop: 8, width: '100%' }}>
              Retour
            </button>
          </div>
        )}

        {mode === 'join' && (
          <div style={{ marginTop: 16 }}>
            <input
              value={code} onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="Code de la table (ex: AB12CD)"
              style={{ ...inputStyle, marginTop: 8, letterSpacing: '0.2em', textTransform: 'uppercase' }}
              maxLength={8}
            />
            <button onClick={handleJoin} disabled={loading} style={{ ...primaryBtn, marginTop: 12 }}>
              {loading ? '…' : 'Rejoindre'}
            </button>
            <button onClick={() => setMode(null)} style={{ ...secondaryBtn, marginTop: 8, width: '100%' }}>
              Retour
            </button>
          </div>
        )}

        {error && (
          <div style={{
            marginTop: 12, background: 'rgba(252,129,129,0.15)',
            border: '1px solid #fc8181', borderRadius: 8,
            padding: '8px 12px', color: '#fc8181', fontSize: 13
          }}>
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle = {
  width: '100%', background: 'rgba(255,255,255,0.07)',
  border: '1px solid #4a5568', borderRadius: 8,
  padding: '10px 14px', color: '#e2e8f0', fontSize: 15,
  outline: 'none', boxSizing: 'border-box',
  fontFamily: "'Georgia', serif",
};
const primaryBtn = {
  flex: 1, background: 'linear-gradient(135deg, #276749, #22543d)',
  border: '1px solid #68d391', color: '#68d391',
  borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
  fontWeight: 'bold', fontSize: 15, width: '100%',
};
const secondaryBtn = {
  flex: 1, background: 'rgba(255,255,255,0.05)',
  border: '1px solid #4a5568', color: '#a0aec0',
  borderRadius: 8, padding: '10px 20px', cursor: 'pointer',
  fontSize: 15, width: '100%',
};

// ─── Salle d'attente ──────────────────────────────────────────────────────────
function WaitingRoom({ gameCode, players, myPosition }) {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a3020 0%, #0d2137 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Georgia', serif",
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.7)', borderRadius: 16, padding: 40,
        border: '1px solid #2d5016', boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
        width: '100%', maxWidth: 420, textAlign: 'center',
      }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>🃏</div>
        <h2 style={{ color: '#f6e05e', fontSize: 20, marginBottom: 4 }}>Salle d'attente</h2>
        <div style={{
          background: 'rgba(246,230,94,0.1)', border: '1px solid #f6e05e',
          borderRadius: 8, padding: '8px 16px', marginBottom: 20,
          display: 'inline-block',
        }}>
          <span style={{ color: '#a0aec0', fontSize: 12 }}>Code d'invitation</span><br />
          <span style={{ color: '#f6e05e', fontWeight: 'bold', fontSize: 24, letterSpacing: '0.2em' }}>
            {gameCode}
          </span>
        </div>

        <div style={{ marginBottom: 20 }}>
          {[0, 1, 2, 3].map(pos => {
            const p = players.find(pl => pl.position === pos);
            const isNS = TEAM_NS.includes(pos);
            return (
              <div key={pos} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 12px', marginBottom: 6,
                background: p ? 'rgba(104,211,145,0.1)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${p ? (isNS ? '#68d391' : '#63b3ed') + '44' : '#2d3748'}`,
                borderRadius: 8,
              }}>
                <span style={{ color: isNS ? '#68d391' : '#63b3ed', fontSize: 12, width: 50 }}>
                  {POSITION_LABELS[pos]}
                </span>
                <span style={{ flex: 1, color: p ? '#e2e8f0' : '#4a5568', fontSize: 14 }}>
                  {p ? p.name : 'En attente…'}
                  {p && p.position === myPosition ? ' (vous)' : ''}
                </span>
                <span style={{ fontSize: 16 }}>{p ? '✅' : '⏳'}</span>
              </div>
            );
          })}
        </div>

        <div style={{ color: '#718096', fontSize: 12 }}>
          {players.length < 4
            ? `${players.length}/4 joueurs connectés — en attente…`
            : 'Distribution des cartes en cours…'}
        </div>
      </div>
    </div>
  );
}

// ─── App principale ───────────────────────────────────────────────────────────
export function BeloteGame() {
  const api = useApi();

  const [screen, setScreen]       = useState('lobby'); // lobby | waiting | game
  const [gameId, setGameId]       = useState(null);
  const [gameCode, setGameCode]   = useState('');
  const [myPosition, setMyPos]    = useState(null);
  const [gameState, setGameState] = useState(null);
  const [notification, setNotif]  = useState('');
  const pollRef = useRef(null);

  // Démarrer le polling
  const startPolling = useCallback((gid) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      const res = await api('state', {}).then ? 
        await fetch(`${API_URL}?action=state&game_id=${gid}`).then(r => r.json())
        : null;
      if (res?.ok) {
        setGameState(res);
        if (res.game.status !== 'waiting') setScreen('game');
      }
    }, POLL_INTERVAL);
  }, [api]);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const handleGameJoined = (gid, pos, code) => {
    setGameId(gid);
    setMyPos(pos);
    if (code) setGameCode(code);
    setScreen('waiting');
    startPolling(gid);
  };

  const handleBid = async (bid) => {
    const res = await api('bid', { game_id: gameId, bid });
    if (!res.ok) setNotif(res.error || 'Erreur');
  };

  const handlePlayCard = async (card) => {
    const res = await api('play_card', { game_id: gameId, suit: card.suit, rank: card.rank });
    if (!res.ok) setNotif(res.error || 'Cette carte n\'est pas jouable');
    else setNotif('');
  };

  if (screen === 'lobby') return <Lobby onGameJoined={handleGameJoined} />;

  if (screen === 'waiting' || !gameState) {
    const players = gameState?.players || [];
    return <WaitingRoom gameCode={gameCode} players={players} myPosition={myPosition} />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a1a0a 0%, #0d1a2a 100%)',
      padding: 16, fontFamily: "'Georgia', serif",
      display: 'flex', flexDirection: 'column', alignItems: 'center',
    }}>
      {/* Code de la table */}
      {gameCode && (
        <div style={{ color: '#4a5568', fontSize: 11, marginBottom: 8 }}>
          Code : <span style={{ color: '#f6e05e', fontWeight: 'bold' }}>{gameCode}</span>
        </div>
      )}

      <GameTable
        gameState={gameState}
        myPosition={myPosition}
        myHand={gameState.my_hand || []}
        playableCards={gameState.playable_cards || []}
        onPlayCard={handlePlayCard}
        onBid={handleBid}
      />

      {/* Notification d'erreur */}
      {notification && (
        <div onClick={() => setNotif('')} style={{
          marginTop: 12, background: 'rgba(252,129,129,0.15)',
          border: '1px solid #fc8181', borderRadius: 8,
          padding: '8px 16px', color: '#fc8181', fontSize: 13, cursor: 'pointer',
        }}>
          ⚠️ {notification}
        </div>
      )}
    </div>
  );
}