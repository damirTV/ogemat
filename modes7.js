/* Задания 1–5 (7 класс): рисунки сюжетов «План местности», «Квартира», «Печь для бани», «Листы бумаги», «Тарифы», «Шины».
   Каждая функция OGE.fig15[ctx](вариант, задание, шаг) возвращает карточку с SVG; шаг (или null) подсвечивает нужное. */
(function () {
  'use strict';
  var O = window.OGE, esc = O.esc, L = O.L;
  var HL = '#4F3FF0', INK = '#1F2340', MUTED = '#8A8FA8';
  function f(n) { return L.fmt(n); }
  function card(svg, legend, label) {
    return '<section class="card dc-plan">' + svg.replace('<svg ', '<svg role="img" aria-label="' + esc(label) + '" ') + (legend ? '<div class="dc-legend">' + legend + '</div>' : '') + '</section>';
  }
  function has(st, id) { return !!(st && st.hl && st.hl.indexOf(id) >= 0); }
  function anyHl(st) { return !!(st && st.hl && st.hl.length); }
  function tag(x, y, n, r) {
    r = r || 13;
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff" stroke="' + INK + '" stroke-width="1.8"/><text x="' + x + '" y="' + (y + r * 0.47) + '" text-anchor="middle" font-size="' + Math.round(r * 1.35) + '" font-weight="800" fill="' + INK + '">' + n + '</text>';
  }
  function grid(w, h, cs, color) {
    var g = '', i;
    for (i = 0; i <= w; i++) g += '<line x1="' + i * cs + '" y1="0" x2="' + i * cs + '" y2="' + h * cs + '" stroke="' + (color || '#E6E1D3') + '" stroke-width="1"/>';
    for (i = 0; i <= h; i++) g += '<line x1="0" y1="' + i * cs + '" x2="' + w * cs + '" y2="' + i * cs + '" stroke="' + (color || '#E6E1D3') + '" stroke-width="1"/>';
    return g;
  }

  /* ---------- План местности ---------- */
  function mapFig(v, t, st) {
    var G = v.grid, cs = 26, P = v.P, g = '';
    g += '<rect x="0" y="0" width="' + G.w * cs + '" height="' + G.h * cs + '" fill="#FFFDF4"/>' + grid(G.w, G.h, cs);
    function pt(k) { return { x: P[k].x * cs, y: P[k].y * cs }; }
    function seg(a, b, attrs) { var p = pt(a), q = pt(b); return '<line x1="' + p.x + '" y1="' + p.y + '" x2="' + q.x + '" y2="' + q.y + '" ' + attrs + '/>'; }
    /* пруд у дороги B–D */
    var b = pt('B'), d = pt('D'), mx = (b.x + d.x) / 2, my = (b.y + d.y) / 2, len = Math.hypot(d.x - b.x, d.y - b.y), nx = -(d.y - b.y) / len, ny = (d.x - b.x) / len;
    var ang = Math.atan2(d.y - b.y, d.x - b.x) * 180 / Math.PI;
    g += '<ellipse cx="' + (mx + nx * 16) + '" cy="' + (my + ny * 16) + '" rx="' + Math.min(34, len / 4) + '" ry="11" transform="rotate(' + ang + ' ' + (mx + nx * 16) + ' ' + (my + ny * 16) + ')" fill="#7FC4E8" stroke="#3B8DBD" stroke-width="1.5"/>';
    var road = 'stroke="#8B5A2B" stroke-width="2.5" stroke-dasharray="7 5"', hw = 'stroke="#5C6178" stroke-width="5" stroke-linecap="round"';
    g += seg('A', 'D', road) + seg('B', 'D', road) + seg('A', 'C', hw) + seg('C', 'D', hw);
    /* прямой угол */
    var c = pt('C'), ua = { x: Math.sign(P.A.x - P.C.x), y: Math.sign(P.A.y - P.C.y) }, ud = { x: Math.sign(P.D.x - P.C.x), y: Math.sign(P.D.y - P.C.y) }, k = 9;
    g += '<path d="M' + (c.x + ua.x * k) + ' ' + (c.y + ua.y * k) + 'L' + (c.x + ua.x * k + ud.x * k) + ' ' + (c.y + ua.y * k + ud.y * k) + 'L' + (c.x + ud.x * k) + ' ' + (c.y + ud.y * k) + '" fill="none" stroke="' + INK + '" stroke-width="1.5"/>';
    if (st && st.hl) st.hl.forEach(function (h) { if (h.length === 2 && P[h[0]] && P[h[1]]) g += seg(h[0], h[1], 'stroke="' + HL + '" stroke-width="7" stroke-opacity=".55" stroke-linecap="round"'); });
    ['A', 'B', 'C', 'D'].forEach(function (q) { var p = pt(q); g += tag(p.x, p.y, v.label[q], 12); });
    /* масштаб */
    var sx = (G.w - 1) * cs, sy = G.h * cs + 14;
    g += '<line x1="' + (sx - cs) + '" y1="' + sy + '" x2="' + sx + '" y2="' + sy + '" stroke="' + INK + '" stroke-width="2"/><line x1="' + (sx - cs) + '" y1="' + (sy - 4) + '" x2="' + (sx - cs) + '" y2="' + (sy + 4) + '" stroke="' + INK + '" stroke-width="2"/><line x1="' + sx + '" y1="' + (sy - 4) + '" x2="' + sx + '" y2="' + (sy + 4) + '" stroke="' + INK + '" stroke-width="2"/>' +
      '<text x="' + (sx - cs / 2) + '" y="' + (sy + 18) + '" text-anchor="middle" font-size="13" font-weight="700" fill="' + INK + '">' + v.s + ' км</text>';
    return card('<svg viewBox="-16 -16 ' + (G.w * cs + 32) + ' ' + (G.h * cs + 58) + '" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>',
      'Клетка — ' + v.s + ' км. Серые линии — шоссе, пунктир — ' + (v.bike ? 'лесная дорожка и тропинка' : 'грунтовые дороги') + ', голубое — пруд.', 'План местности');
  }

  /* ---------- Квартира ---------- */
  function flatFig(v, t, st) {
    var cs = 14, W = v.W, H = v.H, g = '', R = v.rooms;
    g += grid(W, H, cs, '#EEE9DC');
    Object.keys(R).forEach(function (k) {
      var r = R[k], lg = /loggia/.test(k);
      g += '<rect x="' + r.x0 * cs + '" y="' + r.y0 * cs + '" width="' + (r.x1 - r.x0) * cs + '" height="' + (r.y1 - r.y0) * cs + '" fill="' + (lg ? '#EAF4FB' : '#FFFDF4') + '" fill-opacity=".85" stroke="' + INK + '" stroke-width="' + (lg ? 2 : 3) + '"/>';
    });
    if (st && st.hl) st.hl.forEach(function (k) { var r = R[k]; if (r) g += '<rect x="' + r.x0 * cs + '" y="' + r.y0 * cs + '" width="' + (r.x1 - r.x0) * cs + '" height="' + (r.y1 - r.y0) * cs + '" fill="rgba(79,63,240,.2)" stroke="' + HL + '" stroke-width="3.5"/>'; });
    /* окна: на внешней стороне лоджий и гостиной */
    function win(x0, y0, x1, y1) { return '<line x1="' + x0 * cs + '" y1="' + y0 * cs + '" x2="' + x1 * cs + '" y2="' + y1 * cs + '" stroke="#3B8DBD" stroke-width="6"/><line x1="' + x0 * cs + '" y1="' + y0 * cs + '" x2="' + x1 * cs + '" y2="' + y1 * cs + '" stroke="#fff" stroke-width="2"/>'; }
    ['loggia1', 'loggia2'].forEach(function (k) {
      var r = R[k], outerY = Math.abs(r.y0 - R.kitchen.y0) < 1e-9 || Math.abs(r.y0 - R.kitchen.y1) < 1e-9 ? r.y1 : r.y0;
      g += win(r.x0 + 1, outerY, r.x1 - 1, outerY);
    });
    var lv = R.living, lvOut = Math.abs(lv.y1 - R.corridor.y0) < 1e-9 || Math.abs(lv.y1 - R.corridor.y1) < 1e-9 ? lv.y0 : lv.y1;
    if (Math.abs(lv.y1 - R.corridor.y0) < 1e-9) lvOut = lv.y0; else if (Math.abs(lv.y0 - R.corridor.y1) < 1e-9) lvOut = lv.y1;
    g += win(lv.x0 + 2, lvOut, lv.x1 - 2, lvOut);
    /* двери */
    v.doors.forEach(function (d) {
      var c = d.entry ? '#D6303A' : '#8B5A2B';
      if (d.h) g += '<line x1="' + d.a * cs + '" y1="' + d.y * cs + '" x2="' + d.b * cs + '" y2="' + d.y * cs + '" stroke="#FFFDF4" stroke-width="5"/><line x1="' + d.a * cs + '" y1="' + d.y * cs + '" x2="' + d.b * cs + '" y2="' + d.y * cs + '" stroke="' + c + '" stroke-width="2" stroke-dasharray="3 2"/>';
      else g += '<line x1="' + d.x * cs + '" y1="' + d.a * cs + '" x2="' + d.x * cs + '" y2="' + d.b * cs + '" stroke="#FFFDF4" stroke-width="5"/><line x1="' + d.x * cs + '" y1="' + d.a * cs + '" x2="' + d.x * cs + '" y2="' + d.b * cs + '" stroke="' + c + '" stroke-width="2" stroke-dasharray="3 2"/>';
    });
    /* вход: стрелка снаружи */
    var en = v.doors.filter(function (d) { return d.entry; })[0], ex = (en.a + en.b) / 2 * cs, ey = en.y * cs, dir = en.y === 0 ? -1 : 1;
    g += '<path d="M' + ex + ' ' + (ey + dir * 26) + 'V' + (ey + dir * 6) + 'M' + (ex - 6) + ' ' + (ey + dir * 13) + 'L' + ex + ' ' + (ey + dir * 6) + 'L' + (ex + 6) + ' ' + (ey + dir * 13) + '" fill="none" stroke="#D6303A" stroke-width="2.5"/>' +
      '<text x="' + (ex + 10) + '" y="' + (ey + dir * 22 + 4) + '" font-size="12" font-weight="700" fill="#D6303A">вход</text>';
    Object.keys(R).forEach(function (k) { var r = R[k]; g += tag((r.x0 + r.x1) / 2 * cs, (r.y0 + r.y1) / 2 * cs, v.label[k], 11); });
    return card('<svg viewBox="-10 -36 ' + (W * cs + 20) + ' ' + (H * cs + 72) + '" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>',
      'Клетка — 0,4 м. <span style="color:#8B5A2B">┄</span> дверь, <span style="color:#3B8DBD">▬</span> окно, стрелка — вход.', 'План квартиры');
  }

  /* ---------- Печь: парная и арка кожуха ---------- */
  function roomFig(v, t, st) {
    var r = v.room, s = 60, Lx = r.L * s, Wd = r.W * s * 0.5, Hh = r.H * s, ox = 30, oy = 20 + Wd, g = '';
    var fl = has(st, 'floor') || has(st, 'box'), wl = has(st, 'walls') || has(st, 'box'), dr = has(st, 'door');
    function P(x, y, z) { return [ox + x + z * 0.8, oy + Hh - y - z * 0.8]; }
    function poly(pts, attrs) { return '<polygon points="' + pts.map(function (p) { return p.join(','); }).join(' ') + '" ' + attrs + '/>'; }
    var A = P(0, 0, 0), B = P(Lx, 0, 0), C = P(Lx, 0, Wd), D = P(0, 0, Wd), A2 = P(0, Hh, 0), B2 = P(Lx, Hh, 0), C2 = P(Lx, Hh, Wd), D2 = P(0, Hh, Wd);
    g += poly([D, C, C2, D2], 'fill="' + (wl ? 'rgba(79,63,240,.18)' : '#F3EAD8') + '" stroke="' + INK + '" stroke-width="1.5"');
    g += poly([A, D, D2, A2], 'fill="' + (wl ? 'rgba(79,63,240,.22)' : '#EADBC0') + '" stroke="' + INK + '" stroke-width="1.5"');
    g += poly([A, B, C, D], 'fill="' + (fl ? 'rgba(79,63,240,.3)' : '#E2CFA8') + '" stroke="' + INK + '" stroke-width="1.5"');
    g += poly([B, C, C2, B2], 'fill="' + (wl ? 'rgba(79,63,240,.12)' : '#F6EEDD') + '" fill-opacity=".6" stroke="' + INK + '" stroke-width="1.5"');
    g += poly([A, B, B2, A2], 'fill="' + (wl ? 'rgba(79,63,240,.1)' : '#FBF5E8') + '" fill-opacity=".55" stroke="' + INK + '" stroke-width="2"');
    var dw = r.dw / 100 * s, dh = r.dh * s, dx = Lx * 0.55;
    g += poly([P(dx, 0, 0), P(dx + dw, 0, 0), P(dx + dw, dh, 0), P(dx, dh, 0)], 'fill="' + (dr ? HL : '#B7834A') + '" fill-opacity="' + (dr ? '.5' : '.8') + '" stroke="' + INK + '" stroke-width="1.5"');
    function lbl(p, txt, dx2, dy2) { return '<text x="' + (p[0] + (dx2 || 0)) + '" y="' + (p[1] + (dy2 || 0)) + '" font-size="13" font-weight="700" fill="' + INK + '" text-anchor="middle">' + txt + '</text>'; }
    g += lbl([(A[0] + B[0]) / 2, A[1]], f(r.L) + ' м', 0, 18) + lbl([(B[0] + C[0]) / 2, (B[1] + C[1]) / 2], f(r.W) + ' м', 26, 6) + lbl([A[0], (A[1] + A2[1]) / 2], f(r.H) + ' м', -20, 0) +
      lbl([P(dx + dw / 2, 0, 0)[0], P(0, dh, 0)[1]], r.dw + ' см', 0, -6);
    return card('<svg viewBox="-10 0 ' + (Lx + Wd * 0.8 + 90) + ' ' + (Hh + Wd + 70) + '" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>', 'Парное отделение: длина, ширина, высота и дверь ' + r.dw + ' см × ' + f(r.dh) + ' м.', 'Парное отделение');
  }
  function archFig(v, t, st) {
    var a = t.arch, half = a.w / 2, s = 3.2, R = a.R, H0 = a.h, g = '', cx = half * s + 50, by = R * s + 30;
    function X(x) { return cx + x * s; } function Y(y) { return by - y * s; }
    g += '<path d="M' + X(-half) + ' ' + Y(0) + 'L' + X(-half) + ' ' + Y(H0) + 'A' + R * s + ' ' + R * s + ' 0 0 1 ' + X(half) + ' ' + Y(H0) + 'L' + X(half) + ' ' + Y(0) + 'Z" fill="#E8D9BF" stroke="' + INK + '" stroke-width="2.5"/>';
    g += '<rect x="' + X(-half * 0.45) + '" y="' + Y(H0 * 0.75) + '" width="' + half * 0.9 * s + '" height="' + H0 * 0.75 * s + '" fill="#fff" stroke="' + INK + '" stroke-width="1.5"/>';
    var tri = has(st, 'tri') || has(st, 'half');
    g += '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(half) + '" y2="' + Y(H0) + '" stroke="' + (tri ? HL : '#D6303A') + '" stroke-width="2.5"/>';
    if (tri) g += '<line x1="' + X(0) + '" y1="' + Y(0) + '" x2="' + X(half) + '" y2="' + Y(0) + '" stroke="' + HL + '" stroke-width="4"/><line x1="' + X(half) + '" y1="' + Y(0) + '" x2="' + X(half) + '" y2="' + Y(H0) + '" stroke="' + HL + '" stroke-width="4"/>';
    g += '<circle cx="' + X(0) + '" cy="' + Y(0) + '" r="4" fill="#D6303A"/><text x="' + (X(half / 2) - 8) + '" y="' + (Y(H0 / 2) - 4) + '" font-size="16" font-weight="800" fill="#D6303A">R</text>';
    g += '<line x1="' + X(-half) + '" y1="' + (Y(0) + 16) + '" x2="' + X(half) + '" y2="' + (Y(0) + 16) + '" stroke="' + INK + '" stroke-width="1.5"/><text x="' + X(0) + '" y="' + (Y(0) + 34) + '" text-anchor="middle" font-size="15" font-weight="800" fill="' + INK + '">' + a.w + '</text>';
    g += '<line x1="' + (X(-half) - 16) + '" y1="' + Y(0) + '" x2="' + (X(-half) - 16) + '" y2="' + Y(H0) + '" stroke="' + INK + '" stroke-width="1.5"/><text x="' + (X(-half) - 22) + '" y="' + Y(H0 / 2) + '" text-anchor="end" font-size="15" font-weight="800" fill="' + INK + '">' + a.h + '</text>';
    var draw = '<svg viewBox="0 0 ' + (half * 2 * s + 100) + ' ' + (R * s + 80) + '" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>';
    return figPair([[woodStoveSVG(a, true), 'Рис. 1. Печь'], [draw, 'Рис. 2. Чертёж кожуха']], 'Размеры кожуха в сантиметрах, центр дуги — середина нижней стороны.', 'Печь и чертёж кожуха');
  }

  /* ---------- Листы бумаги: разрезание А0 ---------- */
  function paperFig() {
    var W0 = 1189, H0 = 841, s = 0.32, g = '', x = 0, y = 0, w = W0, h = H0;
    g += '<rect x="0" y="0" width="' + W0 * s + '" height="' + H0 * s + '" fill="#FFFDF4" stroke="' + INK + '" stroke-width="2.5"/>';
    for (var k = 1; k <= 6; k++) {
      var px, py, pw, ph;
      if (w >= h) { pw = w / 2; ph = h; px = x; py = y; x += pw; w = pw; }
      else { pw = w; ph = h / 2; px = x; py = y; y += ph; h = ph; }
      g += '<rect x="' + px * s + '" y="' + py * s + '" width="' + pw * s + '" height="' + ph * s + '" fill="none" stroke="' + INK + '" stroke-width="1.5"/>' +
        '<text x="' + (px + pw / 2) * s + '" y="' + ((py + ph / 2) * s + 6 - (k > 4 ? 2 : 0)) + '" text-anchor="middle" font-size="' + Math.max(9, 26 - k * 3) + '" font-weight="800" fill="' + INK + '">А' + k + '</text>';
    }
    g += '<text x="' + (x + w / 2) * s + '" y="' + ((y + h / 2) * s + 3) + '" text-anchor="middle" font-size="8" font-weight="800" fill="' + INK + '">А6</text>';
    return card('<svg viewBox="-4 -4 ' + (W0 * s + 8) + ' ' + (H0 * s + 8) + '" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>', 'Лист А0 (1 м²) и форматы, которые получаются при разрезании пополам.', 'Форматы листов А0–А6');
  }

  /* ---------- Тарифы: график минут и гигабайтов ---------- */
  function chartFig(v, t, st) {
    var x0 = 46, x1 = 420, y0 = 16, y1 = 276, top = 450, g = '', i;
    function X(m) { return x0 + (m + 0.5) * (x1 - x0) / 12; } function Y(val) { return y1 - val / top * (y1 - y0); }
    for (i = 0; i <= top; i += 25) g += '<line x1="' + x0 + '" y1="' + Y(i) + '" x2="' + x1 + '" y2="' + Y(i) + '" stroke="' + (i % 50 ? '#EFEBE0' : '#DDD6C4') + '" stroke-width="1"/>';
    for (i = 0; i <= 12; i++) g += '<line x1="' + (x0 + i * (x1 - x0) / 12) + '" y1="' + y0 + '" x2="' + (x0 + i * (x1 - x0) / 12) + '" y2="' + y1 + '" stroke="#EFEBE0" stroke-width="1"/>';
    for (i = 0; i <= top; i += 50) g += '<text x="' + (x0 - 6) + '" y="' + (Y(i) + 4) + '" text-anchor="end" font-size="11" fill="' + INK + '">' + i + '</text><text x="' + (x1 + 6) + '" y="' + (Y(i) + 4) + '" font-size="11" fill="' + INK + '">' + f(i / 100) + '</text>';
    for (i = 0; i < 12; i++) g += '<text x="' + X(i) + '" y="' + (y1 + 16) + '" text-anchor="middle" font-size="11" font-weight="700" fill="' + INK + '">' + (i + 1) + '</text>';
    g += '<text x="' + x0 + '" y="' + (y0 - 4) + '" font-size="11" font-weight="800" fill="#E8812A">минуты</text><text x="' + x1 + '" y="' + (y0 - 4) + '" text-anchor="end" font-size="11" font-weight="800" fill="#2F7FB8">гигабайты</text>';
    if (has(st, 'limM')) g += '<line x1="' + x0 + '" y1="' + Y(v.M) + '" x2="' + x1 + '" y2="' + Y(v.M) + '" stroke="#E8812A" stroke-width="2.5" stroke-dasharray="2 3"/>';
    if (has(st, 'limG')) g += '<line x1="' + x0 + '" y1="' + Y(v.G * 100) + '" x2="' + x1 + '" y2="' + Y(v.G * 100) + '" stroke="#2F7FB8" stroke-width="2.5" stroke-dasharray="2 3"/>';
    g += '<polyline points="' + v.min.map(function (m, j) { return X(j) + ',' + Y(m); }).join(' ') + '" fill="none" stroke="#E8812A" stroke-width="2.5"/>';
    g += '<polyline points="' + v.gb.map(function (m, j) { return X(j) + ',' + Y(m * 100); }).join(' ') + '" fill="none" stroke="#2F7FB8" stroke-width="2.5" stroke-dasharray="6 4"/>';
    v.min.forEach(function (m, j) { g += '<circle cx="' + X(j) + '" cy="' + Y(m) + '" r="' + (has(st, 'm' + j) ? 7 : 3.5) + '" fill="' + (has(st, 'm' + j) ? HL : '#E8812A') + '"/>'; });
    v.gb.forEach(function (m, j) { g += '<circle cx="' + X(j) + '" cy="' + Y(m * 100) + '" r="' + (has(st, 'g' + j) ? 7 : 3.5) + '" fill="' + (has(st, 'g' + j) ? HL : '#2F7FB8') + '"/>'; });
    return card('<svg viewBox="0 0 460 300" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>', 'Сплошная линия — минуты (левая шкала), пунктир — гигабайты (правая шкала). Внизу — номера месяцев.', 'График расхода минут и гигабайтов по месяцам');
  }

  /* ---------- Шины: колесо в разрезе ---------- */
  function wheelFig(v, t, st) {
    var g = '', cx = 120, cy = 120, Ro = 100, Ri = 62;
    var hH = has(st, 'H'), hd = has(st, 'd'), hD = has(st, 'D');
    g += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Ro + '" fill="#3A3D4A"/><circle cx="' + cx + '" cy="' + cy + '" r="' + Ri + '" fill="#C9CDD8" stroke="' + INK + '" stroke-width="2"/>';
    for (var i = 0; i < 5; i++) { var a = i * 72 * Math.PI / 180; g += '<line x1="' + cx + '" y1="' + cy + '" x2="' + (cx + Math.cos(a) * Ri * 0.85) + '" y2="' + (cy + Math.sin(a) * Ri * 0.85) + '" stroke="#8D93A5" stroke-width="7"/>'; }
    g += '<circle cx="' + cx + '" cy="' + cy + '" r="12" fill="#8D93A5"/>';
    function dim(x1, y1, x2, y2, txt, on, side) {
      var c = on ? HL : INK;
      return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + c + '" stroke-width="' + (on ? 3.5 : 2) + '"/><circle cx="' + x1 + '" cy="' + y1 + '" r="3" fill="' + c + '"/><circle cx="' + x2 + '" cy="' + y2 + '" r="3" fill="' + c + '"/>' +
        '<text x="' + ((x1 + x2) / 2 + (side || 10)) + '" y="' + ((y1 + y2) / 2 + 5) + '" font-size="17" font-weight="800" fill="' + c + '">' + txt + '</text>';
    }
    g += dim(250, cy - Ro, 250, cy + Ro, 'D', hD, 8) + dim(cx - 20, cy - Ri, cx - 20, cy + Ri, 'd', hd, -16) + dim(cx + 40, cy - Ro, cx + 40, cy - Ri, 'H', hH, 8);
    g += '<line x1="' + cx + '" y1="' + (cy - Ro) + '" x2="262" y2="' + (cy - Ro) + '" stroke="' + MUTED + '" stroke-dasharray="3 3"/><line x1="' + cx + '" y1="' + (cy + Ro) + '" x2="262" y2="' + (cy + Ro) + '" stroke="' + MUTED + '" stroke-dasharray="3 3"/>';
    /* профиль шины: ширина B */
    var px = 300, w = 46;
    g += '<rect x="' + px + '" y="' + (cy - Ro) + '" width="' + w + '" height="' + (Ro - Ri) + '" rx="10" fill="#3A3D4A"/><rect x="' + px + '" y="' + (cy + Ri) + '" width="' + w + '" height="' + (Ro - Ri) + '" rx="10" fill="#3A3D4A"/><rect x="' + (px + 6) + '" y="' + (cy - Ri) + '" width="' + (w - 12) + '" height="' + 2 * Ri + '" fill="#C9CDD8" stroke="' + INK + '"/>';
    g += '<line x1="' + px + '" y1="' + (cy + Ro + 14) + '" x2="' + (px + w) + '" y2="' + (cy + Ro + 14) + '" stroke="' + INK + '" stroke-width="2"/><text x="' + (px + w / 2) + '" y="' + (cy + Ro + 32) + '" text-anchor="middle" font-size="17" font-weight="800" fill="' + INK + '">B</text>';
    var fac = v.factory;
    var cut = '<svg viewBox="0 0 370 260" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>';
    return figPair([[tireSVG(tireMark(fac)), 'Рис. 1. Шина ' + tireMark(fac)], [cut, 'Рис. 2. Колесо в разрезе']], 'B — ширина шины, H — высота боковины (' + fac.p + '% от B), d — диаметр диска в дюймах. D = d + 2H.', 'Шина и колесо в разрезе');
  }

  /* ---------- рисунки-«фотографии»: печи и шины ---------- */
  var uid = 0;
  function figPair(items, legend, label) {
    return '<section class="card dc-plan"><div class="pics pics-' + items.length + '">' + items.map(function (it) {
      return '<figure class="pic">' + it[0].replace('<svg ', '<svg role="img" aria-label="' + esc(it[1]) + '" ') + '<figcaption>' + esc(it[1]) + '</figcaption></figure>';
    }).join('') + '</div>' + (legend ? '<div class="dc-legend">' + legend + '</div>' : '') + '</section>';
  }
  /* дровяная печь для бани: корпус, камни, труба, дверца топки в кожухе с аркой */
  function woodStoveSVG(a, big) {
    var id = 'ws' + (++uid), w = big ? 150 : 132, x0 = 100 - w / 2, top = big ? 74 : 86, bot = 236, g = '';
    g += '<defs><linearGradient id="' + id + 'b" x1="0" x2="1"><stop offset="0" stop-color="#2A2C33"/><stop offset=".45" stop-color="#4A4E5A"/><stop offset="1" stop-color="#23252B"/></linearGradient>' +
      '<radialGradient id="' + id + 'f" cx=".5" cy=".75" r=".7"><stop offset="0" stop-color="#FFE08A"/><stop offset=".45" stop-color="#F28C28"/><stop offset="1" stop-color="#7A1E0E"/></radialGradient>' +
      '<linearGradient id="' + id + 'p" x1="0" x2="1"><stop offset="0" stop-color="#6E7380"/><stop offset=".5" stop-color="#B9BEC9"/><stop offset="1" stop-color="#5D616C"/></linearGradient></defs>';
    g += '<rect x="' + (100 + w / 2 - 44) + '" y="0" width="22" height="' + (top - 10) + '" fill="url(#' + id + 'p)"/><rect x="' + (100 + w / 2 - 47) + '" y="' + (top - 40) + '" width="28" height="6" fill="#4A4E5A"/>';
    /* камни в сетке сверху */
    var stones = '';
    for (var i = 0; i < 9; i++) { var sx = x0 + 10 + i * (w - 20) / 8, sy = top - 8 - (i % 2) * 5; stones += '<ellipse cx="' + sx + '" cy="' + sy + '" rx="' + (9 + (i * 7) % 5) + '" ry="' + (7 + (i * 3) % 3) + '" fill="' + ['#8D8F96', '#A7A39A', '#6F7179', '#9A9488'][i % 4] + '" stroke="#55575E" stroke-width="1"/>'; }
    g += stones + '<rect x="' + (x0 - 4) + '" y="' + (top - 6) + '" width="' + (w + 8) + '" height="10" rx="3" fill="#1E2026"/>';
    g += '<rect x="' + x0 + '" y="' + top + '" width="' + w + '" height="' + (bot - top) + '" rx="8" fill="url(#' + id + 'b)" stroke="#16171B" stroke-width="2"/>';
    /* кожух с аркой по пропорциям чертежа */
    var cw = w * 0.66, k = cw / a.w, half = cw / 2, hh = a.h * k, R = a.R * k, by = bot - 30;
    g += '<path d="M' + (100 - half) + ' ' + by + 'L' + (100 - half) + ' ' + (by - hh) + 'A' + R + ' ' + R + ' 0 0 1 ' + (100 + half) + ' ' + (by - hh) + 'L' + (100 + half) + ' ' + by + 'Z" fill="#3C3F49" stroke="#9AA0AC" stroke-width="2"/>';
    var dw = cw * 0.56, dh = Math.min(hh * 1.05, R * 0.95);
    g += '<rect x="' + (100 - dw / 2) + '" y="' + (by - dh) + '" width="' + dw + '" height="' + dh + '" rx="4" fill="#1A1B20" stroke="#9AA0AC" stroke-width="2"/>' +
      '<rect x="' + (100 - dw / 2 + 5) + '" y="' + (by - dh + 5) + '" width="' + (dw - 10) + '" height="' + (dh - 10) + '" rx="3" fill="url(#' + id + 'f)"/>' +
      '<path d="M' + (100 - dw * 0.22) + ' ' + (by - 7) + 'q4 -' + dh * 0.45 + ' ' + dw * 0.12 + ' -' + dh * 0.6 + 'q2 ' + dh * 0.25 + ' ' + dw * 0.1 + ' ' + dh * 0.3 + 'q4 -' + dh * 0.2 + ' ' + dw * 0.06 + ' -' + dh * 0.42 + 'q' + dw * 0.12 + ' ' + dh * 0.3 + ' ' + dw * 0.08 + ' ' + dh * 0.72 + 'z" fill="#FFF1B8" opacity=".85"/>' +
      '<rect x="' + (100 + dw / 2 - 4) + '" y="' + (by - dh * 0.6) + '" width="7" height="' + dh * 0.25 + '" rx="2" fill="#C9CDD8"/>';
    /* зольный ящик и ножки */
    g += '<rect x="' + (100 - dw / 2) + '" y="' + (bot - 22) + '" width="' + dw + '" height="13" rx="2" fill="#1A1B20" stroke="#9AA0AC" stroke-width="1.5"/><rect x="' + (100 - 8) + '" y="' + (bot - 18) + '" width="16" height="4" rx="2" fill="#C9CDD8"/>';
    g += '<rect x="' + (x0 + 8) + '" y="' + bot + '" width="14" height="14" fill="#16171B"/><rect x="' + (x0 + w - 22) + '" y="' + bot + '" width="14" height="14" fill="#16171B"/>';
    for (i = 0; i < 4; i++) g += '<circle cx="' + (x0 + 8 + (i % 2) * (w - 16)) + '" cy="' + (top + 10 + Math.floor(i / 2) * (bot - top - 20)) + '" r="2.5" fill="#8D93A5"/>';
    return '<svg viewBox="0 0 200 252" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>';
  }
  /* электрическая печь-каменка: стальной корпус, камни, пульт */
  function elStoveSVG() {
    var id = 'es' + (++uid), g = '';
    g += '<defs><linearGradient id="' + id + 'b" x1="0" x2="1"><stop offset="0" stop-color="#8E94A1"/><stop offset=".5" stop-color="#D9DDE5"/><stop offset="1" stop-color="#7E8491"/></linearGradient></defs>';
    var x0 = 44, w = 112, top = 70, bot = 236;
    for (var i = 0; i < 14; i++) { var sx = x0 + 6 + (i % 7) * (w - 12) / 6, sy = top - 4 - Math.floor(i / 7) * 12 - (i % 2) * 4; g += '<ellipse cx="' + sx + '" cy="' + sy + '" rx="' + (9 + i % 3) + '" ry="7" fill="' + ['#8D8F96', '#A7A39A', '#6F7179', '#9A9488'][i % 4] + '" stroke="#55575E" stroke-width="1"/>'; }
    g += '<rect x="' + x0 + '" y="' + top + '" width="' + w + '" height="' + (bot - top) + '" rx="6" fill="url(#' + id + 'b)" stroke="#5D616C" stroke-width="2"/>';
    for (i = 0; i < 6; i++) g += '<rect x="' + (x0 + 14) + '" y="' + (top + 14 + i * 9) + '" width="' + (w - 28) + '" height="4" rx="2" fill="#5D616C" opacity=".55"/>';
    g += '<rect x="' + (x0 + 16) + '" y="' + (top + 82) + '" width="' + (w - 32) + '" height="52" rx="6" fill="#2A2C33"/>' +
      '<circle cx="' + (x0 + 38) + '" cy="' + (top + 108) + '" r="13" fill="#C9CDD8" stroke="#16171B" stroke-width="2"/><line x1="' + (x0 + 38) + '" y1="' + (top + 108) + '" x2="' + (x0 + 38) + '" y2="' + (top + 97) + '" stroke="#16171B" stroke-width="3"/>' +
      '<circle cx="' + (x0 + 74) + '" cy="' + (top + 108) + '" r="13" fill="#C9CDD8" stroke="#16171B" stroke-width="2"/><line x1="' + (x0 + 74) + '" y1="' + (top + 108) + '" x2="' + (x0 + 84) + '" y2="' + (top + 104) + '" stroke="#16171B" stroke-width="3"/>' +
      '<circle cx="' + (x0 + 96) + '" cy="' + (top + 92) + '" r="4" fill="#E53935"/><text x="' + (x0 + w / 2) + '" y="' + (top + 150) + '" text-anchor="middle" font-size="11" font-weight="800" fill="#2A2C33">кВт</text>';
    g += '<rect x="' + (x0 + 8) + '" y="' + bot + '" width="12" height="12" fill="#5D616C"/><rect x="' + (x0 + w - 20) + '" y="' + bot + '" width="12" height="12" fill="#5D616C"/>';
    g += '<path d="M' + (x0 + w) + ' ' + (bot - 20) + 'c26 0 30 14 46 14" fill="none" stroke="#2A2C33" stroke-width="4"/>';
    return '<svg viewBox="0 0 200 252" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>';
  }
  var DEF_ARCH = { w: 66, h: 44, R: 55 };
  function stovesFig(v) {
    var s = v.stoves, firstWood = true;
    return figPair(s.types.map(function (tp, i) {
      var svg = tp === 'Электрическая' ? elStoveSVG() : woodStoveSVG(DEF_ARCH, s.mass[i] > 45);
      return [svg, 'Печь № ' + (i + 1) + ': ' + tp.toLowerCase() + ', ' + s.mass[i] + ' кг'];
    }), 'Три печи из таблицы. Масса и стоимость — в таблице ниже.', 'Печи для бани');
  }
  /* шина сбоку: протектор, боковина с маркировкой, диск */
  function tireSVG(mark, small) {
    var id = 'ty' + (++uid), c = 110, g = '';
    g += '<defs><radialGradient id="' + id + 'r" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#F2F4F8"/><stop offset=".6" stop-color="#AEB4C0"/><stop offset="1" stop-color="#6E7380"/></radialGradient>' +
      '<radialGradient id="' + id + 's" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#3A3D47"/><stop offset=".85" stop-color="#2B2D35"/><stop offset="1" stop-color="#202228"/></radialGradient>' +
      '<path id="' + id + 't" d="M' + (c - 79) + ' ' + c + 'A79 79 0 0 1 ' + (c + 79) + ' ' + c + '"/><path id="' + id + 'u" d="M' + (c - 87) + ' ' + c + 'A87 87 0 0 0 ' + (c + 87) + ' ' + c + '"/></defs>';
    g += '<circle cx="' + c + '" cy="' + c + '" r="106" fill="#1C1D22"/>';
    for (var i = 0; i < 64; i++) { var a = i * 360 / 64; g += '<rect x="' + (c - 3) + '" y="' + (c - 108) + '" width="6" height="9" rx="1.5" fill="#34363F" transform="rotate(' + a + ' ' + c + ' ' + c + ')"/>'; }
    g += '<circle cx="' + c + '" cy="' + c + '" r="97" fill="url(#' + id + 's)"/><circle cx="' + c + '" cy="' + c + '" r="92" fill="none" stroke="#474A55" stroke-width="1.2"/><circle cx="' + c + '" cy="' + c + '" r="66" fill="none" stroke="#474A55" stroke-width="1.2"/>';
    g += '<text font-size="17" font-weight="800" fill="#E9EBF0" letter-spacing="1"><textPath href="#' + id + 't" startOffset="50%" text-anchor="middle">' + esc(mark) + '</textPath></text>';
    g += '<text font-size="9" font-weight="700" fill="#9AA0AC" letter-spacing="2"><textPath href="#' + id + 'u" startOffset="50%" text-anchor="middle">RADIAL · TUBELESS</textPath></text>';
    g += '<circle cx="' + c + '" cy="' + c + '" r="62" fill="url(#' + id + 'r)" stroke="#5D616C" stroke-width="2"/>';
    for (i = 0; i < 5; i++) {
      var b = (i * 72 - 90) * Math.PI / 180, b1 = b - 0.22, b2 = b + 0.22;
      g += '<path d="M' + (c + Math.cos(b1) * 15) + ' ' + (c + Math.sin(b1) * 15) + 'L' + (c + Math.cos(b - 0.12) * 56) + ' ' + (c + Math.sin(b - 0.12) * 56) + 'L' + (c + Math.cos(b + 0.12) * 56) + ' ' + (c + Math.sin(b + 0.12) * 56) + 'L' + (c + Math.cos(b2) * 15) + ' ' + (c + Math.sin(b2) * 15) + 'Z" fill="#8D93A5" stroke="#5D616C" stroke-width="1"/>';
      var bn = (i * 72 - 54) * Math.PI / 180;
      g += '<circle cx="' + (c + Math.cos(bn) * 22) + '" cy="' + (c + Math.sin(bn) * 22) + '" r="3.2" fill="#3A3D47"/>';
    }
    g += '<circle cx="' + c + '" cy="' + c + '" r="13" fill="#C9CDD8" stroke="#5D616C" stroke-width="2"/>';
    return '<svg viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg">' + g + '</svg>';
  }
  function tireMark(m) { return m.w + '/' + m.p + ' R' + m.d; }

  O.fig15 = O.fig15 || {};
  O.fig15.map = mapFig;
  O.fig15.flat = flatFig;
  O.fig15.stove = function (v, t, st) { return t.fig === 'arch' ? archFig(v, t, st) : t.fig === 'stoves' ? stovesFig(v) : roomFig(v, t, st); };
  O.fig15.paper = paperFig;
  O.fig15.tariff = chartFig;
  O.fig15.tires = function (v, t, st) {
    if (t.fig === 'tirepic') return figPair([[tireSVG(tireMark(v.factory)), 'Шина с завода: ' + tireMark(v.factory)]], 'Маркировка на боковине: ширина/процент R диаметр диска в дюймах.', 'Шина');
    return wheelFig(v, t, st);
  };
})();
