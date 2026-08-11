-- One row per tenant, storing the business details that appear on every tax invoice
CREATE TABLE business_settings (
    tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
    business_name VARCHAR(150) NOT NULL DEFAULT '',
    gstin VARCHAR(15),
    address_line1 VARCHAR(150) DEFAULT '',
    address_line2 VARCHAR(150) DEFAULT '',
    city VARCHAR(80) DEFAULT '',
    state VARCHAR(80) DEFAULT '',
    pincode VARCHAR(10) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    email VARCHAR(150) DEFAULT '',
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Snapshot the HSN code at time of sale, same reasoning as product_name/unit_price/gst_rate:
-- a tax invoice must always show what was true when the sale happened, not today's product data.
ALTER TABLE sale_items ADD COLUMN hsn_code VARCHAR(20);
