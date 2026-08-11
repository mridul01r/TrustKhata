ALTER TABLE sale_items
    ADD COLUMN purchase_price NUMERIC(12, 2);

UPDATE sale_items
SET purchase_price = (
    SELECT p.purchase_price
    FROM products p
    WHERE p.id = sale_items.product_id
)
WHERE purchase_price IS NULL
  AND EXISTS (
    SELECT 1 FROM products p WHERE p.id = sale_items.product_id
  );
