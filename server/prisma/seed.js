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
    { nome: 'Vestido Floral Midi M', sku: 'VES-001', categoria: 'Vestidos', quantidade: 18, minimo: 5, preco: 149.9 },
    { nome: 'Blusa de Alfaiataria P', sku: 'BLU-001', categoria: 'Blusas', quantidade: 4, minimo: 5, preco: 99.9 },
    { nome: 'Calça Wide Leg G', sku: 'CAL-001', categoria: 'Calças', quantidade: 22, minimo: 6, preco: 179.9 },
    { nome: 'Saia Plissada M', sku: 'SAI-001', categoria: 'Saias', quantidade: 15, minimo: 5, preco: 119.9 },
    { nome: 'Jaqueta Jeans P', sku: 'JAQ-001', categoria: 'Jaquetas', quantidade: 9, minimo: 4, preco: 229.9 },
    { nome: 'Conjunto Cropped e Shorts P', sku: 'CON-001', categoria: 'Conjuntos', quantidade: 12, minimo: 5, preco: 159.9 },
    { nome: 'Macacão Pantalona M', sku: 'MAC-001', categoria: 'Macacões', quantidade: 7, minimo: 4, preco: 199.9 },
    { nome: 'Cardigã Tricot G', sku: 'CAR-001', categoria: 'Tricot', quantidade: 20, minimo: 6, preco: 139.9 },
  ];
  for (const p of produtos) {
    await prisma.produto.upsert({ where: { sku: p.sku }, update: {}, create: p });
  }

  console.log('Seed concluído.');
}

main().finally(() => prisma.$disconnect());
