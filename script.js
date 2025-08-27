document.addEventListener('DOMContentLoaded', () => {
  /* ---------- Toggle details (видимость блоков по id) ---------- */
  window.toggleDetails = function (id) {
    const el = document.getElementById(id);
    if (!el) return;

    const visible = el.style.display === 'block';
    document.querySelectorAll('.details').forEach(d => (d.style.display = 'none'));
    el.style.display = visible ? 'none' : 'block';
    if (!visible) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ---------- Lightbox gallery ---------- */
  let currentIndex = 0;
  let scale = 1;

  const images = document.querySelectorAll('.gallery img');
  const lightbox = document.querySelector('.lightbox');
  const lightboxImg = document.querySelector('.lightbox-content');
  const btnClose = document.getElementById('close-lightbox');
  const btnZoomIn = document.getElementById('zoom-in');
  const btnZoomOut = document.getElementById('zoom-out');
  const btnPrev = document.getElementById('prev');
  const btnNext = document.getElementById('next');

  if (!images.length || !lightbox || !lightboxImg) return;

  function showImage(i) {
    currentIndex = (i + images.length) % images.length;
    lightboxImg.src = images[currentIndex].src;
    scale = 1;
    lightboxImg.style.transform = 'scale(1)';
  }

  function openLightbox(i) {
    showImage(i);
    lightbox.style.display = 'block';
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function closeLightbox() {
    lightbox.style.display = 'none';
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll');
    scale = 1;
    lightboxImg.style.transform = 'scale(1)';
  }

  images.forEach((img, i) => {
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => openLightbox(i));
    img.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') openLightbox(i);
    });
    img.setAttribute('tabindex', '0');
  });

  btnClose.addEventListener('click', closeLightbox);
  btnZoomIn.addEventListener('click', () => {
    scale = Math.min(scale + 0.1, 3);
    lightboxImg.style.transform = `scale(${scale})`;
  });
  btnZoomOut.addEventListener('click', () => {
    scale = Math.max(scale - 0.1, 0.2);
    lightboxImg.style.transform = `scale(${scale})`;
  });
  btnPrev.addEventListener('click', () => showImage(currentIndex - 1));
  btnNext.addEventListener('click', () => showImage(currentIndex + 1));

  // Закрытие по клику вне картинки
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });

  // Клавиатура: Esc / стрелки / +/- / Enter
  document.addEventListener('keydown', (e) => {
    if (lightbox.style.display !== 'block') return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
    if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    if (e.key === '+') btnZoomIn.click();
    if (e.key === '-') btnZoomOut.click();
  });
});
function toggleDetails(id) {
  const el = document.getElementById(id);
  if (!el) return;

  const willShow = el.style.display === '' || el.style.display === 'none';

  // закрыть остальные главные блоки
  document.querySelectorAll('.details').forEach(d => {
    if (d !== el) d.style.display = 'none';
  });
  document.querySelectorAll('.competences-list li[aria-expanded]')
    .forEach(li => li.setAttribute('aria-expanded', 'false'));

  // показать/скрыть текущий
  el.style.display = willShow ? 'block' : 'none';
  document.querySelectorAll(`.competences-list li[aria-controls="${id}"]`)
    .forEach(li => li.setAttribute('aria-expanded', willShow ? 'true' : 'false'));

  // 🔽 НОВОЕ: при открытии главного блока — автоматически раскрыть первую подплашку
  if (willShow) {
    // закрыть все под‑вкладки внутри
    el.querySelectorAll('details.sub').forEach(d => d.open = false);
    // открыть первую
    const first = el.querySelector('details.sub');
    if (first) first.open = true;
  }
}
