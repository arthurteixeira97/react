import { useEffect, useState } from 'react';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as Network from 'expo-network';

const PORTA = 3001;
const IP_CACHE_KEY = 'est_api_host';

// Descobre o endereço da API:
// 1) EXPO_PUBLIC_API_URL no .env, se definido
// 2) Em dev no Expo Go: usa o mesmo IP do PC que está rodando o `expo start`
// 3) Num APK (sem hostUri), varre a sub-rede Wi-Fi procurando quem responde em :3001/api/health,
//    assim o app não fica preso a um IP fixo gravado no build.
function resolverBaseUrlInicial() {
  if (process.env.EXPO_PUBLIC_API_URL) return process.env.EXPO_PUBLIC_API_URL.replace(/\/$/, '');
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  return host ? `http://${host}:${PORTA}/api` : null;
}

let BASE_URL = resolverBaseUrlInicial();
let prontoPromise = null;
const ouvintes = [];

function notificar() {
  ouvintes.forEach((fn) => fn(BASE_URL));
}
export function onBaseUrlChange(fn) {
  ouvintes.push(fn);
  return () => {
    const i = ouvintes.indexOf(fn);
    if (i >= 0) ouvintes.splice(i, 1);
  };
}
export function obterBaseUrl() {
  return BASE_URL;
}
export function useApiUrl() {
  const [url, setUrl] = useState(BASE_URL);
  useEffect(() => onBaseUrlChange(setUrl), []);
  return url;
}

async function responde(host, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`http://${host}:${PORTA}/api/health`, { signal: ctrl.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

async function escanearRede() {
  const meuIp = await Network.getIpAddressAsync().catch(() => null);
  if (!meuIp || !meuIp.includes('.')) return null;
  const prefixo = meuIp.split('.').slice(0, 3).join('.');

  const salvo = await SecureStore.getItemAsync(IP_CACHE_KEY).catch(() => null);
  if (salvo && (await responde(salvo, 1200))) return salvo;

  const hosts = Array.from({ length: 254 }, (_, i) => `${prefixo}.${i + 1}`).filter((h) => h !== salvo);
  const LOTE = 40;
  for (let i = 0; i < hosts.length; i += LOTE) {
    const lote = hosts.slice(i, i + LOTE);
    // eslint-disable-next-line no-await-in-loop
    const achado = await Promise.any(
      lote.map((h) => responde(h, 700).then((ok) => (ok ? h : Promise.reject()))),
    ).catch(() => null);
    if (achado) return achado;
  }
  return null;
}

export function inicializarApi() {
  if (BASE_URL) return Promise.resolve(BASE_URL);
  if (!prontoPromise) {
    prontoPromise = escanearRede().then((host) => {
      if (host) {
        BASE_URL = `http://${host}:${PORTA}/api`;
        SecureStore.setItemAsync(IP_CACHE_KEY, host).catch(() => {});
        notificar();
      }
      return BASE_URL;
    });
  }
  return prontoPromise;
}

// Dispara a descoberta em background assim que o app abre (build standalone sem hostUri),
// pra já estar pronta quando a tela de login chamar a API.
if (!BASE_URL) inicializarApi();

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
  if (!BASE_URL) await inicializarApi();
  if (!BASE_URL) throw new Error('Não encontrei o servidor na rede. Confira se ele está ligado e no mesmo Wi-Fi.');

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
