// ============================================================
// App.jsx — Point d'entrée de l'application
// ============================================================

import { useState } from 'react';
import { AuthProvider, useAuth } from './utils/auth.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { LobbyPage } from './pages/LobbyPage.jsx';
import { GamePage } from './pages/GamePage.jsx';

function AppRouter() {
  const { user } = useAuth();
  const [game, setGame] = useState(() => {
    // Restaurer la session de partie après un reload
    try {
      const saved = localStorage.getItem('belote_game');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const reloadGame = (gameId, code, seat, team) => {
    if (localStorage.getItem('belote_game')!=null){
      try {
        const gameData = { gameId, gameCode: code, mySeat: seat, myTeam: team };
        localStorage.setItem('belote_game', JSON.stringify(gameData));
        setGame(gameData);
      } catch {
        setGame(null);
      }
    }
  };

  const handleJoinGame = (gameId, code, seat, team) => {
    const gameData = { gameId, gameCode: code, mySeat: seat, myTeam: team };
    localStorage.setItem('belote_game', JSON.stringify(gameData));
    setGame(gameData);
  };

  const handleLeave = () => {
    localStorage.removeItem('belote_game');
    setGame(null);
  };

  if (!user) return <LoginPage />;

  if (!game) {
    return <LobbyPage onJoinGame={handleJoinGame} />;
  }

  return (
    <GamePage
      gameId={game.gameId}
      gameCode={game.gameCode}
      mySeat={game.mySeat}
      onLeave={handleLeave}
      onReload={reloadGame}
    />
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
