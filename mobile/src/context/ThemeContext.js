import { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';

// Paleta clara (padrão) e escura. Mesmas chaves nas duas — quem usa
// `cores.xxx` não precisa saber em qual modo o app está.
export const paletaClara = {
  bg: '#f4f5f7', card: '#ffffff', text: '#1f2933', muted: '#6b7280', border: '#e5e7eb',
  primary: '#2563eb', ok: '#16a34a', warn: '#d97706', danger: '#dc2626',
  alerta: '#fff7ed', alertaBorder: '#fed7aa', okBg: '#dcfce7', warnBg: '#fef3c7',
  adminBg: '#dbeafe', adminText: '#1d4ed8', overlay: 'rgba(0,0,0,0.35)',
};

export const paletaEscura = {
  bg: '#0f1115', card: '#1c1f26', text: '#e8eaed', muted: '#9aa3af', border: '#2d323c',
  primary: '#3b82f6', ok: '#22c55e', warn: '#f59e0b', danger: '#f87171',
  alerta: '#2a2014', alertaBorder: '#92400e', okBg: '#143321', warnBg: '#2a2014',
  adminBg: '#1e293b', adminText: '#93c5fd', overlay: 'rgba(0,0,0,0.6)',
};

const ThemeContext = createContext({ scheme: 'light', isDark: false, cores: paletaClara });

export function ThemeProvider({ children }) {
  const scheme = useColorScheme(); // 'light' | 'dark' | null, atualiza sozinho quando o sistema muda
  const isDark = scheme === 'dark';

  const valor = useMemo(
    () => ({ scheme: isDark ? 'dark' : 'light', isDark, cores: isDark ? paletaEscura : paletaClara }),
    [isDark]
  );

  return <ThemeContext.Provider value={valor}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
