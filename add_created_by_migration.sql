-- Add createdBy column to customers table
ALTER TABLE `customers` ADD COLUMN `createdBy` JSON NULL AFTER `role`;

-- Add createdBy column to batches table
ALTER TABLE `batches` ADD COLUMN `createdBy` JSON NULL AFTER `totalSales`;

-- Add createdBy column to products table
ALTER TABLE `products` ADD COLUMN `createdBy` JSON NULL AFTER `batchId`;
