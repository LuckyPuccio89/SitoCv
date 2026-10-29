-- Palestra SQL: utente sandbox PostgreSQL (rieseguibile, idempotente).
-- Scritture solo su lab_* + SELECT su azienda_demo.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lab_builder') THEN
    CREATE ROLE lab_builder LOGIN PASSWORD 'LabBui1d3r_X9q2';
  END IF;
END$$;
GRANT CONNECT ON DATABASE postgres TO lab_builder;
-- privilegi su schemi lab_* gestiti a runtime; qui solo base
GRANT USAGE ON SCHEMA public TO lab_builder;
