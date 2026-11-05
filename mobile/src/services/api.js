import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

// Descobre o endereço da API:
// 1) EXPO_PUBLIC_API_URL no .env (obrigatório no APK / produção)
// 2) Em dev no Expo Go: usa o mesmo IP do PC que está rodando o `expo start`, porta 3001
function resolverBaseUrl() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:3001/api` : 'http://localhost:3001/api';
}
export const BASE_URL = resolverBaseUrl();

const TOKEN_KEY = 'est_token';
const USER_KEY = 'est_user';
let token = null;
let onUnauthorized = () => {};

export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

export async function carregarSessao() {
  token = await SecureStore.getItemAsync(TOKEN_KEY);
  const user = await SecureStore.getItemAsync(USER_KEY);
  return token && user ? JSON.parse(user) : null;
}
export async function salvarSessao(t, user) {
  token = t;
  await SecureStore.setItemAsync(TOKEN_KEY, t);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}
export async function limparSessao() {
  token = null;
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

async function request(path, { method = 'GET', body } = {}) {
  let res;
  try {
    res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(`Sem conexão com a API (${BASE_URL}). O servidor está rodando e no mesmo Wi-Fi?`);
  }

  if (res.status === 401 && token) {
    onUnauthorized();
    throw new Error('Sessão expirada. Faça login de novo.');
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
