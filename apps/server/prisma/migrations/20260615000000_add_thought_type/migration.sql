-- AlterTable
ALTER TABLE `thoughts` ADD COLUMN `type` ENUM('daily', 'sport', 'diet', 'investment', 'literature', 'idea') NOT NULL DEFAULT 'daily';

-- CreateIndex
CREATE INDEX `thoughts_type_createdAt_idx` ON `thoughts`(`type`, `createdAt`);
