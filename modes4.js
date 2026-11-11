/* Задание 7: экраны «Числовая прямая», «Мастерская сравнений», «Знаки и шкала», «Лупа». */
(function () {
  'use strict';
  var O = window.OGE, L = O.L, app = O.app, esc = O.esc, ICON = O.ICON, U = O.t7ui;
  var m7 = U.m7, T = U.T, topbar7 = U.topbar7;
  var R = null; // текущий раунд (один на все четыре режима)

  var CFG = {
    numline: { key: 'numline7', name: 'Числовая прямая', screen: 'nl7', start: 'start-nl7', make: function (g, r) { return L.makeNumline7Round(g, r, 5); } },
    ws: { key: 'ws7', name: 'Мастерская сравнений', screen: 'ws7', start: 'start-ws7', make: function (g, r) { return L.makeWs7Round(g, r, 5); } },
    signs: { key: 'signs7', name: 'Знаки и шкала', screen: 'sg7', start: 'start-sg7', make: function (g, r) { return L.makeSigns7Round(g, r, 5); } },
    loupe: { key: 'loupe7', name: 'Лупа', screen: 'lp7', start: 'start-lp7', make: function (g, r) { return L.makeLoupe7Round(g, r, 5); } }
  };
  function cur() { return R.tasks[R.i]; }
  function dstr(m, k) {
    if (!k) return String(m);
    var p = Math.pow(10, k), r = String(m % p);
    while (r.length < k) r = '0' + r;
    return Math.floor(m / p) + ',' + r;
  }

  /* ---------- общий каркас ---------- */
  function start(mode) {
    R = { mode: mode, tasks: CFG[mode].make(O.stats.grade, T().roots), i: 0, points: 0, firstCount: 0, log: [], newBest: false };
    resetTask();
    O.go(CFG[mode].screen);
  }
  function resetTask() {
    R.stage = 'play'; R.tries = 0; R.wrong = []; R.msg = ''; R.hint = false; R.conv = false; R.x = null; R.seq = [];
    R.res = null; R.s = 0; R.stepRes = []; R.sel = null;
    var t = R.tasks[R.i];
    R.steps = t && t.steps ? t.steps.map(function () { return { tries: 0, aid: false, wrong: [] }; }) : [];
  }
  function render() {
    if (!R || CFG[R.mode].screen !== O.screen) { U.home(); return; }
    if (R.stage === 'end') { renderEnd(); return; }
    var t = cur(), n = R.tasks.length, done = R.stage === 'result' ? R.i + 1 : R.i, body;
    if (R.stage === 'result') body = resultView(t);
    else body = ({ numline: nlPlay, ws: wsPlay, signs: sgPlay, loupe: lpPlay })[R.mode](t);
    app.innerHTML = topbar7('Задание ' + (R.i + 1) + ' из ' + n, Math.round(done / n * 100), R.points) + body;
    O.postRender();
  }
  function taskCard(kicker, exprHtml, meta) {
    return '<section class="card task task-compact"><div class="kicker">' + esc(kicker) + '</div>' +
      '<div class="expr">' + exprHtml + '</div>' + (meta ? '<div class="meta">' + esc(meta) + '</div>' : '') + '</section>';
  }
  function head(t) {
    return '<div class="head"><div class="pill pill-primary">' + CFG[R.mode].name + '</div><h1 class="h1">' + esc(t.title) + '</h1></div>';
  }
  function optBtn(act, i, label, wrong, html) {
    return '<button class="opt' + (wrong ? ' is-wrong' : '') + '" data-act="' + act + '" data-i="' + i + '"' + (wrong ? ' disabled' : '') +
      '><span class="opt-letter">' + (i + 1) + '</span><span>' + (html ? m7(label) : esc(label)) + '</span></button>';
  }
  function msgBox() { return R.msg ? '<div class="banner banner-warn" id="msg">' + esc(R.msg) + '</div>' : ''; }

  /* Прямая: o = {lo, hi, points:[{x,label,fill,ink}], id, ticksFn, tap} */
  var X0 = 28, X1 = 292;
  function lineSVG(o) {
    var span = o.hi - o.lo;
    function X(x) { return X0 + (x - o.lo) / span * (X1 - X0); }
    var g = '<line x1="14" y1="64" x2="306" y2="64" stroke="#B9B0A0" stroke-width="3" stroke-linecap="round"/>';
    (o.ticks || []).forEach(function (tk) {
      var big = tk.big !== false;
      g += '<line x1="' + X(tk.x) + '" y1="' + (big ? 54 : 58) + '" x2="' + X(tk.x) + '" y2="' + (big ? 74 : 70) + '" stroke="#B9B0A0" stroke-width="' + (big ? 3 : 2) + '"/>';
      if (tk.label !== undefined && tk.label !== '') {
        g += '<text x="' + X(tk.x) + '" y="98" text-anchor="middle" fill="#5A5F7A" font-size="' + (tk.fs || 15) + '" font-weight="700">' + esc(tk.label) + '</text>';
      }
    });
    (o.points || []).forEach(function (p) {
      g += '<circle cx="' + X(p.x) + '" cy="64" r="8" fill="' + (p.fill || '#E8812A') + '"/>' +
        (p.label ? '<text x="' + X(p.x) + '" y="42" text-anchor="middle" fill="' + (p.ink || '#A8500A') + '" font-size="17" font-weight="800">' + esc(p.label) + '</text>' : '');
    });
    return '<svg ' + (o.id ? 'id="' + o.id + '" ' : '') + 'viewBox="0 0 320 108" role="img" aria-label="' + esc(o.aria || 'Числовая прямая') + '"' +
      (o.tap ? ' style="touch-action:manipulation;cursor:pointer"' : '') + '>' + g + '</svg>';
  }
  function intTicks(lo, hi) {
    var a = [];
    for (var k = lo; k <= hi; k++) a.push({ x: k, label: L.fmt(k) });
    return a;
  }
  function lineCard(o) { return '<div class="card nline" style="cursor:default" id="' + (o.id || 'ln7') + '-card">' + lineSVG(o) + '</div>'; }

  /* ---------- завершение задания и раунда ---------- */
  function attempt(ok, msg) {
    R.tries++;
    if (ok) { finishTask(true); return; }
    if (R.tries >= 2) { finishTask(false); return; }
    R.msg = msg; R.wrong.length; render();
  }
  function finishTask(solved) {
    var t = cur(), st = O.stats, first = solved && R.tries === 1, pts = 0;
    if (R.mode === 'numline') pts = L.recordNumline7(st, t, { ok: first, solved: solved });
    else if (R.mode === 'ws') pts = L.recordWs7(st, t, { firstOk: first, usedConv: R.conv && first, solved: solved });
    else if (R.mode === 'signs') pts = L.recordSigns7(st, t, { ok: first, hint: R.hint, solved: solved });
    else {
      pts = L.recordLoupe7(st, t, { steps: R.stepRes });
      first = R.stepRes.every(function (s) { return s.firstOk; });
    }
    R.points += pts; if (first) R.firstCount++;
    R.log.push({ skill: t.skill, first: first });
    R.res = { ok: first, solved: solved, pts: pts };
    R.stage = 'result';
    O.saveStats();
    O.announce(first ? 'Верно' : solved ? 'Верно со второй попытки' : 'Не получилось');
    render();
  }
  function next() {
    if (!R || R.stage !== 'result') return;
    if (R.i + 1 >= R.tasks.length) {
      var st = O.stats, key = CFG[R.mode].key; T();
      var prev = st.best[key];
      st.rounds[key]++;
      if (R.points > prev) { st.best[key] = R.points; R.newBest = prev > 0; }
      O.saveStats();
      R.stage = 'end';
    } else { R.i++; resetTask(); }
    render();
  }
  function renderEnd() {
    var n = R.tasks.length, key = CFG[R.mode].key, weak = {};
    R.log.forEach(function (x) { if (!x.first) weak[x.skill] = (weak[x.skill] || 0) + 1; });
    var weakList = Object.keys(weak).sort(function (a, b) { return weak[b] - weak[a]; }).slice(0, 2).map(function (k) { return L.SKILLS7[k]; });
    var others = Object.keys(CFG).filter(function (k) { return k !== R.mode; }).map(function (k) {
      return '<button class="btn btn-ghost" data-act="' + CFG[k].start + '">' + CFG[k].name + '</button>';
    }).slice(0, 2).join('');
    app.innerHTML =
      '<div class="hero" style="padding-top:20px"><div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Раунд завершён</h1>' +
      '<div class="hero-sub">' + R.points + ' очков' + (R.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + R.firstCount + ' из ' + n + '</div><div class="k">с первой попытки</div></div>' +
      '<div class="stat"><div class="v">' + O.stats.best[key] + '</div><div class="k">лучший счёт</div></div></div>' +
      (weakList.length ? '<section class="note note-amber"><div class="note-t">Что повторить</div><div>' + esc(weakList.join('; ')) + '.</div></section>'
        : '<section class="note note-primary"><div class="note-t">Отличный раунд</div><div>Все задания с первой попытки. Попробуй другой режим или сыграй ещё раз.</div></section>') +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="' + CFG[R.mode].start + '" data-primary>Сыграть ещё</button>' +
      others + '<button class="btn btn-ghost" data-act="home7">В задание 7</button></div>';
    O.postRender();
  }
  function ptsRows(extra) {
    var r = R.res, rows = [{ label: r.ok ? 'Верно с первой попытки' : r.solved ? 'Верно со второй попытки' : 'Без верного ответа', pts: r.pts }];
    return rows.concat(extra || []);
  }
  function heroBlock(sub) {
    var r = R.res;
    return '<div class="hero">' + (r.solved
      ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Верно!</h1>'
      : '<div class="badge badge-warn pop">' + ICON.excl + '</div><h1 class="h1">Не получилось</h1>') +
      '<div class="hero-sub">' + sub + '</div></div>';
  }
  function nextBtn() {
    var last = R.i + 1 >= R.tasks.length;
    return '<button class="btn btn-primary spacer" data-act="mode-next7" data-primary>' + (last ? 'Показать итог' : 'Следующее задание') + '</button>';
  }
  function resultView(t) {
    var r = R.res, body;
    if (R.mode === 'numline') body = nlResult(t);
    else if (R.mode === 'ws') body = wsResult(t);
    else if (R.mode === 'signs') body = sgResult(t);
    else body = lpResult(t);
    return body.hero + (body.card || '') + O.breakdown([{ label: r.ok ? 'Верно с первой попытки' : r.solved ? 'Верно со второй попытки' : 'Правильный ответ показан', pts: r.pts }], r.pts) +
      '<section class="note note-primary"><div class="note-t">Как найти</div><div>' + body.explain + '</div></section>' + nextBtn();
  }

  /* ================== ЧИСЛОВАЯ ПРЯМАЯ ================== */
  function rnd(x, d) { var p = Math.pow(10, d); return Math.round(x * p) / p; }
  function placeCfg(t, showAnswer) {
    var pts = [];
    if (showAnswer) {
      pts.push({ x: t.value, fill: '#2FB383' });
      if (R.x !== null) pts.push({ x: R.x, fill: R.res && R.res.solved ? '#2FB383' : '#E5484D' });
    } else if (R.x !== null) pts.push({ x: R.x, fill: '#E8812A' });
    return { id: showAnswer ? 'nl7r' : 'nl7', lo: t.line.lo, hi: t.line.hi, ticks: intTicks(t.line.lo, t.line.hi), points: pts, tap: !showAnswer,
      aria: 'Числовая прямая от ' + L.fmt(t.line.lo) + ' до ' + L.fmt(t.line.hi) + '. Нажми, чтобы поставить точку.' };
  }
  function readText() { return R.x === null ? 'Нажми на прямую, чтобы поставить точку' : 'Точка стоит около ' + L.fmt(rnd(R.x, 1)); }
  function placeUpdate() {
    var t = cur(), c = document.getElementById('nl7-card'), r = document.getElementById('nl7-read'), b = document.getElementById('nl7-check');
    if (c) c.innerHTML = lineSVG(placeCfg(t, false));
    if (r) r.textContent = readText();
    if (b) b.disabled = R.x === null;
  }
  function nlPlay(t) {
    var h = head(t);
    if (t.kind === 'place') {
      return h + taskCard('Отметь на прямой число', m7(t.number.label)) + lineCard(placeCfg(t, false)) +
        '<div class="foot"><span class="label" id="nl7-read">' + readText() + '</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>' +
        '<div class="links"><button class="btn-small" data-act="nl-nudge" data-d="-1" aria-label="Сдвинуть влево на 0,1">← 0,1</button>' +
        '<button class="btn-small" data-act="nl-nudge" data-d="1" aria-label="Сдвинуть вправо на 0,1">0,1 →</button></div>' +
        msgBox() +
        '<button class="btn btn-primary spacer" id="nl7-check" data-act="nl-check7" data-primary' + (R.x === null ? ' disabled' : '') + '>Проверить</button>';
    }
    if (t.kind === 'match') {
      var opts = t.line.points.map(function (p, i) { return optBtn('nl-pick', i, 'Точка ' + p.letter, R.wrong.indexOf(i) >= 0); }).join('');
      return h + taskCard('Какая точка соответствует числу', m7(t.number.label)) +
        lineCard({ id: 'nl7m', lo: t.line.lo, hi: t.line.hi, ticks: intTicks(t.line.lo, t.line.hi),
          points: t.line.points.map(function (p) { return { x: p.x, label: p.letter }; }), aria: 'Числовая прямая с точками A, B, C, D' }) +
        '<div class="opts" role="group" aria-label="Варианты ответа"><div class="foot"><span class="label">Выбери точку</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>' + opts + '</div>' + msgBox();
    }
    var chosen = R.seq.map(function (i) { return m7(t.items[i].label); });
    var items = t.items.map(function (it, i) {
      var used = R.seq.indexOf(i) >= 0;
      return '<button class="opt' + (used ? ' is-dim' : '') + '" data-act="nl-ord" data-i="' + i + '"' + (used ? ' disabled' : '') +
        '><span class="opt-letter">' + (i + 1) + '</span><span>' + m7(it.label) + '</span></button>';
    }).join('');
    return h + taskCard('Нажимай числа от меньшего к большему', chosen.length ? chosen.join(' &lt; ') : '<span class="eq">?</span>') +
      '<div class="opts" role="group" aria-label="Числа"><div class="foot"><span class="label">Выбрано ' + R.seq.length + ' из ' + t.items.length + '</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>' + items + '</div>' + msgBox() +
      '<div class="foot spacer"><button class="btn-small" data-act="nl-reset"' + (R.seq.length ? '' : ' disabled') + '>Начать заново</button><div class="foot-note">Верно с первой попытки<br>+10 очков</div></div>';
  }
  function nlResult(t) {
    if (t.kind === 'place') {
      return { hero: heroBlock(m7(t.number.label) + ' ≈ ' + esc(L.fmt(rnd(t.value, 2)))), card: lineCard(placeCfg(t, true)), explain: m7(t.explain) };
    }
    if (t.kind === 'match') {
      var pts = t.line.points.map(function (p) {
        var bad = R.wrong.indexOf(t.line.points.indexOf(p)) >= 0;
        return { x: p.x, label: p.letter, fill: p.ok ? '#2FB383' : bad ? '#E5484D' : '#C9BFAE', ink: p.ok ? '#0F6B4E' : bad ? '#A8232C' : '#7A7466' };
      });
      return { hero: heroBlock(m7(t.number.label) + ' — точка ' + t.correctLetter), card: lineCard({ id: 'nl7r', lo: t.line.lo, hi: t.line.hi, ticks: intTicks(t.line.lo, t.line.hi), points: pts }), explain: m7(t.explain) };
    }
    return { hero: heroBlock(t.sorted.map(m7).join(' &lt; ')), card: '', explain: m7(t.explain) };
  }
  function placeTap(e) {
    if (!R || R.mode !== 'numline' || R.stage !== 'play') return;
    var svg = e.target.closest && e.target.closest('#nl7');
    var t = cur();
    if (!svg || t.kind !== 'place') return;
    var rect = svg.getBoundingClientRect(), vx = (e.clientX - rect.left) / rect.width * 320;
    var x = t.line.lo + (vx - X0) / (X1 - X0) * (t.line.hi - t.line.lo);
    R.x = Math.max(t.line.lo, Math.min(t.line.hi, rnd(x * 20, 0) / 20));
    placeUpdate();
  }
  app.addEventListener('click', placeTap);
  function nlNudge(d) {
    var t = cur();
    if (!R || R.mode !== 'numline' || R.stage !== 'play' || t.kind !== 'place') return;
    if (R.x === null) R.x = (t.line.lo + t.line.hi) / 2;
    R.x = Math.max(t.line.lo, Math.min(t.line.hi, rnd(R.x + d * 0.1, 2)));
    placeUpdate();
  }
  function nlCheck() {
    var t = cur();
    if (!R || R.x === null || t.kind !== 'place' || R.stage !== 'play') return;
    var c = L.checkPlace7(t, R.x);
    var msg = c.ok ? '' : c.intervalOk ? 'Ты в нужном промежутке между целыми числами, но точка стоит не там: сдвинь её ' + (R.x < t.value ? 'правее' : 'левее') + '.'
      : 'Точка в другом промежутке. Сначала найди, между какими целыми числами лежит число ' + L.fmt(Math.floor(t.value)) + ' и ' + L.fmt(Math.floor(t.value) + 1) + '.';
    attempt(c.ok, msg);
  }
  function nlPick(i) {
    var t = cur();
    if (!R || R.stage !== 'play' || t.kind !== 'match' || R.wrong.indexOf(i) >= 0 || !t.line.points[i]) return;
    var ok = t.line.points[i].ok;
    if (!ok) R.wrong.push(i);
    attempt(ok, 'Не та точка. Определи, между какими целыми числами лежит число, и посмотри, какая точка там стоит.');
  }
  function nlOrd(i) {
    var t = cur();
    if (!R || R.stage !== 'play' || t.kind !== 'order' || R.seq.indexOf(i) >= 0 || !t.items[i]) return;
    R.seq.push(i);
    if (R.seq.length < t.items.length) { render(); return; }
    var ok = L.checkOrder7(t, R.seq.map(function (k) { return t.items[k].label; }));
    var bad = R.seq.slice();
    R.seq = [];
    attempt(ok, 'Порядок не сходится. Сначала найди наименьшее число: оцени каждое, между какими целыми оно лежит.');
    if (!ok && R.stage === 'play') { R.seq = []; render(); }
  }

  /* ================== МАСТЕРСКАЯ СРАВНЕНИЙ ================== */
  var CONV_NAME = { ws_dec: 'Уравняли число знаков после запятой', ws_den: 'Привели дроби к общему знаменателю', ws_sq: 'Возвели оба числа в квадрат', ws_sq2: 'Внесли множитель под корень и сравнили подкоренные числа' };
  function wsPlay(t) {
    var bench = R.conv
      ? '<section class="note note-primary"><div class="note-t">Мастерская: ' + esc(CONV_NAME[t.family]) + '</div><div class="expr">' + m7(t.conv.a) + '<span class="eq">?</span>' + m7(t.conv.b) + '</div></section>'
      : '';
    return head(t) +
      '<section class="card task"><div class="kicker">Поставь знак сравнения</div><div class="expr">' + m7(t.a.label) + '<span class="eq">?</span>' + m7(t.b.label) + '</div></section>' +
      '<div class="opts" role="group" aria-label="Знак"><div class="foot"><span class="label">Первое число…</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>' +
      '<button class="opt' + (R.wrong.indexOf('<') >= 0 ? ' is-wrong' : '') + '" data-act="ws-pick" data-s="&lt;"' + (R.wrong.indexOf('<') >= 0 ? ' disabled' : '') + '><span class="opt-letter">1</span><span>меньше (&lt;)</span></button>' +
      '<button class="opt' + (R.wrong.indexOf('>') >= 0 ? ' is-wrong' : '') + '" data-act="ws-pick" data-s="&gt;"' + (R.wrong.indexOf('>') >= 0 ? ' disabled' : '') + '><span class="opt-letter">2</span><span>больше (&gt;)</span></button></div>' +
      bench + msgBox() +
      '<div class="foot spacer"><button class="btn-small" data-act="ws-conv"' + (R.conv ? ' disabled' : '') + '>' + ICON.bulb + ' Мастерская</button><div class="foot-note">Без мастерской<br>+10 очков</div></div>';
  }
  function wsPick(s) {
    var t = cur();
    if (!R || R.stage !== 'play' || R.mode !== 'ws' || R.wrong.indexOf(s) >= 0) return;
    var ok = s === t.answer;
    if (!ok) { R.wrong.push(s); R.conv = true; }
    attempt(ok, 'Не совсем. В мастерской числа приведены к одному виду: сравни их ещё раз.');
  }
  function wsResult(t) {
    return { hero: heroBlock(m7(t.a.label) + ' ' + esc(t.answer) + ' ' + m7(t.b.label)), card: '', explain: m7(t.explain) };
  }

  /* ================== ЗНАКИ И ШКАЛА ================== */
  function scaleCfg(t, answer) {
    var l = t.line, ticks = [], i;
    for (i = 0; i <= l.T; i++) {
      var lab = i === 0 ? L.fmt(l.A) : i === l.ib ? L.fmt(l.B) : '';
      ticks.push({ x: l.A + i * l.price, label: lab, big: lab !== '' });
    }
    return { id: 'sg7', lo: l.A, hi: l.A + l.T * l.price, ticks: ticks, points: [{ x: l.A + l.j * l.price, label: 'M', fill: answer ? '#2FB383' : '#E8812A', ink: answer ? '#0F6B4E' : '#A8500A' }],
      aria: 'Шкала: отмечены ' + L.fmt(l.A) + ' и ' + L.fmt(l.B) + ', между ними ' + l.n + ' равных делений. Точка M.' };
  }
  function xyCfg(t) {
    return { id: 'sg7', lo: -6, hi: 6, ticks: intTicks(-6, 6), aria: 'Числовая прямая с точками a и b',
      points: [{ x: t.line.points[0].x, label: 'a', fill: '#E8812A', ink: '#A8500A' }, { x: t.line.points[1].x, label: 'b', fill: '#4A6CF7', ink: '#2A47C2' }] };
  }
  function sgPlay(t) {
    var card = t.kind === 'scale' ? lineCard(scaleCfg(t, false)) : lineCard(xyCfg(t));
    var q = t.kind === 'scale' ? taskCard('Чему равна координата точки M?', '<span class="eq">M = ?</span>') : taskCard('Какое утверждение верно?', '<span class="eq">a и b на прямой</span>');
    var opts = t.opts.map(function (o, i) { return optBtn('sg-pick', i, o.label, R.wrong.indexOf(i) >= 0); }).join('');
    return head(t) + q + card +
      '<div class="opts" role="group" aria-label="Варианты ответа"><div class="foot"><span class="label">Выбери ответ</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>' + opts + '</div>' +
      msgBox() + (R.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + esc(t.hint) + '</div>' : '') +
      '<div class="foot spacer"><button class="btn-small" data-act="sg-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Без подсказки<br>+10 очков</div></div>';
  }
  function sgPick(i) {
    var t = cur();
    if (!R || R.stage !== 'play' || R.mode !== 'signs' || R.wrong.indexOf(i) >= 0 || !t.opts[i]) return;
    var ok = t.opts[i].ok;
    if (!ok) R.wrong.push(i);
    attempt(ok, t.kind === 'scale' ? 'Не то. Найди цену одного деления и умножь её на число делений от левой отметки.' : 'Не то. Определи знаки a и b и какое из чисел дальше от нуля.');
  }
  function sgResult(t) {
    var good = t.opts.filter(function (o) { return o.ok; })[0].label;
    return { hero: heroBlock(t.kind === 'scale' ? 'M = ' + esc(good) : esc(good)), card: lineCard(t.kind === 'scale' ? scaleCfg(t, true) : xyCfg(t)), explain: m7(t.explain) };
  }

  /* ================== ЛУПА ================== */
  function lpGood(s) { return s.opts.filter(function (o) { return o.ok; })[0].label; }
  function lpCfg(t) {
    var s = t.steps[R.s], lv = s.level, lo, w, ticks = [], k;
    if (lv === 0) { lo = 0; w = 10; } else {
      lo = Number(lpGood(t.steps[R.s - 1]).split(' и ')[0].replace(',', '.')); w = 1 / Math.pow(10, lv - 1);
    }
    for (k = 0; k <= 10; k++) {
      var x = lo + k * w / 10;
      ticks.push({ x: x, label: (lv === 0 || k % 2 === 0) ? L.fmt(rnd(x, lv + 1)) : '', fs: lv === 0 ? 13 : 12, big: lv === 0 || k % 2 === 0 });
    }
    return { id: 'lp7', lo: lo, hi: lo + w, ticks: ticks, aria: 'Шкала лупы от ' + L.fmt(lo) + ' до ' + L.fmt(rnd(lo + w, lv)) };
  }
  function lpPlay(t) {
    var s = t.steps[R.s], rs = R.steps[R.s], n = t.steps.length, done = '';
    for (var k = 0; k < R.s; k++) done += '<div class="chip chip-ok" style="align-self:flex-start">' + ICON.check(18) + ' между ' + esc(lpGood(t.steps[k])) + '</div>';
    var opts = s.opts.map(function (o, i) { return optBtn('lp-pick', i, 'между ' + o.label, rs.wrong.indexOf(i) >= 0); }).join('');
    return head(t) + taskCard('Шаг ' + (R.s + 1) + ' из ' + n + ': ' + s.title, m7(t.number.label)) + done + lineCard(lpCfg(t)) +
      '<div class="opts" role="group" aria-label="Варианты ответа"><div class="foot"><span class="label">Где находится число?</span><span class="label">Попытка ' + (rs.tries + 1) + ' из 2</span></div>' + opts + '</div>' +
      msgBox() + (rs.aid ? '<div class="banner banner-info"><b>Подсказка.</b> ' + m7(s.aid) + '</div>' : '') +
      '<div class="foot spacer"><button class="btn-small" data-act="lp-aid"' + (rs.aid ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Шаг без подсказки<br>+4 очка</div></div>';
  }
  function lpPick(i) {
    var t = cur();
    if (!R || R.stage !== 'play' || R.mode !== 'loupe') return;
    var s = t.steps[R.s], rs = R.steps[R.s];
    if (!s.opts[i] || rs.wrong.indexOf(i) >= 0) return;
    if (s.opts[i].ok) { R.stepRes.push({ firstOk: rs.tries === 0, aid: rs.aid, solved: true }); lpAdvance(t); return; }
    rs.tries++; rs.wrong.push(i);
    if (rs.tries >= 2) { R.stepRes.push({ firstOk: false, aid: rs.aid, solved: false }); lpAdvance(t); return; }
    R.msg = 'Не то. Нажми «Подсказка», чтобы проверить границы.';
    O.announce('Неверно'); render();
  }
  function lpAdvance(t) {
    R.s++; R.msg = '';
    if (R.s >= t.steps.length) finishTask(R.stepRes.every(function (r) { return r.solved; }));
    else render();
  }
  function lpResult(t) {
    var last = lpGood(t.steps[t.steps.length - 1]);
    return { hero: heroBlock(m7(t.number.label) + ' лежит между ' + esc(last)), card: '',
      explain: t.steps.map(function (s) { return m7(s.explain); }).join('<br>') };
  }

  /* ================== РЕГИСТРАЦИЯ ================== */
  O.screens.nl7 = render; O.screens.ws7 = render; O.screens.sg7 = render; O.screens.lp7 = render;
  Object.assign(O.ACT, {
    'start-nl7': function () { start('numline'); }, 'start-ws7': function () { start('ws'); },
    'start-sg7': function () { start('signs'); }, 'start-lp7': function () { start('loupe'); },
    'mode-next7': next,
    'nl-nudge': function (d) { nlNudge(Number(d.d)); }, 'nl-check7': nlCheck,
    'nl-pick': function (d) { nlPick(Number(d.i)); }, 'nl-ord': function (d) { nlOrd(Number(d.i)); },
    'nl-reset': function () { if (R && R.stage === 'play') { R.seq = []; R.msg = ''; render(); } },
    'ws-pick': function (d) { wsPick(d.s); }, 'ws-conv': function () { if (R && R.stage === 'play') { R.conv = true; render(); } },
    'sg-pick': function (d) { sgPick(Number(d.i)); }, 'sg-hint': function () { if (R && R.stage === 'play') { R.hint = true; render(); } },
    'lp-pick': function (d) { lpPick(Number(d.i)); },
    'lp-aid': function () { if (R && R.stage === 'play' && R.mode === 'loupe') { R.steps[R.s].aid = true; render(); } }
  });
  O.keyHandlers.push(function (e, k) {
    if (!R || R.stage !== 'play' || CFG[R.mode].screen !== O.screen) return false;
    var t = cur(), n = /^[1-4]$/.test(k) ? Number(k) - 1 : -1;
    if (R.mode === 'numline') {
      if (t.kind === 'place' && (k === 'ArrowLeft' || k === 'ArrowRight')) { nlNudge(k === 'ArrowLeft' ? -1 : 1); return true; }
      if (t.kind === 'match' && n >= 0) { nlPick(n); return true; }
      if (t.kind === 'order' && n >= 0) { nlOrd(n); return true; }
    } else if (R.mode === 'ws' && (k === '1' || k === '2')) { wsPick(k === '1' ? '<' : '>'); return true; }
    else if (R.mode === 'signs' && n >= 0) { sgPick(n); return true; }
    else if (R.mode === 'loupe' && n >= 0) { lpPick(n); return true; }
    return false;
  });
  U.lineSVG = lineSVG; U.intTicks = intTicks;
})();
