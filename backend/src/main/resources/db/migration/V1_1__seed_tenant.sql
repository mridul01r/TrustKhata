-- Creates the tenant and an owner login user that V4__seed_test_data.sql
-- assumes already exist (that migration seeds categories/products against
-- this fixed tenant id, but never created the tenant itself).
--
-- Login credentials for this seed user:
--   username: owner
--   password: Owner@123
INSERT INTO tenants (id, business_name, edition, created_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'My Test Shop', 'STANDARD', now())
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, tenant_id, username, password_hash, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    '11111111-1111-1111-1111-111111111111',
    'owner',
    '$2b$12$pSozn6KiCDqlzYSkMwgjpeA6RDXpktYwH1nIDReMn98ctY1jen4tO',
    'OWNER',
    true,
    now()
)
ON CONFLICT (tenant_id, username) DO NOTHING;