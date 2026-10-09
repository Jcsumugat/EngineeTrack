-- ============================================================
-- EngineeTrack - MySQL schema + seed data
-- Import with phpMyAdmin (Import tab) or:
--   mysql -u root -p < engineetrack.sql
-- Default admin:  admin@engineetrack.test  /  Admin@12345   (CHANGE AFTER FIRST LOGIN)
--
-- NOTE: Use EITHER this SQL file OR Laravel migrations, not both.
-- If you import this file, do NOT run `php artisan migrate`.
-- ============================================================

CREATE DATABASE IF NOT EXISTS `engineetrack`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE `engineetrack`;

SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `borrowings`;
DROP TABLE IF EXISTS `reservations`;
DROP TABLE IF EXISTS `equipment_stock_logs`;
DROP TABLE IF EXISTS `facilities`;
DROP TABLE IF EXISTS `equipment`;
DROP TABLE IF EXISTS `sessions`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `cache_locks`;
DROP TABLE IF EXISTS `cache`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `departments`;

SET FOREIGN_KEY_CHECKS = 1;

-- ------------------------------------------------------------
-- departments
-- ------------------------------------------------------------
CREATE TABLE `departments` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(150) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `departments_name_unique` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- users (admin creates all accounts; no public registration)
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `email_verified_at` TIMESTAMP NULL DEFAULT NULL,
  `password` VARCHAR(255) NOT NULL,
  `role` ENUM('admin','faculty_staff') NOT NULL DEFAULT 'faculty_staff',
  `department_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `remember_token` VARCHAR(100) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_role_index` (`role`),
  CONSTRAINT `users_department_id_fk` FOREIGN KEY (`department_id`)
    REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- Laravel support tables (auth + sessions + cache)
