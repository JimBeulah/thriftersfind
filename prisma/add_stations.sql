-- Create stations table
CREATE TABLE IF NOT EXISTS `stations` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `location` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `contactNumber` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert initial station data
INSERT INTO `stations` (`id`, `name`, `location`, `type`, `contactNumber`, `isActive`, `createdAt`, `updatedAt`) VALUES
('st_montevista_001', 'Montevista Courier Station', 'Montevista, Davao de Oro', 'courier', '+63 912 345 6789', true, NOW(3), NOW(3)),
('st_nabunturan_001', 'Nabunturan Pickup Point', 'Nabunturan, Davao de Oro', 'pickup', '+63 912 345 6790', true, NOW(3), NOW(3)),
('st_compostela_001', 'Compostela Courier & Pickup', 'Compostela, Davao de Oro', 'courier', '+63 912 345 6791', true, NOW(3), NOW(3));
