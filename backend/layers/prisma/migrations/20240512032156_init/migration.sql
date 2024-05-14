/*
  Warnings:

  - You are about to drop the `Invoices` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoices" DROP CONSTRAINT "Invoices_userId_fkey";

-- DropTable
DROP TABLE "Invoices";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Invoice" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" JSONB,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);
