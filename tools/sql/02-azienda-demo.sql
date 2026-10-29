-- azienda_demo: dati fittizi stile produzione azienda TPL (Pluservice-like)
-- applicare: mysql < tools/sql/02-azienda-demo.sql
CREATE DATABASE IF NOT EXISTS azienda_demo CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE azienda_demo;

SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS manutenzioni, biglietti, corse, mezzi, linee, clienti, dipendenti, sedi;
SET FOREIGN_KEY_CHECKS=1;
CREATE TABLE IF NOT EXISTS sedi (
  id INT PRIMARY KEY, nome VARCHAR(64), citta VARCHAR(40), indirizzo VARCHAR(80)
);
CREATE TABLE IF NOT EXISTS dipendenti (
  matricola INT PRIMARY KEY, nome VARCHAR(40), cognome VARCHAR(40),
  ruolo VARCHAR(32), sede_id INT, assunto DATE, stipendio DECIMAL(8,2),
  FOREIGN KEY (sede_id) REFERENCES sedi(id)
);
CREATE TABLE IF NOT EXISTS clienti (
  id INT PRIMARY KEY, ragione_sociale VARCHAR(80), citta VARCHAR(40),
  tipo ENUM('pubblico','privato') NOT NULL, dal DATE
);
CREATE TABLE IF NOT EXISTS mezzi (
  targa VARCHAR(10) PRIMARY KEY, modello VARCHAR(40), anno INT,
  km INT, stato ENUM('servizio','officina','fermo') NOT NULL
);
CREATE TABLE IF NOT EXISTS linee (
  codice VARCHAR(8) PRIMARY KEY, descrizione VARCHAR(80), km DECIMAL(5,1)
);
CREATE TABLE IF NOT EXISTS corse (
  id INT AUTO_INCREMENT PRIMARY KEY, linea VARCHAR(8), mezzo VARCHAR(10),
  data DATE, passeggeri INT, ritardo_min INT DEFAULT 0,
  FOREIGN KEY (linea) REFERENCES linee(codice), FOREIGN KEY (mezzo) REFERENCES mezzi(targa)
);
CREATE TABLE IF NOT EXISTS biglietti (
  id INT AUTO_INCREMENT PRIMARY KEY, corsa_id INT, tipo ENUM('corsa_semplice','giornaliero','abbonamento') NOT NULL,
  prezzo DECIMAL(5,2), canale ENUM('app','emettitrice','bordo') NOT NULL,
  FOREIGN KEY (corsa_id) REFERENCES corse(id)
);
CREATE TABLE IF NOT EXISTS manutenzioni (
  id INT AUTO_INCREMENT PRIMARY KEY, mezzo VARCHAR(10), data DATE,
  tipo ENUM('ordinaria','straordinaria') NOT NULL, costo DECIMAL(8,2),
  FOREIGN KEY (mezzo) REFERENCES mezzi(targa)
);

INSERT INTO sedi VALUES
 (1,'Sede centrale','Senigallia','S.S. Adriatica Sud 228'),
 (2,'Deposito Ancona','Ancona','Via Bocconi 35'),
 (3,'Officina Falconara','Falconara Marittima','Via del Lavoro 12');
INSERT INTO dipendenti VALUES
 (101,'Marco','Rossi','autista',2,'2019-03-04',1750.00),
 (102,'Laura','Bianchi','autista',2,'2020-06-15',1720.00),
 (103,'Giuseppe','Verdi','meccanico',3,'2018-01-20',1980.00),
 (104,'Anna','Neri','impiegata',1,'2021-09-01',1650.00),
 (105,'Paolo','Gialli','autista',1,'2022-02-14',1680.00),
 (106,'Sara','Blu','controller',1,'2020-11-30',1820.00),
 (107,'Luca','Viola','meccanico',3,'2023-05-08',1900.00),
 (108,'Elena','Grigi','autista',2,'2021-04-19',1700.00);
INSERT INTO clienti VALUES
 (1,'Comune di Ancona','Ancona','pubblico','2019-01-01'),
 (2,'Comune di Senigallia','Senigallia','pubblico','2020-01-01'),
 (3,'Atahotel Varese','Falconara Marittima','privato','2021-06-01'),
 (4,'Scuole Jesi','Jesi','pubblico','2022-09-01'),
 (5,'Confindustria Ancona','Ancona','privato','2023-01-15');
INSERT INTO mezzi VALUES
 ('AB123CD','Iveco Crossway',2019,214500,'servizio'),
 ('EF456GH','Mercedes Citaro',2021,132000,'servizio'),
 ('IJ789KL','MAN Lion City',2018,287300,'officina'),
 ('MN012OP','Iveco Daily',2022,64200,'servizio'),
 ('QR345ST','Setra S415',2020,178900,'fermo');
INSERT INTO linee VALUES
 ('R-ADR','Regionale Adriatica Fano-Ancona',46.7),
 ('R-LOC','Locale Senigallia-Ancona',28.0),
 ('SCO-1','Scolastico Jesi-Ancona',34.5);
INSERT INTO corse (linea, mezzo, data, passeggeri, ritardo_min) VALUES
 ('R-ADR','AB123CD','2026-10-12',48,0),
 ('R-ADR','EF456GH','2026-10-12',52,4),
 ('R-LOC','MN012OP','2026-10-12',31,0),
 ('SCO-1','AB123CD','2026-10-13',44,2),
 ('R-ADR','EF456GH','2026-10-13',57,0),
 ('R-LOC','QR345ST','2026-10-13',29,7),
 ('R-ADR','AB123CD','2026-10-14',50,1),
 ('SCO-1','MN012OP','2026-10-14',41,0);
INSERT INTO biglietti (corsa_id, tipo, prezzo, canale) VALUES
 (1,'corsa_semplice',2.50,'app'),(1,'corsa_semplice',2.50,'bordo'),(1,'abbonamento',35.00,'app'),
 (2,'corsa_semplice',2.50,'emettitrice'),(2,'giornaliero',5.00,'app'),
 (3,'corsa_semplice',2.00,'app'),(4,'abbonamento',28.00,'emettitrice'),
 (5,'corsa_semplice',2.50,'app'),(5,'corsa_semplice',2.50,'app'),(6,'giornaliero',4.50,'bordo'),
 (7,'corsa_semplice',2.50,'emettitrice'),(8,'abbonamento',28.00,'app');
INSERT INTO manutenzioni (mezzo, data, tipo, costo) VALUES
 ('IJ789KL','2026-10-02','straordinaria',2450.00),
 ('AB123CD','2026-09-15','ordinaria',380.00),
 ('EF456GH','2026-09-20','ordinaria',410.00),
 ('MN012OP','2026-10-05','ordinaria',295.00);

GRANT SELECT ON azienda_demo.* TO 'tpl_reader'@'localhost';
