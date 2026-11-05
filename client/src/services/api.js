// Cliente HTTP da API. Em dev, o Vite faz proxy de /api para o backend (ver vite.config.js).
const BASE = import.meta.env.VITE_API_URL || '/api';
const SESSION_KEY = 'est_session';

export const getSession = () => {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
};
export const setSession = (s) => sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
export const clearSession = () => sessionStorage.removeItem(SESSION_KEY);

async function request(path, { method = 'GET', body } = {}) {
  const token = getSession()?.token;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  // Token expirado/inválido em rota protegida → volta pro login
  if (res.status === 401 && token) {
    clearSession();
    window.location.href = '/login';
    return;
  }
  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
  return data;
}

// ---------- Auth ----------
export const login = (email, senha) => request('/auth/login', { method: 'POST', body: { email, senha } });

// ---------- Produtos ----------
export const listarProdutos = () => request('/produtos');
export const salvarProduto = ({ id, ...dados }) =>
  id ? request(`/produtos/${id}`, { method: 'PUT', body: dados }) : request('/produtos', { method: 'POST', body: dados });
export const excluirProduto = (id) => request(`/produtos/${id}`, { method: 'DELETE' });

// ---------- Movimentações ----------
export const listarMovimentacoes = () => request('/movimentacoes');
export const movimentar = ({ produtoId, tipo, quantidade }) =>
  request('/movimentacoes', { method: 'POST', body: { produtoId, tipo, quantidade: Number(quantidade) } });

// ---------- Usuários (admin) ----------
export const listarUsuarios = () => request('/usuarios');
export const criarUsuario = (dados) => request('/usuarios', { method: 'POST', body: dados });
export const excluirUsuario = (id) => request(`/usuarios/${id}`, { method: 'DELETE' });
