import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as api from '../../services/api';
import { Vazio } from '../../components/ui';

const fmtData = (d) => {
  const x = new Date(d);
  const p = (n) => String(n).padStart(2, '0');
  return `${p(x.getDate())}/${p(x.getMonth() + 1)}/${x.getFullYear()} ${p(x.getHours())}:${p(x.getMinutes())}`;
};

export default function Movimentacoes() {
  const { isAdmin } = useAuth();
  const { cores } = useTheme();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  const [movs, setMovs] = useState([]);
  const [atualizando, setAtualizando] = useState(false);

  // O backend já filtra: admin recebe tudo, padrão só as próprias.
  const carregar = useCallback(async () => {
    setAtualizando(true);
    try {
      setMovs(await api.listarMovimentacoes());
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  return (
    <FlatList
      style={{ backgroundColor: cores.bg }}
      data={movs}
      keyExtractor={(m) => String(m.id)}
      refreshing={atualizando}
      onRefresh={carregar}
      contentContainerStyle={{ padding: 12, gap: 8 }}
      ListHeaderComponent={<Text style={s.cab}>{isAdmin ? 'Todas as movimentações' : 'Minhas movimentações'}</Text>}
      ListEmptyComponent={!atualizando && <Vazio texto="Nenhuma movimentação" />}
      renderItem={({ item: m }) => {
        const entrada = m.tipo === 'entrada';
        return (
          <View style={s.card}>
            <View style={[s.tag, { backgroundColor: entrada ? cores.okBg : cores.warnBg }]}>
              <Text style={{ color: entrada ? cores.ok : cores.warn, fontWeight: '700' }}>
                {entrada ? '+' : '−'}{m.quantidade}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.nome}>{m.produto}</Text>
              <Text style={s.sub}>{fmtData(m.data)}{isAdmin ? ` · ${m.usuario}` : ''}</Text>
            </View>
          </View>
        );
      }}
    />
  );
}

const criarEstilos = (cores) => StyleSheet.create({
  cab: { color: cores.muted, fontSize: 13, marginBottom: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: cores.card, borderRadius: 10, borderWidth: 1, borderColor: cores.border, padding: 12 },
  tag: { minWidth: 52, paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  nome: { fontSize: 15, fontWeight: '600', color: cores.text },
  sub: { fontSize: 12, color: cores.muted },
});
