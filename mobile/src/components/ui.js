import { useMemo } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme, paletaClara } from '../context/ThemeContext';

// Mantido por compatibilidade (ex.: uso fora de componente). Dentro de
// componentes, prefira `useTheme().cores` — ele troca sozinho com o modo claro/escuro.
export const cores = paletaClara;

export function Botao({ titulo, onPress, variante = 'primario', carregando, pequeno, style }) {
  const { cores } = useTheme();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  const v = useMemo(() => criarEstilosBotao(cores)[variante], [cores, variante]);
  return (
    <Pressable
      onPress={onPress}
      disabled={carregando}
      style={({ pressed }) => [s.botao, pequeno && s.botaoPequeno, v.box, pressed && { opacity: 0.7 }, style]}
    >
      {carregando
        ? <ActivityIndicator color={v.text.color} />
        : <Text style={[s.botaoTexto, pequeno && { fontSize: 13 }, v.text]}>{titulo}</Text>}
    </Pressable>
  );
}

const criarEstilosBotao = (cores) => ({
  primario: { box: { backgroundColor: cores.primary }, text: { color: '#fff' } },
  contorno: { box: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.border }, text: { color: cores.text } },
  ok: { box: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.ok }, text: { color: cores.ok } },
  warn: { box: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.warn }, text: { color: cores.warn } },
  perigo: { box: { backgroundColor: cores.card, borderWidth: 1, borderColor: cores.danger }, text: { color: cores.danger } },
  link: { box: { backgroundColor: 'transparent' }, text: { color: cores.primary } },
});

export function Campo({ label, style, ...props }) {
  const { cores } = useTheme();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  return (
    <View style={{ gap: 4, ...style }}>
      {label && <Text style={s.label}>{label}</Text>}
      <TextInput style={s.input} placeholderTextColor={cores.muted} {...props} />
    </View>
  );
}

export const Erro = ({ children }) => {
  const { cores } = useTheme();
  return children ? <Text style={{ color: cores.danger, fontSize: 14 }}>{children}</Text> : null;
};

export function Badge({ texto, admin }) {
  const { cores } = useTheme();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  return (
    <View style={[s.badge, admin && { backgroundColor: cores.adminBg }]}>
      <Text style={[s.badgeTexto, admin && { color: cores.adminText }]}>{texto}</Text>
    </View>
  );
}

// Modal estilo "folha" com formulário
export function Folha({ visivel, titulo, onFechar, children }) {
  const { cores } = useTheme();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  return (
    <Modal visible={visivel} transparent animationType="slide" onRequestClose={onFechar}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[s.modalBg, { backgroundColor: cores.overlay }]}>
        <Pressable style={{ flex: 1 }} onPress={onFechar} />
        <View style={s.folha}>
          <Text style={s.folhaTitulo}>{titulo}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 12 }}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export const Vazio = ({ texto }) => {
  const { cores } = useTheme();
  return <Text style={{ textAlign: 'center', color: cores.muted, marginTop: 40 }}>{texto}</Text>;
};

const criarEstilos = (cores) => ({
  botao: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  botaoPequeno: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  botaoTexto: { fontSize: 15, fontWeight: '600' },
  label: { fontSize: 13, color: cores.muted },
  input: { borderWidth: 1, borderColor: cores.border, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, backgroundColor: cores.card, color: cores.text },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 99, backgroundColor: cores.border, alignSelf: 'flex-start' },
  badgeTexto: { fontSize: 12, color: cores.text },
  modalBg: { flex: 1 },
  folha: { backgroundColor: cores.card, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 32, maxHeight: '85%', gap: 12 },
  folhaTitulo: { fontSize: 18, fontWeight: '700', color: cores.text },
});
