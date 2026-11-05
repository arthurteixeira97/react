import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';

// Montado com autorizar('admin') no index.js — todas as rotas são só de admin.
const router = Router();

const campos = { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true };

router.get('/', async (_req, res) => {
  res.json(await prisma.usuario.findMany({ select: campos, orderBy: { nome: 'asc' } }));
});

router.post('/', async (req, res) => {
  const { nome, email, senha, perfil = 'padrao' } = req.body ?? {};
  if (!nome?.trim() || !email?.trim() || !senha) return res.status(400).json({ erro: 'Preencha nome, e-mail e senha' });
  if (senha.length < 6) return res.status(400).json({ erro: 'Senha deve ter ao menos 6 caracteres' });
  if (!['admin', 'padrao'].includes(perfil)) return res.status(400).json({ erro: 'Perfil inválido' });

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return res.status(409).json({ erro: 'E-mail já cadastrado' });

  const u = await prisma.usuario.create({
    data: { nome: nome.trim(), email: email.trim(), perfil, senhaHash: await bcrypt.hash(senha, 10) },
    select: campos,
  });
  res.status(201).json(u);
});

// Desativa em vez de apagar, pra não perder o histórico de movimentações.
router.delete('/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.user.id) return res.status(400).json({ erro: 'Você não pode remover a si mesmo' });
  await prisma.usuario.update({ where: { id }, data: { ativo: false } });
  res.status(204).end();
});

export default router;
