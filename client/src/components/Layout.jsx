import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="layout">
      <header className="topbar">
        <strong>📦 Estoque</strong>
        <nav>
          <NavLink to="/" end>Produtos</NavLink>
          <NavLink to="/movimentacoes">Movimentações</NavLink>
          {isAdmin && <NavLink to="/usuarios">Usuários</NavLink>}
        </nav>
        <div className="user">
          <span>{user.nome}</span>
          <span className={`badge ${user.perfil}`}>{isAdmin ? 'Admin' : 'Padrão'}</span>
          <button className="btn-link" onClick={logout}>Sair</button>
        </div>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
