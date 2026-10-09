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
