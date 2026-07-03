// ============================================================
// components/Card.jsx — Composant carte à jouer
// ============================================================

import { useState } from 'react';
import { getCard } from '../utils/getCard';

const SUIT_SYMBOLS = {
  hearts:   { symbol: '♥', color: '#c0392b' },
  diamonds: { symbol: '♦', color: '#c0392b' },
  clubs:    { symbol: '♣', color: '#1a1a2e' },
  spades:   { symbol: '♠', color: '#1a1a2e' },
};

const VALUE_DISPLAY = {
  '7': '7', '8': '8', '9': '9', '10': '10',
  'J': 'V', 'Q': 'D', 'K': 'R', 'A': 'A',
};

export function Card({ suit, value, onClick, playable = false, small = false, faceDown = false }) {
  const [hovered, setHovered] = useState(false);
  const suitInfo = SUIT_SYMBOLS[suit] || { symbol: '?', color: '#000' };
  const display  = VALUE_DISPLAY[value] || value;
  const size     = small ? { w: 52, h: 74, fs: 13, sym: 16 } : { w: 70, h: 98, fs: 17, sym: 22 };

  if (faceDown) {
    return (
      <div style={{
        width: size.w, height: size.h,
        borderRadius: 6,
        background: 'linear-gradient(135deg, #1a472a 25%, #2d6a4f 50%, #1a472a 75%)',
        border: '2px solid #c9a84c',
        boxShadow: '2px 3px 6px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <span style={{ color: '#c9a84c', fontSize: size.fs, opacity: 0.6 }}>✦</span>
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
      style={{
        width: size.w,
        height: size.h,
        borderRadius: 6,
        background: '#fffdf5',
        border: `2px solid ${hovered && isPlayable ? '#c9a84c' : '#d4c5a9'}`,
        boxShadow: hovered && isPlayable
          ? '0 8px 24px rgba(0,0,0,0.5), 0 0 12px rgba(201,168,76,0.4)'
          : '2px 3px 6px rgba(0,0,0,0.35)',
        cursor: isPlayable ? 'pointer' : 'default',
        transform: `translateY(${lift}px)`,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '3px 4px',
        flexShrink: 0,
        position: 'relative',
        userSelect: 'none',
        fontFamily:'Liberation Serif'
      }}
    >
      {/* Coin supérieur gauche */}
      <div style={{ lineHeight: 1, display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div className='div-value-card' style={{ fontWeight: 700, color: suitInfo.color, fontFamily: "'Cinzel', serif" }}>
          {display}
        </div>
        <div className='div-value-suit' style={{ color: suitInfo.color }}>{suitInfo.symbol}</div>
      </div>

      {/* Symbole central 
      <div style={{
        textAlign: 'center',
        fontSize: size.sym,
        color: suitInfo.color,
        opacity: 0.85,
      }}>
        {suitInfo.symbol}
      </div>*/}

      {getCard(suit, value)}

      {/* Coin inférieur droit (retourné) */}
      <div style={{ lineHeight: 1, transform: 'rotate(180deg)', alignSelf: 'flex-end', display:'flex', flexDirection:'column', alignItems:'center' }}>
        <div className='div-value-card' style={{fontWeight: 700, color: suitInfo.color, fontFamily: "'Cinzel', serif" }}>
          {display}
        </div>
        <div className='div-value-suit' style={{ color: suitInfo.color }}>{suitInfo.symbol}</div>
      </div>

      {/* Indicateur jouable */}
      {isPlayable && (
        <div style={{
          position: 'absolute',
          bottom: -6,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 6, height: 6,
          borderRadius: '50%',
          background: '#c9a84c',
          opacity: hovered ? 1 : 0.6,
        }} />
      )}
    </div>
  );
}
