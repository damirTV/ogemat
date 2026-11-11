/* Новые режимы заданий 11 и 12 (7 класс). Подключается после modes8.js.
   Задание 11: «Конструктор графика», «Блиц» (формула → график). «Сапёр ошибок» живёт в modes8.js.
   Задание 12: «Прикидка», «Ловушки», «Блиц» (быстрая прикидка порядка ответа). */
(function () {
  'use strict';
  var O = window.OGE, L = O.L, app = O.app, esc = O.esc, ICON = O.ICON, X = O.QX;
  var MINUS = '−';
  var BLITZ_SEC = 90, N = 5;

  /* ---------- описание режимов по заданиям ---------- */
  var MODES = {
    11: [
      { id: 'ctor', title: 'Конструктор графика', pill: 'pill-primary', tag: N + ' раундов', best: 'из ' + N, unit: 'решено',
        desc: 'Подбери коэффициенты формулы кнопками «−» и «+», чтобы синий пунктир лёг точно на оранжевый график: сначала прямые, потом параболы и гипербола.' },
      { id: 'blitz', title: 'Блиц', pill: 'pill-amber', tag: BLITZ_SEC + ' секунд', best: '', unit: 'верных',
        desc: 'К формуле нужно быстро найти её график среди трёх. За каждый верный ответ очко, а длинная серия без ошибок приносит бонус.' }
    ],
    12: [
      { id: 'est', title: 'Прикидка', pill: 'pill-primary', tag: N + ' задач', best: 'из ' + N, unit: 'верно',
        desc: 'Сначала оцени, в каких пределах окажется ответ, потом введи точное число. Если ответ не сходится с прикидкой, игра остановит тебя до проверки.' },
      { id: 'trap', title: 'Ловушки', pill: 'pill-red', tag: N + ' задач', best: 'из ' + N, unit: 'верно',
        desc: 'Среди четырёх ответов один верный, остальные — типичные ошибки: потерянный знак, сдвинутая запятая, перепутанное действие. Выбери верный и узнай, на чём ловят остальные.' },
      { id: 'blitz', title: 'Блиц прикидок', pill: 'pill-amber', tag: BLITZ_SEC + ' секунд', best: '', unit: 'верных',
        desc: 'За ' + BLITZ_SEC + ' секунд оценивай порядок ответа как можно чаще. Серия верных ответов приносит бонус.' }
    ]
  };
  function modeOf(t, id) { return (MODES[t] || []).filter(function (m) { return m.id === id; })[0]; }
  function ex(t, id) { var s = X.st(t); s.ex = s.ex || {}; return s.ex[id] || (s.ex[id] = { plays: 0, best: 0 }); }
  function pts(n) { X.st(M ? M.T : X.T).points += n; if (M) M.pts += n; }

  var M = null, timer = null;
  function stopM() { if (timer) { clearInterval(timer); timer = null; } }
  function left() { return Math.max(0, BLITZ_SEC - Math.floor((Date.now() - M.t0) / 1000)); }

  /* ---------- главная страница задания: плитки новых режимов ---------- */
  function homeModes(t) {
    return (MODES[t] || []).map(function (m) {
      var e = ex(t, m.id);
      return '<button class="mode" data-act="q-mode" data-m="' + m.id + '"><span class="mode-t"><span>' + esc(m.title) + '</span><span class="pill ' + m.pill + '">' + esc(m.tag) + '</span></span>' +
        '<span class="mode-d">' + esc(m.desc) + '</span>' +
        '<span class="mode-meta"><span class="mini amber">Лучший результат: ' + e.best + (m.best ? ' ' + m.best : ' ' + m.unit) + '</span><span class="mini">Раундов: ' + e.plays + '</span></span></button>';
    }).join('');
  }
  function plays(t) { return (MODES[t] || []).reduce(function (s, m) { return s + ex(t, m.id).plays; }, 0); }
  function reportRows(t) {
    var ms = MODES[t] || [];
    if (!ms.length) return '';
    return '<section class="card"><div class="label">Игровые режимы</div><div style="margin-top:6px">' + ms.map(function (m) {
      var e = ex(t, m.id);
      return '<div class="brow"><span>' + esc(m.title) + '</span><span>' + (e.plays ? 'лучший: ' + e.best + (m.best ? ' ' + m.best : ' ' + m.unit) + ' · игр: ' + e.plays : 'не пробовали') + '</span></div>';
    }).join('') + '</div></section>';
  }

  /* ---------- запуск ---------- */
  function start(id) {
    var t = X.T;
    if (!modeOf(t, id)) return;
    stopM();
    M = { id: id, T: t, i: 0, ok: 0, pts: 0, stage: 'play', newBest: false, results: [] };
    if (id === 'ctor') { M.items = [0, 1, 2, 3, 4].map(function (i) { return L.make11ctor(i); }); ctorReset(); }
    else if (id === 'est') { M.items = []; for (var i = 0; i < N; i++) M.items.push(L.make12est()); estReset(); }
    else if (id === 'trap') { M.items = []; for (var j = 0; j < N; j++) M.items.push(L.make12trap()); M.stage = 'ask'; M.pick = -1; }
    else if (id === 'blitz') {
      M.t0 = Date.now(); M.combo = 0; M.bestCombo = 0; M.wrong = 0; M.mist = []; M.fb = ''; M.fbOk = true; M.stage = 'run'; M.item = blitzItem();
      timer = setInterval(function () {
        if (!M || M.id !== 'blitz' || M.stage !== 'run' || O.screen !== 'qmode') { stopM(); return; }
        var l = left(), el = document.getElementById('bz-time');
        if (el) el.textContent = X.fmtTime(l);
        if (l <= 0) endBlitz();
      }, 1000);
      if (timer && timer.unref) timer.unref();
    }
    O.go('qmode');
  }
  function blitzItem() { return M.T === 11 ? L.make11blitz() : L.make12est(); }
  function finish() {
    var e = ex(M.T, M.id);
    e.plays++;
    if (M.ok > e.best) { e.best = M.ok; M.newBest = true; }
    M.stage = 'end'; O.saveStats();
  }

  /* ---------- общие куски экрана ---------- */
  function top(label, pct, chip, chipId) { return X.topbar(label, pct, chip, chipId).replace('data-act="q-home"', 'data-act="q-home"'); }
  function endView(title, sub, extra) {
    var good = M.ok >= (M.id === 'blitz' ? 6 : 4);
    var m = modeOf(M.T, M.id);
    return '<div class="hero" style="padding-top:20px"><div class="badge ' + (good ? 'badge-ok' : 'badge-warn') + ' pop">' + (good ? ICON.check(36) : ICON.excl) + '</div><h1 class="h1">' + esc(title) + '</h1>' +
      '<div class="hero-sub">' + esc(sub) + (M.newBest ? ' · новый рекорд!' : '') + '</div></div>' + (extra || '') +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="q-mode" data-m="' + M.id + '" data-primary>Ещё раз</button><button class="btn btn-ghost" data-act="q-home">К заданию ' + M.T + '</button></div>';
  }
  function optBtn(act, i, text, cls, note, dis) {
    return '<button class="opt' + (cls ? ' ' + cls : '') + '" data-act="' + act + '" data-i="' + i + '"' + (dis ? ' disabled' : '') + '><span class="opt-letter">' + (i + 1) + '</span><span class="sx">' + X.mathX(text) + '</span></button>' + (note ? '<div class="opt-note">' + X.mathX(note) + '</div>' : '');
  }
  function textCard(p) { return '<section class="card dc-text q-text"><p>' + X.mathX(p.text) + '</p></section>'; }

  /* ================== КОНСТРУКТОР ГРАФИКА ================== */
  function ctorReset() { var c = M.items[M.i]; M.vals = JSON.parse(JSON.stringify(c.start)); M.tries = 0; M.msg = ''; M.stage = 'play'; M.solved = false; }
  function ctorRender() {
    var c = M.items[M.i], cur = L.ctorCur11(c, M.vals), done = M.stage === 'result';
    var rows = c.params.map(function (pr) {
      return '<div class="ct-row"><span class="ct-name">' + pr.key + '</span><button class="ct-b" data-act="ct-adj" data-p="' + pr.key + '" data-d="-1" aria-label="Уменьшить ' + pr.key + '"' + (done ? ' disabled' : '') + '>' + MINUS + '</button>' +
        '<span class="ct-val">' + esc(L.fmt(M.vals[pr.key])) + '</span><button class="ct-b" data-act="ct-adj" data-p="' + pr.key + '" data-d="1" aria-label="Увеличить ' + pr.key + '"' + (done ? ' disabled' : '') + '>+</button></div>';
    }).join('');
    var head = done
      ? '<div class="hero" style="padding-top:8px">' + (M.solved ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Графики совпали</h1>' : '<div class="badge badge-warn pop">' + ICON.excl + '</div><h1 class="h1">Не совпали</h1>') + '</div>'
      : '<div class="head"><div class="pill pill-primary">Конструктор графика</div></div>';
    app.innerHTML = top('Раунд ' + (M.i + 1) + ' из ' + N, Math.round((M.i + (done ? 1 : 0)) / N * 100), M.pts + ' очков') + head +
      '<section class="card ct-card">' + (done ? '' : '<p class="hint" style="margin:0 0 6px">Подбери формулу так, чтобы синий пунктир лёг на оранжевый график.</p>') +
      '<div class="ct-fig">' + X.graphSVG(c.target, '', false, cur, false) + '</div>' +
      '<div class="q-eq ct-formula">' + X.mathX(L.fml11(cur)) + '</div>' + (done ? '' : '<div class="ct-rows">' + rows + '</div>') + '</section>' +
      (M.msg && !done ? '<div class="banner banner-warn" id="msg">' + X.mathX(M.msg) + '</div>' : '') +
      (done ? '<section class="note note-primary"><div class="note-t">Как найти формулу</div><div>' + X.mathX(c.explain) + '</div></section><button class="btn btn-primary spacer" data-act="ct-next" data-primary>' + (M.i + 1 >= N ? 'Итог' : 'Следующий раунд') + '</button>'
        : '<div class="foot spacer"><span class="foot-note" style="text-align:left">Попыток: ' + (3 - M.tries) + '</span></div><button class="btn btn-primary" data-act="ct-check" data-primary>Проверить</button>');
    O.postRender();
  }
  function ctorAdj(p, d) {
    if (!M || M.id !== 'ctor' || M.stage !== 'play') return;
    var c = M.items[M.i], pr = c.params.filter(function (x) { return x.key === p; })[0];
    if (!pr) return;
    var v = Math.round((M.vals[p] + d * pr.step) * 1e6) / 1e6;
    if (pr.skipZero && Math.abs(v) < 1e-9) v = Math.round((v + d * pr.step) * 1e6) / 1e6;
    if (v < pr.min || v > pr.max) return;
    M.vals[p] = v; M.msg = '';
    ctorRender();
  }
  function ctorCheck() {
    if (!M || M.id !== 'ctor' || M.stage !== 'play') return;
    var c = M.items[M.i];
    if (L.ctorSame11(c, M.vals)) {
      var gain = [3, 2, 1][M.tries]; pts(gain); M.ok++; M.solved = true; M.stage = 'result';
      X.skill(c.skill, M.tries === 0); O.announce('Графики совпали');
    } else {
      M.tries++;
      if (M.tries >= 3) { M.stage = 'result'; X.skill(c.skill, false); M.vals = JSON.parse(JSON.stringify(c.target)); delete M.vals.type; O.announce('Не совпали'); }
      else { M.msg = 'Ещё не совпало. ' + L.ctorHint11(c, M.vals, M.tries); O.announce('Не совпало'); }
    }
    O.saveStats(); ctorRender();
  }
  function ctorNext() {
    if (!M || M.id !== 'ctor' || M.stage !== 'result') return;
    if (M.i + 1 >= N) { finish(); render(); return; }
    M.i++; ctorReset(); ctorRender();
  }

  /* ================== ПРИКИДКА (задание 12) ================== */
  function estReset() { M.stage = 'pick'; M.pick = -1; M.input = ''; M.tries = 0; M.msg = ''; M.pickOk = false; M.solved = false; M.first = false; }
  function inRange(v, r) { return v >= r.lo - 1e-9 && v <= r.hi + 1e-9; }
  function estRender() {
    var p = M.items[M.i], st = M.stage, body = '';
    var label = 'Задача ' + (M.i + 1) + ' из ' + N, pct = Math.round((M.i + (st === 'result' ? 1 : 0)) / N * 100);
    if (st === 'pick') {
      body = textCard(p) + '<div class="opts" role="group" aria-label="Варианты"><div class="label">Прикинь: где окажется ответ?</div>' + p.opts.map(function (o, i) { return optBtn('es-pick', i, o); }).join('') + '</div>';
    } else if (st === 'type') {
      body = textCard(p) + '<div class="banner ' + (M.pickOk ? 'banner-info' : 'banner-warn') + '"><b>' + (M.pickOk ? 'Прикидка верная.' : 'Прикидка не сошлась.') + '</b> Ответ ' + esc(p.opts[p.ok]) + '. ' + (M.pickOk ? '' : X.mathX(p.msgs[M.pick])) + '</div>' +
        X.fieldHTML(M.input) + X.keypadHTML(false) + '<div class="foot"><span class="label">Точный ответ числом</span><span class="label">Попыток: ' + (2 - M.tries) + '</span></div>' +
        (M.msg ? '<div class="banner banner-warn" id="msg">' + X.mathX(M.msg) + '</div>' : '') +
        '<button class="btn btn-primary" data-act="es-check" data-primary id="es-check"' + (M.input ? '' : ' disabled') + '>Проверить</button>';
    } else {
      body = '<div class="hero" style="padding-top:8px">' + (M.solved ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Верно</h1>' : '<div class="badge badge-warn pop">' + ICON.excl + '</div><h1 class="h1">Не получилось</h1>') +
        '<div class="hero-sub">' + (M.solved ? 'Ответ: ' : 'Правильный ответ: ') + esc(L.fmt(Number(p.answer))) + '</div></div>' + textCard(p) +
        '<section class="note note-primary"><div class="note-t">Как решать</div><div>' + X.mathX(p.explain) + '</div></section>' +
        '<button class="btn btn-primary spacer" data-act="es-next" data-primary>' + (M.i + 1 >= N ? 'Итог' : 'Следующая задача') + '</button>';
    }
    app.innerHTML = top(label, pct, M.pts + ' очков') + '<div class="head"><div class="pill pill-primary">Прикидка</div></div>' + body;
    O.postRender();
  }
  function estPick(i) {
    if (!M || M.id !== 'est' || M.stage !== 'pick') return;
    var p = M.items[M.i];
    if (!(i >= 0 && i < p.opts.length)) return;
    M.pick = i; M.pickOk = i === p.ok; M.stage = 'type';
    if (M.pickOk) pts(1);
    O.announce(M.pickOk ? 'Прикидка верная' : 'Прикидка неверная');
    estRender();
  }
  function estKey(k) {
    if (!M || M.id !== 'est' || M.stage !== 'type') return;
    M.input = X.typeNum(M.input, k, false); M.msg = '';
    var el = document.getElementById('q-fieldText'), b = document.getElementById('es-check');
    if (el) el.innerHTML = M.input ? esc(M.input) : '<span class="ph">Введи ответ</span>';
    if (b) b.disabled = !M.input;
    var m = document.getElementById('msg'); if (m) m.parentNode.removeChild(m);
  }
  function estCheck() {
    if (!M || M.id !== 'est' || M.stage !== 'type' || !M.input) return;
    var p = M.items[M.i], v = L.dachaParse(M.input);
    if (!isFinite(v)) return;
    if (L.dachaNumEq(v, Number(p.answer))) {
      M.first = M.tries === 0; pts(M.tries === 0 ? 3 : 2); M.solved = true; M.ok++; M.stage = 'result';
      X.skill(p.skill, M.first); O.announce('Верно');
    } else if (!inRange(v, p.ranges[p.ok])) {
      M.msg = 'Стоп: такой ответ не попадает в прикидку «' + p.opts[p.ok] + '». Проверь вычисления. Попытка не потрачена.';
      O.announce('Стоп, ответ не сходится с прикидкой');
    } else {
      M.tries++;
      if (M.tries >= 2) { M.stage = 'result'; X.skill(p.skill, false); }
      else M.msg = 'Пока неверно. Проверь порядок действий и подставленные числа.';
    }
    O.saveStats(); estRender();
  }
  function estNext() {
    if (!M || M.id !== 'est' || M.stage !== 'result') return;
    if (M.i + 1 >= N) { finish(); render(); return; }
    M.i++; estReset(); estRender();
  }

  /* ================== ЛОВУШКИ (задание 12) ================== */
  function trapRender() {
    var p = M.items[M.i], fb = M.stage === 'fb';
    var opts = p.opts.map(function (o, i) {
      var cls = '', note = '';
      if (fb) {
        if (i === p.ok) cls = 'is-correct';
        else if (i === M.pick) { cls = 'is-wrong'; note = p.msgs[i]; }
        else cls = 'is-dim';
      }
      return optBtn('tr-pick', i, o, cls, note, fb);
    }).join('');
    app.innerHTML = top('Задача ' + (M.i + 1) + ' из ' + N, Math.round((M.i + (fb ? 1 : 0)) / N * 100), M.pts + ' очков') + '<div class="head"><div class="pill pill-red">Ловушки</div></div>' + textCard(p) +
      '<div class="opts" role="group" aria-label="Варианты ответа"><div class="label">Какой ответ верный?</div>' + opts + '</div>' +
      (fb ? '<section class="note ' + (M.pick === p.ok ? 'note-primary' : 'note-amber') + '"><div class="note-t">' + (M.pick === p.ok ? 'Верно' : 'Ловушка!') + '</div><div>' +
        X.mathX(M.pick === p.ok ? p.explain : p.msgs[M.pick] + ' Верное решение: ' + p.explain) + '</div></section>' +
        '<details class="card"><summary>Другие ловушки в этой задаче</summary>' + p.opts.map(function (o, i) { return i === p.ok || i === M.pick ? '' : '<p>' + X.mathX(o) + ': ' + X.mathX(p.msgs[i]) + '</p>'; }).join('') + '</details>' +
        '<button class="btn btn-primary spacer" data-act="tr-next" data-primary>' + (M.i + 1 >= N ? 'Итог' : 'Следующая задача') + '</button>' : '<p class="hint">Можно нажать цифру 1–4 на клавиатуре.</p>');
    O.postRender();
  }
  function trapPick(i) {
    if (!M || M.id !== 'trap' || M.stage !== 'ask') return;
    var p = M.items[M.i];
    if (!(i >= 0 && i < p.opts.length)) return;
    M.pick = i; M.stage = 'fb';
    var ok = i === p.ok;
    if (ok) { M.ok++; pts(3); }
    X.skill(p.skill, ok); O.saveStats(); O.announce(ok ? 'Верно' : 'Ловушка');
    trapRender();
  }
  function trapNext() {
    if (!M || M.id !== 'trap' || M.stage !== 'fb') return;
    if (M.i + 1 >= N) { finish(); render(); return; }
    M.i++; M.stage = 'ask'; M.pick = -1; trapRender();
  }

  /* ================== БЛИЦ ================== */
  function blitzRender() {
    var p = M.item, c = M.combo;
    var opts;
    if (M.T === 11) {
      opts = '<div class="q-gopts" role="group" aria-label="Графики">' + p.graphs.map(function (g, i) {
        return '<button class="gbtn" data-act="bz-pick" data-i="' + i + '" aria-label="График ' + (i + 1) + '">' + X.graphSVG(g, String(i + 1)) + '</button>';
      }).join('') + '</div>';
    } else {
      opts = '<div class="opts" role="group" aria-label="Варианты"><div class="label">Где окажется ответ?</div>' + p.opts.map(function (o, i) { return optBtn('bz-pick', i, o); }).join('') + '</div>';
    }
    app.innerHTML = top('Блиц · верных: ' + M.ok, Math.round((BLITZ_SEC - left()) / BLITZ_SEC * 100), X.fmtTime(left()), 'bz-time') +
      '<div class="head"><div class="pill pill-amber">' + (M.T === 11 ? 'Блиц' : 'Блиц прикидок') + '</div>' + (c >= 2 ? '<span class="mini amber" style="align-self:flex-start">Серия: ' + c + '</span>' : '') + '</div>' +
      (M.fb ? '<div class="banner ' + (M.fbOk ? 'banner-info' : 'banner-warn') + '" id="bz-fb">' + X.mathX(M.fb) + '</div>' : '') +
      (M.T === 11 ? '<section class="card task task-compact"><div class="q-eq">' + X.mathX(p.text) + '</div></section>' : textCard(p)) + opts +
      '<p class="hint">' + (M.T === 11 ? 'Нажми на график или цифру 1–3.' : 'Нажми на вариант или цифру 1–3.') + '</p>';
    O.postRender();
  }
  function blitzPick(i) {
    if (!M || M.id !== 'blitz' || M.stage !== 'run') return;
    if (left() <= 0) { endBlitz(); return; }
    var p = M.item;
    if (!(i >= 0 && i < (p.graphs ? p.graphs.length : p.opts.length))) return;
    var ok = i === p.ok;
    X.skill(p.skill, ok);
    if (ok) {
      M.ok++; M.combo++; if (M.combo > M.bestCombo) M.bestCombo = M.combo;
      var bonus = M.combo >= 5 ? 1 : 0;
      pts(1 + bonus);
      M.fb = 'Верно' + (M.combo >= 3 ? '. Серия: ' + M.combo + (bonus ? ', бонус +1' : '') : '') + '.'; M.fbOk = true;
    } else {
      M.wrong++; M.combo = 0;
      M.mist.push({ text: p.text, msg: p.msgs[i], explain: p.explain });
      M.fb = 'Неверно. ' + p.msgs[i]; M.fbOk = false;
    }
    M.item = blitzItem();
    O.announce(ok ? 'Верно' : 'Неверно');
    blitzRender();
  }
  function endBlitz() {
    if (!M || M.id !== 'blitz' || M.stage !== 'run') return;
    stopM(); finish();
    render();
  }
  function blitzEnd() {
    var rows = M.mist.slice(0, 6).map(function (x) {
      return '<section class="card" style="display:flex;flex-direction:column;gap:6px"><div class="q-eq sm">' + X.mathX(x.text) + '</div><div class="hint">' + X.mathX(x.msg) + '</div><div class="hint">' + X.mathX(x.explain) + '</div></section>';
    }).join('');
    return endView('Время вышло', 'Верных ответов: ' + M.ok + ' · ошибок: ' + M.wrong + ' · лучшая серия: ' + M.bestCombo,
      M.mist.length ? '<div class="label">Разбор ошибок</div>' + rows : '');
  }

  /* ================== ОБЩАЯ ОТРИСОВКА ================== */
  function render() {
    if (!M || O.screen !== 'qmode') { O.go('qhome'); return; }
    if (M.stage === 'end') {
      if (M.id === 'blitz') { app.innerHTML = blitzEnd(); O.postRender(); return; }
      var m = modeOf(M.T, M.id);
      app.innerHTML = endView(m.title + ': ' + M.ok + ' из ' + N, 'Очков за раунд: ' + M.pts + '. Лучший результат: ' + ex(M.T, M.id).best + ' из ' + N);
      O.postRender(); return;
    }
    if (M.id === 'ctor') ctorRender(); else if (M.id === 'est') estRender(); else if (M.id === 'trap') trapRender(); else blitzRender();
  }

  /* ---------- регистрация ---------- */
  Object.keys(MODES).forEach(function (t) { L.QMODES = L.QMODES || {}; L.QMODES[t] = MODES[t].map(function (m) { return m.id; }); });
  O.QX9 = { stop: stopM, key: function (k) { estKey(k); }, homeModes: homeModes, plays: plays, reportRows: reportRows, MODES: MODES };
  O.__m = { get M() { return M; } };
  O.screens.qmode = render;
  Object.assign(O.ACT, {
    'q-mode': function (d) { start(d.m); },
    'ct-adj': function (d) { ctorAdj(d.p, Number(d.d)); }, 'ct-check': ctorCheck, 'ct-next': ctorNext,
    'es-pick': function (d) { estPick(Number(d.i)); }, 'es-check': estCheck, 'es-next': estNext,
    'tr-pick': function (d) { trapPick(Number(d.i)); }, 'tr-next': trapNext,
    'bz-pick': function (d) { blitzPick(Number(d.i)); }
  });
  O.keyHandlers.push(function (e, k) {
    if (O.screen !== 'qmode' || !M) return false;
    if (/^[1-4]$/.test(k)) {
      var i = Number(k) - 1;
      if (M.id === 'est' && M.stage === 'pick') { estPick(i); return true; }
      if (M.id === 'trap' && M.stage === 'ask') { trapPick(i); return true; }
      if (M.id === 'blitz' && M.stage === 'run') { blitzPick(i); return true; }
    }
    if (M.id === 'est' && M.stage === 'type') {
      var key = /^[0-9]$/.test(k) ? k : k === ',' || k === '.' ? ',' : k === '-' || k === MINUS ? '-' : k === 'Backspace' ? 'back' : null;
      if (key) { estKey(key); return true; }
    }
    return false;
  });
})();
