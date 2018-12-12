--- Add info about used payment provider ---
ALTER TABLE nk2_orders ADD payment_provider VARCHAR(20) DEFAULT NULL;

--- Remove unused rows from orders table ---
ALTER TABLE nk2_orders DROP COLUMN reserved_until;
ALTER TABLE nk2_orders DROP COLUMN reserved_session_id;