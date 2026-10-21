-- Palestra SQL: utente sandbox (rieseguibile, idempotente).
-- Scritture solo su lab_* + SELECT su azienda_demo.
CREATE USER IF NOT EXISTS 'lab_builder'@'localhost' IDENTIFIED BY 'LabBui1d3r_X9q2';
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, DROP, REFERENCES, INDEX, ALTER ON `lab\_%`.* TO 'lab_builder'@'localhost';
GRANT SELECT ON azienda_demo.* TO 'lab_builder'@'localhost';
FLUSH PRIVILEGES;
