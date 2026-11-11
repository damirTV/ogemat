/* Новые режимы заданий 11 и 12 (7 класс): «Сапёр ошибок» и «Блиц» по графикам, «Конструктор графика»,
   «Прикидка» и «Ловушки» по формулам. Подключается после logic10.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { require('./logic.js'); require('./logic7.js'); require('./logic10.js'); module.exports = factory(require('./logic.js')); }
  else factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, round = U.round;
  var MINUS = '−';
  function f(n) { return L.fmt(n); }
  function nz(a, b) { var x; do { x = randInt(a, b); } while (x === 0); return x; }
  function ab(n) { return Math.abs(n); }
  function par(n) { return n < 0 ? '(' + f(n) + ')' : f(n); }
  var ROM = ['I', 'II', 'III', 'IV'];
  function romList(a) { return a.length === 1 ? a[0] : a.slice(0, -1).join(', ') + ' и ' + a[a.length - 1]; }
  function romWord(a) { return (a.length === 1 ? 'четверть ' : 'четверти ') + romList(a); }
  function inWord(a) { return 'в ' + romList(a) + (a.length === 1 ? ' четверти' : ' четвертях'); }

  /* ======================= «САПЁР» ДЛЯ ЗАДАНИЯ 11 =======================
     Описание графика по пунктам; ровно один пункт неверный. Пункты независимы, поэтому ошибка видна только в своей строке. */
  /* прямая y = kx + b: каждая функция возвращает {t, claim, why}; wrong = true даёт неверное утверждение */
  function lineLines(g) {
    var k = g.k, b = g.b, miss = k > 0 ? (b > 0 ? 3 : 1) : (b > 0 ? 2 : 0);   // индекс четверти, через которую прямая не проходит
    var x = pick([1, 2, -1, -2]), y = k * x + b;
    return [
      function (w) {
        var up = (k > 0) !== w;
        return { t: 'k = ' + f(k) + (k > 0 ? ' > 0' : ' < 0') + ', поэтому прямая ' + (up ? 'возрастает' : 'убывает') + '.', claim: { t: 'dir', up: up },
          why: 'При k ' + (k > 0 ? '> 0 прямая возрастает' : '< 0 прямая убывает') + ', а здесь k = ' + f(k) + '.' };
      },
      function (w) {
        var p = w ? [b, 0] : [0, b];
        return { t: 'b = ' + f(b) + ', поэтому прямая пересекает ось y в точке (' + f(p[0]) + '; ' + f(p[1]) + ').', claim: { t: 'y0', p: p },
          why: 'Ось y прямая пересекает при x = 0, то есть в точке (0; b) = (0; ' + f(b) + ').' };
      },
      function (w) {
        var yy = w ? k * x - b : y;
        if (w && yy === y) yy = y + 2;
        return { t: 'При x = ' + f(x) + ': y = ' + f(k) + ' · ' + par(x) + (b < 0 ? ' ' + MINUS + ' ' : ' + ') + f(ab(b)) + ' = ' + f(yy) + ', точка (' + f(x) + '; ' + f(yy) + ') лежит на графике.', claim: { t: 'pt', p: [x, yy] },
          why: 'Нужно подставить в формулу: ' + f(k) + ' · ' + par(x) + (b < 0 ? ' ' + MINUS + ' ' : ' + ') + f(ab(b)) + ' = ' + f(y) + '.' };
      },
      function (w) {
        var not = w ? pick([0, 1, 2, 3].filter(function (i) { return i !== miss; })) : miss, set = [0, 1, 2, 3].filter(function (i) { return i !== not; }).map(function (i) { return ROM[i]; });
        return { t: 'Прямая проходит через ' + romWord(set) + '.', claim: { t: 'qs', set: set },
          why: 'При k ' + (k > 0 ? '> 0' : '< 0') + ' и b ' + (b > 0 ? '> 0' : '< 0') + ' прямая не заходит в ' + ROM[miss] + ' четверть, значит проходит через ' + romWord([0, 1, 2, 3].filter(function (i) { return i !== miss; }).map(function (i) { return ROM[i]; })) + '.' };
      }
    ];
  }
  function parabLines(g) {
    var a = g.a, b = g.b, c = g.c, x0 = -b / (2 * a), y0 = a * x0 * x0 + b * x0 + c;
    return [
      function (w) {
        var up = (a > 0) !== w;
        return { t: 'a = ' + f(a) + (a > 0 ? ' > 0' : ' < 0') + ', поэтому ветви параболы направлены ' + (up ? 'вверх' : 'вниз') + '.', claim: { t: 'pdir', up: up },
          why: 'При a ' + (a > 0 ? '> 0 ветви направлены вверх' : '< 0 ветви направлены вниз') + ', а здесь a = ' + f(a) + '.' };
      },
      function (w) {
        var p = w ? [c, 0] : [0, c];
        return { t: 'c = ' + f(c) + ', поэтому парабола пересекает ось y в точке (' + f(p[0]) + '; ' + f(p[1]) + ').', claim: { t: 'y0', p: p },
          why: 'Ось y пересекают при x = 0: y = c, точка (0; ' + f(c) + ').' };
      },
      function (w) {
        var xx = w ? -x0 : x0;
        return { t: 'Абсцисса вершины x‹0› = ' + MINUS + 'b : (2a) = ' + MINUS + par(b) + ' : (2 · ' + par(a) + ') = ' + f(xx) + '.', claim: { t: 'vx', x: xx },
          why: 'x‹0› = ' + MINUS + par(b) + ' : (2 · ' + par(a) + ') = ' + f(x0) + ': знак числителя меняется на противоположный.' };
      },
      function (w) {
        var mn = (a > 0) !== w;
        return { t: 'Вершина — самая ' + (mn ? 'нижняя' : 'верхняя') + ' точка параболы, ' + (mn ? 'наименьшее' : 'наибольшее') + ' значение функции равно ' + f(y0) + '.', claim: { t: 'ext', min: mn, y: y0 },
          why: 'При a ' + (a > 0 ? '> 0 ветви вверх, значит в вершине наименьшее значение' : '< 0 ветви вниз, значит в вершине наибольшее значение') + ' ' + f(y0) + '.' };
      }
    ];
  }
  function hypLines(g) {
    var k = g.k, xs = [1, 2, 4, -1, -2, -4].filter(function (x) { return Math.abs(k * 100 % (ab(x) * 100)) < 1e-9; });
    var x = pick(xs.length ? xs : [1, -1]), y = k / x;
    return [
      function (w) {
        var pos = (k > 0) !== w, set = pos ? ['I', 'III'] : ['II', 'IV'];
        return { t: 'k = ' + f(k) + (k > 0 ? ' > 0' : ' < 0') + ', поэтому ветви гиперболы лежат ' + inWord(set) + '.', claim: { t: 'hq', set: set },
          why: 'При k ' + (k > 0 ? '> 0 ветви в I и III четвертях' : '< 0 ветви во II и IV четвертях') + '.' };
      },
      function (w) {
        var yy = w ? -y : y;
        return { t: 'При x = ' + f(x) + ': y = ' + f(k) + ' : ' + par(x) + ' = ' + f(yy) + ', точка (' + f(x) + '; ' + f(yy) + ') лежит на графике.', claim: { t: 'pt', p: [x, yy] },
          why: 'y = ' + f(k) + ' : ' + par(x) + ' = ' + f(y) + ': при делении учитывают знаки.' };
      },
      function (w) {
        var up = (k < 0) !== w;
        return { t: 'При x > 0 с ростом x значения y ' + (up ? 'возрастают' : 'убывают') + '.', claim: { t: 'hmono', up: up },
          why: 'При k ' + (k > 0 ? '> 0 на промежутке x > 0 значения y убывают (приближаются к нулю сверху)' : '< 0 на промежутке x > 0 значения y возрастают (приближаются к нулю снизу)') + '.' };
      },
      function (w) {
        return { t: w ? 'График гиперболы пересекает ось y в точке (0; ' + f(k) + ').' : 'График гиперболы не пересекает ни ось x, ни ось y.', claim: { t: 'axes', cross: w },
          why: 'На ноль делить нельзя, поэтому x = 0 невозможен, а y = k : x никогда не равен нулю: гипербола не пересекает оси.' };
      }
    ];
  }
  function make11saper() {
    var g, lines, type = pick(['line', 'line', 'parab', 'hyp']);
    if (type === 'line') { g = { type: 'line', k: pick([-3, -2, -1, 1, 2, 3, 0.5, -0.5]), b: nz(-4, 4) }; lines = lineLines(g); }
    else if (type === 'parab') {
      var a = pick([-2, -1, 1, 2]), m = nz(-2, 2);
      g = { type: 'parab', a: a, b: 2 * a * m, c: nz(-3, 3) }; lines = parabLines(g);
    } else { g = { type: 'hyp', k: pick([-6, -4, -3, -2, -1, 1, 2, 3, 4, 6]) }; lines = hypLines(g); }
    var err = randInt(0, lines.length - 1), out = [], claims = [null], why = '';
    var head = 'Дана функция ' + L.fml11(g) + '. Что верно про её график?';
    lines.forEach(function (fn, i) { var r = fn(i === err); out.push(r.t); claims.push(r.claim); if (i === err) why = r.why; });
    return { kind: 'saper', skill: type === 'line' ? 'q11_line' : type === 'parab' ? 'q11_parab' : 'q11_hyp', text: head, lines: [head].concat(out), err: err + 1, g: g, claims: claims,
      answer: String(err + 2), why: why, explain: 'В строке ' + (err + 2) + ' ошибка. ' + why };
  }

  /* ======================= «БЛИЦ» (задание 11): к формуле — график ======================= */
  function make11blitz() {
    var type = pick(['line', 'parab', 'hyp']), cand;
    if (type === 'line') {
      var k = pick([1, 2, 3]), b = randInt(1, 3);
      cand = shuffle([[k, b], [k, -b], [-k, b], [-k, -b]]).slice(0, 3).map(function (p) { return { type: 'line', k: p[0], b: p[1] }; });
    } else if (type === 'parab') {
      var bb = pick([-2, 0, 2]), c = randInt(1, 3);
      cand = shuffle([[-1, bb, c], [1, -bb, -c], [-1, -bb, c], [1, bb, -c], [-1, bb, -c], [1, bb, c]]).map(function (p) { return { type: 'parab', a: p[0], b: p[1] || 0, c: p[2] }; });
      cand = cand.filter(function (g, i) { return cand.slice(0, i).every(function (h) { return !L.same11(g, h); }); }).slice(0, 3);
    } else {
      var kk = pick([1, 2, 4]);
      cand = shuffle([kk, -kk, 2 * kk > 4 ? kk / 2 : 2 * kk, -(2 * kk > 4 ? kk / 2 : 2 * kk)]).slice(0, 3).map(function (v) { return { type: 'hyp', k: v }; });
    }
    var ok = randInt(0, 2), h = cand[ok];
    if (cand.some(function (g, i) { return i !== ok && L.same11(g, h); })) return make11blitz();
    return { kind: 'blitz11', skill: type === 'line' ? 'q11_line' : type === 'parab' ? 'q11_parab' : 'q11_hyp', text: 'Какой график задаёт функция ' + L.fml11(h) + '?', graphs: cand, ok: ok,
      msgs: cand.map(function (g, i) { return i === ok ? 'Верно: ' + L.featureAid11(h) : L.diffMsg11(i + 1, g, h); }),
      explain: L.featureAid11(h) };
  }

  /* ======================= «КОНСТРУКТОР ГРАФИКА» (задание 11) =======================
     Нужно подобрать коэффициенты так, чтобы синий график совпал с оранжевым. */
  var CTOR_STAGES = [
    function () { return { type: 'line', target: { type: 'line', k: pick([-3, -2, -1, 1, 2, 3]), b: nz(-3, 3) }, start: { k: 1, b: 0 } }; },
    function () { return { type: 'line', target: { type: 'line', k: pick([-2.5, -1.5, -0.5, 0.5, 1.5, 2.5]), b: nz(-3, 3) }, start: { k: 1, b: 0 } }; },
    function () { return { type: 'parab', target: { type: 'parab', a: pick([-1, 1, -2, 2]), b: 0, c: nz(-3, 3) }, start: { a: 1, b: 0, c: 0 } }; },
    function () { var a = pick([-1, 1]), m = nz(-2, 2); return { type: 'parab', target: { type: 'parab', a: a, b: 2 * a * m, c: nz(-2, 2) }, start: { a: 1, b: 0, c: 0 } }; },
    function () { return { type: 'hyp', target: { type: 'hyp', k: pick([-4, -3, -2, -1, 2, 3, 4]) }, start: { k: 1 } }; }
  ];
  var CTOR_PARAMS = {
    line: [{ key: 'k', step: 0.5, min: -4, max: 4, skipZero: true }, { key: 'b', step: 1, min: -4, max: 4 }],
    parab: [{ key: 'a', step: 0.5, min: -3, max: 3, skipZero: true }, { key: 'b', step: 1, min: -6, max: 6 }, { key: 'c', step: 1, min: -5, max: 5 }],
    hyp: [{ key: 'k', step: 0.5, min: -6, max: 6, skipZero: true }]
  };
  function make11ctor(stage) {
    var s = CTOR_STAGES[Math.max(0, Math.min(stage, CTOR_STAGES.length - 1))]();
    var params = CTOR_PARAMS[s.type];
    if (s.type === 'parab') {                  // в простых раундах b не трогаем
      params = stage === 2 ? [params[0], params[2]] : params;
    }
    return { kind: 'ctor', skill: s.type === 'line' ? 'q11_line' : s.type === 'parab' ? 'q11_parab' : 'q11_hyp', type: s.type, target: s.target, start: s.start, params: params,
      explain: 'Нужная формула: ' + L.fml11(s.target) + '. ' + L.featureAid11(s.target) };
  }
  function ctorCur(c, vals) { var g = { type: c.type }; Object.keys(vals).forEach(function (k) { g[k] = vals[k]; }); return g; }
  function ctorSame(c, vals) { return Object.keys(c.target).every(function (k) { return k === 'type' || Math.abs((vals[k] || 0) - c.target[k]) < 1e-9; }); }
  /* что подсказать после неудачной проверки (try = 1, 2) */
  function ctorHint(c, vals, tryNo) {
    var t = c.target, v = vals, bad = [];
    if (c.type === 'line') {
      if (Math.abs(v.b - t.b) > 1e-9) bad.push(tryNo === 1 ? 'Прямые пересекают ось y в разных точках.' : 'Оранжевая прямая пересекает ось y в точке (0; ' + f(t.b) + ').');
      if (Math.abs(v.k - t.k) > 1e-9) bad.push(tryNo === 1 ? (Math.sign(v.k) !== Math.sign(t.k) ? 'Одна прямая возрастает, а другая убывает.' : 'Наклон прямых разный.') : 'Оранжевая прямая за шаг вправо меняется на ' + f(t.k) + ' по вертикали: k = ' + f(t.k) + '.');
    } else if (c.type === 'parab') {
      if (Math.sign(v.a) !== Math.sign(t.a)) bad.push('Ветви парабол направлены в разные стороны.');
      else if (Math.abs(v.a - t.a) > 1e-9) bad.push(tryNo === 1 ? 'Параболы разной «ширины».' : 'У оранжевой параболы a = ' + f(t.a) + '.');
      if (Math.abs(v.c - t.c) > 1e-9) bad.push(tryNo === 1 ? 'Параболы пересекают ось y в разных точках.' : 'Оранжевая парабола пересекает ось y в точке (0; ' + f(t.c) + ').');
      if (Math.abs(v.b - t.b) > 1e-9) bad.push(tryNo === 1 ? 'Вершины находятся на разных местах.' : 'Абсцисса вершины оранжевой параболы ' + f(-t.b / (2 * t.a)) + ' = ' + MINUS + 'b : (2a), отсюда b = ' + f(t.b) + '.');
    } else {
      if (Math.sign(v.k) !== Math.sign(t.k)) bad.push('Ветви гипербол лежат в разных четвертях.');
      else bad.push(tryNo === 1 ? 'Ветви гиперболы дальше или ближе к осям.' : 'При x = 1 у оранжевой гиперболы y = ' + f(t.k) + ', значит k = ' + f(t.k) + '.');
    }
    return bad.join(' ');
  }

  /* ======================= ЗАДАНИЕ 12: «ПРИКИДКА» И «ЛОВУШКИ» ======================= */
  function dec(d) { return Math.pow(10, d); }
  function rangeText(d, neg) {
    var lo = dec(d), hi = dec(d + 1);
    return neg ? 'от ' + MINUS + f(round(hi, 6)) + ' до ' + MINUS + f(round(lo, 6)) : 'от ' + f(round(lo, 6)) + ' до ' + f(round(hi, 6));
  }
  function decadeOf(a) { return Math.floor(Math.log(ab(a)) / Math.LN10 + 1e-12); }
  function isPow10(a) { var x = ab(a), d = decadeOf(a); return Math.abs(x - dec(d)) < 1e-9 * Math.max(1, x); }
  function make12est() {
    for (var g = 0; g < 200; g++) {
      var p = L.make12(), a = Number(p.answer);
      if (!isFinite(a) || !a || isPow10(a)) continue;
      var d = decadeOf(a), neg = a < 0, opts = [{ d: d, neg: neg, ok: true }, { d: d, neg: !neg }, { d: pick([d - 1, d + 1]), neg: neg }];
      if (d - 1 < -3) opts[2].d = d + 1;
      opts = shuffle(opts);
      return { kind: 'est', skill: p.skill, text: p.text, steps: p.steps, answer: p.answer, explain: p.explain,
        opts: opts.map(function (o) { return rangeText(o.d, o.neg); }), ok: opts.map(function (o) { return !!o.ok; }).indexOf(true),
        ranges: opts.map(function (o) { return { lo: o.neg ? -dec(o.d + 1) : dec(o.d), hi: o.neg ? -dec(o.d) : dec(o.d + 1) }; }),
        msgs: opts.map(function (o) { return o.ok ? 'Верно: ответ ' + rangeText(d, neg) + '.' : o.d === d ? 'Проверь знак: ответ ' + (neg ? 'отрицательный' : 'положительный') + '.' : 'Порядок другой: оцени, сколько будет примерно, округлив числа.'; }) };
    }
    throw new Error('Прикидка 12: не удалось составить задачу');
  }
  function make12trap() {
    for (var g = 0; g < 200; g++) {
      var p = L.make12(), a = Number(p.answer);
      if (!isFinite(a) || !a) continue;
      var last = p.steps[p.steps.length - 1], pool = [];
      (last.traps || []).forEach(function (t) { if (isFinite(t.val)) pool.push({ v: Number(t.val), m: t.msg }); });
      pool.push({ v: -a, m: 'Знак перепутан: проверь, где вычитание и как раскрыта скобка.' }, { v: round(a * 10, 4), m: 'Запятая сдвинута: проверь умножение или деление.' }, { v: round(a / 10, 4), m: 'Запятая сдвинута: проверь умножение или деление.' }, { v: round(a * 2, 4), m: 'Ответ получился в два раза больше: проверь, не потерян ли делитель.' });
      var seen = {}, opts = [{ v: a, m: 'Верно. ' + p.explain, ok: true }];
      seen[round(a, 4)] = 1;
      pool.forEach(function (t) { var key = round(t.v, 4); if (opts.length < 4 && isFinite(key) && !seen[key]) { seen[key] = 1; opts.push({ v: key, m: t.m }); } });
      if (opts.length < 4) continue;
      opts = shuffle(opts);
      return { kind: 'trap', skill: p.skill, text: p.text, steps: p.steps, answer: p.answer, explain: p.explain, opts: opts.map(function (o) { return f(o.v); }),
        ok: opts.map(function (o) { return !!o.ok; }).indexOf(true), msgs: opts.map(function (o) { return o.m; }) };
    }
    throw new Error('Ловушки 12: не удалось составить задачу');
  }

  return Object.assign(L, {
    make11saper: make11saper, make11blitz: make11blitz, make11ctor: make11ctor, ctorCur11: ctorCur, ctorSame11: ctorSame, ctorHint11: ctorHint, CTOR_STAGES: CTOR_STAGES.length,
    make12est: make12est, make12trap: make12trap
  });
});
