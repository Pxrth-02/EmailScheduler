-- CreateTable
CREATE TABLE `users` (
    `id` CHAR(36) NOT NULL,
    `google_id` VARCHAR(191) NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `avatar_url` VARCHAR(1024) NULL,
    `password_hash` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_google_id_key`(`google_id`),
    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `senders` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `smtp_host` VARCHAR(191) NOT NULL,
    `smtp_port` INTEGER NOT NULL,
    `smtp_user` VARCHAR(191) NOT NULL,
    `smtp_pass` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `senders_user_id_email_key`(`user_id`, `email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `campaigns` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `sender_id` CHAR(36) NOT NULL,
    `subject` VARCHAR(500) NOT NULL,
    `body_html` MEDIUMTEXT NOT NULL,
    `start_at` DATETIME(3) NOT NULL,
    `delay_ms` INTEGER NOT NULL,
    `hourly_limit` INTEGER NOT NULL,
    `total_count` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `campaigns_user_id_created_at_idx`(`user_id`, `created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `emails` (
    `id` CHAR(36) NOT NULL,
    `campaign_id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `sender_id` CHAR(36) NOT NULL,
    `to_email` VARCHAR(191) NOT NULL,
    `to_name` VARCHAR(191) NULL,
    `status` ENUM('scheduled', 'sending', 'sent', 'failed') NOT NULL DEFAULT 'scheduled',
    `scheduled_at` DATETIME(3) NOT NULL,
    `sent_at` DATETIME(3) NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `message_id` VARCHAR(191) NULL,
    `preview_url` VARCHAR(1024) NULL,
    `last_error` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `emails_user_id_status_scheduled_at_idx`(`user_id`, `status`, `scheduled_at`),
    INDEX `emails_user_id_status_sent_at_idx`(`user_id`, `status`, `sent_at`),
    INDEX `emails_sender_id_status_idx`(`sender_id`, `status`),
    INDEX `emails_campaign_id_idx`(`campaign_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `slack_connections` (
    `id` CHAR(36) NOT NULL,
    `user_id` CHAR(36) NOT NULL,
    `team_id` VARCHAR(191) NOT NULL,
    `team_name` VARCHAR(191) NOT NULL,
    `channel_name` VARCHAR(191) NOT NULL,
    `webhook_url` VARCHAR(1024) NOT NULL,
    `access_token` TEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `slack_connections_user_id_key`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `senders` ADD CONSTRAINT `senders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `campaigns` ADD CONSTRAINT `campaigns_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `senders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emails` ADD CONSTRAINT `emails_campaign_id_fkey` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emails` ADD CONSTRAINT `emails_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `emails` ADD CONSTRAINT `emails_sender_id_fkey` FOREIGN KEY (`sender_id`) REFERENCES `senders`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `slack_connections` ADD CONSTRAINT `slack_connections_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
