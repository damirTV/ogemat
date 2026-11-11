/* Вычисления без ошибок: интерфейс. Режимы «Прикидка» и «Сапёр ошибок»; остальные режимы в modes.js. */
(function () {
  'use strict';

  var L = window.Logic;
  var app = document.getElementById('app');
  var live = document.getElementById('live');
  var KEY = 'oge-calc-v1';

  /* Точка расширения: modes.js добавляет сюда свои экраны, действия и клавиши */
  var OGE = window.OGE = { screens: {}, ACT: {}, keyHandlers: [] };

  var stats = loadStats();
  var P = null;          // состояние раунда «Прикидка»
  var S = null;          // состояние раунда «Сапёр ошибок»
  var screen = 'menu';
  var deferredPrompt = null;

  /* ---------- хранилище ---------- */
  function loadStats() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var s = JSON.parse(raw);
        if (s && typeof s === 'object') return L.migrateStats(s);
      }
    } catch (e) { /* хранилище недоступно */ }
    return L.defaultStats();
  }
  function saveStats() {
    try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch (e) { /* ничего */ }
  }

  /* ---------- вспомогательное ---------- */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  /* Мини-разметка: [21/5] — дробь, {числитель|знаменатель} — дробь с любым содержимым */
  function math(src) {
    src = src.replace(/\[(\d+)\/(\d+)\]/g, '{$1|$2}');
    function parse(s) {
      var out = '', i = 0;
      while (i < s.length) {
        var ch = s.charAt(i);
        if (ch === '{') {
          var depth = 1, j = i + 1, bar = -1;
          while (j < s.length && depth > 0) {
            var c = s.charAt(j);
            if (c === '{') depth++;
            else if (c === '}') depth--;
            else if (c === '|' && depth === 1 && bar < 0) bar = j;
            j++;
          }
          var num = s.slice(i + 1, bar), den = s.slice(bar + 1, j - 1);
          out += '<span class="fr"><span class="n">' + parse(num) + '</span><span class="d">' + parse(den) + '</span></span>';
          i = j;
        } else {
          out += esc(ch);
          i++;
        }
      }
      return out;
    }
    return parse(src);
  }
  function plain(src) {
    return src.replace(/\[(\d+)\/(\d+)\]/g, '$1/$2').replace(/\{/g, '(').replace(/\}/g, ')').replace(/\|/g, ' / ');
  }
  function announce(text) {
    live.textContent = '';
    setTimeout(function () { live.textContent = text; }, 30);
  }
  function times(k) {
    var m = k % 10, h = k % 100;
    return (m >= 2 && m <= 4 && !(h >= 12 && h <= 14)) ? 'раза' : 'раз';
  }
  function pct(ok, total) { return total ? Math.round(ok / total * 100) : null; }

  var ICON = {
    close: '<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M3 3l12 12M15 3L3 15"/></svg>',
    check: function (s) { return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 9.5l4 4 8-9"/></svg>'; },
    bulb: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/></svg>',
    warn: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;color:#A8232C"><path d="M12 3L2 20h20L12 3zM12 10v4.5M12 17.5v.01"/></svg>',
    excl: '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M12 5v9M12 18.5v.01"/></svg>',
    back: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 5H9l-6 7 6 7h11a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1zM15 9.5l-4 5M11 9.5l4 5"/></svg>',
    logo: '<svg width="38" height="38" viewBox="0 0 36 36" fill="none" aria-hidden="true"><rect x="6" y="16" width="24" height="4" rx="2" fill="#fff"/><circle cx="18" cy="8.5" r="3" fill="#FFC83D"/><circle cx="18" cy="27.5" r="3" fill="#FFC83D"/></svg>'
  };

  function topbar(label, percent, points) {
    return '<div class="topbar">' +
      '<button class="close" data-act="home" aria-label="Выйти на главную">' + ICON.close + '</button>' +
      '<div class="progress"><div class="progress-label">' + esc(label) + '</div>' +
      '<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + percent + '"><div class="bar-fill" style="width:' + percent + '%"></div></div></div>' +
      '<div class="chip chip-pts">' + points + ' очков</div></div>';
  }
  function taskCard(t, compact) {
    var long = t.expr.length > 18 ? ' is-long' : '';
    if (compact) {
      return '<section class="card task task-compact"><div class="kicker">Теперь посчитай точно</div>' +
        '<div class="expr' + long + '">' + math(t.expr) + '<span class="eq">= ?</span></div></section>';
    }
    return '<section class="card task"><div class="kicker">Найдите значение выражения</div>' +
      '<div class="expr' + long + '">' + math(t.expr) + '</div>' +
      '<div class="meta">Тип 6 · ' + esc(L.SKILLS[t.skill]) + '</div></section>';
  }
  function breakdown(rows, total) {
    return '<section class="card">' + rows.map(function (r) {
      return '<div class="brow"><span>' + esc(r.label) + '</span><span class="' + (r.pts > 0 ? 'plus' : 'zero') + '">' + (r.pts > 0 ? '+' + r.pts : '0') + '</span></div>';
    }).join('') + '<div class="sep"></div><div class="brow total"><span>Итого</span><span>' + (total > 0 ? '+' + total : '0') + '</span></div></section>';
  }
  function dots(n, total, cls) {
    var out = '';
    for (var i = 0; i < total; i++) out += '<span class="dot' + (cls ? ' ' + cls : '') + (i < n ? '' : ' off') + '"></span>';
    return '<span class="dots" aria-hidden="true">' + out + '</span>';
  }

  function postRender() {
    window.scrollTo(0, 0);
    var h = app.querySelector('h1');
    if (h) { h.setAttribute('tabindex', '-1'); try { h.focus({ preventScroll: true }); } catch (e) { /* ничего */ } }
  }
  function render() {
    if (screen === 'menu') renderMenu();
    else if (screen === 'home') renderHome();
    else if (screen === 'prik') renderPrik();
    else if (screen === 'saper') renderSaper();
    else if (screen === 'report') renderReport();
    else if (OGE.screens[screen]) OGE.screens[screen]();
  }


  /* ================== ГЛАВНОЕ МЕНЮ: ВЫБОР ЗАДАНИЯ ================== */
  /* ready: true — задание уже есть в игре; act — что открыть */
  var MENU = [
    { title: '5–6 классы', items: [
      { t: 'Задание 6', ready: true, act: 'home' },
      { t: 'Задание 7', ready: true, act: 'home7', stat: t7stat }
    ] },
    { title: '7 класс', items: [
      { t: 'Задания 1–5', ready: true, act: 'home15', stat: dachaStat },
      { t: 'Задание 9', note: 'Линейные уравнения', ready: true, act: 'home9', stat: function () { return qStat(9); } },
      { t: 'Задание 11', note: 'График функции', ready: true, act: 'home11', stat: function () { return qStat(11); } },
      { t: 'Задание 12', ready: true, act: 'home12', stat: function () { return qStat(12); } }
    ] },
    { title: '8 класс', items: [
      { t: 'Задание 8' },
      { t: 'Задание 9', note: 'Квадратные уравнения' },
      { t: 'Задание 15' },
      { t: 'Задание 24' }
    ] },
    { title: '9 класс', items: [
      { t: 'Задание 10' },
      { t: 'Задание 11', note: 'Параболы и гиперболы' }
    ].concat([13, 14, 16, 17, 18, 19, 20, 21, 22, 23, 25].map(function (n) { return { t: 'Задание ' + n }; })) }
  ];
  function soundBtn() {
    if (!OGE.sound) return '';
    var on = OGE.sound.on();
    return '<button class="btn-small" data-act="sound" aria-pressed="' + on + '">Звук: ' + (on ? 'включён' : 'выключен') + '</button>';
  }
  function totalRounds() {
    return Object.keys(stats.rounds).reduce(function (sum, k) { return /7$/.test(k) ? sum : sum + (stats.rounds[k] || 0); }, 0);
  }
  /* Строка статистики для плитки «Задание 7» */
  function t7stat() {
    var t = stats.t7 || {}, r = stats.rounds || {};
    var n = Object.keys(r).reduce(function (sum, k) { return /7$/.test(k) ? sum + (r[k] || 0) : sum; }, 0);
    return 'Очков: ' + (t.points || 0) + ' · раундов: ' + n;
  }
  /* Строка статистики для плиток заданий 9, 11, 12 (7 класс) */
  function qStat(t) { var q = OGE.statQ ? OGE.statQ(t) : { points: 0, rounds: 0 }; return 'Очков: ' + q.points + ' · раундов: ' + q.rounds; }
  /* Строка статистики для плитки «Задания 1–5» */
  function dachaStat() {
    var d = stats.dacha || {};
    return 'Очков: ' + (d.points || 0) + ' · раундов: ' + ((d.builds || 0) + (d.exams || 0));
  }
  function renderMenu() {
    screen = 'menu'; P = null; S = null;
    var install = deferredPrompt ? '<button class="btn-small" data-act="install">Установить приложение</button>' : '';
    var groups = MENU.map(function (g) {
      var tiles = g.items.map(function (it) {
        if (it.ready) {
          return '<button class="tile is-ready" data-act="' + it.act + '"><span class="tile-t">' + esc(it.t) + '</span>' +
            (it.note ? '<span class="tile-n">' + esc(it.note) + '</span>' : '') +
            '<span class="tile-s">' + (it.stat ? it.stat() : 'Очков: ' + stats.points + ' · раундов: ' + totalRounds()) + '</span></button>';
        }
        return '<div class="tile is-soon" aria-disabled="true"><span class="tile-t">' + esc(it.t) + '</span>' +
          (it.note ? '<span class="tile-n">' + esc(it.note) + '</span>' : '') + '<span class="tile-s">Скоро</span></div>';
      }).join('');
      return '<section class="menu-group" aria-label="' + esc(g.title) + '"><h2 class="menu-h">' + esc(g.title) + '</h2><div class="tiles">' + tiles + '</div></section>';
    }).join('');
    app.innerHTML =
      '<header class="home-hero"><div class="logo" aria-hidden="true">' + ICON.logo + '</div>' +
      '<h1 class="h1">ОГЭ по математике</h1>' +
      '<p class="lead">Выбери задание. Сейчас в игре готовы задания 1–5, 6, 7, 9, 11 и 12. Остальные появятся позже.</p></header>' +
      groups +
      '<div class="links spacer"><button class="btn-small" data-act="report">Отчёт для родителя</button><button class="btn-small" data-act="feedback">Обратная связь</button>' + soundBtn() + install + '</div>';
    postRender();
  }

  /* ================== ЗАДАНИЕ 6 (список режимов) ================== */
  function renderHome() {
    screen = 'home'; P = null; S = null;
    var g = stats.grade;
    var install = deferredPrompt ? '<button class="btn-small" data-act="install">Установить приложение</button>' : '';
    app.innerHTML =
      '<button class="btn-small back" data-act="menu">← Все задания</button>' +
      '<header class="home-hero"><div class="pill pill-primary" style="align-self:flex-start">5–6 классы</div>' +
      '<h1 class="h1">Задание 6</h1>' +
      '<p class="lead">Вычисления без ошибок. Тренируем действия с десятичными и обыкновенными дробями. В каждом режиме раунд состоит из 5 заданий и занимает около 5 минут.</p></header>' +
      '<div><div class="seg" role="radiogroup" aria-label="Класс">' +
      '<button role="radio" aria-checked="' + (g === 5) + '" class="' + (g === 5 ? 'is-on' : '') + '" data-act="grade" data-grade="5">5 класс</button>' +
      '<button role="radio" aria-checked="' + (g === 6) + '" class="' + (g === 6 ? 'is-on' : '') + '" data-act="grade" data-grade="6">6 класс</button></div>' +
      '<p class="hint" style="margin-top:8px">' + (g === 5
        ? 'В 5 классе: десятичные дроби и простые обыкновенные дроби.'
        : 'В 6 классе добавляются деление дробей, многоэтажные дроби и отрицательные ответы.') + '</p></div>' +
      '<button class="mode" data-act="start-prik"><span class="mode-t"><span>Прикидка</span><span class="pill pill-primary">5 заданий</span></span>' +
      '<span class="mode-d">Сначала оцени, где окажется ответ, и только потом считай точно. Так сразу видно, если «уехала запятая».</span>' +
      '<span class="mode-meta"><span class="mini">Лучший счёт: ' + stats.best.prikidka + '</span><span class="mini">Раундов: ' + stats.rounds.prikidka + '</span></span></button>' +
      '<button class="mode" data-act="start-saper"><span class="mode-t"><span>Сапёр ошибок</span><span class="pill pill-amber">5 решений</span></span>' +
      '<span class="mode-d">В решении спрятана ловушка. Найди строку с ошибкой, почини её и пополни каталог ловушек. Иногда ошибки нет.</span>' +
      '<span class="mode-meta"><span class="mini amber">Ловушек найдено: ' + L.catalogFound(stats) + ' из ' + L.trapCount() + '</span><span class="mini">Лучший счёт: ' + stats.best.saper + '</span></span></button>' +
      '<button class="mode" data-act="start-numline"><span class="mode-t"><span>Числовая прямая</span><span class="pill pill-primary">5 заданий</span></span>' +
      '<span class="mode-d">Отмечай числа и значения выражений на прямой, расставляй дроби и десятичные по порядку. Так видно, какое число больше.</span>' +
      '<span class="mode-meta"><span class="mini">Лучший счёт: ' + stats.best.numline + '</span><span class="mini">Раундов: ' + stats.rounds.numline + '</span></span></button>' +
      '<button class="mode" data-act="start-ws"><span class="mode-t"><span>Мастерская превращений</span><span class="pill pill-amber">5 заданий</span></span>' +
      '<span class="mode-d">Превращай обыкновенную дробь в десятичную и обратно цепочкой блоков. Чем короче цепочка, тем больше очков.</span>' +
      '<span class="mode-meta"><span class="mini amber">Лучший счёт: ' + stats.best.conversion + '</span><span class="mini">Раундов: ' + stats.rounds.conversion + '</span></span></button>' +
      '<button class="mode" data-act="start-orderops"><span class="mode-t"><span>Порядок действий</span><span class="pill pill-primary">5 заданий</span></span>' +
      '<span class="mode-d">Сначала расставь, в каком порядке выполнять действия, потом посчитай по шагам. Скобки, умножение, деление, всё по правилам.</span>' +
      '<span class="mode-meta"><span class="mini">Лучший счёт: ' + stats.best.orderops + '</span><span class="mini">Раундов: ' + stats.rounds.orderops + '</span></span></button>' +
      '<button class="mode" data-act="start-recipe"><span class="mode-t"><span>Рецептура</span><span class="pill pill-amber">5 заданий</span></span>' +
      '<span class="mode-d">Складывай и вычитай дроби в мерных стаканах: режь доли, пока они не станут одинаковыми. К концу раунда картинки исчезают.</span>' +
      '<span class="mode-meta"><span class="mini amber">Лучший счёт: ' + stats.best.recipe + '</span><span class="mini">Раундов: ' + stats.rounds.recipe + '</span></span></button>' +
      '<button class="mode" data-act="start-sp6"><span class="mode-t"><span>Спринт</span><span class="pill pill-amber">10 заданий · 15 минут</span></span>' +
      '<span class="mode-d">Режим для родителей: тренировка как на экзамене. 10 заданий, как в вариантах ОГЭ, на время, без подсказок, с итоговым разбором. Включайте после освоения обычных режимов.</span>' +
      '<span class="mode-meta"><span class="mini amber">Лучший результат: ' + (stats.best.sprint6 || 0) + ' из 10</span><span class="mini">Спринтов: ' + (stats.rounds.sprint6 || 0) + '</span></span></button>' +
      '<div class="links spacer"><button class="btn-small" data-act="report6">Отчёт по заданию 6</button>' + soundBtn() + install + '</div>';
    postRender();
  }

  /* ================== ПРИКИДКА ================== */
  function cur() { return P.tasks[P.i]; }
  function answerString() { return (P.neg ? L.MINUS : '') + P.input; }

  function startPrik() {
    P = {
      tasks: L.makePrikidkaRound(stats.grade, 5), i: 0, points: 0,
      stage: 'estimate', pick: null, estOk: false, hint: false, tries: 0,
      input: '', neg: false, msg: '', caught: false, conflict: null, shake: false, how: false,
      streak: 0, res: null, log: [], estOkCount: 0, firstCount: 0, caughtCount: 0, newBest: false
    };
    screen = 'prik';
    renderPrik();
  }
  function resetTaskState() {
    P.stage = 'estimate'; P.pick = null; P.estOk = false; P.hint = false; P.tries = 0;
    P.input = ''; P.neg = false; P.msg = ''; P.caught = false; P.conflict = null; P.how = false; P.res = null;
  }

  function renderPrik() {
    if (P.stage === 'end') { renderPrikEnd(); return; }
    var t = cur(), n = P.tasks.length;
    var done = P.stage === 'result' ? P.i + 1 : P.i;
    var body = '';
    if (P.stage === 'estimate') body = prikEstimate(t, false);
    else if (P.stage === 'estimate_fb') body = prikEstimate(t, true);
    else if (P.stage === 'answer') body = prikAnswer(t);
    else if (P.stage === 'conflict') body = prikConflict(t);
    else if (P.stage === 'result') body = prikResult(t);
    app.innerHTML = topbar('Задание ' + (P.i + 1) + ' из ' + n, Math.round(done / n * 100), P.points) + body;
    P.shake = false;
    postRender();
  }

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
      return '<button class="' + cls + '" data-act="pick" data-i="' + i + '"' + dis + '><span class="opt-letter">' + letters[i] + '</span><span>' + esc(o.label) + '</span></button>';
    }).join('');
    var hintBox = (P.hint && !fb) ? '<div class="banner banner-info"><b>Подсказка.</b> Округли числа: ' + esc(t.hintOps) + '.</div>' : '';
    var fbBox = fb ? '<div class="banner banner-warn"><b>Не совсем.</b> Округлим: ' + esc(t.hintOps) + '. Выходит около ' + L.fmt(t.approxResult) + ', поэтому правильный промежуток: «' + esc(t.est.options[t.est.correctIndex].label) + '».</div>' : '';
    var tail = fb
      ? '<button class="btn btn-primary spacer" data-act="est-next" data-primary>Дальше</button>'
      : '<div class="foot spacer"><button class="btn-small" data-act="hint"' + (P.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Верная прикидка<br>+10 очков</div></div>';
    return '<div class="head"><div class="pill pill-primary">Прикидка</div><h1 class="h1">Где окажется ответ?</h1>' +
      '<p class="lead">Не считай до конца. Округли числа в уме и выбери, где примерно будет результат.</p></div>' +
      taskCard(t, false) + hintBox +
      '<div class="opts" role="group" aria-label="Варианты прикидки"><div class="label">Выбери промежуток</div>' + opts + '</div>' + fbBox + tail;
  }

  function fieldHTML() {
    var v = answerString();
    return '<div class="field' + (P.shake ? ' shake' : '') + '" id="field"><span id="fieldText">' + (v ? esc(v) : '<span class="ph">Введи ответ</span>') + '</span><span class="caret" aria-hidden="true"></span></div>';
  }
  function keypadHTML() {
    var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', ',', '0', 'back'];
    return '<div class="keypad" role="group" aria-label="Цифры">' + keys.map(function (k) {
      if (k === 'back') return '<button class="key" data-act="key" data-k="back" aria-label="Стереть">' + ICON.back + '</button>';
      return '<button class="key" data-act="key" data-k="' + k + '">' + (k === ',' ? ',' : k) + '</button>';
    }).join('') + '</div>';
  }

  function prikAnswer(t) {
    var label = t.est.options[t.est.correctIndex].label;
    var chip = P.estOk
      ? '<div class="chip chip-ok" style="align-self:flex-start">' + ICON.check(18) + ' Твоя прикидка: ' + esc(label) + '</div>'
      : '<div class="chip chip-info" style="align-self:flex-start">Ориентир: ' + esc(label) + '</div>';
    var howBox = P.how ? '<div class="note note-primary"><div class="note-t">Как считать</div><div>' + esc(t.explain) + '</div></div>' : '';
    var msg = P.msg ? '<div class="banner banner-warn" id="msg">' + esc(P.msg) + '</div>' : '';
    var minus = t.allowNeg
      ? '<button class="minus' + (P.neg ? ' is-on' : '') + '" data-act="neg" aria-pressed="' + P.neg + '" aria-label="Минус">' + L.MINUS + '</button>' : '';
    return '<h1 class="sr-only">Введи точный ответ</h1>' + chip + taskCard(t, true) +
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="foot"><span class="label">Твой ответ</span><span class="label">Попытка ' + (P.tries + 1) + ' из 2</span></div>' +
      '<div class="field-row">' + fieldHTML() + minus + '</div>' +
      '<div class="hint">Запиши как на экзамене: десятичная дробь через запятую, без пробелов.</div></div>' +
      msg + howBox + keypadHTML() +
      '<button class="btn btn-primary spacer" data-act="check" data-primary' + (P.input ? '' : ' disabled') + '>Проверить</button>';
  }

  function scaleHTML(s, a) {
    if ((s < 0) !== (a < 0)) {
      return '<div class="two"><div class="a"><div class="cap">Прикидка</div><div class="big">' + L.fmt(s) + '</div></div>' +
        '<div class="b"><div class="cap">Твой ответ</div><div class="big">' + L.fmt(a) + '</div></div></div>';
    }
    var la = Math.log10(Math.abs(s)), lb = Math.log10(Math.abs(a));
    var lo = Math.floor(Math.min(la, lb)), hi = Math.ceil(Math.max(la, lb));
    if (hi - lo < 1) hi = lo + 1;
    if (hi - lo > 6) return '';
    function X(l) { return 40 + (l - lo) / (hi - lo) * 230; }
    var ticks = '';
    for (var k = lo; k <= hi; k++) {
      var x = X(k);
      ticks += '<line x1="' + x + '" y1="49" x2="' + x + '" y2="63" stroke="#B9B0A0" stroke-width="3"/>' +
        '<text x="' + x + '" y="84" text-anchor="middle" fill="#5A5F7A" font-size="14" font-weight="700">' + L.fmt(Math.pow(10, k)) + '</text>';
    }
    var xs = X(la), xa = X(lb);
    return '<div class="scale"><svg viewBox="0 0 310 96" role="img" aria-label="Шкала: прикидка ' + L.fmt(s) + ', твой ответ ' + L.fmt(a) + '">' +
      '<line x1="20" y1="56" x2="290" y2="56" stroke="#B9B0A0" stroke-width="3" stroke-linecap="round"/>' + ticks +
      '<circle cx="' + xs + '" cy="56" r="9" fill="#2FB383"/><text x="' + xs + '" y="32" text-anchor="middle" fill="#0F6B4E" font-size="15" font-weight="800">≈ ' + L.fmt(s) + '</text>' +
      '<circle cx="' + xa + '" cy="56" r="9" fill="#E5484D"/><text x="' + xa + '" y="32" text-anchor="middle" fill="#A8232C" font-size="15" font-weight="800">' + L.fmt(a) + '</text></svg></div>';
  }

  function prikConflict(t) {
    var c = P.conflict, s = t.est.s, num = c.num, why, kind;
    if ((s < 0) !== (num < 0)) {
      why = 'У ответа ' + L.fmt(num) + ' другой знак, чем у прикидки. Проверь, какое число больше: если из меньшего вычитают большее, получится отрицательное число.';
      kind = 'знак ответа';
    } else {
      var r = Math.abs(num / s);
      if (r >= 1) {
        var k = Math.round(r);
        why = 'Число ' + L.fmt(num) + ' примерно в ' + k + ' ' + times(k) + ' больше. ' + (k >= 8 && k <= 12 ? 'Скорее всего, запятая уехала.' : 'Проверь вычисления.');
        kind = k >= 8 && k <= 12 ? 'положение запятой' : 'порядок числа';
      } else {
        var m = Math.round(1 / r);
        why = 'Число ' + L.fmt(num) + ' примерно в ' + m + ' ' + times(m) + ' меньше. ' + (m >= 8 && m <= 12 ? 'Скорее всего, запятая уехала.' : 'Проверь вычисления.');
        kind = m >= 8 && m <= 12 ? 'положение запятой' : 'порядок числа';
      }
    }
    var text = 'Округлим: ' + t.hintOps + '. Выходит около ' + L.fmt(t.approxResult) + '. ' + why;
    var howBox = P.how ? '<div class="note note-primary"><div class="note-t">Как считать</div><div>' + esc(t.explain) + '</div></div>' : '';
    var howBtn = P.how ? '' : '<button class="btn btn-ghost" data-act="show-how">Показать, как считать (−5 очков)</button>';
    return '<div class="banner banner-err"><h1 class="banner-title">' + ICON.warn + '<span>Стоп! Ответ не сходится с прикидкой</span></h1><div>' + esc(text) + '</div></div>' +
      '<div style="display:flex;flex-direction:column;gap:8px"><div class="chip chip-ok" style="align-self:flex-start">Прикидка: ' + esc(t.est.options[t.est.correctIndex].label) + '</div>' +
      '<div class="field is-bad"><span>' + esc(c.str) + '</span><span class="field-tag">ответ ещё не отправлен</span></div></div>' +
      scaleHTML(s, num) +
      '<div class="foot"><span class="chip chip-trap">Ошибка: ' + kind + '</span><div class="foot-note">Попытка<br>не потрачена</div></div>' + howBox +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="fix-answer" data-primary>Исправить ответ</button>' + howBtn + '</div>';
  }

  function prikResult(t) {
    var r = P.res, sc = r.sc;
    var label = t.est.options[t.est.correctIndex].label;
    var rows = [
      { label: 'Прикидка «' + label + '»', pts: sc.est },
      { label: 'Точный ответ' + (r.ok && P.tries === 2 ? ' (со 2-й попытки)' : ''), pts: sc.exact },
      { label: 'Без подсказки', pts: sc.noHint }
    ];
    var hero = r.ok
      ? '<div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Верно!</h1><div class="hero-sub">' + math(t.expr) + ' = ' + L.fmt(t.value) + '</div>'
      : '<div class="badge badge-warn pop">' + ICON.excl + '</div><h1 class="h1">Не получилось</h1><div class="hero-sub">Правильный ответ: ' + L.fmt(t.value) + '</div>';
    var last = P.i + 1 >= P.tasks.length;
    return '<div class="hero">' + hero + '</div>' + breakdown(rows, sc.total) +
      '<section class="card streak"><div><div class="streak-t">Серия верных прикидок</div><div class="streak-s">' + P.streak + ' подряд</div></div>' + dots(Math.min(P.streak, 5), 5) + '</section>' +
      '<section class="note note-primary"><div class="note-t">Как считать</div><div>' + esc(t.explain) + '</div></section>' +
      '<button class="btn btn-primary spacer" data-act="prik-next" data-primary>' + (last ? 'Показать итог' : 'Следующее задание') + '</button>';
  }

  function renderPrikEnd() {
    var best = stats.best.prikidka;
    var weak = {};
    P.log.forEach(function (x) { if (!x.first) weak[x.skill] = (weak[x.skill] || 0) + 1; });
    var weakList = Object.keys(weak).sort(function (a, b) { return weak[b] - weak[a]; }).slice(0, 2).map(function (k) { return L.SKILLS[k]; });
    var n = P.tasks.length;
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
      '<div class="actions spacer"><button class="btn btn-primary" data-act="start-prik" data-primary>Сыграть ещё</button>' +
      '<button class="btn btn-ghost" data-act="start-saper">Сапёр ошибок</button><button class="btn btn-ghost" data-act="home">На главную</button></div>';
    postRender();
  }

  function prikPick(i) {
    if (!P || P.stage !== 'estimate') return;
    var t = cur();
    P.pick = i;
    P.estOk = i === t.est.correctIndex;
    if (P.estOk) { P.streak++; P.stage = 'answer'; announce('Верная прикидка'); }
    else { P.streak = 0; P.stage = 'estimate_fb'; announce('Прикидка неверная'); }
    renderPrik();
  }
  function prikKey(k) {
    if (!P || P.stage !== 'answer') return;
    if (k === 'back') P.input = P.input.slice(0, -1);
    else if (k === ',') { if (P.input.indexOf(',') < 0) P.input += P.input === '' ? '0,' : ','; }
    else {
      if (P.input.replace(/\D/g, '').length >= 7) return;
      P.input = (P.input === '0') ? k : P.input + k;
    }
    updateField();
  }
  function toggleMinus() {
    if (!P || P.stage !== 'answer' || !cur().allowNeg) return;
    P.neg = !P.neg;
    updateField();
  }
  function updateField() {
    var ft = document.getElementById('fieldText');
    if (!ft) return;
    var v = answerString();
    ft.innerHTML = v ? esc(v) : '<span class="ph">Введи ответ</span>';
    var b = app.querySelector('[data-act="check"]');
    if (b) b.disabled = !P.input;
    var m = document.getElementById('msg');
    if (m) { m.remove(); P.msg = ''; }
    var mb = app.querySelector('[data-act="neg"]');
    if (mb) { mb.classList.toggle('is-on', P.neg); mb.setAttribute('aria-pressed', String(P.neg)); }
  }
  function prikCheck() {
    if (!P || P.stage !== 'answer' || !P.input) return;
    var t = cur(), str = answerString(), num = L.parseAnswer(str);
    if (isNaN(num)) { P.msg = 'Допиши число после запятой или введи его целиком.'; renderPrik(); return; }
    if (L.estimateConflict(t.est.s, num)) {
      if (!P.caught) { P.caught = true; P.caughtCount++; }
      P.conflict = { num: num, str: str };
      P.stage = 'conflict';
      announce('Стоп, ответ не сходится с прикидкой');
      renderPrik();
      return;
    }
    P.tries++;
    if (L.isCorrect(t.value, num)) finishPrik(true);
    else if (P.tries >= 2) finishPrik(false);
    else {
      P.msg = 'Почти! Проверь запятую и порядок действий. Осталась одна попытка.';
      P.input = ''; P.neg = false; P.shake = true;
      announce('Неверно, осталась одна попытка');
      renderPrik();
    }
  }
  function finishPrik(ok) {
    var t = cur();
    var sc = L.scorePrikidka({ estOk: P.estOk, tries: P.tries, ok: ok, hint: P.hint });
    P.points += sc.total;
    var first = ok && P.tries === 1;
    if (P.estOk) P.estOkCount++;
    if (first) P.firstCount++;
    P.log.push({ skill: t.skill, first: first });
    L.recordPrikidka(stats, t, { estOk: P.estOk, exactFirst: first, caught: P.caught, points: sc.total });
    saveStats();
    P.res = { ok: ok, sc: sc };
    P.stage = 'result';
    announce(ok ? 'Верно' : 'Не получилось, правильный ответ ' + L.fmt(t.value));
    renderPrik();
  }
  function prikNext() {
    if (P.i + 1 >= P.tasks.length) {
      var prev = stats.best.prikidka;
      stats.rounds.prikidka++;
      if (P.points > prev) { stats.best.prikidka = P.points; P.newBest = prev > 0; }
      saveStats();
      P.stage = 'end';
    } else {
      P.i++;
      resetTaskState();
    }
    renderPrik();
  }

  /* ================== САПЁР ОШИБОК ================== */
  function curS() { return S.items[S.i]; }

  function startSaper() {
    S = {
      items: L.makeSaperRound(stats.grade, 5), i: 0, points: 0, stage: 'find',
      wrongTaps: [], okRows: [], attempts: 3, wrongFix: [], hint: false, msg: '',
      found: false, foundFirst: false, fixedOk: false, shakeRow: -1, res: null,
      foundCount: 0, firstCount: 0, trapsFound: [], newBest: false
    };
    screen = 'saper';
    renderSaper();
  }
  function resetItemState() {
    S.stage = 'find'; S.wrongTaps = []; S.okRows = []; S.attempts = 3; S.wrongFix = [];
    S.hint = false; S.msg = ''; S.found = false; S.foundFirst = false; S.fixedOk = false; S.shakeRow = -1; S.res = null;
  }

  function renderSaper() {
    if (S.stage === 'end') { renderSaperEnd(); return; }
    var n = S.items.length, it = curS();
    var done = S.stage === 'result' ? S.i + 1 : S.i;
    var body = '';
    if (S.stage === 'find') body = saperFind(it);
    else if (S.stage === 'fix') body = saperFix(it);
    else body = saperResult(it);
    app.innerHTML = topbar('Решение ' + (S.i + 1) + ' из ' + n, Math.round(done / n * 100), S.points) + body;
    S.shakeRow = -1;
    postRender();
  }

  function saperFind(it) {
    var rows = it.steps.map(function (s, i) {
      var ok = S.okRows.indexOf(i) >= 0;
      return '<button class="srow' + (ok ? ' is-ok' : '') + (S.shakeRow === i ? ' shake' : '') + '" data-act="step" data-i="' + i + '"' + (ok ? ' disabled' : '') +
        ' aria-label="Строка ' + (i + 1) + ': ' + esc(plain(s)) + '"><span class="num">' + (i + 1) + '</span><span class="sx">' + math(s) + '</span>' +
        (ok ? '<span class="stag">ошибки нет</span>' : '') + '</button>';
    }).join('');
    var hintBox = S.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + esc(it.hint) + '</div>' : '';
    var msg = S.msg ? '<div class="banner banner-warn" role="status">' + esc(S.msg) + '</div>' : '';
    return '<div class="head"><div class="pill pill-amber">Сапёр ошибок</div><h1 class="h1">Проверь решение</h1>' +
      '<p class="lead">' + esc(it.who + ' ' + it.verb + ' ответ ') + '<b style="color:var(--ink)">' + esc(it.final) + '</b>' + esc('. Нажми на строку с ошибкой. Если ошибки нет, так и скажи.') + '</p></div>' +
      '<div><div class="foot" style="margin-bottom:8px"><span class="label">Решение: ' + esc(it.who) + '</span><span class="label" style="display:flex;align-items:center;gap:6px">Попытки ' + dots(S.attempts, 3, 'amber') + '</span></div>' +
      '<div class="rows">' + rows + '</div></div>' + hintBox + msg +
      '<div class="foot spacer" style="gap:10px"><button class="btn-small" style="flex:1;justify-content:center" data-act="no-error">Ошибки нет</button>' +
      '<button class="btn-small" style="flex:1;justify-content:center" data-act="saper-hint"' + (S.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button></div>';
  }

  function saperFix(it) {
    var letters = ['А', 'Б', 'В'];
    var ctx = '';
    for (var i = 0; i <= it.err; i++) {
      var bad = i === it.err;
      ctx += '<div class="srow is-quiet' + (bad ? ' is-err' : '') + '"><span class="num">' + (i + 1) + '</span><span class="sx">' + math(it.steps[i]) + '</span>' + (bad ? '<span class="stag">Ошибка здесь</span>' : '') + '</div>';
    }
    var opts = it.fixes.map(function (f, i) {
      var wrong = S.wrongFix.indexOf(i) >= 0;
      return '<div style="display:flex;flex-direction:column;gap:6px"><button class="opt' + (wrong ? ' is-wrong' : '') + '" data-act="fix" data-i="' + i + '"' + (wrong ? ' disabled' : '') +
        ' aria-label="Вариант ' + letters[i] + ': ' + esc(plain(f.s)) + '"><span class="opt-letter">' + letters[i] + '</span><span class="sx">' + math(f.s) + '</span></button>' +
        (wrong ? '<div class="opt-note" role="status">' + esc(f.note) + '</div>' : '') + '</div>';
    }).join('');
    var hintBox = S.hint ? '<div class="banner banner-info"><b>Подсказка.</b> ' + esc(L.TRAPS[it.trap].rule) + '</div>' : '';
    return '<div class="head"><div class="pill pill-amber">Сапёр ошибок</div><h1 class="h1 sm">Нашёл! Теперь почини строку ' + (it.err + 1) + '</h1>' +
      '<p class="lead">Какая строка должна стоять на её месте?</p></div>' +
      '<div class="rows" style="gap:8px">' + ctx + '</div>' +
      '<div class="opts" role="group" aria-label="Варианты исправления"><div class="label">Выбери верную строку ' + (it.err + 1) + '</div>' + opts + '</div>' + hintBox +
      '<div class="foot spacer"><button class="btn-small" data-act="saper-hint"' + (S.hint ? ' disabled' : '') + '>' + ICON.bulb + ' Подсказка</button><div class="foot-note">Без подсказки<br>+10 очков</div></div>';
  }

  function saperResult(it) {
    var hasErr = it.err !== null, sc = S.res.sc;
    var trap = hasErr ? L.TRAPS[it.trap] : null;
    var hero, sub = '';
    if (hasErr && S.found && S.fixedOk) { hero = ['ok', 'Мина обезврежена!']; sub = 'Правильный ответ: ' + it.answer; }
    else if (hasErr && S.found) { hero = ['warn', 'Ошибку нашёл, исправим вместе']; sub = 'Правильный ответ: ' + it.answer; }
    else if (hasErr) { hero = ['warn', 'Ловушка осталась']; sub = 'Ошибка была в строке ' + (it.err + 1) + '. Правильный ответ: ' + it.answer; }
    else if (S.found) { hero = ['ok', 'Решение верное!']; sub = 'Ошибки нет, ответ ' + it.answer; }
    else { hero = ['warn', 'Решение было верным']; sub = 'Ошибки не было, ответ ' + it.answer; }
    var rows = it.solution.map(function (s, i) {
      var fixed = hasErr && i === it.err;
      return '<div class="srow' + (fixed ? ' is-fixed' : '') + '"><span class="sx">' + math(s) + '</span>' + (fixed ? '<span class="stag">исправлено</span>' : '') + '</div>';
    }).join('');
    var pr = hasErr
      ? [{ label: 'Нашёл ошибку', pts: sc.find }, { label: 'Исправил', pts: sc.fix }, { label: 'Без подсказки', pts: sc.noHint }]
      : [{ label: 'Проверил решение', pts: sc.find }, { label: 'Без подсказки', pts: sc.noHint }];
    var found = L.catalogFound(stats), total = L.trapCount();
    var parent = hasErr
      ? 'В отчёт родителю попадёт запись: «' + trap.name + '» — ' + (S.foundFirst && S.fixedOk ? 'найдена с первой попытки.' : 'нужна ещё тренировка.')
      : 'Проверка верного решения тренирует внимательность: не каждое решение с ошибкой.';
    var last = S.i + 1 >= S.items.length;
    return '<div class="hero"><div class="badge badge-' + hero[0] + ' pop">' + (hero[0] === 'ok' ? ICON.check(36) : ICON.excl) + '</div><h1 class="h1" style="font-size:28px">' + esc(hero[1]) + '</h1><div class="hero-sub" style="font-size:18px">' + esc(sub) + '</div></div>' +
      '<section class="card sol"><div class="label">Верное решение</div>' + rows + '</section>' +
      (hasErr ? '<section class="note note-amber"><div class="note-t">Ловушка: ' + esc(trap.name) + '</div><div>' + esc(trap.rule) + '</div></section>' : '') +
      breakdown(pr, sc.total) +
      '<section class="card" style="display:flex;flex-direction:column;gap:10px"><div class="foot"><span class="label" style="color:var(--ink)">Каталог ловушек</span><span class="label">' + found + ' из ' + total + '</span></div>' +
      '<div class="bar"><div class="bar-fill amber" style="width:' + Math.round(found / total * 100) + '%"></div></div><div class="hint">' + esc(parent) + '</div></section>' +
      '<button class="btn btn-primary spacer" data-act="saper-next" data-primary>' + (last ? 'Показать итог' : 'Следующее решение') + '</button>';
  }

  function saperTap(i) {
    if (!S || S.stage !== 'find') return;
    var it = curS();
    if (i < 0 || i >= it.steps.length || S.okRows.indexOf(i) >= 0) return;
    if (i === it.err) {
      S.found = true; S.foundFirst = S.wrongTaps.length === 0; S.stage = 'fix'; S.msg = '';
      announce('Верно, ошибка в этой строке');
      renderSaper();
      return;
    }
    S.wrongTaps.push(i); S.okRows.push(i); S.attempts--; S.shakeRow = i;
    S.msg = 'В строке ' + (i + 1) + ' ошибки нет.';
    announce(S.msg);
    if (S.attempts <= 0) finishSaper(); else renderSaper();
  }
  function saperNoError() {
    if (!S || S.stage !== 'find') return;
    var it = curS();
    if (it.err === null) {
      S.found = true; S.foundFirst = S.wrongTaps.length === 0;
      finishSaper();
      return;
    }
    S.wrongTaps.push('none'); S.attempts--;
    S.msg = 'Ошибка в этом решении есть. Найди строку, где всё пошло не так.';
    announce(S.msg);
    if (S.attempts <= 0) finishSaper(); else renderSaper();
  }
  function saperFixPick(i) {
    if (!S || S.stage !== 'fix') return;
    var it = curS(), f = it.fixes[i];
    if (!f || S.wrongFix.indexOf(i) >= 0) return;
    if (f.ok) { S.fixedOk = true; finishSaper(); return; }
    S.wrongFix.push(i);
    announce(f.note);
    if (S.wrongFix.length >= 2) finishSaper(); else renderSaper();
  }
  function finishSaper() {
    var it = curS();
    var sc = L.scoreSaper({ hasError: it.err !== null, foundOk: S.found, fixOk: S.fixedOk, wrongTaps: S.wrongTaps.length, wrongFix: S.wrongFix.length, hint: S.hint });
    S.points += sc.total;
    if (S.found) S.foundCount++;
    if (S.foundFirst && (it.err === null || S.fixedOk)) S.firstCount++;
    if (it.trap && S.found && S.trapsFound.indexOf(it.trap) < 0) S.trapsFound.push(it.trap);
    L.recordSaper(stats, it, { found: S.found, foundFirst: S.foundFirst, fixedOk: S.fixedOk, points: sc.total });
    saveStats();
    S.res = { sc: sc };
    S.stage = 'result';
    renderSaper();
  }
  function saperNext() {
    if (S.i + 1 >= S.items.length) {
      var prev = stats.best.saper;
      stats.rounds.saper++;
      if (S.points > prev) { stats.best.saper = S.points; S.newBest = prev > 0; }
      saveStats();
      S.stage = 'end';
    } else {
      S.i++;
      resetItemState();
    }
    renderSaper();
  }
  function renderSaperEnd() {
    var n = S.items.length;
    var names = S.trapsFound.map(function (k) { return L.TRAPS[k].name; });
    app.innerHTML =
      '<div class="hero" style="padding-top:20px"><div class="badge badge-ok pop">' + ICON.check(36) + '</div><h1 class="h1">Раунд завершён</h1>' +
      '<div class="hero-sub">' + S.points + ' очков' + (S.newBest ? ' · новый рекорд!' : '') + '</div></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + S.foundCount + ' из ' + n + '</div><div class="k">решений разобрано</div></div>' +
      '<div class="stat"><div class="v">' + S.firstCount + ' из ' + n + '</div><div class="k">с первой попытки</div></div>' +
      '<div class="stat"><div class="v">' + S.trapsFound.length + '</div><div class="k">ловушек найдено</div></div>' +
      '<div class="stat"><div class="v">' + L.catalogFound(stats) + ' из ' + L.trapCount() + '</div><div class="k">в каталоге</div></div></div>' +
      (names.length ? '<section class="note note-amber"><div class="note-t">Сегодня обезврежено</div><ul class="list" style="margin-top:4px">' + names.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' : '') +
      '<div class="actions spacer"><button class="btn btn-primary" data-act="start-saper" data-primary>Сыграть ещё</button>' +
      '<button class="btn btn-ghost" data-act="start-prik">Прикидка</button><button class="btn btn-ghost" data-act="home">На главную</button></div>';
    postRender();
  }

  /* ================== ОТЧЁТ ДЛЯ РОДИТЕЛЯ ================== */
  /* scope: 'all' — общий отчёт из главного меню (по всем заданиям); '6' и '7' — только одно задание */
  var reportScope = 'all';
  function roundsOf(is7) {
    return Object.keys(stats.rounds).reduce(function (sum, k) { return /7$/.test(k) === is7 ? sum + (stats.rounds[k] || 0) : sum; }, 0);
  }
  function report6Body() {
    var rounds = roundsOf(false);
    var est = pct(stats.estimate.ok, stats.estimate.total);
    var skillRows = Object.keys(L.SKILLS).map(function (id) {
      var s = stats.skills[id] || { ok: 0, total: 0 };
      var p = pct(s.ok, s.total);
      var cls = p === null ? '' : p >= 80 ? 'good' : p >= 60 ? 'mid' : 'low';
      return '<div class="skill"><div class="skill-top"><span>' + esc(L.SKILLS[id]) + '</span><span>' + (p === null ? 'нет данных' : s.ok + ' из ' + s.total) + '</span></div>' +
        '<div class="bar"><div class="bar-fill ' + cls + '" style="width:' + (p || 0) + '%"></div></div></div>';
    }).join('');
    var weak = Object.keys(L.SKILLS).filter(function (id) {
      var s = stats.skills[id]; return s && s.total >= 3 && pct(s.ok, s.total) < 70;
    });
    var missed = Object.keys(L.TRAPS).filter(function (k) {
      var t = stats.traps[k]; return t && t.seen >= 2 && t.first / t.seen < 0.5;
    });
    var recs = [];
    if (!rounds) recs.push('Сыграйте хотя бы один раунд в задании 6, и здесь появятся выводы.');
    if (weak.length) recs.push('Стоит потренировать: ' + weak.map(function (k) { return L.SKILLS[k].toLowerCase(); }).join('; ') + '.');
    if (missed.length) recs.push('Часто не замечает ошибку: ' + missed.map(function (k) { return '«' + L.TRAPS[k].name.toLowerCase() + '»'; }).join('; ') + '.');
    if (rounds && !weak.length && !missed.length) recs.push('Слабых мест в задании 6 пока не видно. Продолжайте, раз в несколько дней по одному раунду.');
    if (stats.estimate.caught) recs.push('Прикидка уже поймала ' + stats.estimate.caught + ' ' + (stats.estimate.caught % 10 === 1 && stats.estimate.caught % 100 !== 11 ? 'ошибку' : 'ошибок') + ' до отправки ответа: хороший признак.');
    var trapRows = Object.keys(L.TRAPS).map(function (k) {
      var t = stats.traps[k];
      return '<li><b>' + esc(L.TRAPS[k].name) + '</b>: ' + (t && t.seen ? 'найдена ' + t.found + ' из ' + t.seen + (t.found ? '' : ', пока не замечает') : 'ещё не встречалась') + '</li>';
    }).join('');
    return '<div class="stat-grid">' +
      '<div class="stat"><div class="v">' + stats.points + '</div><div class="k">очков в задании 6</div></div>' +
      '<div class="stat"><div class="v">' + rounds + '</div><div class="k">раундов сыграно</div></div>' +
      '<div class="stat"><div class="v">' + (est === null ? '—' : est + '%') + '</div><div class="k">верных прикидок</div></div>' +
      '<div class="stat"><div class="v">' + L.catalogFound(stats) + ' из ' + L.trapCount() + '</div><div class="k">ловушек в каталоге</div></div></div>' +
      '<section class="card"><div class="label">Навыки: ответы с первой попытки</div><div style="margin-top:6px">' + skillRows + '</div></section>' +
      '<section class="note note-primary"><div class="note-t">Что делать дальше</div><ul class="list">' + recs.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></section>' +
      '<section class="card"><div class="label">Типичные ловушки</div><ul class="list" style="margin-top:8px">' + trapRows + '</ul></section>' +
      (OGE.sprintReport ? OGE.sprintReport(6) : '');
  }
  function reportTitle(t) { return '<div class="head" style="margin-top:8px"><h2 class="h1 sm">' + esc(t) + '</h2></div>'; }
  function renderReport(scope) {
    screen = 'report';
    if (scope) reportScope = scope;
    var sc = reportScope, html;
    var body7 = OGE.report7Body ? OGE.report7Body() : '';
    if (sc === '6') {
      html = '<button class="btn-small back" data-act="home">← Задание 6</button>' +
        '<div class="head"><h1 class="h1">Отчёт: задание 6</h1><p class="lead">Дроби и десятичные дроби. Данные хранятся только на этом устройстве. Класс: ' + stats.grade + '.</p></div>' + report6Body();
    } else if (sc === '7') {
      html = '<button class="btn-small back" data-act="home7">← Задание 7</button>' +
        '<div class="head"><h1 class="h1">Отчёт: задание 7</h1><p class="lead">Числа на координатной прямой. Данные хранятся только на этом устройстве. Класс: ' + stats.grade + '.</p></div>' + body7;
    } else if (/^q(9|11|12)$/.test(sc)) {
      var qt = Number(sc.slice(1)), qq = OGE.Q7 ? OGE.Q7[qt] : null;
      html = '<button class="btn-small back" data-act="q-home">← Задание ' + qt + '</button>' +
        '<div class="head"><h1 class="h1">Отчёт: задание ' + qt + '</h1><p class="lead">' + (qq ? esc(qq.sub) + '. ' : '') + 'Данные хранятся только на этом устройстве.</p></div>' + (OGE.reportQBody ? OGE.reportQBody(qt) : '');
    } else if (sc === '15') {
      html = '<button class="btn-small back" data-act="home15">← Задания 1–5</button>' +
        '<div class="head"><h1 class="h1">Отчёт: задания 1–5</h1><p class="lead">Практические задачи 7 класса. Данные хранятся только на этом устройстве.</p></div>' + (OGE.report15Body ? OGE.report15Body() : '');
    } else {
      var t7 = (stats.t7 && stats.t7.points) || 0, d15 = (stats.dacha && stats.dacha.points) || 0, r15 = stats.dacha ? stats.dacha.builds + stats.dacha.exams : 0;
      [9, 11, 12].forEach(function (qt) { if (OGE.statQ) { var q = OGE.statQ(qt); d15 += q.points; r15 += q.rounds; } });
      html = '<button class="btn-small back" data-act="menu">← Все задания</button>' +
        '<div class="head"><h1 class="h1">Отчёт для родителя</h1><p class="lead">Общий отчёт по всем заданиям. Данные хранятся только на этом устройстве. Сейчас в игре готовы задания 1–5, 6, 7, 9, 11 и 12, класс: ' + stats.grade + '.</p></div>' +
        '<div class="stat-grid">' +
        '<div class="stat"><div class="v">' + (stats.points + t7 + d15) + '</div><div class="k">очков всего</div></div>' +
        '<div class="stat"><div class="v">' + (roundsOf(false) + roundsOf(true) + r15) + '</div><div class="k">раундов всего</div></div></div>' +
        reportTitle('Задание 6. Дроби и десятичные дроби') + report6Body() +
        reportTitle('Задание 7. Числа на координатной прямой') + body7 +
        reportTitle('Задания 1–5. Практические задачи (7 класс)') + (OGE.report15Body ? OGE.report15Body() : '') +
        reportTitle('Задание 9. Линейные уравнения') + (OGE.reportQBody ? OGE.reportQBody(9) : '') +
        reportTitle('Задание 11. График функции') + (OGE.reportQBody ? OGE.reportQBody(11) : '') +
        reportTitle('Задание 12. Расчёты по формулам') + (OGE.reportQBody ? OGE.reportQBody(12) : '') +
        '<button class="btn btn-ghost" data-act="reset">Сбросить прогресс</button>';
    }
    app.innerHTML = html;
    postRender();
  }

  /* ================== события ================== */
  var ACT = OGE.ACT;
  Object.assign(ACT, {
    home: function () { renderHome(); },
    menu: function () { renderMenu(); },
    grade: function (d) { stats.grade = Number(d.grade); saveStats(); renderHome(); },
    'start-prik': function () { startPrik(); },
    'start-saper': function () { startSaper(); },
    report: function () { renderReport('all'); },
    report6: function () { renderReport('6'); },
    report7: function () { renderReport('7'); },
    report15: function () { renderReport('15'); },
    install: function () {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      Promise.resolve(deferredPrompt.userChoice).catch(function () { }).then(function () { deferredPrompt = null; if (screen === 'home' || screen === 'menu') render(); });
    },
    reset: function () {
      if (window.confirm('Стереть весь прогресс на этом устройстве?')) { stats = L.defaultStats(); saveStats(); renderHome(); }
    },
    pick: function (d) { prikPick(Number(d.i)); },
    'est-next': function () { P.stage = 'answer'; renderPrik(); },
    hint: function () { P.hint = true; renderPrik(); },
    key: function (d) { prikKey(d.k); },
    neg: function () { toggleMinus(); },
    check: function () { prikCheck(); },
    'fix-answer': function () { P.stage = 'answer'; P.input = ''; P.neg = false; P.msg = ''; renderPrik(); },
    'show-how': function () { P.how = true; P.hint = true; renderPrik(); },
    'prik-next': function () { prikNext(); },
    step: function (d) { saperTap(Number(d.i)); },
    'no-error': function () { saperNoError(); },
    'saper-hint': function () { S.hint = true; renderSaper(); },
    fix: function (d) { saperFixPick(Number(d.i)); },
    'saper-next': function () { saperNext(); }
  });

  app.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el || el.disabled) return;
    var fn = ACT[el.getAttribute('data-act')];
    if (fn) fn(el.dataset);
  });

  function isInteractive(el) {
    return !!el && (el.tagName === 'BUTTON' || el.tagName === 'A' || el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT');
  }
  document.addEventListener('keydown', function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (screen === 'prik' && P) {
      if (P.stage === 'answer') {
        if (/^[0-9]$/.test(k)) { prikKey(k); e.preventDefault(); return; }
        if (k === ',' || k === '.') { prikKey(','); e.preventDefault(); return; }
        if (k === '-' || k === '−') { toggleMinus(); e.preventDefault(); return; }
        if (k === 'Backspace') { prikKey('back'); e.preventDefault(); return; }
      } else if (P.stage === 'estimate' && /^[1-3]$/.test(k)) { prikPick(Number(k) - 1); e.preventDefault(); return; }
    }
    if (screen === 'saper' && S && S.stage === 'find' && /^[1-9]$/.test(k)) { saperTap(Number(k) - 1); e.preventDefault(); return; }
    if (screen === 'saper' && S && S.stage === 'fix' && /^[1-3]$/.test(k)) { saperFixPick(Number(k) - 1); e.preventDefault(); return; }
    for (var hi = 0; hi < OGE.keyHandlers.length; hi++) { if (OGE.keyHandlers[hi](e, k)) { e.preventDefault(); return; } }
    if (k === 'Enter' && !isInteractive(document.activeElement)) {
      var primary = app.querySelector('[data-primary]:not([disabled])');
      if (primary) { primary.click(); e.preventDefault(); }
    }
  });

  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    deferredPrompt = e;
    if (screen === 'home' || screen === 'menu') render();
  });

  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () { }); });
  }

  /* для автотестов: в браузере доступен только объект-отладчик */
  window.__game = { get P() { return P; }, get S() { return S; }, get stats() { return stats; }, renderHome: renderHome };

  Object.assign(OGE, {
    L: L, app: app, esc: esc, math: math, plain: plain, announce: announce, ICON: ICON, pct: pct, times: times,
    topbar: topbar, breakdown: breakdown, dots: dots, postRender: postRender,
    saveStats: saveStats, renderHome: renderHome, renderReport: function (sc) { renderReport(sc); },
    go: function (name) { screen = name; P = null; S = null; render(); },
    refresh: function () { render(); }
  });
  /* геттеры нельзя копировать через Object.assign: он сохранил бы только текущие значения */
  Object.defineProperties(OGE, {
    stats: { get: function () { return stats; } },
    screen: { get: function () { return screen; } }
  });

  render();
})();
