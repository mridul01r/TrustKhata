-- Tracks the next invoice number per tenant per financial year (Apr-Mar)
CREATE TABLE invoice_sequences (
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    financial_year VARCHAR(9) NOT NULL, -- e.g. 'FY2526'
    next_number INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (tenant_id, financial_year)
);

-- A completed (or cancelled) sale/invoice
CREATE TABLE sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    invoice_number VARCHAR(30) NOT NULL,
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    discount_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(20) NOT NULL DEFAULT 'COMPLETED',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT uq_sale_tenant_invoice UNIQUE (tenant_id, invoice_number)
);

CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_tenant_created_at ON sales(tenant_id, created_at);

-- Line items for a sale - snapshots product name/price/gst at time of sale
CREATE TABLE sale_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    product_name VARCHAR(150) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    quantity NUMERIC(12,3) NOT NULL,
    unit_price NUMERIC(12,2) NOT NULL,
    gst_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    line_subtotal NUMERIC(12,2) NOT NULL,
    line_tax NUMERIC(12,2) NOT NULL,
    line_total NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_sale_items_sale_id ON sale_items(sale_id);

-- Payments applied to a sale - supports split tender (e.g. part cash, part UPI)
CREATE TABLE sale_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    method VARCHAR(20) NOT NULL,
    amount NUMERIC(12,2) NOT NULL
);

CREATE INDEX idx_sale_payments_sale_id ON sale_payments(sale_id);
