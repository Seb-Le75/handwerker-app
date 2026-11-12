CREATE SCHEMA IF NOT EXISTS app_private;

COMMENT ON SCHEMA app_private IS
  'Private application objects. Domain tables are introduced only after the tenancy ADR is accepted.';
