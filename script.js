document.addEventListener('DOMContentLoaded', () => {
  /* =========================================================
   * 0) Helpers
   * ======================================================= */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* =========================================================
   * 1) Language / i18n (FR/EN) — FIXED + GitHub Pages safe
   * ======================================================= */

  function getRepoBasePath() {
    // GitHub Pages: https://username.github.io/<repo>/
    if (!location.hostname.endsWith('github.io')) return '';
    const parts = location.pathname.split('/').filter(Boolean);
    return parts.length ? `/${parts[0]}` : '';
  }

function getI18nUrl(lang) {
  return new URL(`i18n/${lang}.json`, document.baseURI).toString();
}

/* =========================================================
 * 5) Notice bar — close (no memory)
 * ======================================================= */
const notice = document.getElementById('siteNotice');
const noticeClose = notice?.querySelector('.notice-close');

if (notice) {
  // показываем всегда при загрузке
  notice.style.display = 'flex';
  document.body.classList.remove('notice-hidden');

  // закрытие крестиком (до перезагрузки)
  noticeClose?.addEventListener('click', () => {
    notice.style.display = 'none';
    document.body.classList.add('notice-hidden');
  });
}


  function normalizeLang(value) {
    const v = (value || '').toLowerCase();
    return v.startsWith('en') ? 'en' : 'fr';
  }

  function getStoredLang() {
    return normalizeLang(
      localStorage.getItem('lang') ||
      document.documentElement.getAttribute('lang') ||
      'fr'
    );
  }

  function setLangUI(lang) {
    $$('.lang-switch [data-lang]').forEach((btn) => {
      const active = btn.dataset.lang === lang;
      btn.setAttribute('aria-pressed', String(active));
      btn.classList.toggle('is-active', active);
    });
  }

  async function loadDict(lang) {
    const url = getI18nUrl(lang);
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) throw new Error(`i18n load failed: ${resp.status} ${url}`);
    return resp.json();
  }

  function applyTranslations(dict) {
  // 1) Текстовые узлы: <span data-i18n="hero.name">...</span>
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (!key) return;

    const value = dict[key];
    if (typeof value !== 'string') return;

    // 2) Перевод атрибутов (placeholder, aria-label и т.д.)
    const attr = el.getAttribute('data-i18n-attr');
    if (attr) {
      el.setAttribute(attr, value);
      return;
    }

    el.textContent = value;
  });
}


  async function setLanguage(lang) {
    const normalized = normalizeLang(lang);
    localStorage.setItem('lang', normalized);
    document.documentElement.setAttribute('lang', normalized);

    setLangUI(normalized);

    try {
      const dict = await loadDict(normalized);
      applyTranslations(dict);
    } catch (err) {
      // If EN fails on GitHub (path issue), you will see it here
      console.error(err);
    }
  }

  // Init language
  const initialLang = getStoredLang();
  setLanguage(initialLang);

  // Click handlers on language buttons
  $$('.lang-switch [data-lang]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.lang || 'fr';
      setLanguage(target);
    });
  });

  /* =========================================================
   * 2) Toggle details
   * ======================================================= */
  window.toggleDetails = function (id) {
    const panel = document.getElementById(id);
    if (!panel) return;

    const trigger = document.querySelector(`[aria-controls="${id}"]`);
    const isOpen = panel.style.display === 'block';
    const willShow = !isOpen;

    // fermer tous les panels
    document.querySelectorAll('.details').forEach(d => (d.style.display = 'none'));

    // reset aria-expanded
    document.querySelectorAll('.competences-list [aria-controls]').forEach(el => {
      el.setAttribute('aria-expanded', 'false');
    });

    // ouvrir/fermer celui-ci
    panel.style.display = willShow ? 'block' : 'none';
    if (trigger) trigger.setAttribute('aria-expanded', String(willShow));

    // option : ouvrir la première sous-section <details.sub>
    if (willShow) {
      panel.querySelectorAll('details.sub').forEach(d => (d.open = false));
      const first = panel.querySelector('details.sub');
      if (first) first.open = true;

      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  /* =========================================================
   * 3) Lightbox (toutes les .gallery img)
   * ======================================================= */
  const images = Array.from(document.querySelectorAll('.gallery img'));
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = document.querySelector('.lightbox-content');

  const btnClose = document.getElementById('close-lightbox');
  const btnZoomIn = document.getElementById('zoom-in');
  const btnZoomOut = document.getElementById('zoom-out');
  const btnPrev = document.getElementById('prev');
  const btnNext = document.getElementById('next');

  let currentIndex = 0;
  let scale = 1;

  function showImage(i) {
    currentIndex = (i + images.length) % images.length;
    lightboxImg.src = images[currentIndex].src;
    lightboxImg.alt = images[currentIndex].alt || '';
    scale = 1;
    lightboxImg.style.transform = 'scale(1)';
  }

  function openLightbox(i) {
    if (!lightbox || !lightboxImg || images.length === 0) return;
    showImage(i);
    lightbox.style.display = 'flex';
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeLightbox() {
    if (!lightbox || !lightboxImg) return;
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
    lightboxImg.src = '';
    lightboxImg.alt = '';
    document.body.classList.remove('no-scroll');
  }

  if (lightbox && lightboxImg && images.length) {
    images.forEach((img, i) => {
      img.style.cursor = 'zoom-in';
      img.setAttribute('tabindex', '0');
      img.addEventListener('click', () => openLightbox(i));
      img.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') openLightbox(i);
      });
    });

    btnClose && btnClose.addEventListener('click', closeLightbox);

    btnZoomIn && btnZoomIn.addEventListener('click', () => {
      scale = Math.min(scale + 0.1, 3);
      lightboxImg.style.transform = `scale(${scale})`;
    });

    btnZoomOut && btnZoomOut.addEventListener('click', () => {
      scale = Math.max(scale - 0.1, 0.2);
      lightboxImg.style.transform = `scale(${scale})`;
    });

    btnPrev && btnPrev.addEventListener('click', () => showImage(currentIndex - 1));
    btnNext && btnNext.addEventListener('click', () => showImage(currentIndex + 1));

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', (e) => {
      if (!lightbox || lightbox.style.display !== 'flex') return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (e.key === 'ArrowRight') showImage(currentIndex + 1);
      if (e.key === '+') btnZoomIn && btnZoomIn.click();
      if (e.key === '-') btnZoomOut && btnZoomOut.click();
    });
  }

  /* =========================================================
   * 4) Contact form (Formspree AJAX)
   * ======================================================= */
  const form = document.getElementById('contactForm');
  if (form) {
    const status = document.getElementById('cf-status');

    function showError(input, show) {
      const wrap = input.closest('.field');
      if (!wrap) return;
      wrap.classList.toggle('has-error', !!show);
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      let ok = true;
      ['cf-name', 'cf-email', 'cf-msg', 'cf-consent'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const valid = el.type === 'checkbox' ? el.checked : el.checkValidity();
        showError(el, !valid);
        if (!valid) ok = false;
      });

      if (!ok) {
        if (status) status.textContent = '';
        return;
      }

      const btn = document.getElementById('cf-submit');
      if (btn) btn.disabled = true;
      if (btn) btn.textContent = 'Envoi…';

      try {
        const resp = await fetch(form.action, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });

        if (resp.ok) {
          form.reset();
          if (status) status.textContent = 'Merci ! Votre message a été envoyé.';
        } else {
          if (status) status.textContent = 'Oups, une erreur est survenue.';
        }
      } catch {
        if (status) status.textContent = 'Oups, une erreur est survenue.';
      } finally {
        if (btn) btn.disabled = false;
        if (btn) btn.textContent = 'Envoyer';
      }
    });
  }
});
