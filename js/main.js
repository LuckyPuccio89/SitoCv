// ============================================================
// CONTACT FORM: invio via client email (mailto).
// Niente servizi esterni: il messaggio non transita da terze parti.
// ============================================================
const CONTACT_EMAIL = 'stefano.informatico@gmail.com';

document.addEventListener('DOMContentLoaded', () => {

  // --- CONTACT FORM ---
  const form = document.getElementById('contact-form');
  const successDiv = document.getElementById('form-success');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const btn = form.querySelector('.btn-submit');
      const btnText = btn.querySelector('.btn-text');
      const btnLoader = btn.querySelector('.btn-loader');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      // --- Loading state ---
      btn.disabled = true;
      btnText.style.display = 'none';
      btnLoader.style.display = 'inline-flex';

      // --- Apertura client email con messaggio precompilato ---
      const subject = encodeURIComponent(data.subject || 'Contatto dal portfolio');
      const body = encodeURIComponent(
        `Nome: ${data.name}\nEmail: ${data.email}\n\n${data.message}`
      );
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;

      // --- Conferma ---
      form.style.display = 'none';
      successDiv.style.display = 'flex';
    });
  }

  // --- CURSOR VISIBILITY ---
  document.querySelectorAll('.terminal-prompt .cursor').forEach(c => {
    c.style.visibility = 'visible';
  });

  // --- LANGUAGE SWITCHER (CSP-safe, no inline onclick) ---
  document.querySelectorAll('[data-lang]').forEach(btn => {
    btn.addEventListener('click', () => {
      if (window.LANG && typeof window.LANG.switch === 'function') {
        window.LANG.switch(btn.dataset.lang);
      }
    });
  });

  // --- NEW CONNECTION BUTTON (contact page) ---
  const reloadBtn = document.getElementById('btn-new-connection');
  if (reloadBtn) {
    reloadBtn.addEventListener('click', () => location.reload());
  }

  // --- ACTIVE NAV LINK ---
  const currentPath = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === currentPath) {
      link.classList.add('active');
    }
  });
});

// ============================================================
// GTFS: fetchStationData(stationCode) - realtime.json (static fallback)
// ============================================================
window.fetchStationData = async function(stationCode) {
  const code = stationCode || 'S07113';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(`api/realtime.json&st=${encodeURIComponent(code)}`, {
      signal: controller.signal,
      cache: 'no-store'
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error('realtime.json error');
    const data = await res.json();
    // Normalizza alla forma attesa da gtfs-live.js
    const out = {
      source: 'mysql',
      generated_at: data.snapshot_at ? new Date(data.snapshot_at).toISOString() : new Date().toISOString(),
      stale_after_s: 600,
      label: code,
      departures: data.departures || [],
      arrivals: []
    };
    // Tenta di mappare campi se necessario
    out.departures = (out.departures || []).map(d => ({
      n: d.n || d.num || '',
      cat: d.cat || '',
      dest: d.dest || '',
      hhmm: d.hhmm || '',
      delay_min: (d.delay_min === null || d.delay_min === undefined) ? null : d.delay_min,
      platform: d.platform || null
    }));
    return out;
  } catch (e) {
    // Fallback trasparente su file JSON statico
    try {
      const res2 = await fetch('api/realtime.json', { cache: 'no-store' });
      if (!res2.ok) throw new Error('realtime.json error');
      const rt = await res2.json();
      const st = rt.stations && rt.stations[code];
      if (!st) throw new Error('stazione non trovata in realtime.json');
      return {
        source: 'static',
        generated_at: rt.generated_at,
        stale_after_s: rt.stale_after_s || 600,
        label: st.label || code,
        departures: st.departures || [],
        arrivals: st.arrivals || []
      };
    } catch (e2) {
      throw e2;
    }
  }
};
