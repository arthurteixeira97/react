import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';

export default function Movimentacoes() {
  const { isAdmin } = useAuth();
  const [movs, setMovs] = useState([]);

  // O backend já filtra: admin recebe tudo, padrão só as próprias.
  useEffect(() => { api.listarMovimentacoes().then(setMovs); }, []);

  return (
    <section>
      <div className="page-header">
        <h2>Movimentações {isAdmin ? '(todas)' : '(minhas)'}</h2>
      </div>
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Data</th><th>Produto</th><th>Tipo</th><th>Qtd.</th><th>Usuário</th></tr>
          </thead>
          <tbody>
            {movs.map((m) => (
              <tr key={m.id}>
                <td>{new Date(m.data).toLocaleString('pt-BR')}</td>
                <td>{m.produto}</td>
                <td><span className={`tag ${m.tipo}`}>{m.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td>
                <td>{m.quantidade}</td>
                <td>{m.usuario}</td>
              </tr>
            ))}
            {!movs.length && <tr><td colSpan={5} className="vazio">Nenhuma movimentação</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}
