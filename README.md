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

## Note

- Form contatti via `mailto:`, nessun backend / nessuna chiave API nel repo
- `sitemap.xml` punta al dominio di produzione: aggiornare `<loc>` se cambia dominio
