-- CreateTable
CREATE TABLE `cat_media` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NOT NULL,
    `url` VARCHAR(500) NOT NULL,
    `key` VARCHAR(500) NOT NULL,
    `type` ENUM('image', 'video', 'file') NOT NULL,
    `size` INTEGER NOT NULL,
    `cat` ENUM('danhuang', 'liuliu') NOT NULL,
    `shotAt` DATETIME(3) NULL,
    `note` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cat_media_cat_shotAt_createdAt_idx`(`cat`, `shotAt`, `createdAt`),
    INDEX `cat_media_type_createdAt_idx`(`type`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
