/* «Спринт» для заданий 6 и 7: 10 заданий как на экзамене, на время, с итоговым разбором. */
(function () {
  'use strict';
  var O = window.OGE, L = O.L, app = O.app, esc = O.esc, ICON = O.ICON, U = O.t7ui;
  var m7 = U.m7;
  var SP = null, timer = null;
  var SCR = { 6: 'sp6', 7: 'sp7' };

  function fmtTime(s) { var m = Math.floor(s / 60), x = s % 60; return m + ':' + (x < 10 ? '0' : '') + x; }
  function left() { return Math.max(0, SP.limit - Math.floor((Date.now() - SP.t0) / 1000)); }
  function stopTimer() { if (timer) { clearInterval(timer); timer = null; } }
  function startTimer() {
    stopTimer();
    timer = setInterval(function () {
      if (!SP || SP.stage !== 'run' || O.screen !== SCR[SP.task]) { stopTimer(); return; }
      var l = left(), el = document.getElementById('sp-time');
      if (el) el.textContent = fmtTime(l);
      if (l <= 0) finish(true);
    }, 1000);
    if (timer && timer.unref) timer.unref();
  }
  function start(task) {
    stopTimer();
    SP = { task: task, tasks: task === 6 ? L.makeSprint6(O.stats.grade) : L.makeSprint7(), i: 0, answers: [], stage: 'run', t0: Date.now(), limit: L.SPRINT_SECONDS, res: null, timeout: false, sec: 0 };
    for (var k = 0; k < 10; k++) SP.answers.push(task === 6 ? '' : null);
    O.go(SCR[task]);
    startTimer();
  }
  function answered(i) { return SP.task === 6 ? SP.answers[i] !== '' : SP.answers[i] !== null; }
  function isRight(i) {
    var t = SP.tasks[i];
    return SP.task === 6 ? L.checkSprint6(t, SP.answers[i]) : SP.answers[i] === t.correct;
  }
  function backHome() { if (SP && SP.task === 7) O.go('home7'); else O.ACT.home(); }

  /* ---------- экран ---------- */
  function render() {
    if (!SP || SCR[SP.task] !== O.screen) { if (O.screen === 'sp7') U.home(); else O.ACT.home(); return; }
    if (SP.stage === 'review') { renderReview(); return; }
    var n = SP.tasks.length, doneCount = 0, k;
    for (k = 0; k < n; k++) if (answered(k)) doneCount++;
    var t = SP.tasks[SP.i], body;
    var top = '<div class="topbar"><button class="close" data-act="sp-exit" aria-label="Выйти из спринта">' + ICON.close + '</button>' +
      '<div class="progress"><div class="progress-label">Спринт · задание ' + (SP.i + 1) + ' из ' + n + '</div>' +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + doneCount * 10 + '"><div class="bar-fill" id="sp-bar" style="width:' + doneCount * 10 + '%"></div></div></div>' +
      '<div class="chip chip-pts" id="sp-time" role="timer" aria-label="Осталось времени">' + fmtTime(left()) + '</div></div>';
    var nav = '<div class="sp-nav" role="group" aria-label="Задания">';
    for (k = 0; k < n; k++) nav += '<button data-act="sp-go" data-i="' + k + '" class="' + (k === SP.i ? 'is-cur' : answered(k) ? 'is-done' : '') + '" aria-label="Задание ' + (k + 1) + (answered(k) ? ', есть ответ' : '') + '">' + (k + 1) + '</button>';
    nav += '</div>';
    body = SP.task === 6 ? run6(t) : run7(t);
    var last = SP.i === n - 1;
    var foot = '<div class="actions spacer"><div class="foot"><button class="btn-small" data-act="sp-prev"' + (SP.i === 0 ? ' disabled' : '') + '>← Назад</button>' +
      (last ? '' : '<button class="btn-small" data-act="sp-next">Дальше →</button>') + '</div>' +
      '<button class="btn ' + (last ? 'btn-primary' : 'btn-ghost') + '" data-act="sp-finish">Завершить и проверить</button></div>';
    app.innerHTML = top + nav + body + foot;
    O.postRender();
  }
  function head(t) {
    return '<div class="head"><div class="pill pill-amber">Спринт · как на экзамене</div><h1 class="h1">Тип ' + SP.task + '</h1></div>';
  }
  function run6(t) {
    return head(t) + '<section class="card task"><div class="kicker">' + esc(t.title) + '</div><div class="expr">' + m7(t.expr) + '</div></section>' +
      fieldHTML() + keypadHTML();
  }
  function fieldHTML() {
    var v = SP.answers[SP.i];
    return '<div class="field" id="sp-field"><span id="sp-fieldText">' + (v ? esc(v) : '<span class="ph">Введи ответ</span>') + '</span><span class="caret" aria-hidden="true"></span></div>';
  }
  function keypadHTML() {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'];
    return '<div class="keypad" role="group" aria-label="Цифры">' + keys.map(function (k) {
      if (k === 'back') return '<button class="key" data-act="sp-key" data-k="back" aria-label="Стереть">' + ICON.back + '</button>';
      return '<button class="key" data-act="sp-key" data-k="' + k + '">' + k + '</button>';
    }).join('') + '</div><div class="links"><button class="btn-small" data-act="sp-key" data-k="neg">Поставить или убрать минус</button></div>';
  }
  function figCard(f, id) {
    if (!f) return '';
    return '<div class="card nline" style="cursor:default">' + U.lineSVG({ id: id, lo: f.lo, hi: f.hi, ticks: f.ticks, points: f.points, aria: 'Числовая прямая' }) + '</div>';
  }
  function run7(t) {
    var opts = t.opts.map(function (o, i) {
      return '<button class="opt' + (SP.answers[SP.i] === i ? ' is-picked' : '') + '" data-act="sp-pick" data-i="' + i + '"><span class="opt-letter">' + (i + 1) + '</span><span>' + m7(o.label) + '</span></button>';
    }).join('');
    return head(t) + '<section class="card task task-compact"><div class="kicker">Тип 7</div><div class="expr" style="font-size:20px">' + m7(t.q) + '</div></section>' +
      figCard(t.fig, 'sp-fig') +
      '<div class="opts" role="group" aria-label="Варианты ответа"><div class="label">Выбери один вариант</div>' + opts + '</div>';
  }
  function refreshMarks() {
    var n = SP.tasks.length, k, doneCount = 0;
    var bs = app.querySelectorAll('[data-act="sp-go"]');
    for (k = 0; k < n; k++) if (answered(k)) doneCount++;
    for (k = 0; k < bs.length; k++) {
      var i = Number(bs[k].getAttribute('data-i'));
      bs[k].className = i === SP.i ? 'is-cur' : answered(i) ? 'is-done' : '';
    }
    var bar = document.getElementById('sp-bar');
    if (bar && bar.style) bar.style.width = doneCount * 10 + '%';
  }
  function pick(i) {
    if (!SP || SP.stage !== 'run' || SP.task !== 7 || !SP.tasks[SP.i].opts[i]) return;
    SP.answers[SP.i] = i;
    var bs = app.querySelectorAll('[data-act="sp-pick"]');
    for (var k = 0; k < bs.length; k++) bs[k].className = 'opt' + (Number(bs[k].getAttribute('data-i')) === i ? ' is-picked' : '');
    refreshMarks();
  }
  function key(k) {
    if (!SP || SP.stage !== 'run' || SP.task !== 6) return;
    var a = SP.answers[SP.i] || '';
    if (k === 'back') a = a.slice(0, -1);
    else if (k === 'neg') a = a.charAt(0) === L.MINUS ? a.slice(1) : L.MINUS + a;
    else if (k === ',') { if (a.indexOf(',') < 0 && /\d/.test(a)) a += ','; }
    else if (/^\d$/.test(k)) { if (a.replace(/[^\d]/g, '').length < 7) a += k; }
    if (a === L.MINUS) a = L.MINUS;
    SP.answers[SP.i] = a;
    var el = document.getElementById('sp-fieldText');
    if (el) el.innerHTML = a ? esc(a) : '<span class="ph">Введи ответ</span>';
    refreshMarks();
  }
  function go(i) { if (SP && SP.stage === 'run' && i >= 0 && i < SP.tasks.length) { SP.i = i; render(); } }
  function exit() {
    if (SP && SP.stage === 'run' && SP.answers.some(function (_, i) { return answered(i); }) && typeof window.confirm === 'function' &&
      !window.confirm('Выйти из спринта? Результат не сохранится.')) return;
    stopTimer(); var task = SP ? SP.task : 6; SP = null;
    if (task === 7) O.go('home7'); else O.ACT.home();
  }
  function tryFinish() {
    if (!SP || SP.stage !== 'run') return;
    var empty = 0; SP.answers.forEach(function (_, i) { if (!answered(i)) empty++; });
    if (empty && typeof window.confirm === 'function' && !window.confirm('Без ответа осталось заданий: ' + empty + '. Завершить и проверить?')) return;
    finish(false);
  }

  /* ---------- завершение, запись статистики ---------- */
  function finish(byTimeout) {
    if (!SP || SP.stage !== 'run') return;
    stopTimer();
    var st = O.stats, n = SP.tasks.length, correct = 0, sk = SP.task === 6 ? 'sprint6' : 'sprint7';
    SP.res = SP.tasks.map(function (t, i) {
      var ok = answered(i) && isRight(i);
      if (ok) correct++;
      var s = st.skills[t.skill] || (st.skills[t.skill] = { ok: 0, total: 0 });
      s.total++; if (ok) s.ok++;
      return ok;
    });
    SP.correct = correct; SP.timeout = !!byTimeout; SP.sec = Math.min(SP.limit, Math.floor((Date.now() - SP.t0) / 1000)); SP.pts = correct * 5;
    if (SP.task === 6) st.points += SP.pts; else L.t7(st).points += SP.pts;
    st.rounds[sk] = (st.rounds[sk] || 0) + 1;
    var prev = st.best[sk] || 0;
    if (correct > prev) { st.best[sk] = correct; SP.newBest = prev > 0; }
    st.sprints = (st.sprints || []).concat([{ task: SP.task, ts: Date.now(), correct: correct, total: n, sec: SP.sec, limit: SP.limit, grade: st.grade }]).slice(-30);
    O.saveStats();
    SP.stage = 'review';
    O.announce('Спринт завершён: ' + correct + ' из ' + n);
    render();
  }

  /* ---------- итоговый разбор ---------- */
  function reviewItem(t, i) {
    var ok = SP.res[i], has = answered(i);
    var mark = ok ? '<span style="color:var(--green)">верно</span>' : has ? '<span style="color:var(--red)">неверно</span>' : '<span style="color:var(--muted)">нет ответа</span>';
    var body;
    if (SP.task === 6) {
      body = '<div class="expr">' + m7(t.expr) + '</div><p class="sp-ans">Твой ответ: ' + (has ? esc(SP.answers[i]) : '—') + ' · Правильный ответ: ' + esc(t.answer) + '</p>';
    } else {
      var opts = t.opts.map(function (o, k) {
        var cls = 'opt' + (o.ok ? ' is-correct' : SP.answers[i] === k ? ' is-wrong' : ' is-dim');
        return '<button class="' + cls + '" disabled style="min-height:48px;font-size:18px"><span class="opt-letter">' + (k + 1) + '</span><span>' + m7(o.label) + (SP.answers[i] === k ? ' (твой ответ)' : '') + '</span></button>';
      }).join('');
      body = '<div class="expr" style="font-size:18px">' + m7(t.q) + '</div>' + figCard(t.fig, 'sp-r' + i) + '<div class="opts">' + opts + '</div>';
    }
    return '<section class="card sp-review"><div class="label">Задание ' + (i + 1) + ': ' + mark + '</div>' + body +
      '<div class="note note-primary"><div class="note-t">Разбор</div><div>' + m7(t.explain) + '</div></div></section>';
  }
  function renderReview() {
    var n = SP.tasks.length, names = SP.task === 6 ? L.SKILLS : L.SKILLS7, miss = {};
    SP.tasks.forEach(function (t, i) { if (!SP.res[i]) miss[t.skill] = (miss[t.skill] || 0) + 1; });
    var weak = Object.keys(miss).sort(function (a, b) { return miss[b] - miss[a]; }).slice(0, 3).map(function (k) { return names[k]; }).filter(Boolean);
    var good = SP.correct >= 8;
    app.innerHTML =
      '<div class="topbar"><button class="close" data-act="sp-exit" aria-label="Закрыть">' + ICON.close + '</button><div class="progress"><div class="progress-label">Спринт · разбор</div></div><div class="chip chip-pts">' + SP.pts + ' очков</div></div>' +
      '<div class="hero" style="padding-top:12px">' + (good ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div>' : '<div class="badge badge-warn pop">' + ICON.excl + '</div>') +
      '<h1 class="h1">' + SP.correct + ' из ' + n + '</h1><div class="hero-sub">Время: ' + fmtTime(SP.sec) + ' из ' + fmtTime(SP.limit) + (SP.timeout ? ' · время вышло' : '') + (SP.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid"><div class="stat"><div class="v">' + SP.correct + '</div><div class="k">верных ответов</div></div>' +
      '<div class="stat"><div class="v">' + (n - SP.correct) + '</div><div class="k">ошибок или пропусков</div></div></div>' +
      (weak.length ? '<section class="note note-amber"><div class="note-t">Что повторить</div><div>' + esc(weak.join('; ')) + '. Потренируйтесь в обычных режимах и сыграйте спринт ещё раз.</div></section>'
        : '<section class="note note-primary"><div class="note-t">Без ошибок</div><div>Все задания решены верно.</div></section>') +
      SP.tasks.map(reviewItem).join('') +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="start-sp' + SP.task + '" data-primary>Ещё один спринт</button><button class="btn btn-ghost" data-act="sp-exit">' + (SP.task === 7 ? 'В задание 7' : 'В задание 6') + '</button></div>';
    O.postRender();
  }

  /* ---------- блок отчёта ---------- */
  function two(n) { return n < 10 ? '0' + n : String(n); }
  O.sprintReport = function (task) {
    var st = O.stats, list = (st.sprints || []).filter(function (x) { return x.task === task; }), sk = 'sprint' + task;
    var rows = list.slice(-5).reverse().map(function (x) {
      var d = new Date(x.ts);
      return '<li>' + two(d.getDate()) + '.' + two(d.getMonth() + 1) + ': <b>' + x.correct + ' из ' + x.total + '</b>, время ' + fmtTime(x.sec) + ' из ' + fmtTime(x.limit) + '</li>';
    }).join('');
    return '<section class="card"><div class="label">Спринт: 10 заданий на время</div>' +
      (list.length ? '<ul class="list" style="margin-top:8px">' + rows + '</ul><p class="hint" style="margin-top:6px">Лучший результат: ' + (st.best[sk] || 0) + ' из 10. Спринтов сыграно: ' + (st.rounds[sk] || 0) + '.</p>'
        : '<p class="hint" style="margin-top:6px">Спринтов ещё не было. Режим стоит включать после освоения обычных режимов.</p>') + '</section>';
  };

  /* ---------- регистрация ---------- */
  O.screens.sp6 = render; O.screens.sp7 = render;
  Object.assign(O.ACT, {
    'start-sp6': function () { start(6); }, 'start-sp7': function () { start(7); },
    'sp-go': function (d) { go(Number(d.i)); },
    'sp-prev': function () { if (SP) go(SP.i - 1); }, 'sp-next': function () { if (SP) go(SP.i + 1); },
    'sp-pick': function (d) { pick(Number(d.i)); }, 'sp-key': function (d) { key(d.k); },
    'sp-finish': tryFinish, 'sp-exit': exit
  });
  O.keyHandlers.push(function (e, k) {
    if (!SP || SP.stage !== 'run' || SCR[SP.task] !== O.screen) return false;
    if (k === 'ArrowLeft') { go(SP.i - 1); return true; }
    if (k === 'ArrowRight') { go(SP.i + 1); return true; }
    if (SP.task === 7) { if (/^[1-4]$/.test(k)) { pick(Number(k) - 1); return true; } }
    else {
      if (/^\d$/.test(k)) { key(k); return true; }
      if (k === ',' || k === '.') { key(','); return true; }
      if (k === '-' || k === '−') { key('neg'); return true; }
      if (k === 'Backspace') { key('back'); return true; }
    }
    if (k === 'Enter') {
      if (document.activeElement && document.activeElement.tagName === 'BUTTON') return false; if (SP.i < SP.tasks.length - 1) go(SP.i + 1); else tryFinish(); return true; }
    return false;
  });
})();
