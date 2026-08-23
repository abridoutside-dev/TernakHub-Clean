-- 20260823000006_drug_commercial_products_service_role_grants.sql
-- Grant service_role access to drug_brands and drug_commercial_products
-- so backend services can read/write reference data.

GRANT SELECT ON TABLE drug_brands TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_brands TO service_role;

GRANT SELECT ON TABLE drug_commercial_products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE drug_commercial_products TO service_role;
