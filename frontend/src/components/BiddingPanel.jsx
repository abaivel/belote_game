// ============================================================
// components/BiddingPanel.jsx — Enchères belote CLASSIQUE
//
// Tour 1 : prendre à la couleur retournée, ou passer
// Tour 2 : prendre à une autre couleur, ou passer
// Les cartes du joueur restent visibles en bas pendant tout ce temps
// ============================================================

import { useState } from 'react';

const SUIT_INFO = {
  hearts:   { symbol: '♥', label: 'Cœur',   color: '#e74c3c' },
  diamonds: { symbol: '♦', label: 'Carreau', color: '#e74c3c' },
  clubs:    { symbol: '♣', label: 'Trèfle',  color: '#f5ead5' },
  spades:   { symbol: '♠', label: 'Pique',   color: '#f5ead5' },
};

const SUITS = ['hearts', 'diamonds', 'clubs', 'spades'];
const VALUE_DISPLAY = { '7':'7','8':'8','9':'9','10':'10','J':'V','Q':'D','K':'R','A':'A' };

export function BiddingPanel({ state, myPlayer, onBid, loading }) {
  const { game, players, talonCard } = state;
  const [selectedSuit, setSelectedSuit] = useState(null);
  const [error, setError]               = useState('');

  const isMyTurn = myPlayer && game.currentPlayerId == myPlayer.id;
  const bidTurn  = game.bidTurn || 1;
  const proposed = game.bidSuitProposed;
  const currentPlayerName = players?.find(p => p.id == game.currentPlayerId)?.pseudo || '?';

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
    <div style={{
      position: 'absolute',
      left: '50%',
      transform: 'translateX(-50%)',
      background: 'rgba(5,18,10,0.97)',
      border: '1px solid rgba(201,168,76,0.5)',
      borderRadius: 16,
      padding: '20px 28px',
      minWidth: 300,
      maxWidth: 400,
      textAlign: 'center',
      boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
      zIndex: 40, // inférieur aux cartes (zIndex 30 pour la main) — NON, on doit être au dessus des cartes adverses mais pas gêner les nôtres
    }}>
      {/* Titre */}
      <h3 style={{
        fontFamily: "'Cinzel', serif", color: '#c9a84c',
        fontSize: 15, letterSpacing: '0.1em', marginBottom: 10,
      }}>
        {bidTurn === 1 ? 'PRENDRE À LA COULEUR ?' : 'TOUR 2 — CHOISIR UNE COULEUR'}
      </h3>

      {/* Carte retournée */}
      {talonCard && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, marginBottom: 14 }}>
          <TalonCard suit={talonCard.suit} value={talonCard.value} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 10, color: 'rgba(245,234,213,0.4)', letterSpacing: '0.15em', marginBottom: 4 }}>
              CARTE RETOURNÉE
            </div>
            <div style={{ fontSize: 28, color: SUIT_INFO[talonCard.suit]?.color }}>
              {SUIT_INFO[talonCard.suit]?.symbol}
            </div>
            <div style={{ fontSize: 13, color: SUIT_INFO[talonCard.suit]?.color }}>
              {SUIT_INFO[talonCard.suit]?.label}
            </div>
          </div>
        </div>
      )}

      {/* Qui doit parler */}
      <p style={{ fontSize: 13, color: 'rgba(245,234,213,0.6)', marginBottom: 12 }}>
        {isMyTurn
          ? <span style={{ color: '#e8c96d', fontWeight: 'bold' }}>C'est votre tour</span>
          : <>Tour de <strong style={{ color: '#e8c96d' }}>{currentPlayerName}</strong></>
        }
      </p>

      {isMyTurn && (
        <>
          {/* Tour 2 : sélecteur de couleur ≠ proposée */}
          {bidTurn === 2 && (
            <div style={{ marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: 'rgba(245,234,213,0.4)', letterSpacing: '0.1em', marginBottom: 8 }}>
                CHOISISSEZ L'ATOUT (sauf {SUIT_INFO[proposed]?.symbol})
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {SUITS.filter(s => s !== proposed).map(s => (
                  <button key={s} onClick={() => setSelectedSuit(s)}
                    style={{
                      width: 54, height: 54, borderRadius: 10, cursor: 'pointer',
                      border: `2px solid ${selectedSuit === s ? '#c9a84c' : 'rgba(201,168,76,0.2)'}`,
                      background: selectedSuit === s ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                      color: SUIT_INFO[s].color, fontSize: 26,
                      transition: 'all 0.15s',
                    }}>
                    {SUIT_INFO[s].symbol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p style={{ color: '#e74c3c', fontSize: 12, marginBottom: 8 }}>{error}</p>}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <button onClick={handlePass} disabled={loading} style={{
              padding: '9px 20px', borderRadius: 8, cursor: 'pointer',
              border: '1px solid rgba(245,234,213,0.25)',
              background: 'transparent', color: 'rgba(245,234,213,0.7)',
              fontFamily: "'Cinzel', serif", fontSize: 12, letterSpacing: '0.1em',
            }}>PASSER</button>
            <button onClick={handleTake} disabled={loading || (bidTurn === 2 && !selectedSuit)}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: (bidTurn === 2 && !selectedSuit)
                  ? 'rgba(201,168,76,0.15)'
                  : 'linear-gradient(135deg,#c9a84c,#e8c96d)',
                color: (bidTurn === 2 && !selectedSuit) ? 'rgba(201,168,76,0.4)' : '#1a0a00',
                fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
              }}>
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

function TalonCard({ suit, value }) {
  const suitInfo = SUIT_INFO[suit] || { symbol: '?', color: '#fff' };
  return (
    <div style={{
      width: 56, height: 80, borderRadius: 7,
      background: '#fffdf5',
      border: '2px solid #c9a84c',
      boxShadow: '0 4px 16px rgba(0,0,0,0.5), 0 0 10px rgba(201,168,76,0.25)',
      display: 'flex', flexDirection: 'column',
      justifyContent: 'space-between', padding: '3px 4px',
      flexShrink: 0,
    }}>
      <div style={{ lineHeight: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: suitInfo.color, fontFamily:"'Cinzel',serif" }}>
          {VALUE_DISPLAY[value] || value}
        </div>
        <div style={{ fontSize: 12, color: suitInfo.color }}>{suitInfo.symbol}</div>
      </div>
      <div style={{ textAlign: 'center', fontSize: 20, color: suitInfo.color }}>{suitInfo.symbol}</div>
      <div style={{ transform: 'rotate(180deg)', alignSelf: 'flex-end', lineHeight: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: suitInfo.color, fontFamily:"'Cinzel',serif" }}>
          {VALUE_DISPLAY[value] || value}
        </div>
        <div style={{ fontSize: 12, color: suitInfo.color }}>{suitInfo.symbol}</div>
      </div>
    </div>
  );
}
