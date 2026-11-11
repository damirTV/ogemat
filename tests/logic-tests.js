/* Автотесты логики игры (без DOM). Общие для tests.html (браузер) и run-tests.js (Node).
   Каждый тест генерирует много случайных раундов и проверяет, что ответы посчитаны верно,
   у вопросов с выбором ровно один правильный вариант, и в заданиях нет NaN/undefined. */
(function (root) {
  'use strict';

  /* Независимый калькулятор для записи заданий: [a/b], {числитель|знаменатель}, «·», «:», «−», десятичная запятая */
  function evalExpr(src) {
    var s = String(src).replace(/\[(\d+)\/(\d+)\]/g, '{$1|$2}');
    s = s.replace(/(\d+)\s+\{(\d+)\|(\d+)\}/g, '($1+{$2|$3})');   // смешанное число 1 [1/2]
    function conv(t) {
      var out = '', i = 0;
      while (i < t.length) {
        var ch = t.charAt(i);
        if (ch === '{') {
          var depth = 1, j = i + 1, bar = -1;
          while (j < t.length && depth > 0) {
            var c = t.charAt(j);
            if (c === '{') depth++; else if (c === '}') depth--; else if (c === '|' && depth === 1 && bar < 0) bar = j;
            j++;
          }
          out += '((' + conv(t.slice(i + 1, bar)) + ')/(' + conv(t.slice(bar + 1, j - 1)) + '))';
          i = j;
        } else { out += ch; i++; }
      }
      return out;
    }
    var js = conv(s).replace(/(\d),(\d)/g, '$1.$2').replace(/[·×]/g, '*').replace(/:/g, '/').replace(/[−–]/g, '-');
    if (!/^[\d\s.+\-*/()]+$/.test(js)) throw new Error('не умею считать: ' + src);
    return Function('return (' + js + ');')();
  }
  function safeEval(src) { try { return evalExpr(src); } catch (e) { return NaN; } }
  function near(a, b, eps) { return Math.abs(a - b) < (eps || 1e-6); }
  function dp(x) { var s = String(Math.round(Math.abs(x) * 1e6) / 1e6), i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; }
  function badText(obj, path, out) {
    if (obj === null || obj === undefined || out.length) return;
    if (typeof obj === 'number') { if (!isFinite(obj)) out.push(path + ' = ' + obj); }
    else if (typeof obj === 'string') { if (/NaN|undefined|Infinity|\[object/.test(obj)) out.push(path + ' = «' + obj.slice(0, 60) + '»'); }
    else if (typeof obj === 'object') for (var k in obj) if (typeof obj[k] !== 'function') badText(obj[k], path + '.' + k, out);
  }
  function oneOk(list) { return list.filter(function (o) { return o.ok; }).length === 1; }
  function sqrtOf(label) { var m = /^√\((\d+)\)$/.exec(label); return m ? Math.sqrt(Number(m[1])) : NaN; }
  function numOf(label) {
    var m = /^(\d+) и (\d+)$/.exec(label);
    return m ? [Number(m[1]), Number(m[2])] : null;
  }
  /* «a − 3 > 0», «x²y < 0», «a + b < 0» … вычисляем при заданных значениях */
  function truth(label, vars) {
    var s = label.replace(/[−–]/g, '-').replace(/(\w)²/g, '$1*$1')
      .replace(/([a-z\d)])\s*([a-z])/g, '$1*$2').replace(/([a-z])(\d)/g, '$1*$2');
    var m = /^(.*?)\s*([<>])\s*(.*)$/.exec(s);
    if (!m) throw new Error('не понял утверждение: ' + label);
    var f = Function.apply(null, Object.keys(vars).concat(['return [' + m[1] + ',' + m[3] + '];']));
    var lr = f.apply(null, Object.keys(vars).map(function (k) { return vars[k]; }));
    return m[2] === '<' ? lr[0] < lr[1] : lr[0] > lr[1];
  }

  function run(L, T, opts) {
    var N = (opts && opts.n) || 300;
    var grades = [5, 6], rootsLv = [false, true];

    T.group('Все режимы: задания создаются без сбоев и без NaN');
    var makers = {
      'Прикидка (6)': function (g) { return L.makePrikidkaRound(g, 5); },
      'Сапёр (6)': function (g) { return L.makeSaperRound(g, 5); },
      'Числовая прямая (6)': function (g) { return L.makeNumlineRound(g, 5); },
      'Мастерская (6)': function (g) { return L.makeWorkshopRound(g, 5); },
      'Порядок действий (6)': function (g) { return L.makeOrderOpsRound(g, 5); },
      'Рецептура (6)': function (g) { return L.makeRecipeRound(g, 5); },
      'Прикидка (7)': function (g, r) { return L.makePrikidka7Round(g, r, 5); },
      'Сапёр (7)': function (g, r) { return L.makeSaper7Round(g, r, 5); },
      'Числовая прямая (7)': function (g, r) { return L.makeNumline7Round(g, r, 5); },
      'Мастерская сравнений (7)': function (g, r) { return L.makeWs7Round(g, r, 5); },
      'Знаки и шкала (7)': function (g, r) { return L.makeSigns7Round(g, r, 5); },
      'Лупа (7)': function (g, r) { return L.makeLoupe7Round(g, r, 5); },
      'Спринт (6)': function (g) { return L.makeSprint6(g); },
      'Спринт (7)': function () { return L.makeSprint7(); }
    };
    var rounds = {};
    Object.keys(makers).forEach(function (name) {
      var err = null, bad = [], len = true, all = [];
      for (var i = 0; i < N && !err; i++) grades.forEach(function (g) {
        rootsLv.forEach(function (r) {
          if (err) return;
          try {
            var round = makers[name](g, r);
            if (!round || !round.length) len = false;
            badText(round, name, bad);
            round.forEach(function (t) { t._grade = g; t._roots = r; all.push(t); });
          } catch (e) { err = e; }
        });
      });
      rounds[name] = all;
      T.ok(!err, name + ': задания создаются', err && err.message);
      T.ok(len, name + ': раунд не пустой');
      T.ok(!bad.length, name + ': нет NaN/undefined в текстах', bad[0]);
    });

    T.group('Задание 6: ответы посчитаны верно');
    (function () {
      var bad = [], fmtBad = [], estBad = [];
      rounds['Прикидка (6)'].forEach(function (t) {
        var v = safeEval(t.expr);
        if (!near(v, t.value)) bad.push(t.expr + ' = ' + v + ', а в игре ' + t.value);
        if (!L.isCorrect(L.parseAnswer(L.fmt(t.value)), t.value)) fmtBad.push(t.expr);
        if (t.est && !t.est.options[t.est.correctIndex]) estBad.push(t.expr);
      });
      T.ok(!bad.length, 'Прикидка: значение выражения совпадает с ответом игры', bad[0]);
      T.ok(!fmtBad.length, 'Прикидка: ответ, записанный как на экзамене, засчитывается', fmtBad[0]);
      T.ok(!estBad.length, 'Прикидка: у оценки есть правильный вариант', estBad[0]);
    })();
    (function () {
      var bad = [];
      L.SAPER_ITEMS.concat(rounds['Сапёр (6)']).forEach(function (it) {
        if (it.err === null) { if (it.fixes.length) bad.push(it.id + ': без ошибки, но есть исправления'); return; }
        if (!(it.err >= 0 && it.err < it.steps.length)) bad.push(it.id + ': номер строки с ошибкой вне решения');
        else if (!oneOk(it.fixes)) bad.push(it.id + ': правильных исправлений не одно');
        else if (it.fixes.filter(function (f) { return f.ok; })[0].s !== it.solution[it.err]) bad.push(it.id + ': правильное исправление не совпадает с решением');
        var lastV = /=\s*([−\-]?[\d,]+)\s*$/.exec(it.solution[it.solution.length - 1]);
        if (lastV && !near(L.parseAnswer(lastV[1]), it.value)) bad.push(it.id + ': последняя строка решения не равна ответу');
      });
      T.ok(!bad.length, 'Сапёр: у решений с ошибкой одно верное исправление, ответ совпадает с решением', bad[0]);
    })();
    (function () {
      var bad = [];
      rounds['Числовая прямая (6)'].forEach(function (t) {
        if (t.type !== 'place') return;
        if (!L.checkPlace(t, t.k)) bad.push(t.label + ': правильная отметка не засчитана');
        if (L.checkPlace(t, t.k + 1)) bad.push(t.label + ': соседняя отметка засчитана');
        if (/^[\d\s\[\]\/,+−·:-]+$/.test(t.label) && !near(safeEval(t.label), t.value)) bad.push(t.label + ' ≠ ' + t.value);
      });
      T.ok(!bad.length, 'Числовая прямая: правильная отметка засчитывается, соседняя нет', bad[0]);
    })();
    (function () {
      var bad = [];
      function ev(n) {
        if (n.v !== undefined) return n.v;
        var a = ev(n.l), b = ev(n.r);
        var v = n.op === '+' ? a + b : n.op === '-' ? a - b : n.op === '*' ? a * b : a / b;
        if (n.value !== undefined && !near(v, n.value)) bad.push('узел ' + n.op + ': ' + v + ' ≠ ' + n.value);
        return v;
      }
      rounds['Порядок действий (6)'].forEach(function (t) { if (t.tree && !near(ev(t.tree), t.value)) bad.push('итог ≠ ' + t.value); });
      T.ok(!bad.length, 'Порядок действий: каждое действие и итог посчитаны верно', bad[0]);
    })();
    (function () {
      var bad = [];
      rounds['Рецептура (6)'].forEach(function (t) {
        if (!near(safeEval(t.expr), t.value)) bad.push(t.expr + ' ≠ ' + t.value);
        if (!near(t.rn / t.rd, t.value)) bad.push(t.expr + ': сокращённая дробь ' + t.rn + '/' + t.rd + ' не равна ответу');
        if (L.util.gcd(Math.abs(t.rn), t.rd) !== 1) bad.push(t.expr + ': ответ ' + t.rn + '/' + t.rd + ' можно сократить');
      });
      T.ok(!bad.length, 'Рецептура: ответ верный и несократимый', bad[0]);
    })();

    T.group('Задание 7: ответы посчитаны верно');
    (function () {
      var bad = [];
      rounds['Прикидка (7)'].forEach(function (t) {
        var o = t.est && t.est.options[t.est.correctIndex], p = o && numOf(o.label);
        if (!o) bad.push(t.expr + ': нет правильной оценки');
        else if (p && !(p[0] <= t.value && t.value <= p[1])) bad.push(t.expr + ' ≈ ' + t.value + ', а оценка «' + o.label + '»');
        if (/^√\(\d+\)$/.test(t.expr) && !near(sqrtOf(t.expr), t.value)) bad.push(t.expr + ' ≠ ' + t.value);
      });
      T.ok(!bad.length, 'Прикидка: правильная оценка «между» содержит число', bad[0]);
    })();
    (function () {
      var bad = [];
      rounds['Сапёр (7)'].forEach(function (it) {
        if (it.err === null) return;
        if (!(it.err >= 1 && it.err < it.steps.length)) bad.push(it.family + ': номер строки с ошибкой вне решения (первая строка это условие)');
        else if (!oneOk(it.fixes)) bad.push(it.family + ': правильных исправлений не одно');
      });
      T.ok(!bad.length, 'Сапёр: у решений с ошибкой одно верное исправление', bad[0]);
    })();
    (function () {
      var bad = [];
      rounds['Числовая прямая (7)'].forEach(function (t) {
        if (t.kind === 'place') {
          if (!L.checkPlace7(t, t.value).ok) bad.push(t.number.label + ': точное место не засчитано');
          if (L.checkPlace7(t, t.value + 1).ok) bad.push(t.number.label + ': точка на 1 правее засчитана');
        } else if (t.kind === 'match') {
          if (!oneOk(t.line.points)) bad.push(t.number.label + ': правильных точек не одна');
          var good = t.line.points.filter(function (p) { return p.ok; })[0];
          if (good && !near(good.x, t.value, 1e-3)) bad.push(t.number.label + ': правильная точка не в том месте');
        } else if (t.kind === 'order') {
          var vals = t.items.map(function (i) { return i.value; });
          var sorted = t.items.slice().sort(function (a, b) { return a.value - b.value; }).map(function (i) { return i.label; });
          if (!L.checkOrder7(t, sorted)) bad.push('порядок по возрастанию не засчитан: ' + sorted.join(' < '));
          if (new Set(vals).size !== vals.length) bad.push('в задании на порядок есть равные числа');
        }
      });
      T.ok(!bad.length, 'Числовая прямая: правильные ответы засчитываются', bad[0]);
    })();
    (function () {
      var bad = [];
      rounds['Мастерская сравнений (7)'].forEach(function (t) {
        var real = t.a.value < t.b.value ? '<' : t.a.value > t.b.value ? '>' : '=';
        if (real !== t.answer) bad.push(t.a.label + ' ? ' + t.b.label + ': верно «' + real + '», а в игре «' + t.answer + '»');
      });
      T.ok(!bad.length, 'Мастерская сравнений: знак сравнения верный', bad[0]);
    })();
    (function () {
      var bad = [];
      rounds['Знаки и шкала (7)'].forEach(function (t) {
        if (!t.opts) return;
        if (!oneOk(t.opts)) { bad.push(t.kind + ': правильных вариантов не один'); return; }
        if (t.kind === 'xy') t.opts.forEach(function (o) {
          if (truth(o.label, { a: t.a, b: t.b }) !== !!o.ok) bad.push('a = ' + t.a + ', b = ' + t.b + ': «' + o.label + '» отмечено ' + (o.ok ? 'верным' : 'неверным'));
        });
      });
      T.ok(!bad.length, 'Знаки и шкала: ровно одно верное утверждение, и оно действительно верно', bad[0]);
    })();
    (function () {
      var bad = [];
      rounds['Лупа (7)'].forEach(function (t) {
        t.steps.forEach(function (s) { if (!oneOk(s.opts)) bad.push(t.number.label + ', шаг «' + s.title + '»: правильных вариантов не один'); });
        var p = numOf(t.steps[0].opts.filter(function (o) { return o.ok; })[0].label);
        if (p && !(p[0] < t.number.value && t.number.value < p[1])) bad.push(t.number.label + ': неверный промежуток');
      });
      T.ok(!bad.length, 'Лупа: на каждом шаге один верный вариант', bad[0]);
    })();

    T.group('Спринт');
    (function () {
      var bad = [], chk = [], long = [], dup = 0, all = rounds['Спринт (6)'];
      all.forEach(function (t) {
        var v = safeEval(t.expr);
        if (!near(v, t.value)) bad.push(t.expr + ' = ' + v + ', а в игре ' + t.value);
        if (!L.checkSprint6(t, t.answer)) chk.push(t.expr + ': ответ ' + t.answer + ' не засчитан');
        if (L.checkSprint6(t, L.fmt(t.value + 1))) chk.push(t.expr + ': неверный ответ засчитан');
        if (dp(t.value) > 3) long.push(t.expr + ' = ' + t.answer);
      });
      for (var i = 0; i < all.length; i += 10) {
        var ex = all.slice(i, i + 10).map(function (t) { return t.expr; });
        if (new Set(ex).size < ex.length) dup++;
      }
      T.ok(!bad.length, 'Спринт 6: значение выражения совпадает с ответом игры', bad[0]);
      T.ok(!chk.length, 'Спринт 6: верный ответ засчитывается, неверный нет', chk[0]);
      T.ok(!long.length, 'Спринт 6: ответ — конечная десятичная дробь, не больше трёх знаков после запятой', long[0]);
      T.ok(dup === 0, 'Спринт 6: в одном спринте задания не повторяются', dup + ' повторов');
      /* разнообразие: сколько разных ответов у каждого типа */
      var by = {};
      all.forEach(function (t) { (by[t.type] = by[t.type] || {})[t.answer] = 1; });
      var poor = Object.keys(by).filter(function (k) { return Object.keys(by[k]).length < Math.min(40, N / 4); });
      T.ok(!poor.length, 'Спринт 6: у каждого типа заданий много разных ответов', poor.map(function (k) { return k + ': ' + Object.keys(by[k]).length; }).join(', '));
      var forms = {};
      all.forEach(function (t) { forms[t.expr.replace(/[\d,]+/g, '#')] = 1; });
      T.ok(Object.keys(forms).length >= 15, 'Спринт 6: задания бывают разной формы', Object.keys(forms).length + ' форм');
    })();
    (function () {
      var bad = [], all = rounds['Спринт (7)'], seen = {};
      all.forEach(function (t) {
        if (typeof t.q !== 'string' || t.q.length < 15) { bad.push(t.type + ': текст вопроса испорчен: «' + t.q + '»'); return; }
        var labels = t.opts.map(function (o) { return o.label; });
        seen[t.type] = seen[t.type] || {}; seen[t.type][t.q + labels.join()] = 1;
        if (!oneOk(t.opts)) { bad.push(t.type + ': правильных вариантов не один'); return; }
        if (new Set(labels).size !== 4) bad.push(t.type + ': варианты повторяются: ' + labels.join('; '));
        var ok = t.opts[t.correct] && t.opts[t.correct].ok;
        if (!ok) bad.push(t.type + ': номер правильного ответа не совпадает с отмеченным');
        var pts = t.fig && t.fig.points, good = labels[t.correct];
        if (t.type === 'match_root' || t.type === 'root_on_line') {
          var v = t.type === 'match_root' ? sqrtOf(/√\(\d+\)/.exec(t.q)[0]) : sqrtOf(good);
          var target = t.type === 'match_root' ? pts[t.correct].x : pts[0].x;
          if (!near(v, target, 1e-3)) bad.push(t.q + ': правильный ответ не в той точке');
          if (t.type === 'root_on_line') labels.forEach(function (l, i) { if (i !== t.correct && Math.abs(sqrtOf(l) - target) < 0.15) bad.push(t.q + ': два корня почти в одной точке'); });
        } else if (t.type === 'stmt_scale') {
          t.opts.forEach(function (o) { if (truth(o.label, { a: t.a }) !== !!o.ok) bad.push('a = ' + t.a + ': «' + o.label + '» отмечено ' + (o.ok ? 'верным' : 'неверным')); });
          if (!(t.fig.lo < t.a && t.a < t.fig.hi)) bad.push('точка a вне шкалы');
        } else if (t.type === 'xy') {
          t.opts.forEach(function (o) { if (truth(o.label, { x: t.x, y: t.y }) !== !!o.ok) bad.push('x = ' + t.x + ', y = ' + t.y + ': «' + o.label + '» отмечено ' + (o.ok ? 'верным' : 'неверным')); });
        } else if (t.type === 'seg_root' || t.type === 'seg_frac') {
          var m = /\[(\d+); (\d+)\]/.exec(t.q), lo = Number(m[1]), hi = Number(m[2]);
          labels.forEach(function (l, i) {
            var x = t.type === 'seg_root' ? sqrtOf(l) : safeEval(l), inside = x >= lo && x <= hi;
            if (inside !== (i === t.correct)) bad.push(t.q + ': ' + l + ' ' + (inside ? 'тоже подходит' : 'не подходит'));
          });
        }
        (t.q + ' ' + labels.join(' ')).replace(/\{(\d+)\|(\d+)\}/g, function (_, p, q) { if (L.util.gcd(+p, +q) !== 1) bad.push(t.type + ': дробь ' + p + '/' + q + ' можно сократить'); });
        if (t.type === 'between_frac' || t.type === 'between_root') {
          var x = t.type === 'between_root' ? sqrtOf(/√\(\d+\)/.exec(t.q)[0]) : safeEval(/\{\d+\|\d+\}/.exec(t.q)[0]);
          labels.forEach(function (l, i) {
            var p = numOf(l), inside = p[0] < x && x < p[1];
            if (inside !== (i === t.correct)) bad.push(t.q + ': «' + l + '» ' + (inside ? 'тоже подходит' : 'не подходит'));
          });
        } else if (t.type === 'order_pts') {
          var letter = /точка ([ABCD])\?/.exec(t.q)[1], idx = 'ABCD'.indexOf(letter);
          if (!near(safeEval(good), pts[idx].x, 1e-9)) bad.push(t.q + ': точке ' + letter + ' соответствует другое число');
          for (var i = 1; i < pts.length; i++) if (pts[i].x <= pts[i - 1].x) bad.push(t.q + ': точки A–D не по порядку');
        }
      });
      T.ok(!bad.length, 'Спринт 7: правильный вариант действительно верный, остальные нет', bad[0]);
      var poor = Object.keys(seen).filter(function (k) { return Object.keys(seen[k]).length < Math.min(100, N / 3); });
      T.ok(!poor.length, 'Спринт 7: задания каждого типа редко повторяются', poor.map(function (k) { return k + ': ' + Object.keys(seen[k]).length; }).join(', '));
    })();
  }

  /* ---------- «Дачный участок» (задания 1–5 для 7 класса) ---------- */
  function runDacha(L, T, N) {
    N = Math.max(60, Math.min(N || 200, 400));
    T.group('Дачный участок: план и задания 1–5');
    var bad = { geom: [], tiles: [], house: [], dist: [], side: [], slots: [], heat: [], steps: [], touch: [] }, seen = {}, flips = { E: 0, W: 0, up: 0, down: 0 };
    function add(k, m) { if (bad[k].length < 3) bad[k].push(m); }
    function cells(r) { var out = []; for (var x = r.x0; x < r.x1; x++) for (var y = r.y0; y < r.y1; y++) out.push(x + ',' + y); return out; }
    function gapOf(a, b) {
      var dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
      return { dx: dx, dy: dy, d: Math.sqrt(dx * dx + dy * dy) };
    }
    for (var n = 0; n < N; n++) {
      var v = L.makeDachaVariant(), o = v.obj, W = v.W, H = v.H, id = n + ': ';
      /* 1. участки не налезают друг на друга и лежат в границах */
      var owner = {}, groups = { shed: [o.shed], garage: [o.garage], house: [o.houseA, o.houseB], bath: [o.bath], apples: [o.apples], pad: [o.pad], main: [o.main], pathB: [o.pathB], pathG: [o.pathG] };
      Object.keys(groups).forEach(function (g) {
        groups[g].forEach(function (r) {
          if (!(r.x0 >= 0 && r.y0 >= 0 && r.x1 <= W && r.y1 <= H && r.x1 > r.x0 && r.y1 > r.y0)) add('geom', id + g + ' выходит за участок');
          cells(r).forEach(function (c) { if (owner[c] && owner[c] !== g) add('geom', id + g + ' налезает на ' + owner[c] + ' в клетке ' + c); owner[c] = g; });
        });
      });
      cells(o.green).forEach(function (c) { if (owner[c]) add('geom', id + 'теплица налезает на ' + owner[c]); });
      /* теплица внутри огорода, огород не пересекает постройки и дорожки (кроме дорожки к огороду, которая его касается) */
      if (!(o.green.x0 >= o.garden.x0 && o.green.x1 <= o.garden.x1 && o.green.y0 >= o.garden.y0 && o.green.y1 <= o.garden.y1)) add('geom', id + 'теплица вне огорода');
      cells(o.garden).forEach(function (c) { if (owner[c]) add('geom', id + 'огород налезает на ' + owner[c]); });
      /* 2. плитка: объединение клеток дорожек и площадки, а не сумма по формуле */
      var tileSet = {};
      ['pad', 'main', 'pathB', 'pathG'].forEach(function (g) { groups[g].forEach(function (r) { cells(r).forEach(function (c) { tileSet[c] = 1; }); }); });
      var total = Object.keys(tileSet).length, t2 = v.tasks[1], pack = v.pack;
      var sumSteps = t2.steps.slice(0, 4).reduce(function (s, st) { return s + st.ans; }, 0);
      if (sumSteps !== total) add('tiles', id + 'сумма шагов ' + sumSteps + ' ≠ клеток плитки ' + total);
      if (t2.steps[4].ans !== total) add('tiles', id + 'всего плиток ' + t2.steps[4].ans + ' ≠ ' + total);
      var packs = Math.floor((total + pack - 1) / pack);
      if (Number(t2.answer) !== packs || t2.steps[5].ans !== packs) add('tiles', id + 'упаковок ' + t2.answer + ' ≠ ' + packs + ' (плиток ' + total + ', в упаковке ' + pack + ')');
      if (packs * pack < total || (packs - 1) * pack >= total) add('tiles', id + 'упаковки посчитаны не вверх');
      if (total % pack === 0) seen.exact = (seen.exact || 0) + 1;
      if (!/упаковках по (\d+) штук/.test(t2.text) || Number(/упаковках по (\d+) штук/.exec(t2.text)[1]) !== pack) add('tiles', id + 'в тексте другая упаковка');
      /* 3. площадь дома */
      var hc = cells(o.houseA).concat(cells(o.houseB)), harea = hc.length, t3 = v.tasks[2];
      if (Number(t3.answer) !== harea || t3.steps[2].ans !== harea) add('house', id + 'площадь дома ' + t3.answer + ' ≠ ' + harea);
      if (t3.steps[0].ans * 4 !== harea || harea % 4) add('house', id + 'клеток ' + t3.steps[0].ans + ' и площадь ' + harea + ' не сходятся');
      /* 4. расстояние: перебор пар единичных квадратов */
      var best = Infinity, bx = 0, by = 0, hs = hc.map(function (c) { var q = c.split(',').map(Number); return { x0: q[0], y0: q[1], x1: q[0] + 1, y1: q[1] + 1 }; }), gs = cells(o.garage).map(function (c) { var q = c.split(',').map(Number); return { x0: q[0], y0: q[1], x1: q[0] + 1, y1: q[1] + 1 }; });
      hs.forEach(function (a) { gs.forEach(function (b) { var g = gapOf(a, b); if (g.d < best - 1e-9) { best = g.d; bx = g.dx; by = g.dy; } }); });
      var t4 = v.tasks[3];
      if (Math.abs(best - Math.round(best)) > 1e-9) add('dist', id + 'расстояние ' + best + ' не целое');
      if (Number(t4.answer) !== Math.round(best)) add('dist', id + 'расстояние в игре ' + t4.answer + ', по перебору ' + best);
      if (!(bx > 0 && by > 0)) add('dist', id + 'ближайшие точки не «угол к углу»: ' + bx + ', ' + by);
      if (t4.steps[0].ans !== bx || t4.steps[1].ans !== by) add('dist', id + 'катеты ' + t4.steps[0].ans + ',' + t4.steps[1].ans + ' ≠ ' + bx + ',' + by);
      /* 5. слева и справа от ворот */
      var gt = v.gate, gx = gt.x, gy = (gt.y0 + gt.y1) / 2, hx = gt.side === 'E' ? -1 : 1, lv = { x: 0, y: -hx };
      if (gt.side === 'E' ? gt.x !== W : gt.x !== 0) add('side', id + 'ворота не на границе');
      if (!(gt.y1 - gt.y0 === 4)) add('side', id + 'ворота шире или уже 4 м');
      function side(r) { var c = { x: (r.x0 + r.x1) / 2 - gx, y: (r.y0 + r.y1) / 2 - gy }; return c.x * lv.x + c.y * lv.y > 0 ? 'left' : 'right'; }
      var sl = side(o.shed), gl = side(o.garage);
      if (sl === gl) add('side', id + 'сарай и гараж по одну сторону ворот');
      var leftName = gl === 'left' ? 'гараж' : 'сарай', rightName = gl === 'left' ? 'сарай' : 'гараж';
      if (v.text.left.indexOf('слева от ворот находится ' + leftName) < 0) add('side', id + 'текст «' + v.text.left + '», а слева ' + leftName + ' (ворота ' + gt.side + ')');
      if (v.text.right.indexOf('Справа от ворот находится ' + rightName) < 0) add('side', id + 'текст «' + v.text.right + '», а справа ' + rightName);
      var shedA = cells(o.shed).length;
      if ((v.text.left + v.text.right).indexOf('площадью ' + shedA + ' ') < 0) add('side', id + 'площадь сарая в тексте не ' + shedA);
      if (gt.side === 'E') flips.E++; else flips.W++;
      if (mid2(o.garage) > mid2(o.shed)) flips.down++; else flips.up++;
      /* дорожки соединены: касаются друг друга, площадки, бани и огорода */
      function touch(a, b) { var g = gapOf(a, b); return g.dx === 0 && g.dy === 0 || (g.dx === 0 && g.dy === 0); }
      function adjacent(a, b) { var g = gapOf(a, b); return g.d === 0 && !(a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1); }
      if (!adjacent(o.pad, o.main)) add('touch', id + 'дорожка не примыкает к площадке');
      if (!adjacent(o.main, o.pathB) || !adjacent(o.pathB, o.bath)) add('touch', id + 'дорожка к бане не ведёт к бане');
      if (!adjacent(o.main, o.pathG) || !adjacent(o.pathG, o.garden)) add('touch', id + 'дорожка к огороду не ведёт к огороду');
      /* 6. слоты типа 1 */
      var t1 = v.tasks[0], lab = v.label, labs = Object.keys(lab).map(function (k) { return lab[k]; }).sort().join('');
      if (labs !== '1234567') add('slots', id + 'номера на плане не 1–7: ' + labs);
      if (t1.answer !== [lab.house, lab.bath, lab.garage, lab.green].join('')) add('slots', id + 'ответ ' + t1.answer + ' не сходится с номерами ' + JSON.stringify(lab));
      if (v.text.garden.indexOf('цифрой ' + lab.garden + ')') < 0) add('slots', id + 'номер огорода в тексте другой');
      if (!/^\d{4}$/.test(t1.answer) || new Set(t1.answer.split('')).size !== 4) add('slots', id + 'ответ не из четырёх разных цифр');
      /* 7. отопление */
      var h = v.tasks[4].heat, t5 = v.tasks[4];
      var gasH = Math.round(h.g * h.pg * 100), elH = Math.round(h.P * h.pe * 100), dd = elH - gasH, DD = (h.boilerG + h.otherG) - (h.boilerE + h.otherE);
      if (!(dd > 0 && DD > 0)) add('heat', id + 'газ невыгоден: экономия ' + dd + ', разница вложений ' + DD);
      else if ((DD * 100) % dd !== 0 || Number(t5.answer) !== DD * 100 / dd) add('heat', id + 'часы ' + t5.answer + ' ≠ ' + DD * 100 / dd);
      if (t5.steps[2].ans !== DD) add('heat', id + 'разница вложений ' + t5.steps[2].ans + ' ≠ ' + DD);
      if (Math.abs(t5.steps[0].ans - gasH / 100) > 1e-9 || Math.abs(t5.steps[1].ans - elH / 100) > 1e-9 || Math.abs(t5.steps[3].ans - dd / 100) > 1e-9) add('heat', id + 'расходы в час посчитаны неверно');
      if (!(Number(t5.answer) >= 100 && Number(t5.answer) <= 1000)) add('heat', id + 'нереальное число часов ' + t5.answer);
      /* 8. шаги: последний шаг даёт ответ задания, подсказки и ловушки не дают правильное число */
      v.tasks.forEach(function (t, ti) {
        if (t.kind !== 'steps') return;
        var last = t.steps[t.steps.length - 1];
        if (String(last.ans) !== t.answer) add('steps', id + 'задание ' + (ti + 1) + ': последний шаг ' + last.ans + ' ≠ ответ ' + t.answer);
        t.steps.forEach(function (st, si) {
          if (!st.q || !st.aid || typeof st.ans !== 'number' || !isFinite(st.ans)) add('steps', id + 'задание ' + (ti + 1) + ', шаг ' + (si + 1) + ': нет текста, подсказки или числа');
          if (L.dachaStepTrap(st, st.ans)) add('steps', id + 'задание ' + (ti + 1) + ', шаг ' + (si + 1) + ': правильный ответ считается ошибкой');
          (st.traps || []).forEach(function (tr) { if (L.dachaStepTrap(st, tr.val) !== tr.msg && !st.traps.some(function (x) { return x.val === tr.val && x.msg === L.dachaStepTrap(st, tr.val); })) add('steps', id + 'ловушка не находится'); });
          if (!L.dachaNumEq(L.dachaParse(String(st.ans).replace('.', ',')), st.ans)) add('steps', id + 'ответ ' + st.ans + ' не читается из записи с запятой');
        });
      });
      var key = [t1.answer, t2.answer, t3.answer, t4.answer, t5.answer].join('|');
      seen[key] = 1;
    }
    function mid2(r) { return (r.y0 + r.y1) / 2; }
    T.ok(!bad.geom.length, 'Дача: постройки, дорожки и огород не налезают друг на друга и лежат на участке', bad.geom[0]);
    T.ok(!bad.touch.length, 'Дача: дорожки соединены с площадкой, баней и огородом', bad.touch[0]);
    T.ok(!bad.tiles.length, 'Дача: плитки и упаковки посчитаны верно (по клеткам, округление вверх)', bad.tiles[0]);
    T.ok(!bad.house.length, 'Дача: площадь дома совпадает с подсчётом по клеткам', bad.house[0]);
    T.ok(!bad.dist.length, 'Дача: расстояние до гаража совпадает с перебором и получается целым', bad.dist[0]);
    T.ok(!bad.side.length, 'Дача: «слева» и «справа» от ворот в тексте совпадают с планом (для всех положений ворот)', bad.side[0]);
    T.ok(!bad.slots.length, 'Дача: ответ на тип 1 сходится с номерами на плане', bad.slots[0]);
    T.ok(!bad.heat.length, 'Дача: окупаемость отопления сходится', bad.heat[0]);
    T.ok(!bad.steps.length, 'Дача: шаги, подсказки и ловушки согласованы с ответами', bad.steps[0]);
    T.ok(flips.E > N * 0.25 && flips.W > N * 0.25 && flips.up > N * 0.25 && flips.down > N * 0.25, 'Дача: ворота и постройки встречаются с разных сторон', JSON.stringify(flips));
    var variants = Object.keys(seen).filter(function (k) { return k !== 'exact'; }).length;
    T.ok(variants > N / 4, 'Дача: варианты заметно разные', variants + ' разных комбинаций ответов из ' + N);
  }
  /* ---------- Задания 1–5: остальные сюжеты. Ответы пересчитываются по условию (тексту и таблицам), а не по данным генератора ---------- */
  function runCtx15(L, T, N) {
    N = Math.max(40, Math.min(N || 150, 300));
    var MIN = '−';
    function num(s) { return Number(String(s).replace(/\s| /g, '').replace(',', '.').replace(MIN, '-')); }
    function eq(a, b) { return Math.abs(a - b) < 1e-6; }
    function allText(v) {
      var out = (v.common || []).join(' ');
      (v.commonTables || []).forEach(function (t) { out += ' ' + t.head.join(' ') + ' ' + t.rows.map(function (r) { return r.join(' '); }).join(' '); });
      v.tasks.forEach(function (t) {
        out += ' ' + (t.paras || []).join(' ') + ' ' + (t.ask || '') + ' ' + t.title + ' ' + t.explain + ' ' + (t.wrong || '');
        (t.tables || []).forEach(function (tb) { out += ' ' + tb.head.join(' ') + ' ' + tb.rows.map(function (r) { return r.join(' '); }).join(' '); });
        (t.slots || []).forEach(function (s) { out += ' ' + s.name; });
        (t.steps || []).forEach(function (s) { out += ' ' + s.q + ' ' + s.aid + ' ' + s.unit + ' ' + (s.traps || []).map(function (x) { return x.msg; }).join(' '); });
      });
      return out;
    }
    /* интернет: тарифы из таблицы и трафик из текста */
    function internet(t) {
      var T0 = num(/составит (\d+) Мб/.exec(t.paras[0])[1]), best = Infinity, all = [];
      t.tables[0].rows.forEach(function (r) {
        var c;
        if (r[1] === 'нет') c = T0 * num(/^(\d+(?:,\d+)?) руб\. за 1 Мб/.exec(r[2])[1]);
        else if (/неограниченное/.test(r[1])) c = num(/^(\d+) руб/.exec(r[1])[1]);
        else { var m = /^(\d+) руб\. за (\d+) Мб/.exec(r[1]), o = /^(\d+(?:,\d+)?) руб\. за 1 Мб сверх (\d+)/.exec(r[2]); c = num(m[1]) + Math.max(0, T0 - num(m[2])) * num(o[1]); }
        all.push(c); best = Math.min(best, c);
      });
      return { best: best, unique: all.filter(function (x) { return eq(x, best); }).length === 1 };
    }
    var A = [[1189, 841], [841, 594], [594, 420], [420, 297], [297, 210], [210, 148], [148, 105]];
    var checks = {
      map: function (v, bad) {
        var P = v.P, s = v.s, t = v.tasks;
        function d(a, b) { return Math.hypot(P[a].x - P[b].x, P[a].y - P[b].y); }
        var ux = P.A.x - P.C.x, uy = P.A.y - P.C.y, wx = P.D.x - P.C.x, wy = P.D.y - P.C.y;
        if (ux * wx + uy * wy !== 0) bad('угол при повороте не прямой');
        if (!eq(d('A', 'B') + d('B', 'C'), d('A', 'C')) || d('A', 'B') < 1) bad('деревня B не лежит на шоссе между A и C');
        var cross = (P.C.x - P.A.x) * wy - (P.C.y - P.A.y) * wx, turn = cross > 0 ? 'направо' : 'налево';
        if (v.common[0].indexOf('углом ' + turn) < 0) bad('в тексте поворот не ' + turn);
        var scale = num(/равна (\d+) км/.exec(v.common[2])[1]);
        if (scale !== s) bad('масштаб в тексте ' + scale);
        if (t[0].answer !== t[0].slots.map(function (sl) { return v.label[sl.id]; }).join('')) bad('тип 1 не сходится с номерами');
        if (!eq(num(t[1].answer), (d('A', 'C') + d('C', 'D')) * s)) bad('путь по шоссе');
        var from = /от деревни (\S+) до/.exec(t[2].paras[0])[1], key = from === v.names.A ? 'A' : 'B';
        if (!eq(num(t[2].answer), d(key, 'D') * s) || !eq(d(key, 'D'), Math.round(d(key, 'D')))) bad('расстояние по прямой ' + t[2].answer + ' ≠ ' + d(key, 'D') * s);
        var v1 = num(/скоростью (\d+) км\/ч, а/.exec(v.common[2])[1]), v2 = num(/— со скоростью (\d+) км\/ч/.exec(v.common[2])[1]), q4 = t[3].paras[0], m4;
        if (/по прямой/.test(q4)) m4 = d('A', 'D') * s / v2 * 60;
        else if (/по шоссе через/.test(q4)) m4 = (d('A', 'C') + d('C', 'D')) * s / v1 * 60;
        else m4 = d('A', 'B') * s / v1 * 60 + d('B', 'D') * s / v2 * 60;
        if (!eq(num(t[3].answer), m4)) bad('минуты в пути ' + t[3].answer + ' ≠ ' + m4);
        var rows = t[4].tables[0].rows, re = /(\d+) (л молока|батона хлеба|батонов хлеба|кг сыра «Российский»|кг говядины|кг картофеля)/g, mm, idx = { 'л молока': 0, 'батона хлеба': 1, 'батонов хлеба': 1, 'кг сыра «Российский»': 2, 'кг говядины': 3, 'кг картофеля': 4 }, tot = [0, 0, 0, 0], k = 0;
        while ((mm = re.exec(t[4].paras[1]))) { k++; for (var j = 0; j < 4; j++) tot[j] += num(mm[1]) * num(rows[idx[mm[2]]][j + 1]); }
        var mn = Math.min.apply(null, tot);
        if (k !== 3 || !eq(num(t[4].answer), mn) || tot.filter(function (x) { return x === mn; }).length !== 1) bad('продукты: ' + tot.join(',') + ' ответ ' + t[4].answer);
      },
      flat: function (v, bad) {
        var R = v.rooms, t = v.tasks, ids = Object.keys(R), i, j;
        for (i = 0; i < ids.length; i++) for (j = i + 1; j < ids.length; j++) { var a = R[ids[i]], b = R[ids[j]]; if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) bad(ids[i] + ' налезает на ' + ids[j]); }
        function cells(k) { return (R[k].x1 - R[k].x0) * (R[k].y1 - R[k].y0); }
        ['corridor', 'bath', 'store', 'bedroom', 'kitchen'].forEach(function (k) { if (cells(k) >= cells('living')) bad('гостиная не самая большая'); });
        /* «слева от входа»: смотрим от входной двери внутрь квартиры */
        var en = v.doors.filter(function (d) { return d.entry; })[0], ex = (en.a + en.b) / 2, cy = (R.corridor.y0 + R.corridor.y1) / 2, dirY = cy > en.y ? 1 : -1;
        var bx = (R.bath.x0 + R.bath.x1) / 2 - ex, leftX = dirY > 0 ? 1 : -1, side = bx * leftX > 0 ? 'Слева' : 'Справа';
        if (v.common[1].indexOf(side + ' от входа') < 0) bad('санузел ' + side.toLowerCase() + ' от входа, а в тексте иначе');
        if (!(Math.abs(en.y - R.corridor.y0) < 1e-9 || Math.abs(en.y - R.corridor.y1) < 1e-9) || en.a < R.corridor.x0 || en.b > R.corridor.x1) bad('вход не в коридоре');
        if (t[0].answer !== t[0].slots.map(function (s) { return v.label[s.id]; }).join('')) bad('тип 1');
        var RP = { 'на кухне': 'kitchen', 'в гостиной': 'living', 'в спальне': 'bedroom' }, room = RP[/пол (на кухне|в гостиной|в спальне)/.exec(t[1].paras[0])[1]], pack = num(/по (\d+) штук/.exec(t[1].paras[0])[1]);
        if (num(t[1].answer) !== Math.ceil(cells(room) / pack)) bad('паркет: ' + t[1].answer + ' ≠ ⌈' + cells(room) + '/' + pack + '⌉');
        var big = cells('loggia1') > cells('loggia2') ? 'loggia1' : 'loggia2', lg = /большей/.test(t[2].paras[0]) ? big : (big === 'loggia1' ? 'loggia2' : 'loggia1');
        if (!eq(num(t[2].answer), cells(lg) * 0.16)) bad('лоджия: ' + t[2].answer + ' ≠ ' + cells(lg) * 0.16);
        var G = { 'кухни': 'kitchen', 'санузла': 'bath', 'спальни': 'bedroom', 'гостиной': 'living', 'кладовой': 'store' }, m = /площадь (\S+) больше площади (\S+?)\?/.exec(t[3].paras[0]);
        var pc = (cells(G[m[1]]) - cells(G[m[2]])) / cells(G[m[2]]) * 100;
        if (num(t[3].answer) !== Math.round(pc)) bad('проценты: ' + t[3].answer + ' ≠ ' + pc);
        var it = internet(t[4]);
        if (!eq(num(t[4].answer), it.best) || !it.unique) bad('интернет: ' + t[4].answer + ' ≠ ' + it.best);
      },
      stove: function (v, bad) {
        var c = v.common[0], t = v.tasks, Lm = num(/длина (\d+(?:,\d+)?) м/.exec(c)[1]), W = num(/ширина (\d+(?:,\d+)?) м/.exec(c)[1]), H = num(/высота (\d+(?:,\d+)?) м\./.exec(c)[1]), dw = num(/шириной (\d+) см/.exec(c)[1]), dh = num(/проёма (\d+(?:,\d+)?) м/.exec(c)[1]);
        var rows = t[0].tables[0].rows.map(function (r) { var g = r[2].split('–'); return { n: num(r[0]), lo: num(g[0]), hi: num(g[1]), m: num(r[3]), p: num(r[4]) }; });
        var big = /наибольшим/.test(t[0].ask);
        var ans1 = t[0].slots.map(function (s) { var vol = num(s.name.replace('Объём ', '')), hit = rows.filter(function (r) { return (big ? r.hi : r.lo) === vol; }); return hit.length === 1 ? hit[0].n : '?'; }).join('');
        if (ans1 !== t[0].answer) bad('подбор печи: ' + ans1 + ' ≠ ' + t[0].answer);
        if (!eq(num(t[1].answer), Lm * W * H)) bad('объём');
        if (!eq(num(t[2].answer), 2 * (Lm + W) * H - dw / 100 * dh)) bad('стены: ' + t[2].answer + ' ≠ ' + (2 * (Lm + W) * H - dw / 100 * dh));
        var mass = num(/масса которой (\d+) кг/.exec(t[3].paras[0])[1]), pct = num(/скидку (\d+)%/.exec(t[3].paras[0])[1]), row = rows.filter(function (r) { return r.m === mass; });
        if (row.length !== 1 || !eq(num(t[3].answer), row[0].p * (1 - pct / 100))) bad('скидка');
        var a = t[4].arch, R5 = Math.hypot(a.w / 2, a.h);
        if (!eq(num(t[4].answer), R5) || R5 !== Math.round(R5)) bad('радиус арки ' + t[4].answer + ' ≠ ' + R5);
      },
      paper: function (v, bad) {
        var t = v.tasks, rows = t[0].tables[0].rows;
        function fmtOf(r) { for (var k = 0; k < A.length; k++) if (A[k][0] === num(r[1]) && A[k][1] === num(r[2])) return k; return -1; }
        var ans1 = t[0].slots.map(function (s) { var k = num(s.name.replace('Формат А', '')), hit = rows.filter(function (r) { return fmtOf(r) === k; }); return hit.length === 1 ? hit[0][0] : '?'; }).join('');
        if (ans1 !== t[0].answer) bad('форматы: ' + ans1 + ' ≠ ' + t[0].answer);
        var m2 = /формата А(\d) получится из одного листа формата А(\d)/.exec(t[1].paras[0]);
        if (num(t[1].answer) !== Math.pow(2, num(m2[1]) - num(m2[2]))) bad('раскрой');
        var k3 = num(/формата А(\d)/.exec(t[2].paras[0])[1]);
        if (!eq(num(t[2].answer), A[k3][0] * A[k3][1] / 100)) bad('площадь листа');
        var q4 = t[3].paras[0], k4 = num(/формата А(\d)/.exec(q4)[1]), e4;
        if (/отношение большей/.test(q4)) e4 = Math.round(A[k4][0] / A[k4][1] * 10) / 10;
        else if (/отношение меньшей/.test(q4)) e4 = Math.round(A[k4][1] / A[k4][0] * 10) / 10;
        else e4 = Math.round((/длину/.test(q4) ? A[k4][0] : A[k4][1]) / 10) * 10;
        if (!eq(num(t[3].answer), e4)) bad('тип 4: ' + t[3].answer + ' ≠ ' + e4);
        var q5 = t[4].paras.join(' '), e5;
        if (/весит пачка/.test(q5)) { var g = /Плотность бумаги (\d+) г.*из (\d+) листов формата А(\d)/.exec(q5); e5 = num(g[2]) / Math.pow(2, num(g[3])) * num(g[1]); }
        else { var h = /формата А(\d) заменили на бумагу формата А(\d).*был (\d+) пунктов/.exec(q5); e5 = Math.round(num(h[2]) < num(h[1]) ? num(h[3]) * Math.SQRT2 : num(h[3]) / Math.SQRT2); }
        if (!eq(num(t[4].answer), e5)) bad('тип 5: ' + t[4].answer + ' ≠ ' + e5);
      },
      tariff: function (v, bad) {
        var t = v.tasks, c1 = v.common[1], F = num(/составляла (\d+) рублей/.exec(c1)[1]), M = num(/пакет из (\d+) минут/.exec(c1)[1]), G = num(/пакет из (\d+(?:,\d+)?) гигабайт/.exec(c1)[1]);
        var ans1 = t[0].slots.map(function (s) { var x = parseInt(s.name, 10), hit = []; v.min.forEach(function (m, i) { if (m === x) hit.push(i + 1); }); return hit.length === 1 ? hit[0] : '?'; }).join('');
        if (ans1 !== t[0].answer) bad('месяцы: ' + ans1 + ' ≠ ' + t[0].answer);
        var MON = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'], mi = MON.indexOf(/в (\S+)\?/.exec(t[1].paras[0])[1]);
        var pr = t[1].tables[0].rows, r = num(/^(\d+(?:,\d+)?) руб/.exec(pr[0][1])[1]), cc = num(/^(\d+) руб/.exec(pr[1][1])[1]);
        var e2 = F + Math.max(0, v.min[mi] - M) * r + Math.ceil(Math.max(0, v.gb[mi] - G) / 0.5 - 1e-9) * cc;
        if (!eq(num(t[1].answer), e2)) bad('счёт за месяц: ' + t[1].answer + ' ≠ ' + e2);
        var e3 = /ровно/.test(t[2].paras[0]) ? v.min.filter(function (m, i) { return m <= M && v.gb[i] <= G; }).length : v.gb.filter(function (g) { return g > G; }).length;
        if (num(t[2].answer) !== e3) bad('месяцы тип 3: ' + t[2].answer + ' ≠ ' + e3);
        var q4 = /(снизилась|выросла) на (\d+)%/.exec(t[3].paras[0]), e4 = F / (1 + (q4[1] === 'выросла' ? 1 : -1) * num(q4[2]) / 100);
        if (!eq(num(t[3].answer), e4)) bad('плата год назад');
        var it = internet(t[4]);
        if (!eq(num(t[4].answer), it.best) || !it.unique) bad('домашний интернет');
        if (v.min.some(function (m) { return m > 450 || m < 0; }) || v.gb.some(function (g) { return g > 4.5 || g < 0; })) bad('точки выходят за график');
      },
      tires: function (v, bad) {
        var t = v.tasks, tb = v.commonTables[0], discs = tb.head.slice(1).map(function (h) { return num(h.replace('Диск ', '').replace('″', '')); });
        function D(mk) { var m = /(\d+)\/(\d+) R(\d+)/.exec(mk); return num(m[3]) * 25.4 + 2 * num(m[1]) * num(m[2]) / 100; }
        var d1 = num(/равен (\d+) дюймам/.exec(t[0].paras[0])[1]), col = discs.indexOf(d1) + 1, w1 = null;
        tb.rows.forEach(function (r) { if (w1 === null && r[col] !== '—') w1 = num(r[0]); });
        if (num(t[0].answer) !== w1) bad('наименьшая ширина ' + t[0].answer + ' ≠ ' + w1);
        var m2 = /маркировку (\d+)\/(\d+)/.exec(t[1].paras[0]);
        if (!eq(num(t[1].answer), num(m2[1]) * num(m2[2]) / 100)) bad('боковина');
        var fac = /маркировки (\d+\/\d+ R\d+)/.exec(v.common[1])[1], D0 = D(fac);
        if (!eq(num(t[2].answer), D0)) bad('диаметр завода ' + t[2].answer + ' ≠ ' + D0);
        var mk4 = /маркировки (\d+\/\d+ R\d+)/.exec(t[3].paras[0])[1], D4 = D(mk4), up = /увеличится/.test(t[3].paras[0]);
        if (!eq(num(t[3].answer), Math.abs(D4 - D0)) || up !== D4 > D0) bad('изменение диаметра');
        var mk5 = /маркировки (\d+\/\d+ R\d+)/.exec(t[4].paras[0])[1], p5 = (D(mk5) / D0 - 1) * 100, up5 = /увеличится/.test(t[4].paras[0]);
        if (!eq(num(t[4].answer), Math.round(Math.abs(p5) * 10) / 10) || up5 !== p5 > 0) bad('пробег: ' + t[4].answer + ' ≠ ' + p5);
        /* все маркировки из заданий есть в таблице разрешённых */
        [mk4, mk5, fac].forEach(function (mk) { var m = /(\d+)\/(\d+) R(\d+)/.exec(mk), row = tb.rows.filter(function (r) { return r[0] === m[1]; })[0], c = discs.indexOf(num(m[3])) + 1; if (!row || row[c].split('; ').indexOf(m[1] + '/' + m[2]) < 0) bad(mk + ' нет в таблице'); });
      }
    };
    T.group('Задания 1–5: все сюжеты — ответы по условию, шаги и подсказки');
    L.CTX15.forEach(function (c) {
      var errs = [], seen = {}, stepsBad = [], textBad = [];
      for (var n = 0; n < (c.id === 'dacha' ? 40 : N); n++) {
        var v = c.make(), tag = c.title + ' #' + n + ': ';
        if (v.tasks.length !== 5) errs.push(tag + 'не 5 заданий');
        var txt = allText(v);
        if (/NaN|undefined|Infinity|\[object/.test(txt)) textBad.push(tag + /.{0,40}(NaN|undefined|Infinity|\[object).{0,20}/.exec(txt)[0]);
        v.tasks.forEach(function (t, ti) {
          if (!t.skill || !L.SKILLS15[t.skill]) stepsBad.push(tag + 'тип ' + (ti + 1) + ': нет навыка');
          if (t.kind === 'slots') {
            if (!t.vals || t.vals.join('') !== t.answer || t.vals.length !== t.slots.length) stepsBad.push(tag + 'тип ' + (ti + 1) + ': значения полей не дают ответ');
            if (t.vals.some(function (x) { return !(x >= 1 && x <= (t.maxVal || 9)); })) stepsBad.push(tag + 'номер вне диапазона клавиатуры');
          } else {
            var last = t.steps[t.steps.length - 1];
            if (!eq(last.ans, num(t.answer))) stepsBad.push(tag + 'тип ' + (ti + 1) + ': последний шаг ' + last.ans + ' ≠ ' + t.answer);
            t.steps.forEach(function (s) {
              if (!s.q || !s.aid || !isFinite(s.ans)) stepsBad.push(tag + 'шаг без текста или числа');
              if (L.dachaStepTrap(s, s.ans)) stepsBad.push(tag + 'правильный ответ считается ловушкой: ' + s.q);
              if (!eq(L.dachaParse(L.fmt(s.ans).replace(MIN, '-')), s.ans)) stepsBad.push(tag + 'ответ ' + s.ans + ' нельзя ввести с клавиатуры');
              if (String(s.ans).replace('-', '').replace('.', '').length > 8) stepsBad.push(tag + 'слишком длинный ответ ' + s.ans);
            });
          }
        });
        if (checks[c.id]) checks[c.id](v, function (m) { if (errs.length < 3) errs.push(tag + m); });
        seen[v.tasks.map(function (t) { return t.answer; }).join('|')] = 1;
      }
      T.ok(!errs.length, c.title + ': ответы сходятся с независимым пересчётом по условию', errs[0]);
      T.ok(!stepsBad.length, c.title + ': шаги, подсказки и ловушки согласованы с ответами', stepsBad[0]);
      T.ok(!textBad.length, c.title + ': в текстах нет NaN и undefined', textBad[0]);
      if (c.id !== 'dacha') T.ok(Object.keys(seen).length > N * 0.8, c.title + ': варианты разные', Object.keys(seen).length + ' из ' + N);
    });
    var ids = L.CTX15.map(function (c) { return c.id; }).join(',');
    T.ok(ids === 'dacha,map,flat,stove,paper,tariff,tires', 'Задания 1–5: готовы все семь сюжетов', ids);
  }

  /* ---------- Задания 9, 11, 12 (7 класс) ---------- */
  function runQ7(L, T, N) {
    N = Math.max(60, Math.min(N || 200, 400));
    var MIN = '−';
    function num(s) { return Number(String(s).replace(',', '.').replace(MIN, '-')); }
    /* «−2 + 3(2x − 1)» → функция от x */
    function linFn(s) {
      var e = s.replace(new RegExp(MIN, 'g'), '-').replace(/,/g, '.').replace(/(\d)\s*x/g, '$1*x').replace(/(\d)\s*\(/g, '$1*(').replace(/\)\s*\(/g, ')*(').replace(/\)\s*x/g, ')*x');
      return new Function('x', 'return ' + e + ';');
    }
    function rootOf(line) {
      var p = line.split('='), f = linFn(p[0]), g = linFn(p[1]), a = (f(1) - g(1)) - (f(0) - g(0)), b = f(0) - g(0);
      return Math.abs(a) < 1e-12 ? NaN : -b / a;
    }
    T.group('Задание 9 (7 класс): линейные уравнения');
    var bad = [], badS = [], badSap = [], kinds = {};
    for (var n = 0; n < N; n++) {
      var p = L.make9(), x = num(p.answer), sides = p.text.split('='), f = linFn(sides[0]), g = linFn(sides[1]);
      if (Math.abs(f(x) - g(x)) > 1e-9 || Math.abs((f(x + 1) - g(x + 1))) < 1e-9) bad.push(p.text + ' : x = ' + p.answer);
      if (Math.abs(x * 100 - Math.round(x * 100)) > 1e-9) bad.push(p.text + ': ответ не конечная десятичная дробь');
      var last = p.steps[p.steps.length - 1];
      if (Math.abs(last.ans - x) > 1e-9) badS.push(p.text + ': последний шаг ' + last.ans);
      p.steps.forEach(function (s) { if (L.dachaStepTrap(s, s.ans)) badS.push(p.text + ': ловушка совпадает с ответом'); });
      var sp = L.make9saper(), r0 = rootOf(sp.lines[0]);
      kinds[sp.err] = (kinds[sp.err] || 0) + 1;
      for (var i = 1; i < sp.err; i++) { var ri = /^x = /.test(sp.lines[i]) ? num(sp.lines[i].slice(4)) : rootOf(sp.lines[i]); if (Math.abs(ri - r0) > 1e-9) badSap.push(sp.lines.join(' | ') + ': строка ' + (i + 1) + ' уже неверна'); }
      var re = /^x = /.test(sp.lines[sp.err]) ? num(sp.lines[sp.err].slice(4)) : rootOf(sp.lines[sp.err]);
      if (Math.abs(re - r0) < 1e-9) badSap.push(sp.lines.join(' | ') + ': в строке ' + (sp.err + 1) + ' нет ошибки');
      if (Math.abs(num(sp.lines[sp.lines.length - 1].slice(4)) - r0) < 1e-9) badSap.push(sp.lines.join(' | ') + ': ответ решения верный');
      if (sp.answer !== String(sp.err + 1)) badSap.push('номер строки ответа');
    }
    T.ok(!bad.length, 'Задание 9: корень подставляется в уравнение, и он единственный', bad[0]);
    T.ok(!badS.length, 'Задание 9: шаги согласованы с ответом', badS[0]);
    T.ok(!badSap.length, 'Задание 9, сапёр: до ошибки решение верное, в строке с ошибкой — неверное', badSap[0]);
    T.ok(Object.keys(kinds).length === 3, 'Задание 9, сапёр: ошибки бывают в разных строках', JSON.stringify(kinds));

    T.group('Задание 11 (7 класс): графики функций');
    function fnOf(src) {
      var e = src.replace(/^y = /, '').replace(new RegExp(MIN, 'g'), '-').replace(/,/g, '.')
        .replace(/\{([^|}]*)\|([^}]*)\}/g, function (_, a, b) { return '((' + a + ')/(' + b.replace(/(\d)x/, '$1*x') + '))'; })
        .replace(/x\^2/g, '(x*x)').replace(/(\d)\s*x/g, '$1*x').replace(/\)\s*x/g, ')*x').replace(/(\d)\s*\(/g, '$1*(');
      return new Function('x', 'return ' + e + ';');
    }
    var bad11 = [], badStep = [], modes = {};
    for (n = 0; n < N; n++) {
      var q = L.make11(), ans = q.answer.split('').map(Number);
      modes[q.mode] = 1;
      if (ans.length !== 3 || ans.slice().sort().join('') !== '123') bad11.push(q.text + ': ответ ' + q.answer + ' — не перестановка 1, 2, 3');
      if (q.mode === 'signs') {
        q.graphs.forEach(function (gr, li) {
          var o = q.opts[ans[li] - 1], c0 = L.evalG11(gr, 0), k = gr.type === 'line' ? gr.k : gr.a;
          var okK = /(a|k) > 0/.test(o) ? k > 0 : k < 0, okB = /(c|b) > 0/.test(o) ? c0 > 0 : c0 < 0;
          if (!okK || !okB) bad11.push('знаки: график ' + JSON.stringify(gr) + ' и вариант «' + o + '»');
        });
      } else {
        var fns = q.opts.map(fnOf);
        for (var li = 0; li < 3; li++) {
          var fi = q.mode === 'f2g' ? li : ans[li] - 1, gi = q.mode === 'f2g' ? ans[li] - 1 : li, fails = 0, matches = 0;
          [-3, -2, -1, 1, 2, 3, 0.5].forEach(function (xv) { var a = fns[fi](xv), b = L.evalG11(q.graphs[gi], xv); if (!(Math.abs(a - b) < 1e-9)) fails++; });
          if (fails) bad11.push(q.opts[fi] + ' не совпадает с графиком ' + JSON.stringify(q.graphs[gi]));
          q.graphs.forEach(function (gr) { if ([-3, -2, -1, 1, 2, 3, 0.5].every(function (xv) { return Math.abs(fns[fi](xv) - L.evalG11(gr, xv)) < 1e-9; })) matches++; });
          if (matches !== 1) bad11.push(q.opts[fi] + ' подходит к ' + matches + ' графикам');
        }
      }
      q.steps.forEach(function (s, si) {
        if (s.ans !== ans[si]) badStep.push('шаг ' + (si + 1) + ' не совпадает с ответом');
        if (s.traps.length !== 2) badStep.push(q.text + ': на шаге не две подсказки об ошибке, а ' + s.traps.length);
      });
    }
    T.ok(!bad11.length, 'Задание 11: каждая формула совпадает ровно с одним графиком (проверка по точкам)', bad11[0]);
    T.ok(!badStep.length, 'Задание 11: шаги по буквам и объяснения неверного выбора', badStep[0]);
    T.ok(Object.keys(modes).length === 3, 'Задание 11: встречаются все три вида заданий', Object.keys(modes).join(', '));

    T.group('Задание 12 (7 класс): расчёты по формулам');
    var bad12 = [], seen12 = {};
    function nums(s) { return (s.match(/−?\d+(,\d+)?/g) || []).map(num); }
    var CHECK = [
      [/Фаренгейта в шкалу Цельсия/, function (t) { var F = num(/соответствует (−?\d+) градусов/.exec(t)[1]); return 5 / 9 * (F - 32); }],
      [/Цельсия в шкалу Фаренгейта/, function (t) { var Cc = num(/соответствует (−?\d+)°/.exec(t)[1]); return 1.8 * Cc + 32; }],
      [/колодца/, function (t) { var m = /C = (\d+) \+ (\d+) · n/.exec(t), k = num(/из (\d+) колец/.exec(t)[1]); return num(m[1]) + num(m[2]) * k; }],
      [/Мощность постоянного/, function (t) { var P = num(/составляет (\d+(?:,\d+)?) Вт/.exec(t)[1]), I = num(/равна (\d+(?:,\d+)?) А/.exec(t)[1]); return P / (I * I); }],
      [/Кинетическая/, function (t) { var m = num(/массой (\d+) кг обладает/.exec(t)[1]), E = num(/энергией (\d+(?:,\d+)?) тысяч/.exec(t)[1]) * 1000; return Math.sqrt(2 * E / m); }],
      [/Центростремительное/, function (t) { var w = num(/равна (\d+(?:,\d+)?) с⁻¹/.exec(t)[1]), a = num(/равно (\d+(?:,\d+)?) м\/с\^2\./.exec(t)[1]); return a / (w * w); }],
      [/Архимеда/, function (t) { return 1000 * 9.8 * num(/объёмом (\d+(?:,\d+)?) куб/.exec(t)[1]); }],
      [/потенциальная/, function (t) { var h = num(/высоте (\d+) м над/.exec(t)[1]), P = num(/равна (\d+(?:,\d+)?) джоулям/.exec(t)[1]); return P / (9.8 * h); }],
      [/четырёхугольника/, function (t) { var d2 = num(/d‹2› = (\d+)/.exec(t)[1]), s = num(/sin α = (\d+(?:,\d+)?)/.exec(t)[1]), S = num(/S = (\d+(?:,\d+)?)\./.exec(t)[1]); return 2 * S / (d2 * s); }],
      [/Джоуля–Ленца/, function (t) { var Q = num(/Q = (\d+) Дж/.exec(t)[1]), I = num(/I = (\d+) А/.exec(t)[1]), tt = num(/t = (\d+) с\./.exec(t)[1]); return Q / (I * I * tt); }],
      [/трапеции/, function (t) { var m = /основания равны (\d+) и (\d+)/.exec(t), S = num(/площадь S = (\d+(?:,\d+)?)\./.exec(t)[1]); return S / ((num(m[1]) + num(m[2])) / 2); }],
      [/Закон Ома/, function (t) { return num(/U = (\d+(?:,\d+)?) В/.exec(t)[1]) / num(/I = (\d+(?:,\d+)?) А\./.exec(t)[1]); }]
    ];
    for (n = 0; n < N; n++) {
      var z = L.make12(), chk = CHECK.filter(function (c) { return c[0].test(z.text); });
      if (chk.length !== 1) { bad12.push('нет проверки для: ' + z.text.slice(0, 60)); continue; }
      seen12[CHECK.indexOf(chk[0])] = 1;
      var want = chk[0][1](z.text), got = num(z.answer);
      if (!(Math.abs(want - got) < 1e-6)) bad12.push(z.text.slice(0, 70) + '… : ответ ' + z.answer + ', по формуле ' + want);
      if (Math.abs(got * 100 - Math.round(got * 100)) > 1e-7) bad12.push(z.text.slice(0, 40) + ': ответ не конечная десятичная дробь ' + z.answer);
      if (Math.abs(z.steps[z.steps.length - 1].ans - got) > 1e-9) bad12.push('последний шаг не равен ответу');
      z.steps.forEach(function (s) { if (L.dachaStepTrap(s, s.ans)) bad12.push('ловушка совпадает с ответом'); });
      if (/NaN|undefined/.test(z.text + z.explain)) bad12.push('NaN в тексте');
      nums(z.text);
    }
    T.ok(!bad12.length, 'Задание 12: ответы совпадают с пересчётом по формуле из условия', bad12[0]);
    T.ok(Object.keys(seen12).length === CHECK.length, 'Задание 12: встречаются все ' + CHECK.length + ' формул', Object.keys(seen12).length + ' из ' + CHECK.length);
  }

  /* Новые режимы заданий 11 и 12 (logic11.js) */
  function runQ11x(L, T, N) {
    N = Math.max(60, Math.min(N || 200, 400));
    var MIN = '−';
    function ev(g, x) { return L.evalG11(g, x); }
    function quarters(g) {
      var set = {};
      for (var x = -60; x <= 60; x += 0.25) {
        if (Math.abs(x) < 1e-9) continue;
        var y = ev(g, x);
        if (!isFinite(y) || Math.abs(y) < 1e-9) continue;
        set[x > 0 ? (y > 0 ? 'I' : 'IV') : (y > 0 ? 'II' : 'III')] = 1;
      }
      return Object.keys(set).sort().join(',');
    }
    function truth(g, c) {
      switch (c.t) {
        case 'dir': return c.up === (g.k > 0);
        case 'pdir': return c.up === (g.a > 0);
        case 'y0': return c.p[0] === 0 && Math.abs(c.p[1] - ev(g, 0)) < 1e-9;
        case 'pt': return Math.abs(ev(g, c.p[0]) - c.p[1]) < 1e-9;
        case 'qs': case 'hq': return c.set.slice().sort().join(',') === quarters(g);
        case 'vx': return Math.abs(c.x + g.b / (2 * g.a)) < 1e-9;
        case 'ext': var x0 = -g.b / (2 * g.a); return c.min === (g.a > 0) && Math.abs(c.y - ev(g, x0)) < 1e-9;
        case 'hmono': return c.up === (ev(g, 2) > ev(g, 1));
        case 'axes': return c.cross === false;
      }
      return null;
    }
    T.group('Задание 11: новые режимы');
    var badS = [], types = {}, errAt = {};
    for (var n = 0; n < N; n++) {
      var s = L.make11saper();
      types[s.g.type] = 1; errAt[s.err] = 1;
      s.claims.forEach(function (c, i) {
        if (!c) return;
        var tr = truth(s.g, c);
        if (tr === null) badS.push('неизвестное утверждение ' + c.t);
        else if (tr !== (i !== s.err)) badS.push(s.lines.join(' | ') + ': строка ' + (i + 1) + (i === s.err ? ' должна быть неверной' : ' должна быть верной'));
      });
      if (s.answer !== String(s.err + 1) || s.err < 1 || s.err >= s.lines.length) badS.push('номер строки ответа');
      if (s.lines[0].indexOf(L.fml11(s.g)) < 0) badS.push('условие не содержит формулу');
    }
    T.ok(!badS.length, 'Сапёр 11: верна ровно одна строка из утверждений, ошибочная — одна', badS[0]);
    T.ok(Object.keys(types).length === 3 && Object.keys(errAt).length >= 3, 'Сапёр 11: встречаются прямая, парабола, гипербола, ошибка в разных строках', JSON.stringify(types) + JSON.stringify(errAt));

    var badB = [];
    for (n = 0; n < N; n++) {
      var b = L.make11blitz(), h = b.graphs[b.ok];
      if (b.graphs.length !== 3 || b.text.indexOf(L.fml11(h)) < 0) badB.push(b.text);
      b.graphs.forEach(function (g, i) { if (i !== b.ok && L.same11(g, h)) badB.push(b.text + ': график ' + (i + 1) + ' совпадает с верным'); });
      b.graphs.forEach(function (g, i) { b.graphs.forEach(function (g2, j) { if (j > i && L.same11(g, g2)) badB.push(b.text + ': два одинаковых графика'); }); });
      if (b.msgs.length !== 3) badB.push('подсказки');
    }
    T.ok(!badB.length, 'Блиц 11: формула подходит ровно к одному из трёх графиков', badB[0]);

    var badC = [];
    for (var st = 0; st < L.CTOR_STAGES; st++) for (n = 0; n < 40; n++) {
      var c = L.make11ctor(st), tg = c.target;
      c.params.forEach(function (pr) {
        var steps = (tg[pr.key] - pr.min) / pr.step, s0 = (c.start[pr.key] - pr.min) / pr.step;
        if (Math.abs(steps - Math.round(steps)) > 1e-9 || tg[pr.key] < pr.min || tg[pr.key] > pr.max) badC.push('этап ' + st + ': ' + pr.key + ' = ' + tg[pr.key] + ' недостижим');
        if (Math.abs(s0 - Math.round(s0)) > 1e-9) badC.push('этап ' + st + ': старт ' + pr.key);
        if (pr.skipZero && Math.abs(tg[pr.key]) < 1e-9) badC.push('этап ' + st + ': ноль в цели');
      });
      var keys = Object.keys(tg).filter(function (k) { return k !== 'type'; });
      keys.forEach(function (k) { if (!c.params.some(function (p) { return p.key === k; }) && Math.abs(tg[k] - (c.start[k] || 0)) > 1e-9) badC.push('этап ' + st + ': нет кнопок для ' + k); });
      var v0 = JSON.parse(JSON.stringify(c.start));
      if (L.ctorSame11(c, v0)) badC.push('этап ' + st + ': цель совпадает со стартом');
      var vt = {}; keys.forEach(function (k) { vt[k] = tg[k]; });
      if (!L.ctorSame11(c, vt)) badC.push('этап ' + st + ': цель не распознаётся');
      if (!L.ctorHint11(c, v0, 1) || !L.ctorHint11(c, v0, 2)) badC.push('этап ' + st + ': пустая подсказка');
    }
    T.ok(!badC.length, 'Конструктор 11: цель достижима кнопками, старт не равен цели, подсказки есть', badC[0]);

    T.group('Задание 12: новые режимы');
    function inR(v, r) { return v >= r.lo - 1e-9 && v <= r.hi + 1e-9; }
    var badE = [], badT = [];
    for (n = 0; n < N; n++) {
      var e = L.make12est(), a = Number(e.answer);
      if (e.opts.length !== 3 || new Set(e.opts).size !== 3) badE.push(e.opts.join('|') + ': варианты');
      if (!inR(a, e.ranges[e.ok])) badE.push(e.opts[e.ok] + ' не содержит ответ ' + a);
      e.ranges.forEach(function (r, i) { if (i !== e.ok && inR(a, r)) badE.push(e.opts[i] + ' тоже содержит ответ ' + a); });
      var tr = L.make12trap(), at = Number(tr.answer);
      if (tr.opts.length !== 4 || new Set(tr.opts).size !== 4) badT.push(tr.opts.join('|') + ': варианты');
      tr.opts.forEach(function (o, i) {
        var v = Number(o.replace(MIN, '-').replace(',', '.'));
        if ((i === tr.ok) !== (Math.abs(v - at) < 1e-9)) badT.push(tr.text.slice(0, 40) + ': вариант ' + o + ' и ответ ' + tr.answer);
        if (!tr.msgs[i]) badT.push('нет пояснения');
      });
    }
    T.ok(!badE.length, 'Прикидка 12: верный интервал содержит ответ, остальные — нет', badE[0]);
    T.ok(!badT.length, 'Ловушки 12: один верный ответ из четырёх разных, у каждого есть пояснение', badT[0]);
  }
  function runAll(L, T, o) {
    run(L, T, o);
    if (L.makeDachaVariant) runDacha(L, T, o && o.n);
    if (L.CTX15) runCtx15(L, T, o && o.n);
    if (L.make9) runQ7(L, T, o && o.n);
    if (L.make11saper) runQ11x(L, T, o && o.n);
  }

  root.OGETests = { run: runAll, evalExpr: evalExpr };
  if (typeof module === 'object' && module.exports) module.exports = root.OGETests;
})(typeof self !== 'undefined' ? self : this);
