CREATE TABLE customers (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    address VARCHAR(255),
    gstin VARCHAR(20),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_customers_tenant ON customers(tenant_id);

ALTER TABLE sales ADD COLUMN customer_id UUID;
ALTER TABLE sales ADD COLUMN customer_name VARCHAR(150);

CREATE TABLE customer_payments (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    method VARCHAR(20) NOT NULL,
    note VARCHAR(255),
    created_by UUID,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_customer_payments_customer ON customer_payments(customer_id);