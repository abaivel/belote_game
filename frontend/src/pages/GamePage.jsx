// ============================================================
// pages/GamePage.jsx — Table de jeu principale
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../utils/auth.jsx';
import { Card } from '../components/Card.jsx';
import { BiddingPanel } from '../components/BiddingPanel.jsx';
import { Chat } from '../components/Chat.jsx';
import '../styles/GamePage.css';
import { DialogWindow } from '../components/DialogWindow.jsx';
import { ProfilePublic } from '../components/ProfilePublic.jsx';
import { PlayersTeamDragAndDrop } from '../components/PlayersTeamDragAndDrop.jsx';

const SUIT_SYMBOLS = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' };
const SUIT_COLORS  = { hearts: '#c0392b', diamonds: '#c0392b', clubs: '#f5ead5', spades: '#f5ead5' };

// Positions fixes des 4 joueurs visuels (0=Nord haut, 1=Est droite, 2=Sud bas, 3=Ouest gauche)
const SEAT_POSITIONS = [
  { top: '10%',  left: '50%', transform: 'translateX(-50%)' },
  { top: '50%', right: '1%', transform: 'translateY(-50%)' },
  { bottom: '130px', left: '50%', transform: 'translateX(-50%)' },
  { top: '50%', left: '1%',  transform: 'translateY(-50%)' },
];

// Couleurs des deux équipes
const TEAM_COLORS = {
  1: { bg: 'rgba(52,152,219,0.15)', border: 'rgba(52,152,219,0.5)', text: '#5dade2', label: 'Éq.1' },
  2: { bg: 'rgba(46,213,115,0.12)', border: 'rgba(46,213,115,0.4)', text: '#2ed573', label: 'Éq.2' },
};

