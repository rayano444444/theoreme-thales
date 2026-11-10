/* =========================================================
   THALÈS — diaporama
   Navigation clavier, fragments, sommaire, notes, labo,
   graphique, vidéo et cartes flash.
   ========================================================= */
(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const stage = $('#stage');
  const stageWrap = $('#stage-wrap');
  const slides = $$('.slide');
  const total = slides.length;

  const titleEl = $('#slide-title');
  const counterEl = $('#slide-counter');
  const barFill = $('#bar-fill');
  const dotsEl = $('#frag-dots');
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');
  const notesTitle = $('#notes-title');
  const notesBody = $('#notes-body');
  const notesNextTitle = $('#notes-next-title');
  const overviewGrid = $('#overview-grid');

  const reduceQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduce = reduceQuery.matches;
  let index = 0;
  let frag = -1;
  let lastFocus = null;

  const pad2 = n => String(n).padStart(2, '0');
  const clamp = (n, min, max) => Math.min(max, Math.max(min, n));
  const fragsOf = slide => $$('.frag', slide);

  /* ---------- mise à l'échelle ---------- */
  function fit() {
    const small = window.innerWidth < 760;
    const side = small ? 8 : 24;
    const topPad = small ? 52 : 66;
    const bottomPad = small ? 56 : 78;
    const w = window.innerWidth - side * 2;
    const h = window.innerHeight - topPad - bottomPad;
    const s = Math.max(0.12, Math.min(w / 1600, h / 900));
    stage.style.setProperty('--s', s.toFixed(4));
    stage.style.transform = `translate(-50%,-50%) scale(${s})`;
    stage.style.top = `${topPad + h / 2}px`;
  }

  /* ---------- chrome ---------- */
  function renderDots() {
    if (!dotsEl) return;
    const frags = fragsOf(slides[index]);
    dotsEl.innerHTML = '';
    const show = !reduce && frags.length > 0;
    dotsEl.classList.toggle('is-on', show);
    if (!show) return;
    frags.forEach((_, i) => {
      const dot = document.createElement('i');
      if (i <= frag) dot.className = 'is-in';
      dotsEl.appendChild(dot);
    });
  }

  function updateChrome() {
    const slide = slides[index];
    const title = slide.dataset.title || '';
    if (titleEl) titleEl.textContent = title;
    if (counterEl) counterEl.textContent = `${pad2(index + 1)} / ${pad2(total)}`;
    if (barFill) barFill.style.transform = `scaleX(${(index + 1) / total})`;
    if (prevBtn) prevBtn.disabled = index === 0;
    if (nextBtn) nextBtn.disabled = index === total - 1 && (reduce || frag >= fragsOf(slide).length - 1);
    document.title = `${pad2(index + 1)} · ${title} — Thalès`;
    updateNotes();
    refreshOverview();
  }

  function updateNotes() {
    if (!notesTitle) return;
    const slide = slides[index];
    notesTitle.textContent = `Diapositive ${pad2(index + 1)} — ${slide.dataset.title || ''}`;
    if (notesBody) notesBody.textContent = slide.dataset.notes || 'Pas de note pour cette diapositive.';
    if (notesNextTitle) notesNextTitle.textContent = slides[index + 1] ? slides[index + 1].dataset.title : 'Fin du diaporama';
  }

  /* ---------- navigation ---------- */
  function setHash() {
    try {
      history.replaceState(null, '', `#${index + 1}`);
    } catch (err) {
      /* file:// ou navigateur restrictif : on ignore */
    }
  }

  function activate(target, dir = 1, opts = {}) {
    target = clamp(target, 0, total - 1);
    const next = slides[target];
    const old = slides[index];
    const changed = old !== next;

    if (changed) {
      old.classList.remove('is-active');
      old.classList.add(dir > 0 ? 'is-before' : 'is-after');
      old.setAttribute('aria-hidden', 'true');
      old.inert = true;
      if (typeof pauseDeckVideo === 'function') pauseDeckVideo();
      if (typeof stopLab === 'function') stopLab();
    }

    index = target;
    next.classList.remove('is-before', 'is-after');
    next.removeAttribute('aria-hidden');
    next.inert = false;

    const frags = fragsOf(next);
    const revealAll = reduce || opts.revealAll || dir < 0;
    if (revealAll) {
      frag = frags.length - 1;
      frags.forEach(el => el.classList.add('is-in'));
    } else {
      frag = -1;
      frags.forEach(el => el.classList.remove('is-in'));
    }

    // relance les animations d'entrée de la diapositive
    next.classList.remove('is-active');
    void next.offsetWidth;
    next.classList.add('is-active');

    renderDots();
    updateChrome();
    setHash();

    if (typeof onSlideChanged === 'function') onSlideChanged(next);
  }

  function next() {
    const frags = fragsOf(slides[index]);
    if (!reduce && frag < frags.length - 1) {
      frag += 1;
      frags[frag].classList.add('is-in');
      renderDots();
      updateChrome();
      return;
    }
    if (index < total - 1) activate(index + 1, 1);
  }

  function prev() {
    const frags = fragsOf(slides[index]);
    if (!reduce && frag >= 0) {
      frags[frag].classList.remove('is-in');
      frag -= 1;
      renderDots();
      updateChrome();
      return;
    }
    if (index > 0) activate(index - 1, -1);
  }

  /* ---------- sommaire ---------- */
  let overviewBuilt = false;
  function buildOverview() {
    if (!overviewGrid || overviewBuilt) return;
    slides.forEach((slide, i) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ov-item';
      btn.dataset.goto = String(i);
      const num = document.createElement('span');
      num.textContent = pad2(i + 1);
      const box = document.createElement('div');
      const b = document.createElement('b');
      b.textContent = slide.dataset.title || `Diapositive ${i + 1}`;
      const small = document.createElement('small');
      small.textContent = slide.dataset.notes ? 'Note disponible' : 'Diapositive';
      box.append(b, small);
      btn.append(num, box);
      btn.addEventListener('click', () => {
        closeOverlays();
        activate(i, i >= index ? 1 : -1, { revealAll: true });
      });
      overviewGrid.appendChild(btn);
    });
    overviewBuilt = true;
  }

  function refreshOverview() {
    if (!overviewBuilt) return;
    $$('.ov-item', overviewGrid).forEach((btn, i) => {
      btn.classList.toggle('is-current', i === index);
    });
  }

  /* ---------- overlays ---------- */
  const overlays = $$('.overlay');
  function anyOverlayOpen() {
    return overlays.some(el => !el.hidden);
  }
  function openOverlay(el) {
    lastFocus = document.activeElement;
    overlays.forEach(o => { if (o !== el) o.hidden = true; });
    el.hidden = false;
    const focusTarget = $('.overlay-close', el) || el;
    if (focusTarget && focusTarget.focus) focusTarget.focus({ preventScroll: true });
  }
  function closeOverlays() {
    overlays.forEach(el => { el.hidden = true; });
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }
  function toggleOverlay(el) {
    if (!el) return;
    if (el.hidden) openOverlay(el); else closeOverlays();
  }

  /* ---------- lumière ---------- */
  function toggleFullscreen() {
    const root = document.documentElement;
    if (!document.fullscreenElement) {
      const req = root.requestFullscreen || root.webkitRequestFullscreen;
      if (req) {
        const p = req.call(root);
        if (p && p.catch) p.catch(() => {});
      }
    } else if (document.exitFullscreen) {
      document.exitFullscreen().catch(() => {});
    }
  }

  /* ---------- branchements chrome ---------- */
  prevBtn.addEventListener('click', prev);
  nextBtn.addEventListener('click', next);

  $$('[data-action]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'overview') toggleOverlay($('#overview'));
      if (action === 'notes') toggleOverlay($('#notes'));
      if (action === 'help') toggleOverlay($('#help'));
      if (action === 'fullscreen') toggleFullscreen();
    });
  });

  $$('[data-close]').forEach(el => {
    el.addEventListener('click', closeOverlays);
  });

  $$('.overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) closeOverlays();
    });
  });

  document.addEventListener('click', e => {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const raw = link.getAttribute('href').slice(1);
    if (!/^\d+$/.test(raw)) return;
    e.preventDefault();
    const target = clamp(parseInt(raw, 10) - 1, 0, total - 1);
    closeOverlays();
    activate(target, target >= index ? 1 : -1, { revealAll: true });
  });

  window.addEventListener('hashchange', () => {
    const raw = location.hash.replace('#', '');
    if (!/^\d+$/.test(raw)) return;
    const target = clamp(parseInt(raw, 10) - 1, 0, total - 1);
    if (target !== index) activate(target, target >= index ? 1 : -1, { revealAll: true });
  });

  /* ---------- clavier ---------- */
  document.addEventListener('keydown', e => {
    const tag = (e.target.tagName || '').toUpperCase();
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(tag);
    const interactive = /^(BUTTON|A|INPUT|TEXTAREA|SELECT|VIDEO)$/.test(tag);

    if (e.key === 'Escape') {
      if (anyOverlayOpen()) {
        e.preventDefault();
        closeOverlays();
      }
      return;
    }
    if (anyOverlayOpen()) return;
    if (typing) return;

    if ((e.key === ' ' || e.key === 'Enter') && interactive) return;
    if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown') {
      e.preventDefault();
      next();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
      e.preventDefault();
      prev();
    } else if (e.key === 'Home') {
      e.preventDefault();
      activate(0, -1, { revealAll: true });
    } else if (e.key === 'End') {
      e.preventDefault();
      activate(total - 1, 1, { revealAll: true });
    } else if (e.key.toLowerCase() === 'o' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleOverlay($('#overview'));
    } else if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleOverlay($('#notes'));
    } else if (e.key.toLowerCase() === 'f' && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === '?' || (e.key.toLowerCase() === 'h' && !e.ctrlKey && !e.metaKey && !e.altKey)) {
      e.preventDefault();
      toggleOverlay($('#help'));
    }
  });

  /* ---------- balayage tactile ---------- */
  let startX = 0;
  let startY = 0;
  let swipeOn = false;
  stageWrap.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return;
    if (e.target.closest('input,button,a,video,.overlay')) return;
    startX = e.clientX;
    startY = e.clientY;
    swipeOn = true;
  });
  stageWrap.addEventListener('pointerup', e => {
    if (!swipeOn) return;
    swipeOn = false;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.3) {
      if (dx < 0) next(); else prev();
    }
  });
  stageWrap.addEventListener('pointercancel', () => { swipeOn = false; });

  /* ---------- préférence de mouvement ---------- */
  const onMotionChange = e => {
    reduce = e.matches;
    const current = slides[index];
    const frags = fragsOf(current);
    if (reduce) {
      frag = frags.length - 1;
      frags.forEach(el => el.classList.add('is-in'));
    }
    renderDots();
    updateChrome();
  };
  if (reduceQuery.addEventListener) reduceQuery.addEventListener('change', onMotionChange);
  else if (reduceQuery.addListener) reduceQuery.addListener(onMotionChange);

  /* ---------- dimension ---------- */
  let resizeFrame = 0;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeFrame);
    resizeFrame = requestAnimationFrame(fit);
  });
  window.addEventListener('orientationchange', () => setTimeout(fit, 120));

  /* ---------- démarrage ---------- */
  function init() {
    fit();
    buildOverview();

    slides.forEach((slide, i) => {
      if (i !== 0) {
        slide.setAttribute('aria-hidden', 'true');
        slide.inert = true;
      }
      slide.inert = i !== 0;
    });

    const raw = location.hash.replace('#', '');
    const initial = /^\d+$/.test(raw) ? clamp(parseInt(raw, 10) - 1, 0, total - 1) : 0;
    activate(initial, 1, { revealAll: true });
    document.body.classList.remove('is-loading');
    document.body.classList.add('is-ready');
  }

  /* =======================================================
     Laboratoire
     ======================================================= */
  let labTimer = null;
  let labK = 0.62;
  let labDir = 1;

  const fr = (value, digits = 2) => value.toFixed(digits).replace('.', ',');

  function setLabK(k) {
    const m = $('#lab-m');
    const n = $('#lab-n');
    const mn = $('#lab-mn-path');
    const small = $('#lab-small');
    if (!m || !n || !mn) return;

    labK = clamp(k, 0.12, 0.96);
    const ax = 310, ay = 40, bx = 90, by = 440, cx = 530, cy = 440;
    const mx = ax + labK * (bx - ax);
    const my = ay + labK * (by - ay);
    const nx = ax + labK * (cx - ax);
    const ny = my;

    m.setAttribute('cx', mx.toFixed(1));
    m.setAttribute('cy', my.toFixed(1));
    n.setAttribute('cx', nx.toFixed(1));
    n.setAttribute('cy', ny.toFixed(1));
    mn.setAttribute('d', `M${mx.toFixed(1)} ${my.toFixed(1)}H${nx.toFixed(1)}`);
    if (small) small.setAttribute('d', `M${ax} ${ay}L${mx.toFixed(1)} ${my.toFixed(1)}H${nx.toFixed(1)}Z`);

    const ratio = fr(labK, 3);
    const slider = $('#lab-slider');
    if (slider && document.activeElement !== slider) slider.value = String(Math.round(labK * 100));
    const setText = (sel, text) => { const el = $(sel); if (el) el.textContent = text; };
    setText('#lab-k', fr(labK, 2));
    setText('#lab-k-label', fr(labK, 2));
    setText('#lab-am', ratio);
    setText('#lab-an', ratio);
    setText('#lab-mn', ratio);
    setText('#lab-val-am', `${fr(labK * 10, 2)} u`);
    setText('#lab-val-an', `${fr(labK * 12, 2)} u`);
    setText('#lab-val-mn', `${fr(labK * 9, 2)} u`);
    setText('#lab-lock', `${ratio} = ${ratio} = ${ratio}`);
    setText('#lab-area', fr(labK * labK, 2));
    setText('#lab-hint', `M est à ${Math.round(labK * 100)} % de [AB]`);

    [['#lab-bar-am', labK], ['#lab-bar-an', labK], ['#lab-bar-mn', labK]].forEach(([sel, value]) => {
      const el = $(sel);
      if (el) el.style.width = `${(value * 100).toFixed(1)}%`;
    });
  }

  function stopLab() {
    if (labTimer) {
      clearInterval(labTimer);
      labTimer = null;
    }
    const btn = $('#lab-play');
    if (btn) {
      btn.setAttribute('aria-pressed', 'false');
      const label = $('span', btn);
      if (label) label.textContent = 'Animer';
    }
  }

  function toggleLab() {
    const btn = $('#lab-play');
    if (labTimer) {
      stopLab();
      return;
    }
    labDir = 1;
    labTimer = setInterval(() => {
      let value = labK + 0.006 * labDir;
      if (value > 0.94) { value = 0.94; labDir = -1; }
      if (value < 0.16) { value = 0.16; labDir = 1; }
      setLabK(value);
    }, 40);
    if (btn) {
      btn.setAttribute('aria-pressed', 'true');
      const label = $('span', btn);
      if (label) label.textContent = 'Pause';
    }
  }

  function initLab() {
    const slider = $('#lab-slider');
    if (!slider || !$('#deck-lab')) return;
    slider.addEventListener('input', () => {
      stopLab();
      setLabK(parseInt(slider.value, 10) / 100);
    });
    const play = $('#lab-play');
    if (play) play.addEventListener('click', toggleLab);
    const reset = $('#lab-reset');
    if (reset) {
      reset.addEventListener('click', () => {
        stopLab();
        setLabK(0.62);
        const s = $('#lab-slider');
        if (s) s.value = '62';
      });
    }
    setLabK(0.62);
  }

  /* =======================================================
     Vidéo
     ======================================================= */
  function formatTime(seconds) {
    const s = Math.max(0, Math.round(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function pauseDeckVideo() {
    const video = $('#deck-video');
    if (!video) return;
    if (!video.paused) video.pause();
    const overlay = $('#deck-video-overlay');
    if (overlay) overlay.classList.remove('is-off');
  }

  function initVideo() {
    const video = $('#deck-video');
    if (!video) return;
    const overlay = $('#deck-video-overlay');
    const play = $('#deck-video-play');
    const sound = $('#deck-video-sound');
    const badge = $('.video-badge', $('#deck-video-frame'));

    video.muted = true;

    const hideOverlay = () => { if (overlay) overlay.classList.add('is-off'); };
    const showOverlay = () => { if (overlay) overlay.classList.remove('is-off'); };

    const start = () => {
      const p = video.play();
      if (p && p.catch) p.catch(() => {});
    };

    if (play) {
      play.addEventListener('click', e => {
        e.stopPropagation();
        start();
      });
    }
    video.addEventListener('click', () => {
      if (video.paused) start(); else video.pause();
    });
    video.addEventListener('play', hideOverlay);
    video.addEventListener('pause', showOverlay);
    video.addEventListener('ended', showOverlay);

    if (sound) {
      sound.addEventListener('click', e => {
        e.stopPropagation();
        video.muted = !video.muted;
        sound.setAttribute('aria-pressed', String(!video.muted));
        sound.setAttribute('aria-label', video.muted ? 'Activer le son' : 'Couper le son');
      });
    }

    let knownDuration = 0;
    const readDuration = () => {
      const d = video.duration;
      if (!Number.isFinite(d) || d <= 0) return;
      // certains navigateurs annoncent d'abord une durée partielle
      // sur un MP4 fragmenté : on ne revient jamais en arrière.
      if (d > knownDuration) knownDuration = d;
      if (badge) badge.textContent = formatTime(knownDuration);
    };
    video.addEventListener('loadedmetadata', readDuration);
    video.addEventListener('durationchange', readDuration);
    if (video.readyState >= 1) readDuration();
  }

  /* =======================================================
     Cartes flash
     ======================================================= */
  function initFlashes() {
    $$('.flash').forEach(card => {
      card.addEventListener('click', () => {
        const on = card.classList.toggle('is-revealed');
        card.setAttribute('aria-pressed', String(on));
      });
    });
  }

  /* =======================================================
     Documents
     ======================================================= */
  function initDocs() {
    const lightbox = $('#lightbox');
    const img = $('#lightbox-img');
    const caption = $('#lightbox-caption');
    if (!lightbox || !img) return;

    $$('.doc-zoom').forEach(btn => {
      btn.addEventListener('click', () => {
        const source = btn.dataset.doc;
        if (!source) return;
        const thumb = $('img', btn);
        img.src = source;
        img.alt = thumb ? thumb.alt : '';
        if (caption) caption.textContent = btn.dataset.caption || '';
        openOverlay(lightbox);
      });
    });

    const reset = () => {
      img.removeAttribute('src');
      img.alt = '';
    };
    lightbox.addEventListener('click', e => {
      if (e.target.closest('[data-close]') || e.target === lightbox) reset();
    });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && !lightbox.hidden) reset();
    });
  }

  /* =======================================================
     Quiz — quinze questions
     ======================================================= */
  const QUIZ = [
    {
      tag: 'Histoire',
      q: 'En quelle année Thalès serait-il né ?',
      type: 'mcq',
      options: ['Vers 546 av. J.-C.', 'Vers 624 apr. J.-C.', 'Vers 624 av. J.-C.', 'Vers 1200 av. J.-C.'],
      answer: 2,
      why: 'La tradition place sa naissance vers 624 et sa mort vers 546 avant notre ère.'
    },
    {
      tag: 'Histoire',
      q: 'Dans quelle cité grecque vivait-il ?',
      type: 'mcq',
      options: ['Athènes', 'Alexandrie', 'Syracuse', 'Milet'],
      answer: 3,
      why: 'Milet, en Ionie, sur la côte ouest de l’Asie Mineure : une cité marchande ouverte sur la mer.'
    },
    {
      tag: 'Histoire',
      q: 'Pourquoi faut-il lire les récits sur Thalès avec prudence ?',
      type: 'mcq',
      options: ['Il a vécu au Moyen Âge', 'Aucun écrit de sa main n’a survécu', 'Ses livres ont brûlé à Rome', 'Il n’a jamais existé'],
      answer: 1,
      why: 'Hérodote, Diogène Laërce et Proclus écrivent longtemps après lui : ce sont des témoignages, pas des archives.'
    },
    {
      tag: 'Calcul & mesure',
      q: 'Pour mesurer la pyramide, quelle hypothèse rend les deux triangles semblables ?',
      type: 'mcq',
      options: ['Le sol est parfaitement plat', 'La pyramide est régulière', 'Les rayons du Soleil sont parallèles', 'Le bâton est vertical'],
      answer: 2,
      why: 'C’est le parallélisme des rayons qui donne des angles égaux. La verticalité du bâton ne suffit pas à elle seule.'
    },
    {
      tag: 'Cadre',
      q: 'Quelle condition est indispensable au théorème direct ?',
      type: 'mcq',
      options: ['Un angle droit', 'Une droite parallèle à un côté', 'Deux côtés égaux', 'Un cercle'],
      answer: 1,
      why: 'Sans parallèle, pas de configuration de Thalès : c’est l’hypothèse, jamais la conclusion.'
    },
    {
      tag: 'Cadre',
      q: 'Dans AM/AB = AN/AC, que représente le point A ?',
      type: 'mcq',
      options: ['Le milieu de [BC]', 'Le pied de la hauteur', 'Le centre du cercle', 'Le sommet commun aux deux triangles'],
      answer: 3,
      why: 'A est le sommet d’où partent les deux sécantes. Il reste en haut des fractions, dans les deux rapports.'
    },
    {
      tag: 'Démonstration',
      q: 'Deux triangles ont deux angles égaux. Que peut-on en déduire ?',
      type: 'mcq',
      options: ['Ils ont la même aire', 'Ils sont semblables, donc leurs côtés sont proportionnels', 'Ils sont rectangles', 'Ils sont symétriques'],
      answer: 1,
      why: 'Deux angles suffisent : le troisième l’est aussi. Les triangles ont la même forme, donc des côtés proportionnels.'
    },
    {
      tag: 'Pièges',
      q: 'La réciproque du théorème sert à…',
      type: 'mcq',
      options: ['Calculer une longueur manquante', 'Calculer une aire', 'Prouver que deux droites sont parallèles', 'Trouver un angle droit'],
      answer: 2,
      why: 'Pour calculer une longueur, on utilise le théorème direct. La réciproque part des longueurs pour prouver le parallélisme.'
    },
    {
      tag: 'Calcul & mesure',
      q: 'Un bâton de 1,20 m projette une ombre de 1,80 m. L’ombre d’un arbre mesure 9 m. Quelle est la hauteur de l’arbre ?',
      type: 'num',
      answer: 6,
      unit: 'm',
      why: 'h = 1,20 × 9 ÷ 1,80 = 6. Les deux rapports valent 0,666… : c’est cohérent.'
    },
    {
      tag: 'Calcul & mesure',
      q: 'Méthode du miroir : l’œil est à 1,60 m, à 2 m du miroir ; l’arbre est à 8 m du miroir. Quelle est la hauteur de l’arbre ?',
      type: 'num',
      answer: 6.4,
      unit: 'm',
      why: 'h = 1,60 × 8 ÷ 2 = 6,4 m. La visée remplace le rayon de Soleil.'
    },
    {
      tag: 'Calcul & mesure',
      q: 'Sur une carte au 1/25 000, deux points sont séparés de 4,8 cm. Quelle est la distance réelle, en kilomètres ?',
      type: 'num',
      answer: 1.2,
      unit: 'km',
      why: '4,8 × 25 000 = 120 000 cm = 1 200 m = 1,2 km.'
    },
    {
      tag: 'Visée & projet',
      q: 'Dans le projet de classe, à quoi sert GeoGebra ?',
      type: 'mcq',
      options: ['Calculer la moyenne de la classe', 'Superposer les triangles sur une photo réelle', 'Créer la vidéo', 'Imprimer la grille d’évaluation'],
      answer: 1,
      why: 'On importe la photo de scène, puis on fait glisser le modèle théorique sur le réel pour vérifier les alignements.'
    },
    {
      tag: 'Visée & projet',
      q: 'Dans la grille d’évaluation, que signifie « Très bien » pour le calcul ?',
      type: 'mcq',
      options: ['Le résultat est donné sans unité', 'Le calcul est fait à la calculatrice', 'La figure est jolie', 'La proportion est posée et vérifiée'],
      answer: 3,
      why: 'On évalue la démarche : proportion posée, calcul mené, résultat vérifié — pas seulement le nombre final.'
    },
    {
      tag: 'Visée & projet',
      q: 'Sans soleil, quelle méthode fabrique une configuration de Thalès ?',
      type: 'mcq',
      options: ['Mesurer avec un télémètre laser', 'Compter les pas autour de l’arbre', 'Viser avec un miroir au sol ou une croix du bûcheron', 'Attendre la nuit'],
      answer: 2,
      why: 'Le miroir renvoie le sommet vers l’œil ; la croix du bûcheron aligne deux points à bout de bras.'
    },
    {
      tag: 'Pièges',
      q: 'Qu’est-ce qui distingue Thalès de Pythagore ?',
      type: 'mcq',
      options: ['Thalès : des carrés ; Pythagore : des quotients', 'Thalès : des quotients et une parallèle ; Pythagore : des carrés et un angle droit', 'Les deux parlent d’angles droits', 'Thalès ne sert qu’aux pyramides'],
      answer: 1,
      why: 'La parallèle et les quotients d’un côté, l’angle droit et les carrés de l’autre. Deux outils, deux situations.'
    }
  ];

  let quizState = null;
  const lastQuestion = QUIZ.length - 1;

  const quizParse = raw => {
    const cleaned = String(raw).replace(',', '.').replace(/[^0-9.\-]/g, '');
    const value = Number.parseFloat(cleaned);
    return Number.isFinite(value) ? value : null;
  };

  const quizScore = () => quizState.answers.filter(a => a && a.correct).length;

  function renderQuiz() {
    const s = quizState;
    if (!s) return;
    const q = QUIZ[s.index];
    const answer = s.answers[s.index];
    const score = quizScore();
    const count = $('#quiz-count');
    const scoreEl = $('#quiz-score');
    const dots = $('#quiz-dots');
    const body = $('#quiz-body');
    const prevBtn = $('#quiz-prev');
    const nextBtn = $('#quiz-next');
    const hint = $('#quiz-hint');

    if (count) count.textContent = `Question ${String(s.index + 1).padStart(2, '0')} / ${QUIZ.length}`;
    if (scoreEl) scoreEl.textContent = `${score} / ${QUIZ.length}`;
    if (dots) {
      dots.innerHTML = QUIZ.map((_, i) => {
        const a = s.answers[i];
        const cls = a ? (a.correct ? 'quiz-dot--good' : 'quiz-dot--bad') : (i === s.index ? 'quiz-dot--now' : '');
        return `<span class="quiz-dot ${cls}"></span>`;
      }).join('');
    }
    if (!body) return;

    if (s.finished) {
      const total = QUIZ.length;
      const message = score === total
        ? 'Sans faute. Tu peux fermer ce diaporama et ouvrir le quiz du site.'
        : score >= 12
          ? 'Très solide. Relis juste les questions ratées, puis passe au site.'
          : score >= 8
            ? 'Les bases sont là. Reviens sur le cadre (07), le calcul (10) et la rédaction (16).'
            : 'À revoir tranquillement. Reprends les diapositives 5 à 10, puis retente le quiz.';
      body.innerHTML = `
        <div class="quiz-result">
          <p class="quiz-result-eyebrow">Résultat</p>
          <p class="quiz-result-score"><b>${score}</b><span> / ${total}</span></p>
          <p class="quiz-result-title">${score === total ? 'Sans faute.' : score >= 12 ? 'Très bon passage.' : score >= 8 ? 'En progrès.' : 'Le chemin est ouvert.'}</p>
          <p class="quiz-result-text">${message}</p>
          <div class="quiz-result-actions">
            <button class="quiz-restart" type="button" id="quiz-restart">Rejouer</button>
            <a class="quiz-result-link" href="index.html#quiz">Le quiz du site <span aria-hidden="true">→</span></a>
          </div>
        </div>`;
      if (prevBtn) prevBtn.hidden = true;
      if (nextBtn) nextBtn.hidden = true;
      if (hint) hint.hidden = true;
      const restart = $('#quiz-restart');
      if (restart) restart.addEventListener('click', resetQuiz);
      return;
    }

    if (prevBtn) { prevBtn.hidden = false; prevBtn.disabled = s.index === 0; }
    if (nextBtn) nextBtn.hidden = false;
    if (hint) hint.hidden = false;

    const correctLabel = q.type === 'mcq'
      ? q.options[q.answer].replace(/[.?!]+$/, '')
      : `${String(q.answer).replace('.', ',')} ${q.unit}`;
    const feedback = answer
      ? `<p class="quiz-feedback ${answer.correct ? 'is-good' : 'is-bad'}">${
          answer.correct
            ? `<b>Juste.</b> ${q.why}`
            : `<b>Pas tout à fait.</b> La bonne réponse était <b>${correctLabel}</b>. ${q.why}`
        }</p>`
      : `<p class="quiz-feedback">${q.type === 'num' ? 'Entre un nombre, puis valide.' : 'Choisis une réponse, puis valide.'} L’explication s’affiche dans tous les cas.</p>`;

    if (q.type === 'mcq') {
      const options = q.options.map((opt, i) => {
        let cls = 'qopt';
        if (!answer && s.selected === i) cls += ' is-selected';
        if (answer) {
          if (i === q.answer) cls += ' is-good';
          else if (i === answer.picked) cls += ' is-bad';
          else cls += ' is-dim';
        }
        return `<button class="${cls}" type="button" data-opt="${i}" ${answer ? 'disabled' : ''}><em>${String.fromCharCode(65 + i)}</em><span>${opt}</span></button>`;
      }).join('');
      body.innerHTML = `
        <p class="quiz-kicker">${q.tag} · question ${String(s.index + 1).padStart(2, '0')}</p>
        <h3 class="quiz-q">${q.q}</h3>
        <div class="quiz-options">${options}</div>
        ${feedback}`;
      $$('.qopt', body).forEach(btn => {
        btn.addEventListener('click', () => {
          if (quizState.answers[quizState.index]) return;
          quizState.selected = Number(btn.dataset.opt);
          renderQuiz();
        });
      });
    } else {
      const value = answer ? String(answer.value).replace('.', ',') : '';
      body.innerHTML = `
        <p class="quiz-kicker">${q.tag} · question ${String(s.index + 1).padStart(2, '0')}</p>
        <h3 class="quiz-q">${q.q}</h3>
        <div class="quiz-num">
          <input id="quiz-input" type="text" inputmode="decimal" autocomplete="off" placeholder="Ta réponse" value="${value}" ${answer ? 'disabled' : ''} aria-label="Réponse numérique">
          <span>${q.unit}</span>
        </div>
        ${feedback}`;
      const input = $('#quiz-input');
      if (input && !answer) {
        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            e.preventDefault();
            validateQuiz();
          }
        });
      }
    }

    if (nextBtn) {
      const blocked = !answer && q.type === 'mcq' && s.selected === null;
      nextBtn.disabled = blocked;
      nextBtn.innerHTML = answer
        ? (s.index === lastQuestion ? 'Voir le résultat <span aria-hidden="true">→</span>' : 'Suivant <span aria-hidden="true">→</span>')
        : 'Valider <span aria-hidden="true">→</span>';
    }
    if (hint) {
      hint.textContent = answer
        ? (s.index === lastQuestion ? 'Dernière question : le résultat arrive.' : 'Réponse enregistrée. On continue.')
        : (q.type === 'num' ? 'Entre un nombre, puis valide.' : 'Choisis une réponse, puis valide.');
    }
  }

  function validateQuiz() {
    const s = quizState;
    if (!s) return;
    const q = QUIZ[s.index];
    if (s.answers[s.index]) return;

    if (q.type === 'mcq') {
      if (s.selected === null) return;
      s.answers[s.index] = { picked: s.selected, correct: s.selected === q.answer };
    } else {
      const input = $('#quiz-input');
      const value = input ? quizParse(input.value) : null;
      if (value === null) {
        const hint = $('#quiz-hint');
        if (hint) hint.textContent = 'Il faut entrer un nombre pour valider.';
        if (input) input.focus();
        return;
      }
      s.answers[s.index] = { value, correct: Math.abs(value - q.answer) < 0.051 };
    }
    renderQuiz();
  }

  function quizAdvance() {
    const s = quizState;
    if (!s) return;
    if (!s.answers[s.index]) {
      validateQuiz();
      return;
    }
    if (s.index === lastQuestion) {
      s.finished = true;
      renderQuiz();
      return;
    }
    s.index += 1;
    s.selected = null;
    renderQuiz();
  }

  function resetQuiz() {
    if (!QUIZ.length || !$('#quiz-shell')) return;
    quizState = { index: 0, answers: Array(QUIZ.length).fill(null), selected: null, finished: false };
    renderQuiz();
  }

  function initQuiz() {
    if (!$('#quiz-shell')) return;
    resetQuiz();
    const next = $('#quiz-next');
    const prev = $('#quiz-prev');
    if (next) next.addEventListener('click', quizAdvance);
    if (prev) prev.addEventListener('click', () => {
      if (!quizState) return;
      if (quizState.finished) {
        quizState.finished = false;
        quizState.index = lastQuestion;
        renderQuiz();
        return;
      }
      if (quizState.index > 0) {
        quizState.index -= 1;
        quizState.selected = null;
        renderQuiz();
      }
    });
  }

  /* =======================================================
     Branchements
     ======================================================= */
  function initFeatures() {
    initLab();
    initVideo();
    initFlashes();
    initDocs();
    initQuiz();
  }

  function onSlideChanged(slide) {
    if (slide.id !== 's11') stopLab();
    if (slide.id === 's21') resetQuiz();
  }


  initFeatures();
  init();
})();
