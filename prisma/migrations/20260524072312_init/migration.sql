/*
  Warnings:

  - Added the required column `answer` to the `plays` table without a default value. This is not possible if the table is not empty.
  - Added the required column `correct` to the `plays` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `plays` ADD COLUMN `answer` INTEGER NOT NULL,
    ADD COLUMN `correct` BOOLEAN NOT NULL;
