/*
  Warnings:

  - Added the required column `attempts` to the `plays` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `plays` ADD COLUMN `attempts` INTEGER NOT NULL;
