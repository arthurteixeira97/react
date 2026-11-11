import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import * as api from '../../services/api';
import { Botao, Campo, Erro, Folha, Vazio } from '../../components/ui';

const VAZIO = { nome: '', sku: '', categoria: '', quantidade: '0', minimo: '0', preco: '0' };
const brl = (v) => `R$ ${Number(v).toFixed(2).replace('.', ',')}`;
const num = (v) => Number(String(v).replace(',', '.'));

export default function Produtos() {
  const { isAdmin } = useAuth();
  const { cores } = useTheme();
  const s = useMemo(() => criarEstilos(cores), [cores]);
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [form, setForm] = useState(null);   // produto em edição (admin)
  const [mov, setMov] = useState(null);     // { produto, tipo }
  const [qtdMov, setQtdMov] = useState('1');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setAtualizando(true);
    try {
      setProdutos(await api.listarProdutos());
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setAtualizando(false);
    }
  }, []);

  // Recarrega toda vez que a aba ganha foco
  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const filtrados = produtos.filter((p) =>
    `${p.nome} ${p.sku} ${p.categoria ?? ''}`.toLowerCase().includes(busca.toLowerCase())
  );

  const valorTotalEstoque = produtos.reduce(
    (total, p) => total + (Number(p.quantidade) * Number(p.preco)),
    0
  );

  function abrirForm(p) {
    setErro('');
    setForm(p
      ? { ...p, categoria: p.categoria ?? '', quantidade: String(p.quantidade), minimo: String(p.minimo), preco: String(p.preco) }
      : VAZIO);
  }

  async function salvar() {
    setErro('');
    setSalvando(true);
    try {
      await api.salvarProduto({
        ...form,
        quantidade: num(form.quantidade),
        minimo: num(form.minimo),
        preco: num(form.preco),
      });
      setForm(null);
      carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  function excluir(p) {
    Alert.alert('Excluir produto', `Excluir "${p.nome}"? O histórico de movimentações dele também será apagado.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir', style: 'destructive',
        onPress: async () => {
          try { await api.excluirProduto(p.id); carregar(); } catch (e) { Alert.alert('Erro', e.message); }
        },
      },
    ]);
  }

  function abrirMov(produto, tipo) {
    setErro('');
    setQtdMov('1');
    setMov({ produto, tipo });
  }

  async function confirmarMov() {
    setErro('');
    setSalvando(true);
    try {
      await api.movimentar({ produtoId: mov.produto.id, tipo: mov.tipo, quantidade: qtdMov });
      setMov(null);
      carregar();
    } catch (e) {
      setErro(e.message);
    } finally {
      setSalvando(false);
    }
  }

  const campo = (k) => ({ value: form?.[k] ?? '', onChangeText: (t) => setForm({ ...form, [k]: t }) });

  return (
    <View style={s.tela}>
      <View style={s.topo}>
        <Campo placeholder="Buscar..." value={busca} onChangeText={setBusca} style={{ flex: 1 }} />
        {isAdmin && <Botao titulo="+ Novo" onPress={() => abrirForm(null)} />}
      </View>

      <FlatList
        data={filtrados}
        keyExtractor={(p) => String(p.id)}
        refreshing={atualizando}
        onRefresh={carregar}
        contentContainerStyle={{ padding: 12, gap: 10 }}
        ListEmptyComponent={!atualizando && <Vazio texto="Nenhum produto" />}
        ListFooterComponent={
          isAdmin && produtos.length > 0 ? (
            <View style={s.resumo}>
              <Text style={s.resumoLabel}>VALOR TOTAL DO ESTOQUE</Text>
              <Text style={s.resumoValor}>
                {brl(valorTotalEstoque)}
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item: p }) => {
          const baixo = p.quantidade <= p.minimo;
          return (
            <View style={[s.card, baixo && { backgroundColor: cores.alerta, borderColor: cores.alertaBorder }]}>
              <View style={s.linha}>
                <View style={{ flex: 1 }}>
                  <Text style={s.nome}>{p.nome}</Text>
                  <Text style={s.sub}>{p.sku}{p.categoria ? ` · ${p.categoria}` : ''}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[s.qtd, baixo && { color: cores.warn }]}>{p.quantidade}{baixo ? ' ⚠️' : ''}</Text>
                  {isAdmin && <Text style={s.sub}>{brl(p.preco)}</Text>}
                  {isAdmin && (
                    <Text style={s.valorProduto}>Total: {brl(Number(p.quantidade) * Number(p.preco))}</Text>
                  )}
                </View>
              </View>
              <View style={s.acoes}>
                <Botao titulo="Entrada" variante="ok" pequeno onPress={() => abrirMov(p, 'entrada')} />
                <Botao titulo="Saída" variante="warn" pequeno onPress={() => abrirMov(p, 'saida')} />
                {isAdmin && (
                  <>
                    <Botao titulo="Editar" variante="contorno" pequeno onPress={() => abrirForm(p)} />
                    <Botao titulo="Excluir" variante="perigo" pequeno onPress={() => excluir(p)} />
                  </>
                )}
              </View>
            </View>
          );
        }}
      />

      {/* Cadastro/edição — só admin */}
      <Folha visivel={!!form} titulo={form?.id ? 'Editar produto' : 'Novo produto'} onFechar={() => setForm(null)}>
        <Campo label="Nome" {...campo('nome')} />
        <Campo label="SKU" autoCapitalize="characters" {...campo('sku')} />
        <Campo label="Categoria" {...campo('categoria')} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Campo label="Quantidade" keyboardType="number-pad" style={{ flex: 1 }} {...campo('quantidade')} />
          <Campo label="Mínimo" keyboardType="number-pad" style={{ flex: 1 }} {...campo('minimo')} />
          <Campo label="Preço" keyboardType="decimal-pad" style={{ flex: 1 }} {...campo('preco')} />
        </View>
        <Erro>{erro}</Erro>
        <Botao titulo="Salvar" onPress={salvar} carregando={salvando} />
        <Botao titulo="Cancelar" variante="link" onPress={() => setForm(null)} />
      </Folha>

      {/* Entrada/saída — todos */}
      <Folha
        visivel={!!mov}
        titulo={`${mov?.tipo === 'entrada' ? 'Entrada' : 'Saída'} — ${mov?.produto.nome ?? ''}`}
        onFechar={() => setMov(null)}
      >
        <Text style={s.sub}>Estoque atual: {mov?.produto.quantidade}</Text>
        <Campo label="Quantidade" keyboardType="number-pad" value={qtdMov} onChangeText={setQtdMov} autoFocus />
        <Erro>{erro}</Erro>
        <Botao titulo="Confirmar" onPress={confirmarMov} carregando={salvando} />
        <Botao titulo="Cancelar" variante="link" onPress={() => setMov(null)} />
      </Folha>
    </View>
  );
}

const criarEstilos = (cores) => StyleSheet.create({
  tela: { flex: 1, backgroundColor: cores.bg },
  topo: { flexDirection: 'row', gap: 8, padding: 12, paddingBottom: 0, alignItems: 'center' },
  card: { backgroundColor: cores.card, borderRadius: 10, borderWidth: 1, borderColor: cores.border, padding: 12, gap: 10 },
  linha: { flexDirection: 'row', gap: 8 },
  nome: { fontSize: 16, fontWeight: '600', color: cores.text },
  sub: { fontSize: 13, color: cores.muted },
  qtd: { fontSize: 20, fontWeight: '700', color: cores.text },
  acoes: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  resumo: { backgroundColor: cores.card, borderRadius: 8, borderWidth: 1, borderColor: cores.border, padding: 12, marginTop: 4, gap: 3 },
  resumoLabel: { fontSize: 11, fontWeight: '600', color: cores.muted },
  resumoValor: { fontSize: 19, fontWeight: '700', color: cores.text },
  valorProduto: { fontSize: 12, fontWeight: '600', color: cores.muted, marginTop: 2 },
});
