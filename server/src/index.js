import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import os from 'node:os';
import { autenticar, autorizar } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import produtosRoutes from './routes/produtos.js';
import movRoutes from './routes/movimentacoes.js';
import usuariosRoutes from './routes/usuarios.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET não definido no .env');
  process.exit(1);
}

const app = express();
// CORS só importa pro front web; o app mobile não passa por CORS.
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
// Express 5: erros lançados em handlers async caem direto no handler de erro abaixo.

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/produtos', autenticar, produtosRoutes);
app.use('/api/movimentacoes', autenticar, movRoutes);
app.use('/api/usuarios', autenticar, autorizar('admin'), usuariosRoutes);

app.use((err, _req, res, _next) => {
  if (err.code === 'P2002') return res.status(409).json({ erro: 'Registro duplicado (ex.: SKU ou e-mail já existe)' });
  if (err.code === 'P2025') return res.status(404).json({ erro: 'Registro não encontrado' });
  console.error(err);
  res.status(500).json({ erro: 'Erro interno' });
});

const port = process.env.PORT || 3001;
// 0.0.0.0 = aceita conexões de outros aparelhos da rede (celular com Expo Go)
app.listen(port, '0.0.0.0', () => {
  console.log(`API rodando em http://localhost:${port}`);
  const ips = Object.values(os.networkInterfaces()).flat().filter((i) => i?.family === 'IPv4' && !i.internal);
  ips.forEach((i) => console.log(`  na rede: http://${i.address}:${port}/api`));
});
