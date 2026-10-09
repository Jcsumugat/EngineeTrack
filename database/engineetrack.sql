-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Oct 09, 2026 at 05:25 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `engineetrack`
--

-- --------------------------------------------------------

--
-- Table structure for table `borrowings`
--

CREATE TABLE `borrowings` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `reservation_id` bigint(20) UNSIGNED DEFAULT NULL,
  `equipment_id` bigint(20) UNSIGNED NOT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `purpose` varchar(500) DEFAULT NULL,
  `borrowed_at` datetime DEFAULT NULL,
  `due_at` datetime DEFAULT NULL,
  `status` enum('pending','approved','disapproved','released','returned') NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `released_by` bigint(20) UNSIGNED DEFAULT NULL,
  `released_at` datetime DEFAULT NULL,
  `returned_at` datetime DEFAULT NULL,
  `received_by` bigint(20) UNSIGNED DEFAULT NULL,
  `is_damaged` tinyint(1) NOT NULL DEFAULT 0,
  `damaged_quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `damage_note` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `borrowings`
--

INSERT INTO `borrowings` (`id`, `user_id`, `department_id`, `reservation_id`, `equipment_id`, `quantity`, `purpose`, `borrowed_at`, `due_at`, `status`, `reviewed_by`, `reviewed_at`, `released_by`, `released_at`, `returned_at`, `received_by`, `is_damaged`, `damaged_quantity`, `damage_note`, `created_at`, `updated_at`) VALUES
(2, 2, 1, NULL, 4, 10, NULL, '2026-10-08 03:50:34', '2026-10-09 12:00:00', 'returned', 1, '2026-10-07 19:48:07', 1, '2026-10-08 03:50:34', '2026-10-09 02:31:33', 1, 1, 1, 'Poor quality', '2026-10-07 19:47:33', '2026-10-08 18:31:33');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(150) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `created_at`, `updated_at`) VALUES
(1, 'College of Computing and Information Sciences', '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(2, 'College of Business and Management', '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(3, 'College of Teacher Education', '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(4, 'College of Fisheries', '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(5, 'College of Local Government Administration', '2026-10-06 15:46:17', '2026-10-06 15:46:17');

-- --------------------------------------------------------

--
-- Table structure for table `equipment`
--

CREATE TABLE `equipment` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `total_quantity` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipment`
--

