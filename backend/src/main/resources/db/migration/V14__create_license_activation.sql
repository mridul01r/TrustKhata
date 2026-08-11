CREATE TABLE license_activation (
    id BIGSERIAL PRIMARY KEY,
    license_key TEXT NOT NULL,
    activated_at TIMESTAMP NOT NULL
);
