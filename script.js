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
 * 4) Contact form — mailto + message "Merci..."
 * ======================================================= */

const form = document.getElementById('contactForm');
const status = document.getElementById('cf-status');
const mailBtn = document.getElementById('cf-mailto');

function showError(input, show) {
  const wrap = input?.closest('.field');
  if (!wrap) return;
  wrap.classList.toggle('has-error', !!show);
}

if (form && mailBtn) {
  mailBtn.addEventListener('click', (e) => {
    let ok = true;

    const nameEl = document.getElementById('cf-name');
    const emailEl = document.getElementById('cf-email');
    const msgEl = document.getElementById('cf-msg');
    const consentEl = document.getElementById('cf-consent');

    if (nameEl) nameEl.value = nameEl.value.trim();
    if (emailEl) emailEl.value = emailEl.value.trim();
    if (msgEl) msgEl.value = msgEl.value.trim();

    if (nameEl) { const v = nameEl.checkValidity(); showError(nameEl, !v); if (!v) ok = false; }
    if (emailEl) { const v = emailEl.checkValidity(); showError(emailEl, !v); if (!v) ok = false; }
    if (msgEl) { const v = msgEl.checkValidity(); showError(msgEl, !v); if (!v) ok = false; }
    if (consentEl) { const v = consentEl.checked; showError(consentEl, !v); if (!v) ok = false; }

    if (!ok) {
      e.preventDefault();
      if (status) status.textContent = '';
      return;
    }

    const subject = encodeURIComponent('Contact Portfolio');
    const body = encodeURIComponent(
      `Nom: ${nameEl?.value || ''}\n` +
      `Email: ${emailEl?.value || ''}\n\n` +
      `${msgEl?.value || ''}`
    );

    mailBtn.href = `mailto:elenamihalska70@gmail.com?subject=${subject}&body=${body}`;

    if (status) status.textContent = 'Merci, je vous répondrai rapidement.';

    setTimeout(() => {
      if (status) status.textContent = '';
    }, 6000);
  });
}
/* =========================================================
 * 6) AI Chatbot → Cloudflare Worker (stable, no conflicts)
 * ======================================================= */

const chatContainer = document.getElementById("chatbot-container");
const chatMessages  = document.getElementById("chatbot-messages");
const chatInput     = document.getElementById("chatbot-input");
const chatSend      = document.getElementById("chatbot-send");
const chatClose     = document.getElementById("chatbot-close");   // должен быть в HTML
const chatReopen    = document.getElementById("chatbot-reopen");  // должен быть в HTML

// --- helpers
const normalizeBotLang = (v) => {
  const x = String(v || "").toLowerCase().trim();
  if (x === "fr") return "fr";
  if (x === "en") return "en";
  if (x === "ua" || x === "uk" || x.startsWith("ua")) return "ua";
  return "fr";
};

let botLang = normalizeBotLang(localStorage.getItem("chatbot_lang")) || "fr";

function getSessionId() {
  let id = localStorage.getItem("chat_session_id");
  if (!id) {
    id =
      (crypto.randomUUID && crypto.randomUUID()) ||
      (String(Date.now()) + Math.random().toString(16).slice(2));
    localStorage.setItem("chat_session_id", id);
  }
  return id;
}

function scrollChat() {
  if (!chatMessages) return;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function addMessage(text, role = "bot", extraClass = "") {
  if (!chatMessages) return null;

  const div = document.createElement("div");
  div.className = `message ${role === "user" ? "user-message" : "bot-message"} ${extraClass}`.trim();
  div.textContent = text;

  chatMessages.appendChild(div);
  scrollChat();
  return div;
}

function getGreetingText() {
  const t = {
    fr: "Bonjour 👋 Décrivez votre projet en 1 phrase (objectif + contexte).",
    en: "Hello 👋 Describe your project in 1 sentence (goal + context).",
    ua: "Вітаю 👋 Опишіть запит одним реченням (ціль + контекст).",
  };
  return t[botLang] || t.fr;
}

function setBotLangUI(lang) {
  botLang = normalizeBotLang(lang);
  localStorage.setItem("chatbot_lang", botLang);

  // active state on buttons
  document.querySelectorAll("[data-chat-lang]").forEach((btn) => {
    btn.classList.toggle("active", normalizeBotLang(btn.dataset.chatLang) === botLang);
  });

  // placeholder per language
  const placeholders = {
    fr: "Décrivez votre projet…",
    en: "Describe your project…",
    ua: "Опишіть ваш проєкт…",
  };
  if (chatInput) chatInput.placeholder = placeholders[botLang] || placeholders.fr;

  // update greeting if already exists
  const greet = chatMessages?.querySelector(".message.greeting");
  if (greet) greet.textContent = getGreetingText();
}

function ensureGreeting() {
  if (!chatMessages) return;

  // greeting should be visible immediately, but only once per page load
  const existing = chatMessages.querySelector(".message.greeting");
  if (existing) {
    existing.textContent = getGreetingText();
    return;
  }
  addMessage(getGreetingText(), "bot", "greeting");
}

async function sendToWorker(message) {
  const sessionId = getSessionId();

  const response = await fetch("https://curly-thunder-a822.elenamihalska70.workers.dev/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, sessionId, lang: botLang }),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.error || `Worker error (${response.status})`);
  }
  return data.reply || "";
}

async function handleSend() {
  const msg = (chatInput?.value || "").trim();
  if (!msg) return;
  // удалить приветствие при первом сообщении пользователя
const greet = chatMessages?.querySelector(".message.greeting");
if (greet) greet.remove();

  addMessage(msg, "user");
  if (chatInput) chatInput.value = "";

  const loading = addMessage("…", "bot");

  try {
    const reply = await sendToWorker(msg);
    const fallback =
      botLang === "fr" ? "Je comprends. Pouvez-vous préciser ?" :
      botLang === "en" ? "I understand. Could you clarify?" :
                         "Розумію. Можете уточнити?";
    if (loading) loading.textContent = reply || fallback;
  } catch (err) {
    console.error(err);
    const errText =
      botLang === "fr" ? "Erreur temporaire. Réessayez." :
      botLang === "en" ? "Temporary error. Please retry." :
                         "Тимчасова помилка. Спробуйте ще раз.";
    if (loading) loading.textContent = errText;
  }

  scrollChat();
}

/* --- INIT --- */
if (chatContainer && chatMessages && chatInput && chatSend) {
  // show chat on load
  chatContainer.style.display = "flex";

  // reopen hidden by default
  if (chatReopen) chatReopen.style.display = "none";

  // init language UI + greeting
  setBotLangUI(botLang);
  ensureGreeting();

  // send handlers
  chatSend.addEventListener("click", handleSend);
  chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleSend();
  });

  // language buttons: UI only
  document.querySelectorAll("[data-chat-lang]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setBotLangUI(btn.dataset.chatLang || "fr");
    });
  });

  // close -> hide chat, show reopen
  if (chatClose) {
    chatClose.addEventListener("click", () => {
      chatContainer.style.display = "none";
      if (chatReopen) chatReopen.style.display = "block";
    });
  }

  // reopen -> show chat again
  if (chatReopen) {
    chatReopen.addEventListener("click", () => {
      chatContainer.style.display = "flex";
      chatReopen.style.display = "none";
      ensureGreeting();
    });
  }
}

});