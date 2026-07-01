// ============================================================
// utils/auth.js — Gestion de l'authentification
// ============================================================

import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('belote_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData) => {
    localStorage.setItem('belote_token', userData.token);
    localStorage.setItem('belote_user', JSON.stringify({
      id: userData.userId,
      pseudo: userData.pseudo,
    }));
    setUser({ id: userData.userId, pseudo: userData.pseudo });
  };

  const logout = () => {
    localStorage.removeItem('belote_token');
    localStorage.removeItem('belote_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
