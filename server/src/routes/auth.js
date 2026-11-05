import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { autenticar } from '../middleware/auth.js';

const router = Router();

router.post('/login', async (req, res) => {
  const { email, senha } = req.body ?? {};
  if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha' });

  const u = await prisma.usuario.findUnique({ where: { email } });
  if (!u || !u.ativo || !(await bcrypt.compare(senha, u.senhaHash))) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos' });
  }

  const user = { id: u.id, nome: u.nome, email: u.email, perfil: u.perfil };
  const token = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
  res.json({ token, user });
});

router.get('/me', autenticar, (req, res) => res.json(req.user));

export default router;
