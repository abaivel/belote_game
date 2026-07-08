// ============================================================
// components/BiddingPanel.jsx — Enchères belote CLASSIQUE
//
// Tour 1 : prendre à la couleur retournée, ou passer
// Tour 2 : prendre à une autre couleur, ou passer
// Les cartes du joueur restent visibles en bas pendant tout ce temps
// ============================================================

import { useState } from 'react';
import { Card } from './Card';
import "../styles/BiddingPanel.css"

const SUIT_INFO = {
  hearts:   { symbol: '♥', label: 'Cœur',   color: '#e74c3c', card_color: '#e74c3c' },
  diamonds: { symbol: '♦', label: 'Carreau', color: '#e74c3c', card_color: '#e74c3c' },
  clubs:    { symbol: '♣', label: 'Trèfle',  color: '#f5ead5', card_color: '#1a1a2e' },
  spades:   { symbol: '♠', label: 'Pique',   color: '#f5ead5', card_color: '#1a1a2e' },
};

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];

export function BiddingPanel({ state, myPlayer, onBid, loading }) {
  const {round, players, talonCard } = state;
  const [selectedSuit, setSelectedSuit] = useState(null);
  const [error, setError]               = useState('');

  const isMyTurn = myPlayer && round.currentPlayerId == myPlayer.id;
  const bidTurn  = round.bidTurn || 1;
  const proposed = round.bidSuitProposed;
  const currentPlayerName = players?.find(p => p.id == round.currentPlayerId)?.pseudo || '?';

  const handleTake = async () => {
    const suit = bidTurn === 1 ? proposed : selectedSuit;
    if (bidTurn === 2 && !suit) { setError('Choisissez une couleur'); return; }
    setError('');
    try { await onBid('take', suit); }
    catch (e) { setError(e.message); }
  };

  const handlePass = async () => {
    setError('');
    try { await onBid('pass'); }
    catch (e) { setError(e.message); }
  };

  return (
    // Positionné en haut de la table, pas en plein milieu, pour laisser les cartes visibles
    <div className='bidding-panel-window'>
      {/* Titre */}
      <h3>
        {bidTurn === 1 ? 'PRENDRE À LA COULEUR ?' : 'TOUR 2 — CHOISIR UNE COULEUR'}
      </h3>

      {/* Carte retournée */}
      {talonCard && (
        <div className='div-card-turned-over'>
          <Card suit={talonCard.suit} value={talonCard.value} />
          <div className='div-card-turned-over-infos'>
            <div className='div-card-turned-over-infos-title'>
              CARTE RETOURNÉE
            </div>
            <div className='div-card-turned-over-infos-symbol' style={{ color: SUIT_INFO[talonCard.suit]?.color }}>
              {SUIT_INFO[talonCard.suit]?.symbol}
            </div>
            <div className='div-card-turned-over-infos-label' style={{ color: SUIT_INFO[talonCard.suit]?.color }}>
              {SUIT_INFO[talonCard.suit]?.label}
            </div>
          </div>
        </div>
      )}

      {/* Qui doit parler */}
      <p className='p-who-speaks'>
        {isMyTurn
          ? <span>C'est votre tour</span>
          : <>Tour de<span>{currentPlayerName}</span></>
        }
      </p>

      {isMyTurn && (
        <>
          {/* Tour 2 : sélecteur de couleur ≠ proposée */}
          {bidTurn === 2 && (
            <div className='div-choice-trump'>
              <p>
                CHOISISSEZ L'ATOUT (sauf {SUIT_INFO[proposed]?.symbol})
              </p>
              <div>
                {SUITS.filter(s => s !== proposed).map(s => (
                  <button key={s} onClick={() => setSelectedSuit(s)}
                    style={{
                      border: `2px solid ${selectedSuit === s ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`,
                      background: selectedSuit === s ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                      color: SUIT_INFO[s].color
                    }}>
                    {SUIT_INFO[s].symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className='p-error-bidding'>{error}</p>}

          <div className='div-choice-buttons'>
            <button className='div-choice-button-pass' onClick={handlePass} disabled={loading}>PASSER</button>
            <button className='div-choice-button-take' onClick={handleTake} disabled={loading || (bidTurn === 2 && !selectedSuit)}>
              {bidTurn === 1
                ? `PRENDRE ${SUIT_INFO[proposed]?.symbol || ''}`
                : 'PRENDRE'
              }
            </button>
          </div>
        </>
      )}
    </div>
  );
}
