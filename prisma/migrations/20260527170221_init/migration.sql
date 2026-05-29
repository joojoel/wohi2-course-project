/*
  Warnings:

  - Made the column `solved` on table `questions` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `questions` MODIFY `solved` BOOLEAN NOT NULL;