export function GamePage({ gameId, gameCode, mySeat, onLeave, onReload }) {
  const { user } = useAuth();
  const [state, setState]        = useState(null);
  const [bidLoading, setBidLoad] = useState(false);
  const [notification, setNotif] = useState(null);
  const [showLastTrick, setShowLT] = useState(false);
  const prevTrick  = useRef(-1);
  const pollingRef = useRef(null);
  const [idUserSelected, setIdUserSelected] = useState(null)

  // Siège visuel : notre joueur est toujours en position 2 (bas/Sud)
  // visualSeat = (physicalSeat - mySeat + 2 + 4) % 4
  //const toVisual = (phys) => (phys - mySeat + 2 + 4) % 4;
  // Inverse : physicalSeat = (visualSeat + mySeat - 2 + 4) % 4
  const toPhysical = (vis) => (vis + mySeat - 2 + 4) % 4;

  const fetchState = useCallback(async () => {
    try {
      const data = await api.gameState(gameId);
      if (data.code != null && data.code == 401){
        onLeave();
      }
      setState(data);
      onReload(data.game.id, data.game.code, data.myPlayer.seat, data.myPlayer.team)
      const trick = data.round.currentTrick;
      if (prevTrick.current !== -1 && prevTrick.current !== trick) {
        setShowLT(true);
        setTimeout(() => setShowLT(false), 2500);
      }
      prevTrick.current = trick;
    } catch (e) {
      showNotif(e.message, true);
    }
  }, [gameId]);

  useEffect(() => {
    fetchState();
    pollingRef.current = setInterval(fetchState, 2000);
    return () => clearInterval(pollingRef.current);
  }, [fetchState]);

  const handleLeave = async () => {
    if (!window.confirm('Quitter la partie ?')) return;
    try { await api.leaveGame(gameId); } catch (error) {console.error(error)}
    clearInterval(pollingRef.current);
    // Effacer la session sauvegardée
    localStorage.removeItem('belote_game');
    onLeave();
  };

  const handleBid = async (action, suit = null) => {
    setBidLoad(true);
    try {
      await api.bid(gameId, action, suit);
      await fetchState();
    } finally { setBidLoad(false); }
  };

  const handlePlayCard = async (suit, value) => {
    try {
      const result = await api.playCard(gameId, suit, value);
      if (result.belote === 'belote')   showNotif('Belote ! 💎');
      if (result.belote === 'rebelote') showNotif('Rebelote ! 💎💎');
      if (result.roundOver) {
        const s = result.scores;
        showNotif(`Fin de manche — Éq.1: ${s?.team1} pts | Éq.2: ${s?.team2} pts`);
      }
      await fetchState();
    } catch (e) {
      showNotif(e.message, true);
    }
  };

  const handleStartGame = async () => {
    try{
      await api.startGame(gameId)
    }catch (error){
      console.log(error)
    }
  }

  const showNotif = (msg, isError = false) => {
    setNotif({ msg, isError });
    setTimeout(() => setNotif(null), 3500);
  };

  // ---- Chargement initial ----
  if (!state) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Cinzel', serif", color: '#c9a84c', letterSpacing: '0.2em' }}>
          Chargement…
        </div>
      </div>
    );
  }

  const { game, round, players, myPlayer, myCards, trickCards, lastTrick, cardCounts, messages } = state;
  const isMyTurn   = myPlayer && round.currentPlayerId == myPlayer.id;
  const isBidding  = game.status === 'bidding';
  const isPlaying  = game.status === 'playing';
  const isWaiting  = game.status === 'waiting';
  const isFinished = game.status === 'finished';

  // Index joueurs par siège physique
  const playersBySeat = {};
  players.forEach(p => { playersBySeat[p.seat] = p; });

  // Cartes du pli courant ou dernier pli — indexées par siège PHYSIQUE
  const displayCards = (showLastTrick ? lastTrick : trickCards) || [];
  const trickBySeat  = {};
  displayCards.forEach(c => { trickBySeat[c.seat] = c; });

  // Qui a pris
  const takerPlayer = round.trumpPlayerId
    ? players.find(p => p.id == round.trumpPlayerId)
    : null;

  // Trouver le pseudo du joueur courant (pour affichage)
  //const currentPlayerName = players.find(p => p.id == round.currentPlayerId)?.pseudo || '?';

  return (
    <>
      {idUserSelected &&
        <DialogWindow setOpen={(o)=>{if (!o){setIdUserSelected(null);}}}>
          <ProfilePublic gameId={game.id} userId={idUserSelected}/>
        </DialogWindow>
      }
      <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>

        {/* ========== BARRE DU HAUT ========== */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '8px 16px',
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          borderBottom: '1px solid rgba(201,168,76,0.15)',
          flexWrap: 'wrap', gap: 8,
        }}>
          {/* Code */}
          <div style={{ fontFamily: "'Cinzel', serif" }}>
            <span style={{ color: 'rgba(201,168,76,0.45)', fontSize: 10, letterSpacing: '0.2em' }}>CODE </span>
            <span style={{ color: '#c9a84c', fontSize: 15, letterSpacing: '0.3em' }}>{gameCode}</span>
          </div>

          {/* Scores + atout + qui a pris */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <ScoreDisplay label="Équipe 1" score={game.team1Score} total={game.team1Total} color={TEAM_COLORS[1].text} />
              <span style={{ color: 'rgba(201,168,76,0.3)', fontFamily: "'Cinzel', serif", fontSize: 11 }}>VS</span>
              <ScoreDisplay label="Équipe 2" score={game.team2Score} total={game.team2Total} color={TEAM_COLORS[2].text} />
            </div>
            {/* Atout + preneur */}
            {round.trumpSuit && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 11 }}>
                <span style={{ color: SUIT_COLORS[round.trumpSuit], fontSize: 16 }}>{SUIT_SYMBOLS[round.trumpSuit]}</span>
                <span style={{ color: 'rgba(245,234,213,0.5)' }}>Atout</span>
                {takerPlayer && (
                  <span style={{ color: '#c9a84c' }}>
                    · Pris par <strong>{takerPlayer.pseudo}</strong>
                    <span style={{ color: TEAM_COLORS[takerPlayer.team]?.text, marginLeft: 4 }}>
                      ({TEAM_COLORS[takerPlayer.team]?.label})
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Manche + quitter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 10, color: 'rgba(245,234,213,0.35)', fontFamily: "'Cinzel', serif" }}>
              MANCHE {game.roundNumber}
            </span>
            <button onClick={handleLeave} style={{
              padding: '5px 11px', background: 'transparent',
              border: '1px solid rgba(245,234,213,0.2)', borderRadius: 6,
              color: 'rgba(245,234,213,0.5)', fontSize: 10,
              fontFamily: "'Cinzel', serif", cursor: 'pointer', letterSpacing: '0.1em',
            }}>QUITTER</button>
          </div>
        </div>

        {/* ========== TABLE ========== */}
        <div style={{ paddingTop: 70, paddingBottom: 130, minHeight: '100vh', position: 'relative' }}>

          {/* ---- 4 JOUEURS aux positions visuelles ---- */}
          {[0, 1, 2, 3].map(visualSeat => {
            const physSeat = toPhysical(visualSeat);
            const p = playersBySeat[physSeat];
            if (!p) return null;

            const isCurrentTurn = round.currentPlayerId == p.id;
            const isMe = myPlayer?.id === p.id;
            const cardCount = cardCounts[p.id] || 0;
            const teamColor = TEAM_COLORS[p.team] || TEAM_COLORS[1];
            const pos = SEAT_POSITIONS[visualSeat];
            const isHorizontal = visualSeat === 1 || visualSeat === 3;

            return (
              <div key={physSeat} style={{
                position: 'fixed', ...pos,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                zIndex: 10,
              }}>
                {/* Badge nom + équipe */}
                <div onClick={()=>setIdUserSelected(p.userId)} style={{
                  fontFamily: "'Cinzel', serif", fontSize: 11,
                  padding: '4px 10px', borderRadius: 20,
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: isCurrentTurn ? 'rgba(232,201,109,0.12)' : teamColor.bg,
                  border: `1px solid ${isCurrentTurn ? 'rgba(232,201,109,0.5)' : teamColor.border}`,
                  color: isCurrentTurn ? '#e8c96d' : teamColor.text,
                  transition: 'all 0.3s',
                  whiteSpace: 'nowrap',
                }}>
                  {isCurrentTurn && <span style={{ fontSize: 7 }}>●</span>}
                  {p.pseudo}
                  {isMe && <span style={{ fontSize: 9, opacity: 0.7 }}>(vous)</span>}
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 8,
                    background: teamColor.bg, border: `1px solid ${teamColor.border}`,
                    color: teamColor.text,
                  }}>{teamColor.label}</span>
                  <span style={{ fontSize: 8, color: p.is_connected ? '#2ed573' : '#ff4757' }}>
                    {p.is_connected ? '●' : '○'}
                  </span>
                </div>

                {/* Dos de cartes adverses */}
                {!isMe && cardCount > 0 && (
                  <div style={{ display: 'flex', flexDirection: isHorizontal ? "column" : "row" }}>
                    {Array.from({ length: cardCount }).map((_, i) => (
                      <div key={i} style={{
                        marginLeft: isHorizontal? 0 : (i === 0 ? 0 : -28),
                        marginBottom: !isHorizontal ? 0 : -50,
                        transform: isHorizontal
                          ? `rotate(90deg)`
                          : `rotate(${(i - Math.floor(cardCount / 2)) * 3}deg)`,
                        zIndex: i,
                      }}>
                        <Card faceDown small />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* ---- CARTES DU PLI — CROIX CENTRALE ---- */}
          {(isPlaying || showLastTrick) && (
            <div style={{
              position: 'fixed', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 240, height: 240,
              zIndex: 20, pointerEvents: 'none',
            }}>
              {/* Tapis */}
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                background: 'rgba(0,0,0,0.18)',
                border: '1px solid rgba(201,168,76,0.12)',
              }} />

              {showLastTrick && (
                <div style={{
                  position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
                  fontFamily: "'Cinzel', serif", fontSize: 9, color: 'rgba(201,168,76,0.6)',
                  letterSpacing: '0.15em', whiteSpace: 'nowrap',
                }}>DERNIER PLI</div>
              )}

              {/* Nord : le joueur en face de nous → physique toPhysical(0) = (mySeat+2)%4 */}
              {trickBySeat[toPhysical(0)] && (
                <div style={{
                  position: 'absolute',
                  top: 8, left: '50%', transform: 'translateX(-50%)',
                }}>
                  <Card suit={trickBySeat[toPhysical(0)].suit} value={trickBySeat[toPhysical(0)].value} small />
                </div>
              )}

              {/* Est : à notre droite → physique toPhysical(1) = (mySeat+3)%4 */}
              {trickBySeat[toPhysical(1)] && (
                <div style={{
                  position: 'absolute',
                  right: 8, top: '50%', transform: 'translateY(-50%)',
                }}>
                  <Card suit={trickBySeat[toPhysical(1)].suit} value={trickBySeat[toPhysical(1)].value} small />
                </div>
              )}

              {/* Sud : nous → physique mySeat = toPhysical(2) */}
              {trickBySeat[mySeat] && (
                <div style={{
                  position: 'absolute',
                  bottom: 8, left: '50%', transform: 'translateX(-50%)',
                }}>
                  <Card suit={trickBySeat[mySeat].suit} value={trickBySeat[mySeat].value} small />
                </div>
              )}

              {/* Ouest : à notre gauche → physique toPhysical(3) = (mySeat+1)%4 */}
              {trickBySeat[toPhysical(3)] && (
                <div style={{
                  position: 'absolute',
                  left: 8, top: '50%', transform: 'translateY(-50%)',
                }}>
                  <Card suit={trickBySeat[toPhysical(3)].suit} value={trickBySeat[toPhysical(3)].value} small />
                </div>
              )}
            </div>
          )}

          {/* ---- EN ATTENTE ---- */}
          {isWaiting && (
            <div style={{
              position: 'fixed', inset:0, margin:"auto", textAlign: "center", zIndex:50, width: "fit-content", height:"fit-content"
            }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, color: '#c9a84c', marginBottom: 10 }}>
                En attente des joueurs
              </div>
              <div style={{ color: 'rgba(245,234,213,0.55)', fontSize: 14, marginBottom: 20 }}>
                {players.length}/4 joueurs présents
              </div>
              <div style={{
                padding: '12px 28px', borderRadius: 10,
                background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
                marginBottom: 16,
              }}>
                <span style={{ color: 'rgba(245,234,213,0.5)', fontSize: 12 }}>Code : </span>
                <span style={{ fontFamily: "'Cinzel', serif", color: '#c9a84c', fontSize: 22, letterSpacing: '0.3em' }}>
                  {gameCode}
                </span>
              </div>
              
              <PlayersTeamDragAndDrop players={players} myUserId={user.id} onReload={onReload}/>
              {players.length==4 && 
                <button onClick={handleStartGame} style={{border: '1px solid rgba(201, 168, 76, 0.3)',
                                                          borderRadius: 8,
                                                          cursor: 'pointer',
                                                          fontFamily: 'Cinzel, serif',
                                                          letterSpacing: '0.1em',
                                                          transition: '0.2s',
                                                          whiteSpace: 'nowrap',
                                                          padding: '6px 14px',
                                                          fontSize: 11,
                                                          background: 'rgba(201, 168, 76, 0.15)',
                                                          color: 'rgb(201, 168, 76)',
                                                          marginTop:10}}>
                  Commencer la partie
                </button>
              }
            </div>
          )}

          {/* ---- ENCHÈRES ---- */}
          {isBidding && (
            <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column', justifyContent: 'center'}}>
              <BiddingPanel state={state} myPlayer={myPlayer} onBid={handleBid} loading={bidLoading} />
            </div>
          )}

          {/* ---- PARTIE TERMINÉE ---- */}
          {isFinished && (
            <div style={{
              position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
              background: 'rgba(5,20,10,0.97)', border: '1px solid rgba(201,168,76,0.5)',
              borderRadius: 16, padding: '40px 50px', textAlign: 'center', zIndex: 200,
            }}>
              <div style={{ fontFamily: "'Cinzel', serif", fontSize: 26, color: '#c9a84c', marginBottom: 24 }}>
                PARTIE TERMINÉE
              </div>
              <div style={{ display: 'flex', gap: 40, justifyContent: 'center', marginBottom: 32 }}>
                {[1, 2].map(team => (
                  <div key={team}>
                    <div style={{
                      fontSize: 11, letterSpacing: '0.1em', marginBottom: 4,
                      color: TEAM_COLORS[team].text, fontFamily: "'Cinzel', serif",
                    }}>ÉQUIPE {team}</div>
                    <div style={{
                      fontSize: 11, color: 'rgba(245,234,213,0.5)', marginBottom: 8,
                    }}>
                      {players.filter(p => p.team == team).map(p => p.pseudo).join(' & ')}
                    </div>
                    <div style={{
                      fontSize: 44, fontFamily: "'Cinzel', serif",
                      color: (team === 1 ? game.team1Total : game.team2Total) >=
                            (team === 1 ? game.team2Total : game.team1Total)
                        ? '#e8c96d' : 'rgba(245,234,213,0.5)',
                    }}>
                      {team === 1 ? game.team1Total : game.team2Total}
                    </div>
                  </div>
                ))}
              </div>
              <div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 18, color: '#c9a84c', marginBottom: 24 }}>
                  Statistiques
                </div>
                <p>Nombre de manches : {game.roundNumber}</p>
                <table className='table-game-final-stats'>
                  <tr>
                    <td className='td-empty'></td>
                    <th colSpan="2">ÉQUIPE 1</th>
                    <th colSpan="2">ÉQUIPE 2</th>
                  </tr>
                  <tr>
                    <td className="td-empty"></td>
                    {players.filter(p => p.team == 1).map(p =>
                      <th className="header" key={p.id}>{p.pseudo}</th>
                    )}
                    {players.filter(p => p.team == 2).map(p =>
                      <th className="header" key={p.id}>{p.pseudo}</th>
                    )}
                  </tr>

                  <tr>
                    <th>Nombre de parties prises</th>
                    <td>{players.filter(p => p.team == 1)[0].nb_rounds_taken}</td>
                    <td>{players.filter(p => p.team == 1)[1].nb_rounds_taken}</td>
                    <td>{players.filter(p => p.team == 2)[0].nb_rounds_taken}</td>
                    <td>{players.filter(p => p.team == 2)[1].nb_rounds_taken}</td>
                  </tr>

                  <tr>
                    <th>Nombre de parties prises gagnées</th>
                    <td>{players.filter(p => p.team == 1)[0].nb_rounds_taken_won}</td>
                    <td>{players.filter(p => p.team == 1)[1].nb_rounds_taken_won}</td>
                    <td>{players.filter(p => p.team == 2)[0].nb_rounds_taken_won}</td>
                    <td>{players.filter(p => p.team == 2)[1].nb_rounds_taken_won}</td>
                  </tr>

                  
                </table>
              </div>
              <button onClick={handleLeave} style={{
                padding: '12px 28px', background: 'linear-gradient(135deg,#c9a84c,#e8c96d)',
                border: 'none', borderRadius: 8, color: '#1a0a00',
                fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
                letterSpacing: '0.1em', cursor: 'pointer',
              }}>RETOUR AU LOBBY</button>
            </div>
          )}

          {/* ---- MAIN DU JOUEUR ---- */}
          {myPlayer && myCards && myCards.length > 0 && (
            <div style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              padding: '12px 0 18px',
              display: 'flex', justifyContent: 'center', alignItems: 'flex-end',
              background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%)',
              zIndex: 30,
            }}>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', flexWrap: "wrap" }}>
                {sortCards(myCards, round.trumpSuit).map((card, i, arr) => {
                  const canPlay = isMyTurn && isPlaying;
                  return (
                    <div key={`${card.suit}-${card.value}`} style={{
                      marginLeft: i === 0 ? 0 : -18,
                      transform: `rotate(${(i - arr.length / 2) * 2}deg)`,
                      transition: 'transform 0.15s',
                      zIndex: i,
                    }}>
                      <Card
                        suit={card.suit} value={card.value}
                        playable={canPlay}
                        onClick={() => canPlay && handlePlayCard(card.suit, card.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ---- INDICATEUR TOUR ---- */}
        {isMyTurn && isPlaying && (
          <div style={{
            position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
            padding: '7px 18px', borderRadius: 20,
            background: 'rgba(232,201,109,0.12)',
            border: '1px solid rgba(232,201,109,0.45)',
            color: '#e8c96d', fontFamily: "'Cinzel', serif", fontSize: 11,
            letterSpacing: '0.1em', zIndex: 40,
            animation: 'pulse 1.5s infinite',
          }}>
            ✦ À VOUS DE JOUER ✦
          </div>
        )}

        {/* ---- NOTIFICATION ---- */}
        {notification && (
          <div style={{
            position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
            padding: '9px 22px', borderRadius: 24,
            background: notification.isError ? 'rgba(192,57,43,0.92)' : 'rgba(201,168,76,0.92)',
            color: notification.isError ? '#fff' : '#1a0a00',
            fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.08em',
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            zIndex: 300, animation: 'fadeIn 0.2s ease',
            whiteSpace: 'nowrap',
          }}>
            {notification.msg}
          </div>
        )}

        {/* ---- CHAT ---- */}
        <Chat gameId={gameId} messages={messages || []} pseudo={user?.pseudo} />

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.55} }
          @keyframes fadeIn { from{opacity:0;transform:translateX(-50%) translateY(-8px)} to{opacity:1;transform:translateX(-50%) translateY(0)} }
          ::-webkit-scrollbar{width:4px}
          ::-webkit-scrollbar-track{background:rgba(255,255,255,0.03)}
          ::-webkit-scrollbar-thumb{background:rgba(201,168,76,0.3);border-radius:2px}
        `}</style>
      </div>
    </>
  );
}

function ScoreDisplay({ label, score, total, color }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 9, letterSpacing: '0.12em', color, fontFamily: "'Cinzel', serif", opacity: 0.8 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontFamily: "'Cinzel', serif", color, fontSize: 17 }}>
        {score}
        <span style={{ fontSize: 10, opacity: 0.55, marginLeft: 3 }}>({total})</span>
      </div>
    </div>
  );
}

function sortCards(cards, trumpSuit) {
  const suitOrder  = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  const valueOrder = { '7':0,'8':1,'9':2,'J':3,'Q':4,'K':5,'10':6,'A':7 };
  const trumpOrder = { '7':0,'8':1,'Q':2,'K':3,'10':4,'A':5,'9':6,'J':7 };
  return [...cards].sort((a, b) => {
    const aT = a.suit === trumpSuit, bT = b.suit === trumpSuit;
    if (aT !== bT) return aT ? 1 : -1;
    if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
    const ord = a.suit === trumpSuit ? trumpOrder : valueOrder;
    return ord[a.value] - ord[b.value];
  });
}
