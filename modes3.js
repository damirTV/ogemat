/* Задание 7 (числа на координатной прямой): экраны «Прикидка» и «Сапёр ошибок». */
(function () {
  'use strict';
  var O = window.OGE, L = O.L, app = O.app, esc = O.esc, ICON = O.ICON;
  var P = null; // раунд «Прикидки»
  var S = null; // раунд «Сапёра»

  /* Мини-разметка: дроби [a/b] и корни √(n) */
  function m7(src) {
    var roots = [];
    var s = String(src).replace(/√\(([^)]+)\)/g, function (_, d) { roots.push(d); return '\uE000' + (roots.length - 1) + '\uE001'; });
    return O.math(s).replace(/\uE000(\d+)\uE001/g, function (_, i) {
      return '<span class="rt"><span class="rs">√</span><span class="rv">' + esc(roots[i]) + '</span></span>';
    });
  }
  function p7(src) { return O.plain(String(src)).replace(/√\(([^)]+)\)/g, '√$1'); }
  function T() { return L.t7(O.stats); }

  function topbar7(label, percent, points) {
    return '<div class="topbar">' +
      '<button class="close" data-act="home7" aria-label="Выйти в задание 7">' + ICON.close + '</button>' +
      '<div class="progress"><div class="progress-label">' + esc(label) + '</div>' +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '"><div class="bar-fill" style="width:' + percent + '%"></div></div></div>' +
      '<div class="chip chip-pts">' + points + ' очков</div></div>';
  }
  function soundBtn() {
    if (!O.sound) return '';
    var on = O.sound.on();
    return '<button class="btn-small" data-act="sound" aria-pressed="' + on + '">Звук: ' + (on ? 'включён' : 'выключен') + '</button>';
  }

  function modeTile7(act, name, pill, cls, desc, best, rounds) {
    return '<button class="mode" data-act="' + act + '"><span class="mode-t"><span>' + name + '</span><span class="pill ' + cls + '">' + pill + '</span></span>' +
      '<span class="mode-d">' + esc(desc) + '</span>' +
      '<span class="mode-meta"><span class="mini">Лучший счёт: ' + (best || 0) + '</span><span class="mini">Раундов: ' + (rounds || 0) + '</span></span></button>';
  }

  /* ================== ЭКРАН ЗАДАНИЯ 7 ================== */
  function renderHome7() {
    P = null; S = null;
    var st = O.stats, t = T(), g = st.grade;
    app.innerHTML =
      '<button class="btn-small back" data-act="menu">← Все задания</button>' +
      '<header class="home-hero"><div class="pill pill-primary" style="align-self:flex-start">5–6 классы</div>' +
      '<h1 class="h1">Задание 7</h1>' +
      '<p class="lead">Числа на координатной прямой. Учимся сравнивать числа, находить их место на прямой и понимать знаки выражений. В каждом режиме раунд состоит из 5 заданий.</p></header>' +
      '<div><div class="seg" role="radiogroup" aria-label="Класс">' +
      '<button role="radio" aria-checked="' + (g === 5) + '" class="' + (g === 5 ? 'is-on' : '') + '" data-act="grade7" data-grade="5">5 класс</button>' +
      '<button role="radio" aria-checked="' + (g === 6) + '" class="' + (g === 6 ? 'is-on' : '') + '" data-act="grade7" data-grade="6">6 класс</button></div>' +
      '<p class="hint" style="margin-top:8px">' + (g === 5
        ? 'В 5 классе: десятичные и обыкновенные дроби, смешанные числа.'
        : 'В 6 классе добавляются отрицательные числа, модуль и знаки выражений.') + '</p></div>' +
      '<div><div class="seg" role="radiogroup" aria-label="Уровень">' +
      '<button role="radio" aria-checked="' + (!t.roots) + '" class="' + (!t.roots ? 'is-on' : '') + '" data-act="roots7" data-v="0">Без корней</button>' +
      '<button role="radio" aria-checked="' + t.roots + '" class="' + (t.roots ? 'is-on' : '') + '" data-act="roots7" data-v="1">С корнями ★</button></div>' +
      '<p class="hint" style="margin-top:8px">' + (t.roots
        ? '★ Уровень со звёздочкой: корни и выражения с корнями, как в экзамене.'
        : 'Корни проходят позже, но на экзамене они встречаются в этом задании. Включай уровень ★, когда освоишь обычные числа.') + '</p></div>' +
      '<button class="mode" data-act="start-prik7"><span class="mode-t"><span>Прикидка</span><span class="pill pill-primary">5 заданий</span></span>' +
      '<span class="mode-d">Сначала прикинь, где окажется число, потом ответь на вопрос как в экзамене: между какими целыми оно заключено или какой точке на прямой соответствует.</span>' +
      '<span class="mode-meta"><span class="mini">Лучший счёт: ' + st.best.prikidka7 + '</span><span class="mini">Раундов: ' + st.rounds.prikidka7 + '</span></span></button>' +
      '<button class="mode" data-act="start-saper7"><span class="mode-t"><span>Сапёр ошибок</span><span class="pill pill-amber">5 решений</span></span>' +
      '<span class="mode-d">В решении спрятана ловушка: сравнение дробей, знак выражения, корень. Найди строку с ошибкой и почини её. Иногда ошибки нет.</span>' +
      '<span class="mode-meta"><span class="mini amber">Ловушек найдено: ' + L.catalogFound7(st) + ' из ' + L.trapCount7() + '</span><span class="mini">Лучший счёт: ' + st.best.saper7 + '</span></span></button>' +
      modeTile7('start-nl7', 'Числовая прямая', '5 заданий', 'pill-primary', 'Отметь число на прямой, найди нужную точку среди A–D или расставь числа по порядку.', st.best.numline7, st.rounds.numline7) +
      modeTile7('start-ws7', 'Мастерская сравнений', '5 заданий', 'pill-amber', 'Сравни два числа. Если трудно, мастерская приведёт их к общему виду: общий знаменатель, одинаковое число знаков, квадраты.', st.best.ws7, st.rounds.ws7) +
      modeTile7('start-sg7', 'Знаки и шкала', '5 заданий', 'pill-primary', 'Прочитай значение на шкале с делениями' + (g >= 6 ? ' и определи верное утверждение о знаках чисел a и b.' : '.'), st.best.signs7, st.rounds.signs7) +
      modeTile7('start-lp7', 'Лупа', '5 заданий', 'pill-amber', 'Приближай число лупой: сначала целые, потом десятые и сотые. Помогает с корнями и дробями.', st.best.loupe7, st.rounds.loupe7) +
      '<button class="mode" data-act="start-sp7"><span class="mode-t"><span>Спринт</span><span class="pill pill-amber">10 заданий · 15 минут</span></span>' +
      '<span class="mode-d">Режим для родителей: тренировка как на экзамене. 10 заданий, как в вариантах ОГЭ, на время, без подсказок, с итоговым разбором. Включайте после освоения обычных режимов.</span>' +
      '<span class="mode-meta"><span class="mini amber">Лучший результат: ' + (st.best.sprint7 || 0) + ' из 10</span><span class="mini">Спринтов: ' + (st.rounds.sprint7 || 0) + '</span></span></button>' +
      '<div class="links spacer"><button class="btn-small" data-act="report7">Отчёт по заданию 7</button>' + soundBtn() + '</div>';
    O.postRender();
  }

  /* ================== ПРИКИДКА ================== */
  function cur() { return P.tasks[P.i]; }
  function isPoint(t) { return t.kind.indexOf('point') === 0; }

  function startPrik7() {
    P = {
      tasks: L.makePrikidka7Round(O.stats.grade, T().roots, 5), i: 0, points: 0, streak: 0, log: [],
      estOkCount: 0, firstCount: 0, caughtCount: 0, newBest: false
    };
    resetPrik();
    O.go('prik7');
  }
  function resetPrik() {
    P.stage = 'estimate'; P.pick = null; P.estOk = false; P.hint = false; P.tries = 0; P.wrong = []; P.lastWrong = null;
    P.msg = ''; P.caught = false; P.conflict = null; P.how = false; P.res = null;
  }

  function renderPrik7() {
    if (!P) { renderHome7(); return; }
    if (P.stage === 'end') { renderPrikEnd(); return; }
    var t = cur(), n = P.tasks.length, done = P.stage === 'result' ? P.i + 1 : P.i, body;
    if (P.stage === 'estimate') body = prikEstimate(t, false);
    else if (P.stage === 'estimate_fb') body = prikEstimate(t, true);
    else if (P.stage === 'answer') body = prikAnswer(t);
    else if (P.stage === 'conflict') body = prikConflict(t);
    else body = prikResult(t);
    app.innerHTML = topbar7('Задание ' + (P.i + 1) + ' из ' + n, Math.round(done / n * 100), P.points) + body;
    O.postRender();
  }

  function taskCard7(t, compact) {
    var q = !isPoint(t);
    return '<section class="card task' + (compact ? ' task-compact' : '') + '"><div class="kicker">' + esc(t.question) + '</div>' +
      '<div class="expr">' + m7(t.expr) + (q ? '<span class="eq">?</span>' : '') + '</div>' +
      (compact ? '' : '<div class="meta">Тип 7 · ' + esc(L.SKILLS7[t.skill]) + '</div>') + '</section>';
  }

  /* Прямая с точками A–D. mode: play | conflict | result */
  function lineSVG7(t, mode) {
    var ln = t.line, X0 = 28, X1 = 292, span = ln.hi - ln.lo;
    function X(x) { return X0 + (x - ln.lo) / span * (X1 - X0); }
    var g = '<line x1="14" y1="64" x2="306" y2="64" stroke="#B9B0A0" stroke-width="3" stroke-linecap="round"/>';
    for (var k = ln.lo; k <= ln.hi; k++) {
      g += '<line x1="' + X(k) + '" y1="54" x2="' + X(k) + '" y2="74" stroke="#B9B0A0" stroke-width="3"/>' +
        '<text x="' + X(k) + '" y="98" text-anchor="middle" fill="#5A5F7A" font-size="15" font-weight="700">' + esc(L.fmt(k)) + '</text>';
    }
    var letters = [];
    ln.points.forEach(function (p) {
      var fill = '#E8812A', ink = '#A8500A';
      if (mode === 'conflict' && P.conflict && P.conflict.letter === p.letter) { fill = '#E5484D'; ink = '#A8232C'; }
      if (mode === 'result') {
        if (p.ok) { fill = '#2FB383'; ink = '#0F6B4E'; }
        else if (P.lastWrong !== null && t.opts[P.lastWrong] && t.opts[P.lastWrong].letter === p.letter) { fill = '#E5484D'; ink = '#A8232C'; }
        else { fill = '#C9BFAE'; ink = '#7A7466'; }
      }
      g += '<circle cx="' + X(p.x) + '" cy="64" r="8" fill="' + fill + '"/>' +
        '<text x="' + X(p.x) + '" y="42" text-anchor="middle" fill="' + ink + '" font-size="17" font-weight="800">' + p.letter + '</text>';
      letters.push(p.letter);
    });
    return '<svg viewBox="0 0 320 108" role="img" aria-label="Числовая прямая от ' + L.fmt(ln.lo) + ' до ' + L.fmt(ln.hi) + ', отмечены точки ' + letters.join(', ') + '">' + g + '</svg>';
  }
  function lineCard(t, mode) { return isPoint(t) ? '<div class="card nline" style="cursor:default">' + lineSVG7(t, mode) + '</div>' : ''; }

  function estLabel(t) { return t.est.options[t.est.correctIndex].label; }
  function correctOpt(t) { return t.opts.filter(function (o) { return o.ok; })[0]; }

  function prikEstimate(t, fb) {
    var letters = ['А', 'Б', 'В'];
    var opts = t.est.options.map(function (o, i) {
      var cls = 'opt', dis = '';
      if (fb) {
        dis = ' disabled';
        if (i === t.est.correctIndex) cls += ' is-correct';
        else if (i === P.pick) cls += ' is-wrong';
        else cls += ' is-dim';
      }
      return '<button class="' + cls + '" data-act="pick7" data-i="' + i + '"' + dis + '><span class="opt-letter">' + letters[i] + '</span><span>' + esc(o.label) + '</span></button>';
    }).join('');
    var hintBox = (P.hint && !fb) ? '<div class="banner banner-info"><b>Подсказка.</b> ' + m7(t.estHint) + '</div>' : '';
    var fbBox = fb ? '<div class="banner banner-warn"><b>Не совсем.</b> ' + m7(t.estHint) + ' Правильный вариант: «' + esc(estLabel(t)) + '».</div>' : '';
    var tail = fb
      ? '<button class="btn btn-primary spacer" data-act="est-next7" data-primary>Дальше</button>'
      : '<div class="foot spacer"><button class="btn-small" data-act="hint7"' + (P.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Верная прикидка<br>+10 очков</div></div>';
    return '<div class="head"><div class="pill pill-primary">Прикидка</div><h1 class="h1">' + esc(t.estTitle) + '</h1>' +
      '<p class="lead">' + esc(t.estLead) + '</p></div>' +
      taskCard7(t, false) + hintBox +
      '<div class="opts" role="group" aria-label="Варианты прикидки"><div class="label">Выбери вариант</div>' + opts + '</div>' + fbBox + tail;
  }

  function prikAnswer(t) {
    var label = estLabel(t);
    var chip = P.estOk
      ? '<div class="chip chip-ok" style="align-self:flex-start">' + ICON.check(18) + ' Твоя прикидка: ' + esc(label) + '</div>'
      : '<div class="chip chip-info" style="align-self:flex-start">Ориентир: ' + esc(label) + '</div>';
    var opts = t.opts.map(function (o, i) {
      var wrong = P.wrong.indexOf(i) >= 0;
      return '<button class="opt' + (wrong ? ' is-wrong' : '') + '" data-act="ans7" data-i="' + i + '"' + (wrong ? ' disabled' : '') + '><span class="opt-letter">' + (i + 1) + '</span><span>' + esc(o.label) + '</span></button>';
    }).join('');
    var hintBox = P.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + m7(t.hint2) + '</div>' : '';
    var howBox = P.how ? '<div class="note note-primary"><div class="note-t">Как найти</div><div>' + m7(t.explain) + '</div></div>' : '';
    var msg = P.msg ? '<div class="banner banner-warn" id="msg">' + esc(P.msg) + '</div>' : '';
    return '<h1 class="sr-only">Выбери точный ответ</h1>' + chip + taskCard7(t, true) + lineCard(t, 'play') +
      '<div class="opts" role="group" aria-label="Варианты ответа"><div class="foot"><span class="label">Выбери ответ</span><span class="label">Попытка ' + (P.tries + 1) + ' из 2</span></div>' + opts + '</div>' +
      msg + hintBox + howBox +
      '<div class="foot spacer"><button class="btn-small" data-act="hint7"' + (P.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Верно с первой попытки<br>+20 очков</div></div>';
  }

  function prikConflict(t) {
    var c = P.conflict, chosen = t.opts[c.i];
    var howBox = P.how ? '<div class="note note-primary"><div class="note-t">Как найти</div><div>' + m7(t.explain) + '</div></div>' : '';
    var howBtn = P.how ? '' : '<button class="btn btn-ghost" data-act="show-how7">Показать, как найти (−5 очков)</button>';
    return '<div class="banner banner-err"><h1 class="banner-title">' + ICON.warn + '<span>Стоп! Ответ не сходится с прикидкой</span></h1><div>' + esc(c.text) + '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="chip chip-ok" style="align-self:flex-start">Прикидка: ' + esc(estLabel(t)) + '</div>' +
      '<div class="field is-bad"><span>' + esc(chosen.label) + '</span><span class="field-tag">ответ ещё не отправлен</span></div></div>' +
      lineCard(t, 'conflict') +
      '<div class="foot"><span class="chip chip-trap">Ошибка: ответ не сходится с прикидкой</span><div class="foot-note">Попытка<br>не потрачена</div></div>' + howBox +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="fix-ans7" data-primary>Исправить ответ</button>' + howBtn + '</div>';
  }

  function prikResult(t) {
    var r = P.res, sc = r.sc, co = correctOpt(t);
    var rows = [
      { label: 'Прикидка «' + estLabel(t) + '»', pts: sc.est },
      { label: 'Точный ответ' + (r.ok && P.tries === 2 ? ' (со 2-й попытки)' : ''), pts: sc.exact },
      { label: 'Без подсказки', pts: sc.noHint }
    ];
    var answer = isPoint(t) ? co.label : 'между ' + co.label;
    var hero = r.ok
      ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Верно!</h1><div class="hero-sub">' + m7(t.expr) + ' — ' + esc(isPoint(t) ? co.label : answer) + '</div>'
      : '<div class="badge badge-warn pop">' + ICON.excl + '</div><h1 class="h1">Не получилось</h1><div class="hero-sub">Правильный ответ: ' + esc(answer) + '</div>';
    var last = P.i + 1 >= P.tasks.length;
    return '<div class="hero">' + hero + '</div>' + lineCard(t, 'result') + O.breakdown(rows, sc.total) +
      '<section class="card streak"><div><div class="streak-t">Серия верных прикидок</div><div class="streak-s">' + P.streak + ' подряд</div></div>' + O.dots(Math.min(P.streak, 5), 5) + '</section>' +
      '<section class="note note-primary"><div class="note-t">Как найти</div><div>' + m7(t.explain) + '</div></section>' +
      '<button class="btn btn-primary spacer" data-act="prik-next7" data-primary>' + (last ? 'Показать итог' : 'Следующее задание') + '</button>';
  }

  function renderPrikEnd() {
    var best = O.stats.best.prikidka7, n = P.tasks.length;
    var weak = {};
    P.log.forEach(function (x) { if (!x.first) weak[x.skill] = (weak[x.skill] || 0) + 1; });
    var weakList = Object.keys(weak).sort(function (a, b) { return weak[b] - weak[a]; }).slice(0, 2).map(function (k) { return L.SKILLS7[k]; });
    app.innerHTML =
      '<div class="hero" style="padding-top:20px"><div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Раунд завершён</h1>' +
      '<div class="hero-sub">' + P.points + ' очков' + (P.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + P.estOkCount + ' из ' + n + '</div><div class="k">верных прикидок</div></div>' +
      '<div class="stat"><div class="v">' + P.firstCount + ' из ' + n + '</div><div class="k">ответов с первой попытки</div></div>' +
      '<div class="stat"><div class="v">' + P.caughtCount + '</div><div class="k">ошибок поймано прикидкой</div></div>' +
      '<div class="stat"><div class="v">' + best + '</div><div class="k">лучший счёт</div></div></div>' +
      (weakList.length ? '<section class="note note-amber"><div class="note-t">Что повторить</div><div>' + esc(weakList.join('; ')) + '. Загляни в «Сапёр ошибок»: там разбираются типичные ловушки.</div></section>'
        : '<section class="note note-primary"><div class="note-t">Отличный раунд</div><div>Все ответы с первой попытки. Попробуй «Сапёр ошибок» или сыграй ещё раз.</div></section>') +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="start-prik7" data-primary>Сыграть ещё</button>' +
      '<button class="btn btn-ghost" data-act="start-saper7">Сапёр ошибок</button><button class="btn btn-ghost" data-act="home7">В задание 7</button></div>';
    O.postRender();
  }

  function prikPick(i) {
    if (!P || P.stage !== 'estimate') return;
    var t = cur();
    P.pick = i; P.estOk = i === t.est.correctIndex;
    if (P.estOk) { P.streak++; P.stage = 'answer'; O.announce('Верная прикидка'); }
    else { P.streak = 0; P.stage = 'estimate_fb'; O.announce('Прикидка неверная'); }
    renderPrik7();
  }
  function prikAns(i) {
    if (!P || P.stage !== 'answer') return;
    var t = cur(), o = t.opts[i];
    if (!o || P.wrong.indexOf(i) >= 0) return;
    if (o.conflict) {
      if (!P.caught) { P.caught = true; P.caughtCount++; }
      P.conflict = { i: i, text: o.conflict, letter: o.letter || null };
      P.stage = 'conflict';
      O.announce('Стоп, ответ не сходится с прикидкой');
      renderPrik7();
      return;
    }
    P.tries++;
    if (o.ok) { finishPrik(true); return; }
    P.wrong.push(i); P.lastWrong = i;
    if (P.tries >= 2) { finishPrik(false); return; }
    P.msg = 'Не то. Проверь вычисления. Осталась одна попытка.';
    O.announce(P.msg);
    renderPrik7();
  }
  function finishPrik(ok) {
    var t = cur();
    var sc = L.scorePrikidka({ estOk: P.estOk, tries: P.tries, ok: ok, hint: P.hint });
    P.points += sc.total;
    var first = ok && P.tries === 1;
    if (P.estOk) P.estOkCount++;
    if (first) P.firstCount++;
    P.log.push({ skill: t.skill, first: first });
    L.recordPrikidka7(O.stats, t, { estOk: P.estOk, exactFirst: first, caught: P.caught, points: sc.total });
    O.saveStats();
    P.res = { ok: ok, sc: sc };
    P.stage = 'result';
    O.announce(ok ? 'Верно' : 'Не получилось');
    renderPrik7();
  }
  function prikNext() {
    if (P.i + 1 >= P.tasks.length) {
      var st = O.stats; T();
      var prev = st.best.prikidka7;
      st.rounds.prikidka7++;
      if (P.points > prev) { st.best.prikidka7 = P.points; P.newBest = prev > 0; }
      O.saveStats();
      P.stage = 'end';
    } else { P.i++; resetPrik(); }
    renderPrik7();
  }

  /* ================== САПЁР ОШИБОК ================== */
  function curS() { return S.items[S.i]; }

  function startSaper7() {
    S = {
      items: L.makeSaper7Round(O.stats.grade, T().roots, 5), i: 0, points: 0, trapsFound: [], foundCount: 0, firstCount: 0, newBest: false
    };
    resetItem();
    O.go('saper7');
  }
  function resetItem() {
    S.stage = 'find'; S.wrongTaps = []; S.okRows = []; S.attempts = 3; S.wrongFix = [];
    S.hint = false; S.msg = ''; S.found = false; S.foundFirst = false; S.fixedOk = false; S.shakeRow = -1; S.res = null;
  }

  function renderSaper7() {
    if (!S) { renderHome7(); return; }
    if (S.stage === 'end') { renderSaperEnd(); return; }
    var n = S.items.length, it = curS(), done = S.stage === 'result' ? S.i + 1 : S.i, body;
    if (S.stage === 'find') body = saperFind(it);
    else if (S.stage === 'fix') body = saperFix(it);
    else body = saperResult(it);
    app.innerHTML = topbar7('Решение ' + (S.i + 1) + ' из ' + n, Math.round(done / n * 100), S.points) + body;
    S.shakeRow = -1;
    O.postRender();
  }

  function saperFind(it) {
    var rows = it.steps.map(function (s, i) {
      if (i === 0) {
        return '<div class="srow is-quiet"><span class="num">1</span><span class="sx">' + m7(s) + '</span><span class="stag">условие</span></div>';
      }
      var ok = S.okRows.indexOf(i) >= 0;
      return '<button class="srow' + (ok ? ' is-ok' : '') + (S.shakeRow === i ? ' shake' : '') + '" data-act="step7" data-i="' + i + '"' + (ok ? ' disabled' : '') +
        ' aria-label="Строка ' + (i + 1) + ': ' + esc(p7(s)) + '"><span class="num">' + (i + 1) + '</span><span class="sx">' + m7(s) + '</span>' +
        (ok ? '<span class="stag">ошибки нет</span>' : '') + '</button>';
    }).join('');
    var hintBox = S.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + m7(it.hint) + '</div>' : '';
    var msg = S.msg ? '<div class="banner banner-warn" role="status">' + esc(S.msg) + '</div>' : '';
    return '<div class="head"><div class="pill pill-amber">Сапёр ошибок</div><h1 class="h1">Проверь решение</h1>' +
      '<p class="lead">' + esc(it.who + ' ' + it.verb + ' ответ «') + '<b style="color:var(--ink)">' + m7(it.final) + '</b>' + esc('». Нажми на строку с ошибкой. Если ошибки нет, так и скажи.') + '</p></div>' +
      '<div><div class="foot" style="margin-bottom:8px"><span class="label">Решение: ' + esc(it.who) + '</span><span class="label" style="display:flex;align-items:center;gap:6px">Попытки ' + O.dots(S.attempts, 3, 'amber') + '</span></div>' +
      '<div class="rows">' + rows + '</div></div>' + hintBox + msg +
      '<div class="foot spacer" style="gap:10px"><button class="btn-small" style="flex:1;justify-content:center" data-act="no-error7">Ошибки нет</button>' +
      '<button class="btn-small" style="flex:1;justify-content:center" data-act="saper-hint7"' + (S.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button></div>';
  }

  function saperFix(it) {
    var letters = ['А', 'Б', 'В'], ctx = '';
    for (var i = 0; i <= it.err; i++) {
      var bad = i === it.err;
      ctx += '<div class="srow is-quiet' + (bad ? ' is-err' : '') + '"><span class="num">' + (i + 1) + '</span><span class="sx">' + m7(it.steps[i]) + '</span>' + (bad ? '<span class="stag">Ошибка здесь</span>' : '') + '</div>';
    }
    var opts = it.fixes.map(function (f, i) {
      var wrong = S.wrongFix.indexOf(i) >= 0;
      return '<div style="display:flex;flex-direction:column;gap:6px"><button class="opt' + (wrong ? ' is-wrong' : '') + '" data-act="fix7" data-i="' + i + '"' + (wrong ? ' disabled' : '') +
        ' aria-label="Вариант ' + letters[i] + ': ' + esc(p7(f.s)) + '"><span class="opt-letter">' + letters[i] + '</span><span class="sx">' + m7(f.s) + '</span></button>' +
        (wrong ? '<div class="opt-note" role="status">' + esc(f.note) + '</div>' : '') + '</div>';
    }).join('');
    var hintBox = S.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + esc(L.TRAPS7[it.trap].rule) + '</div>' : '';
    return '<div class="head"><div class="pill pill-amber">Сапёр ошибок</div><h1 class="h1 sm">Нашёл! Теперь почини строку ' + (it.err + 1) + '</h1>' +
      '<p class="lead">Какая строка должна стоять на её месте?</p></div>' +
      '<div class="rows" style="gap:8px">' + ctx + '</div>' +
      '<div class="opts" role="group" aria-label="Варианты исправления"><div class="label">Выбери верную строку ' + (it.err + 1) + '</div>' + opts + '</div>' + hintBox +
      '<div class="foot spacer"><button class="btn-small" data-act="saper-hint7"' + (S.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Без подсказки<br>+10 очков</div></div>';
  }

  function saperResult(it) {
    var hasErr = it.err !== null, sc = S.res.sc;
    var trap = hasErr ? L.TRAPS7[it.trap] : null;
    var hero, sub = '', ans = m7(it.answer);
    if (hasErr && S.found && S.fixedOk) { hero = ['ok', 'Мина обезврежена!']; sub = 'Правильный ответ: ' + ans; }
    else if (hasErr && S.found) { hero = ['warn', 'Ошибку нашёл, исправим вместе']; sub = 'Правильный ответ: ' + ans; }
    else if (hasErr) { hero = ['warn', 'Ловушка осталась']; sub = 'Ошибка была в строке ' + (it.err + 1) + '. Правильный ответ: ' + ans; }
    else if (S.found) { hero = ['ok', 'Решение верное!']; sub = 'Ошибки нет, ответ: ' + ans; }
    else { hero = ['warn', 'Решение было верным']; sub = 'Ошибки не было, ответ: ' + ans; }
    var rows = it.solution.map(function (s, i) {
      var fixed = hasErr && i === it.err;
      return '<div class="srow' + (fixed ? ' is-fixed' : '') + '"><span class="sx">' + m7(s) + '</span>' + (fixed ? '<span class="stag">исправлено</span>' : '') + '</div>';
    }).join('');
    var pr = hasErr
      ? [{ label: 'Нашёл ошибку', pts: sc.find }, { label: 'Исправил', pts: sc.fix }, { label: 'Без подсказки', pts: sc.noHint }]
      : [{ label: 'Проверил решение', pts: sc.find }, { label: 'Без подсказки', pts: sc.noHint }];
    var found = L.catalogFound7(O.stats), total = L.trapCount7();
    var parent = hasErr
      ? 'В отчёт родителю попадёт запись: «' + trap.name + '» — ' + (S.foundFirst && S.fixedOk ? 'найдена с первой попытки.' : 'нужна ещё тренировка.')
      : 'Проверка верного решения тренирует внимательность: не каждое решение с ошибкой.';
    var last = S.i + 1 >= S.items.length;
    return '<div class="hero"><div class="badge badge-' + hero[0] + ' pop">' + (hero[0] === 'ok' ? ICON.check(36) : ICON.excl) + '</div><h1 class="h1" style="font-size:28px">' + esc(hero[1]) + '</h1><div class="hero-sub" style="font-size:18px">' + sub + '</div></div>' +
      '<section class="card sol"><div class="label">Верное решение</div>' + rows + '</section>' +
      (hasErr ? '<section class="note note-amber"><div class="note-t">Ловушка: ' + esc(trap.name) + '</div><div>' + esc(trap.rule) + '</div></section>' : '') +
      O.breakdown(pr, sc.total) +
      '<section class="card" style="display:flex;flex-direction:column;gap:10px"><div class="foot"><span class="label" style="color:var(--ink)">Каталог ловушек</span><span class="label">' + found + ' из ' + total + '</span></div>' +
      '<div class="bar"><div class="bar-fill amber" style="width:' + Math.round(found / total * 100) + '%"></div></div><div class="hint">' + esc(parent) + '</div></section>' +
      '<button class="btn btn-primary spacer" data-act="saper-next7" data-primary>' + (last ? 'Показать итог' : 'Следующее решение') + '</button>';
  }

  function saperTap(i) {
    if (!S || S.stage !== 'find') return;
    var it = curS();
    if (i < 1 || i >= it.steps.length || S.okRows.indexOf(i) >= 0) return;
    if (i === it.err) {
      S.found = true; S.foundFirst = S.wrongTaps.length === 0; S.stage = 'fix'; S.msg = '';
      O.announce('Верно, ошибка в этой строке');
      renderSaper7();
      return;
    }
    S.wrongTaps.push(i); S.okRows.push(i); S.attempts--; S.shakeRow = i;
    S.msg = 'В строке ' + (i + 1) + ' ошибки нет.';
    O.announce(S.msg);
    if (S.attempts <= 0) finishSaper(); else renderSaper7();
  }
  function saperNoError() {
    if (!S || S.stage !== 'find') return;
    var it = curS();
    if (it.err === null) { S.found = true; S.foundFirst = S.wrongTaps.length === 0; finishSaper(); return; }
    S.wrongTaps.push('none'); S.attempts--;
    S.msg = 'Ошибка в этом решении есть. Найди строку, где всё пошло не так.';
    O.announce(S.msg);
    if (S.attempts <= 0) finishSaper(); else renderSaper7();
  }
  function saperFixPick(i) {
    if (!S || S.stage !== 'fix') return;
    var it = curS(), f = it.fixes[i];
    if (!f || S.wrongFix.indexOf(i) >= 0) return;
    if (f.ok) { S.fixedOk = true; finishSaper(); return; }
    S.wrongFix.push(i);
    O.announce(f.note);
    if (S.wrongFix.length >= 2) finishSaper(); else renderSaper7();
  }
  function finishSaper() {
    var it = curS();
    var sc = L.scoreSaper({ hasError: it.err !== null, foundOk: S.found, fixOk: S.fixedOk, wrongTaps: S.wrongTaps.length, wrongFix: S.wrongFix.length, hint: S.hint });
    S.points += sc.total;
    if (S.found) S.foundCount++;
    if (S.foundFirst && (it.err === null || S.fixedOk)) S.firstCount++;
    if (it.trap && S.found && S.trapsFound.indexOf(it.trap) < 0) S.trapsFound.push(it.trap);
    L.recordSaper7(O.stats, it, { found: S.found, foundFirst: S.foundFirst, fixedOk: S.fixedOk, points: sc.total });
    O.saveStats();
    S.res = { sc: sc };
    S.stage = 'result';
    renderSaper7();
  }
  function saperNext() {
    if (S.i + 1 >= S.items.length) {
      var st = O.stats; T();
      var prev = st.best.saper7;
      st.rounds.saper7++;
      if (S.points > prev) { st.best.saper7 = S.points; S.newBest = prev > 0; }
      O.saveStats();
      S.stage = 'end';
    } else { S.i++; resetItem(); }
    renderSaper7();
  }
  function renderSaperEnd() {
    var n = S.items.length;
    var names = S.trapsFound.map(function (k) { return L.TRAPS7[k].name; });
    app.innerHTML =
      '<div class="hero" style="padding-top:20px"><div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Раунд завершён</h1>' +
      '<div class="hero-sub">' + S.points + ' очков' + (S.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + S.foundCount + ' из ' + n + '</div><div class="k">решений разобрано</div></div>' +
      '<div class="stat"><div class="v">' + S.firstCount + ' из ' + n + '</div><div class="k">с первой попытки</div></div>' +
      '<div class="stat"><div class="v">' + S.trapsFound.length + '</div><div class="k">ловушек найдено</div></div>' +
      '<div class="stat"><div class="v">' + L.catalogFound7(O.stats) + ' из ' + L.trapCount7() + '</div><div class="k">в каталоге</div></div></div>' +
      (names.length ? '<section class="note note-amber"><div class="note-t">Сегодня обезврежено</div><ul class="list" style="margin-top:4px">' + names.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' : '') +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="start-saper7" data-primary>Сыграть ещё</button>' +
      '<button class="btn btn-ghost" data-act="start-prik7">Прикидка</button><button class="btn btn-ghost" data-act="home7">В задание 7</button></div>';
    O.postRender();
  }

  /* ================== ОТЧЁТ ДЛЯ РОДИТЕЛЯ (блок задания 7) ================== */
  O.report7Body = function () {
    var st = O.stats, t = T(), r = st.rounds;
    var rounds = Object.keys(r).reduce(function (sum, k) { return /7$/.test(k) ? sum + (r[k] || 0) : sum; }, 0), est = O.pct(t.estimate.ok, t.estimate.total);
    var skillRows = Object.keys(L.SKILLS7).map(function (id) {
      var s = st.skills[id] || { ok: 0, total: 0 }, p = O.pct(s.ok, s.total);
      var cls = p === null ? '' : p >= 80 ? 'good' : p >= 60 ? 'mid' : 'low';
      return '<div class="skill"><div class="skill-top"><span>' + esc(L.SKILLS7[id]) + '</span><span>' + (p === null ? 'нет данных' : s.ok + ' из ' + s.total) + '</span></div>' +
        '<div class="bar"><div class="bar-fill ' + cls + '" style="width:' + (p || 0) + '%"></div></div></div>';
    }).join('');
    var weak = Object.keys(L.SKILLS7).filter(function (id) { var s = st.skills[id]; return s && s.total >= 3 && O.pct(s.ok, s.total) < 70; });
    var missed = Object.keys(L.TRAPS7).filter(function (k) { var x = st.traps[k]; return x && x.seen >= 2 && x.first / x.seen < 0.5; });
    var recs = [];
    if (!rounds) recs.push('Сыграйте хотя бы один раунд в задании 7, и здесь появятся выводы.');
    if (weak.length) recs.push('Стоит потренировать: ' + weak.map(function (k) { return L.SKILLS7[k].toLowerCase(); }).join('; ') + '.');
    if (missed.length) recs.push('Часто не замечает ошибку: ' + missed.map(function (k) { return '«' + L.TRAPS7[k].name.toLowerCase() + '»'; }).join('; ') + '.');
    if (rounds && !weak.length && !missed.length) recs.push('Слабых мест в задании 7 пока не видно. Попробуйте уровень с корнями ★.');
    var trapRows = Object.keys(L.TRAPS7).map(function (k) {
      var x = st.traps[k];
      return '<li><b>' + esc(L.TRAPS7[k].name) + '</b>: ' + (x && x.seen ? 'найдена ' + x.found + ' из ' + x.seen + (x.found ? '' : ', пока не замечает') : 'ещё не встречалась') + '</li>';
    }).join('');
    var MN = [['numline', 'Числовая прямая'], ['ws', 'Мастерская сравнений'], ['signs', 'Знаки и шкала'], ['loupe', 'Лупа']];
    var modeRows = MN.map(function (m) {
      var x = (t.modes && t.modes[m[0]]) || { ok: 0, total: 0 }, p = O.pct(x.ok, x.total);
      var cls = p === null ? '' : p >= 80 ? 'good' : p >= 60 ? 'mid' : 'low';
      return '<div class="skill"><div class="skill-top"><span>' + m[1] + '</span><span>' + (p === null ? 'нет данных' : x.ok + ' из ' + x.total) + '</span></div>' +
        '<div class="bar"><div class="bar-fill ' + cls + '" style="width:' + (p || 0) + '%"></div></div></div>';
    }).join('');
    return '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + t.points + '</div><div class="k">очков в задании 7</div></div>' +
      '<div class="stat"><div class="v">' + rounds + '</div><div class="k">раундов сыграно</div></div>' +
      '<div class="stat"><div class="v">' + (est === null ? '—' : est + '%') + '</div><div class="k">верных прикидок</div></div>' +
      '<div class="stat"><div class="v">' + L.catalogFound7(st) + ' из ' + L.trapCount7() + '</div><div class="k">ловушек в каталоге</div></div></div>' +
      '<section class="card"><div class="label">Навыки: ответы с первой попытки</div><div style="margin-top:6px">' + skillRows + '</div></section>' +
      '<section class="card"><div class="label">Режимы «Числовая прямая», «Мастерская», «Знаки», «Лупа»: с первой попытки</div><div style="margin-top:6px">' + modeRows + '</div></section>' +
      '<section class="note note-primary"><div class="note-t">Что делать дальше</div><ul class="list">' + recs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="card"><div class="label">Типичные ловушки</div><ul class="list" style="margin-top:8px">' + trapRows + '</ul></section>' +
      (O.sprintReport ? O.sprintReport(7) : '');
  };

  /* ================== события ================== */
  O.screens.home7 = renderHome7;
  O.screens.prik7 = renderPrik7;
  O.screens.saper7 = renderSaper7;
  Object.assign(O.ACT, {
    home7: function () { O.go('home7'); },
    grade7: function (d) { O.stats.grade = Number(d.grade); O.saveStats(); O.go('home7'); },
    roots7: function (d) { T().roots = d.v === '1'; O.saveStats(); O.go('home7'); },
    'start-prik7': startPrik7,
    'start-saper7': startSaper7,
    pick7: function (d) { prikPick(Number(d.i)); },
    'est-next7': function () { P.stage = 'answer'; renderPrik7(); },
    hint7: function () { if (P) { P.hint = true; renderPrik7(); } },
    ans7: function (d) { prikAns(Number(d.i)); },
    'fix-ans7': function () { P.stage = 'answer'; P.msg = ''; renderPrik7(); },
    'show-how7': function () { P.how = true; P.hint = true; renderPrik7(); },
    'prik-next7': prikNext,
    step7: function (d) { saperTap(Number(d.i)); },
    'no-error7': saperNoError,
    'saper-hint7': function () { if (S) { S.hint = true; renderSaper7(); } },
    fix7: function (d) { saperFixPick(Number(d.i)); },
    'saper-next7': saperNext
  });

  O.keyHandlers.push(function (e, k) {
    var scr = O.screen;
    if (scr === 'prik7' && P) {
      if (P.stage === 'estimate' && /^[1-3]$/.test(k)) { prikPick(Number(k) - 1); return true; }
      if (P.stage === 'answer' && /^[1-4]$/.test(k)) { prikAns(Number(k) - 1); return true; }
    }
    if (scr === 'saper7' && S) {
      if (S.stage === 'find' && /^[1-9]$/.test(k)) { saperTap(Number(k) - 1); return true; }
      if (S.stage === 'fix' && /^[1-3]$/.test(k)) { saperFixPick(Number(k) - 1); return true; }
    }
    return false;
  });
  O.t7ui = { m7: m7, p7: p7, T: T, topbar7: topbar7, soundBtn: soundBtn, home: renderHome7 };
})();
