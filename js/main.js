/* ============================================================================
   Мебель на заказ · Астана — вся логика страницы. Чистый JS, без библиотек.
   ============================================================================ */
(function () {
  'use strict';

  /* --- Настройки, которые может понадобиться поменять --------------------- */
  var WA_PHONE = '77479112195';                 // номер WhatsApp без + и пробелов
  var CAT_LABEL = {                             // подписи категорий на карточках
    kitchen:  'Кухня',
    wardrobe: 'Шкаф',
    cabinet:  'Корпусная',
    other:    'Другое'
  };

  var $  = function (s, root) { return (root || document).querySelector(s); };
  var $$ = function (s, root) { return Array.prototype.slice.call((root || document).querySelectorAll(s)); };
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ======================================================================
     1. Шапка: тень при скролле
     ====================================================================== */
  var hdr = $('#hdr');
  if (hdr) {
    var onScroll = function () {
      hdr.classList.toggle('is-stuck', window.scrollY > 8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ======================================================================
     2. Мобильное меню
     ====================================================================== */
  var burger = $('#burger');
  var nav = $('#nav');

  function closeMenu() {
    if (!nav) return;
    nav.classList.remove('is-open');
    burger.setAttribute('aria-expanded', 'false');
  }

  if (burger && nav) {
    burger.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });

    // закрываем после перехода по ссылке
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) closeMenu();
    });

    // закрываем по Esc и по клику вне меню
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeMenu();
    });
    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (e.target.closest('#nav') || e.target.closest('#burger')) return;
      closeMenu();
    });
  }

  /* ======================================================================
     3. Портфолио: рендер, фильтры, лайтбокс
     ====================================================================== */
  var gallery = $('#gallery');
  var galleryEmpty = $('#galleryEmpty');
  var items = Array.isArray(window.PORTFOLIO) ? window.PORTFOLIO : [];
  var visible = items.slice();      // что показано после фильтра — по нему ходит лайтбокс

  function render(filter) {
    if (!gallery) return;

    visible = filter === 'all'
      ? items.slice()
      : items.filter(function (it) { return it.cat === filter; });

    gallery.innerHTML = '';

    visible.forEach(function (it, i) {
      var tile = document.createElement('figure');
      tile.className = 'tile';
      tile.tabIndex = 0;
      tile.setAttribute('role', 'button');
      tile.setAttribute('aria-label', 'Открыть фото: ' + (it.title || it.alt || 'работа'));
      tile.dataset.i = String(i);

      var img = document.createElement('img');
      img.src = it.src;
      img.alt = it.alt || it.title || 'Мебель на заказ, Астана';
      img.width = 900;
      img.height = 675;
      // первые 6 — сразу, остальные лениво: так быстрее первая отрисовка
      img.loading = i < 6 ? 'eager' : 'lazy';
      img.decoding = 'async';

      var tag = document.createElement('span');
      tag.className = 'tile__tag';
      tag.textContent = CAT_LABEL[it.cat] || 'Работа';

      tile.appendChild(img);
      tile.appendChild(tag);

      if (it.title) {
        var cap = document.createElement('figcaption');
        cap.textContent = it.title;
        tile.appendChild(cap);
      }

      gallery.appendChild(tile);
    });

    if (galleryEmpty) galleryEmpty.hidden = visible.length !== 0;
  }

  // фильтры
  var filters = $('#filters');
  if (filters) {
    filters.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip', filters).forEach(function (c) {
        var on = c === chip;
        c.classList.toggle('is-on', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      render(chip.dataset.filter);
    });
  }

  render('all');

  /* --- Лайтбокс ---------------------------------------------------------- */
  var lb = null, lbImg, lbCap, lbCount, lbIndex = 0, lastFocus = null;

  function buildLightbox() {
    lb = document.createElement('div');
    lb.className = 'lb';
    lb.setAttribute('role', 'dialog');
    lb.setAttribute('aria-modal', 'true');
    lb.setAttribute('aria-label', 'Просмотр фото работы');
    lb.innerHTML =
      '<button class="lb__x" type="button" aria-label="Закрыть">&times;</button>' +
      '<button class="lb__nav lb__nav--prev" type="button" aria-label="Предыдущее фото">&#8249;</button>' +
      '<button class="lb__nav lb__nav--next" type="button" aria-label="Следующее фото">&#8250;</button>' +
      '<div><img class="lb__img" alt=""><p class="lb__cap"></p><p class="lb__count"></p></div>';

    document.body.appendChild(lb);
    lbImg = $('.lb__img', lb);
    lbCap = $('.lb__cap', lb);
    lbCount = $('.lb__count', lb);

    $('.lb__x', lb).addEventListener('click', closeLb);
    $('.lb__nav--prev', lb).addEventListener('click', function () { step(-1); });
    $('.lb__nav--next', lb).addEventListener('click', function () { step(1); });
    lb.addEventListener('click', function (e) {
      if (e.target === lb) closeLb();          // клик по фону
    });

    // свайп на телефоне
    var x0 = null;
    lb.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) step(dx < 0 ? 1 : -1);
      x0 = null;
    }, { passive: true });
  }

  function show(i) {
    if (!visible.length) return;
    lbIndex = (i + visible.length) % visible.length;
    var it = visible[lbIndex];
    lbImg.src = it.src;
    lbImg.alt = it.alt || it.title || '';
    lbCap.textContent = [it.title, it.note].filter(Boolean).join(' — ');
    lbCount.textContent = (lbIndex + 1) + ' из ' + visible.length;
  }

  function step(d) { show(lbIndex + d); }

  function openLb(i) {
    if (!lb) buildLightbox();
    lastFocus = document.activeElement;
    show(i);
    lb.classList.add('is-open');
    document.body.classList.add('no-scroll');
    $('.lb__x', lb).focus();
  }

  function closeLb() {
    if (!lb) return;
    lb.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  if (gallery) {
    gallery.addEventListener('click', function (e) {
      var tile = e.target.closest('.tile');
      if (tile) openLb(Number(tile.dataset.i));
    });
    gallery.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var tile = e.target.closest('.tile');
      if (!tile) return;
      e.preventDefault();
      openLb(Number(tile.dataset.i));
    });
  }

  document.addEventListener('keydown', function (e) {
    if (!lb || !lb.classList.contains('is-open')) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  /* ======================================================================
     4. Телефон: маска (747) 911-21-95

     "+7" стоит статичным текстом рядом с полем, а не внутри него.
     Это важно для Казахстана: все мобильные коды начинаются на 7
     (700–708, 747, 771, 775–778), и если держать код страны внутри поля,
     маска съедает первую семёрку кода оператора.
     Внутри поля живут ровно 10 цифр национального номера.
     ====================================================================== */
  var phone = $('#f-phone');

  function telDigits(el) {
    var d = el.value.replace(/\D/g, '');
    // вставили номер вместе с кодом страны (+7… или 8…) — уберём его
    if (d.length > 10 && (d.charAt(0) === '7' || d.charAt(0) === '8')) d = d.slice(1);
    return d.slice(0, 10);
  }

  if (phone) {
    phone.addEventListener('input', function () {
      var d = telDigits(phone);
      var out = '';
      if (d.length) out = '(' + d.slice(0, 3);
      if (d.length > 3) out += ') ' + d.slice(3, 6);
      if (d.length > 6) out += '-' + d.slice(6, 8);
      if (d.length > 8) out += '-' + d.slice(8, 10);
      phone.value = out;
    });
  }

  /* ======================================================================
     5. Форма заявки → WhatsApp (бэкенд не нужен)
     ====================================================================== */
  var form = $('#leadForm');

  function setError(input, msg) {
    var field = input.closest('.field');
    var box = $('.err[data-for="' + input.id + '"]');
    field.classList.toggle('is-bad', !!msg);
    if (box) box.textContent = msg || '';
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = $('#f-name');
      var tel = $('#f-phone');
      var type = $('#f-type');
      var msg = $('#f-msg');
      var ok = true;

      if (name.value.trim().length < 2) { setError(name, 'Напишите, как к вам обращаться'); ok = false; }
      else setError(name, '');

      var digits = telDigits(tel);
      if (digits.length !== 10) { setError(tel, 'Введите номер полностью: 10 цифр после +7'); ok = false; }
      else setError(tel, '');

      if (!ok) {
        var bad = $('.field.is-bad input');
        if (bad) bad.focus();
        return;
      }

      var lines = [
        'Заявка с сайта',
        'Имя: ' + name.value.trim(),
        'Телефон: +7 ' + tel.value.trim(),
        'Нужно: ' + type.value
      ];
      if (msg.value.trim()) lines.push('Комментарий: ' + msg.value.trim());

      var url = 'https://wa.me/' + WA_PHONE + '?text=' + encodeURIComponent(lines.join('\n'));
      window.open(url, '_blank', 'noopener');

      var okBox = $('#formOk');
      if (okBox) okBox.hidden = false;
      form.reset();
    });
  }

  /* ======================================================================
     6. Появление блоков при скролле
     ====================================================================== */
  var revealables = $$('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        io.unobserve(en.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealables.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 6, 5) * 55) + 'ms';
      io.observe(el);
    });
  }

  /* ======================================================================
     7. Мелочи
     ====================================================================== */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());

}());
