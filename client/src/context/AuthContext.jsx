import { createContext, useContext, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => api.getSession()?.user ?? null);

  async function login(email, senha) {
    const { token, user } = await api.login(email, senha);
    api.setSession({ token, user });
    setUser(user);
    return user;
  }

  function logout() {
    api.clearSession();
    setUser(null);
  }

  // Só controla o que aparece na tela. Quem garante a permissão de verdade é o backend.
  const isAdmin = user?.perfil === 'admin';

  return (
    <AuthContext.Provider value={{ user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
