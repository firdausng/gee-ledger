-- Custom migration: Replace single 'address' TEXT column with 6 structured address columns
-- on businesses, contacts, and locations tables.
-- Uses NULL for address_line1 if the old address column doesn't exist (e.g. db:push).

-- ─── Businesses ──────────────────────────────────────────────────────────────

CREATE TABLE businesses_new (
    id TEXT PRIMARY KEY NOT NULL,
    organization_id TEXT,
    name TEXT NOT NULL,
    description TEXT,
    currency TEXT NOT NULL DEFAULT 'USD',
    address_line1 TEXT,
    address_line2 TEXT,
    address_city TEXT,
    address_state TEXT,
    address_postal_code TEXT,
    address_country TEXT,
    phone TEXT,
    tax_id TEXT,
    registration_no TEXT,
    vat_no TEXT,
    website TEXT,
    email TEXT,
    company_size TEXT,
    industry TEXT,
    classification TEXT,
    logo_r2_key TEXT,
    next_invoice_no INTEGER NOT NULL DEFAULT 1,
    next_receipt_no INTEGER NOT NULL DEFAULT 1,
    next_quote_no INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    deleted_at TEXT,
    deleted_by TEXT
);

INSERT INTO businesses_new (
    id, organization_id, name, description, currency,
    address_line1, address_line2, address_city, address_state, address_postal_code, address_country,
    phone, tax_id, registration_no, vat_no, website, email,
    company_size, industry, classification, logo_r2_key,
    next_invoice_no, next_receipt_no, next_quote_no,
    created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
)
SELECT
    id, organization_id, name, description, currency,
    NULL, NULL, NULL, NULL, NULL, NULL,
    phone, tax_id, registration_no, vat_no, website, email,
    company_size, industry, classification, logo_r2_key,
    next_invoice_no, next_receipt_no, next_quote_no,
    created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
FROM businesses;

DROP TABLE businesses;
ALTER TABLE businesses_new RENAME TO businesses;
CREATE INDEX businesses_org_deleted_idx ON businesses (organization_id, deleted_at);

-- ─── Contacts ────────────────────────────────────────────────────────────────

CREATE TABLE contacts_new (
    id TEXT PRIMARY KEY NOT NULL,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    address_city TEXT,
    address_state TEXT,
    address_postal_code TEXT,
    address_country TEXT,
    tax_id TEXT,
    default_currency TEXT,
    is_client INTEGER NOT NULL DEFAULT 0,
    is_supplier INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    deleted_at TEXT,
    deleted_by TEXT
);

INSERT INTO contacts_new (
    id, business_id, name, email, phone,
    address_line1, address_line2, address_city, address_state, address_postal_code, address_country,
    tax_id, default_currency, is_client, is_supplier,
    created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
)
SELECT
    id, business_id, name, email, phone,
    NULL, NULL, NULL, NULL, NULL, NULL,
    tax_id, default_currency, 0, 0,
    created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
FROM contacts;

DROP TABLE contacts;
ALTER TABLE contacts_new RENAME TO contacts;
CREATE INDEX contacts_biz_deleted_idx ON contacts (business_id, deleted_at);

-- ─── Locations ───────────────────────────────────────────────────────────────

CREATE TABLE locations_new (
    id TEXT PRIMARY KEY NOT NULL,
    business_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    address_line1 TEXT,
    address_line2 TEXT,
    address_city TEXT,
    address_state TEXT,
    address_postal_code TEXT,
    address_country TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    created_by TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    deleted_at TEXT,
    deleted_by TEXT
);

INSERT INTO locations_new (
    id, business_id, name, type,
    address_line1, address_line2, address_city, address_state, address_postal_code, address_country,
    is_active, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
)
SELECT
    id, business_id, name, type,
    NULL, NULL, NULL, NULL, NULL, NULL,
    is_active, created_at, created_by, updated_at, updated_by, deleted_at, deleted_by
FROM locations;

DROP TABLE locations;
ALTER TABLE locations_new RENAME TO locations;
CREATE INDEX locations_business_deleted_idx ON locations (business_id, deleted_at);
