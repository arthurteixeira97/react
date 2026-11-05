import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as api from '../../services/api';
import { Badge, Botao, Campo, Erro, Folha } from '../../components/ui';

const VAZIO = { nome: '', email: '', senha: '', perfil: 'padrao' };

export default function Usuarios() {
  const { user, modoUsuario, alternarModoUsuario } = useAuth();
  const { cores } = useTheme();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  const [usuarios, setUsuarios] = useState([]);
  const [atualizando, setAtualizando] = useState(false);
  const [form, setForm] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setAtualizando(true);
    try {
      const lista = await api.listarUsuarios();
      setUsuarios(lista.filter((u) => u.ativo));
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setAtualizando(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  async function criar() {
    setErro('');
    setSalvando(true);
    try {
      await api.criarUsuario({ ...form, email: form.email.trim() });
      setForm(null);
      carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  function desativar(u) {
    Alert.alert('Desativar usuário', `Desativar ${u.nome}? Ele não vai mais conseguir entrar.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Desativar', style: 'destructive',
        onPress: async () => {
          try { await api.excluirUsuario(u.id); carregar(); } catch (e) { Alert.alert('Erro', e.message); }
        },
      },
    ]);
  }

  const campo = (k) => ({ value: form?.[k] ?? '', onChangeText: (t) => setForm({ ...form, [k]: t }) });

  return (
    <View style={{ flex: 1, backgroundColor: cores.bg }}>
      {modoUsuario ? (
        <View style={s.aviso}>
          <Text style={s.avisoTitulo}>👤 Visão de usuário padrão ativa</Text>
          <Text style={s.sub}>
            As abas Produtos e Movimentações agora mostram só o que um usuário padrão vê — sem
            os botões de administrador (Novo, Editar, Excluir).
          </Text>
          <Botao titulo="Voltar para a visão de admin" onPress={alternarModoUsuario} style={{ marginTop: 8 }} />
        </View>
      ) : (
        <FlatList
          data={usuarios}
          keyExtractor={(u) => String(u.id)}
          refreshing={atualizando}
          onRefresh={carregar}
          contentContainerStyle={{ padding: 12, gap: 8 }}
          ListHeaderComponent={
            <View style={{ gap: 8, marginBottom: 4 }}>
              <Botao titulo="👁️ Ver como usuário padrão" variante="contorno" onPress={alternarModoUsuario} />
              <Botao titulo="+ Novo usuário" onPress={() => { setErro(''); setForm(VAZIO); }} />
            </View>
          }
          renderItem={({ item: u }) => (
            <View style={s.card}>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={s.nome}>{u.nome}</Text>
                <Text style={s.sub}>{u.email}</Text>
                <Badge texto={u.perfil === 'admin' ? 'Admin' : 'Padrão'} admin={u.perfil === 'admin'} />
              </View>
              {u.id !== user.id && <Botao titulo="Desativar" variante="perigo" pequeno onPress={() => desativar(u)} />}
            </View>
          )}
        />
      )}

      <Folha visivel={!!form} titulo="Novo usuário" onFechar={() => setForm(null)}>
        <Campo label="Nome" {...campo('nome')} />
        <Campo label="E-mail" autoCapitalize="none" keyboardType="email-address" {...campo('email')} />
        <Campo label="Senha (mín. 6)" secureTextEntry {...campo('senha')} />
        <Text style={s.sub}>Perfil</Text>
        <View style={s.seletor}>
          {[['padrao', 'Padrão'], ['admin', 'Administrador']].map(([valor, rotulo]) => {
            const ativo = form?.perfil === valor;
            return (
              <Pressable
                key={valor}
                onPress={() => setForm({ ...form, perfil: valor })}
                style={[s.opcao, ativo && { backgroundColor: cores.primary, borderColor: cores.primary }]}
              >
                <Text style={{ color: ativo ? '#fff' : cores.text, fontWeight: '600' }}>{rotulo}</Text>
              </Pressable>
            );
          })}
        </View>
        <Erro>{erro}</Erro>
        <Botao titulo="Criar" onPress={criar} carregando={salvando} />
        <Botao titulo="Cancelar" variante="link" onPress={() => setForm(null)} />
      </Folha>
    </View>
  );
}

const criarEstilos = (cores) => StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: cores.card, borderRadius: 10, borderWidth: 1, borderColor: cores.border, padding: 12 },
  nome: { fontSize: 15, fontWeight: '600', color: cores.text },
  sub: { fontSize: 13, color: cores.muted },
  seletor: { flexDirection: 'row', gap: 8 },
  opcao: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: cores.border, alignItems: 'center' },
  aviso: { margin: 12, backgroundColor: cores.adminBg, borderRadius: 10, borderWidth: 1, borderColor: cores.primary, padding: 16, gap: 6 },
  avisoTitulo: { fontSize: 16, fontWeight: '700', color: cores.text },
});