-- ------------------------------------------------------------
CREATE TABLE `password_reset_tokens` (
  `email` VARCHAR(255) NOT NULL,
  `token` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `sessions` (
  `id` VARCHAR(255) NOT NULL,
  `user_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `ip_address` VARCHAR(45) NULL DEFAULT NULL,
  `user_agent` TEXT NULL,
  `payload` LONGTEXT NOT NULL,
  `last_activity` INT NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sessions_user_id_index` (`user_id`),
  KEY `sessions_last_activity_index` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache` (
  `key` VARCHAR(255) NOT NULL,
  `value` MEDIUMTEXT NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `cache_locks` (
  `key` VARCHAR(255) NOT NULL,
  `owner` VARCHAR(255) NOT NULL,
  `expiration` INT NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- equipment (Inventory)
-- ------------------------------------------------------------
CREATE TABLE `equipment` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `total_quantity` INT UNSIGNED NOT NULL DEFAULT 0,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `equipment_name_index` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- audit trail for "add additional quantity"
CREATE TABLE `equipment_stock_logs` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `equipment_id` BIGINT UNSIGNED NOT NULL,
  `change` INT NOT NULL,
  `reason` VARCHAR(255) NULL DEFAULT NULL,
  `created_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `stock_logs_equipment_fk` FOREIGN KEY (`equipment_id`)
    REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `stock_logs_user_fk` FOREIGN KEY (`created_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- facilities
-- ------------------------------------------------------------
CREATE TABLE `facilities` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `capacity` INT UNSIGNED NULL DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- reservations (future use; does NOT deduct stock)
-- Exactly one of equipment_id / facility_id must be set.
-- ------------------------------------------------------------
CREATE TABLE `reservations` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `equipment_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `facility_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `date_from` DATETIME NOT NULL,
  `date_to` DATETIME NOT NULL,
  `purpose` VARCHAR(500) NULL DEFAULT NULL,
  `status` ENUM('pending','approved','disapproved','cancelled','released','completed')
    NOT NULL DEFAULT 'pending',
  `reviewed_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `remarks` VARCHAR(500) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reservations_status_index` (`status`),
  KEY `reservations_dates_index` (`date_from`,`date_to`),
  CONSTRAINT `reservations_user_fk` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reservations_equipment_fk` FOREIGN KEY (`equipment_id`)
    REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reservations_facility_fk` FOREIGN KEY (`facility_id`)
    REFERENCES `facilities` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `reservations_reviewer_fk` FOREIGN KEY (`reviewed_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `reservations_target_chk` CHECK (
    (`equipment_id` IS NOT NULL AND `facility_id` IS NULL) OR
    (`equipment_id` IS NULL AND `facility_id` IS NOT NULL)
  ),
  CONSTRAINT `reservations_dates_chk` CHECK (`date_to` >= `date_from`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ------------------------------------------------------------
-- borrowings (actual release/return of equipment)
-- ------------------------------------------------------------
CREATE TABLE `borrowings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `user_id` BIGINT UNSIGNED NOT NULL,
  `reservation_id` BIGINT UNSIGNED NULL DEFAULT NULL,
  `equipment_id` BIGINT UNSIGNED NOT NULL,
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1,
  `purpose` VARCHAR(500) NULL DEFAULT NULL,
  `borrowed_at` DATETIME NULL DEFAULT NULL,
  `due_at` DATETIME NULL DEFAULT NULL,
  `status` ENUM('pending','approved','disapproved','released','returned')
    NOT NULL DEFAULT 'pending',
  `reviewed_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `reviewed_at` TIMESTAMP NULL DEFAULT NULL,
  `released_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `released_at` DATETIME NULL DEFAULT NULL,
  `returned_at` DATETIME NULL DEFAULT NULL,
  `received_by` BIGINT UNSIGNED NULL DEFAULT NULL,
  `is_damaged` TINYINT(1) NOT NULL DEFAULT 0,
  `damaged_quantity` INT UNSIGNED NOT NULL DEFAULT 0,
  `damage_note` VARCHAR(500) NULL DEFAULT NULL,
  `created_at` TIMESTAMP NULL DEFAULT NULL,
  `updated_at` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `borrowings_status_index` (`status`),
  KEY `borrowings_returned_at_index` (`returned_at`),
  CONSTRAINT `borrowings_user_fk` FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `borrowings_reservation_fk` FOREIGN KEY (`reservation_id`)
    REFERENCES `reservations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `borrowings_equipment_fk` FOREIGN KEY (`equipment_id`)
    REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `borrowings_reviewer_fk` FOREIGN KEY (`reviewed_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `borrowings_releaser_fk` FOREIGN KEY (`released_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `borrowings_receiver_fk` FOREIGN KEY (`received_by`)
    REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- SEED DATA
-- ============================================================
INSERT INTO `departments` (`name`, `created_at`, `updated_at`) VALUES
  ('College of Computing and Information Sciences', NOW(), NOW()),
  ('College of Business and Management', NOW(), NOW()),
  ('College of Teacher Education', NOW(), NOW()),
  ('College of Fisheries', NOW(), NOW()),
  ('College of Local Government Administration', NOW(), NOW());

-- Default admin account. Password: Admin@12345
INSERT INTO `users` (`name`, `email`, `password`, `role`, `department_id`, `created_at`, `updated_at`) VALUES
  ('System Administrator', 'admin@engineetrack.test',
   '$2y$12$MSN/9S.yEs8JGVrAEBrTcuhJMPDFriOXmWMTzL8uzhCFrQ7Bun2Fe',
   'admin', NULL, NOW(), NOW());

-- Sample data (delete if not needed)
INSERT INTO `equipment` (`name`, `description`, `total_quantity`, `created_at`, `updated_at`) VALUES
  ('Projector', 'LCD projector', 5, NOW(), NOW()),
  ('Extension Cord', '5-meter extension cord', 10, NOW(), NOW()),
  ('Microphone', 'Wireless microphone', 4, NOW(), NOW());

INSERT INTO `facilities` (`name`, `description`, `capacity`, `created_at`, `updated_at`) VALUES
  ('Function Hall', 'Main function hall', 150, NOW(), NOW()),
  ('Computer Laboratory 1', 'Lab with 40 units', 40, NOW(), NOW());
