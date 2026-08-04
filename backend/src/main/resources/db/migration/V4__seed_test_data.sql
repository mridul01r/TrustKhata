-- Test categories for the existing seed tenant
INSERT INTO categories (id, tenant_id, name, description, is_active, created_at, updated_at)
VALUES
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Beverages', 'Soft drinks, juices, water', true, now(), now()),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Snacks', 'Packaged snacks and namkeen', true, now(), now()),
    (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 'Groceries', 'Staples and daily essentials', true, now(), now());

-- Test products, linked to the categories just created via a name lookup
INSERT INTO products (
    id, tenant_id, category_id, sku, name, description, unit, hsn_code,
    gst_rate, purchase_price, selling_price, stock_quantity, reorder_level,
    is_active, created_at, updated_at
)
SELECT
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    c.id,
    p.sku, p.name, p.description, p.unit, p.hsn_code,
    p.gst_rate, p.purchase_price, p.selling_price, p.stock_quantity, p.reorder_level,
    true, now(), now()
FROM (
    VALUES
        ('COLA-500', 'Cola 500ml', 'Chilled soft drink', 'PCS', '2202', 12.00, 25.00, 40.00, 50, 10, 'Beverages'),
        ('WATER-1L', 'Mineral Water 1L', 'Packaged drinking water', 'PCS', '2201', 5.00, 12.00, 20.00, 100, 20, 'Beverages'),
        ('CHIPS-100', 'Potato Chips 100g', 'Salted potato chips', 'PCS', '1905', 12.00, 18.00, 30.00, 60, 15, 'Snacks'),
        ('NAMKEEN-200', 'Mixture Namkeen 200g', 'Spiced Indian snack mix', 'PCS', '2106', 12.00, 30.00, 50.00, 40, 10, 'Snacks'),
        ('RICE-1KG', 'Basmati Rice 1kg', 'Premium long-grain rice', 'KG', '1006', 5.00, 70.00, 95.00, 80, 20, 'Groceries'),
        ('ATTA-5KG', 'Wheat Atta 5kg', 'Whole wheat flour', 'KG', '1101', 5.00, 180.00, 220.00, 30, 5, 'Groceries')
) AS p(sku, name, description, unit, hsn_code, gst_rate, purchase_price, selling_price, stock_quantity, reorder_level, category_name)
JOIN categories c
    ON c.tenant_id = '11111111-1111-1111-1111-111111111111'
    AND c.name = p.category_name;