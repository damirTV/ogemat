/* Задания 1–5 (7 класс): общий движок для всех сюжетов. Режим «Сюжет» (по шагам, с подсказками) и общий «Спринт» (весь вариант без подсказок, на время).
   Рисунки сюжетов — в OGE.fig15[ctx] (план дачного участка здесь, остальные в modes7.js). */
(function () {
  'use strict';
  var O = window.OGE, L = O.L, app = O.app, esc = O.esc, ICON = O.ICON;
  var B = null;   // раунд «Стройки»
  var E = null;   // раунд «Спринта»
  var timer = null, LIMIT = 1800;
  var S = 12;     // пикселей на метр на плане

  /* Статистика заданий 1–5 (stats.dacha — исторически общий объект для всех сюжетов) */
  function D() {
    var s = O.stats, d = s.dacha || (s.dacha = { points: 0, builds: 0, bestBuild: 0, exams: 0, bestExam: 0 });
    if (!d.ctx) d.ctx = {};
    if (!d.migrated) {
      /* навыки «Дачного участка» переносим в общие навыки заданий 1–5 */
      Object.keys(L.SKILL15_OLD).forEach(function (old) {
        var o = s.skills[old]; if (!o) return;
        var nw = s.skills[L.SKILL15_OLD[old]] || (s.skills[L.SKILL15_OLD[old]] = { ok: 0, total: 0 });
        nw.ok += o.ok; nw.total += o.total; delete s.skills[old];
      });
      if (d.builds && !d.ctx.dacha) d.ctx.dacha = { builds: d.builds, best: d.bestBuild };
      d.migrated = 1;
    }
    return d;
  }
  function DC(id) { var d = D(); return d.ctx[id] || (d.ctx[id] = { builds: 0, best: 0 }); }
  function skill(id, ok) { var k = O.stats.skills[id] || (O.stats.skills[id] = { ok: 0, total: 0 }); k.total++; if (ok) k.ok++; }
  function sp(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function num(n) { return L.fmt(n); }
  function mk(r, attrs) { return '<rect x="' + r.x0 * S + '" y="' + r.y0 * S + '" width="' + (r.x1 - r.x0) * S + '" height="' + (r.y1 - r.y0) * S + '" ' + attrs + '/>'; }
  function line(x0, y0, x1, y1, attrs) { return '<line x1="' + x0 * S + '" y1="' + y0 * S + '" x2="' + x1 * S + '" y2="' + y1 * S + '" ' + attrs + '/>'; }
  function R4(x0, y0, x1, y1) { return { x0: x0, y0: y0, x1: x1, y1: y1 }; }

  /* ---------- план участка ---------- */
  function nearPair(o) {
    var best = null, g = o.garage;
    [o.houseA, o.houseB].forEach(function (h) {
      var dx = Math.max(0, h.x0 - g.x1, g.x0 - h.x1), dy = Math.max(0, h.y0 - g.y1, g.y0 - h.y1), d = dx * dx + dy * dy;
      if (!best || d < best.d) best = { h: h, d: d };
    });
    var h = best.h, left = h.x1 <= g.x0, up = h.y1 <= g.y0;
    return { P: { x: left ? h.x1 : h.x0, y: up ? h.y1 : h.y0 }, Q: { x: left ? g.x0 : g.x1, y: up ? g.y0 : g.y1 } };
  }
  function planSVG(v, hl, tri) {
    var o = v.obj, W = v.W, H = v.H, g = '', x, y, gt = v.gate, east = gt.side === 'E';
    g += '<defs><pattern id="dc-tile" width="' + S + '" height="' + S + '" patternUnits="userSpaceOnUse"><rect width="' + S + '" height="' + S + '" fill="#F5A94A"/><path d="M0 0H' + S + 'M0 0V' + S + '" stroke="#FFDCA6" stroke-width="1"/></pattern></defs>';
    g += mk(R4(0, 0, W, H), 'fill="#FFFDF4"');
    for (x = v.c; x < W; x += v.c) g += line(x, 0, x, H, 'stroke="#E9E2D0" stroke-width="1"');
    for (y = v.c; y < H; y += v.c) g += line(0, y, W, y, 'stroke="#E9E2D0" stroke-width="1"');
    /* огород */
    g += mk(o.garden, 'fill="#EEF6E4" stroke="#3E8F4E" stroke-width="2" stroke-dasharray="6 4"');
    var gc = { x: (o.green.x0 + o.green.x1) / 2, y: (o.green.y0 + o.green.y1) / 2 };
    for (x = o.garden.x0 + 2; x < o.garden.x1 - 1; x += 3) {
      for (y = o.garden.y0 + 2; y < o.garden.y1 - 1; y += 3) {
        if (x > o.green.x0 - 1 && x < o.green.x1 + 1 && y > o.green.y0 - 1 && y < o.green.y1 + 1) continue;
        g += '<path d="M' + (x * S) + ' ' + (y * S + 5) + 'l-3 -9h6z" fill="#E8812A"/><path d="M' + (x * S) + ' ' + (y * S - 4) + 'v-4" stroke="#3E8F4E" stroke-width="2"/>';
      }
    }
    /* плитка */
    [o.pad, o.main, o.pathB, o.pathG].forEach(function (r) { g += mk(r, 'fill="url(#dc-tile)"'); });
    /* постройки */
    var solid = 'fill="#D9A066" stroke="#5B3A14" stroke-width="2"';
    [o.shed, o.garage, o.bath, o.houseA, o.houseB, o.green].forEach(function (r) { g += mk(r, solid); });
    var sx0 = Math.max(o.houseA.x0, o.houseB.x0), sx1 = Math.min(o.houseA.x1, o.houseB.x1), sy = o.houseA.y1 === o.houseB.y0 ? o.houseA.y1 : o.houseA.y0;
    g += line(sx0, sy, sx1, sy, 'stroke="#D9A066" stroke-width="3"');
    /* яблони */
    v.trees.forEach(function (t) { g += '<circle cx="' + t.x * S + '" cy="' + t.y * S + '" r="' + 0.9 * S + '" fill="#2E5E3A" stroke="#1B3B24" stroke-width="1.5"/><circle cx="' + (t.x * S - 3) + '" cy="' + (t.y * S - 3) + '" r="3" fill="#4C8A5A"/>'; });
    /* граница и ворота */
    var b = 'stroke="#1F2340" stroke-width="3" stroke-linecap="round"';
    g += line(0, 0, W, 0, b) + line(0, H, W, H, b);
    if (east) g += line(0, 0, 0, H, b) + line(W, 0, W, gt.y0, b) + line(W, gt.y1, W, H, b);
    else g += line(W, 0, W, H, b) + line(0, 0, 0, gt.y0, b) + line(0, gt.y1, 0, H, b);
    var gx = east ? W : 0, dir = east ? 1 : -1, gm = (gt.y0 + gt.y1) / 2;
    g += line(gx, gt.y0, gx + dir * 1.6, gt.y0 - 0.9, 'stroke="#1F2340" stroke-width="2"') + line(gx, gt.y1, gx + dir * 1.6, gt.y1 + 0.9, 'stroke="#1F2340" stroke-width="2"');
    g += '<text transform="translate(' + (gx + dir * 3.4) * S + ' ' + gm * S + ') rotate(-90)" text-anchor="middle" font-size="15" font-weight="700" fill="#1F2340">ворота</text>';
    /* подсветка */
    var HL = { pad: [o.pad], main: [o.main], pathB: [o.pathB], pathG: [o.pathG], house: [o.houseA, o.houseB], garage: [o.garage], shed: [o.shed], bath: [o.bath], apples: [o.apples], garden: [o.garden], green: [o.green] };
    (hl || []).forEach(function (id) { (HL[id] || []).forEach(function (r) { g += mk(r, 'fill="rgba(79,63,240,.22)" stroke="#4F3FF0" stroke-width="3.5" class="dc-hl"'); }); });
    /* ломаная для «Рулетки» */
    if (tri) {
      var pq = nearPair(o);
      g += line(pq.P.x, pq.P.y, pq.Q.x, pq.P.y, 'stroke="#E8812A" stroke-width="3" stroke-dasharray="5 4"') + line(pq.Q.x, pq.P.y, pq.Q.x, pq.Q.y, 'stroke="#E8812A" stroke-width="3" stroke-dasharray="5 4"') +
        line(pq.P.x, pq.P.y, pq.Q.x, pq.Q.y, 'stroke="#D6303A" stroke-width="3"') +
        '<circle cx="' + pq.P.x * S + '" cy="' + pq.P.y * S + '" r="5" fill="#D6303A"/><circle cx="' + pq.Q.x * S + '" cy="' + pq.Q.y * S + '" r="5" fill="#D6303A"/>';
    }
    /* номера */
    function tag(n, p) { return '<circle cx="' + p.x * S + '" cy="' + p.y * S + '" r="13" fill="#fff" stroke="#1F2340" stroke-width="1.8"/><text x="' + p.x * S + '" y="' + (p.y * S + 6.5) + '" text-anchor="middle" font-size="18" font-weight="800" fill="#1F2340">' + n + '</text>'; }
    function mid(r) { return { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 }; }
    var lab = v.label, gcorner = null, far = -1;
    [[o.garden.x0 + 1.6, o.garden.y0 + 1.6], [o.garden.x1 - 1.6, o.garden.y0 + 1.6], [o.garden.x0 + 1.6, o.garden.y1 - 1.6], [o.garden.x1 - 1.6, o.garden.y1 - 1.6]].forEach(function (c) {
      var d = (c[0] - gc.x) * (c[0] - gc.x) + (c[1] - gc.y) * (c[1] - gc.y); if (d > far) { far = d; gcorner = { x: c[0], y: c[1] }; }
    });
    g += tag(lab.shed, mid(o.shed)) + tag(lab.garage, mid(o.garage)) + tag(lab.house, mid(o.houseA)) + tag(lab.bath, mid(o.bath)) + tag(lab.green, mid(o.green)) + tag(lab.garden, gcorner) + tag(lab.apples, mid(o.apples));
    /* масштаб */
    var m = 3;
    return '<svg viewBox="' + (-4.4 * S) + ' ' + (-1 * S) + ' ' + ((W + 8.8) * S) + ' ' + ((H + 2) * S) + '" role="img" aria-label="План дачного участка. Сторона клетки 2 метра." xmlns="http://www.w3.org/2000/svg">' + g + '</svg>';
  }
  function planCard(v, hl, tri) {
    return '<section class="card dc-plan">' + planSVG(v, hl, tri) + '<div class="dc-legend">Клетка плана 2 м × 2 м. Оранжевое — плитка.</div></section>';
  }
  O.fig15 = O.fig15 || {};
  O.fig15.dacha = function (v, t, st) { return planCard(v, st ? st.hl : [], !!(st && st.tri)); };

  /* ---------- общие части экрана ---------- */
  function figHTML(v, t, st) {
    var fn = O.fig15[v.ctx];
    return t.fig && fn ? fn(v, t, st || null) : '';
  }
  function tablesHTML(list) {
    return (list || []).map(function (tb) {
      return '<section class="card" style="overflow-x:auto;padding:10px">' + (tb.cap ? '<div class="label" style="margin-bottom:6px">' + esc(tb.cap) + '</div>' : '') +
        '<table class="dc-table"><thead><tr>' + tb.head.map(function (h) { return '<th>' + esc(h) + '</th>'; }).join('') + '</tr></thead><tbody>' +
        tb.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<th scope="row">' + esc(c) + '</th>' : '<td>' + esc(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table></section>';
    }).join('');
  }
  function conditionHTML(v, ti) {
    var t = v.tasks[ti], common = (v.common || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('');
    var top = ti === 0
      ? '<section class="card dc-text">' + common + '</section>' + tablesHTML(v.commonTables)
      : '<details class="card dc-common"><summary>Условие сюжета</summary><div class="dc-text">' + common + '</div>' + tablesHTML(v.commonTables) + '</details>';
    var own = (t.paras || []).map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + (t.ask ? '<p><b>' + esc(t.ask) + '</b></p>' : '');
    return top + (own ? '<section class="card dc-text">' + own + '</section>' : '') + tablesHTML(t.tables);
  }
  function head(v, ti, label) {
    return '<div class="head"><div class="pill pill-primary">' + esc(v.name) + ' · ' + esc(label) + ' · тип ' + (ti + 1) + '</div><h1 class="h1 sm">' + esc(v.tasks[ti].title) + '</h1></div>';
  }
  function topbar(label, pct, chip, chipId) {
    return '<div class="topbar"><button class="close" data-act="home15" aria-label="Выйти в задания 1–5">' + ICON.close + '</button>' +
      '<div class="progress"><div class="progress-label">' + esc(label) + '</div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>' +
      '<div class="chip chip-pts"' + (chipId ? ' id="' + chipId + '" role="timer" aria-label="Осталось времени"' : '') + '>' + esc(chip) + '</div></div>';
  }
  function fieldHTML(value) {
    return '<div class="field" id="dc-field"><span id="dc-fieldText">' + (value ? esc(value) : '<span class="ph">Введи ответ</span>') + '</span><span class="caret" aria-hidden="true"></span></div>';
  }
  /* клавиатура: для полей с номерами (maxVal) лишние цифры и запятая выключены */
  function keypadHTML(maxVal) {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', maxVal >= 10 ? 'next' : ',', '0', 'back'];
    return '<div class="keypad" role="group" aria-label="Цифры">' + keys.map(function (k) {
      if (k === 'next') return '<button class="key" data-act="dc-key" data-k="next" aria-label="Следующее поле">→</button>';
      var off = maxVal && (k === ',' || (k === '0' && maxVal < 10) || (/^[1-9]$/.test(k) && Number(k) > maxVal));
      if (off) return '<button class="key" disabled aria-hidden="true" tabindex="-1" style="opacity:.35">' + k + '</button>';
      if (k === 'back') return '<button class="key" data-act="dc-key" data-k="back" aria-label="Стереть">' + ICON.back + '</button>';
      return '<button class="key" data-act="dc-key" data-k="' + k + '">' + k + '</button>';
    }).join('') + '</div>';
  }
  function slotsHTML(t, slots, active, locked) {
    var n = t.slots.length;
    return (t.maxVal >= 10 ? '<div class="hint">Номера 10, 11, 12 набирай подряд. Если нужен номер 1, после него нажми «→».</div>' : '') + '<div class="card dc-boxes" style="grid-template-columns:repeat(' + n + ',minmax(0,1fr))" role="group" aria-label="Номера">' + t.slots.map(function (sl, i) {
      var val = slots[sl.id];
      return '<button class="dc-box' + (i === active ? ' is-active' : '') + (val ? ' is-set' : '') + '" data-act="dc-box" data-i="' + i + '"' + (locked ? ' disabled' : '') + ' aria-label="' + esc(sl.name) + (val ? ', номер ' + val : ', номер не введён') + '">' +
        '<span class="dc-box-n">' + esc(sl.name) + '</span><span class="dc-box-v">' + (val || '') + '</span></button>';
    }).join('') + '</div>';
  }
  /* ввод цифры в активное поле. Номера до 12: «1» ждёт вторую цифру (10, 11, 12), остальные сразу переходят к следующему полю */
  function slotKey(st, t, k) {
    var ids = t.slots.map(function (x) { return x.id; }), max = t.maxVal || 9, id = ids[st.active];
    function next() { st.pend = null; for (var i = 1; i <= ids.length; i++) { var j = (st.active + i) % ids.length; if (!st.slots[ids[j]]) { st.active = j; return; } } }
    if (k === 'next') { if (st.slots[id]) next(); else st.pend = null; return true; }
    if (k === 'back') {
      st.pend = null;
      if (st.slots[id]) delete st.slots[id];
      else if (st.active > 0) { st.active--; delete st.slots[ids[st.active]]; }
      return true;
    }
    if (!/^\d$/.test(k)) return false;
    var d = Number(k);
    if (st.pend === st.active && st.slots[id] * 10 + d <= max) { st.slots[id] = st.slots[id] * 10 + d; next(); return true; }
    if (d === 0 || d > max) return false;
    st.slots[id] = d;
    if (d * 10 <= max) st.pend = st.active; else next();
    return true;
  }
  function slotAnswer(t, slots) { return t.slots.map(function (s) { return slots[s.id] || ''; }).join(''); }
  function slotsFull(t, slots) { return t.slots.every(function (s) { return slots[s.id]; }); }

  /* ================== ЭКРАН «ЗАДАНИЯ 1–5» ================== */
  function renderHome15() {
    var tiles = L.CTX15.map(function (c) {
      var st = DC(c.id);
      return '<button class="tile is-ready" data-act="start-dc-build" data-ctx="' + c.id + '"><span class="tile-t">' + esc(c.title) + '</span><span class="tile-n">' + esc(c.note) + '</span>' +
        '<span class="tile-s">' + (st.builds ? 'Пройдено: ' + st.builds + ' · рекорд ' + st.best : 'Ещё не пройден') + '</span></button>';
    }).join('');
    app.innerHTML = '<button class="btn-small back" data-act="menu">← Все задания</button>' +
      '<header class="home-hero"><div class="pill pill-primary" style="align-self:flex-start">7 класс</div><h1 class="h1">Задания 1–5</h1>' +
      '<p class="lead">Практические задачи ОГЭ. Выбери сюжет: в нём пять заданий подряд, как в экзамене, с подсказками и разбором ошибок. Числа каждый раз новые.</p></header>' +
      '<section class="menu-group" aria-label="Сюжеты"><h2 class="menu-h">Сюжеты</h2><div class="tiles">' + tiles + '</div></section>' +
      '<button class="mode" data-act="start-dc-sprint"><span class="mode-t"><span>Спринт</span><span class="pill pill-amber">10 заданий · 30 минут</span></span>' +
      '<span class="mode-d">Два случайных сюжета подряд, по пять заданий в каждом, как в варианте ОГЭ: на время, без подсказок и с итоговым разбором.</span>' +
      '<span class="mode-meta"><span class="mini amber">Лучший результат: ' + D().bestExam + ' из 10</span><span class="mini">Спринтов: ' + D().exams + '</span></span></button>' +
      '<div class="links spacer"><button class="btn-small" data-act="report15">Отчёт для родителя</button></div>';
    O.postRender();
  }

  /* ================== СЮЖЕТ ПО ШАГАМ ================== */
  function startBuild(d) {
    var ctx = d && d.ctx ? d.ctx : (B ? B.v.ctx : 'dacha');
    B = { v: L.make15(ctx), ti: 0, si: 0, stage: 'play', input: '', tries: 0, aid: false, reveal: false, msg: '', points: 0, log: [], slots: {}, active: 0, pend: null, stepLog: [], cur: null, res: null, newBest: false, firstCount: 0 };
    resetTask();
    E = null;
    O.go('dc');
  }
  function resetTask() {
    B.si = 0; B.stage = 'play'; B.input = ''; B.tries = 0; B.aid = false; B.reveal = false; B.msg = ''; B.slots = {}; B.active = 0; B.pend = null; B.stepLog = [];
    B.cur = { pts: 0, clean: true, solved: true }; B.res = null;
  }
  function renderBuild() {
    if (!B || O.screen !== 'dc') { O.go('home15'); return; }
    if (B.stage === 'end') { renderBuildEnd(); return; }
    var v = B.v, t = v.tasks[B.ti], done = B.stage === 'result' ? B.ti + 1 : B.ti, body;
    if (B.stage === 'result') body = resultView(v, t);
    else body = t.kind === 'slots' ? slotsView(v, t) : stepView(v, t);
    app.innerHTML = topbar('Задание ' + (B.ti + 1) + ' из 5', Math.round(done / 5 * 100), B.points + ' очков') + body;
    O.postRender();
  }
  function slotsView(v, t) {
    return head(v, B.ti, 'по шагам') + figHTML(v, t, null) + conditionHTML(v, B.ti) +
      '<div class="foot"><span class="label">Введи номер для каждого поля</span><span class="label">Попытка ' + (B.tries + 1) + ' из 2</span></div>' + slotsHTML(t, B.slots, B.active, false) + keypadHTML(t.maxVal || 9) +
      (B.msg ? '<div class="banner banner-warn" id="msg">' + esc(B.msg) + '</div>' : '') +
      '<div class="foot spacer"><span></span><div class="foot-note">С первой попытки<br>+8 очков</div></div>' +
      '<button class="btn btn-primary" data-act="dc-check" data-primary id="dc-check"' + (slotsFull(t, B.slots) ? '' : ' disabled') + '>Проверить</button>';
  }
  function stepView(v, t) {
    var st = t.steps[B.si], n = t.steps.length, done = B.stepLog.map(function (s) { return '<div class="chip chip-ok" style="align-self:flex-start">' + ICON.check(18) + ' ' + esc(s) + '</div>'; }).join('');
    var aid = B.aid || B.reveal ? '<div class="banner banner-info"><b>' + (B.reveal ? 'Правильный ответ: ' + num(st.ans) + ' ' + esc(st.unit) + '.' : 'Подсказка.') + '</b> ' + esc(st.aid) + '</div>' : '';
    var act = B.reveal
      ? '<button class="btn btn-primary spacer" data-act="dc-cont" data-primary>' + (B.si + 1 >= n ? 'К разбору' : 'Дальше') + '</button>'
      : '<div class="foot spacer"><button class="btn-small" data-act="dc-aid"' + (B.aid ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Без подсказки<br>+4 очка</div></div>' +
      '<button class="btn btn-primary" data-act="dc-check" data-primary id="dc-check"' + (B.input ? '' : ' disabled') + '>Проверить</button>';
    return head(v, B.ti, 'по шагам') + figHTML(v, t, st) + conditionHTML(v, B.ti) + done +
      '<section class="card task task-compact"><div class="kicker">Шаг ' + (B.si + 1) + ' из ' + n + '</div><div style="font-size:20px;line-height:1.3;font-weight:800">' + esc(st.q) + '</div></section>' +
      (B.reveal ? '' : fieldHTML(B.input) + keypadHTML() + '<div class="foot"><span class="label">' + (st.unit ? 'Единицы: ' + esc(st.unit) : 'Ответ числом') + '</span><span class="label">Попытка ' + (B.tries + 1) + ' из 2</span></div>') +
      (B.msg ? '<div class="banner banner-warn" id="msg">' + esc(B.msg) + '</div>' : '') + aid + act;
  }
  function answerText(t) { return t.kind === 'slots' ? t.answer : num(Number(t.answer)); }
  function resultView(v, t) {
    var r = B.res, last = B.ti + 1 >= 5;
    return '<div class="hero">' + (r.solved ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Задание готово</h1>' : '<div class="badge badge-warn pop">' + ICON.excl + '</div><h1 class="h1">Разберём</h1>') +
      '<div class="hero-sub">' + (r.solved ? 'Ответ: ' : 'Правильный ответ: ') + esc(answerText(t)) + '</div></div>' +
      figHTML(v, t, null) +
      O.breakdown([{ label: r.clean ? 'Без подсказок и промахов' : r.solved ? 'Решено с подсказками или со второй попытки' : 'Часть шагов показана', pts: r.pts }], r.pts) +
      '<section class="note note-primary"><div class="note-t">Как решать</div><div>' + esc(t.explain) + '</div></section>' +
      '<button class="btn btn-primary spacer" data-act="dc-next" data-primary>' + (last ? 'Показать итог' : 'Следующее задание') + '</button>';
  }
  function finishTask(solved, pts, clean) {
    var t = B.v.tasks[B.ti];
    B.res = { solved: solved, pts: pts, clean: clean };
    B.log.push({ ti: B.ti, clean: clean, solved: solved, skill: t.skill });
    if (clean) B.firstCount++;
    skill(t.skill, clean);
    B.stage = 'result';
    O.saveStats();
    O.announce(solved ? 'Задание готово' : 'Разберём');
    renderBuild();
  }
  function addPoints(p) { B.points += p; D().points += p; B.cur.pts += p; }
  function typeNum(a, k) {
    if (k === 'back') return a.slice(0, -1);
    if (k === ',') return a.indexOf(',') < 0 && /\d/.test(a) ? a + ',' : a;
    if (/^\d$/.test(k) && a.replace(/[^\d]/g, '').length < 8) return a + k;
    return a;
  }
  function buildKey(k) {
    if (!B || B.stage !== 'play') return;
    var t = B.v.tasks[B.ti];
    if (t.kind === 'slots') { if (slotKey(B, t, k)) { B.msg = ''; renderBuild(); } return; }
    if (B.reveal) return;
    B.input = typeNum(B.input, k);
    var el = document.getElementById('dc-fieldText'), b = document.getElementById('dc-check');
    if (el) el.innerHTML = B.input ? esc(B.input) : '<span class="ph">Введи ответ</span>';
    if (b) b.disabled = !B.input;
  }
  function stepAdvance(text) {
    var t = B.v.tasks[B.ti];
    B.stepLog.push(text);
    B.si++; B.input = ''; B.tries = 0; B.aid = false; B.reveal = false; B.msg = '';
    if (B.si >= t.steps.length) { finishTask(B.cur.solved, B.cur.pts, B.cur.clean); return; }
    renderBuild();
  }
  function buildCheck() {
    if (!B || B.stage !== 'play') return;
    var v = B.v, t = v.tasks[B.ti];
    if (t.kind === 'slots') {
      if (!slotsFull(t, B.slots)) return;
      if (slotAnswer(t, B.slots) === t.answer) {
        var p = B.tries === 0 ? 8 : 4;
        addPoints(p); finishTask(true, p, B.tries === 0); return;
      }
      B.tries++;
      if (B.tries >= 2) { B.cur.clean = false; B.cur.solved = false; finishTask(false, 0, false); return; }
      B.msg = t.wrong || 'Не сходится. Попробуй ещё раз.';
      B.slots = {}; B.active = 0; B.pend = null; O.announce('Неверно'); renderBuild(); return;
    }
    var st = t.steps[B.si], val = L.dachaParse(B.input);
    if (!isFinite(val)) return;
    if (L.dachaNumEq(val, st.ans)) {
      var first = B.tries === 0 && !B.aid, pts = first ? 4 : 2;
      if (!first) B.cur.clean = false;
      addPoints(pts);
      stepAdvance(num(st.ans) + (st.unit ? ' ' + st.unit : ''));
      return;
    }
    B.cur.clean = false;
    B.tries++;
    var trap = L.dachaStepTrap(st, val);
    B.input = '';
    if (B.tries >= 2) { B.reveal = true; B.msg = trap || ''; B.cur.solved = false; }
    else B.msg = (trap || 'Не сходится.') + ' Попробуй ещё раз.';
    O.announce('Неверно');
    renderBuild();
  }
  function buildNext() {
    if (!B || B.stage !== 'result') return;
    if (B.ti + 1 >= 5) { endBuild(); return; }
    B.ti++; resetTask(); renderBuild();
  }
  function endBuild() {
    var d = D(), c = DC(B.v.ctx);
    d.builds++; c.builds++;
    if (B.points > c.best) { c.best = B.points; B.newBest = true; }
    if (B.points > d.bestBuild) d.bestBuild = B.points;
    B.stage = 'end';
    O.saveStats();
    renderBuild();
  }
  function renderBuildEnd() {
    var weak = [];
    B.log.forEach(function (x) { if (!x.clean && weak.indexOf(L.SKILLS15[x.skill]) < 0) weak.push(L.SKILLS15[x.skill]); });
    app.innerHTML =
      '<div class="hero" style="padding-top:20px"><div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">' + esc(B.v.done) + '</h1>' +
      '<div class="hero-sub">' + esc(B.v.name) + ': ' + B.points + ' очков' + (B.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid"><div class="stat"><div class="v">' + B.firstCount + ' из 5</div><div class="k">без подсказок и промахов</div></div>' +
      '<div class="stat"><div class="v">' + DC(B.v.ctx).best + '</div><div class="k">рекорд сюжета</div></div></div>' +
      (weak.length ? '<section class="note note-amber"><div class="note-t">Что повторить</div><div>' + esc(weak.slice(0, 3).join('; ')) + '.</div></section>'
        : '<section class="note note-primary"><div class="note-t">Отличный раунд</div><div>Все задания без подсказок. Попробуй «Спринт» в списке заданий 1–5.</div></section>') +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="start-dc-build" data-ctx="' + B.v.ctx + '" data-primary>Новый вариант</button>' +
      '<button class="btn btn-ghost" data-act="start-dc-sprint">Спринт</button><button class="btn btn-ghost" data-act="home15">В задания 1–5</button></div>';
    O.postRender();
  }

  /* ================== СПРИНТ (задания 1–5): два случайных сюжета, 10 заданий ================== */
  var SPRINT_N = 10;
  function fmtTime(sec) { var m = Math.floor(sec / 60), x = sec % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  function left() { return Math.max(0, LIMIT - Math.floor((Date.now() - E.t0) / 1000)); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function startTimer() {
    stopTimer();
    timer = setInterval(function () {
      if (!E || E.stage !== 'run' || O.screen !== 'dcx') { stopTimer(); return; }
      var l = left(), el = document.getElementById('dc-time');
      if (el) el.textContent = fmtTime(l);
      if (l <= 0) examFinish();
    }, 1000);
    if (timer && timer.unref) timer.unref();
  }
  function startSprint(d) {
    var ids = L.util.shuffle(L.CTX15.map(function (c) { return c.id; }));
    if (d && d.ctx) ids = [d.ctx].concat(ids.filter(function (x) { return x !== d.ctx; }));
    var items = [];
    ids.slice(0, SPRINT_N / 5).forEach(function (id) { var v = L.make15(id); v.tasks.forEach(function (t, ti) { items.push({ v: v, ti: ti }); }); });
    E = { items: items, st: items.map(function () { return { slots: {}, active: 0, pend: null }; }), i: 0, ans: items.map(function () { return ''; }), stage: 'run', res: null, newBest: false, t0: Date.now(), timeout: false };
    B = null;
    O.go('dcx');
    startTimer();
  }
  function eT(i) { var it = E.items[i]; return it.v.tasks[it.ti]; }
  function eAnswered(i) { var t = eT(i); return t.kind === 'slots' ? slotsFull(t, E.st[i].slots) : E.ans[i] !== ''; }
  function eRight(i) {
    var t = eT(i);
    if (t.kind === 'slots') return slotAnswer(t, E.st[i].slots) === t.answer;
    return L.dachaNumEq(L.dachaParse(E.ans[i]), Number(t.answer));
  }
  function renderExam() {
    if (!E || O.screen !== 'dcx') { O.go('home15'); return; }
    if (E.stage === 'review') { renderReview(); return; }
    var n = E.items.length, i = E.i, it = E.items[i], v = it.v, t = eT(i), k, nav = '<div class="dc-nav" role="group" aria-label="Задания">', cnt = 0;
    for (k = 0; k < n; k++) { if (eAnswered(k)) cnt++; nav += '<button data-act="dc-go" data-i="' + k + '" class="' + (k === i ? 'is-cur' : eAnswered(k) ? 'is-done' : '') + '" aria-label="Задание ' + (k + 1) + (eAnswered(k) ? ', есть ответ' : '') + '">' + (k + 1) + '</button>'; }
    nav += '</div>';
    var sl = E.st[i];
    var body = head(v, it.ti, 'Спринт') + figHTML(v, t, null) + conditionHTML(v, it.ti) +
      (t.kind === 'slots' ? slotsHTML(t, sl.slots, sl.active, false) + keypadHTML(t.maxVal || 9) : fieldHTML(E.ans[i]) + keypadHTML() + '<div class="foot"><span class="label">Ответ числом, в тех единицах, о которых спрашивают</span></div>');
    var last = i === n - 1;
    app.innerHTML = topbar('Спринт · задание ' + (i + 1) + ' из ' + n, Math.round(cnt / n * 100), fmtTime(left()), 'dc-time') + nav + body +
      '<div class="actions spacer"><div class="foot"><button class="btn-small" data-act="dc-prev"' + (i === 0 ? ' disabled' : '') + '>← Назад</button>' + (last ? '' : '<button class="btn-small" data-act="dc-fwd">Дальше →</button>') + '</div>' +
      '<button class="btn ' + (last ? 'btn-primary' : 'btn-ghost') + '" data-act="dc-finish">Завершить и проверить</button></div>';
    O.postRender();
  }
  function examKey(k) {
    if (!E || E.stage !== 'run') return;
    var t = eT(E.i);
    if (t.kind === 'slots') { if (slotKey(E.st[E.i], t, k)) renderExam(); return; }
    E.ans[E.i] = typeNum(E.ans[E.i], k);
    var a = E.ans[E.i], el = document.getElementById('dc-fieldText');
    if (el) el.innerHTML = a ? esc(a) : '<span class="ph">Введи ответ</span>';
    var bs = app.querySelectorAll('[data-act="dc-go"]');
    for (var k2 = 0; k2 < bs.length; k2++) { var n = Number(bs[k2].getAttribute('data-i')); bs[k2].className = n === E.i ? 'is-cur' : eAnswered(n) ? 'is-done' : ''; }
  }
  function examFinish(timeout) {
    if (!E || E.stage !== 'run') return;
    stopTimer();
    var ok = 0, d = D();
    E.res = [];
    for (var i = 0; i < E.items.length; i++) { var r = eRight(i); E.res.push(r); if (r) ok++; skill(eT(i).skill, r); }
    d.exams++; d.points += ok * 2;
    if (ok > d.bestExam) { d.bestExam = ok; E.newBest = true; }
    E.score = ok; E.stage = 'review'; E.timeout = timeout === true || left() <= 0;
    O.saveStats();
    renderExam();
  }
  function givenText(i) { var t = eT(i); return t.kind === 'slots' ? (slotsFull(t, E.st[i].slots) ? slotAnswer(t, E.st[i].slots) : '—') : (E.ans[i] === '' ? '—' : E.ans[i]); }
  function renderReview() {
    var n = E.items.length, names = [];
    var rows = E.items.map(function (it, i) {
      var t = eT(i), ok = E.res[i];
      if (names.indexOf(it.v.name) < 0) names.push(it.v.name);
      return '<section class="card" style="display:flex;flex-direction:column;gap:6px"><div class="brow"><span><b>Задание ' + (i + 1) + '.</b> ' + esc(it.v.name) + ' · ' + esc(t.title) + '</span><span class="' + (ok ? 'plus' : 'zero') + '">' + (ok ? 'верно' : 'неверно') + '</span></div>' +
        '<div>Твой ответ: <b>' + esc(givenText(i)) + '</b>' + (ok ? '' : ' · правильный: <b>' + esc(answerText(t)) + '</b>') + '</div>' +
        '<div class="hint">' + esc(t.explain) + '</div></section>';
    }).join('');
    app.innerHTML = '<div class="hero" style="padding-top:20px">' + (E.score >= n - 2 ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div>' : '<div class="badge badge-warn pop">' + ICON.excl + '</div>') +
      '<h1 class="h1">Спринт завершён</h1><div class="hero-sub">' + E.score + ' из ' + n + (E.newBest ? ' · новый рекорд!' : '') + (E.timeout ? ' · время вышло' : '') + '</div><div class="hint">' + esc(names.join(' и ')) + '</div></div>' + rows +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="start-dc-sprint" data-primary>Новый спринт</button><button class="btn btn-ghost" data-act="home15">В задания 1–5</button></div>';
    O.postRender();
  }

  /* ================== ОТЧЁТ ДЛЯ РОДИТЕЛЯ (задания 1–5) ================== */
  O.report15Body = function () {
    var d = D(), st = O.stats, ids = Object.keys(L.SKILLS15), rounds = d.builds + d.exams;
    function pc(s) { return s && s.total ? Math.round(s.ok / s.total * 100) : null; }
    var rows = ids.map(function (id) {
      var s = st.skills[id] || { ok: 0, total: 0 }, p = pc(s), cls = p === null ? '' : p >= 80 ? 'good' : p >= 60 ? 'mid' : 'low';
      return '<div class="skill"><div class="skill-top"><span>' + esc(L.SKILLS15[id]) + '</span><span>' + (p === null ? 'нет данных' : s.ok + ' из ' + s.total) + '</span></div>' +
        '<div class="bar"><div class="bar-fill ' + cls + '" style="width:' + (p || 0) + '%"></div></div></div>';
    }).join('');
    var ctxRows = L.CTX15.map(function (c) { var x = DC(c.id); return '<li><b>' + esc(c.title) + '</b>: ' + (x.builds ? 'пройден ' + x.builds + ' ' + O.times(x.builds) + ', рекорд ' + x.best + ' очков' : 'ещё не пройден') + '</li>'; }).join('');
    var weak = ids.filter(function (id) { var s = st.skills[id]; return s && s.total >= 3 && pc(s) < 70; });
    var untouched = L.CTX15.filter(function (c) { return !DC(c.id).builds; }).map(function (c) { return '«' + c.title + '»'; });
    var recs = [];
    if (!rounds) recs.push('Сыграйте хотя бы один сюжет в заданиях 1–5, и здесь появятся выводы.');
    if (weak.length) recs.push('Стоит потренировать: ' + weak.map(function (k) { return L.SKILLS15[k].toLowerCase(); }).join('; ') + '.');
    if (rounds && untouched.length) recs.push('Ещё не пройдены сюжеты: ' + untouched.join(', ') + '. На экзамене может попасться любой.');
    if (rounds && !weak.length && !untouched.length) recs.push('Слабых мест в заданиях 1–5 пока не видно. Раз в несколько дней играйте сюжет, а перед экзаменом — «Спринт».');
    if (rounds && !d.exams) recs.push('«Спринт» ещё не пробовали: он проверяет, успевает ли ученик решить 10 заданий из двух сюжетов за 30 минут.');
    return '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + d.points + '</div><div class="k">очков в заданиях 1–5</div></div>' +
      '<div class="stat"><div class="v">' + d.builds + '</div><div class="k">сюжетов пройдено</div></div>' +
      '<div class="stat"><div class="v">' + d.exams + '</div><div class="k">спринтов</div></div>' +
      '<div class="stat"><div class="v">' + d.bestExam + ' из 10</div><div class="k">лучший спринт</div></div></div>' +
      '<section class="card"><div class="label">Навыки: ответы с первой попытки</div><div style="margin-top:6px">' + rows + '</div></section>' +
      '<section class="card"><div class="label">Сюжеты</div><ul class="list" style="margin-top:8px">' + ctxRows + '</ul></section>' +
      '<section class="note note-primary"><div class="note-t">Что делать дальше</div><ul class="list">' + recs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>';
  };
  O.stat15 = function () { var d = D(); return { points: d.points, rounds: d.builds + d.exams }; };

  /* ================== РЕГИСТРАЦИЯ ================== */
  O.__dc = { get B() { return B; }, get E() { return E; } };   // для автотестов
  O.screens.home15 = renderHome15; O.screens.dc = renderBuild; O.screens.dcx = renderExam;
  Object.assign(O.ACT, {
    home15: function () { O.go('home15'); },
    'start-dc-build': startBuild, 'start-dc-sprint': startSprint,
    'dc-key': function (d) { if (B && O.screen === 'dc') buildKey(d.k); else examKey(d.k); },
    'dc-check': buildCheck, 'dc-next': buildNext,
    'dc-aid': function () { if (B && B.stage === 'play' && !B.reveal && B.v.tasks[B.ti].kind === 'steps') { B.aid = true; B.cur.clean = false; renderBuild(); } },
    'dc-cont': function () { if (B && B.stage === 'play' && B.reveal) { var st = B.v.tasks[B.ti].steps[B.si]; stepAdvance(num(st.ans) + (st.unit ? ' ' + st.unit : '')); } },
    'dc-box': function (d) {
      var i = Number(d.i);
      if (B && O.screen === 'dc' && B.stage === 'play' && B.v.tasks[B.ti].kind === 'slots') { if (i >= 0 && i < B.v.tasks[B.ti].slots.length) { B.active = i; B.pend = null; renderBuild(); } }
      else if (E && O.screen === 'dcx' && E.stage === 'run' && eT(E.i).kind === 'slots') { if (i >= 0 && i < eT(E.i).slots.length) { E.st[E.i].active = i; E.st[E.i].pend = null; renderExam(); } }
    },
    'dc-go': function (d) { if (E && E.stage === 'run') { var i = Number(d.i); if (i >= 0 && i < E.items.length) { E.i = i; renderExam(); } } },
    'dc-prev': function () { if (E && E.stage === 'run' && E.i > 0) { E.i--; renderExam(); } },
    'dc-fwd': function () { if (E && E.stage === 'run' && E.i < E.items.length - 1) { E.i++; renderExam(); } },
    'dc-finish': function () { examFinish(false); }
  });
  O.keyHandlers.push(function (e, k) {
    var screen = O.screen;
    if ((k === 'ArrowRight' || k === ' ') && ((screen === 'dc' && B && B.stage === 'play' && B.v.tasks[B.ti].kind === 'slots') || (screen === 'dcx' && E && E.stage === 'run' && eT(E.i).kind === 'slots'))) {
      if (screen === 'dc') buildKey('next'); else examKey('next');
      return true;
    }
    if (screen === 'dc' && B && B.stage === 'play' && (B.v.tasks[B.ti].kind === 'slots' || !B.reveal)) {
      if (/^[0-9]$/.test(k)) { buildKey(k); return true; }
      if (k === ',' || k === '.') { buildKey(','); return true; }
      if (k === 'Backspace') { buildKey('back'); return true; }
    }
    if (screen === 'dcx' && E && E.stage === 'run') {
      if (/^[0-9]$/.test(k)) { examKey(k); return true; }
      if (k === ',' || k === '.') { examKey(','); return true; }
      if (k === 'Backspace') { examKey('back'); return true; }
    }
    return false;
  });
})();
