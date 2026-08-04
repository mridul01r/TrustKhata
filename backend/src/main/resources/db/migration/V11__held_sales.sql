CREATE TABLE held_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    created_by UUID NOT NULL,
    customer_id UUID,
    is_interstate BOOLEAN NOT NULL DEFAULT FALSE,
    items JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX idx_held_sales_tenant ON held_sales (tenant_id);