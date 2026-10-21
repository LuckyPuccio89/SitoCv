# sito-cv — Portfolio Stefano Pucci

Portfolio personale statico: Network Engineer & System Architect.
HTML + CSS + JavaScript vanilla, zero dipendenze/build.

## Come è nato

Progetto nato nel 2026 durante il corso di specializzazione Sistemista
Informatico (Confindustria Ancona): serviva un portfolio per presentare
competenze, certificazioni e progetti. Scritto a mano in HTML/CSS/JS con tema
terminale, doppia lingua ITA/EN, form contatti senza backend (mailto).
Collaudato sull'homelab casalingo (Apache + Let's Encrypt, accesso solo LAN)
prima della pubblicazione qui.

## Mappa del sito

```
index.html (Home — profilo, stack, download CV)
├── about.html (About — valori e percorso)
├── projects.html (Progetti)
├── certifications.html (Certificazioni e formazione)
├── contact.html (Contatti)
├── cv/cv-stefano-pucci.pdf
└── footer, in ogni pagina → Email · LinkedIn · CV · GitHub
```

## Struttura

```
index.html / about.html / projects.html / certifications.html / contact.html
css/style.css
js/i18n.js, main.js, terminal.js   # ITA/EN, form mailto, terminale retro
img/foto-cv.png
cv/cv-stefano-pucci.pdf
robots.txt, sitemap.xml
```

## Anteprima locale

```bash
python3 -m http.server 8080
# http://localhost:8080
```

## Deploy

- **GitHub Pages:** Settings → Pages → Deploy from branch → `main` / root
- **Apache:** `DocumentRoot` su questa cartella, vedi `Alias /collaudo-sito` per collaudo interno
- **Docker (solo host senza Apache su 80/443):** `nginx:alpine` + volume `:ro`

## Poller live (GTFS demo)

- `tools/viaggiatreno-poll.py` → `api/realtime.json` + tabella MySQL `departures` (partenze live Fano/Senigallia/Falconara/Ancona, ogni 5 min):
  `*/5 * * * * /usr/bin/python3 /var/www/html/tools/viaggiatreno-poll.py --out /var/www/html/api/realtime.json --mysql-cnf /etc/tpl-demo/mysql.cnf`
- `tools/gtfs-to-json.py` → rigenera fermate reali in `api/gtfs.json` dal feed mdb-1319:
  `python3 tools/gtfs-to-json.py /tmp/gtfs-marche/marche-latest.zip --out api/gtfs.json`
- `tools/db-import.php` → importa `api/*.json` in MySQL `tpl_demo` (fermate, linee, mezzi, KPI):
  `php tools/db-import.php --docroot /var/www/html`
- `api/query.php` → API readonly su MySQL (stessa forma dei JSON): `?a=status|realtime|gtfs|kpi|stations|departures&st=|delays|routes|bus&line=`
- Senza cron il sito mostra l'ultimo snapshot con badge STALE, o la simulazione con badge SIMULATO.

## Note

- Form contatti via `mailto:`, nessun backend / nessuna chiave API nel repo
- `sitemap.xml` punta al dominio di produzione: aggiornare `<loc>` se cambia dominio
