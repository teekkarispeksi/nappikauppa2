START TRANSACTION;
ALTER TABLE `nk2_orders`  ADD `payment_provider` VARCHAR(50) DEFAULT NULL;
ALTER TABLE `nk2_orders` DROP `reserved_until`;
ALTER TABLE `nk2_orders` DROP `reserved_session_id`;
UPDATE `nk2_orders` SET `payment_provider` = "paytrail";
COMMIT;