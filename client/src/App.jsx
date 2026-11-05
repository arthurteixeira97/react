import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Produtos from './pages/Produtos';
import Movimentacoes from './pages/Movimentacoes';
import Usuarios from './pages/Usuarios';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      {/* Qualquer usuário logado */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Produtos />} />
          <Route path="/movimentacoes" element={<Movimentacoes />} />

          {/* Só admin */}
          <Route element={<ProtectedRoute perfis={['admin']} />}>
            <Route path="/usuarios" element={<Usuarios />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
