# Palestre Web — HTML, CSS, SQL

Esercizi interattivi del portfolio: lab di HTML, CSS e SQL con verifica lato client e,
per SQL, endpoint PHP e database demo.

## Contenuto

| File | Ruolo |
|---|---|
| `lab-html.html`, `lab-css.html`, `lab-sql.html` | pagine dei tre laboratori |
| `js/lab-*.js` | logica ed esercizi |
| `api/lab-sql.php`, `api/lab-write.php` | endpoint SQL (config fuori dalla docroot) |
| `api/query.php` | endpoint del terminale query |
| `tools/sql/*.sql` | schema e dati demo |
| `tools/sql-lab-compose.yml` | ambiente PostgreSQL di laboratorio |
| `tools/db-import.php`, `tools/jscheck.py` | utilità di import e controllo |

## Sicurezza

Le credenziali del database **non** sono nel repo: i PHP leggono un file di
configurazione esterno alla docroot. Il compose usa un placeholder da sostituire.

## Anteprima

Le pagine HTML/CSS funzionano con un server statico; i lab SQL richiedono PHP e PostgreSQL:

```bash
python3 -m http.server 8080   # solo lab HTML/CSS
```
