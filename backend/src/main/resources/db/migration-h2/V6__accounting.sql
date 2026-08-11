CREATE TABLE expense_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(100) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_expense_category_tenant_name UNIQUE (tenant_id, name)
);

CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    category_id UUID NOT NULL REFERENCES expense_categories(id),
    amount NUMERIC(12, 2) NOT NULL,
    note VARCHAR(500),
    expense_date DATE NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);

-- Seed default categories per existing tenant
INSERT INTO expense_categories (tenant_id, name, is_default)
SELECT t.id, cat.name, TRUE
FROM tenants t
CROSS JOIN (VALUES ('Rent'), ('Salaries'), ('Utilities'), ('Miscellaneous')) AS cat(name);
