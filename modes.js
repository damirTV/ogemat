/* Вычисления без ошибок: режимы «Числовая прямая» и «Мастерская превращений». */
(function () {
  'use strict';
  var O = window.OGE, L = O.L, app = O.app, esc = O.esc, math = O.math, ICON = O.ICON;
  var R = null; // состояние текущего раунда нового режима

  var SVG_W = 320, X0 = 24, X1 = 296;

  function cur() { return R.tasks[R.i]; }
  function fr(k, d) { return '[' + k + '/' + d + ']'; }

  /* Число k/d в виде подписи: дробью или десятичной, как в задании */
  function readout(t, k) {
    var useFrac = t.kind === 'place_frac' || (t.label && t.label.indexOf('[') >= 0);
    if (!useFrac) return math(L.fmt(k / t.d));
    var sign = k < 0 ? L.MINUS : '', a = Math.abs(k), n = Math.floor(a / t.d), r = a % t.d;
    if (r === 0) return esc(sign + n);
    return sign + (n > 0 ? esc(n + ' ') : '') + math(fr(r, t.d));
  }

  function lineSVG(t, sel, mark) {
    var N = t.maxK - t.minK;
    function X(k) { return X0 + (k - t.minK) / N * (X1 - X0); }
    var g = '<line x1="' + (X0 - 8) + '" y1="56" x2="' + (X1 + 8) + '" y2="56" stroke="#B9B0A0" stroke-width="3" stroke-linecap="round"/>';
    for (var k = t.minK; k <= t.maxK; k++) {
      var major = k % t.d === 0, x = X(k);
      g += '<line x1="' + x + '" y1="' + (major ? 44 : 49) + '" x2="' + x + '" y2="' + (major ? 68 : 63) + '" stroke="#B9B0A0" stroke-width="' + (major ? 3 : 2) + '"/>';
      if (major) g += '<text x="' + x + '" y="92" text-anchor="middle" fill="#5A5F7A" font-size="15" font-weight="700">' + esc(L.fmt(k / t.d)) + '</text>';
    }
    var pins = '';
    (mark || []).forEach(function (m, mi) {
      var anchor = 'middle';
      if (mark.length > 1) anchor = (m.k < mark[1 - mi].k) ? 'end' : 'start';
      pins += '<g><circle cx="' + X(m.k) + '" cy="56" r="10" fill="' + m.color + '"/>' +
        '<text x="' + (X(m.k) + (anchor === 'end' ? 6 : anchor === 'start' ? -6 : 0)) + '" y="30" text-anchor="' + anchor + '" fill="' + m.ink + '" font-size="13" font-weight="800">' + esc(m.text) + '</text></g>';
    });
    var pin = sel === null || sel === undefined ? '' :
      '<g id="pin" transform="translate(' + X(sel) + ',0)"><circle cx="0" cy="56" r="11" fill="#4F3FF0" stroke="#fff" stroke-width="3"/></g>';
    return '<svg viewBox="0 0 ' + SVG_W + ' 104" role="img" aria-label="Числовая прямая от ' + L.fmt(t.min) + ' до ' + L.fmt(t.max) +
      ', ' + N + ' делений" id="nl" style="touch-action:none">' + g + pins + pin + '</svg>';
  }

  /* ===== общие экраны ===== */
  function modeName() { return R.mode === 'numline' ? 'Числовая прямая' : 'Мастерская превращений'; }
  function frame(body) {
    var n = R.tasks.length, done = R.stage === 'result' ? R.i + 1 : R.i;
    app.innerHTML = O.topbar('Задание ' + (R.i + 1) + ' из ' + n, Math.round(done / n * 100), R.points) + body;
    O.postRender();
  }
  function finishTask(ok, sc, firstTry) {
    R.points += sc.total;
    if (firstTry) R.firstCount++;
    if (ok) R.okCount++;
    L.recordSimple(O.stats, cur(), { firstTry: firstTry, points: sc.total });
    O.saveStats();
    R.stage = 'result';
  }
  function nextTask() {
    var st = O.stats, key = R.mode === 'numline' ? 'numline' : 'conversion';
    if (R.i + 1 >= R.tasks.length) {
      var prev = st.best[key];
      st.rounds[key]++;
      if (R.points > prev) { st.best[key] = R.points; R.newBest = prev > 0; }
      O.saveStats();
      R.stage = 'end';
    } else {
      R.i++;
      resetTask();
    }
    render();
  }
  function resetTask() {
    R.stage = 'play'; R.sel = null; R.wrong = 0; R.msg = ''; R.hint = false; R.chosen = []; R.res = null; R.lastWrong = null;
    var t = cur();
    R.cur = t.type === 'workshop' ? { a: t.start.a, b: t.start.b } : null;
    R.chain = [];
  }
  function render() { if (R.stage === 'end') renderEnd(); else if (R.mode === 'numline') renderNumline(); else renderWs(); }

  function renderEnd() {
    var n = R.tasks.length, key = R.mode === 'numline' ? 'numline' : 'conversion';
    var again = R.mode === 'numline' ? 'start-numline' : 'start-ws';
    var other = R.mode === 'numline' ? ['start-ws', 'Мастерская превращений'] : ['start-numline', 'Числовая прямая'];
    var a = R.mode === 'numline' ? 'задач решено верно' : 'цепочек выполнено';
    var note = R.firstCount === n
      ? '<section class="note note-primary"><div class="note-t">Отличный раунд</div><div>Все задания с первой попытки' + (R.mode === 'ws' ? ' и самыми короткими цепочками' : '') + '.</div></section>'
      : '<section class="note note-amber"><div class="note-t">Что повторить</div><div>' + (R.mode === 'numline'
        ? 'Перед тем как отмечать число, прикинь, между какими целыми оно лежит, и посчитай деления.'
        : 'Ищи самый большой удобный множитель или делитель: он сокращает цепочку.') + '</div></section>';
    app.innerHTML =
      '<div class="hero" style="padding-top:20px"><div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Раунд завершён</h1>' +
      '<div class="hero-sub">' + R.points + ' очков' + (R.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + R.okCount + ' из ' + n + '</div><div class="k">' + a + '</div></div>' +
      '<div class="stat"><div class="v">' + R.firstCount + ' из ' + n + '</div><div class="k">' + (R.mode === 'numline' ? 'с первой попытки' : 'самой короткой цепочкой') + '</div></div>' +
      '<div class="stat"><div class="v">' + O.stats.best[key] + '</div><div class="k">лучший счёт</div></div>' +
      '<div class="stat"><div class="v">' + O.stats.rounds[key] + '</div><div class="k">раундов в этом режиме</div></div></div>' + note +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="' + again + '" data-primary>Сыграть ещё</button>' +
      '<button class="btn btn-ghost" data-act="' + other[0] + '">' + other[1] + '</button><button class="btn btn-ghost" data-act="home">На главную</button></div>';
    O.postRender();
  }
  function resultHero(ok, okText, failText) {
    return '<div class="hero">' + (ok
      ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">' + okText[0] + '</h1><div class="hero-sub">' + okText[1] + '</div>'
      : '<div class="badge badge-warn pop">' + ICON.excl + '</div><h1 class="h1">' + failText[0] + '</h1><div class="hero-sub">' + failText[1] + '</div>') + '</div>';
  }
  function nextBtn() {
    return '<button class="btn btn-primary spacer" data-act="mode-next" data-primary>' + (R.i + 1 >= R.tasks.length ? 'Показать итог' : 'Следующее задание') + '</button>';
  }

  /* ================== ЧИСЛОВАЯ ПРЯМАЯ ================== */
  function startNumline() {
    R = { mode: 'numline', tasks: L.makeNumlineRound(O.stats.grade, 5), i: 0, points: 0, okCount: 0, firstCount: 0, newBest: false };
    resetTask();
    O.go('numline');
  }

  function renderNumline() {
    var t = cur();
    if (t.type === 'place') frame(R.stage === 'result' ? placeResult(t) : placePlay(t));
    else frame(R.stage === 'result' ? orderResult(t) : orderPlay(t));
  }

  function placePlay(t) {
    var isExpr = t.kind === 'place_expr';
    var hintBox = R.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + math(t.hint) + '</div>' : '';
    var msg = R.msg ? '<div class="banner banner-warn" id="msg">' + esc(R.msg) + '</div>' : '';
    var has = R.sel !== null;
    return '<div class="head"><div class="pill pill-primary">Числовая прямая</div><h1 class="h1">' + (isExpr ? 'Где значение выражения?' : 'Отметь число на прямой') + '</h1>' +
      '<p class="lead">Нажми на прямую или двигай метку стрелками. Попытка ' + (R.wrong + 1) + ' из 2.</p></div>' +
      '<section class="card task"><div class="kicker">' + (isExpr ? 'Вычисли и отметь значение' : 'Отметь число') + '</div><div class="expr">' + math(t.label) + '</div></section>' +
      '<div class="card nline" id="nlbox">' + lineSVG(t, R.sel) + '</div>' + hintBox + msg +
      '<div class="nudge"><button class="btn-small" data-act="nl-left" aria-label="Левее">◀ левее</button>' +
      '<div class="readout" id="readout" aria-live="polite">' + (has ? 'Метка: ' + readout(t, R.sel) : '<span class="ph">Метка не поставлена</span>') + '</div>' +
      '<button class="btn-small" data-act="nl-right" aria-label="Правее">правее ▶</button></div>' +
      '<div class="foot spacer"><button class="btn-small" data-act="mode-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Без ошибок и подсказки<br>+25 очков</div></div>' +
      '<button class="btn btn-primary" id="nlcheck" data-act="nl-check" data-primary' + (has ? '' : ' disabled') + '>Проверить</button>';
  }
  function setSel(k) {
    var t = cur();
    k = Math.max(t.minK, Math.min(t.maxK, k));
    R.sel = k; R.msg = '';
    var svg = document.getElementById('nl');
    if (!svg) return;
    var pin = document.getElementById('pin');
    var x = X0 + (k - t.minK) / (t.maxK - t.minK) * (X1 - X0);
    if (!pin) { svg.insertAdjacentHTML('beforeend', '<g id="pin"><circle cx="0" cy="56" r="11" fill="#4F3FF0" stroke="#fff" stroke-width="3"/></g>'); pin = document.getElementById('pin'); }
    pin.setAttribute('transform', 'translate(' + x + ',0)');
    var ro = document.getElementById('readout'); if (ro) ro.innerHTML = 'Метка: ' + readout(t, k);
    var b = document.getElementById('nlcheck'); if (b) b.disabled = false;
    var m = document.getElementById('msg'); if (m) m.parentNode.removeChild(m);
  }
  function nudge(dir) {
    var t = cur(); if (!R || t.type !== 'place' || R.stage !== 'play') return;
    if (R.sel === null) setSel(Math.round((t.minK + t.maxK) / 2)); else setSel(R.sel + dir);
  }
  function nlCheck() {
    var t = cur();
    if (R.sel === null) return;
    if (L.checkPlace(t, R.sel)) {
      var sc = L.scoreNumline({ type: 'place', ok: true, wrong: R.wrong, hint: R.hint });
      R.res = { ok: true, sc: sc };
      finishTask(true, sc, R.wrong === 0);
    } else {
      R.wrong++;
      R.lastWrong = R.sel;
      if (R.wrong >= 2) {
        var sc2 = L.scoreNumline({ type: 'place', ok: false, wrong: R.wrong, hint: R.hint });
        R.res = { ok: false, sc: sc2 };
        finishTask(false, sc2, false);
      } else {
        R.msg = (R.sel < t.k ? 'Не совсем. Нужное число правее.' : 'Не совсем. Нужное число левее.') + ' Попробуй ещё раз.';
        O.announce(R.msg);
      }
    }
    render();
  }
  function placeResult(t) {
    var r = R.res;
    var marks = [{ k: t.k, color: '#2FB383', ink: '#0F6B4E', text: 'Здесь' }];
    if (!r.ok || R.lastWrong !== null) if (R.lastWrong !== null && R.lastWrong !== t.k) marks.push({ k: R.lastWrong, color: '#E5484D', ink: '#A8232C', text: 'Твоя' });
    var rows = [
      { label: 'Число отмечено верно' + (r.ok && R.wrong === 1 ? ' (со 2-й попытки)' : ''), pts: r.sc.base },
      { label: 'Без подсказки', pts: r.sc.noHint }
    ];
    return resultHero(r.ok, ['Верно!', math(t.label) + (t.kind === 'place_expr' ? ' = ' + readout(t, t.k) : '')],
        ['Не получилось', 'Правильный ответ: ' + readout(t, t.k)]) +
      '<div class="card nline">' + lineSVG(t, null, marks) + '</div>' + O.breakdown(rows, r.sc.total) +
      '<section class="note note-primary"><div class="note-t">Как найти</div><div>' + math(t.hint) + '</div></section>' + nextBtn();
  }

  function orderPlay(t) {
    var letters = ['А', 'Б', 'В', 'Г'];
    var opts = t.items.map(function (it, i) {
      var pos = R.chosen.indexOf(it.id), cls = 'opt', dis = '';
      if (pos >= 0) { cls += ' is-correct'; dis = ' disabled'; }
      return '<button class="' + cls + (R.lastWrong === it.id ? ' shake' : '') + '" data-act="ord-pick" data-id="' + it.id + '"' + dis + '>' +
        '<span class="opt-letter">' + (pos >= 0 ? (pos + 1) : letters[i]) + '</span><span class="expr-inline">' + math(it.label) + '</span></button>';
    }).join('');
    var seq = '<div class="seq" aria-label="Порядок">' + [0, 1, 2, 3].map(function (i) {
      var id = R.chosen[i];
      return (i ? '<span class="lt">&lt;</span>' : '') + '<span class="slot' + (id !== undefined ? ' is-on' : '') + '">' + (id !== undefined ? math(t.items[id].label) : '?') + '</span>';
    }).join('') + '</div>';
    var hintBox = R.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + math(t.hint) + '</div>' : '';
    var msg = R.msg ? '<div class="banner banner-warn" id="msg">' + esc(R.msg) + '</div>' : '';
    return '<div class="head"><div class="pill pill-primary">Числовая прямая</div><h1 class="h1">Расставь по порядку</h1>' +
      '<p class="lead">Нажимай числа от меньшего к большему. Сначала самое маленькое.</p></div>' + seq + hintBox + msg +
      '<div class="opts" role="group" aria-label="Числа"><div class="label">Какое число следующее?</div>' + opts + '</div>' +
      '<div class="foot spacer"><button class="btn-small" data-act="mode-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Без ошибок<br>+25 очков</div></div>';
  }
  function ordPick(id) {
    var t = cur();
    if (!R || R.mode !== 'numline' || t.type !== 'order' || R.stage !== 'play' || R.chosen.indexOf(id) >= 0) return;
    if (L.checkOrderTap(t, R.chosen, id)) {
      R.chosen.push(id); R.msg = ''; R.lastWrong = null;
      if (R.chosen.length === t.items.length) {
        var sc = L.scoreNumline({ type: 'order', ok: true, wrong: R.wrong, hint: R.hint });
        R.res = { ok: true, sc: sc };
        finishTask(true, sc, R.wrong === 0);
      }
    } else {
      R.wrong++; R.lastWrong = id;
      R.msg = 'Это число не самое маленькое из оставшихся. Сравни ещё раз.';
      O.announce(R.msg);
    }
    render();
  }
  function orderResult(t) {
    var r = R.res;
    var sorted = t.items.slice().sort(function (a, b) { return a.value - b.value; });
    var rows = [
      { label: 'Порядок расставлен' + (R.wrong ? ' (ошибок: ' + R.wrong + ')' : ''), pts: r.sc.base },
      { label: 'Без подсказки и ошибок', pts: r.sc.noHint }
    ];
    return resultHero(true, ['Верно!', 'Числа расставлены от меньшего к большему'], ['', '']) +
      '<section class="card"><div class="seq">' + sorted.map(function (it, i) {
        return (i ? '<span class="lt">&lt;</span>' : '') + '<span class="slot is-on">' + math(it.label) + '</span>';
      }).join('') + '</div></section>' + O.breakdown(rows, r.sc.total) +
      '<section class="note note-primary"><div class="note-t">Как сравнивать</div><div>' + math(t.hint) + '</div></section>' + nextBtn();
  }

  /* ================== МАСТЕРСКАЯ ПРЕВРАЩЕНИЙ ================== */
  function startWs() {
    R = { mode: 'ws', tasks: L.makeWorkshopRound(O.stats.grade, 5), i: 0, points: 0, okCount: 0, firstCount: 0, newBest: false };
    resetTask();
    O.go('ws');
  }
  function fracHTML(s) { return math('{' + s.a + '|' + s.b + '}'); }
  function opLabel(t, k) { return (t.mode === 'mul' ? '×' : '÷') + k; }

  function renderWs() {
    var t = cur();
    frame(R.stage === 'result' ? wsResult(t) : wsPlay(t));
  }
  function wsPlay(t) {
    var mul = t.mode === 'mul';
    var best = L.workshopMin(t, R.cur);
    var blocks = t.ops.map(function (k, i) {
      var can = !!L.workshopApply(t, R.cur, k);
      var isHint = R.hint && best.op === k;
      return '<button class="block' + (isHint ? ' is-hint' : '') + '" data-act="ws-op" data-k="' + k + '"' + (can ? '' : ' disabled') + ' aria-label="' + (mul ? 'Умножить числитель и знаменатель на ' : 'Разделить числитель и знаменатель на ') + k + '">' +
        '<span class="block-k">' + opLabel(t, k) + '</span><span class="block-n">' + (i + 1) + '</span></button>';
    }).join('');
    var trail = '<div class="trail"><span class="st">' + fracHTML(t.start) + '</span>';
    var s = { a: t.start.a, b: t.start.b };
    R.chain.forEach(function (k) {
      s = L.workshopApply(t, s, k);
      trail += '<span class="arr">' + opLabel(t, k) + '</span><span class="st">' + fracHTML(s) + '</span>';
    });
    trail += '</div>';
    var goalText = mul ? 'Получи в знаменателе 10, 100 или 1000.' : 'Сокращай, пока дробь не станет несократимой.';
    var hintBox = R.hint ? '<div class="banner banner-info"><b>Подсказка.</b> Подсвеченный блок ведёт к самой короткой цепочке (осталось шагов: ' + best.dist + ').</div>' : '';
    var startLine = mul ? math(t.label) : esc(t.label) + ' = ' + fracHTML(t.start);
    return '<div class="head"><div class="pill pill-amber">Мастерская превращений</div><h1 class="h1">' + (mul ? 'Преврати в десятичную дробь' : 'Преврати в обыкновенную дробь') + '</h1>' +
      '<p class="lead">' + goalText + ' Блок действует на числитель и знаменатель сразу.</p></div>' +
      '<section class="card task"><div class="kicker">' + esc(t.title) + '</div><div class="expr">' + startLine + '</div></section>' +
      '<section class="card ws-now"><div class="label">Сейчас</div><div class="ws-big" id="wsnow">' + fracHTML(R.cur) + '</div>' + trail + '</section>' +
      hintBox +
      '<div class="blocks" role="group" aria-label="Блоки">' + blocks + '</div>' +
      '<div class="foot spacer"><button class="btn-small" data-act="mode-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button>' +
      '<button class="btn-small" data-act="ws-undo"' + (R.chain.length ? '' : ' disabled') + '>↶ Отменить шаг</button></div>' +
      '<div class="hint">Шагов: ' + R.chain.length + '. Самая короткая цепочка даёт 25 очков.</div>';
  }
  function wsOp(k) {
    var t = cur();
    if (!R || R.mode !== 'ws' || R.stage !== 'play') return;
    var nx = L.workshopApply(t, R.cur, k);
    if (!nx) return;
    R.cur = nx; R.chain.push(k);
    if (L.workshopDone(t, nx)) {
      var sc = L.scoreWorkshop({ steps: R.chain.length, min: t.min, hint: R.hint });
      R.res = { sc: sc, steps: R.chain.length };
      finishTask(true, sc, R.chain.length === t.min);
    }
    render();
  }
  function wsUndo() {
    var t = cur();
    if (!R || R.mode !== 'ws' || R.stage !== 'play' || !R.chain.length) return;
    R.chain.pop();
    var s = { a: t.start.a, b: t.start.b };
    R.chain.forEach(function (k) { s = L.workshopApply(t, s, k); });
    R.cur = s;
    render();
  }
  function wsResult(t) {
    var r = R.res, mul = t.mode === 'mul', best = r.steps === t.min;
    var answer = mul ? math(t.label) + ' = ' + esc(L.workshopDecimal(R.cur)) : esc(t.label) + ' = ' + fracHTML(R.cur);
    var rows = [
      { label: 'Цепочка из ' + r.steps + ' ' + stepsWord(r.steps) + (best ? ': самая короткая' : ' (самая короткая: ' + t.min + ')'), pts: r.sc.base },
      { label: 'Без подсказки', pts: r.sc.noHint }
    ];
    var trail = '<span class="st">' + fracHTML(t.start) + '</span>';
    var s = { a: t.start.a, b: t.start.b };
    R.chain.forEach(function (k) { s = L.workshopApply(t, s, k); trail += '<span class="arr">' + opLabel(t, k) + '</span><span class="st">' + fracHTML(s) + '</span>'; });
    var why = mul ? 'Знаменатель стал ' + R.cur.b + ', поэтому дробь записывается десятичной: ' + L.workshopDecimal(R.cur) + '.'
      : 'Числитель и знаменатель больше нельзя сократить, значит дробь несократимая.';
    return resultHero(true, ['Готово!', answer], ['', '']) +
      '<section class="card"><div class="label">Твоя цепочка</div><div class="trail" style="margin-top:8px">' + trail + '</div></section>' +
      O.breakdown(rows, r.sc.total) +
      '<section class="note note-primary"><div class="note-t">Что получилось</div><div>' + esc(why) + '</div></section>' + nextBtn();
  }
  function stepsWord(n) { var m = n % 10, h = n % 100; return m === 1 && h !== 11 ? 'шага' : (m >= 2 && m <= 4 && !(h >= 12 && h <= 14)) ? 'шагов' : 'шагов'; }

  /* ================== подключение к приложению ================== */
  O.screens.numline = function () { if (R && R.mode === 'numline') render(); else O.renderHome(); };
  O.screens.ws = function () { if (R && R.mode === 'ws') render(); else O.renderHome(); };
  Object.assign(O.ACT, {
    'start-numline': startNumline,
    'start-ws': startWs,
    'mode-next': function () { nextTask(); },
    'mode-hint': function () { R.hint = true; render(); },
    'nl-left': function () { nudge(-1); },
    'nl-right': function () { nudge(1); },
    'nl-check': nlCheck,
    'ord-pick': function (d) { ordPick(Number(d.id)); },
    'ws-op': function (d) { wsOp(Number(d.k)); },
    'ws-undo': wsUndo
  });

  /* Нажатие и перетаскивание по прямой */
  var dragging = false;
  function lineK(e) {
    var svg = document.getElementById('nl'); if (!svg) return null;
    var t = cur(), rect = svg.getBoundingClientRect();
    var vx = (e.clientX - rect.left) / rect.width * SVG_W;
    return t.minK + Math.round((vx - X0) / (X1 - X0) * (t.maxK - t.minK));
  }
  app.addEventListener('pointerdown', function (e) {
    if (!R || R.mode !== 'numline' || R.stage !== 'play' || cur().type !== 'place') return;
    var box = e.target.closest ? e.target.closest('#nlbox') : null;
    if (!box) return;
    dragging = true;
    try { box.setPointerCapture(e.pointerId); } catch (x) { /* ничего */ }
    setSel(lineK(e)); e.preventDefault();
  });
  app.addEventListener('pointermove', function (e) { if (dragging) { var k = lineK(e); if (k !== null && k !== R.sel) setSel(k); } });
  function stop() { dragging = false; }
  app.addEventListener('pointerup', stop);
  app.addEventListener('pointercancel', stop);

  O.keyHandlers.push(function (e, k) {
    if (!R) return false;
    if (O.screen === 'numline') {
      var t = cur();
      if (t.type === 'place' && R.stage === 'play') {
        if (k === 'ArrowLeft') { nudge(-1); return true; }
        if (k === 'ArrowRight') { nudge(1); return true; }
      } else if (t.type === 'order' && R.stage === 'play' && /^[1-4]$/.test(k)) { ordPick(t.items[Number(k) - 1].id); return true; }
    }
    if (O.screen === 'ws' && R.stage === 'play') {
      if (/^[1-5]$/.test(k)) { wsOp(cur().ops[Number(k) - 1]); return true; }
      if (k === 'Backspace') { wsUndo(); return true; }
    }
    return false;
  });

  window.__game2 = { get R() { return R; } };
  O.refresh();
})();
