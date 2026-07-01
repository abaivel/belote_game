// ============================================================
// utils/api.js — Client API pour le backend PHP
// ============================================================

// Modifier cette constante selon votre hébergement
const API_BASE = '/backend/api';

function getToken() {
  return localStorage.getItem('belote_token');
}

async function apiFetch(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const res = await fetch(`${API_BASE}/${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json();
  if (!data.success) {
    if (res.status == 401){
      localStorage.removeItem('belote_game');
      data.code=401;
    }else{
      throw new Error(data.error || 'Erreur serveur');
    }
  }
  return data;
}

export const api = {
  login: (pseudo, password, action = 'login') =>
    apiFetch('login.php', {
      method: 'POST',
      body: JSON.stringify({ pseudo, password, action }),
    }),

  changePseudo: (pseudo) => 
    apiFetch('change-pseudo.php', {method: 'PUT', body: JSON.stringify({pseudo})}),

  createGame: () =>
    apiFetch('create-game.php', { method: 'POST' }),

  joinGame: (code) =>
    apiFetch('join-game.php', { method: 'POST', body: JSON.stringify({ code }) }),

  listGames: () =>
    apiFetch('list-games.php'),

  gameState: (gameId) =>
    apiFetch(`game-state.php?gameId=${gameId}`),

  bid: (gameId, action, suit = null, value = null) =>
    apiFetch('bid.php', {
      method: 'POST',
      body: JSON.stringify({ gameId, action, suit, value }),
    }),

  playCard: (gameId, suit, value) =>
    apiFetch('play-card.php', {
      method: 'POST',
      body: JSON.stringify({ gameId, suit, value }),
    }),

  sendMessage: (gameId, content) =>
    apiFetch('send-message.php', {
      method: 'POST',
      body: JSON.stringify({ gameId, content }),
    }),

  leaveGame: (gameId) =>
    apiFetch('leave-game.php', {
      method: 'POST',
      body: JSON.stringify({ gameId }),
    }),

  getStats: (userId) =>
    apiFetch(`get-stats.php?userId=${userId}`),

  getInfosUser: (userId, gameId) =>
    apiFetch(`get-user-info.php?userId=${userId}&gameId=${gameId}`),
};
