import { Router } from 'express';
import { prisma } from '../db.js';
import { autorizar } from '../middleware/auth.js';

const router = Router();

// Converte Decimal -> number e esconde o preço de quem não é admin.
const formatar = (p, isAdmin) => {
  const { preco, ...resto } = p;
  return isAdmin ? { ...resto, preco: Number(preco) } : resto;
};

function validar(body) {
  const { nome, sku, categoria, quantidade, minimo, preco } = body ?? {};
  if (!nome?.trim() || !sku?.trim()) return { erro: 'Nome e SKU são obrigatórios' };
  const nums = { quantidade: Number(quantidade ?? 0), minimo: Number(minimo ?? 0), preco: Number(preco ?? 0) };
  if (Object.values(nums).some((n) => !Number.isFinite(n) || n < 0)) return { erro: 'Valores numéricos inválidos' };
  return { dados: { nome: nome.trim(), sku: sku.trim(), categoria: categoria?.trim() || null, ...nums } };
}

// Todos os perfis
router.get('/', async (req, res) => {
  const lista = await prisma.produto.findMany({ orderBy: { nome: 'asc' } });
  res.json(lista.map((p) => formatar(p, req.user.perfil === 'admin')));
});

// Só admin
router.post('/', autorizar('admin'), async (req, res) => {
  const { erro, dados } = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const p = await prisma.produto.create({ data: dados });
  res.status(201).json(formatar(p, true));
});

router.put('/:id', autorizar('admin'), async (req, res) => {
  const { erro, dados } = validar(req.body);
  if (erro) return res.status(400).json({ erro });
  const p = await prisma.produto.update({ where: { id: Number(req.params.id) }, data: dados });
  res.json(formatar(p, true));
});

router.delete('/:id', autorizar('admin'), async (req, res) => {
  await prisma.produto.delete({ where: { id: Number(req.params.id) } });
  res.status(204).end();
});

export default router;
