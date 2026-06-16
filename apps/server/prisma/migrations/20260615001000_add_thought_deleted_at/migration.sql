-- AlterTable
ALTER TABLE `thoughts` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `thoughts_deletedAt_createdAt_idx` ON `thoughts`(`deletedAt`, `createdAt`);
