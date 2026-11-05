import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const VAZIO = { nome: '', sku: '', categoria: '', quantidade: 0, minimo: 0, preco: 0 };
const brl = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Produtos() {
  const { isAdmin } = useAuth();
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [form, setForm] = useState(null);       // produto sendo criado/editado (admin)
  const [mov, setMov] = useState(null);         // { produto, tipo } (todos)
  const [qtdMov, setQtdMov] = useState(1);
  const [erro, setErro] = useState('');

  const carregar = () => api.listarProdutos().then(setProdutos);
  useEffect(() => { carregar(); }, []);

  const filtrados = produtos.filter((p) =>
    `${p.nome} ${p.sku} ${p.categoria ?? ''}`.toLowerCase().includes(busca.toLowerCase())
  );

  async function salvar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.salvarProduto({
        ...form,
        quantidade: Number(form.quantidade),
        minimo: Number(form.minimo),
        preco: Number(form.preco),
      });
      setForm(null);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function excluir(p) {
    if (!confirm(`Excluir "${p.nome}"? O histórico de movimentações dele também será apagado.`)) return;
    try {
      await api.excluirProduto(p.id);
      carregar();
    } catch (err) {
      alert(err.message);
    }
  }

  async function confirmarMov(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.movimentar({ produtoId: mov.produto.id, tipo: mov.tipo, quantidade: qtdMov });
      setMov(null);
      setQtdMov(1);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  const campo = (k) => ({ value: form[k] ?? '', onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <section>
      <div className="page-header">
        <h2>Produtos</h2>
        <div className="actions">
          <input placeholder="Buscar..." value={busca} onChange={(e) => setBusca(e.target.value)} />
          {isAdmin && <button className="btn" onClick={() => setForm(VAZIO)}>+ Novo produto</button>}
        </div>
      </div>

      <div className="card table-wrap">
        <table>
          <thead>
            <tr>
              <th>SKU</th><th>Nome</th><th>Categoria</th><th>Qtd.</th>
              {isAdmin && <th>Preço</th>}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p) => (
              <tr key={p.id} className={p.quantidade <= p.minimo ? 'baixo' : ''}>
                <td>{p.sku}</td>
                <td>{p.nome}</td>
                <td>{p.categoria}</td>
                <td>{p.quantidade}{p.quantidade <= p.minimo && ' ⚠️'}</td>
                {isAdmin && <td>{brl(p.preco)}</td>}
                <td className="row-actions">
                  <button className="btn-sm ok" onClick={() => setMov({ produto: p, tipo: 'entrada' })}>Entrada</button>
                  <button className="btn-sm warn" onClick={() => setMov({ produto: p, tipo: 'saida' })}>Saída</button>
                  {isAdmin && (
                    <>
                      <button className="btn-sm" onClick={() => setForm(p)}>Editar</button>
                      <button className="btn-sm danger" onClick={() => excluir(p)}>Excluir</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
            {!filtrados.length && <tr><td colSpan={6} className="vazio">Nenhum produto</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Modal produto (admin) */}
      {form && (
        <div className="modal-bg" onClick={() => setForm(null)}>
          <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={salvar}>
            <h3>{form.id ? 'Editar produto' : 'Novo produto'}</h3>
            <label>Nome<input required {...campo('nome')} /></label>
            <label>SKU<input required {...campo('sku')} /></label>
            <label>Categoria<input {...campo('categoria')} /></label>
            <div className="grid3">
              <label>Quantidade<input type="number" min="0" {...campo('quantidade')} /></label>
              <label>Mínimo<input type="number" min="0" {...campo('minimo')} /></label>
              <label>Preço<input type="number" min="0" step="0.01" {...campo('preco')} /></label>
            </div>
            {erro && <p className="erro">{erro}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-link" onClick={() => { setForm(null); setErro(''); }}>Cancelar</button>
              <button className="btn">Salvar</button>
            </div>
          </form>
        </div>
      )}

      {/* Modal movimentação (todos) */}
      {mov && (
        <div className="modal-bg" onClick={() => setMov(null)}>
          <form className="card modal" onClick={(e) => e.stopPropagation()} onSubmit={confirmarMov}>
            <h3>{mov.tipo === 'entrada' ? 'Entrada' : 'Saída'} — {mov.produto.nome}</h3>
            <p>Estoque atual: <strong>{mov.produto.quantidade}</strong></p>
            <label>Quantidade
              <input type="number" min="1" value={qtdMov} onChange={(e) => setQtdMov(e.target.value)} autoFocus />
            </label>
            {erro && <p className="erro">{erro}</p>}
            <div className="modal-actions">
              <button type="button" className="btn-link" onClick={() => { setMov(null); setErro(''); }}>Cancelar</button>
              <button className="btn">Confirmar</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
