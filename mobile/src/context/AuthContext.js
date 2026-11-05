import { createContext, useContext, useEffect, useState } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [modoUsuario, setModoUsuario] = useState(false); // admin "vendo como" usuário padrão

  useEffect(() => {
    api.carregarSessao()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setCarregando(false));

    // Se a API responder 401 (token expirado), desloga automaticamente
    api.setUnauthorizedHandler(() => { api.limparSessao(); setUser(null); });
  }, []);

  async function login(email, senha) {
    const { token, user } = await api.login(email.trim(), senha);
    await api.salvarSessao(token, user);
    setUser(user);
  }

  async function logout() {
    await api.limparSessao();
    setUser(null);
    setModoUsuario(false);
  }

  function alternarModoUsuario() {
    setModoUsuario((v) => !v);
  }

  // isAdminReal: perfil de fato cadastrado no backend (garante a permissão de verdade).
  // isAdmin: o que a tela usa pra decidir o que mostrar — some quando o admin liga o
  // "modo usuário padrão", pra ele navegar no app igual a um usuário comum veria.
  const isAdminReal = user?.perfil === 'admin';
  const isAdmin = isAdminReal && !modoUsuario;

  return (
    <AuthContext.Provider
      value={{ user, isAdmin, isAdminReal, modoUsuario, alternarModoUsuario, carregando, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
