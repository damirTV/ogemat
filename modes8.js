/* Задания 9, 11, 12 (7 класс): «Тренировка» по шагам, «Сапёр ошибок» (задание 9) и «Спринт» на время, отчёт для родителя.
   Логика задач — в logic10.js. Формулы рисует mathX: {a|b} — дробь, ^2 — степень, ‹C› — нижний индекс. */
(function () {
  'use strict';
  var O = window.OGE, L = O.L, app = O.app, esc = O.esc, ICON = O.ICON;
  var MINUS = '−';
  var Q = {
    9: { title: 'Задание 9', sub: 'Линейные уравнения', skills: L.SKILLS9, make: L.make9, saper: L.make9saper, n: 8, min: 12,
      lead: 'Решаем линейные уравнения: раскрываем скобки, переносим слагаемые и делим на коэффициент при x. Ответ — число, может быть отрицательным или дробным.',
      train: 'Каждое уравнение решается по шагам: свободный член после раскрытия скобок, коэффициент при x, число справа и корень. На ошибку игра объясняет, где обычно путаются.' },
    11: { title: 'Задание 11', sub: 'График функции', skills: L.SKILLS11, make: L.make11, saper: L.make11saper,
      saperD: 'Готовое описание графика по пунктам, в одном пункте ошибка: перепутано направление ветвей, точка на оси y, значение в точке или четверти. Найди неверную строку.', n: 8, min: 12,
      lead: 'Сопоставляем формулы и графики: прямые, параболы и гиперболы. Ответ — три цифры подряд, как в бланке ОГЭ.',
      train: 'Для каждой буквы выбираешь номер по признакам: куда идут ветви, где график пересекает ось y, в каких четвертях лежит гипербола.' },
    12: { title: 'Задание 12', sub: 'Расчёты по формулам', skills: L.SKILLS12, make: L.make12, saper: null, n: 8, min: 12,
      lead: 'Подставляем числа в формулы из физики и геометрии и находим неизвестную величину. Ответ — число.',
      train: 'Каждая задача разбита на шаги: сначала степень, скобка или произведение, потом сама величина. Подсказка покажет порядок действий.' }
  };
  var T = 9, R = null, S = null, X = null, timer = null;

  function st(t) {
    var s = O.stats, q = s.q || (s.q = {});
    return q[t] || (q[t] = { points: 0, rounds: 0, best: 0, sprints: 0, bestSprint: 0, sapers: 0, bestSaper: 0 });
  }
  function skill(id, ok) { var k = O.stats.skills[id] || (O.stats.skills[id] = { ok: 0, total: 0 }); k.total++; if (ok) k.ok++; }
  function num(n) { return L.fmt(n); }
  /* формула → HTML */
  function mathX(s) {
    return O.math(String(s)).replace(/\^(\d)/g, '<sup>$1</sup>').replace(/‹([^›]*)›/g, '<sub>$1</sub>');
  }
  O.mathX = mathX;

  /* ---------- графики для задания 11 ---------- */
  function graphSVG(g, label, hl, over, cap) {
    var N = 5, cs = 14, size = (2 * N + 1) * cs, o = N * cs + cs / 2, out = '', i;
    function px(x) { return o + x * cs; } function py(y) { return o - y * cs; }
    out += '<rect x="0" y="0" width="' + size + '" height="' + size + '" fill="#fff"/>';
    for (i = -N; i <= N; i++) out += '<line x1="' + px(i) + '" y1="0" x2="' + px(i) + '" y2="' + size + '" stroke="#E2DED3" stroke-width="1"/><line x1="0" y1="' + py(i) + '" x2="' + size + '" y2="' + py(i) + '" stroke="#E2DED3" stroke-width="1"/>';
    out += '<line x1="0" y1="' + o + '" x2="' + size + '" y2="' + o + '" stroke="#1F2340" stroke-width="1.6"/><line x1="' + o + '" y1="' + size + '" x2="' + o + '" y2="0" stroke="#1F2340" stroke-width="1.6"/>';
    out += '<path d="M' + (size - 7) + ' ' + (o - 4) + 'L' + size + ' ' + o + 'L' + (size - 7) + ' ' + (o + 4) + 'M' + (o - 4) + ' 7L' + o + ' 0L' + (o + 4) + ' 7" fill="none" stroke="#1F2340" stroke-width="1.6"/>';
    out += '<text x="' + (size - 6) + '" y="' + (o + 14) + '" font-size="12" font-style="italic" text-anchor="end" fill="#1F2340">x</text><text x="' + (o + 6) + '" y="12" font-size="12" font-style="italic" fill="#1F2340">y</text>' +
      '<text x="' + (o - 4) + '" y="' + (o + 12) + '" font-size="11" text-anchor="end" fill="#1F2340">O</text><text x="' + px(1) + '" y="' + (o + 12) + '" font-size="11" text-anchor="middle" fill="#1F2340">1</text><text x="' + (o - 4) + '" y="' + (py(1) + 4) + '" font-size="11" text-anchor="end" fill="#1F2340">1</text>';
    var lim = N + 0.5;
    function pathOf(gr) {
      var d = '', pen = false;
      for (var x = -lim; x <= lim + 1e-9; x += 0.02) {
        var y = L.evalG11(gr, x);
        if (!isFinite(y) || Math.abs(y) > lim || (gr.type === 'hyp' && Math.abs(x) < 0.03)) { pen = false; continue; }
        d += (pen ? 'L' : 'M') + px(x).toFixed(1) + ' ' + py(y).toFixed(1);
        pen = true;
      }
      return d;
    }
    out += '<path d="' + pathOf(g) + '" fill="none" stroke="#E8812A" stroke-width="2.6" stroke-linejoin="round"/>';
    if (over) out += '<path d="' + pathOf(over) + '" fill="none" stroke="#3B5BDB" stroke-width="2.6" stroke-dasharray="6 4" stroke-linejoin="round"/>';
    return '<figure class="q-graph' + (hl ? ' is-hl' : '') + '">' + (cap === false ? '' : '<figcaption>' + esc(label) + ')</figcaption>') + '<svg viewBox="0 0 ' + size + ' ' + size + '" role="img" aria-label="График ' + esc(label) + '" xmlns="http://www.w3.org/2000/svg">' + out + '</svg></figure>';
  }
  /* условие задачи */
  function problemHTML(p, step) {
    if (p.kind === 'eq') return '<section class="card task task-compact"><div class="kicker">' + esc(p.ask) + '</div><div class="q-eq">' + mathX(p.text) + '</div></section>';
    if (p.kind === 'formula') return '<section class="card dc-text q-text"><p>' + mathX(p.text) + '</p></section>';
    var hl = step && step.hl >= 0 ? step.hl : -1;
    var opts = '<div class="q-opts">' + p.opts.map(function (o, i) { return '<div class="q-opt"><b>' + esc(p.oLabels[i]) + ')</b> <span>' + mathX(o) + '</span></div>'; }).join('') + '</div>';
    var graphs = '<div class="q-graphs">' + p.graphs.map(function (g, i) { return graphSVG(g, p.gLabels[i], i === hl); }).join('') + '</div>';
    var first = p.mode === 'f2g' ? opts + graphs : graphs + opts;
    return '<section class="card dc-text q-text"><p>' + mathX(p.text) + '</p>' + first + '<p class="hint">Ответ: цифры для букв А, Б, В подряд.</p></section>';
  }
  function topbar(label, pct, chip, chipId) {
    return '<div class="topbar"><button class="close" data-act="q-home" aria-label="Выйти">' + ICON.close + '</button>' +
      '<div class="progress"><div class="progress-label">' + esc(label) + '</div><div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + pct + '"><div class="bar-fill" style="width:' + pct + '%"></div></div></div>' +
      '<div class="chip chip-pts"' + (chipId ? ' id="' + chipId + '" role="timer" aria-label="Осталось времени"' : '') + '>' + esc(chip) + '</div></div>';
  }
  function fieldHTML(v) { return '<div class="field" id="q-field"><span id="q-fieldText">' + (v ? esc(v) : '<span class="ph">Введи ответ</span>') + '</span><span class="caret" aria-hidden="true"></span></div>'; }
  function keypadHTML(digitsOnly) {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '-', '0', ','];
    return '<div class="keypad" role="group" aria-label="Цифры">' + keys.map(function (k) {
      if (digitsOnly && (k === '-' || k === ',')) return '<button class="key" disabled aria-hidden="true" tabindex="-1" style="opacity:.35">' + (k === '-' ? MINUS : k) + '</button>';
      return '<button class="key" data-act="q-key" data-k="' + k + '"' + (k === '-' ? ' aria-label="Минус"' : '') + '>' + (k === '-' ? MINUS : k) + '</button>';
    }).join('') + '<button class="key" data-act="q-key" data-k="back" aria-label="Стереть" style="grid-column:1 / -1">' + ICON.back + '</button></div>';
  }
  function typeNum(a, k, digitsOnly) {
    if (k === 'back') return a.slice(0, -1);
    if (k === '-') { if (digitsOnly) return a; return a.charAt(0) === MINUS ? a.slice(1) : MINUS + a; }
    if (k === ',') return !digitsOnly && a.indexOf(',') < 0 && /\d/.test(a) ? a + ',' : a;
    if (/^\d$/.test(k) && a.replace(/[^\d]/g, '').length < 8) return a + k;
    return a;
  }
  function isDigits(p) { return p.kind === 'match'; }
  function rightAns(p, given) {
    if (isDigits(p)) return given === p.answer;
    return L.dachaNumEq(L.dachaParse(given), Number(p.answer));
  }
  function ansText(p) { return isDigits(p) ? p.answer : num(Number(p.answer)); }

  /* ================== ДОМ ЗАДАНИЯ ================== */
  function renderHome() {
    var q = Q[T], s = st(T);
    var modes = '<button class="mode" data-act="q-train"><span class="mode-t"><span>Тренировка</span><span class="pill pill-primary">5 заданий по шагам</span></span>' +
      '<span class="mode-d">' + esc(q.train) + '</span><span class="mode-meta"><span class="mini">Лучший счёт: ' + s.best + '</span><span class="mini">Раундов: ' + s.rounds + '</span></span></button>';
    if (q.saper) modes += '<button class="mode" data-act="q-saper"><span class="mode-t"><span>Сапёр ошибок</span><span class="pill pill-red">5 решений</span></span>' +
      '<span class="mode-d">' + esc(q.saperD || 'Готовое решение уравнения, в одной строке ошибка. Найди строку, где решение пошло не так: потерянный знак, перенос без смены знака, деление наоборот.') + '</span>' +
      '<span class="mode-meta"><span class="mini">Лучший результат: ' + s.bestSaper + ' из 5</span><span class="mini">Раундов: ' + s.sapers + '</span></span></button>';
    if (O.QX9) modes += O.QX9.homeModes(T);
    modes += '<button class="mode" data-act="q-sprint"><span class="mode-t"><span>Спринт</span><span class="pill pill-amber">' + q.n + ' заданий · ' + q.min + ' минут</span></span>' +
      '<span class="mode-d">Задания подряд, как в варианте ОГЭ: на время, без подсказок, с разбором в конце.</span>' +
      '<span class="mode-meta"><span class="mini amber">Лучший результат: ' + s.bestSprint + ' из ' + q.n + '</span><span class="mini">Спринтов: ' + s.sprints + '</span></span></button>';
    app.innerHTML = '<button class="btn-small back" data-act="menu">← Все задания</button>' +
      '<header class="home-hero"><div class="pill pill-primary" style="align-self:flex-start">7 класс</div><h1 class="h1">' + esc(q.title) + '</h1>' +
      '<p class="lead">' + esc(q.sub) + '. ' + esc(q.lead) + '</p></header>' + modes +
      '<div class="links spacer"><button class="btn-small" data-act="q-report">Отчёт по заданию ' + T + '</button></div>';
    O.postRender();
  }

  /* ================== ТРЕНИРОВКА ================== */
  function startTrain() {
    var items = [], seen = {}, guard = 0;
    while (items.length < 5) { var p = Q[T].make(); if (seen[p.text + p.answer] && guard++ < 50) continue; seen[p.text + p.answer] = 1; items.push(p); }
    R = { items: items, i: 0, si: 0, input: '', tries: 0, aid: false, reveal: false, msg: '', points: 0, stage: 'play', log: [], stepLog: [], cur: null, res: null, first: 0, newBest: false };
    resetItem();
    O.go('qtrain');
  }
  function resetItem() { R.si = 0; R.input = ''; R.tries = 0; R.aid = false; R.reveal = false; R.msg = ''; R.stepLog = []; R.stage = 'play'; R.cur = { pts: 0, clean: true, solved: true }; }
  function renderTrain() {
    if (!R || O.screen !== 'qtrain') { O.go('qhome'); return; }
    if (R.stage === 'end') { renderTrainEnd(); return; }
    var p = R.items[R.i], done = R.stage === 'result' ? R.i + 1 : R.i, body;
    if (R.stage === 'result') {
      var r = R.res;
      body = '<div class="hero">' + (r.solved ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Верно</h1>' : '<div class="badge badge-warn pop">' + ICON.excl + '</div><h1 class="h1">Разберём</h1>') +
        '<div class="hero-sub">' + (r.solved ? 'Ответ: ' : 'Правильный ответ: ') + esc(ansText(p)) + '</div></div>' + problemHTML(p, null) +
        O.breakdown([{ label: r.clean ? 'Без подсказок и промахов' : r.solved ? 'С подсказкой или со второй попытки' : 'Часть шагов показана', pts: r.pts }], r.pts) +
        '<section class="note note-primary"><div class="note-t">Как решать</div><div>' + mathX(p.explain) + '</div></section>' +
        '<button class="btn btn-primary spacer" data-act="q-next" data-primary>' + (R.i + 1 >= 5 ? 'Показать итог' : 'Следующее задание') + '</button>';
    } else {
      var s = p.steps[R.si], n = p.steps.length, dig = isDigits(p);
      var chips = R.stepLog.map(function (x) { return '<div class="chip chip-ok" style="align-self:flex-start">' + ICON.check(18) + ' ' + mathX(x) + '</div>'; }).join('');
      var aid = R.aid || R.reveal ? '<div class="banner banner-info"><b>' + (R.reveal ? 'Правильный ответ: ' + num(s.ans) + '.' : 'Подсказка.') + '</b> ' + mathX(s.aid) + '</div>' : '';
      var act = R.reveal
        ? '<button class="btn btn-primary spacer" data-act="q-cont" data-primary>' + (R.si + 1 >= n ? 'К разбору' : 'Дальше') + '</button>'
        : '<div class="foot spacer"><button class="btn-small" data-act="q-aid"' + (R.aid ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Без подсказки<br>+4 очка</div></div>' +
        '<button class="btn btn-primary" data-act="q-check" data-primary id="q-check"' + (R.input ? '' : ' disabled') + '>Проверить</button>';
      body = '<div class="head"><div class="pill pill-primary">' + esc(Q[T].title) + ' · тренировка</div></div>' + problemHTML(p, s) + chips +
        '<section class="card task task-compact"><div class="kicker">Шаг ' + (R.si + 1) + ' из ' + n + '</div><div class="q-step">' + mathX(s.q) + '</div></section>' +
        (R.reveal ? '' : fieldHTML(R.input) + keypadHTML(dig) + '<div class="foot"><span class="label">' + (dig ? 'Номер: 1, 2 или 3' : 'Ответ числом') + '</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>') +
        (R.msg ? '<div class="banner banner-warn" id="msg">' + mathX(R.msg) + '</div>' : '') + aid + act;
    }
    app.innerHTML = topbar('Задание ' + (R.i + 1) + ' из 5', Math.round(done / 5 * 100), R.points + ' очков') + body;
    O.postRender();
  }
  function trainKey(k) {
    if (!R || R.stage !== 'play' || R.reveal) return;
    R.input = typeNum(R.input, k, isDigits(R.items[R.i]));
    var el = document.getElementById('q-fieldText'), b = document.getElementById('q-check');
    if (el) el.innerHTML = R.input ? esc(R.input) : '<span class="ph">Введи ответ</span>';
    if (b) b.disabled = !R.input;
  }
  function addPts(n) { R.points += n; R.cur.pts += n; st(T).points += n; }
  function advance(text) {
    var p = R.items[R.i];
    R.stepLog.push(text); R.si++; R.input = ''; R.tries = 0; R.aid = false; R.reveal = false; R.msg = '';
    if (R.si >= p.steps.length) {
      R.res = { solved: R.cur.solved, clean: R.cur.clean, pts: R.cur.pts };
      R.log.push({ skill: p.skill, clean: R.cur.clean });
      if (R.cur.clean) R.first++;
      skill(p.skill, R.cur.clean);
      R.stage = 'result'; O.saveStats(); O.announce(R.cur.solved ? 'Верно' : 'Разберём');
    }
    renderTrain();
  }
  function trainCheck() {
    if (!R || R.stage !== 'play' || R.reveal) return;
    var p = R.items[R.i], s = p.steps[R.si], v = L.dachaParse(R.input);
    if (!isFinite(v)) return;
    if (L.dachaNumEq(v, s.ans)) { var first = R.tries === 0 && !R.aid; if (!first) R.cur.clean = false; addPts(first ? 4 : 2); advance(num(s.ans)); return; }
    R.cur.clean = false; R.tries++;
    var trap = L.dachaStepTrap(s, v);
    R.input = '';
    if (R.tries >= 2) { R.reveal = true; R.msg = trap || ''; R.cur.solved = false; }
    else R.msg = (trap || 'Не сходится.') + ' Попробуй ещё раз.';
    O.announce('Неверно');
    renderTrain();
  }
  function trainNext() {
    if (!R || R.stage !== 'result') return;
    if (R.i + 1 >= 5) {
      var s = st(T); s.rounds++;
      if (R.points > s.best) { s.best = R.points; R.newBest = true; }
      R.stage = 'end'; O.saveStats(); renderTrain(); return;
    }
    R.i++; resetItem(); renderTrain();
  }
  function renderTrainEnd() {
    var weak = [];
    R.log.forEach(function (x) { var n = Q[T].skills[x.skill]; if (!x.clean && weak.indexOf(n) < 0) weak.push(n); });
    app.innerHTML = '<div class="hero" style="padding-top:20px"><div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Раунд завершён</h1>' +
      '<div class="hero-sub">' + R.points + ' очков' + (R.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid"><div class="stat"><div class="v">' + R.first + ' из 5</div><div class="k">без подсказок и промахов</div></div><div class="stat"><div class="v">' + st(T).best + '</div><div class="k">лучший счёт</div></div></div>' +
      (weak.length ? '<section class="note note-amber"><div class="note-t">Что повторить</div><div>' + esc(weak.join('; ')) + '.</div></section>' : '<section class="note note-primary"><div class="note-t">Отличный раунд</div><div>Все задания без подсказок. Попробуй «Спринт».</div></section>') +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="q-train" data-primary>Ещё раунд</button><button class="btn btn-ghost" data-act="q-sprint">Спринт</button><button class="btn btn-ghost" data-act="q-home">К заданию ' + T + '</button></div>';
    O.postRender();
  }

  /* ================== САПЁР (задание 9) ================== */
  function startSaper() {
    X = { items: [0, 1, 2, 3, 4].map(function () { return Q[T].saper(); }), i: 0, pick: null, ok: 0, stage: 'find', newBest: false };
    O.go('qsaper');
  }
  function renderSaper() {
    if (!X || O.screen !== 'qsaper') { O.go('qhome'); return; }
    if (X.stage === 'end') {
      app.innerHTML = '<div class="hero" style="padding-top:20px"><div class="badge ' + (X.ok >= 4 ? 'badge-ok' : 'badge-warn') + ' pop">' + (X.ok >= 4 ? ICON.check(36) : ICON.excl) + '</div><h1 class="h1">Ошибки найдены: ' + X.ok + ' из 5</h1>' +
        '<div class="hero-sub">' + (X.newBest ? 'Новый рекорд!' : 'Лучший результат: ' + st(T).bestSaper + ' из 5') + '</div></div>' +
        '<div class="actions spacer"><button class="btn btn-primary" data-act="q-saper" data-primary>Ещё раунд</button><button class="btn btn-ghost" data-act="q-home">К заданию ' + T + '</button></div>';
      O.postRender(); return;
    }
    var it = X.items[X.i], done = X.stage === 'show';
    var rows = it.lines.map(function (ln, i) {
      var cls = 'srow' + (done && i === it.err ? ' is-err' : '') + (done && X.pick === i && i !== it.err ? ' is-quiet' : '');
      var tag = done && i === it.err ? '<span class="stag">Ошибка здесь</span>' : done && X.pick === i ? '<span class="stag">твой выбор</span>' : '';
      var open = done || i === 0 ? '<div' : '<button data-act="q-line" data-i="' + i + '"';
      return open + ' class="' + cls + '"><span class="num">' + (i + 1) + '</span><span class="sx">' + mathX(ln) + '</span>' + tag + (done || i === 0 ? '</div>' : '</button>');
    }).join('');
    app.innerHTML = topbar('Решение ' + (X.i + 1) + ' из 5', Math.round((X.i + (done ? 1 : 0)) / 5 * 100), X.ok + ' найдено') +
      '<div class="head"><div class="pill pill-red">Сапёр ошибок</div><h1 class="h1 sm">' + (done ? (X.pick === it.err ? 'Нашёл!' : 'Ошибка была в строке ' + (it.err + 1)) : 'В какой строке ошибка?') + '</h1></div>' +
      '<div class="rows">' + rows + '</div>' +
      (done ? '<section class="note ' + (X.pick === it.err ? 'note-primary' : 'note-amber') + '"><div class="note-t">Что случилось</div><div>' + mathX(it.explain) + '</div></section>' +
        '<button class="btn btn-primary spacer" data-act="q-snext" data-primary>' + (X.i + 1 >= 5 ? 'Итог' : 'Следующее решение') + '</button>' : '<p class="hint">Строка 1 — условие. Нажми на строку, где решение пошло не так.</p>');
    O.postRender();
  }
  function saperPick(i) {
    if (!X || X.stage !== 'find') return;
    var it = X.items[X.i];
    if (!(i >= 1 && i < it.lines.length)) return;
    X.pick = i; X.stage = 'show';
    var ok = i === it.err;
    if (ok) { X.ok++; st(T).points += 5; }
    skill(it.skill, ok); O.saveStats(); O.announce(ok ? 'Верно' : 'Неверно');
    renderSaper();
  }
  function saperNext() {
    if (!X || X.stage !== 'show') return;
    if (X.i + 1 >= 5) { var s = st(T); s.sapers++; if (X.ok > s.bestSaper) { s.bestSaper = X.ok; X.newBest = true; } X.stage = 'end'; O.saveStats(); renderSaper(); return; }
    X.i++; X.pick = null; X.stage = 'find'; renderSaper();
  }

  /* ================== СПРИНТ ================== */
  function fmtTime(sec) { var m = Math.floor(sec / 60), x = sec % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  function left() { return Math.max(0, Q[S.T].min * 60 - Math.floor((Date.now() - S.t0) / 1000)); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function startSprint() {
    var q = Q[T], items = [], seen = {}, guard = 0;
    while (items.length < q.n) { var p = q.make(); if (seen[p.text + p.answer] && guard++ < 80) continue; seen[p.text + p.answer] = 1; items.push(p); }
    S = { T: T, items: items, ans: items.map(function () { return ''; }), i: 0, stage: 'run', t0: Date.now(), res: null, score: 0, newBest: false, timeout: false };
    O.go('qsprint');
    stopTimer();
    timer = setInterval(function () {
      if (!S || S.stage !== 'run' || O.screen !== 'qsprint') { stopTimer(); return; }
      var l = left(), el = document.getElementById('q-time');
      if (el) el.textContent = fmtTime(l);
      if (l <= 0) sprintFinish(true);
    }, 1000);
    if (timer && timer.unref) timer.unref();
  }
  function renderSprint() {
    if (!S || O.screen !== 'qsprint') { O.go('qhome'); return; }
    var n = S.items.length;
    if (S.stage === 'review') {
      var rows = S.items.map(function (p, i) {
        var ok = S.res[i];
        return '<section class="card" style="display:flex;flex-direction:column;gap:6px"><div class="brow"><span><b>Задание ' + (i + 1) + '</b></span><span class="' + (ok ? 'plus' : 'zero') + '">' + (ok ? 'верно' : 'неверно') + '</span></div>' +
          (p.kind === 'eq' ? '<div class="q-eq sm">' + mathX(p.text) + '</div>' : '') +
          '<div>Твой ответ: <b>' + esc(S.ans[i] || '—') + '</b>' + (ok ? '' : ' · правильный: <b>' + esc(ansText(p)) + '</b>') + '</div><div class="hint">' + mathX(p.explain) + '</div></section>';
      }).join('');
      app.innerHTML = '<div class="hero" style="padding-top:20px">' + (S.score >= n - 1 ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div>' : '<div class="badge badge-warn pop">' + ICON.excl + '</div>') +
        '<h1 class="h1">Спринт завершён</h1><div class="hero-sub">' + S.score + ' из ' + n + (S.newBest ? ' · новый рекорд!' : '') + (S.timeout ? ' · время вышло' : '') + '</div></div>' + rows +
        '<div class="actions spacer"><button class="btn btn-primary" data-act="q-sprint" data-primary>Новый спринт</button><button class="btn btn-ghost" data-act="q-home">К заданию ' + S.T + '</button></div>';
      O.postRender(); return;
    }
    var p = S.items[S.i], cnt = S.ans.filter(function (a) { return a !== ''; }).length, nav = '<div class="dc-nav" style="grid-template-columns:repeat(' + n + ',minmax(0,1fr))" role="group" aria-label="Задания">';
    for (var k = 0; k < n; k++) nav += '<button data-act="q-go" data-i="' + k + '" class="' + (k === S.i ? 'is-cur' : S.ans[k] !== '' ? 'is-done' : '') + '" aria-label="Задание ' + (k + 1) + '">' + (k + 1) + '</button>';
    nav += '</div>';
    var last = S.i === n - 1;
    app.innerHTML = topbar('Спринт · задание ' + (S.i + 1) + ' из ' + n, Math.round(cnt / n * 100), fmtTime(left()), 'q-time') + nav + problemHTML(p, null) +
      fieldHTML(S.ans[S.i]) + keypadHTML(isDigits(p)) + '<div class="foot"><span class="label">' + (isDigits(p) ? 'Три цифры для А, Б, В' : 'Ответ числом') + '</span></div>' +
      '<div class="actions spacer"><div class="foot"><button class="btn-small" data-act="q-prev"' + (S.i === 0 ? ' disabled' : '') + '>← Назад</button>' + (last ? '' : '<button class="btn-small" data-act="q-fwd">Дальше →</button>') + '</div>' +
      '<button class="btn ' + (last ? 'btn-primary' : 'btn-ghost') + '" data-act="q-finish">Завершить и проверить</button></div>';
    O.postRender();
  }
  function sprintKey(k) {
    if (!S || S.stage !== 'run') return;
    var p = S.items[S.i], a = typeNum(S.ans[S.i], k, isDigits(p));
    if (isDigits(p) && a.length > 3) return;
    S.ans[S.i] = a;
    var el = document.getElementById('q-fieldText');
    if (el) el.innerHTML = a ? esc(a) : '<span class="ph">Введи ответ</span>';
    var bs = app.querySelectorAll('[data-act="q-go"]');
    for (var j = 0; j < bs.length; j++) { var n = Number(bs[j].getAttribute('data-i')); bs[j].className = n === S.i ? 'is-cur' : S.ans[n] !== '' ? 'is-done' : ''; }
  }
  function sprintFinish(timeout) {
    if (!S || S.stage !== 'run') return;
    stopTimer();
    var s = st(S.T), ok = 0;
    S.res = S.items.map(function (p, i) { var r = S.ans[i] !== '' && rightAns(p, S.ans[i]); skill(p.skill, r); if (r) ok++; return r; });
    s.sprints++; s.points += ok * 2;
    if (ok > s.bestSprint) { s.bestSprint = ok; S.newBest = true; }
    S.score = ok; S.stage = 'review'; S.timeout = timeout === true || left() <= 0;
    O.saveStats(); renderSprint();
  }

  /* ================== ОТЧЁТ ================== */
  O.reportQBody = function (t) {
    var q = Q[t], s = st(t), ids = Object.keys(q.skills), stt = O.stats;
    function pc(x) { return x && x.total ? Math.round(x.ok / x.total * 100) : null; }
    var rows = ids.map(function (id) {
      var x = stt.skills[id] || { ok: 0, total: 0 }, p = pc(x), cls = p === null ? '' : p >= 80 ? 'good' : p >= 60 ? 'mid' : 'low';
      return '<div class="skill"><div class="skill-top"><span>' + esc(q.skills[id]) + '</span><span>' + (p === null ? 'нет данных' : x.ok + ' из ' + x.total) + '</span></div><div class="bar"><div class="bar-fill ' + cls + '" style="width:' + (p || 0) + '%"></div></div></div>';
    }).join('');
    var weak = ids.filter(function (id) { var x = stt.skills[id]; return x && x.total >= 3 && pc(x) < 70; }), total = s.rounds + s.sprints + s.sapers + (O.QX9 ? O.QX9.plays(t) : 0), recs = [];
    if (!total) recs.push('Сыграйте хотя бы один раунд в задании ' + t + ', и здесь появятся выводы.');
    if (weak.length) recs.push('Стоит потренировать: ' + weak.map(function (k) { return q.skills[k].toLowerCase(); }).join('; ') + '.');
    if (total && !weak.length) recs.push('Слабых мест в задании ' + t + ' пока не видно. Раз в несколько дней — один раунд, перед экзаменом — «Спринт».');
    if (total && !s.sprints) recs.push('«Спринт» ещё не пробовали: он показывает, успевает ли ученик решать без подсказок.');
    return '<div class="stat-grid"><div class="stat"><div class="v">' + s.points + '</div><div class="k">очков в задании ' + t + '</div></div>' +
      '<div class="stat"><div class="v">' + total + '</div><div class="k">раундов сыграно</div></div>' +
      '<div class="stat"><div class="v">' + s.bestSprint + ' из ' + q.n + '</div><div class="k">лучший спринт</div></div>' +
      (q.saper ? '<div class="stat"><div class="v">' + s.bestSaper + ' из 5</div><div class="k">лучший сапёр</div></div>' : '<div class="stat"><div class="v">' + s.best + '</div><div class="k">лучшая тренировка</div></div>') + '</div>' +
      (O.QX9 ? O.QX9.reportRows(t) : '') +
      '<section class="card"><div class="label">Навыки: ответы с первой попытки</div><div style="margin-top:6px">' + rows + '</div></section>' +
      '<section class="note note-primary"><div class="note-t">Что делать дальше</div><ul class="list">' + recs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>';
  };
  O.statQ = function (t) { var s = st(t); return { points: s.points, rounds: s.rounds + s.sprints + s.sapers + (O.QX9 ? O.QX9.plays(t) : 0) }; };
  O.Q7 = Q;
  O.QX = { st: st, skill: skill, num: num, topbar: topbar, fieldHTML: fieldHTML, keypadHTML: keypadHTML, typeNum: typeNum, graphSVG: graphSVG, mathX: mathX, fmtTime: fmtTime, stopTimer: stopTimer, get T() { return T; } };

  /* ================== РЕГИСТРАЦИЯ ================== */
  O.__q = { get R() { return R; }, get S() { return S; }, get X() { return X; }, get T() { return T; } };   // для автотестов
  O.screens.qhome = renderHome; O.screens.qtrain = renderTrain; O.screens.qsprint = renderSprint; O.screens.qsaper = renderSaper;
  Object.assign(O.ACT, {
    home9: function () { T = 9; O.go('qhome'); }, home11: function () { T = 11; O.go('qhome'); }, home12: function () { T = 12; O.go('qhome'); },
    'q-home': function () { stopTimer(); if (O.QX9) O.QX9.stop(); O.go('qhome'); },
    'q-train': startTrain, 'q-sprint': startSprint, 'q-saper': function () { if (Q[T].saper) startSaper(); },
    'q-key': function (d) { if (O.screen === 'qmode' && O.QX9) O.QX9.key(d.k); else if (O.screen === 'qtrain') trainKey(d.k); else if (O.screen === 'qsprint') sprintKey(d.k); },
    'q-check': trainCheck, 'q-next': trainNext,
    'q-aid': function () { if (R && R.stage === 'play' && !R.reveal) { R.aid = true; R.cur.clean = false; renderTrain(); } },
    'q-cont': function () { if (R && R.stage === 'play' && R.reveal) advance(num(R.items[R.i].steps[R.si].ans)); },
    'q-line': function (d) { saperPick(Number(d.i)); }, 'q-snext': saperNext,
    'q-go': function (d) { if (S && S.stage === 'run') { var i = Number(d.i); if (i >= 0 && i < S.items.length) { S.i = i; renderSprint(); } } },
    'q-prev': function () { if (S && S.stage === 'run' && S.i > 0) { S.i--; renderSprint(); } },
    'q-fwd': function () { if (S && S.stage === 'run' && S.i < S.items.length - 1) { S.i++; renderSprint(); } },
    'q-finish': function () { sprintFinish(false); },
    'q-report': function () { O.renderReport('q' + T); }
  });
  O.keyHandlers.push(function (e, k) {
    var sc = O.screen;
    if (sc === 'qsaper' && X && X.stage === 'find' && /^[2-9]$/.test(k)) { saperPick(Number(k) - 1); return true; }
    var on = (sc === 'qtrain' && R && R.stage === 'play' && !R.reveal) || (sc === 'qsprint' && S && S.stage === 'run');
    if (!on) return false;
    var key = /^[0-9]$/.test(k) ? k : k === ',' || k === '.' ? ',' : k === '-' || k === MINUS ? '-' : k === 'Backspace' ? 'back' : null;
    if (!key) return false;
    if (sc === 'qtrain') trainKey(key); else sprintKey(key);
    return true;
  });
})();
