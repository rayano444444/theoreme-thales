/* =========================================================
   THALÈS — interactions
   Sections : navigation, figure héro, laboratoire,
   démonstration, médias, quiz.
   Aucune animation automatique : la page est statique,
   seuls les états des contrôles changent.
   ========================================================= */
(function () {
  'use strict';

  /* ---------- raccourcis ---------- */
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  const fmt = (n, d = 2) => n.toFixed(d).replace('.', ',');
  const fmtAns = (n) => String(Number(n.toFixed(2))).replace('.', ',');
  const NS = 'http://www.w3.org/2000/svg';
  function el(tag, attrs, parent) {
    const node = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }
  function text(parent, x, y, str, attrs) {
    const node = el('text', Object.assign({ x, y }, attrs || {}), parent);
    node.textContent = str;
    return node;
  }

  /* =========================================================
     1. Navigation, progression, révélations
     ========================================================= */
  const topbar = $('#topbar');
  const nav = $('#nav');
  const navToggle = $('#nav-toggle');
  const navLinks = $$('.nav a');

  let scrollQueued = false;

  function paintScroll() {
    scrollQueued = false;
    topbar.classList.toggle('is-scrolled', window.scrollY > 12);
  }

  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(paintScroll);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  paintScroll();
  navToggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Fermer le sommaire' : 'Ouvrir le sommaire');
    document.body.classList.toggle('is-locked', open);
  });
  navLinks.forEach((a) => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('is-locked');
  }));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('is-locked');
      navToggle.focus();
    }
  });

  // lien actif
  const sections = $$('main section[id]');
  const navObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const id = entry.target.id;
      navLinks.forEach((a) => a.classList.toggle('is-active', a.getAttribute('href') === '#' + id));
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach((s) => navObserver.observe(s));


  /* =========================================================
     2. Figure du hero
     ========================================================= */
  (function heroFigure() {
    const svg = $('#hero-svg');
    if (!svg) return;
    const W = 540, H = 500;
    const A = { x: 270, y: 64 }, B = { x: 78, y: 428 }, C = { x: 462, y: 428 };
    const NS_svg = NS;

    const defs = el('defs', null, svg);
    const grad = el('linearGradient', { id: 'heroFill', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ff5a4d', 'stop-opacity': '.16' }, grad);
    el('stop', { offset: '100%', 'stop-color': '#ff5a4d', 'stop-opacity': '0' }, grad);
    const glow = el('filter', { id: 'heroGlow', x: '-60%', y: '-60%', width: '220%', height: '220%' }, defs);
    el('feGaussianBlur', { stdDeviation: '4', result: 'b' }, glow);
    const merge = el('feMerge', null, glow);
    el('feMergeNode', { in: 'b' }, merge);
    el('feMergeNode', { in: 'SourceGraphic' }, merge);

    const gGrid = el('g', { opacity: '.5' }, svg);
    for (let x = 30; x < W; x += 60) el('line', { x1: x, y1: 20, x2: x, y2: H - 20, stroke: 'rgba(255,255,255,.05)', 'stroke-width': '1' }, gGrid);
    for (let y = 30; y < H; y += 60) el('line', { x1: 20, y1: y, x2: W - 20, y2: y, stroke: 'rgba(255,255,255,.05)', 'stroke-width': '1' }, gGrid);

    // axes de fuite décoratifs
    const deco = el('g', { opacity: '.35' }, svg);
    el('circle', { cx: A.x, cy: A.y, r: 150, fill: 'none', stroke: 'rgba(108,168,232,.18)', 'stroke-width': '1', 'stroke-dasharray': '2 8' }, deco);
    el('circle', { cx: A.x, cy: A.y, r: 230, fill: 'none', stroke: 'rgba(255,90,77,.1)', 'stroke-width': '1', 'stroke-dasharray': '2 10' }, deco);

    const tri = el('path', { class: 'hero-tri', fill: 'url(#heroFill)', stroke: 'rgba(255,255,255,.55)', 'stroke-width': '1.5', 'stroke-linejoin': 'round' }, svg);
    const par = el('line', { stroke: '#ff5a4d', 'stroke-width': '2.4', 'stroke-linecap': 'round', 'stroke-dasharray': '7 6', filter: 'url(#heroGlow)' }, svg);
    const base = el('line', { stroke: 'rgba(255,255,255,.55)', 'stroke-width': '1.5' }, svg);

    const gRays = el('g', { opacity: '.55' }, svg);
    const ray1 = el('line', { stroke: 'rgba(255,255,255,.22)', 'stroke-width': '1', 'stroke-dasharray': '3 5' }, gRays);
    const ray2 = el('line', { stroke: 'rgba(255,255,255,.22)', 'stroke-width': '1', 'stroke-dasharray': '3 5' }, gRays);

    const gTicks = el('g', { stroke: 'rgba(232,181,103,.55)', 'stroke-width': '1.4' }, svg);
    const tickAB = el('line', {}, gTicks);
    const tickAC = el('line', {}, gTicks);

    function makePoint(color) {
      const g = el('g', null, svg);
      const halo = el('circle', { r: 9, fill: color, opacity: '.12' }, g);
      const dot = el('circle', { r: 4.2, fill: color, stroke: '#08070a', 'stroke-width': '1.5' }, g);
      return { g, halo, dot };
    }
    const pA = makePoint('#ffffff');
    const pB = makePoint('#d9cfc4');
    const pC = makePoint('#d9cfc4');
    const pM = makePoint('#e8b567');
    const pN = makePoint('#e8b567');

    function label(str, color, weight) {
      const t = text(svg, 0, 0, str, {
        fill: color, 'font-family': 'DM Sans, sans-serif', 'font-size': '13',
        'font-weight': weight || '600', 'text-anchor': 'middle'
      });
      return t;
    }
    const lA = label('A', '#ffffff');
    const lB = label('B', '#d9cfc4');
    const lC = label('C', '#d9cfc4');
    const lM = label('M', '#e8b567');
    const lN = label('N', '#e8b567');

    // étiquette "MN ∥ BC"
    const tagG = el('g', null, svg);
    const tagBg = el('rect', { rx: 7, height: 24, fill: 'rgba(11,10,13,.85)', stroke: 'rgba(255,90,77,.35)' }, tagG);
    const tagTx = text(tagG, 0, 0, 'MN ∥ BC', {
      fill: '#ff5a4d', 'font-family': 'DM Mono, monospace', 'font-size': '10.5', 'text-anchor': 'middle'
    });

    const kBadge = el('g', { opacity: '.95' }, svg);
    const kBg = el('rect', { rx: 8, height: 24, fill: 'rgba(232,181,103,.1)', stroke: 'rgba(232,181,103,.35)' }, kBadge);
    const kTx = text(kBadge, 0, 0, 'k = 0,62', {
      fill: '#e8b567', 'font-family': 'DM Mono, monospace', 'font-size': '10.5', 'text-anchor': 'middle'
    });

    const k = 0.62;

    function place(pt, x, y) {
      pt.g.setAttribute('transform', 'translate(' + x + ',' + y + ')');
    }

    function draw() {
      const M = { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) };
      const N = { x: lerp(A.x, C.x, k), y: lerp(A.y, C.y, k) };

      tri.setAttribute('d', 'M' + A.x + ',' + A.y + ' L' + B.x + ',' + B.y + ' L' + C.x + ',' + C.y + ' Z');
      base.setAttribute('x1', B.x); base.setAttribute('y1', B.y);
      base.setAttribute('x2', C.x); base.setAttribute('y2', C.y);
      par.setAttribute('x1', M.x); par.setAttribute('y1', M.y);
      par.setAttribute('x2', N.x); par.setAttribute('y2', N.y);

      ray1.setAttribute('x1', A.x); ray1.setAttribute('y1', A.y);
      ray1.setAttribute('x2', M.x); ray1.setAttribute('y2', M.y);
      ray2.setAttribute('x1', A.x); ray2.setAttribute('y1', A.y);
      ray2.setAttribute('x2', N.x); ray2.setAttribute('y2', N.y);

      // petits traits de mesure sur AM et AN
      const m1 = { x: lerp(A.x, M.x, 0.5), y: lerp(A.y, M.y, 0.5) };
      const m2 = { x: lerp(A.x, N.x, 0.5), y: lerp(A.y, N.y, 0.5) };
      const uAB = { x: B.x - A.x, y: B.y - A.y };
      const nAB = Math.hypot(uAB.x, uAB.y) || 1;
      const perpAB = { x: -uAB.y / nAB, y: uAB.x / nAB };
      tickAB.setAttribute('x1', m1.x - perpAB.x * 7); tickAB.setAttribute('y1', m1.y - perpAB.y * 7);
      tickAB.setAttribute('x2', m1.x + perpAB.x * 7); tickAB.setAttribute('y2', m1.y + perpAB.y * 7);
      const uAC = { x: C.x - A.x, y: C.y - A.y };
      const nAC = Math.hypot(uAC.x, uAC.y) || 1;
      const perpAC = { x: -uAC.y / nAC, y: uAC.x / nAC };
      tickAC.setAttribute('x1', m2.x - perpAC.x * 7); tickAC.setAttribute('y1', m2.y - perpAC.y * 7);
      tickAC.setAttribute('x2', m2.x + perpAC.x * 7); tickAC.setAttribute('y2', m2.y + perpAC.y * 7);

      place(pA, A.x, A.y); place(pB, B.x, B.y); place(pC, C.x, C.y);
      place(pM, M.x, M.y); place(pN, N.x, N.y);

      lA.setAttribute('x', A.x); lA.setAttribute('y', A.y - 16);
      lB.setAttribute('x', B.x - 16); lB.setAttribute('y', B.y + 6);
      lC.setAttribute('x', C.x + 16); lC.setAttribute('y', C.y + 6);

      // décalage des étiquettes vers l'extérieur
      const nABo = { x: perpAB.x, y: perpAB.y };
      if (nABo.x * (C.x - M.x) + nABo.y * (C.y - M.y) > 0) { nABo.x *= -1; nABo.y *= -1; }
      lM.setAttribute('x', M.x + nABo.x * 20);
      lM.setAttribute('y', M.y + nABo.y * 20 + 4);
      const nACo = { x: perpAC.x, y: perpAC.y };
      if (nACo.x * (B.x - N.x) + nACo.y * (B.y - N.y) > 0) { nACo.x *= -1; nACo.y *= -1; }
      lN.setAttribute('x', N.x + nACo.x * 20);
      lN.setAttribute('y', N.y + nACo.y * 20 + 4);

      // badge parallèle, au milieu de MN, décalé vers le haut
      const mid = { x: (M.x + N.x) / 2, y: (M.y + N.y) / 2 };
      const wTag = 66;
      tagBg.setAttribute('x', mid.x - wTag / 2);
      tagBg.setAttribute('y', mid.y - 36);
      tagBg.setAttribute('width', wTag);
      tagTx.setAttribute('x', mid.x);
      tagTx.setAttribute('y', mid.y - 20);

      // badge k près de A
      const kw = 72;
      kBg.setAttribute('x', 20); kBg.setAttribute('y', 20); kBg.setAttribute('width', kw);
      kTx.setAttribute('x', 20 + kw / 2); kTx.setAttribute('y', 36);
      kTx.textContent = 'k = ' + fmt(k, 2);
    }

    draw();
  })();

  /* =========================================================
     4. Laboratoire
     ========================================================= */
  const labSvg = $('#lab-svg');
  const kSlider = $('#k-slider');
  const kSlider2 = $('#k-slider-2');
  const state = { k: 0.62 };

  // valeurs "réelles" du triangle support (unités)
  const LEN = { AB: 10, AC: 12, BC: 9 };
  const labGeo = {
    A: { x: 290, y: 46 },
    B: { x: 66, y: 412 },
    C: { x: 514, y: 412 }
  };

  const labEl = {};
  function buildLab() {
    if (!labSvg) return;
    const svg = labSvg;
    const defs = el('defs', null, svg);
    const g = el('linearGradient', { id: 'labFill', x1: '0', y1: '0', x2: '1', y2: '1' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#ff5a4d', 'stop-opacity': '.13' }, g);
    el('stop', { offset: '100%', 'stop-color': '#6ca8e8', 'stop-opacity': '.07' }, g);
    const glowF = el('filter', { id: 'labGlow', x: '-70%', y: '-70%', width: '240%', height: '240%' }, defs);
    el('feGaussianBlur', { stdDeviation: '3.4', result: 'b' }, glowF);
    const mg = el('feMerge', null, glowF);
    el('feMergeNode', { in: 'b' }, mg);
    el('feMergeNode', { in: 'SourceGraphic' }, mg);

    // grille
    const grid = el('g', { opacity: '.55' }, svg);
    for (let x = 30; x < 580; x += 44) el('line', { x1: x, y1: 16, x2: x, y2: 448, stroke: 'rgba(255,255,255,.045)', 'stroke-width': '1' }, grid);
    for (let y = 26; y < 460; y += 44) el('line', { x1: 14, y1: y, x2: 566, y2: y, stroke: 'rgba(255,255,255,.045)', 'stroke-width': '1' }, grid);

    labEl.tri = el('path', { fill: 'url(#labFill)', stroke: 'rgba(255,255,255,.4)', 'stroke-width': '1.4', 'stroke-linejoin': 'round' }, svg);
    labEl.smallTri = el('path', { fill: 'rgba(232,181,103,.07)', stroke: 'none' }, svg);
    labEl.par = el('line', { stroke: '#ff5a4d', 'stroke-width': '2.4', 'stroke-dasharray': '7 6', filter: 'url(#labGlow)', 'stroke-linecap': 'round' }, svg);
    labEl.parHalo = el('line', { stroke: 'rgba(255,90,77,.15)', 'stroke-width': '9', 'stroke-linecap': 'round' }, svg);

    // rayons
    labEl.ray1 = el('line', { stroke: 'rgba(255,255,255,.12)', 'stroke-width': '1', 'stroke-dasharray': '2 6' }, svg);
    labEl.ray2 = el('line', { stroke: 'rgba(255,255,255,.12)', 'stroke-width': '1', 'stroke-dasharray': '2 6' }, svg);

    function dot(color, r) {
      const c = el('circle', { r: r || 4, fill: color, stroke: '#0b0a0d', 'stroke-width': '1.6' }, svg);
      return c;
    }
    labEl.ptA = dot('#ffffff');
    labEl.ptB = dot('#d9cfc4');
    labEl.ptC = dot('#d9cfc4');
    labEl.ptN = dot('#e8b567', 4.2);
    labEl.handleHalo = el('circle', { r: 16, fill: 'rgba(232,181,103,.12)', stroke: 'rgba(232,181,103,.35)', 'stroke-width': '1' }, svg);
    labEl.handle = el('circle', {
      r: 7, fill: '#e8b567', stroke: '#0b0a0d', 'stroke-width': '2',
      tabindex: '0', role: 'slider', 'aria-label': 'Position du point M sur le segment AB',
      'aria-valuemin': '12', 'aria-valuemax': '96', 'aria-valuenow': '62', cursor: 'grab'
    }, svg);

    const mkLabel = (str, color, size) => text(svg, 0, 0, str, {
      fill: color, 'font-family': 'DM Sans, sans-serif', 'font-size': size || '14',
      'font-weight': '600', 'text-anchor': 'middle'
    });
    labEl.lA = mkLabel('A', '#fff');
    labEl.lB = mkLabel('B', '#d9cfc4');
    labEl.lC = mkLabel('C', '#d9cfc4');
    labEl.lM = mkLabel('M', '#e8b567');
    labEl.lN = mkLabel('N', '#e8b567');

    // mesures flottantes
    const mstyle = { fill: '#a99d90', 'font-family': 'DM Mono, monospace', 'font-size': '10.5', 'text-anchor': 'middle' };
    labEl.mAM = text(svg, 0, 0, '', mstyle);
    labEl.mAN = text(svg, 0, 0, '', mstyle);
    labEl.mMN = text(svg, 0, 0, '', Object.assign({}, mstyle, { fill: '#ff5a4d' }));
    labEl.mAB = text(svg, 0, 0, '', Object.assign({}, mstyle, { fill: '#766b5f' }));
    labEl.mAC = text(svg, 0, 0, '', Object.assign({}, mstyle, { fill: '#766b5f' }));
    labEl.mBC = text(svg, 0, 0, '', Object.assign({}, mstyle, { fill: '#766b5f' }));

    labSvg.addEventListener('pointerdown', startDrag);
    labSvg.addEventListener('pointermove', onDrag);
    labSvg.addEventListener('pointerup', endDrag);
    labSvg.addEventListener('pointercancel', endDrag);
    labEl.handle.addEventListener('keydown', onHandleKey);

    let dragging = false;
    function pointFromEvent(e) {
      const r = svg.getBoundingClientRect();
      const sx = svg.viewBox.baseVal.width / r.width;
      const sy = svg.viewBox.baseVal.height / r.height;
      return { x: (e.clientX - r.left) * sx, y: (e.clientY - r.top) * sy };
    }
    function startDrag(e) {
      if (e.target.closest && e.target.closest('a,button')) return;
      dragging = true;
      svg.classList.add('is-dragging');
      labEl.handle.style.cursor = 'grabbing';
      setFromPoint(pointFromEvent(e));
      if (svg.setPointerCapture) { try { svg.setPointerCapture(e.pointerId); } catch (err) {} }
      $('#stage-hint') && ($('#stage-hint').textContent = 'Relâche pour figer la figure');
    }
    function onDrag(e) {
      if (!dragging) return;
      setFromPoint(pointFromEvent(e));
    }
    function endDrag(e) {
      if (!dragging) return;
      dragging = false;
      svg.classList.remove('is-dragging');
      labEl.handle.style.cursor = 'grab';
      $('#stage-hint') && ($('#stage-hint').textContent = 'Glisse le point M');
    }
    function setFromPoint(p) {
      const ax = labGeo.B.x - labGeo.A.x, ay = labGeo.B.y - labGeo.A.y;
      const t = ((p.x - labGeo.A.x) * ax + (p.y - labGeo.A.y) * ay) / (ax * ax + ay * ay);
      setK(clamp(t, 0.12, 0.96));
    }
    function onHandleKey(e) {
      if (['ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'Home', 'End'].indexOf(e.key) === -1) return;
      e.preventDefault();
      let v = state.k;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v -= 0.02;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v += 0.02;
      if (e.key === 'Home') v = 0.12;
      if (e.key === 'End') v = 0.96;
      setK(clamp(v, 0.12, 0.96));
    }
  }

  function renderLab() {
    if (!labEl.tri) return;
    const k = state.k;
    const A = labGeo.A, B = labGeo.B, C = labGeo.C;
    const M = { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) };
    const N = { x: lerp(A.x, C.x, k), y: lerp(A.y, C.y, k) };

    labEl.tri.setAttribute('d', 'M' + A.x + ',' + A.y + ' L' + B.x + ',' + B.y + ' L' + C.x + ',' + C.y + ' Z');
    labEl.smallTri.setAttribute('d', 'M' + A.x + ',' + A.y + ' L' + M.x + ',' + M.y + ' L' + N.x + ',' + N.y + ' Z');
    labEl.par.setAttribute('x1', M.x); labEl.par.setAttribute('y1', M.y);
    labEl.par.setAttribute('x2', N.x); labEl.par.setAttribute('y2', N.y);
    labEl.parHalo.setAttribute('x1', M.x); labEl.parHalo.setAttribute('y1', M.y);
    labEl.parHalo.setAttribute('x2', N.x); labEl.parHalo.setAttribute('y2', N.y);
    labEl.ray1.setAttribute('x1', A.x); labEl.ray1.setAttribute('y1', A.y);
    labEl.ray1.setAttribute('x2', M.x); labEl.ray1.setAttribute('y2', M.y);
    labEl.ray2.setAttribute('x1', A.x); labEl.ray2.setAttribute('y1', A.y);
    labEl.ray2.setAttribute('x2', N.x); labEl.ray2.setAttribute('y2', N.y);

    labEl.ptA.setAttribute('cx', A.x); labEl.ptA.setAttribute('cy', A.y);
    labEl.ptB.setAttribute('cx', B.x); labEl.ptB.setAttribute('cy', B.y);
    labEl.ptC.setAttribute('cx', C.x); labEl.ptC.setAttribute('cy', C.y);
    labEl.ptN.setAttribute('cx', N.x); labEl.ptN.setAttribute('cy', N.y);
    labEl.handleHalo.setAttribute('cx', M.x); labEl.handleHalo.setAttribute('cy', M.y);
    labEl.handle.setAttribute('cx', M.x); labEl.handle.setAttribute('cy', M.y);
    labEl.handle.setAttribute('aria-valuenow', String(Math.round(k * 100)));

    labEl.lA.setAttribute('x', A.x); labEl.lA.setAttribute('y', A.y - 18);
    labEl.lB.setAttribute('x', B.x - 18); labEl.lB.setAttribute('y', B.y + 7);
    labEl.lC.setAttribute('x', C.x + 18); labEl.lC.setAttribute('y', C.y + 7);

    // étiquettes M et N vers l'extérieur
    const uAB = { x: B.x - A.x, y: B.y - A.y };
    const n1 = Math.hypot(uAB.x, uAB.y) || 1;
    let pAB = { x: -uAB.y / n1, y: uAB.x / n1 };
    if (pAB.x * (C.x - M.x) + pAB.y * (C.y - M.y) > 0) { pAB.x *= -1; pAB.y *= -1; }
    labEl.lM.setAttribute('x', M.x + pAB.x * 22);
    labEl.lM.setAttribute('y', M.y + pAB.y * 22 + 4);

    const uAC = { x: C.x - A.x, y: C.y - A.y };
    const n2 = Math.hypot(uAC.x, uAC.y) || 1;
    let pAC = { x: -uAC.y / n2, y: uAC.x / n2 };
    if (pAC.x * (B.x - N.x) + pAC.y * (B.y - N.y) > 0) { pAC.x *= -1; pAC.y *= -1; }
    labEl.lN.setAttribute('x', N.x + pAC.x * 22);
    labEl.lN.setAttribute('y', N.y + pAC.y * 22 + 4);

    // valeurs réelles
    const AM = LEN.AB * k, AN = LEN.AC * k, MN = LEN.BC * k;
    labEl.mAM.textContent = fmt(AM, 2) + ' u';
    labEl.mAM.setAttribute('x', lerp(A.x, M.x, 0.5) + pAB.x * 26);
    labEl.mAM.setAttribute('y', lerp(A.y, M.y, 0.5) + pAB.y * 26);
    labEl.mAN.textContent = fmt(AN, 2) + ' u';
    labEl.mAN.setAttribute('x', lerp(A.x, N.x, 0.5) + pAC.x * 26);
    labEl.mAN.setAttribute('y', lerp(A.y, N.y, 0.5) + pAC.y * 26);

    labEl.mMN.textContent = 'MN = ' + fmt(MN, 2) + ' u';
    const midMN = { x: (M.x + N.x) / 2, y: (M.y + N.y) / 2 };
    labEl.mMN.setAttribute('x', midMN.x);
    labEl.mMN.setAttribute('y', midMN.y - 12);

    labEl.mAB.textContent = 'AB = 10 u';
    labEl.mAB.setAttribute('x', (A.x + B.x) / 2 + pAB.x * 12);
    labEl.mAB.setAttribute('y', (A.y + B.y) / 2 + pAB.y * 12 + 4);
    labEl.mAC.textContent = 'AC = 12 u';
    labEl.mAC.setAttribute('x', (A.x + C.x) / 2 + pAC.x * 12);
    labEl.mAC.setAttribute('y', (A.y + C.y) / 2 + pAC.y * 12 + 4);
    labEl.mBC.textContent = 'BC = 9 u';
    labEl.mBC.setAttribute('x', (B.x + C.x) / 2);
    labEl.mBC.setAttribute('y', C.y + 26);

    // DOM
    const set = (id, v) => { const n = $('#' + id); if (n) n.textContent = v; };
    set('k-value', fmt(k, 2));
    set('k-value-2', fmt(k, 2));
    set('ratio-am', fmt(k, 3));
    set('ratio-an', fmt(k, 3));
    set('ratio-mn', fmt(k, 3));
    set('ratio-sync', fmt(k, 3) + ' = ' + fmt(k, 3) + ' = ' + fmt(k, 3));
    set('val-am', fmt(AM, 2) + ' u');
    set('val-ab', '10 u');
    set('val-an', fmt(AN, 2) + ' u');
    set('val-ac', '12 u');
    set('val-mn', fmt(MN, 2) + ' u');
    set('val-bc', '9 u');
    set('area-k', fmt(k * k, 2));
    const pct = Math.round(k * 100);
    set('k-slider-desc', 'Le petit triangle mesure ' + pct + ' % du grand, côté par côté.');
    const barAm = $('#bar-am'), barAn = $('#bar-an'), barMn = $('#bar-mn');
    if (barAm) barAm.style.width = (k * 100) + '%';
    if (barAn) barAn.style.width = (k * 100) + '%';
    if (barMn) barMn.style.width = (k * 100) + '%';

    if (kSlider && Number(kSlider.value) !== Math.round(k * 100)) kSlider.value = String(Math.round(k * 100));
    if (kSlider2 && Number(kSlider2.value) !== Math.round(k * 100)) kSlider2.value = String(Math.round(k * 100));

  }

  function setK(v) {
    state.k = v;
    renderLab();
  }
  if (kSlider) {
    kSlider.addEventListener('input', () => setK(clamp(Number(kSlider.value) / 100, 0.12, 0.96)));
  }
  if (kSlider2) {
    kSlider2.addEventListener('input', () => setK(clamp(Number(kSlider2.value) / 100, 0.12, 0.96)));
  }

  const labReset = $('#lab-reset');
  if (labReset) labReset.addEventListener('click', () => setK(0.62));

/* =========================================================
     5. Démonstration pas à pas
     ========================================================= */
  (function proof() {
    const svg = $('#proof-svg');
    if (!svg) return;
    const A = { x: 280, y: 56 }, B = { x: 74, y: 388 }, C = { x: 486, y: 388 };
    const k = 0.62;
    const M = { x: lerp(A.x, B.x, k), y: lerp(A.y, B.y, k) };
    const N = { x: lerp(A.x, C.x, k), y: lerp(A.y, C.y, k) };

    const defs = el('defs', null, svg);
    const grad = el('linearGradient', { id: 'proofFill', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0%', 'stop-color': '#6ca8e8', 'stop-opacity': '.1' }, grad);
    el('stop', { offset: '100%', 'stop-color': '#6ca8e8', 'stop-opacity': '.02' }, grad);

    el('path', { d: 'M' + A.x + ',' + A.y + ' L' + B.x + ',' + B.y + ' L' + C.x + ',' + C.y + ' Z', fill: 'url(#proofFill)', stroke: 'rgba(255,255,255,.4)', 'stroke-width': '1.3' }, svg);
    const small = el('path', { d: 'M' + A.x + ',' + A.y + ' L' + M.x + ',' + M.y + ' L' + N.x + ',' + N.y + ' Z', fill: 'rgba(255,90,77,0)', stroke: 'none' }, svg);

    // angles (secteurs)
    function sector(v, p1, p2, r) {
      const a1 = Math.atan2(p1.y - v.y, p1.x - v.x);
      let a2 = Math.atan2(p2.y - v.y, p2.x - v.x);
      let d = a2 - a1;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      a2 = a1 + d;
      const large = Math.abs(d) > Math.PI ? 1 : 0;
      const sweep = d > 0 ? 1 : 0;
      const x1 = v.x + Math.cos(a1) * r, y1 = v.y + Math.sin(a1) * r;
      const x2 = v.x + Math.cos(a2) * r, y2 = v.y + Math.sin(a2) * r;
      return 'M' + v.x + ',' + v.y + ' L' + x1 + ',' + y1 + ' A' + r + ',' + r + ' 0 ' + large + ' ' + sweep + ' ' + x2 + ',' + y2 + ' Z';
    }
    const gAngles = el('g', { opacity: '0' }, svg);
    el('path', { d: sector(M, A, N, 30), fill: 'rgba(255,90,77,.28)', stroke: '#ff5a4d', 'stroke-width': '1.2' }, gAngles);
    el('path', { d: sector(B, A, C, 42), fill: 'rgba(255,90,77,.16)', stroke: '#ff5a4d', 'stroke-width': '1.2' }, gAngles);
    el('path', { d: sector(N, A, M, 30), fill: 'rgba(232,181,103,.28)', stroke: '#e8b567', 'stroke-width': '1.2' }, gAngles);
    el('path', { d: sector(C, A, B, 42), fill: 'rgba(232,181,103,.16)', stroke: '#e8b567', 'stroke-width': '1.2' }, gAngles);
    const eq1 = text(gAngles, 0, 0, '=', { fill: '#ff5a4d', 'font-size': '13', 'font-weight': '700', 'font-family': 'DM Sans, sans-serif' });
    const eq2 = text(gAngles, 0, 0, '=', { fill: '#e8b567', 'font-size': '13', 'font-weight': '700', 'font-family': 'DM Sans, sans-serif' });

    const par = el('line', { x1: M.x, y1: M.y, x2: N.x, y2: N.y, stroke: '#ff5a4d', 'stroke-width': '2.6', 'stroke-dasharray': '7 6', 'stroke-linecap': 'round' }, svg);
    const base = el('line', { x1: B.x, y1: B.y, x2: C.x, y2: C.y, stroke: 'rgba(255,255,255,.5)', 'stroke-width': '1.4' }, svg);
    const gLabels = el('g', null, svg);
    const lab = (str, x, y, color) => text(gLabels, x, y, str, {
      fill: color, 'font-size': '13', 'font-weight': '600',
      'font-family': 'DM Sans, sans-serif', 'text-anchor': 'middle'
    });
    lab('A', A.x, A.y - 16, '#fff');
    lab('B', B.x - 16, B.y + 6, '#d9cfc4');
    lab('C', C.x + 16, C.y + 6, '#d9cfc4');
    lab('M', M.x - 18, M.y + 4, '#ff5a4d');
    lab('N', N.x + 18, N.y + 4, '#e8b567');

    const pts = [[A, '#fff'], [B, '#d9cfc4'], [C, '#d9cfc4'], [M, '#ff5a4d'], [N, '#e8b567']];
    pts.forEach(([p, c]) => {
      el('circle', { cx: p.x, cy: p.y, r: 4, fill: c, stroke: '#0b0a0d', 'stroke-width': '1.5' }, svg);
    });

    // mini-cotes de longueurs (étape 3)
    const gSides = el('g', { opacity: '0' }, svg);
    const sideT1 = text(gSides, lerp(A.x, M.x, 0.45) - 22, lerp(A.y, M.y, 0.45), 'AM', { fill: '#ff5a4d', 'font-size': '10.5', 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle' });
    const sideT2 = text(gSides, lerp(A.x, B.x, 0.72) - 26, lerp(A.y, B.y, 0.72), 'AB', { fill: '#8a7f72', 'font-size': '10.5', 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle' });
    const sideT3 = text(gSides, lerp(A.x, N.x, 0.45) + 24, lerp(A.y, N.y, 0.45), 'AN', { fill: '#e8b567', 'font-size': '10.5', 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle' });
    const sideT4 = text(gSides, lerp(A.x, C.x, 0.72) + 26, lerp(A.y, C.y, 0.72), 'AC', { fill: '#8a7f72', 'font-size': '10.5', 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle' });
    text(gSides, (M.x + N.x) / 2, M.y - 14, 'MN', { fill: '#ff5a4d', 'font-size': '10.5', 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle' });
    text(gSides, (B.x + C.x) / 2, B.y + 22, 'BC', { fill: '#8a7f72', 'font-size': '10.5', 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle' });

    // étape 4 : hachures de surface
    const gArea = el('g', { opacity: '0' }, svg);
    const patt = el('pattern', { id: 'areaHatch', width: '6', height: '6', patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, defs);
    el('line', { x1: '0', y1: '0', x2: '0', y2: '6', stroke: 'rgba(255,90,77,.4)', 'stroke-width': '1' }, patt);
    el('path', { d: 'M' + A.x + ',' + A.y + ' L' + M.x + ',' + M.y + ' L' + N.x + ',' + N.y + ' Z', fill: 'url(#areaHatch)', stroke: 'rgba(255,90,77,.4)', 'stroke-width': '1' }, gArea);
    text(gArea, lerp(A.x, (M.x + N.x) / 2, 0.55) - 4, lerp(A.y, (M.y + N.y) / 2, 0.55) + 26, 'aire × k²', {
      fill: '#ff5a4d', 'font-size': '11', 'font-family': 'DM Mono, monospace', 'text-anchor': 'middle'
    });

    // marques d'égalité d'angles, juste à l'extérieur des secteurs
    eq1.setAttribute('x', M.x + 36);
    eq1.setAttribute('y', M.y - 18);
    eq2.setAttribute('x', N.x - 36);
    eq2.setAttribute('y', N.y - 18);

    const list = $('#proof-list');
    const items = list ? Array.from(list.children) : [];
    const dots = $('#proof-dots');
    if (dots) items.forEach(() => dots.appendChild(document.createElement('i')));

    let step = 0;
    function show(n) {
      step = clamp(n, 0, items.length - 1);
      items.forEach((li, i) => li.classList.toggle('is-active', i === step));
      if (dots) Array.from(dots.children).forEach((d, i) => d.classList.toggle('is-on', i === step));
      gAngles.setAttribute('opacity', step >= 0 ? '1' : '0');
      par.setAttribute('stroke-width', step === 0 ? '3.4' : '2.4');
      gSides.setAttribute('opacity', step >= 2 ? '1' : '0');
      gArea.setAttribute('opacity', step === 3 ? '1' : '0');
      small.setAttribute('fill', step === 3 ? 'rgba(255,90,77,.06)' : 'rgba(255,90,77,0)');
    }
    items.forEach((li, i) => {
      li.tabIndex = 0;
      li.setAttribute('role', 'button');
      li.addEventListener('click', () => show(i));
      li.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); show(i); }
      });
    });
    $('#proof-prev') && $('#proof-prev').addEventListener('click', () => show(step - 1));
    $('#proof-next') && $('#proof-next').addEventListener('click', () => show(step + 1));
    show(0);
  })();

  /* =========================================================
     6. Onglets, copie, lightbox
     ========================================================= */
  (function tabs() {
    const tabCalc = $('#tab-calc');
    const tabProof = $('#tab-proof');
    const panelCalc = $('#panel-calc');
    const panelProof = $('#panel-proof');
    if (!tabCalc || !tabProof) return;
    function activate(which) {
      const isCalc = which === 'calc';
      tabCalc.setAttribute('aria-selected', String(isCalc));
      tabProof.setAttribute('aria-selected', String(!isCalc));
      tabCalc.classList.toggle('is-active', isCalc);
      tabProof.classList.toggle('is-active', !isCalc);
      panelCalc.hidden = !isCalc;
      panelProof.hidden = isCalc;
      panelCalc.classList.toggle('is-active', isCalc);
      panelProof.classList.toggle('is-active', !isCalc);
    }
    tabCalc.addEventListener('click', () => activate('calc'));
    tabProof.addEventListener('click', () => activate('proof'));
    [tabCalc, tabProof].forEach((t) => t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const next = t === tabCalc ? tabProof : tabCalc;
      next.focus();
      activate(next === tabCalc ? 'calc' : 'proof');
    }));
  })();

  (function annotations() {
    $$('.anno-list li[data-anno]').forEach((li) => {
      const n = li.getAttribute('data-anno');
      const lit = (on) => {
        const panel = li.closest('.copy-panel');
        if (!panel) return;
        $$('.anno[data-anno="' + n + '"]', panel).forEach((a) => a.classList.toggle('is-lit', on));
      };
      li.addEventListener('mouseenter', () => lit(true));
      li.addEventListener('mouseleave', () => lit(false));
      li.addEventListener('focusin', () => lit(true));
      li.addEventListener('focusout', () => lit(false));
    });
  })();

  (function copyPhrases() {
    const feedback = $('#copy-feedback');
    $$('.phrase').forEach((btn) => {
      btn.addEventListener('click', async () => {
        const value = btn.getAttribute('data-copy') || btn.textContent;
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(value);
          else {
            const ta = document.createElement('textarea');
            ta.value = value; ta.style.position = 'fixed'; ta.style.opacity = '0';
            document.body.appendChild(ta); ta.select();
            document.execCommand('copy'); ta.remove();
          }
          btn.classList.add('is-copied');
          if (feedback) feedback.textContent = '✓ Phrase copiée. Colle-la dans ta copie.';
          setTimeout(() => btn.classList.remove('is-copied'), 1400);
          setTimeout(() => { if (feedback) feedback.textContent = ''; }, 2600);
        } catch (err) {
          if (feedback) feedback.textContent = 'Copie impossible : sélectionne la phrase à la main.';
        }
      });
    });
  })();

  (function lightbox() {
    const box = $('#lightbox');
    const img = $('#lightbox-img');
    const cap = $('#lightbox-caption');
    const closeBtn = $('#lightbox-close');
    const prevBtn = $('#lightbox-prev');
    const nextBtn = $('#lightbox-next');
    const triggers = $$('[data-lightbox]');
    if (!box || !triggers.length) return;
    let index = 0;
    let lastFocus = null;

    function render() {
      const t = triggers[index];
      img.src = t.getAttribute('data-lightbox');
      img.alt = t.querySelector('img') ? t.querySelector('img').alt : '';
      cap.textContent = t.getAttribute('data-caption') || '';
    }
    function open(i) {
      index = i;
      lastFocus = document.activeElement;
      box.hidden = false;
      document.body.classList.add('is-locked');
      render();
      closeBtn.focus();
    }
    function close() {
      box.hidden = true;
      document.body.classList.remove('is-locked');
      img.removeAttribute('src');
      if (lastFocus) lastFocus.focus();
    }
    function move(d) {
      index = (index + d + triggers.length) % triggers.length;
      render();
    }
    triggers.forEach((t, i) => t.addEventListener('click', () => open(i)));
    closeBtn.addEventListener('click', close);
    prevBtn.addEventListener('click', () => move(-1));
    nextBtn.addEventListener('click', () => move(1));
    box.addEventListener('click', (e) => { if (e.target === box) close(); });
    document.addEventListener('keydown', (e) => {
      if (box.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') move(-1);
      if (e.key === 'ArrowRight') move(1);
    });
  })();

  /* =========================================================
     7. Quiz
     ========================================================= */
  const QUIZ = [
    {
      type: 'mcq',
      kind: 'Histoire',
      question: 'En quelle année Thalès serait-il né ?',
      context: 'La tradition place sa vie au VIe siècle avant notre ère, à Milet.',
      options: [
        { t: 'Vers 546 av. J.-C.', why: '546 est la date traditionnelle de sa mort, pas de sa naissance.' },
        { t: 'Vers 624 apr. J.-C.', why: 'L\'ère chrétienne n\'existait pas encore : on parle de siècles avant notre ère.' },
        { t: 'Vers 624 av. J.-C.', ok: true, why: 'La tradition place sa naissance vers 624 et sa mort vers 546 avant notre ère.' }
      ],
      explanation: 'Retiens la fourchette 624–546 av. J.-C. : elle situe Thalès deux siècles avant Euclide.',
      hint: 'Le même nombre revient dans la frise : 624, mais avant notre ère.'
    },
    {
      type: 'mcq',
      kind: 'Histoire',
      question: 'Dans quelle cité grecque vivait-il ?',
      context: 'Une cité marchande d\'Ionie, sur la côte ouest de l\'Asie Mineure.',
      options: [
        { t: 'Athènes', why: 'Athènes est la cité de Platon et de Socrate, pas celle de Thalès.' },
        { t: 'Alexandrie', why: 'Alexandrie est fondée bien après Thalès, en 331 av. J.-C.' },
        { t: 'Milet', ok: true, why: 'Milet, en Ionie, était une cité marchande ouverte sur la mer Égée.' }
      ],
      explanation: 'Milet est un port d\'Ionie : c\'est là que naît l\'école présocratique dont Thalès est la figure fondatrice.',
      hint: 'Le nom commence par M et se trouve sur la côte ouest de l\'Asie Mineure.'
    },
    {
      type: 'mcq',
      kind: 'Histoire',
      question: 'Pourquoi faut-il lire les récits sur Thalès avec prudence ?',
      context: 'Hérodote, Diogène Laërce et Proclus parlent de lui.',
      options: [
        { t: 'Il a vécu au Moyen Âge', why: 'Thalès précède le Moyen Âge de plus d\'un millénaire.' },
        { t: 'Aucun écrit de sa main n\'a survécu', ok: true, why: 'Les sources écrivent longtemps après lui : ce sont des témoignages, pas des archives.' },
        { t: 'Ses livres ont brûlé à Rome', why: 'On ne lui connaît aucun livre : sa pensée a circulé oralement, puis par des témoignages.' }
      ],
      explanation: 'L\'anecdote de la pyramide est une tradition rapportée des siècles plus tard. Elle est précieuse, mais ce n\'est pas un procès-verbal.',
      hint: 'Ce qui manque, ce sont des écrits de première main.'
    },
    {
      type: 'mcq',
      kind: 'Calcul & mesure',
      question: 'Pour mesurer la pyramide, quelle hypothèse rend les deux triangles semblables ?',
      context: 'Un bâton vertical, son ombre, et l\'ombre de la pyramide.',
      options: [
        { t: 'Le sol est parfaitement plat', why: 'Un sol plat aide à mesurer, mais ne crée pas les angles égaux.' },
        { t: 'La pyramide est régulière', why: 'La régularité de la pyramide ne dit rien sur les rayons du Soleil.' },
        { t: 'Les rayons du Soleil sont parallèles', ok: true, why: 'C\'est le parallélisme des rayons qui donne des angles égaux et rend les triangles semblables.' }
      ],
      explanation: 'Les rayons parallèles jouent le rôle de la droite parallèle : ils fabriquent la configuration de Thalès.',
      hint: 'Cherche ce qui vient du Soleil, pas de la pyramide.'
    },
    {
      type: 'mcq',
      kind: 'Le cadre',
      question: 'Quelle condition est indispensable au théorème direct ?',
      context: 'Dans un triangle ABC, avec M sur (AB) et N sur (AC).',
      options: [
        { t: 'Un angle droit', why: 'L\'angle droit, c\'est le domaine de Pythagore. Thalès n\'en a pas besoin.' },
        { t: 'Une droite parallèle à un côté', ok: true, why: 'Sans parallèle, pas de configuration de Thalès : c\'est l\'hypothèse, jamais la conclusion.' },
        { t: 'Deux côtés égaux', why: 'Un triangle isocèle n\'a rien d\'obligatoire ici : c\'est le parallélisme qui compte.' }
      ],
      explanation: 'Le parallélisme est la première chose à vérifier — et la première à écrire dans la justification.',
      hint: 'Ce que le théorème ne prouve pas, il l\'exige.'
    },
    {
      type: 'mcq',
      kind: 'Le cadre',
      question: 'Dans AM/AB = AN/AC, que représente le point A ?',
      context: 'Les points A, M, B sont alignés, ainsi que A, N, C.',
      options: [
        { t: 'Le milieu de [BC]', why: 'A est le sommet commun aux deux triangles, pas un point de [BC].' },
        { t: 'Le pied de la hauteur', why: 'Aucune hauteur n\'intervient dans la configuration de Thalès.' },
        { t: 'Le sommet commun aux deux triangles', ok: true, why: 'A est le sommet d\'où partent les deux sécantes. Il reste en haut des fractions.' }
      ],
      explanation: 'Le sommet commun A est toujours au numérateur et au dénominateur : c\'est lui qui « regarde » les deux triangles.',
      hint: 'C\'est le point d\'où partent les deux droites qui se coupent.'
    },
    {
      type: 'mcq',
      kind: 'Démonstration',
      question: 'Deux triangles ont deux angles égaux. Que peut-on en déduire ?',
      context: 'Ils n\'ont pas forcément la même taille.',
      options: [
        { t: 'Ils ont la même aire', why: 'Deux triangles semblables peuvent avoir des aires très différentes : l\'aire suit le carré du coefficient.' },
        { t: 'Ils sont semblables, donc leurs côtés sont proportionnels', ok: true, why: 'Deux angles suffisent : le troisième l\'est aussi. Les triangles ont la même forme, donc des côtés proportionnels.' },
        { t: 'Ils sont rectangles', why: 'Deux angles égaux ne disent pas qu\'un angle mesure 90°.' }
      ],
      explanation: 'C\'est le cœur de la démonstration : mêmes angles ⟹ même forme ⟹ côtés proportionnels.',
      hint: 'Même forme, taille différente : quel mot commence par « sem » ?'
    },
    {
      type: 'mcq',
      kind: 'Les pièges',
      question: 'La réciproque du théorème sert à…',
      context: 'On connaît les longueurs et on se demande si deux droites sont parallèles.',
      options: [
        { t: 'Calculer une longueur manquante', why: 'Pour calculer une longueur, on utilise le théorème direct, quand le parallélisme est déjà connu.' },
        { t: 'Calculer une aire', why: 'Ni le théorème ni sa réciproque ne calculent directement une aire.' },
        { t: 'Prouver que deux droites sont parallèles', ok: true, why: 'La réciproque part des rapports égaux pour conclure au parallélisme.' }
      ],
      explanation: 'Théorème direct : parallèle ⟹ rapports égaux. Réciproque : rapports égaux ⟹ parallèle. Le sens de lecture change tout.',
      hint: 'La conclusion de la réciproque est le parallélisme.'
    },
    {
      type: 'input',
      kind: 'Calcul & mesure',
      question: 'Un bâton de 1,20 m projette une ombre de 1,80 m. L\'ombre d\'un arbre mesure 9 m. Quelle est la hauteur de l\'arbre ?',
      context: 'Les rayons du Soleil sont parallèles : c\'est une configuration de Thalès.',
      answer: 6,
      unit: 'm',
      formula: 'h / 9 = 1,20 / 1,80',
      explanation: 'Le rapport hauteur/ombre vaut 1,20 ÷ 1,80 = 0,666… Donc h = 9 × 0,666… = 6 m.',
      diagnoses: [
        { v: 13.5, msg: 'Tu as inversé le rapport : 9 × 1,80 ÷ 1,20 = 13,5. L\'arbre est plus grand que le bâton, mais son ombre est 5 fois plus longue : sa hauteur vaut 5 × 1,20 = 6 m.' },
        { v: 0.24, msg: 'Tu as multiplié les deux petites mesures puis divisé par 9. Le bon réflexe est hauteur/ombre : 1,20/1,80, appliqué à l\'ombre de l\'arbre.' }
      ],
      hint: 'Hauteur et ombre sont proportionnelles : le quotient hauteur/ombre est le même pour le bâton et l\'arbre.'
    },
    {
      type: 'input',
      kind: 'Calcul & mesure',
      question: 'Méthode du miroir : l\'œil est à 1,60 m, à 2 m du miroir ; l\'arbre est à 8 m du miroir. Quelle est la hauteur de l\'arbre ?',
      context: 'L\'œil, le miroir et le sommet sont alignés : la visée remplace le rayon de Soleil.',
      answer: 6.4,
      unit: 'm',
      formula: 'h / 8 = 1,60 / 2',
      explanation: 'h = 1,60 × 8 ÷ 2 = 6,4 m. Les deux triangles rectangles se font face : leurs côtés sont proportionnels.',
      diagnoses: [
        { v: 0.8, msg: '0,8 est le quotient 1,60 ÷ 2, pas la hauteur. Il faut encore le multiplier par la distance miroir–arbre : 0,8 × 8 = 6,4 m.' },
        { v: 10, msg: 'Tu as fait 2 × 8 ÷ 1,60 = 10. La hauteur de l\'œil est au numérateur : h = 1,60 × 8 ÷ 2.' }
      ],
      hint: 'Écris h / 8 = 1,60 / 2, puis fais le produit en croix.'
    },
    {
      type: 'input',
      kind: 'Calcul & mesure',
      question: 'Sur une carte au 1/25 000, deux points sont séparés de 4,8 cm. Quelle est la distance réelle, en kilomètres ?',
      context: 'L\'échelle est un coefficient de Thalès caché.',
      answer: 1.2,
      unit: 'km',
      formula: '4,8 × 25 000 = 120 000 cm',
      explanation: '4,8 × 25 000 = 120 000 cm = 1 200 m = 1,2 km.',
      diagnoses: [
        { v: 120, msg: '120 000 cm font 1 200 m, soit 1,2 km — pas 120 km. Pense à diviser par 100 000 pour passer des cm aux km.' },
        { v: 12, msg: 'Tu as divisé par 10 000 au lieu de 100 000 : 120 000 cm = 1,2 km.' }
      ],
      hint: 'Convertis d\'abord en centimètres, puis en mètres, puis en kilomètres.'
    },
    {
      type: 'mcq',
      kind: 'Visée & projet',
      question: 'Dans le projet de classe, à quoi sert GeoGebra ?',
      context: 'On part d\'une photo prise sur le terrain.',
      options: [
        { t: 'Calculer la moyenne de la classe', why: 'GeoGebra est un logiciel de géométrie, pas un tableur de notes.' },
        { t: 'Superposer les triangles sur une photo réelle', ok: true, why: 'On importe la photo, puis on fait glisser le modèle théorique sur le réel pour vérifier les alignements.' },
        { t: 'Créer la vidéo', why: 'La vidéo se tourne avec une caméra ou un téléphone ; GeoGebra sert à vérifier la figure.' }
      ],
      explanation: 'GeoGebra permet de confronter le modèle théorique à la photo : sommet commun, parallèle, proportions.',
      hint: 'Le logiciel sert à faire glisser une figure géométrique sur une image.'
    },
    {
      type: 'mcq',
      kind: 'Visée & projet',
      question: 'Dans la grille d\'évaluation, que signifie « Très bien » pour le calcul ?',
      context: 'Le résultat final n\'est qu\'une partie de l\'évaluation.',
      options: [
        { t: 'Le résultat est donné sans unité', why: 'Sans unité, un résultat de longueur ne veut rien dire.' },
        { t: 'Le calcul est fait à la calculatrice', why: 'La calculatrice est un outil ; elle ne remplace ni la proportion ni la vérification.' },
        { t: 'La proportion est posée et vérifiée', ok: true, why: 'On évalue la démarche : proportion posée, calcul mené, résultat vérifié — pas seulement le nombre final.' }
      ],
      explanation: 'La grille valorise les hypothèses, les mesures, le calcul et la présentation. Un bon résultat mal justifié ne suffit pas.',
      hint: '« Très bien » récompense la démarche complète, pas seulement le nombre.'
    },
    {
      type: 'mcq',
      kind: 'Visée & projet',
      question: 'Sans soleil, quelle méthode fabrique une configuration de Thalès ?',
      context: 'Il n\'y a pas d\'ombre exploitable ce jour-là.',
      options: [
        { t: 'Mesurer avec un télémètre laser', why: 'Le télémètre donne une mesure directe, sans configuration de Thalès.' },
        { t: 'Compter les pas autour de l\'arbre', why: 'Compter les pas donne un périmètre approximatif, pas la hauteur.' },
        { t: 'Viser avec un miroir au sol ou une croix du bûcheron', ok: true, why: 'Le miroir renvoie le sommet vers l\'œil ; la croix du bûcheron aligne deux points à bout de bras.' }
      ],
      explanation: 'La visée crée l\'alignement et le parallélisme qui manquent : on peut alors appliquer Thalès, même sans ombre.',
      hint: 'Deux instruments simples : un miroir, ou un bâton avec une croix.'
    },
    {
      type: 'mcq',
      kind: 'Les pièges',
      question: 'Qu\'est-ce qui distingue Thalès de Pythagore ?',
      context: 'Deux théorèmes, deux situations différentes.',
      options: [
        { t: 'Thalès : des carrés ; Pythagore : des quotients', why: 'C\'est l\'inverse : Pythagore relie des carrés, Thalès des quotients.' },
        { t: 'Thalès : des quotients et une parallèle ; Pythagore : des carrés et un angle droit', ok: true, why: 'La parallèle et les quotients d\'un côté, l\'angle droit et les carrés de l\'autre.' },
        { t: 'Les deux parlent d\'angles droits', why: 'Seul Pythagore exige un angle droit. Thalès n\'en a pas besoin.' }
      ],
      explanation: 'Thalès mesure des longueurs proportionnelles grâce à une parallèle ; Pythagore calcule une longueur grâce à un angle droit.',
      hint: 'L\'un a besoin d\'une parallèle, l\'autre d\'un angle droit.'
    }
  ];

  const quiz = {
    i: 0,
    score: 0,
    attempts: 0,
    answered: new Set(),
    locked: false
  };

  const quizCard = $('#quiz-card');
  const quizResult = $('#quiz-result');
  const quizTop = $('.quiz-top');
  const progress = $('#quiz-progress');
  const counter = $('#quiz-counter');
  const scoreNode = $('#quiz-score');
  const typeNode = $('#quiz-type');
  const indexNode = $('#quiz-index');
  const questionNode = $('#quiz-question');
  const contextNode = $('#quiz-context');
  const optionsNode = $('#quiz-options');
  const form = $('#quiz-input-form');
  const answerInput = $('#quiz-answer');
  const feedback = $('#quiz-feedback');
  const feedbackIcon = $('#feedback-icon');
  const feedbackTitle = $('#feedback-title');
  const feedbackBody = $('#feedback-body');
  const nextBtn = $('#quiz-next');
  const hintBtn = $('#quiz-hint');
  const hintText = $('#quiz-hint-text');

  let lastFocusEl = null;

  function buildProgress() {
    if (!progress) return;
    progress.innerHTML = '';
    QUIZ.forEach(() => {
      const seg = document.createElement('span');
      seg.className = 'quiz-seg';
      progress.appendChild(seg);
    });
  }

  function paintProgress() {
    if (!progress) return;
    const finished = quizResult && !quizResult.hidden;
    Array.from(progress.children).forEach((seg, i) => {
      const done = finished || i < quiz.i || quiz.answered.has(i);
      seg.classList.toggle('is-done', done);
      seg.classList.toggle('is-current', !done && i === quiz.i);
    });
  }

  function updateMeta() {
    if (counter) counter.textContent = 'Question ' + Math.min(quiz.i + 1, QUIZ.length) + ' / ' + QUIZ.length;
    if (scoreNode) scoreNode.textContent = 'Du premier coup : ' + quiz.score + ' / ' + QUIZ.length;
  }

  function normalizeNum(raw) {
    if (!raw) return null;
    const cleaned = String(raw).replace(/\s/g, '').replace(/,/g, '.');
    const frac = cleaned.match(/^(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)$/);
    if (frac) return parseFloat(frac[1]) / parseFloat(frac[2]);
    const num = cleaned.match(/-?\d+(?:\.\d+)?/);
    return num ? parseFloat(num[0]) : null;
  }

  function findDiagnosis(q, value) {
    if (!q.diagnoses) return null;
    for (const d of q.diagnoses) {
      if (Math.abs(value - d.v) <= Math.max(0.02, Math.abs(d.v) * 0.006)) return d.msg;
    }
    return null;
  }

  function renderQuestion() {
    const q = QUIZ[quiz.i];
    if (!q) return;
    quiz.locked = false;
    quiz.attempts = 0;
    lastFocusEl = null;

    quizCard.hidden = false;
    quizResult.hidden = true;
    quizTop.hidden = false;

    typeNode.textContent = q.kind;
    indexNode.textContent = String(quiz.i + 1).padStart(2, '0');
    questionNode.textContent = q.question;
    contextNode.innerHTML = q.context;
    feedback.hidden = true;
    feedback.className = 'quiz-feedback';
    nextBtn.hidden = true;
    hintText.hidden = true;
    hintBtn.style.visibility = 'visible';
    hintBtn.disabled = false;

    if (q.type === 'mcq') {
      form.hidden = true;
      optionsNode.hidden = false;
      optionsNode.innerHTML = '';
      const letters = ['A', 'B', 'C', 'D'];
      q.options.forEach((opt, i) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'opt';
        btn.innerHTML = '<span class="opt-letter">' + letters[i] + '</span><span class="opt-text"></span><span class="opt-mark" aria-hidden="true"></span>';
        btn.querySelector('.opt-text').textContent = opt.t;
        btn.addEventListener('click', () => choose(q, opt, btn, i));
        optionsNode.appendChild(btn);
      });
    } else {
      optionsNode.hidden = true;
      optionsNode.innerHTML = '';
      form.hidden = false;
      answerInput.value = '';
      answerInput.className = '';
      answerInput.disabled = false;
      $('#quiz-submit').disabled = false;
      const box = quizCard.getBoundingClientRect();
      if (box.top < window.innerHeight * 0.9 && box.bottom > 0) {
        setTimeout(() => answerInput.focus({ preventScroll: true }), 350);
      }
    }
    updateMeta();
    paintProgress();
  }

  function choose(q, opt, btn, i) {
    if (quiz.locked) return;
    if (opt.ok) {
      quiz.locked = true;
      btn.classList.add('is-correct');
      btn.querySelector('.opt-mark').textContent = '✓';
      Array.from(optionsNode.children).forEach((b) => { b.disabled = true; });
      if (quiz.attempts === 0) quiz.score += 1;
      quiz.answered.add(quiz.i);
      feedback.className = 'quiz-feedback is-good';
      feedback.hidden = false;
      feedbackIcon.textContent = '✓';
      feedbackTitle.textContent = 'Exact. Tu peux avancer.';
      feedbackBody.innerHTML = '<p>' + q.explanation + '</p>';
      nextBtn.hidden = false;
      hintText.hidden = true;
      hintBtn.style.visibility = 'hidden';
      updateMeta();
      paintProgress();
      setTimeout(() => nextBtn.focus({ preventScroll: true }), 120);
      nextBtn.scrollIntoView({ block: 'nearest' });
    } else {
      quiz.attempts += 1;
      btn.classList.add('is-wrong');
      btn.disabled = true;
      const mark = btn.querySelector('.opt-mark');
      if (mark) mark.textContent = '✕';
      feedback.className = 'quiz-feedback is-bad';
      feedback.hidden = false;
      feedbackIcon.textContent = '✕';
      feedbackTitle.textContent = 'Pas encore. Regarde pourquoi.';
      const good = q.options.find((o) => o.ok);
      feedbackBody.innerHTML =
        '<p><span class="fb-label">Pourquoi ce n\'est pas ça</span><span class="fb-why">' + opt.why + '</span></p>' +
        '<p><span class="fb-label">La bonne réponse</span><span class="fb-right"><b>' + good.t + '</b> — ' + good.why + '</span></p>';
      if (quiz.attempts >= 2) revealHint();
      feedback.scrollIntoView({ block: 'nearest' });
    }
  }

  function submitAnswer(e) {
    if (e) e.preventDefault();
    const q = QUIZ[quiz.i];
    if (!q || q.type !== 'input' || quiz.locked) return;
    const value = normalizeNum(answerInput.value);
    if (value === null) {
      answerInput.classList.add('is-wrong');
      feedback.className = 'quiz-feedback is-bad';
      feedback.hidden = false;
      feedbackIcon.textContent = '✕';
      feedbackTitle.textContent = 'Il manque un nombre.';
      feedbackBody.innerHTML = '<p>Écris une valeur numérique, par exemple <b>7,5</b>. La virgule et le point sont acceptés.</p>';
      return;
    }
    const tolerance = Math.max(0.011, Math.abs(q.answer) * 0.002);
    if (Math.abs(value - q.answer) <= tolerance) {
      quiz.locked = true;
      answerInput.classList.remove('is-wrong');
      answerInput.classList.add('is-correct');
      answerInput.disabled = true;
      $('#quiz-submit').disabled = true;
      if (quiz.attempts === 0) quiz.score += 1;
      quiz.answered.add(quiz.i);
      feedback.className = 'quiz-feedback is-good';
      feedback.hidden = false;
      feedbackIcon.textContent = '✓';
      feedbackTitle.textContent = 'Bonne réponse : ' + fmtAns(q.answer) + ' ' + q.unit;
      feedbackBody.innerHTML = '<p>' + q.explanation + '</p>';
      nextBtn.hidden = false;
      hintText.hidden = true;
      hintBtn.style.visibility = 'hidden';
      updateMeta();
      paintProgress();
      setTimeout(() => nextBtn.focus({ preventScroll: true }), 120);
      nextBtn.scrollIntoView({ block: 'nearest' });
    } else {
      quiz.attempts += 1;
      answerInput.classList.remove('is-correct');
      answerInput.classList.add('is-wrong');
      feedback.className = 'quiz-feedback is-bad';
      feedback.hidden = false;
      feedbackIcon.textContent = '✕';
      feedbackTitle.textContent = 'Ce n\'est pas la bonne valeur.';
      const diag = findDiagnosis(q, value);
      feedbackBody.innerHTML =
        '<p><span class="fb-label">Ta réponse</span><b>' + escapeHtml(answerInput.value.trim()) + '</b></p>' +
        '<p><span class="fb-label">Ce qui ne va pas</span><span class="fb-why">' +
          (diag || 'Ta valeur ne vérifie pas l\'égalité des rapports. Reprends le calcul pas à pas : écris k, puis applique-le à la bonne longueur.') +
        '</span></p>' +
        (q.formula ? '<p class="fb-formula">' + q.formula + '</p>' : '') +
        '<p><span class="fb-label">La bonne réponse</span><span class="fb-right"><b>' + fmtAns(q.answer) + ' ' + q.unit + '</b> — ' + q.explanation + '</span></p>';
      if (quiz.attempts >= 2) revealHint();
      feedback.scrollIntoView({ block: 'nearest' });
    }
  }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function revealHint() {
    const q = QUIZ[quiz.i];
    if (!q) return;
    hintText.textContent = 'Indice : ' + q.hint;
    hintText.hidden = false;
    hintBtn.disabled = true;
  }

  function nextQuestion() {
    if (quiz.i >= QUIZ.length - 1) { showResult(); return; }
    quiz.i += 1;
    renderQuestion();
    const rect = quizCard.getBoundingClientRect();
    if (rect.top < 60 || rect.bottom > window.innerHeight) {
      quizCard.scrollIntoView({ block: 'center' });
    }
  }

  function showResult() {
    quizCard.hidden = true;
    quizTop.hidden = true;
    quizResult.hidden = false;
    paintProgress();
    const score = quiz.score;
    $('#result-score').textContent = String(score);
    const title = $('#result-title');
    const text = $('#result-text');
    if (score === 15) {
      title.textContent = 'Sans faute.';
      text.textContent = 'Les quinze questions du premier coup. Tu peux expliquer Thalès à quelqu\'un d\'autre — c\'est la meilleure façon de vérifier qu\'on a compris.';
    } else if (score >= 12) {
      title.textContent = 'Très solide.';
      text.textContent = 'Douze à quatorze questions du premier coup : le réflexe est là. Les questions manquées portent sûrement sur un détail de rédaction, un rapport inversé ou la visée — relis la section « Rédiger », puis refais le test.';
    } else if (score >= 8) {
      title.textContent = 'Les bases sont là.';
      text.textContent = 'Tu sais reconnaître une configuration de Thalès, mais les calculs, l\'histoire ou l\'ordre des rapports restent fragiles. Un passage par le laboratoire et les trois configurations devrait tout remettre en place.';
    } else {
      title.textContent = 'Le cours est juste là.';
      text.textContent = 'Toutes les réponses ont fini par être validées, mais souvent après une erreur. Une erreur est une information : reprends l\'histoire, les trois configurations, manipule le laboratoire, puis reviens. Tu n\'as que quinze questions à convaincre.';
    }
    quizResult.scrollIntoView({ block: 'center' });
  }

  function resetQuiz() {
    quiz.i = 0;
    quiz.score = 0;
    quiz.attempts = 0;
    quiz.answered.clear();
    quizResult.hidden = true;
    quizCard.hidden = false;
    quizTop.hidden = false;
    buildProgress();
    renderQuestion();
    quizCard.scrollIntoView({ block: 'start' });
  }

  if (quizCard) {
    buildProgress();
    renderQuestion();
    nextBtn.addEventListener('click', nextQuestion);
    hintBtn.addEventListener('click', revealHint);
    form.addEventListener('submit', submitAnswer);
    $('#quiz-restart').addEventListener('click', resetQuiz);
    answerInput.addEventListener('input', () => {
      answerInput.classList.remove('is-wrong');
    });
    Object.assign(quiz, {});

    // sync du compteur initial
    updateMeta();
    paintProgress();
  }

  /* =========================================================
     8. Mesurer la pyramide (navigation manuelle)
     ========================================================= */
  (function measureSim() {
    const sim = $('#mesure');
    if (!sim) return;

    const stage = $('#sim-stage');
    const badgeStep = $('#sim-badge-step');
    const captionNo = $('#sim-stepno');
    const captionTitle = $('#sim-caption-title');
    const captionText = $('#sim-caption-text');
    const live = $('#sim-live');
    const hLabel = $('#sim-h-label');
    const prevBtn = $('#sim-prev');
    const nextBtn = $('#sim-next');
    const progressBar = $('#sim-progress-bar');
    const dots = $$('.sim-dot', sim);
    const reveals = $$('[data-from]', sim);

    const STEPS = [
      { no: '00', title: 'Le défi', text: 'Trouver la hauteur de la pyramide sans y monter. Un bâton et deux ombres suffisent.', live: 'prêt' },
      { no: '01', title: 'Le bâton et son ombre', text: 'On plante un bâton de 1,20 m. À la même heure, son ombre mesure 2,10 m.', live: '2 mesures' },
      { no: '02', title: 'Des rayons parallèles', text: 'Le Soleil est assez loin pour que ses rayons soient parallèles : les deux triangles ont les mêmes angles.', live: 'rayons ∥' },
      { no: '03', title: 'L’ombre de la pyramide', text: 'Au sol, l’ombre de la pyramide mesure 246 m. Aucun alpiniste, aucune échelle.', live: '3 mesures' },
      { no: '04', title: 'La proportion', text: 'Le petit triangle est une réduction du grand : h / 246 = 1,20 / 2,10.', live: 'proportion' },
      { no: '05', title: 'La hauteur, sans monter', text: 'h = 1,20 × 246 ÷ 2,10 ≈ 140,6 m. La pyramide est mesurée sans être touchée.', live: 'résultat' }
    ];
    const LAST = 5;

    let current = 0;

    function apply(n) {
      current = n;
      sim.dataset.step = String(n);
      if (stage) stage.dataset.step = String(n);
      reveals.forEach((node) => {
        node.classList.toggle('is-on', Number(node.getAttribute('data-from')) <= n);
      });
      const step = STEPS[n] || STEPS[0];
      badgeStep.textContent = step.no;
      captionNo.textContent = step.no;
      captionTitle.textContent = step.title;
      captionText.textContent = step.text;
      live.textContent = step.live;
      if (hLabel) {
        hLabel.textContent = n >= LAST ? 'h = 140,6 m' : 'h = ?';
        hLabel.classList.toggle('is-result', n >= LAST);
      }
      progressBar.style.width = (n / LAST) * 100 + '%';
      dots.forEach((dot, i) => {
        const stepNo = i + 1;
        dot.classList.toggle('is-on', stepNo === n);
        dot.classList.toggle('is-past', stepNo < n);
        if (stepNo === n) dot.setAttribute('aria-current', 'step');
        else dot.removeAttribute('aria-current');
      });
      prevBtn.disabled = n <= 0;
      nextBtn.disabled = n >= LAST;
    }

    function goTo(n) {
      apply(n);
    }

    prevBtn.addEventListener('click', () => {
      if (current > 0) goTo(current - 1);
    });
    nextBtn.addEventListener('click', () => {
      if (current < LAST) goTo(current + 1);
    });
    dots.forEach((dot) => dot.addEventListener('click', () => {
      goTo(Number(dot.getAttribute('data-step')));
    }));

    apply(0);
  })();

  /* =========================================================
     9. Init figures
     ========================================================= */
  buildLab();
  renderLab();

})();
