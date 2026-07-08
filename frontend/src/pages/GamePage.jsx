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
      <div className='div-game-loading'>
        <div>
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
      <div className='div-game-container'>

        {/* ========== BARRE DU HAUT ========== */}
        <div className='div-game-header'>
          {/* Code */}
          <div className='div-game-header-code'>
            <span>CODE </span>
            <span>{gameCode}</span>
          </div>

          {/* Scores + atout + qui a pris */}
          <div className='div-game-header-scores-trump'>
            <div className='div-game-header-scores'>
              <ScoreDisplay label="Équipe 1" score={game.team1Score} total={game.team1Total} color={TEAM_COLORS[1].text} />
              <span className='div-game-header-scores-vs'>VS</span>
              <ScoreDisplay label="Équipe 2" score={game.team2Score} total={game.team2Total} color={TEAM_COLORS[2].text} />
            </div>
            {/* Atout + preneur */}
            {round.trumpSuit && (
              <div className='div-game-header-trump'>
                <span style={{ color: SUIT_COLORS[round.trumpSuit] }}>{SUIT_SYMBOLS[round.trumpSuit]}</span>
                <span>Atout</span>
                {takerPlayer && (
                  <span className='span-header-trump-player-taker'>
                    · Pris par <strong>{takerPlayer.pseudo}</strong>
                    <span style={{ color: TEAM_COLORS[takerPlayer.team]?.text }}>
                      ({TEAM_COLORS[takerPlayer.team]?.label})
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Manche + quitter */}
          <div className='div-game-header-leave'>
            <span>
              MANCHE {game.roundNumber}
            </span>
            <button onClick={handleLeave}>QUITTER</button>
          </div>
        </div>

        {/* ========== TABLE ========== */}
        <div className='div-game-table'>

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
              <div className='div-game-table-seat-container' key={physSeat} style={{...pos}}>
                {/* Badge nom + équipe */}
                <div className='div-game-table-seat-player-name-team' onClick={()=>setIdUserSelected(p.userId)} style={{
                  background: isCurrentTurn ? 'rgba(232,201,109,0.12)' : teamColor.bg,
                  border: `1px solid ${isCurrentTurn ? 'rgba(232,201,109,0.5)' : teamColor.border}`,
                  color: isCurrentTurn ? '#e8c96d' : teamColor.text,
                }}>
                  {isCurrentTurn && <span className='span-point'>●</span>}
                  {p.pseudo}
                  {isMe && <span className='span-is-me'>(vous)</span>}
                  <span className='span-label-team' style={{
                    background: teamColor.bg, border: `1px solid ${teamColor.border}`,
                    color: teamColor.text,
                  }}>{teamColor.label}</span>
                  <span className='span-point' style={{ color: p.is_connected ? '#2ed573' : '#ff4757' }}>
                    {p.is_connected ? '●' : '○'}
                  </span>
                </div>

                {/* Dos de cartes adverses */}
                {!isMe && cardCount > 0 && (
                  <div className='div-game-table-seat-other-cards' style={{ flexDirection: isHorizontal ? "column" : "row" }}>
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
            <div className='div-game-table-playing-cards'>
              {/* Tapis */}
              <div className='div-game-table-playing-cards-central-circle' />

              {showLastTrick && (
                <div className='div-game-table-playing-cards-last-trick'>DERNIER PLI</div>
              )}

              {/* Nord : le joueur en face de nous → physique toPhysical(0) = (mySeat+2)%4 */}
              {trickBySeat[toPhysical(0)] && (
                <div className='div-game-table-playing-cards-north'>
                  <Card suit={trickBySeat[toPhysical(0)].suit} value={trickBySeat[toPhysical(0)].value} small />
                </div>
              )}

              {/* Est : à notre droite → physique toPhysical(1) = (mySeat+3)%4 */}
              {trickBySeat[toPhysical(1)] && (
                <div className='div-game-table-playing-cards-east'>
                  <Card suit={trickBySeat[toPhysical(1)].suit} value={trickBySeat[toPhysical(1)].value} small />
                </div>
              )}

              {/* Sud : nous → physique mySeat = toPhysical(2) */}
              {trickBySeat[mySeat] && (
                <div className='div-game-table-playing-cards-south'>
                  <Card suit={trickBySeat[mySeat].suit} value={trickBySeat[mySeat].value} small />
                </div>
              )}

              {/* Ouest : à notre gauche → physique toPhysical(3) = (mySeat+1)%4 */}
              {trickBySeat[toPhysical(3)] && (
                <div className='div-game-table-playing-cards-west'>
                  <Card suit={trickBySeat[toPhysical(3)].suit} value={trickBySeat[toPhysical(3)].value} small />
                </div>
              )}
            </div>
          )}

          {/* ---- EN ATTENTE ---- */}
          {isWaiting && (
            <div className='div-game-table-waiting-container'>
              <div className='div-game-table-waiting-title'>
                En attente des joueurs
              </div>
              <div className='div-game-table-waiting-nb-players'>
                {players.length}/4 joueurs présents
              </div>
              <div className='div-game-table-waiting-code'>
                <span>Code : </span>
                <span>
                  {gameCode}
                </span>
              </div>
              
              <PlayersTeamDragAndDrop players={players} myUserId={user.id} onReload={onReload}/>
              {players.length==4 && 
                <button className='button-game-table-start-game' onClick={handleStartGame}>
                  Commencer la partie
                </button>
              }
            </div>
          )}

          {/* ---- ENCHÈRES ---- */}
          {isBidding && (
            <div className='div-game-table-bidding-panel'>
              <BiddingPanel state={state} myPlayer={myPlayer} onBid={handleBid} loading={bidLoading} />
            </div>
          )}

          {/* ---- PARTIE TERMINÉE ---- */}
          {isFinished && (
            <div className='div-game-table-game-over-container'>
              <div className='div-game-table-game-over-title'>
                PARTIE TERMINÉE
              </div>
              <div className='div-game-table-game-over-scores-container'>
                {[1, 2].map(team => (
                  <div className='div-game-table-game-over-score-container' key={team}>
                    <div className='div-game-table-game-over-score-name-team' style={{color: TEAM_COLORS[team].text}}>
                      ÉQUIPE {team}
                    </div>
                    <div className='div-game-table-game-over-score-team-players'>
                      {players.filter(p => p.team == team).map(p => p.pseudo).join(' & ')}
                    </div>
                    <div className='div-game-table-game-over-score' style={{
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
                <div className='div-game-table-game-over-stats-title'>
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
              <button onClick={handleLeave}>RETOUR AU LOBBY</button>
            </div>
          )}

          {/* ---- MAIN DU JOUEUR ---- */}
          {myPlayer && myCards && myCards.length > 0 && (
            <div className='div-game-table-player-hand'>
              <div className='div-game-table-player-hand-cards-container'>
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
          <div className='div-game-table-is-my-turn'>
            ✦ À VOUS DE JOUER ✦
          </div>
        )}

        {/* ---- NOTIFICATION ---- */}
        {notification && (
          <div className='div-game-table-notification' style={{
            background: notification.isError ? 'rgba(192,57,43,0.92)' : 'rgba(201,168,76,0.92)',
            color: notification.isError ? '#fff' : '#1a0a00',
          }}>
            {notification.msg}
          </div>
        )}

        {/* ---- CHAT ---- */}
        <Chat gameId={gameId} messages={messages || []} pseudo={user?.pseudo} />

      </div>
    </>
  );
}

function ScoreDisplay({ label, score, total, color }) {
  return (
    <div className='div-game-header-score-display'>
      <div style={{ color }}>
        {label.toUpperCase()}
      </div>
      <div style={{ color }}>
        {score}
        <span>({total})</span>
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
