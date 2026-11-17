-- CreateEnum
CREATE TYPE "Tamanho" AS ENUM ('PP', 'P', 'M', 'G', 'GG');

-- AlterTable
ALTER TABLE "Produto" ADD COLUMN     "tamanho" "Tamanho";
