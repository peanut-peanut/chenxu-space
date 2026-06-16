-- AlterTable
ALTER TABLE `thoughts`
  ADD COLUMN `sportType` ENUM('basketball', 'fitness', 'swimming') NULL,
  ADD COLUMN `sportDuration` INTEGER NULL,
  ADD COLUMN `sportCalories` INTEGER NULL,
  ADD COLUMN `dislikesCount` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `thought_dislikes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `thoughtId` INTEGER NOT NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `thought_dislikes_thoughtId_userId_key`(`thoughtId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `thought_dislikes` ADD CONSTRAINT `thought_dislikes_thoughtId_fkey` FOREIGN KEY (`thoughtId`) REFERENCES `thoughts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `thought_dislikes` ADD CONSTRAINT `thought_dislikes_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
