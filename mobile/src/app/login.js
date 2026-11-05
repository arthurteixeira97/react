import { useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { BASE_URL } from '../services/api';
import { Botao, Campo, Erro } from '../components/ui';

export default function Login() {
  const { login } = useAuth();
  const { cores } = useTheme();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!email || !senha) return setErro('Informe e-mail e senha');
    setErro('');
    setCarregando(true);
    try {
      await login(email, senha);
      // O redirecionamento é automático: o guard do _layout troca pra área logada.
    } catch (e) {
      setErro(e.message);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cores.bg }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={s.container}>
        <View style={s.card}>
          <Text style={s.titulo}>📦 Controle de Estoque</Text>
          <Campo
            label="E-mail" value={email} onChangeText={setEmail}
            autoCapitalize="none" keyboardType="email-address" autoComplete="email"
          />
          <Campo label="Senha" value={senha} onChangeText={setSenha} secureTextEntry onSubmitEditing={entrar} />
          <Erro>{erro}</Erro>
          <Botao titulo="Entrar" onPress={entrar} carregando={carregando} />
          <Text style={s.dica}>
            Admin: admin@estoque.com / admin123{'\n'}
            Padrão: user@estoque.com / user123
          </Text>
        </View>
        <Text style={s.api}>API: {BASE_URL}</Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const criarEstilos = (cores) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  card: { backgroundColor: cores.card, borderRadius: 12, padding: 20, gap: 14, borderWidth: 1, borderColor: cores.border },
  titulo: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 6, color: cores.text },
  dica: { color: cores.muted, textAlign: 'center', fontSize: 12, lineHeight: 18 },
  api: { color: cores.muted, textAlign: 'center', fontSize: 11, marginTop: 16 },
});
