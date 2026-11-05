import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

const VAZIO = { nome: '', email: '', senha: '', perfil: 'padrao' };

export default function Usuarios() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState(VAZIO);
  const [erro, setErro] = useState('');

  const carregar = () => api.listarUsuarios().then((l) => setUsuarios(l.filter((u) => u.ativo)));
  useEffect(() => { carregar(); }, []);

  async function criar(e) {
    e.preventDefault();
    setErro('');
    try {
      await api.criarUsuario(form);
      setForm(VAZIO);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  async function excluir(u) {
    if (!confirm(`Desativar ${u.nome}?`)) return;
    try {
      await api.excluirUsuario(u.id);
      carregar();
    } catch (err) {
      setErro(err.message);
    }
  }

  const campo = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  return (
    <section>
      <div className="page-header"><h2>Usuários</h2></div>

      <form className="card form-inline" onSubmit={criar}>
        <input placeholder="Nome" required {...campo('nome')} />
        <input placeholder="E-mail" type="email" required {...campo('email')} />
        <input placeholder="Senha" type="password" required minLength={6} {...campo('senha')} />
        <select {...campo('perfil')}>
          <option value="padrao">Padrão</option>
          <option value="admin">Administrador</option>
        </select>
        <button className="btn">Adicionar</button>
        {erro && <p className="erro">{erro}</p>}
      </form>

      <div className="card table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th></th></tr></thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id}>
                <td>{u.nome}</td>
                <td>{u.email}</td>
                <td><span className={`badge ${u.perfil}`}>{u.perfil === 'admin' ? 'Admin' : 'Padrão'}</span></td>
                <td className="row-actions">
                  {u.id !== user.id && (
                    <button className="btn-sm danger" onClick={() => excluir(u)}>Desativar</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
