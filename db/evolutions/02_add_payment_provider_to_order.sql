START TRANSACTION;
ALTER TABLE `nk2_orders` MODIFY COLUMN `payment_id` VARCHAR(100) DEFAULT NULL;
ALTER TABLE `nk2_orders` ADD `payment_provider` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `nk2_orders` DROP `reserved_until`;
ALTER TABLE `nk2_orders` DROP `reserved_session_id`;
-- This is just for migration, as payment_provider cannot be null
-- UPDATE `nk2_orders` SET `payment_provider` = "paytrail";
COMMIT;
