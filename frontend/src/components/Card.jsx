// ============================================================
// components/Card.jsx — Composant carte à jouer
// ============================================================

import { useState } from 'react';
import { getCard } from '../utils/getCard';
import "../styles/Card.css"

const SUIT_SYMBOLS = {
  hearts:   { symbol: '♥', color: '#e61308' },
  diamonds: { symbol: '♦', color: '#e61308' },
  clubs:    { symbol: '♣', color: '#000' },
  spades:   { symbol: '♠', color: '#000' },
};

const VALUE_DISPLAY = {
  '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'V', 'Q': 'D', 'K': 'R', 'A': 'A',
};

export function Card({ suit, value, onClick, playable = false, small = false, faceDown = false }) {
  const [hovered, setHovered] = useState(false);
  const suitInfo = SUIT_SYMBOLS[suit] || { symbol: '?', color: '#000' };
  const display  = VALUE_DISPLAY[value] || value;
  const size     = small ? { w: 55, h: 78, fs: 13, sym: 16 } : { w: 70, h: 98, fs: 17, sym: 22 };

  if (faceDown) {
    return (
      <div className='div-card-face-down'>
        <span>✦</span>
      </div>
    );
  }

  const isPlayable = playable && !!onClick;
  const lift = hovered && isPlayable ? -12 : 0;

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={small ? 'div-card-face-up div-card-small' : "div-card-face-up"}
      style={{
        width: size.w,
        height: size.h,
        border: `2px solid ${hovered && isPlayable ? '#c9a84c' : '#d4c5a9'}`,
        boxShadow: hovered && isPlayable
          ? '0 8px 24px rgba(0,0,0,0.5), 0 0 12px rgba(201,168,76,0.4)'
          : '2px 3px 6px rgba(0,0,0,0.35)',
        cursor: isPlayable ? 'pointer' : 'default',
        transform: `translateY(${lift}px)`
      }}
    >
      {/* Coin supérieur gauche */}
      <div className='div-card-corner-up-left'>
        <div className='div-value-card' style={{ color: suitInfo.color }}>
          {display}
        </div>
        <div className='div-value-suit' style={{ color: suitInfo.color }}>{suitInfo.symbol}</div>
      </div>

      {getCard(suit, value)}

      {/* Coin inférieur droit (retourné) */}
      <div className='div-card-corner-down-right'>
        <div className='div-value-card' style={{ color: suitInfo.color }}>
          {display}
        </div>
        <div className='div-value-suit' style={{ color: suitInfo.color }}>{suitInfo.symbol}</div>
      </div>

      {/* Indicateur jouable */}
      {isPlayable && (
        <div className='div-card-is-playable' style={{opacity: hovered ? 1 : 0.6}} />
      )}
    </div>
  );
}
