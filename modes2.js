/* Вычисления без ошибок: режимы «Порядок действий» и «Рецептура». */
(function () {
  'use strict';
  var O = window.OGE, L = O.L, app = O.app, esc = O.esc, math = O.math, ICON = O.ICON;
  var R = null; // состояние текущего раунда

  function cur() { return R.tasks[R.i]; }
  function fr(k, d) { return '[' + k + '/' + d + ']'; }
  function gcd(a, b) { while (b) { var t = a % b; a = b; b = t; } return a; }

  /* ===== общий каркас раунда ===== */
  function frame(body) {
    var n = R.tasks.length, done = R.stage === 'result' ? R.i + 1 : R.i;
    app.innerHTML = O.topbar('Задание ' + (R.i + 1) + ' из ' + n, Math.round(done / n * 100), R.points) + body;
    O.postRender();
  }
  function finishTask(ok, sc, perfect) {
    R.points += sc.total;
    if (perfect) R.perfectCount++;
    if (ok) R.okCount++;
    L.recordSimple(O.stats, cur(), { firstTry: perfect, points: sc.total });
    O.saveStats();
    R.res = { ok: ok, sc: sc };
    R.stage = 'result';
  }
  function nextTask() {
    var st = O.stats, key = R.mode;
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
  function render() {
    if (R.stage === 'end') renderEnd();
    else if (R.mode === 'orderops') renderOO();
    else renderRC();
  }
  function renderEnd() {
    var n = R.tasks.length, oo = R.mode === 'orderops';
    var other = oo ? ['start-recipe', 'Рецептура'] : ['start-orderops', 'Порядок действий'];
    var note = R.perfectCount === n
      ? '<section class="note note-primary"><div class="note-t">Отличный раунд</div><div>Все задания без единой ошибки.</div></section>'
      : '<section class="note note-amber"><div class="note-t">Что повторить</div><div>' + (oo
        ? 'Перед вычислением подпиши номера действий над знаками: скобки, потом умножение и деление, потом сложение и вычитание.'
        : 'Ищи наименьший общий знаменатель: самое маленькое число, которое делится на оба знаменателя. С ним меньше считать и сокращать.') + '</div></section>';
    app.innerHTML =
      '<div class="hero" style="padding-top:20px"><div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Раунд завершён</h1>' +
      '<div class="hero-sub">' + R.points + ' очков' + (R.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + R.okCount + ' из ' + n + '</div><div class="k">верных ответов</div></div>' +
      '<div class="stat"><div class="v">' + R.perfectCount + ' из ' + n + '</div><div class="k">без единой ошибки</div></div>' +
      '<div class="stat"><div class="v">' + O.stats.best[R.mode] + '</div><div class="k">лучший счёт</div></div>' +
      '<div class="stat"><div class="v">' + O.stats.rounds[R.mode] + '</div><div class="k">раундов в этом режиме</div></div></div>' + note +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="start-' + R.mode + '" data-primary>Сыграть ещё</button>' +
      '<button class="btn btn-ghost" data-act="' + other[0] + '">' + other[1] + '</button><button class="btn btn-ghost" data-act="home">На главную</button></div>';
    O.postRender();
  }
  function hero(ok, title, sub) {
    return '<div class="hero">' + (ok ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div>' : '<div class="badge badge-warn pop">' + ICON.excl + '</div>') +
      '<h1 class="h1">' + title + '</h1><div class="hero-sub">' + sub + '</div></div>';
  }
  function nextBtn() {
    return '<button class="btn btn-primary spacer" data-act="m2-next" data-primary>' + (R.i + 1 >= R.tasks.length ? 'Показать итог' : 'Следующее задание') + '</button>';
  }
  function banners() {
    return (R.info ? '<div class="banner banner-info">' + R.info + '</div>' : '') +
      (R.msg ? '<div class="banner banner-warn" id="msg">' + esc(R.msg) + '</div>' : '');
  }

  /* ===== поле ответа и экранная клавиатура ===== */
  function fieldHTML(ph) {
    return '<div class="field' + (R.shake ? ' shake' : '') + '" id="m2field"><span id="m2text">' + (R.input ? esc(R.input) : '<span class="ph">' + esc(ph) + '</span>') +
      '</span><span class="caret" aria-hidden="true"></span></div>';
  }
  function keypadHTML(comma) {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', comma ? ',' : '', '0', 'back'];
    return '<div class="keypad" role="group" aria-label="Цифры">' + keys.map(function (k) {
      if (k === '') return '<span></span>';
      if (k === 'back') return '<button class="key" data-act="m2-key" data-k="back" aria-label="Стереть">' + ICON.back + '</button>';
      return '<button class="key" data-act="m2-key" data-k="' + k + '">' + k + '</button>';
    }).join('') + '</div>';
  }
  function inputActive() { return R && (R.stage === 'calc' || R.stage === 'den' || R.stage === 'num'); }
  function pressKey(k) {
    if (!inputActive()) return;
    var comma = R.stage === 'calc';
    if (k === 'back') R.input = R.input.slice(0, -1);
    else if (k === ',') { if (!comma || R.input.indexOf(',') >= 0) return; R.input += R.input === '' ? '0,' : ','; }
    else {
      if (R.input.replace(/\D/g, '').length >= 7) return;
      R.input = R.input === '0' ? k : R.input + k;
    }
    var tx = document.getElementById('m2text');
    if (tx) tx.innerHTML = R.input ? esc(R.input) : '<span class="ph">' + (R.stage === 'den' ? 'Знаменатель' : R.stage === 'num' ? 'Числитель' : 'Результат') + '</span>';
    var b = document.getElementById('m2check'); if (b) b.disabled = !R.input;
  }
  function checkBtn() { return '<button class="btn btn-primary" id="m2check" data-act="m2-check" data-primary' + (R.input ? '' : ' disabled') + '>Проверить</button>'; }

  /* ================== ПОРЯДОК ДЕЙСТВИЙ ================== */
  function startOO() {
    R = { mode: 'orderops', tasks: L.makeOrderOpsRound(O.stats.grade, 5), i: 0, points: 0, okCount: 0, perfectCount: 0, newBest: false };
    resetTask();
    O.go('orderops');
  }
  function resetTask() {
    var t = cur();
    R.stage = t.type === 'orderops' ? 'order' : (t.scaffold > 0 ? 'split' : 'den');
    R.done = []; R.wrongOrder = 0; R.lastWrong = null; R.calcIdx = 0; R.steps = [];
    R.tries = 0; R.input = ''; R.msg = ''; R.info = ''; R.hint = false; R.shake = false; R.res = null;
    R.m = [1, 1]; R.den = null; R.denRes = null; R.numRes = null; R.redRes = null; R.redOpts = null; R.redNote = '';
  }

  /* Запись выражения: знаки — кнопки (на этапе порядка) или текст */
  function exprHTML(t, done, opts) {
    opts = opts || {};
    var tk = L.ooTokens(t, done, opts.mark);
    var ready = opts.buttons && R.hint ? L.readyOps(t, R.done)[0] : -1;
    var items = tk.map(function (x) {
      var h;
      if (x.t === 'op' && opts.buttons) {
        var pos = R.done.indexOf(x.id), isDone = pos >= 0;
        h = '<button class="opbtn' + (isDone ? ' is-done' : '') + (x.id === ready ? ' is-hint' : '') + (R.lastWrong === x.id ? ' shake' : '') +
          '" data-act="oo-op" data-id="' + x.id + '"' + (isDone ? ' disabled' : '') + ' aria-label="Действие ' + esc(x.text) + (isDone ? ', номер ' + (pos + 1) : '') + '">' +
          esc(x.text) + (isDone ? '<span class="opnum">' + (pos + 1) + '</span>' : '') + '</button>';
      } else if (x.t === 'op' && opts.numbers) {
        var p = R.done.indexOf(x.id);
        h = '<span class="optok">' + esc(x.text) + (p >= 0 ? '<span class="opnum">' + (p + 1) + '</span>' : '') + '</span>';
      } else {
        h = '<span class="' + (x.t === 'num' ? 'numtok' : 'tok') + (x.fresh ? ' fresh' : '') + '">' + esc(x.text) + '</span>';
      }
      return { h: h, mark: !!x.mark, open: x.t === 'par' && x.text === '(', close: x.t === 'par' && x.text === ')' };
    });
    /* скобка не отрывается от соседнего числа при переносе строки */
    var groups = [];
    items.forEach(function (it, i) {
      var prev = items[i - 1];
      if (groups.length && (it.close || (prev && prev.open))) groups[groups.length - 1].h += it.h;
      else groups.push({ h: it.h, mark: it.mark });
    });
    /* подсвеченное действие — одной рамкой */
    var html = '', inMark = false;
    groups.forEach(function (g) {
      if (g.mark && !inMark) { html += '<span class="mk">'; inMark = true; }
      if (!g.mark && inMark) { html += '</span>'; inMark = false; }
      html += '<span class="grp">' + g.h + '</span>';
    });
    if (inMark) html += '</span>';
    return '<div class="oo-expr' + (opts.small ? ' is-small' : '') + '">' + (opts.eq ? '<span class="tok">=</span>' : '') + html + '</div>';
  }

  function renderOO() {
    var t = cur(), body;
    if (R.stage === 'order') body = ooOrder(t);
    else if (R.stage === 'calc') body = ooCalc(t);
    else body = ooResult(t);
    frame(body);
    R.shake = false; R.lastWrong = null;
  }
  function ooOrder(t) {
    var hintBox = R.hint ? '<div class="banner banner-info"><b>Подсказка.</b> Сначала скобки, потом умножение и деление, потом сложение и вычитание. Одинаковые по силе действия выполняются слева направо. Подсвечен знак, с которого можно начать.</div>' : '';
    return '<div class="head"><div class="pill pill-primary">Порядок действий</div><h1 class="h1">В каком порядке считать?</h1>' +
      '<p class="lead">Нажимай знаки действий по порядку: какое действие первое, какое второе.</p></div>' +
      '<section class="card task"><div class="kicker">Найдите значение выражения</div>' + exprHTML(t, [], { buttons: true }) +
      '<div class="meta">Действий: ' + t.nOps + ' · выбрано: ' + R.done.length + '</div></section>' +
      hintBox + banners() +
      '<div class="foot spacer"><button class="btn-small" data-act="m2-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Верный порядок<br>+10 очков</div></div>';
  }
  function ooTap(id) {
    var t = cur();
    if (!R || R.mode !== 'orderops' || R.stage !== 'order') return;
    var r = L.checkOpTap(t, R.done, id);
    if (r.why === 'done') return;
    if (r.ok) {
      R.done.push(id); R.msg = '';
      if (R.done.length === t.nOps) {
        R.stage = 'calc'; R.input = '';
        R.info = R.wrongOrder ? '<b>Порядок расставлен.</b> Теперь считаем.' : '<b>Порядок верный!</b> Теперь считаем по шагам.';
      }
    } else {
      R.wrongOrder++; R.lastWrong = id;
      R.msg = 'Это действие пока рано выполнять. ' + L.OO_WHY[r.why];
      O.announce(R.msg);
    }
    renderOO();
  }
  function ooCalc(t) {
    var id = R.done[R.calcIdx];
    var curLine = exprHTML(t, R.done.slice(0, R.calcIdx), { small: true, eq: R.calcIdx > 0, mark: id, numbers: R.calcIdx === 0 });
    var prev = '';
    if (R.calcIdx === 0) prev = curLine;
    else {
      prev = exprHTML(t, [], { numbers: true, small: true });
      for (var s2 = 1; s2 < R.calcIdx; s2++) prev += exprHTML(t, R.done.slice(0, s2), { small: true, eq: true });
      prev += curLine;
    }
    return '<div class="head"><div class="pill pill-primary">Порядок действий</div><h1 class="h1">Действие ' + (R.calcIdx + 1) + ' из ' + t.nOps + '</h1></div>' +
      '<section class="card oo-sol"><div class="label">Решение</div>' + prev + '</section>' + banners() +
      '<div class="oo-step">' + math(L.stepText(t, id)) + ' = ?</div>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="foot"><span class="label">Результат действия</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>' +
      fieldHTML('Результат') + '</div>' + keypadHTML(true) + '<div class="spacer"></div>' + checkBtn();
  }
  function ooCheck() {
    var t = cur(), id = R.done[R.calcIdx], n = L.opById(t, id);
    var v = L.parseAnswer(R.input);
    if (isNaN(v)) return;
    R.info = '';
    if (L.isCorrect(v, n.value)) {
      R.steps.push(R.tries === 0 ? 1 : 2);
      R.msg = '';
      R.info = '<b>Верно:</b> ' + esc(L.stepText(t, id)) + ' = ' + esc(L.fmt(n.value)) + '.';
      advanceStep();
    } else if (R.tries === 0) {
      R.tries = 1; R.shake = true; R.input = '';
      R.msg = 'Не сходится. Проверь это действие ещё раз.';
      O.announce(R.msg);
      renderOO();
    } else {
      R.steps.push(0);
      R.msg = 'Правильно: ' + L.stepText(t, id) + ' = ' + L.fmt(n.value) + '. Считаем дальше с этим числом.';
      advanceStep();
    }
  }
  function advanceStep() {
    var t = cur();
    R.calcIdx++; R.tries = 0; R.input = '';
    if (R.calcIdx >= t.nOps) {
      var sc = L.scoreOrderOps({ wrongOrder: R.wrongOrder, steps: R.steps, hint: R.hint });
      finishTask(R.steps.every(function (x) { return x > 0; }), sc, sc.perfect);
    }
    renderOO();
  }
  function ooResult(t) {
    var r = R.res, sc = r.sc;
    var all = exprHTML(t, [], { numbers: true, small: true });
    for (var s = 1; s <= t.nOps; s++) all += exprHTML(t, R.done.slice(0, s), { small: true, eq: true });
    var rows = [
      { label: 'Порядок действий' + (R.wrongOrder ? ' (ошибок: ' + R.wrongOrder + ')' : ''), pts: sc.order },
      { label: 'Вычисления по шагам', pts: sc.comp },
      { label: 'Без ошибок и подсказки', pts: sc.noHint }
    ];
    return hero(r.ok, r.ok ? 'Верно!' : 'Есть ошибки', 'Ответ: ' + esc(L.fmt(t.value))) +
      (R.msg ? '<div class="banner banner-warn">' + esc(R.msg) + '</div>' : '') +
      '<section class="card oo-sol"><div class="label">Решение</div>' + all + '</section>' + O.breakdown(rows, sc.total) + nextBtn();
  }

  /* ================== РЕЦЕПТУРА ================== */
  var C1 = '#7B6CF6', C2 = '#FFC83D', CT = '#F6B3B7';
  function startRC() {
    R = { mode: 'recipe', tasks: L.makeRecipeRound(O.stats.grade, 5), i: 0, points: 0, okCount: 0, perfectCount: 0, newBest: false };
    resetTask();
    O.go('recipe');
  }
  /* Мерный стакан: d делений, сегменты заливки снизу вверх */
  function glassSVG(d, segs, label) {
    var x = 18, y = 10, w = 74, h = 170, ph = h / d, g = '', yy = y + h;
    segs.forEach(function (s, si) {
      for (var i = 0; i < s.n; i++) {
        yy -= ph;
        g += '<rect x="' + x + '" y="' + yy.toFixed(2) + '" width="' + w + '" height="' + ph.toFixed(2) + '" fill="' + s.fill + '"' + (s.cross ? ' fill-opacity=".9"' : '') + '/>';
        if (s.cross) g += '<line x1="' + (x + 6) + '" y1="' + (yy + ph - 2).toFixed(2) + '" x2="' + (x + w - 6) + '" y2="' + (yy + 2).toFixed(2) + '" stroke="#A8232C" stroke-width="1.6" stroke-opacity=".7"/>';
      }
    });
    var lines = '';
    for (var k = 1; k < d; k++) {
      var ly = (y + h - k * ph).toFixed(2);
      lines += '<line x1="' + x + '" y1="' + ly + '" x2="' + (x + w) + '" y2="' + ly + '" stroke="#1F2340" stroke-opacity="' + (d > 24 ? '.3' : '.45') + '" stroke-width="1.4"/>';
    }
    return '<svg viewBox="0 0 110 190" class="glass" role="img" aria-label="' + esc(label) + '">' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="#FFFFFF"/>' + g + lines +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="6" fill="none" stroke="#5A5F7A" stroke-width="2.5"/>' +
      '<path d="M' + (x + w) + ' ' + (y + 18) + ' q14 4 12 30" fill="none" stroke="#5A5F7A" stroke-width="2.5" stroke-linecap="round"/></svg>';
  }
  function storyCard(t) {
    return '<section class="card task"><div class="kicker">' + (t.story ? 'Рецепт' : 'Вычисли без картинок') + '</div>' +
      (t.story ? '<p class="story">' + math(t.story) + '</p>' : '') + '<div class="expr' + (t.story ? ' is-small' : '') + '">' + math(t.expr) + '</div></section>';
  }
  function renderRC() {
    var t = cur(), body;
    if (R.stage === 'split') body = rcSplit(t);
    else if (R.stage === 'den') body = rcDen(t);
    else if (R.stage === 'num') body = rcNum(t);
    else if (R.stage === 'reduce') body = rcReduce(t);
    else body = rcResult(t);
    frame(body);
    R.shake = false;
  }
  function rcSplit(t) {
    var d = [t.b1 * R.m[0], t.b2 * R.m[1]], k = [t.k1 * R.m[0], t.k2 * R.m[1]];
    var cols = [0, 1].map(function (g) {
      var cuts = [2, 3, 4, 5].map(function (m) {
        return '<button class="cut" data-act="rc-cut" data-g="' + g + '" data-k="' + m + '"' + (L.canSplit(d[g], m) ? '' : ' disabled') + ' aria-label="Разрезать каждую долю ' + (g ? 'второго' : 'первого') + ' стакана на ' + m + '">×' + m + '</button>';
      }).join('');
      return '<div class="gcol">' + glassSVG(d[g], [{ n: k[g], fill: g ? C2 : C1 }], 'Стакан: ' + k[g] + ' из ' + d[g] + ' долей') +
        '<div class="gcap">' + math(fr(k[g], d[g])) + '</div><div class="gsub">доля ' + math(fr(1, d[g])) + '</div>' +
        '<div class="cuts">' + cuts + '</div>' +
        (R.m[g] > 1 ? '<button class="btn-small reset" data-act="rc-reset" data-g="' + g + '">Сбросить</button>' : '<div class="reset-ph"></div>') + '</div>';
    }).join('');
    var hint = '';
    if (R.hint) {
      var a = t.lcm / t.b1, b = t.lcm / t.b2;
      hint = '<div class="banner banner-info"><b>Подсказка.</b> Наименьший общий знаменатель ' + t.lcm + '. ' +
        (a > 1 ? 'Каждую долю первого стакана режь на ' + a + '. ' : 'Первый стакан резать не нужно. ') +
        (b > 1 ? 'Каждую долю второго режь на ' + b + '.' : 'Второй стакан резать не нужно.') + ' Если нужно на 4, можно дважды по 2.</div>';
    }
    return '<div class="head"><div class="pill pill-amber">Рецептура</div><h1 class="h1">Сделай доли одинаковыми</h1>' +
      '<p class="lead">Пока доли разного размера, их нельзя сложить' + (t.op === '-' ? ' или вычесть' : '') + '. Режь каждую долю на части кнопками.</p></div>' +
      storyCard(t) + '<div class="glasses">' + cols + '</div>' + hint + banners() +
      '<div class="foot spacer"><button class="btn-small" data-act="m2-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Самые крупные общие доли<br>+10 очков</div></div>';
  }
  function rcCut(g, m) {
    var t = cur();
    if (!R || R.mode !== 'recipe' || R.stage !== 'split') return;
    var d = (g ? t.b2 : t.b1) * R.m[g];
    if (!L.canSplit(d, m)) return;
    R.m[g] *= m; R.msg = '';
    var d1 = t.b1 * R.m[0], d2 = t.b2 * R.m[1];
    if (d1 === d2) {
      R.den = d1; R.denRes = d1 === t.lcm ? 'lcm' : 'common';
      R.info = d1 === t.lcm ? '<b>Доли одинаковые:</b> по ' + math(fr(1, d1)) + '. Это самые крупные общие доли.'
        : '<b>Доли одинаковые:</b> по ' + math(fr(1, d1)) + '. Подходит, но можно было резать крупнее: хватило бы ' + t.lcm + ' долей.';
      R.stage = 'num'; R.input = '';
    }
    renderRC();
  }
  function rcReset(g) { if (R && R.stage === 'split') { R.m[g] = 1; renderRC(); } }

  function rcDen(t) {
    var hint = R.hint ? '<div class="banner banner-info"><b>Подсказка.</b> Выпиши числа, которые делятся на ' + t.b1 + ': ' + [1, 2, 3, 4, 5, 6].map(function (x) { return t.b1 * x; }).join(', ') + '… Найди среди них первое, которое делится и на ' + t.b2 + '.</div>' : '';
    return '<div class="head"><div class="pill pill-amber">Рецептура</div><h1 class="h1">Найди общий знаменатель</h1>' +
      '<p class="lead">Картинок больше нет. Какое число делится и на ' + t.b1 + ', и на ' + t.b2 + '? Лучше всего самое маленькое.</p></div>' +
      storyCard(t) + hint + banners() +
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="foot"><span class="label">Общий знаменатель</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>' +
      fieldHTML('Знаменатель') + '</div>' + keypadHTML(false) +
      '<div class="foot"><button class="btn-small" data-act="m2-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Наименьший<br>+10 очков</div></div>' + checkBtn();
  }
  function rcCheckDen() {
    var t = cur(), v = Number(R.input);
    if (!v) return;
    R.info = '';
    if (L.isCommonDen(t, v) && v <= 600) {
      R.den = v; R.denRes = v === t.lcm ? 'lcm' : 'common';
      R.info = v === t.lcm ? '<b>Верно:</b> ' + v + ' делится и на ' + t.b1 + ', и на ' + t.b2 + '. Это наименьший общий знаменатель.'
        : '<b>Подходит:</b> ' + v + ' делится на оба знаменателя. Но есть число меньше: ' + t.lcm + '. Продолжим с ' + v + '.';
      R.msg = ''; R.stage = 'num'; R.tries = 0; R.input = '';
    } else if (R.tries === 0) {
      R.tries = 1; R.shake = true; R.input = '';
      R.msg = v + ' не делится ' + (v % t.b1 ? 'на ' + t.b1 : 'на ' + t.b2) + '. Попробуй другое число.';
    } else {
      R.den = t.lcm; R.denRes = 'fail'; R.stage = 'num'; R.tries = 0; R.input = '';
      R.msg = 'Общий знаменатель ' + t.lcm + ': это наименьшее число, которое делится и на ' + t.b1 + ', и на ' + t.b2 + '.';
    }
    renderRC();
  }
  function convParts(t) { var D = R.den; return [t.k1 * D / t.b1, t.k2 * D / t.b2]; }
  function rcNum(t) {
    var D = R.den, p = convParts(t), sign = t.op === '+' ? ' + ' : ' − ';
    var eq = t.scaffold > 0 ? math(fr(p[0], D) + sign + fr(p[1], D) + ' = {?|' + D + '}') : math(t.expr + ' = {?|' + D + '}');
    var pic = '';
    if (t.scaffold === 2) {
      var segs = t.op === '+' ? [{ n: p[0], fill: C1 }, { n: p[1], fill: C2 }] : [{ n: p[0] - p[1], fill: C1 }, { n: p[1], fill: CT, cross: true }];
      pic = '<div class="glasses one"><div class="gcol">' + glassSVG(D, segs, t.op === '+' ? 'Слили вместе' : 'Отлили часть') +
        '<div class="gsub">' + (t.op === '+' ? 'Слили в один стакан' : 'Зачёркнутое отлили') + '</div></div></div>';
    }
    var hint = R.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + math(fr(t.k1, t.b1)) + ' = ' + math(fr(p[0], D)) + ', ' + math(fr(t.k2, t.b2)) + ' = ' + math(fr(p[1], D)) + '. Знаменатель остаётся ' + D + ', числители ' + (t.op === '+' ? 'складываем' : 'вычитаем') + '.</div>' : '';
    return '<div class="head"><div class="pill pill-amber">Рецептура</div><h1 class="h1">' + (t.scaffold === 2 ? 'Сколько долей получилось?' : 'Найди числитель') + '</h1></div>' +
      banners() + '<section class="card task"><div class="expr is-small">' + eq + '</div></section>' + pic + hint +
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="foot"><span class="label">Числитель</span><span class="label">Попытка ' + (R.tries + 1) + ' из 2</span></div>' +
      fieldHTML('Числитель') + '</div>' + keypadHTML(false) +
      '<div class="foot"><button class="btn-small" data-act="m2-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">С первой попытки<br>+10 очков</div></div>' + checkBtn();
  }
  function rcCheckNum() {
    var t = cur(), v = Number(R.input), want = L.expectedNum(t, R.den);
    if (R.input === '') return;
    R.info = '';
    if (v === want) { R.numRes = R.tries === 0 ? 1 : 2; R.msg = ''; afterNum(); }
    else if (R.tries === 0) {
      R.tries = 1; R.shake = true; R.input = '';
      R.msg = 'Не сходится. Пересчитай доли: знаменатель ' + R.den + ', числители ' + (t.op === '+' ? 'складываются' : 'вычитаются') + '.';
      renderRC();
    } else {
      R.numRes = 0;
      R.msg = 'Правильно: ' + want + ' долей из ' + R.den + '.';
      afterNum();
    }
  }
  function afterNum() {
    var t = cur(), want = L.expectedNum(t, R.den);
    R.tries = 0; R.input = '';
    var opts = L.reduceOptions(want, R.den);
    if (opts) { R.redOpts = opts; R.stage = 'reduce'; renderRC(); }
    else rcFinish();
  }
  function rcReduce(t) {
    var want = L.expectedNum(t, R.den), g = gcd(want, R.den);
    var opts = R.redOpts.map(function (o, i) {
      return '<button class="opt" data-act="rc-red" data-i="' + i + '"><span class="opt-letter">' + ['А', 'Б', 'В'][i] + '</span><span class="expr-inline">' + math(fr(o.n, o.d)) + '</span></button>';
    }).join('');
    var hint = R.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + want + ' и ' + R.den + ' делятся на ' + g + '. Дели на него и числитель, и знаменатель.</div>' : '';
    return '<div class="head"><div class="pill pill-amber">Рецептура</div><h1 class="h1">Сократи дробь</h1>' +
      '<p class="lead">Получилось ' + want + ' долей из ' + R.den + '. Запиши ответ несократимой дробью.</p></div>' + banners() +
      '<section class="card task"><div class="expr">' + math(fr(want, R.den)) + '</div></section>' + hint +
      '<div class="opts" role="group" aria-label="Варианты"><div class="label">Выбери несократимую дробь</div>' + opts + '</div>' +
      '<div class="foot spacer"><button class="btn-small" data-act="m2-hint"' + (R.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Верно<br>+5 очков</div></div>';
  }
  function rcRed(i) {
    if (!R || R.mode !== 'recipe' || R.stage !== 'reduce') return;
    var o = R.redOpts[i]; if (!o) return;
    R.redRes = !!o.ok; R.redNote = o.ok ? '' : o.note;
    R.msg = '';
    rcFinish();
  }
  function rcFinish() {
    var sc = L.scoreRecipe({ den: R.denRes, num: R.numRes, reduce: R.redOpts ? R.redRes : null, hint: R.hint });
    finishTask(R.numRes > 0 && R.redRes !== false, sc, sc.perfect);
    renderRC();
  }
  function rcResult(t) {
    var r = R.res, sc = r.sc, D = R.den, p = convParts(t), want = L.expectedNum(t, D), g = gcd(want, D);
    var conv = [[t.k1, t.b1, p[0]], [t.k2, t.b2, p[1]]].filter(function (c) { return c[1] !== D; })
      .map(function (c) { return fr(c[0], c[1]) + ' = ' + fr(c[2], D); }).join(', ');
    var how = 'Общий знаменатель ' + D + (conv ? ': ' + conv : '') + '. ' +
      p[0] + (t.op === '+' ? ' + ' : ' − ') + p[1] + ' = ' + want + '.' + (g > 1 ? ' Сокращаем на ' + g + ': ' + fr(want, D) + ' = ' + fr(t.rn, t.rd) + '.' : '');
    var rows = [
      { label: 'Общие доли (знаменатель ' + D + ')', pts: sc.den },
      { label: 'Числитель', pts: sc.num }
    ];
    if (R.redOpts) rows.push({ label: 'Сокращение', pts: sc.reduce });
    rows.push({ label: 'Без ошибок и подсказки', pts: sc.noHint });
    return hero(r.ok, r.ok ? 'Верно!' : 'Почти получилось', math(t.expr + ' = ' + fr(t.rn, t.rd))) +
      (R.redNote ? '<div class="banner banner-warn"><b>Сокращение.</b> ' + esc(R.redNote) + '</div>' : '') +
      (R.msg ? '<div class="banner banner-warn">' + esc(R.msg) + '</div>' : '') +
      O.breakdown(rows, sc.total) +
      '<section class="note note-primary"><div class="note-t">Как считали</div><div>' + math(how) + '</div></section>' + nextBtn();
  }

  /* ================== подключение к приложению ================== */
  O.screens.orderops = function () { if (R && R.mode === 'orderops') render(); else O.renderHome(); };
  O.screens.recipe = function () { if (R && R.mode === 'recipe') render(); else O.renderHome(); };
  Object.assign(O.ACT, {
    'start-orderops': startOO,
    'start-recipe': startRC,
    'm2-next': function () { nextTask(); },
    'm2-hint': function () { R.hint = true; render(); },
    'm2-key': function (d) { pressKey(d.k); },
    'm2-check': function () {
      if (!R || !R.input) return;
      if (R.stage === 'calc') ooCheck(); else if (R.stage === 'den') rcCheckDen(); else if (R.stage === 'num') rcCheckNum();
    },
    'oo-op': function (d) { ooTap(Number(d.id)); },
    'rc-cut': function (d) { rcCut(Number(d.g), Number(d.k)); },
    'rc-reset': function (d) { rcReset(Number(d.g)); },
    'rc-red': function (d) { rcRed(Number(d.i)); }
  });
  O.keyHandlers.push(function (e, k) {
    if (!R || (O.screen !== 'orderops' && O.screen !== 'recipe')) return false;
    if (inputActive()) {
      if (/^[0-9]$/.test(k)) { pressKey(k); return true; }
      if (k === ',' || k === '.') { pressKey(','); return true; }
      if (k === 'Backspace') { pressKey('back'); return true; }
      return false;
    }
    if (R.stage === 'order' && /^[1-9]$/.test(k)) { var id = Number(k) - 1; if (id < cur().nOps) ooTap(id); return true; }
    if (R.stage === 'reduce' && /^[1-3]$/.test(k)) { rcRed(Number(k) - 1); return true; }
    return false;
  });

  window.__game3 = { get R() { return R; } };
  O.refresh();
})();