INSERT INTO `equipment` (`id`, `name`, `description`, `total_quantity`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Projector', 'LCD projector', 5, 1, '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(2, 'Extension Cord', '5-meter extension cord', 10, 1, '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(3, 'Microphone', 'Wireless microphone', 4, 1, '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(4, 'Mono Blocks Chair', 'RFC', 299, 1, '2026-10-06 20:33:21', '2026-10-08 18:31:33');

-- --------------------------------------------------------

--
-- Table structure for table `equipment_stock_logs`
--

CREATE TABLE `equipment_stock_logs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `equipment_id` bigint(20) UNSIGNED NOT NULL,
  `change` int(11) NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `created_by` bigint(20) UNSIGNED DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `equipment_stock_logs`
--

INSERT INTO `equipment_stock_logs` (`id`, `equipment_id`, `change`, `reason`, `created_by`, `created_at`, `updated_at`) VALUES
(1, 4, 300, 'Initial stock', 1, '2026-10-06 20:33:21', '2026-10-06 20:33:21'),
(2, 4, -1, 'Damaged on return (borrowing #2)', 1, '2026-10-08 18:31:33', '2026-10-08 18:31:33');

-- --------------------------------------------------------

--
-- Table structure for table `facilities`
--

CREATE TABLE `facilities` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `capacity` int(10) UNSIGNED DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `facilities`
--

INSERT INTO `facilities` (`id`, `name`, `description`, `capacity`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Function Hall', 'Main function hall', 150, 1, '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(2, 'Computer Laboratory 1', 'Lab with 40 units', 40, 1, '2026-10-06 15:46:17', '2026-10-06 15:46:17');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `reservations`
--

CREATE TABLE `reservations` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `user_id` bigint(20) UNSIGNED NOT NULL,
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `equipment_id` bigint(20) UNSIGNED DEFAULT NULL,
  `facility_id` bigint(20) UNSIGNED DEFAULT NULL,
  `quantity` int(10) UNSIGNED NOT NULL DEFAULT 1,
  `date_from` datetime NOT NULL,
  `date_to` datetime NOT NULL,
  `purpose` varchar(500) DEFAULT NULL,
  `status` enum('pending','approved','disapproved','cancelled','released','completed') NOT NULL DEFAULT 'pending',
  `reviewed_by` bigint(20) UNSIGNED DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `remarks` varchar(500) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ;

--
-- Dumping data for table `reservations`
--

INSERT INTO `reservations` (`id`, `user_id`, `department_id`, `equipment_id`, `facility_id`, `quantity`, `date_from`, `date_to`, `purpose`, `status`, `reviewed_by`, `reviewed_at`, `remarks`, `created_at`, `updated_at`) VALUES
(2, 2, 1, NULL, 2, 1, '2026-10-09 12:00:00', '2026-10-09 14:00:00', 'Laboratory for BSIS 4B', 'released', 1, '2026-10-08 19:06:20', NULL, '2026-10-08 19:06:00', '2026-10-08 19:06:28');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','faculty_staff') NOT NULL DEFAULT 'faculty_staff',
  `department_id` bigint(20) UNSIGNED DEFAULT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `role`, `department_id`, `remember_token`, `created_at`, `updated_at`) VALUES
(1, 'System Administrator', 'admin@gmail.com', NULL, '$2y$12$4jJkk.e5AKZZ6G.VwaytnOeJr/KiBd7IAOmyiAzPGUrcItv9OyXda', 'admin', NULL, '17F0PJ1DmrLiaVs9XJBQnjWekenyo9BSdOq8WXB554iGX4g2xFo286DyZQ2N', '2026-10-06 15:46:17', '2026-10-06 15:46:17'),
(2, 'Kier Christine Gonzales', 'staff@gmail.com', NULL, '$2y$12$60TvcpxXRMR.VTi3O567..gRi/c9qrFfS9tBZ03EdafZSn7097dxS', 'faculty_staff', 1, NULL, '2026-10-07 06:01:10', '2026-10-07 06:01:10');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `borrowings_status_index` (`status`),
  ADD KEY `borrowings_returned_at_index` (`returned_at`),
  ADD KEY `borrowings_reservation_fk` (`reservation_id`),
  ADD KEY `borrowings_equipment_fk` (`equipment_id`),
  ADD KEY `borrowings_reviewer_fk` (`reviewed_by`),
  ADD KEY `borrowings_releaser_fk` (`released_by`),
  ADD KEY `borrowings_receiver_fk` (`received_by`),
  ADD KEY `borrowings_department_id_index` (`department_id`),
  ADD KEY `borrowings_user_fk` (`user_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `departments_name_unique` (`name`);

--
-- Indexes for table `equipment`
--
ALTER TABLE `equipment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `equipment_name_index` (`name`);

--
-- Indexes for table `equipment_stock_logs`
--
ALTER TABLE `equipment_stock_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `stock_logs_equipment_fk` (`equipment_id`),
  ADD KEY `stock_logs_user_fk` (`created_by`);

--
-- Indexes for table `facilities`
--
ALTER TABLE `facilities`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reservations_status_index` (`status`),
  ADD KEY `reservations_dates_index` (`date_from`,`date_to`),
  ADD KEY `reservations_equipment_fk` (`equipment_id`),
  ADD KEY `reservations_reviewer_fk` (`reviewed_by`),
  ADD KEY `reservations_department_id_index` (`department_id`),
  ADD KEY `reservations_user_fk` (`user_id`),
  ADD KEY `reservations_facility_fk` (`facility_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`),
  ADD KEY `users_role_index` (`role`),
  ADD KEY `users_department_id_fk` (`department_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `borrowings`
--
ALTER TABLE `borrowings`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `departments`
--
ALTER TABLE `departments`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `equipment`
--
ALTER TABLE `equipment`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `equipment_stock_logs`
--
ALTER TABLE `equipment_stock_logs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `facilities`
--
ALTER TABLE `facilities`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `borrowings`
--
ALTER TABLE `borrowings`
  ADD CONSTRAINT `borrowings_department_fk` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `borrowings_equipment_fk` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `borrowings_receiver_fk` FOREIGN KEY (`received_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `borrowings_releaser_fk` FOREIGN KEY (`released_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `borrowings_reservation_fk` FOREIGN KEY (`reservation_id`) REFERENCES `reservations` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `borrowings_reviewer_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `borrowings_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `equipment_stock_logs`
--
ALTER TABLE `equipment_stock_logs`
  ADD CONSTRAINT `stock_logs_equipment_fk` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `stock_logs_user_fk` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_department_fk` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `reservations_equipment_fk` FOREIGN KEY (`equipment_id`) REFERENCES `equipment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `reservations_facility_fk` FOREIGN KEY (`facility_id`) REFERENCES `facilities` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `reservations_reviewer_fk` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `reservations_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_department_id_fk` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
