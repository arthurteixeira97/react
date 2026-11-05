import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const usuarios = [
    { nome: 'Administrador', email: 'admin@estoque.com', senha: 'admin123', perfil: 'admin' },
    { nome: 'Usuário Padrão', email: 'user@estoque.com', senha: 'user123', perfil: 'padrao' },
  ];
  for (const { senha, ...u } of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, senhaHash: await bcrypt.hash(senha, 10) },
    });
  }

  const produtos = [
    { nome: 'Mouse USB', sku: 'MOU-001', categoria: 'Periféricos', quantidade: 25, minimo: 5, preco: 39.9 },
    { nome: 'Teclado ABNT2', sku: 'TEC-001', categoria: 'Periféricos', quantidade: 3, minimo: 5, preco: 89.9 },
    { nome: 'Cabo HDMI 2m', sku: 'CAB-002', categoria: 'Cabos', quantidade: 40, minimo: 10, preco: 24.5 },
  ];
  for (const p of produtos) {
    await prisma.produto.upsert({ where: { sku: p.sku }, update: {}, create: p });
  }

  console.log('Seed concluído.');
}

main().finally(() => prisma.$disconnect());
