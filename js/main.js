/* Sunny Nails Aix — comportement du site (statique, sans back-end).
   Tout ce qui est « mouvement » est isolé dans initMotion() : si GSAP est absent
   ou si l'utilisateur préfère moins d'animations, le site reste complet et lisible. */
(function () {
  'use strict';

  var d = document, root = d.documentElement;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var hasGsap = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  var motion = hasGsap && !reduce;
  var lenis = null;

  var TEL = '+33695683748';
  var PLANITY = 'https://www.planity.com/sunny-nails-aix-13100-aix-en-provence';

  function $(s, c) { return (c || d).querySelector(s); }
  function $$(s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); }
  function el(tag, cls) { var e = d.createElement(tag); if (cls) e.className = cls; return e; }

  /* ------------------------------------------------------------------
     Soleil : motif signature, généré une fois et injecté partout
     ------------------------------------------------------------------ */
  function sunMarkup() {
    var rays = '';
    for (var k = 0; k < 16; k++) {
      var a = k * Math.PI / 8, r1 = 34, r2 = k % 2 ? 46 : 57;
      rays += '<line pathLength="1" x1="' + (60 + Math.cos(a) * r1).toFixed(2) + '" y1="' + (60 + Math.sin(a) * r1).toFixed(2) +
        '" x2="' + (60 + Math.cos(a) * r2).toFixed(2) + '" y2="' + (60 + Math.sin(a) * r2).toFixed(2) + '"/>';
    }
    return '<svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true" focusable="false">' +
      '<circle cx="60" cy="60" r="22"/><circle cx="60" cy="60" r="11" fill="currentColor" stroke="none" opacity=".85"/>' + rays + '</svg>';
  }
  $$('[data-sun]').forEach(function (n) { n.innerHTML = sunMarkup(); });

  /* ------------------------------------------------------------------
     Horaires : statut en direct (heure de Paris) + jour surligné
     ------------------------------------------------------------------ */
  function parisNow() {
    var o = {};
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Paris', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })
      .formatToParts(new Date()).forEach(function (p) { o[p.type] = p.value; });
    var map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    return { day: map[o.weekday], min: (parseInt(o.hour, 10) % 24) * 60 + parseInt(o.minute, 10) };
  }
  function initStatus() {
    var now, box = $('[data-status]'), txt = $('[data-status-text]');
    try { now = parisNow(); } catch (e) { return; }
    var open = now.day >= 1 && now.day <= 6 && now.min >= 600 && now.min < 1200;
    var msg;
    if (open) msg = 'Ouvert maintenant · jusqu’à 20h';
    else if (now.day >= 1 && now.day <= 6 && now.min < 600) msg = 'Fermé · ouvre à 10h';
    else if (now.day >= 1 && now.day <= 5) msg = 'Fermé · rouvre demain à 10h';
    else msg = 'Fermé · rouvre lundi à 10h';
    if (box && txt) { txt.textContent = msg; box.classList.toggle('is-open', open); }
    var li = $('#hours li[data-d="' + now.day + '"]');
    if (li) li.classList.add('is-today');
  }

  /* ------------------------------------------------------------------
     Carte des tarifs + sélection (SMS / Planity)
     ------------------------------------------------------------------ */
  var MENU = [
    { id: 'mains', label: 'Les mains', items: [
      { n: 'Manucure classique', d: 'Sans couleur.', t: 20, p: 15 },
      { n: 'Manucure + vernis classique', d: 'Soin des mains et pose de vernis.', t: 30, p: 30 },
      { n: 'Manucure + semi-permanent', d: 'Soin des mains et pose de semi-permanent.', t: 30, p: 35 },
      { n: 'Pose de vernis classique', d: 'Mains.', t: 20, p: 20 },
      { n: 'Pose de semi-permanent', d: 'Mains.', t: 30, p: 25 },
      { n: 'Semi-permanent en french', d: 'Mains.', t: 35, p: 30 },
      { n: 'Dépose de semi-permanent', d: 'À la ponceuse — pour une repose, ou une pose faite au salon.', t: 15, p: 10 }
    ] },
    { id: 'gel', label: 'Gel & résine', items: [
      { n: 'Pose gel ou résine', d: 'Sur ongle naturel, sans capsule.', t: 45, p: 50 },
      { n: 'Pose BIAB', d: 'Gel sur ongle naturel, sans capsule.', t: 45, p: 45 },
      { n: 'Pose gel ou résine baby boomer / french', d: 'Le dégradé blanc et rose, ou le liseré classique.', t: 60, p: 60 },
      { n: 'Pose gel ou résine + semi-permanent', d: 'Construction et couleur dans la même séance.', t: 60, p: 55 },
      { n: 'Remplissage gel ou résine + semi-permanent', d: 'Pour entretenir un set existant.', t: 45, p: 45 },
      { n: 'Dépose gel ou faux ongles', d: 'À la ponceuse — pour une repose, ou une pose faite au salon.', t: 20, p: 20 }
    ] },
    { id: 'art', label: 'Nail art', items: [
      { n: 'French', d: 'En supplément.', t: 10, p: 5 },
      { n: 'Paillettes', d: 'En supplément.', t: 10, p: 5 },
      { n: 'Chrome', d: 'En supplément.', t: 10, p: 5 },
      { n: 'Strass', d: 'La pièce.', t: 2, p: 0.5 },
      { n: 'Nail art', d: 'Par ongle.', t: 5, p: 1.5 },
      { n: 'Réparation d’un ongle cassé', d: 'Selon l’étendue des dégâts.', t: 10, p: 5, pm: 8 }
    ] },
    { id: 'pieds', label: 'Pieds', items: [
      { n: 'Beauté des pieds complète', d: 'Fauteuil massage, bain détox au sel de Thompson, massage traditionnel, gommage sans rasoir, gainage aux algues exfoliantes, masques, puis vernis ou semi-permanent.', t: 60, p: 60 },
      { n: 'Beauté des pieds — version courte', d: 'Le même rituel, en 45 minutes.', t: 45, p: 45 },
      { n: 'Pose de semi-permanent', d: 'Pieds.', t: 20, p: 25 },
      { n: 'Pose de vernis classique', d: 'Pieds.', t: 20, p: 20 },
      { n: 'Dépose de semi-permanent', d: 'Pieds — pour une repose, ou une pose faite au salon.', t: 15, p: 10 },
      { n: 'Beauté des pieds + gel sur 2 pouces', d: 'Soin complet et pose de gel ou résine sur les deux gros orteils.', t: 75, p: 70 },
      { n: 'Gel ou résine sur tous les orteils + semi-permanent', d: 'Pose complète des dix orteils.', t: 60, p: 55 }
    ] },
    { id: 'duo', label: 'Mains + pieds', items: [
      { n: 'Vernis classique mains + pieds', d: 'Le duo express.', t: 45, p: 40 },
      { n: 'Semi-permanent mains + pieds', d: 'Tenue longue durée, des deux côtés.', t: 45, p: 50 },
      { n: 'Manucure + beauté des pieds + vernis ou semi', d: 'Le grand programme, tout inclus.', t: 90, p: 90 },
      { n: 'Dépose + repose de semi-permanent mains + pieds', d: 'Pour tout renouveler.', t: 45, p: 65 }
    ] },
    { id: 'cils', label: 'Cils', items: [
      { n: 'Extension de cils, cil à cil', d: 'Pose complète.', t: 120, p: 80 },
      { n: 'Remplissage cil à cil', d: 'À trois semaines.', t: 90, p: 70 },
      { n: 'Dépose d’extensions de cils', d: 'En douceur.', t: 45, p: 20 }
    ] },
    { id: 'homme', label: 'Homme', items: [
      { n: 'Manucure homme', d: 'Soin des mains et des cuticules.', t: 20, p: 20 },
      { n: 'Beauté des pieds homme', d: 'Fauteuil massage, massage traditionnel, gommage, gainage.', t: 50, p: 55 }
    ] }
  ];

  function fmtPrice(p) { return (p % 1 ? p.toFixed(2).replace('.', ',') : String(p)) + ' €'; }
  function fmtTime(m) {
    if (m < 60) return m + ' min';
    var h = Math.floor(m / 60), r = m % 60;
    return h + ' h' + (r ? ' ' + (r < 10 ? '0' + r : r) : '');
  }

  var selected = {}; // clé "cat:index" -> prestation
  var currentTab = 'mains';

  function renderTabs() {
    var tabs = $('#tabs');
    if (!tabs) return;
    MENU.forEach(function (c) {
      var b = el('button', 'tab');
      b.type = 'button'; b.id = 'tab-' + c.id; b.setAttribute('role', 'tab');
      b.setAttribute('aria-controls', 'carte'); b.textContent = c.label;
      b.setAttribute('aria-selected', c.id === currentTab ? 'true' : 'false');
      b.tabIndex = c.id === currentTab ? 0 : -1;
      b.addEventListener('click', function () { setTab(c.id, true); });
      b.addEventListener('keydown', function (e) {
        var i = MENU.findIndex(function (x) { return x.id === currentTab; });
        if (e.key === 'ArrowRight') i = (i + 1) % MENU.length;
        else if (e.key === 'ArrowLeft') i = (i + MENU.length - 1) % MENU.length;
        else return;
        e.preventDefault(); setTab(MENU[i].id, true); $('#tab-' + MENU[i].id).focus();
      });
      tabs.appendChild(b);
    });
  }

  function renderRows(animate) {
    var panel = $('#carte'), cat = MENU.filter(function (c) { return c.id === currentTab; })[0];
    if (!panel || !cat) return;
    panel.setAttribute('aria-labelledby', 'tab-' + cat.id);
    panel.innerHTML = '';
    cat.items.forEach(function (it, i) {
      var key = cat.id + ':' + i;
      var row = el('div', 'row' + (selected[key] ? ' is-on' : ''));
      row.innerHTML =
        '<div class="row__main"><span class="row__name"></span><span class="row__desc"></span></div>' +
        '<div class="row__meta"><span class="row__price"></span><span class="row__time"></span></div>';
      $('.row__name', row).textContent = it.n;
      $('.row__desc', row).textContent = it.d;
      $('.row__price', row).textContent = (it.pm ? fmtPrice(it.p) + ' – ' + fmtPrice(it.pm) : fmtPrice(it.p));
      $('.row__time', row).textContent = fmtTime(it.t);
      var add = el('button', 'row__add');
      add.type = 'button';
      add.setAttribute('aria-pressed', selected[key] ? 'true' : 'false');
      add.setAttribute('aria-label', (selected[key] ? 'Retirer de' : 'Ajouter à') + ' ma sélection : ' + it.n);
      add.addEventListener('click', function () { toggle(key, it, row, add); });
      row.appendChild(add);
      panel.appendChild(row);
    });
    if (animate && motion) {
      gsap.from($$('.row', panel), { y: 28, autoAlpha: 0, duration: .8, ease: 'expo.out', stagger: .05, clearProps: 'all' });
    }
  }

  function setTab(id, animate) {
    currentTab = id;
    $$('.tab').forEach(function (b) {
      var on = b.id === 'tab-' + id;
      b.setAttribute('aria-selected', on ? 'true' : 'false'); b.tabIndex = on ? 0 : -1;
    });
    renderRows(animate);
  }

  function toggle(key, it, row, add) {
    if (selected[key]) delete selected[key]; else selected[key] = it;
    var on = !!selected[key];
    row.classList.toggle('is-on', on);
    add.setAttribute('aria-pressed', on ? 'true' : 'false');
    add.setAttribute('aria-label', (on ? 'Retirer de' : 'Ajouter à') + ' ma sélection : ' + it.n);
    if (motion) gsap.fromTo(add, { scale: .7 }, { scale: 1, duration: .8, ease: 'elastic.out(1,.5)' });
    renderSelection();
  }

  function renderSelection() {
    var list = $('#selList'), keys = Object.keys(selected), items = keys.map(function (k) { return selected[k]; });
    if (!list) return;
    list.innerHTML = '';
    if (!items.length) {
      var li0 = el('li', 'sel__empty'); li0.textContent = 'Rien pour l’instant — touchez le « + » d’une prestation.'; list.appendChild(li0);
    }
    var total = 0, totalMax = 0, minutes = 0;
    keys.forEach(function (k) {
      var it = selected[k];
      total += it.p; totalMax += (it.pm || it.p); minutes += it.t;
      var li = el('li');
      var s = el('span'); s.textContent = it.n;
      var b = el('button'); b.type = 'button'; b.setAttribute('aria-label', 'Retirer ' + it.n); b.textContent = '×';
      b.addEventListener('click', function () { delete selected[k]; renderRows(false); renderSelection(); });
      var pr = el('span'); pr.textContent = fmtPrice(it.p);
      li.appendChild(s); li.appendChild(pr); li.appendChild(b);
      list.appendChild(li);
    });
    $('#selPrice').textContent = !items.length ? '0 €' : (totalMax > total ? 'dès ' + fmtPrice(total) : fmtPrice(total));
    $('#selTime').textContent = items.length ? fmtTime(minutes) : '—';
    $('#selClear').hidden = !items.length;

    var body = items.length
      ? 'Bonjour Sunny Nails, je souhaite réserver :\n' + items.map(function (it) { return '• ' + it.n + ' (' + fmtPrice(it.p) + ')'; }).join('\n') +
        '\nTotal estimé : ' + $('#selPrice').textContent + ' · durée ' + fmtTime(minutes) + '\nMes disponibilités : '
      : 'Bonjour Sunny Nails, je souhaite prendre rendez-vous. Mes disponibilités : ';
    $('#selSms').setAttribute('href', 'sms:' + TEL + '?&body=' + encodeURIComponent(body));
  }

  function initCarte() {
    if (!$('#carte')) return;
    renderTabs(); renderRows(false); renderSelection();
    $('#selClear').addEventListener('click', function () { selected = {}; renderRows(false); renderSelection(); });
  }

  /* ------------------------------------------------------------------
     FAQ (accordéon accessible)
     ------------------------------------------------------------------ */
  function initFaq() {
    $$('.qa').forEach(function (qa) {
      var btn = $('button', qa);
      btn.addEventListener('click', function () {
        var open = btn.getAttribute('aria-expanded') === 'true';
        $$('.qa').forEach(function (o) { o.classList.remove('is-open'); $('button', o).setAttribute('aria-expanded', 'false'); });
        if (!open) { qa.classList.add('is-open'); btn.setAttribute('aria-expanded', 'true'); }
        if (motion) setTimeout(function () { ScrollTrigger.refresh(); }, 700);
      });
    });
  }

  /* ------------------------------------------------------------------
     Carrousel d'avis (défilement, glisser, lecture douce)
     ------------------------------------------------------------------ */
  function initReviews() {
    var track = $('#revTrack'); if (!track) return;
    function stepSize() {
      var c = $('.rcard', track); if (!c) return 300;
      return c.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 16);
    }
    function go(dir) {
      var max = track.scrollWidth - track.clientWidth - 4;
      if (dir > 0 && track.scrollLeft >= max) track.scrollTo({ left: 0, behavior: reduce ? 'auto' : 'smooth' });
      else if (dir < 0 && track.scrollLeft <= 4) track.scrollTo({ left: max, behavior: reduce ? 'auto' : 'smooth' });
      else track.scrollBy({ left: dir * stepSize(), behavior: reduce ? 'auto' : 'smooth' });
    }
    $('#revPrev').addEventListener('click', function () { go(-1); });
    $('#revNext').addEventListener('click', function () { go(1); });
    track.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
    });

    // glisser à la souris
    var down = false, sx = 0, sl = 0, moved = 0;
    track.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') return;
      down = true; moved = 0; sx = e.clientX; sl = track.scrollLeft;
    });
    window.addEventListener('pointermove', function (e) {
      if (!down) return;
      var dx = e.clientX - sx; moved = Math.max(moved, Math.abs(dx));
      if (moved > 5) { track.classList.add('is-drag'); track.scrollLeft = sl - dx; }
    });
    window.addEventListener('pointerup', function () { if (!down) return; down = false; track.classList.remove('is-drag'); });
    track.addEventListener('click', function (e) { if (moved > 5) { e.preventDefault(); e.stopPropagation(); } }, true);

    // lecture douce : seulement visible, jamais au survol/focus, jamais en mouvement réduit
    if (reduce || !('IntersectionObserver' in window)) return;
    var visible = false, paused = false;
    new IntersectionObserver(function (en) { visible = en[0].isIntersecting; }, { threshold: .35 }).observe(track);
    ['pointerenter', 'focusin'].forEach(function (ev) { track.addEventListener(ev, function () { paused = true; }); });
    ['pointerleave', 'focusout'].forEach(function (ev) { track.addEventListener(ev, function () { paused = false; }); });
    setInterval(function () { if (visible && !paused && !down) go(1); }, 5200);
  }

  /* ------------------------------------------------------------------
     Lightbox (élément <dialog> natif : focus et Échap gérés)
     ------------------------------------------------------------------ */
  function initLightbox() {
    var dlg = $('#lightbox'), items = $$('.gitem'), idx = 0;
    if (!dlg || !dlg.showModal) return;
    function show(i) {
      idx = (i + items.length) % items.length;
      var it = items[idx], im = $('img', it);
      $('#lbImg').src = im.currentSrc || im.src; $('#lbImg').alt = im.alt;
      $('#lbCap').textContent = it.getAttribute('data-cap') || '';
    }
    items.forEach(function (it, i) {
      it.addEventListener('click', function () { show(i); dlg.showModal(); if (lenis) lenis.stop(); });
    });
    $('#lbClose').addEventListener('click', function () { dlg.close(); });
    $('#lbPrev').addEventListener('click', function () { show(idx - 1); });
    $('#lbNext').addEventListener('click', function () { show(idx + 1); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', function () { if (lenis) lenis.start(); });
    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') show(idx + 1); else if (e.key === 'ArrowLeft') show(idx - 1);
    });
  }

  /* ------------------------------------------------------------------
     Nuancier de la section finale
     ------------------------------------------------------------------ */
  function initSwatches() {
    var wrap = $('#swatches'), cta = $('.cta'); if (!wrap || !cta) return;
    var btns = $$('button', wrap);
    function pick(b) {
      btns.forEach(function (o) { o.setAttribute('aria-checked', o === b ? 'true' : 'false'); o.tabIndex = o === b ? 0 : -1; });
      cta.style.setProperty('--nail', b.getAttribute('data-c'));
      $('#swName').textContent = b.getAttribute('data-n');
      if (motion) gsap.fromTo('.cta__nail', { scale: .92 }, { scale: 1, duration: 1, ease: 'elastic.out(1,.45)', overwrite: 'auto' });
    }
    btns.forEach(function (b, i) {
      b.tabIndex = i === 0 ? 0 : -1;
      b.addEventListener('click', function () { pick(b); });
      b.addEventListener('keydown', function (e) {
        var j = btns.indexOf(b);
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (j + 1) % btns.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (j + btns.length - 1) % btns.length;
        else return;
        e.preventDefault(); btns[j].focus(); pick(btns[j]);
      });
    });
  }

  /* ------------------------------------------------------------------
     Vidéo d'entrée : source adaptée à l'écran, jamais en économie de données
     ------------------------------------------------------------------ */
  function initVideo() {
    var v = $('.hero__video'); if (!v) return;
    var conn = navigator.connection || {};
    if (reduce || conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '')) return; // l'image de secours suffit
    v.src = window.innerWidth >= 900 ? 'assets/video/hero-1080.mp4' : 'assets/video/hero-720.mp4';
    v.muted = true;
    var p = v.play(); if (p && p.catch) p.catch(function () {});
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (en) {
        if (en[0].isIntersecting) { var q = v.play(); if (q && q.catch) q.catch(function () {}); } else v.pause();
      }, { threshold: .05 }).observe(v);
    }
  }

  /* ------------------------------------------------------------------
     Menu plein écran (mobile)
     ------------------------------------------------------------------ */
  var menuOpen = false;
  function initMenu() {
    var burger = $('#burger'), menu = $('#menu'); if (!burger || !menu) return;
    var links = $$('.menu__links a', menu);
    if (motion) links.forEach(function (a) {
      var wrap = el('span', 'si'); // le texte monte derrière un masque
      while (a.lastChild && a.lastChild.nodeType === 3) { wrap.insertBefore(a.lastChild, wrap.firstChild); }
      a.appendChild(wrap);
    });
    function set(open) {
      menuOpen = open;
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
      if (open) { menu.classList.add('is-open'); menu.removeAttribute('inert'); if (lenis) lenis.stop(); }
      else { menu.setAttribute('inert', ''); if (lenis) lenis.start(); }
      if (motion) {
        if (open) {
          gsap.fromTo(menu, { clipPath: 'circle(0% at calc(100% - 3rem) 2.2rem)' }, { clipPath: 'circle(150% at calc(100% - 3rem) 2.2rem)', duration: 1.1, ease: 'expo.out', overwrite: true });
          gsap.fromTo($$('.menu__links .si'), { yPercent: 110 }, { yPercent: 0, duration: 1, ease: 'expo.out', stagger: .06, delay: .25 });
          gsap.fromTo('.menu__foot', { autoAlpha: 0, y: 20 }, { autoAlpha: 1, y: 0, duration: .8, ease: 'expo.out', delay: .55 });
          links[0].focus({ preventScroll: true });
        } else {
          gsap.to(menu, { clipPath: 'circle(0% at calc(100% - 3rem) 2.2rem)', duration: .7, ease: 'expo.inOut', overwrite: true, onComplete: function () { menu.classList.remove('is-open'); } });
        }
      } else {
        menu.style.clipPath = open ? 'none' : '';
        if (!open) menu.classList.remove('is-open');
      }
    }
    burger.addEventListener('click', function () { set(!menuOpen); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menuOpen) { set(false); burger.focus(); } });
    links.concat($$('.menu__foot a', menu)).forEach(function (a) { a.addEventListener('click', function () { if (menuOpen) set(false); }); });
  }

  /* ------------------------------------------------------------------
     Ancres : défilement fluide (Lenis si dispo, sinon natif)
     ------------------------------------------------------------------ */
  function initAnchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href'); if (id.length < 2) return;
        var t = $(id); if (!t) return;
        e.preventDefault();
        if (lenis) lenis.scrollTo(id === '#top' ? 0 : t, { duration: 1.6, easing: function (x) { return 1 - Math.pow(1 - x, 4); } });
        else t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
      });
    });
  }

  /* ==================================================================
     MOUVEMENT
     ================================================================== */
  function splitText(node, mode) {
    var out = [];
    (function walk(parent) {
      Array.prototype.slice.call(parent.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var frag = d.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(d.createTextNode(' ')); return; }
            if (mode === 'chars') {
              var word = el('span'); word.style.cssText = 'display:inline-block;white-space:nowrap';
              Array.from(part).forEach(function (ch) {
                var sw = el('span', 'sw'), si = el('span', 'si'); sw.setAttribute('aria-hidden', 'true');
                si.textContent = ch; sw.appendChild(si); word.appendChild(sw); out.push(si);
              });
              frag.appendChild(word);
            } else {
              var w = el('span', 'sw'), s = el('span', 'si'); w.setAttribute('aria-hidden', 'true');
              s.textContent = part; w.appendChild(s); frag.appendChild(w); out.push(s);
            }
          });
          parent.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== 'BR') walk(n);
      });
    })(node);
    return out;
  }

  function initMotion() {
    gsap.registerPlugin(ScrollTrigger);
    root.classList.add('has-motion');

    /* --- défilement fluide (inertie douce) --- */
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();

    /* --- découpe des titres --- */
    var splitMap = [];
    $$('[data-split]').forEach(function (h) {
      var label = h.textContent.replace(/\s+/g, ' ').trim();
      if (!h.getAttribute('aria-label') && /^H[1-6]$/.test(h.tagName)) h.setAttribute('aria-label', label);
      splitMap.push({ el: h, items: splitText(h, h.getAttribute('data-split')) });
    });
    var heroChars = $$('.hero__title .si');
    var footChars = $$('.footer__word .si');

    /* --- état initial des éléments d'entrée (le préchargeur les cache) --- */
    gsap.set(heroChars, { yPercent: 118 });
    gsap.set(['.hero__eyebrow', '.hero__lead', '.hero__cta .btn', '.hero__status'], { autoAlpha: 0, y: 26 });
    gsap.set('.hero__nail', { autoAlpha: 0, scale: .6 });
    gsap.set('.badge', { autoAlpha: 0, scale: .3, rotation: -120 });
    gsap.set('.hero__sun', { autoAlpha: 0, scale: .7 });
    gsap.set('.nav', { yPercent: -120 });

    /* --- préchargeur --- */
    var fontsReady = Promise.race([d.fonts && d.fonts.ready ? d.fonts.ready : Promise.resolve(), new Promise(function (r) { setTimeout(r, 3500); })]);
    var rays = $$('.loader__sun line');
    gsap.set(rays, { strokeDasharray: 1, strokeDashoffset: 1 });
    var counter = { v: 0 }, countEl = $('#loaderCount');
    var loadTl = gsap.timeline();
    loadTl.from('.loader__sun', { scale: .55, rotation: -70, autoAlpha: 0, duration: 1.3, ease: 'expo.out' }, 0)
      .to(rays, { strokeDashoffset: 0, duration: .9, stagger: .045, ease: 'power3.out' }, .1)
      .from('.loader__word span, .loader__word em', { yPercent: 115, duration: 1, ease: 'expo.out', stagger: .14 }, .3)
      .to(counter, { v: 100, duration: 1.8, ease: 'power2.inOut', onUpdate: function () { countEl.textContent = Math.round(counter.v); } }, 0);

    Promise.all([fontsReady, new Promise(function (r) { loadTl.eventCallback('onComplete', r); })]).then(exitLoader);

    function exitLoader() {
      var tl = gsap.timeline({ onComplete: function () { $('.loader').style.display = 'none'; lenis.start(); ScrollTrigger.refresh(); } });
      tl.to('.loader__center', { scale: 1.12, autoAlpha: 0, duration: .55, ease: 'power3.in' })
        .to('.loader__half--top', { yPercent: -101, duration: 1.2, ease: 'expo.inOut' }, '<.1')
        .to('.loader__half--bot', { yPercent: 101, duration: 1.2, ease: 'expo.inOut' }, '<')
        .add(heroIn, '<.35');
    }

    function heroIn() {
      var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.fromTo('.hero__video', { scale: 1.28 }, { scale: 1.02, duration: 3 }, 0)
        .to('.hero__sun', { autoAlpha: 1, scale: 1, duration: 2.4 }, 0)
        .to(heroChars, { yPercent: 0, duration: 1.5, stagger: .05 }, .1)
        .to('.hero__eyebrow', { autoAlpha: 1, y: 0, duration: 1 }, .35)
        .to('.hero__lead', { autoAlpha: 1, y: 0, duration: 1.1 }, .75)
        .to('.hero__cta .btn', { autoAlpha: 1, y: 0, duration: 1, stagger: .1 }, .9)
        .to('.hero__nail', { autoAlpha: 1, scale: 1, duration: 1.8, stagger: .15 }, .6)
        .to('.badge', { autoAlpha: 1, scale: 1, rotation: 0, duration: 1.8, ease: 'elastic.out(1,.6)' }, 1)
        .to('.hero__status', { autoAlpha: 1, y: 0, duration: 1 }, 1.1)
        .to('.nav', { yPercent: 0, duration: 1.2 }, .5);
    }

    /* --- barre de progression de lecture --- */
    gsap.to('.progress span', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: .2 } });

    /* --- navigation : se cache en descendant, revient en remontant --- */
    var nav = $('#nav'), navHidden = false, fab = $('#fab');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: function (self) {
        var y = self.scroll();
        nav.classList.toggle('is-solid', y > 60);
        if (menuOpen) return;
        if (self.direction === 1 && y > 320 && !navHidden) { navHidden = true; gsap.to(nav, { yPercent: -115, duration: .7, ease: 'power3.out', overwrite: 'auto' }); }
        else if ((self.direction === -1 || y <= 320) && navHidden) { navHidden = false; gsap.to(nav, { yPercent: 0, duration: .7, ease: 'power3.out', overwrite: 'auto' }); }
      }
    });
    if (fab) ScrollTrigger.create({ trigger: '.hero', start: 'bottom 70%', onEnter: function () { fab.classList.add('is-visible'); }, onLeaveBack: function () { fab.classList.remove('is-visible'); } });

    /* --- hero : parallax multicouche au scroll + à la souris --- */
    var heroST = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
    gsap.to('.hero__media', { yPercent: 16, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__sun', { yPercent: -22, xPercent: 6, rotation: 25, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__nail--a', { yPercent: -70, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__nail--b', { yPercent: -120, ease: 'none', scrollTrigger: heroST });
    gsap.to('.hero__inner', { yPercent: -14, autoAlpha: .1, ease: 'none', scrollTrigger: heroST });
    gsap.to('.badge', { yPercent: -60, ease: 'none', scrollTrigger: heroST });

    if (fine) {
      var layers = [['.hero__nail--a', 38], ['.hero__nail--b', -60], ['.hero__sun', -28], ['.hero__title', 12]].map(function (l) {
        var n = $(l[0]); return n && { qx: gsap.quickTo(n, 'x', { duration: 1.2, ease: 'power3.out' }), qy: gsap.quickTo(n, 'y', { duration: 1.2, ease: 'power3.out' }), k: l[1] };
      }).filter(Boolean);
      $('.hero').addEventListener('pointermove', function (e) {
        var px = e.clientX / window.innerWidth - .5, py = e.clientY / window.innerHeight - .5;
        layers.forEach(function (l) { l.qx(px * l.k); l.qy(py * l.k); });
      });
    }

    /* --- bandeaux défilants : vitesse et sens suivent le scroll --- */
    (function marquees() {
      var rows = $$('.marquee__row').map(function (row) {
        var track = $('.marquee__track', row), group = $('.marquee__group', row);
        for (var i = 0; i < 3; i++) { var c = group.cloneNode(true); c.setAttribute('aria-hidden', 'true'); $$('[data-sun]', c).forEach(function (s) { s.innerHTML = sunMarkup(); }); track.appendChild(c); }
        var r = { track: track, dir: parseFloat(row.getAttribute('data-dir')) || 1, w: 0, x: 0 };
        function measure() { r.w = group.getBoundingClientRect().width; }
        measure(); window.addEventListener('resize', measure);
        d.fonts && d.fonts.ready.then(measure);
        return r;
      });
      var scrollDir = 1, boost = 0, ts = 1;
      ScrollTrigger.create({ start: 0, end: 'max', onUpdate: function (self) { scrollDir = self.direction; boost = Math.min(5, Math.abs(self.getVelocity()) / 600); } });
      gsap.ticker.add(function (time, dt) {
        var target = scrollDir * (1 + boost); boost *= .94; ts += (target - ts) * .07;
        rows.forEach(function (r) {
          if (!r.w) return;
          r.x -= r.dir * ts * 70 * (dt / 1000);
          if (r.x <= -r.w) r.x += r.w; else if (r.x >= 0) r.x -= r.w;
          r.track.style.transform = 'translate3d(' + r.x.toFixed(2) + 'px,0,0)';
        });
      });
    })();

    /* --- titres : mots qui montent derrière un masque --- */
    splitMap.forEach(function (s) {
      if (s.el.closest('.hero') || s.el.closest('.footer')) return;
      gsap.from(s.items, { yPercent: 112, duration: 1.25, ease: 'expo.out', stagger: .055, scrollTrigger: { trigger: s.el, start: 'top 88%', once: true } });
    });
    if (footChars.length) gsap.from(footChars, { yPercent: 112, duration: 1.4, ease: 'expo.out', stagger: .05, scrollTrigger: { trigger: '.footer__word', start: 'top 98%', once: true } });

    /* --- petites apparitions --- */
    $$('.kicker, .carte__intro, .lieu__text p, .lieu__facts li, .gallery__sub, .cta__lead, .qa, .reviews__score, .reviews__ctrl, .find address, .find__h, .hours li, .stat, .swatches, .swatch__name, .cta__btns, .gallery__ig, .sel')
      .filter(function (n) { return !n.closest('.hs__track'); })
      .forEach(function (n) {
        gsap.from(n, { y: 38, autoAlpha: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: n, start: 'top 92%', once: true } });
      });

    /* --- chiffres clés en compteur --- */
    $$('[data-count]').forEach(function (n) {
      var end = parseFloat(n.getAttribute('data-count')), dec = parseInt(n.getAttribute('data-dec') || '0', 10), o = { v: 0 };
      n.textContent = (0).toFixed(dec).replace('.', ',');
      ScrollTrigger.create({ trigger: n, start: 'top 90%', once: true, onEnter: function () {
        gsap.to(o, { v: end, duration: 2.4, ease: 'power3.out', onUpdate: function () { n.textContent = o.v.toFixed(dec).replace('.', ','); } });
      } });
    });
    gsap.to('.stats__sun', { rotation: 70, ease: 'none', scrollTrigger: { trigger: '.stats', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.cta__sun', { rotation: -50, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* --- le lieu : ouverture circulaire + zoom doux + inset en parallax --- */
    gsap.fromTo('.lieu__img', { clipPath: 'circle(7% at 50% 64%)' }, { clipPath: 'circle(75% at 50% 50%)', ease: 'none', scrollTrigger: { trigger: '.lieu__visual', start: 'top 88%', end: 'center 42%', scrub: true } });
    gsap.fromTo('.lieu__img img', { scale: 1.4 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.lieu__visual', start: 'top 92%', end: 'bottom 15%', scrub: true } });
    $$('[data-parallax]').forEach(function (n) {
      gsap.fromTo(n, { yPercent: 0 }, { yPercent: parseFloat(n.getAttribute('data-parallax')), ease: 'none', scrollTrigger: { trigger: n.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* --- galerie : colonnes à vitesses différentes, entrées échelonnées, images qui glissent dans leur cadre --- */
    $$('.gcol').forEach(function (col) {
      var sp = parseFloat(col.getAttribute('data-speed')) || 0;
      gsap.to(col, { y: function () { return sp * window.innerHeight * 1.05; }, ease: 'none', scrollTrigger: { trigger: '.gallery__cols', start: 'top bottom', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
    });
    gsap.set('.gitem', { autoAlpha: 0, y: 70, scale: .94 });
    ScrollTrigger.batch('.gitem', { start: 'top 94%', once: true, onEnter: function (b) { gsap.to(b, { autoAlpha: 1, y: 0, scale: 1, duration: 1.3, ease: 'expo.out', stagger: .1 }); } });
    $$('.gitem img').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: img.parentNode, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* --- avis : cartes qui entrent en cascade --- */
    gsap.set('.rcard', { autoAlpha: 0, x: 90, rotation: 2 });
    ScrollTrigger.batch('.rcard', { start: 'top 96%', once: true, onEnter: function (b) { gsap.to(b, { autoAlpha: 1, x: 0, rotation: 0, duration: 1.3, ease: 'expo.out', stagger: .12 }); } });

    /* --- appel à l'action : ongle qui flotte --- */
    gsap.to('.cta__nail', { y: -22, rotation: -3, duration: 3.2, ease: 'sine.inOut', yoyo: true, repeat: -1 });
    gsap.fromTo('.cta__nailwrap', { yPercent: 14 }, { yPercent: -14, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });

    /* --- zoom Ken Burns très lent sur les grandes photos du récit --- */
    $$('.story__media img').forEach(function (img, i) {
      gsap.fromTo(img, { scale: 1 }, { scale: 1.12, duration: 14, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * .8 });
    });

    /* --- micro-interactions (souris fine uniquement) --- */
    if (fine) {
      $$('[data-tilt]').forEach(function (card) {
        var glare = $('.glare', card);
        var rx = gsap.quickTo(card, 'rotationX', { duration: .6, ease: 'power3.out' }), ry = gsap.quickTo(card, 'rotationY', { duration: .6, ease: 'power3.out' });
        gsap.set(card, { transformPerspective: 900 });
        card.addEventListener('pointermove', function (e) {
          var r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
          ry(px * 12); rx(-py * 12);
          if (glare) gsap.to(glare, { x: px * r.width * 1.2, y: py * r.height * 1.2, opacity: 1, duration: .5, overwrite: 'auto' });
        });
        card.addEventListener('pointerleave', function () { ry(0); rx(0); if (glare) gsap.to(glare, { opacity: 0, duration: .6 }); });
      });

      $$('[data-magnetic]').forEach(function (b) {
        var t = $('.btn__t', b);
        var q = { bx: gsap.quickTo(b, 'x', { duration: .7, ease: 'power3.out' }), by: gsap.quickTo(b, 'y', { duration: .7, ease: 'power3.out' }), tx: gsap.quickTo(t, 'x', { duration: .7, ease: 'power3.out' }), ty: gsap.quickTo(t, 'y', { duration: .7, ease: 'power3.out' }) };
        b.addEventListener('pointermove', function (e) {
          var r = b.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
          q.bx(dx * .3); q.by(dy * .38); q.tx(dx * .12); q.ty(dy * .16);
        });
        b.addEventListener('pointerleave', function () { q.bx(0); q.by(0); q.tx(0); q.ty(0); });
      });

      var cur = $('.cursor'), lab = $('.cursor__label');
      var cx = gsap.quickTo(cur, 'x', { duration: .35, ease: 'power3' }), cy = gsap.quickTo(cur, 'y', { duration: .35, ease: 'power3' });
      window.addEventListener('pointermove', function (e) { cx(e.clientX); cy(e.clientY); gsap.to(cur, { opacity: 1, duration: .3, overwrite: 'auto' }); }, { passive: true });
      d.addEventListener('pointerover', function (e) {
        var t = e.target.closest && e.target.closest('[data-cursor]'), l = e.target.closest && e.target.closest('a, button, [role="radio"], [role="tab"]');
        if (t) { lab.textContent = t.getAttribute('data-cursor'); gsap.to(cur, { '--s': 5.6, duration: .45, ease: 'power3.out' }); gsap.to(lab, { opacity: 1, duration: .3 }); }
        else { gsap.to(cur, { '--s': l ? 2.4 : 1, duration: .45, ease: 'power3.out' }); gsap.to(lab, { opacity: 0, duration: .2 }); }
      });
      d.addEventListener('pointerleave', function () { gsap.to(cur, { opacity: 0, duration: .3 }); });
    }

    /* --- sections « scénarisées » : desktop = épinglées ; mobile = simples apparitions --- */
    var mm = gsap.matchMedia();

    mm.add('(min-width: 900px)', function () {
      /* récit épinglé, étape par étape */
      var steps = $$('.story__step'), n = steps.length;
      var texts = steps.map(function (s) { return $('.story__text', s); }), medias = steps.map(function (s) { return $('.story__media', s); });
      gsap.set(texts.slice(1), { autoAlpha: 0, yPercent: 16 });
      gsap.set(medias.slice(1), { autoAlpha: 0, yPercent: 12, scale: 1.08, rotation: 3 });
      var tl = gsap.timeline({
        defaults: { ease: 'power2.inOut' },
        scrollTrigger: { trigger: '.story', start: 'top top', end: function () { return '+=' + Math.round(window.innerHeight * (n - 1) * 1.0); }, pin: true, scrub: .7, anticipatePin: 1, invalidateOnRefresh: true }
      });
      for (var i = 1; i < n; i++) {
        var at = (i - 1) * 1.3;
        tl.to(texts[i - 1], { autoAlpha: 0, yPercent: -16, duration: .5 }, at + .4)
          .to(medias[i - 1], { autoAlpha: 0, yPercent: -12, scale: .94, rotation: -3, duration: .55 }, at + .4)
          .to(texts[i], { autoAlpha: 1, yPercent: 0, duration: .55 }, at + .7)
          .to(medias[i], { autoAlpha: 1, yPercent: 0, scale: 1, rotation: 0, duration: .6 }, at + .7);
      }
      tl.to({}, { duration: .5 });
      tl.to('.story__fill', { scaleY: 1, ease: 'none', duration: tl.duration() }, 0);

      /* prestations : défilement horizontal piloté par le scroll vertical */
      var pin = $('.hs__pin'), track = $('[data-hs-track]');
      var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
      var hsTween = gsap.to(track, {
        x: function () { return -dist(); }, ease: 'none',
        scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .8, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: function (self) { gsap.set('.hs__bar span', { scaleX: self.progress }); } }
      });
      $$('[data-hs-img]').forEach(function (img) {
        gsap.fromTo(img, { xPercent: 6 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: img.closest('.hcard'), containerAnimation: hsTween, start: 'left right', end: 'right left', scrub: true } });
      });
    });

    mm.add('(max-width: 899px)', function () {
      $$('.story__step').forEach(function (s) {
        gsap.from([$('.story__text', s), $('.story__media', s)], { y: 60, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: .15, scrollTrigger: { trigger: s, start: 'top 82%', once: true } });
      });
    });

    /* --- recalculs une fois polices et images prêtes --- */
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });
    if (d.fonts && d.fonts.ready) d.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }

  /* ------------------------------------------------------------------
     Démarrage
     ------------------------------------------------------------------ */
  initStatus(); initCarte(); initFaq(); initReviews(); initLightbox(); initSwatches(); initMenu(); initVideo();

  if (motion) {
    try { initMotion(); } catch (err) { if (window.console) console.error(err); var l = $('.loader'); if (l) l.style.display = 'none'; if (lenis) lenis.start(); }
  } else {
    var l0 = $('.loader'); if (l0) l0.style.display = 'none';
    var fb = $('#fab'); if (fb) fb.classList.add('is-visible'); // sans ScrollTrigger, la barre mobile reste visible
    var nv = $('#nav');
    var solid = function () { nv.classList.toggle('is-solid', window.scrollY > 60); };
    window.addEventListener('scroll', solid, { passive: true }); solid();
  }
  initAnchors();
})();
