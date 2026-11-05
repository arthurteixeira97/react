import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// Admin vê tudo; padrão só as próprias.
router.get('/', async (req, res) => {
  const where = req.user.perfil === 'admin' ? {} : { usuarioId: req.user.id };
  const movs = await prisma.movimentacao.findMany({
    where,
    orderBy: { data: 'desc' },
    take: 500,
    include: { produto: { select: { nome: true } }, usuario: { select: { nome: true } } },
  });
  res.json(movs.map((m) => ({
    id: m.id, tipo: m.tipo, quantidade: m.quantidade, data: m.data,
    produtoId: m.produtoId, produto: m.produto.nome, usuario: m.usuario.nome,
  })));
});

// Todos os perfis podem movimentar. Usuário vem do token, não do body.
router.post('/', async (req, res) => {
  const produtoId = Number(req.body?.produtoId);
  const quantidade = Number(req.body?.quantidade);
  const { tipo } = req.body ?? {};

  if (!['entrada', 'saida'].includes(tipo)) return res.status(400).json({ erro: 'Tipo inválido' });
  if (!Number.isInteger(quantidade) || quantidade <= 0) return res.status(400).json({ erro: 'Quantidade inválida' });

  try {
    // Transação: atualiza saldo e grava histórico juntos (ou nenhum dos dois).
    await prisma.$transaction(async (tx) => {
      const prod = await tx.produto.findUnique({ where: { id: produtoId } });
      if (!prod) throw Object.assign(new Error('Produto não encontrado'), { status: 404 });

      if (tipo === 'saida') {
        // updateMany com condição evita saldo negativo mesmo com duas saídas simultâneas
        const r = await tx.produto.updateMany({
          where: { id: produtoId, quantidade: { gte: quantidade } },
          data: { quantidade: { decrement: quantidade } },
        });
        if (r.count === 0) throw Object.assign(new Error('Estoque insuficiente'), { status: 400 });
      } else {
        await tx.produto.update({ where: { id: produtoId }, data: { quantidade: { increment: quantidade } } });
      }

      await tx.movimentacao.create({ data: { tipo, quantidade, produtoId, usuarioId: req.user.id } });
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ erro: e.message });
    throw e;
  }
});

export default router;
