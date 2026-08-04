ALTER TABLE sale_items
    ADD COLUMN purchase_price NUMERIC(12, 2);

UPDATE sale_items si
SET purchase_price = p.purchase_price
FROM products p
WHERE si.product_id = p.id
  AND si.purchase_price IS NULL;