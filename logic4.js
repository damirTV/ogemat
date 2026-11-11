/* Задание 7 (числа на координатной прямой): логика режимов «Прикидка» и «Сапёр ошибок».
   Без DOM. Дополняет Logic из logic.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic.js'));
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, MINUS = L.MINUS, fmt = L.fmt;
  var randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, gcd = U.gcd;

  function fr(k, d) { return '[' + k + '/' + d + ']'; }
  function rt(s) { return '√(' + s + ')'; }
  function sg(n) { return n < 0 ? MINUS + Math.abs(n) : String(n); }
  function lcm(a, b) { return a * b / gcd(a, b); }
  function isSquare(n) { var r = Math.round(Math.sqrt(n)); return r * r === n; }
  function times(k) { var m = k % 10, h = k % 100; return (m >= 2 && m <= 4 && !(h >= 12 && h <= 14)) ? 'раза' : 'раз'; }
  function pairLabel(lo) { return sg(lo) + ' и ' + sg(lo + 1); }

  /* ---------- названия ---------- */
  var SKILLS7 = {
    t7_between: 'Между какими целыми числами',
    t7_point: 'Число и точка на прямой',
    t7_compare: 'Сравнение чисел',
    t7_signs: 'Знак выражения',
    t7_roots: 'Квадраты и корни'
  };

  var TRAPS7 = {
    t7_root_squares: {
      name: 'Корень забыли взять у границ',
      rule: 'Если a < n < b, то √a < √n < √b. Корень берут у всех трёх частей неравенства, и границы становятся целыми числами.'
    },
    t7_root_half: {
      name: 'Корень приняли за половину числа',
      rule: 'Корень из n — это число, которое в квадрате даёт n. Найди ближайшие точные квадраты: например, 64 < 73 < 81, значит √73 между 8 и 9.'
    },
    t7_bounds: {
      name: 'Границы промежутка не возвели в квадрат',
      rule: 'Чтобы проверить, лежит ли √n в отрезке [k; k+1], сравни n с квадратами границ: k² и (k+1)².'
    },
    t7_den_big: {
      name: 'Больше знаменатель, значит больше дробь',
      rule: 'У дробей с одинаковыми числителями больше та, у которой знаменатель меньше: целое разрезано на меньшее число частей, и части крупнее. Надёжнее привести дроби к общему знаменателю.'
    },
    t7_dec_len: {
      name: 'Десятичные дроби сравнили как целые числа',
      rule: 'Десятичные дроби сравнивают по разрядам: сначала десятые, потом сотые. Чтобы не ошибиться, уравняй число знаков: 0,5 = 0,50.'
    },
    t7_neg_cmp: {
      name: 'Перепутали порядок отрицательных чисел',
      rule: 'Из двух отрицательных чисел больше то, у которого модуль меньше: оно ближе к нулю и стоит правее на прямой.'
    },
    t7_scale: {
      name: 'Посчитали деления вместо значения',
      rule: 'Число делений нужно умножить на цену одного деления. Если единица разделена на 2 части, одно деление равно 1/2.'
    },
    t7_sub_sign: {
      name: 'Поменяли числа местами при вычитании',
      rule: 'В разности c − a уменьшаемое это c. Если c больше a, результат положителен. Числа местами менять нельзя.'
    },
    t7_sq_sign: {
      name: 'Квадрат посчитали отрицательным',
      rule: 'Квадрат любого числа, кроме нуля, положителен, даже если само число отрицательное: (−3)² = 9.'
    },
    t7_sum_sign: {
      name: 'Знак суммы взяли у первого числа',
      rule: 'Сумма чисел с разными знаками получает знак того числа, у которого модуль больше.'
    }
  };

  /* ================= ПРИКИДКА ================= */
  /* Прикидка: три варианта «около …»; s — верная оценка (число) */
  function mkEst(values, s) {
    var vals = values.slice().sort(function (a, b) { return a - b; });
    return { s: s, options: vals.map(function (v) { return { label: 'около ' + fmt(v) }; }), correctIndex: vals.indexOf(s) };
  }
  function farWhy(s, mid) {
    if ((s < 0) !== (mid < 0)) return 'Знак не совпадает с прикидкой: число ' + (s < 0 ? 'отрицательное' : 'положительное') + '.';
    var r = Math.abs(mid / s), k = Math.max(2, Math.round(r >= 1 ? r : 1 / r));
    return 'Середина этого промежутка, ' + fmt(mid) + ', примерно в ' + k + ' ' + times(k) + (r >= 1 ? ' больше' : ' меньше') + ' прикидки.';
  }
  /* Вариант «между lo и hi»; conflict — не сходится с прикидкой s */
  function pairOption(lo, hi, k, s) {
    var mid = (lo + hi) / 2, label = sg(lo) + ' и ' + sg(hi);
    return {
      label: label, ok: lo === k && hi === k + 1,
      conflict: L.estimateConflict(s, mid) ? 'Ты выбрал «' + label + '». ' + farWhy(s, mid) : null
    };
  }
  /* Четыре подряд идущие пары, верная (k, k+1) стоит на случайном месте */
  function windowOptions(k, s, minLo) {
    var start = Math.max(k - randInt(0, 3), minLo), out = [];
    for (var j = 0; j < 4; j++) out.push(pairOption(start + j, start + j + 1, k, s));
    return out;
  }

  function genBetweenFrac() {
    for (var g = 0; g < 300; g++) {
      var b = randInt(7, 19), a = randInt(4 * b + 1, 17 * b - 1);
      if (a % b === 0 || gcd(a, b) !== 1) continue;
      var v = a / b, k = Math.floor(v), s = Math.round(v);
      return {
        kind: 'between_frac', skill: 't7_between', expr: fr(a, b), value: v,
        question: 'Между какими целыми числами заключено число',
        estTitle: 'Где окажется число?', estLead: 'Не считай точно. Прикинь, сколько раз знаменатель помещается в числителе.',
        est: mkEst([U.clean(s / 10), s, s * 10], s),
        estHint: a + ' : ' + b + ' — это примерно ' + s + '.',
        opts: windowOptions(k, s, 1),
        hint2: 'Подбери: ' + b + ' · ' + k + ' = ' + (b * k) + ' и ' + b + ' · ' + (k + 1) + ' = ' + (b * (k + 1)) + '. Между какими из этих чисел стоит ' + a + '?',
        explain: b + ' · ' + k + ' = ' + (b * k) + ' < ' + a + ' < ' + (b * (k + 1)) + ' = ' + b + ' · ' + (k + 1) + ', поэтому ' + k + ' < ' + fr(a, b) + ' < ' + (k + 1) + '.'
      };
    }
  }

  function genBetweenNeg() {
    for (var g = 0; g < 300; g++) {
      var b = randInt(3, 12), a = randInt(3 * b + 1, 12 * b - 1);
      if (a % b === 0 || gcd(a, b) !== 1) continue;
      var kx = Math.floor(a / b), k = -(kx + 1), s = Math.round(-a / b);
      return {
        kind: 'between_neg', skill: 't7_between', expr: MINUS + fr(a, b), value: -a / b,
        question: 'Между какими целыми числами заключено число',
        estTitle: 'Где окажется число?', estLead: 'Число отрицательное. Прикинь его размер и знак.',
        est: mkEst([s, -s, s * 10], s),
        estHint: 'Сначала найди ' + fr(a, b) + ' без минуса: примерно ' + Math.round(a / b) + '. Потом вспомни про знак.',
        opts: windowOptions(k, s, -1000),
        hint2: 'Сначала сравни ' + a + ' с ' + b + ' · ' + kx + ' = ' + (b * kx) + ' и ' + b + ' · ' + (kx + 1) + ' = ' + (b * (kx + 1)) + '. Для отрицательного числа промежуток зеркальный.',
        explain: b + ' · ' + kx + ' = ' + (b * kx) + ' < ' + a + ' < ' + (b * (kx + 1)) + ' = ' + b + ' · ' + (kx + 1) + ', значит ' + kx + ' < ' + fr(a, b) + ' < ' + (kx + 1) +
          '. Число ' + MINUS + fr(a, b) + ' противоположно, поэтому оно между ' + sg(-(kx + 1)) + ' и ' + sg(-kx) + '.'
      };
    }
  }

  function genBetweenRoot() {
    var n;
    do { n = randInt(20, 150); } while (isSquare(n));
    var v = Math.sqrt(n), k = Math.floor(v), s = Math.round(v), h = Math.round(n / 2);
    var traps = [[n - 1, n + 1], [h - 1, h + 1], [k + 1, k + 2]];
    var opts = [pairOption(k, k + 1, k, s)].concat(traps.map(function (t) { return pairOption(t[0], t[1], k, s); }));
    var names = {}; opts.forEach(function (o) { names[o.label] = 1; });
    if (Object.keys(names).length < 4) return genBetweenRoot();
    opts.sort(function (x, y) { return Number(x.label.split(' ')[0]) - Number(y.label.split(' ')[0]); });
    return {
      kind: 'between_root', skill: 't7_between', expr: rt(n), value: v,
      question: 'Между какими целыми числами заключено число',
      estTitle: 'Где окажется корень?', estLead: 'Корень из числа гораздо меньше самого числа. Вспомни, сколько будет 9 · 9 или 12 · 12.',
      est: mkEst([s, h, n], s),
      estHint: 'Вспомни квадраты: ' + k + '² = ' + (k * k) + ', ' + (k + 1) + '² = ' + ((k + 1) * (k + 1)) + '.',
      opts: opts,
      hint2: 'Найди два соседних квадрата, между которыми стоит ' + n + ': ' + k + '² = ' + (k * k) + ' и ' + (k + 1) + '² = ' + ((k + 1) * (k + 1)) + '.',
      explain: k + '² = ' + (k * k) + ' < ' + n + ' < ' + ((k + 1) * (k + 1)) + ' = ' + (k + 1) + '², поэтому ' + k + ' < ' + rt(n) + ' < ' + (k + 1) + '.'
    };
  }

  function genBetweenRootExpr() {
    for (var g = 0; g < 300; g++) {
      var m = randInt(2, 4), p = pick([2, 3, 5, 6, 7, 10, 11]), n = m * m * p, mp = m * p;
      var v = m * Math.sqrt(p), k = Math.floor(v), s = Math.round(v);
      if (s === mp || mp === n || s === n) continue;
      var expr = m + rt(p), sq = fmt(Math.round(Math.sqrt(p) * 10) / 10);
      return {
        kind: 'between_rootexpr', skill: 't7_between', expr: expr, value: v,
        question: 'Между какими целыми числами заключено число',
        estTitle: 'Где окажется число?', estLead: 'Корень умножают на ' + m + '. Прикинь, сколько это примерно.',
        est: mkEst([s, mp, n], s),
        estHint: rt(p) + ' ≈ ' + sq + ', умножь на ' + m + '.',
        opts: windowOptions(k, s, 1),
        hint2: 'Внеси множитель под корень: ' + expr + ' = ' + rt(m + '² · ' + p) + ' = ' + rt(n) + '. Теперь найди соседние квадраты для ' + n + '.',
        explain: 'Вносим множитель под корень: ' + expr + ' = ' + rt(m * m + ' · ' + p) + ' = ' + rt(n) + '. ' + k + '² = ' + (k * k) + ' < ' + n + ' < ' + ((k + 1) * (k + 1)) + ' = ' + (k + 1) + '², поэтому ' + k + ' < ' + expr + ' < ' + (k + 1) + '.'
      };
    }
  }

  /* Точки A–D на прямой: число отмечено одной из четырёх точек */
  function genPoint(rootMode, neg) {
    for (var g = 0; g < 600; g++) {
      var X, type, pexpr, n, p, q;
      if (rootMode) {
        n = randInt(5, 120);
        if (isSquare(n)) continue;
        X = Math.sqrt(n); type = 'root'; pexpr = rt(n);
      } else if (Math.random() < 0.5) {
        var t10 = randInt(21, 89);
        if (t10 % 10 === 0) continue;
        X = t10 / 10; type = 'dec'; pexpr = fmt(X);
      } else {
        q = pick([3, 4, 5, 6, 7, 8]); p = randInt(2 * q + 1, 8 * q - 1);
        if (p % q === 0 || gcd(p, q) !== 1) continue;
        X = p / q; type = 'frac'; pexpr = fr(p, q);
      }
      var xk = Math.floor(X), part = X - xk, v = neg ? -X : X;
      var expr = neg ? (type === 'dec' ? fmt(v) : MINUS + pexpr) : pexpr;
      var kf = Math.floor(v), lo = kf - 1, hi = kf + 2;
      var nearPos = Math.abs(part - 0.5) < 1e-9 ? null : (part > 0.5 ? xk + 1 : xk);
      var nearTxt = nearPos === null ? 'ровно посередине' : 'ближе к ' + nearPos;
      var hint, expl;
      if (type === 'dec') {
        hint = 'Целая часть числа ' + pexpr + ' равна ' + xk + '.';
        expl = pexpr + ' = ' + xk + ' и ещё ' + Math.round(part * 10) + ' десятых, значит число между ' + xk + ' и ' + (xk + 1) + ', ' + nearTxt + '.';
      } else if (type === 'frac') {
        var r = p - xk * q;
        hint = p + ' : ' + q + ' = ' + xk + ' (остаток ' + r + ').';
        expl = p + ' : ' + q + ' = ' + xk + ' (остаток ' + r + '), значит ' + pexpr + ' = ' + xk + ' ' + fr(r, q) + '. Это между ' + xk + ' и ' + (xk + 1) + ', ' + nearTxt + '.';
      } else {
        var mid2 = (xk + 0.5) * (xk + 0.5);
        hint = 'Вспомни квадраты: ' + xk + '² = ' + (xk * xk) + ', ' + (xk + 1) + '² = ' + ((xk + 1) * (xk + 1)) + '.';
        expl = xk + '² = ' + (xk * xk) + ' < ' + n + ' < ' + ((xk + 1) * (xk + 1)) + ' = ' + (xk + 1) + '², значит ' + pexpr + ' между ' + xk + ' и ' + (xk + 1) +
          '. Середина: ' + xk + ',5² = ' + fmt(mid2) + ', а ' + n + (n > mid2 ? ' больше' : ' меньше') + ', поэтому число ' + (n > mid2 ? 'ближе к ' + (xk + 1) : 'ближе к ' + xk) + '.';
      }
      if (neg) {
        var nearNeg = nearPos === null ? 'ровно посередине' : 'ближе к ' + sg(nearPos === xk ? -xk : -(xk + 1));
        hint += ' Число отрицательное, поэтому оно левее нуля: между ' + pairLabel(kf) + '.';
        expl = 'Число ' + expr + ' противоположно числу ' + pexpr + '. ' + expl + ' Зеркально: ' + expr + ' лежит между ' + pairLabel(kf) + ', ' + nearNeg + '.';
      }
      var xs = [{ x: v, ok: true }];
      for (var tr = 0; tr < 400 && xs.length < 4; tr++) {
        var c = Math.round((lo + 0.2 + Math.random() * (hi - lo - 0.4)) * 20) / 20;
        if (xs.every(function (o) { return Math.abs(o.x - c) >= 0.3; })) xs.push({ x: c, ok: false });
      }
      if (xs.length < 4) continue;
      xs.sort(function (a, b) { return a.x - b.x; });
      var letters = ['A', 'B', 'C', 'D'], correct = '';
      var opts = xs.map(function (o, i) {
        o.letter = letters[i];
        if (o.ok) correct = o.letter;
        var outside = o.x < kf || o.x > kf + 1;
        return {
          label: 'точка ' + o.letter, ok: o.ok, letter: o.letter,
          conflict: outside ? 'Прикидка: число между ' + pairLabel(kf) + ', а точка ' + o.letter + ' стоит ' + (o.x < kf ? 'левее' : 'правее') + ' этого промежутка.' : null
        };
      });
      var s0 = kf - randInt(0, 2);
      return {
        kind: rootMode ? 'point_root' : 'point_num', skill: 't7_point', expr: expr, value: v,
        question: 'Какая из отмеченных точек соответствует числу',
        estTitle: 'Между какими целыми лежит число?', estLead: 'Не ищи точное место. Сначала скажи, между какими целыми числами стоит число.',
        est: { s: v, options: [0, 1, 2].map(function (j) { return { label: pairLabel(s0 + j) }; }), correctIndex: kf - s0 },
        estHint: hint,
        opts: opts,
        hint2: 'Число лежит между ' + sg(kf) + ' и ' + sg(kf + 1) + '. Посмотри, ближе оно к левой или к правой отметке.',
        explain: expl + ' Это точка ' + correct + '.',
        line: { lo: lo, hi: hi, kf: kf, points: xs.map(function (o) { return { x: o.x, letter: o.letter, ok: o.ok }; }) },
        correctLetter: correct
      };
    }
  }

  function genPrikidka7(kind, grade) {
    switch (kind) {
      case 'between_frac': return genBetweenFrac();
      case 'between_neg': return genBetweenNeg();
      case 'between_root': return genBetweenRoot();
      case 'between_rootexpr': return genBetweenRootExpr();
      case 'point_num': return genPoint(false, grade >= 6 && Math.random() < 0.5);
      case 'point_root': return genPoint(true, false);
    }
    throw new Error('unknown kind ' + kind);
  }

  /* Раунд «Прикидки» для задания 7: grade — класс, roots — уровень «со звёздочкой» (корни) */
  function makePrikidka7Round(grade, roots, n) {
    n = n || 5;
    var base = grade >= 6 ? ['between_frac', 'between_neg', 'point_num'] : ['between_frac', 'point_num'];
    var plan;
    if (roots) plan = ['between_root', 'point_root', 'between_rootexpr'].concat(grade >= 6 ? ['between_neg', 'point_num'] : ['between_frac', 'point_num']);
    else plan = base.concat(base, [pick(base)]);
    plan = shuffle(plan);
    var out = [], seen = {};
    for (var i = 0; out.length < n && i < n * 6; i++) {
      var kind = plan[i % plan.length], t = null;
      for (var g = 0; g < 40; g++) {
        t = genPrikidka7(kind, grade);
        if (!seen[t.kind + '|' + t.expr]) break;
        t = null;
      }
      if (!t) continue;
      seen[t.kind + '|' + t.expr] = 1;
      out.push(t);
    }
    return out;
  }

  /* ================= САПЁР ОШИБОК ================= */
  var NAMES = [
    ['Даня', 'получил'], ['Маша', 'получила'], ['Саша', 'получил'],
    ['Ира', 'получила'], ['Миша', 'получил'], ['Аня', 'получила']
  ];
  var SKILL_OF = {
    root_squares: 't7_roots', root_half: 't7_roots', bounds: 't7_roots',
    den_big: 't7_compare', dec_len: 't7_compare', neg_cmp: 't7_compare',
    scale: 't7_signs', sub_sign: 't7_signs', sq_sign: 't7_signs', sum_sign: 't7_signs'
  };

  /* Собирает решение. good — верные строки, bad — строки с ошибкой (индекс errIdx), fixes — варианты замены строки errIdx */
  function mk(id, ok, good, bad, errIdx, fixes, hint, ans) {
    var who = pick(NAMES), steps = ok ? good : bad;
    return {
      family: id, trap: ok ? null : 't7_' + id, skill: SKILL_OF[id], who: who[0], verb: who[1],
      steps: steps, err: ok ? null : errIdx, solution: good,
      fixes: ok ? [] : shuffle(fixes), hint: hint, answer: ans,
      final: steps[steps.length - 1].replace(/^Ответ:\s*/, '')
    };
  }

  function F_rootSquares(ok) {
    var n;
    do { n = randInt(20, 150); } while (isSquare(n));
    var k = Math.floor(Math.sqrt(n)), a = k * k, b = (k + 1) * (k + 1);
    var head = 'Между какими целыми числами заключено ' + rt(n) + '?';
    var r1 = k + '² = ' + a + ', ' + (k + 1) + '² = ' + b, r2 = a + ' < ' + n + ' < ' + b;
    var good = rt(a) + ' < ' + rt(n) + ' < ' + rt(b), bad = a + ' < ' + rt(n) + ' < ' + b;
    var ans = 'между ' + k + ' и ' + (k + 1);
    return mk('root_squares', ok,
      [head, r1, r2, good, k + ' < ' + rt(n) + ' < ' + (k + 1), 'Ответ: ' + ans],
      [head, r1, r2, bad, 'Ответ: между ' + a + ' и ' + b], 3,
      [{ s: good, ok: true },
       { s: rt(a) + ' < ' + n + ' < ' + rt(b), note: 'Корень берут у всех трёх частей неравенства, в том числе у ' + n + ', иначе оно перестаёт быть верным.' },
       { s: a + '² < ' + n + ' < ' + b + '²', note: 'Возводить в квадрат здесь не нужно. Чтобы получить границы для корня, нужно извлечь корень.' }],
      'Посмотри на границы неравенства: взяли ли корень из ' + a + ' и из ' + b + '?', ans);
  }

  function F_rootHalf(ok) {
    var n;
    do { n = 2 * randInt(20, 75); } while (isSquare(n));
    var k = Math.floor(Math.sqrt(n)), a = k * k, b = (k + 1) * (k + 1), h = n / 2;
    var head = 'Между какими целыми числами заключено ' + rt(n) + '?';
    var good = k + '² = ' + a + ', ' + (k + 1) + '² = ' + b;
    var ans = 'между ' + k + ' и ' + (k + 1);
    return mk('root_half', ok,
      [head, good, a + ' < ' + n + ' < ' + b, k + ' < ' + rt(n) + ' < ' + (k + 1), 'Ответ: ' + ans],
      [head, rt(n) + ' = ' + n + ' : 2 = ' + h, h + ' лежит между ' + (h - 1) + ' и ' + (h + 1), 'Ответ: между ' + (h - 1) + ' и ' + (h + 1)], 1,
      [{ s: good, ok: true },
       { s: rt(n) + ' = ' + n + ' − 1 = ' + (n - 1), note: 'Корень из числа это не «число минус один».' },
       { s: rt(n) + ' = ' + n + ' · ' + n + ' = ' + (n * n), note: 'Это квадрат числа ' + n + '. Корень работает наоборот: ищем число, которое в квадрате даёт ' + n + '.' }],
      'Проверь результат: ' + h + ' · ' + h + ' = ' + (h * h) + '. Получилось ли ' + n + '?', ans);
  }

  function F_bounds(ok) {
    var k = randInt(3, 9), A = k * k, B = (k + 1) * (k + 1);
    var n = ok ? randInt(B + 1, (k + 2) * (k + 2) - 1) : randInt(A + 1, B - 1);
    var head = 'Принадлежит ли число ' + rt(n) + ' отрезку [' + k + '; ' + (k + 1) + ']?';
    var sq = 'Возведём границы в квадрат: ' + k + '² = ' + A + ', ' + (k + 1) + '² = ' + B;
    var good = ok
      ? [head, sq, n + ' > ' + B + ', значит ' + rt(n) + ' > ' + (k + 1), 'Ответ: не принадлежит']
      : [head, sq, A + ' < ' + n + ' < ' + B + ', значит ' + k + ' < ' + rt(n) + ' < ' + (k + 1), 'Ответ: принадлежит'];
    return mk('bounds', ok, good,
      [head, n + ' не лежит между ' + k + ' и ' + (k + 1), 'Ответ: не принадлежит'], 1,
      [{ s: sq, ok: true },
       { s: 'Возьмём корень из границ: ' + rt(k) + ' и ' + rt(k + 1), note: 'Корень из границ не помогает: число стоит под корнем, поэтому границы нужно возвести в квадрат.' },
       { s: 'Умножим границы на 2: ' + (2 * k) + ' и ' + (2 * k + 2), note: 'Умножение на 2 не убирает корень, сравнивать так нельзя.' }],
      'Число ' + n + ' стоит под корнем. Что нужно сделать с границами ' + k + ' и ' + (k + 1) + ', чтобы их можно было сравнить с ' + n + '?',
      ok ? 'не принадлежит' : 'принадлежит');
  }

  function F_denBig(ok) {
    for (var g = 0; g < 300; g++) {
      var P = randInt(4, 9), Q = randInt(3, P - 1), a = randInt(2, Q - 1);
      if (Q < 3 || gcd(a, P) !== 1 || gcd(a, Q) !== 1) continue;
      var Lc = lcm(P, Q), nP = a * Lc / P, nQ = a * Lc / Q;
      var fp = fr(a, P), fq = fr(a, Q);
      var head = Math.random() < 0.5 ? 'Какое число больше: ' + fp + ' или ' + fq + '?' : 'Какое число больше: ' + fq + ' или ' + fp + '?';
      var same = 'У дробей одинаковые числители';
      var good = 'Приведём к общему знаменателю ' + Lc + ': ' + fr(nP, Lc) + ' и ' + fr(nQ, Lc);
      return mk('den_big', ok,
        [head, same, good, nP + ' < ' + nQ + ', значит ' + fp + ' < ' + fq, 'Ответ: ' + fq],
        [head, same, 'Знаменатель ' + P + ' больше ' + Q + ', значит ' + fp + ' > ' + fq, 'Ответ: ' + fp], 2,
        [{ s: good, ok: true },
         { s: 'Приведём к общему знаменателю ' + Lc + ': ' + fr(a, Lc) + ' и ' + fr(a, Lc), note: 'Числитель умножают на то же число, что и знаменатель. Тогда числители получатся разными.' },
         { s: 'Сложим знаменатели: ' + P + ' + ' + Q + ' = ' + (P + Q), note: 'Сумма знаменателей не говорит, какая дробь больше.' }],
        'Подумай: на сколько частей разрезали целое? Чем больше частей, тем они мельче.', fq);
    }
  }

  function F_decLen(ok) {
    for (var g = 0; g < 300; g++) {
      var c = randInt(3, 9), ab = randInt(11, 10 * c - 1);
      if (ab % 10 === 0 || Math.floor(ab / 10) >= c) continue;
      var x = fmt(ab / 100), y = fmt(c / 10), y0 = y + '0';
      var head = Math.random() < 0.5 ? 'Какое число больше: ' + x + ' или ' + y + '?' : 'Какое число больше: ' + y + ' или ' + x + '?';
      var good = 'Уравняем число знаков: ' + y + ' = ' + y0;
      return mk('dec_len', ok,
        [head, good, ab + ' < ' + (c * 10) + ', значит ' + x + ' < ' + y, 'Ответ: ' + y],
        [head, 'Сравним как целые числа: ' + ab + ' > ' + c + ', значит ' + x + ' > ' + y, 'Ответ: ' + x], 1,
        [{ s: good, ok: true },
         { s: 'Уберём запятые: ' + x + ' = ' + ab + ' и ' + y + ' = ' + c, note: 'Запятую убирать нельзя: числа станут другими.' },
         { s: 'Больше цифр после запятой, значит число больше', note: 'Количество цифр не важно. Числа сравнивают по разрядам слева направо, начиная с десятых.' }],
        'Сколько цифр после запятой у каждого числа? Можно ли уравнять их количество?', y);
    }
  }

  function F_negCmp(ok) {
    for (var g = 0; g < 300; g++) {
      var A = randInt(11, 59), B = randInt(11, 59);
      if (A === B) continue;
      if (A > B) { var tt = A; A = B; B = tt; }
      var x1 = fmt(A / 10), x2 = fmt(B / 10), n1 = MINUS + x1, n2 = MINUS + x2;
      var head = Math.random() < 0.5 ? 'Какое число больше: ' + n1 + ' или ' + n2 + '?' : 'Какое число больше: ' + n2 + ' или ' + n1 + '?';
      var mod = 'Сравним модули: ' + x1 + ' < ' + x2;
      var good = 'У отрицательных чисел наоборот: ' + n1 + ' > ' + n2;
      return mk('neg_cmp', ok,
        [head, mod, good, 'Ответ: ' + n1],
        [head, mod, 'Значит, ' + n1 + ' < ' + n2, 'Ответ: ' + n2], 2,
        [{ s: good, ok: true },
         { s: 'Минус не влияет, значит больше ' + x2, note: 'Минус влияет: на прямой отрицательные числа идут в обратную сторону.' },
         { s: 'Числа ' + n1 + ' и ' + n2 + ' равны', note: 'Числа разные: у них разные модули.' }],
        'Где на прямой стоят ' + n1 + ' и ' + n2 + '? Какое из них ближе к нулю?', n1);
    }
  }

  function F_scale(ok) {
    for (var g = 0; g < 300; g++) {
      var d = pick([2, 4, 5]), k = randInt(Math.ceil(1.5 * d), Math.floor(7.5 * d));
      if (k % d === 0) continue;
      var a = k / d, c = Math.ceil(a), formB = Math.random() < 0.5;
      var stmt = formB ? c + ' − a > 0' : 'a − ' + c + ' > 0';
      var head = 'Единица разделена на ' + d + (d === 5 ? ' равных частей' : ' равные части') + ', точка a на ' + k + '-м делении от нуля. Верно ли, что ' + stmt + '?';
      var good = 'Одно деление = ' + fr(1, d) + ', значит a = ' + k + ' · ' + fr(1, d) + ' = ' + fmt(a);
      var diff = formB ? (c * d - k) / d : (k - c * d) / d;
      var truth = formB ? 'верно' : 'неверно', wrong = formB ? 'неверно' : 'верно';
      var calc = formB ? c + ' − a = ' + c + ' − ' + fmt(a) + ' = ' + fmt(diff) : 'a − ' + c + ' = ' + fmt(a) + ' − ' + c + ' = ' + fmt(diff);
      var calcBad = formB ? c + ' − a = ' + c + ' − ' + k + ' = ' + sg(c - k) : 'a − ' + c + ' = ' + k + ' − ' + c + ' = ' + sg(k - c);
      var concl = formB ? fmt(diff) + ' > 0, значит неравенство верно' : fmt(diff) + ' < 0, значит неравенство неверно';
      var conclBad = formB ? sg(c - k) + ' < 0, значит неравенство неверно' : sg(k - c) + ' > 0, значит неравенство верно';
      return mk('scale', ok,
        [head, good, calc, concl, 'Ответ: ' + truth],
        [head, 'Значит, a = ' + k, calcBad, conclBad, 'Ответ: ' + wrong], 1,
        [{ s: good, ok: true },
         { s: 'Одно деление = ' + d + ', значит a = ' + k + ' · ' + d + ' = ' + (k * d), note: 'Единицу разделили на ' + d + (d === 5 ? ' частей' : ' части') + ', поэтому одно деление меньше единицы, а не больше.' },
         { s: 'a = ' + k + ' + ' + d + ' = ' + (k + d), note: 'Число делений нужно умножить на цену одного деления, а не сложить.' }],
        'Чему равно одно деление, если единица разделена на ' + d + (d === 5 ? ' частей' : ' части') + '?', truth);
    }
  }

  function F_subSign(ok) {
    for (var g = 0; g < 300; g++) {
      var A = randInt(11, 89);
      if (A % 10 === 0) continue;
      var c = Math.ceil(A / 10) + randInt(0, 2), a = fmt(A / 10);
      var gt = Math.random() < 0.5, sgn = gt ? '>' : '<';
      var head = 'a = ' + a + '. Верно ли, что ' + c + ' − a ' + sgn + ' 0?';
      var diff = (c * 10 - A) / 10;
      var good = c + ' − a = ' + c + ' − ' + a + ' = ' + fmt(diff);
      var truth = gt ? 'верно' : 'неверно', wrong = gt ? 'неверно' : 'верно';
      return mk('sub_sign', ok,
        [head, good, fmt(diff) + ' > 0, поэтому ' + c + ' − a ' + sgn + ' 0 — ' + truth, 'Ответ: ' + truth],
        [head, c + ' − a = ' + a + ' − ' + c + ' = ' + fmt(-diff), fmt(-diff) + ' < 0, поэтому ' + c + ' − a ' + sgn + ' 0 — ' + wrong, 'Ответ: ' + wrong], 1,
        [{ s: good, ok: true },
         { s: c + ' − a = ' + c + ' + ' + a + ' = ' + fmt((c * 10 + A) / 10), note: 'В выражении стоит вычитание, а не сложение.' },
         { s: c + ' − a = ' + a + ' · ' + c + ' = ' + fmt(A * c / 10), note: 'Это умножение, а нужно вычитание.' }],
        'Из какого числа вычитают a? Проверь, не поменялись ли числа местами.', truth);
    }
  }

  function F_sqSign(ok) {
    var p1 = Math.random() < 0.5, gt = Math.random() < 0.5, sgn = gt ? '>' : '<';
    var sq = p1 ? 'x' : 'y', other = p1 ? 'y' : 'x', expr = p1 ? 'x²y' : 'xy²';
    var head = 'Известно, что ' + (p1 ? 'x < 0 и y > 0' : 'x > 0 и y < 0') + '. Верно ли, что ' + expr + ' ' + sgn + ' 0?';
    var good = 'Квадрат числа, не равного нулю, положителен: ' + sq + '² > 0';
    var truth = gt ? 'верно' : 'неверно', wrong = gt ? 'неверно' : 'верно';
    return mk('sq_sign', ok,
      [head, good, sq + '² > 0 и ' + other + ' > 0, значит ' + expr + ' > 0', 'Ответ: ' + truth],
      [head, sq + ' < 0, значит ' + sq + '² < 0', sq + '² < 0 и ' + other + ' > 0, значит ' + expr + ' < 0', 'Ответ: ' + wrong], 1,
      [{ s: good, ok: true },
       { s: sq + '² = ' + sq + ' · 2, поэтому ' + sq + '² < 0', note: 'Квадрат это ' + sq + ' · ' + sq + ', а не ' + sq + ' · 2.' },
       { s: 'Квадрат всегда равен нулю', note: 'Квадрат равен нулю только у самого нуля.' }],
      'Чему равно произведение двух отрицательных чисел? Что это значит для ' + sq + '²?', truth);
  }

  function F_sumSign(ok) {
    for (var g = 0; g < 300; g++) {
      var M = randInt(11, 59), Y = M + randInt(5, 30), posX = Math.random() < 0.5, gt = Math.random() < 0.5;
      var xs = posX ? fmt(M / 10) : MINUS + fmt(M / 10), ys = posX ? MINUS + fmt(Y / 10) : fmt(Y / 10);
      var sgn = gt ? '>' : '<', signY = posX ? '<' : '>', signX = posX ? '>' : '<';
      var head = 'x = ' + xs + ', y = ' + ys + '. Верно ли, что x + y ' + sgn + ' 0?';
      var good = 'Сравним модули: |x| = ' + fmt(M / 10) + ', |y| = ' + fmt(Y / 10) + ', у y модуль больше';
      var truth = sgn === signY ? 'верно' : 'неверно', wrong = sgn === signX ? 'верно' : 'неверно';
      return mk('sum_sign', ok,
        [head, good, 'Сумма берёт знак числа с большим модулем: x + y ' + signY + ' 0', 'Ответ: ' + truth],
        [head, 'Смотрим на первое слагаемое: x ' + signX + ' 0, значит x + y ' + signX + ' 0', 'Ответ: ' + wrong], 1,
        [{ s: good, ok: true },
         { s: 'Сложим модули: ' + fmt(M / 10) + ' + ' + fmt(Y / 10) + ' = ' + fmt((M + Y) / 10) + ', значит x + y = ' + fmt((M + Y) / 10), note: 'Так складывают числа с одинаковыми знаками. Здесь знаки разные: из большего модуля вычитают меньший.' },
         { s: 'Знаки разные, значит x + y = 0', note: 'Сумма равна нулю только у противоположных чисел, например 4 и −4.' }],
        'Чьё слагаемое «сильнее»: x или y? Сравни их модули.', truth);
    }
  }

  var FAMILIES = [
    { id: 'root_squares', star: true, minGrade: 5, gen: F_rootSquares },
    { id: 'root_half', star: true, minGrade: 5, gen: F_rootHalf },
    { id: 'bounds', star: true, minGrade: 5, gen: F_bounds },
    { id: 'den_big', star: false, minGrade: 5, gen: F_denBig },
    { id: 'dec_len', star: false, minGrade: 5, gen: F_decLen },
    { id: 'scale', star: false, minGrade: 5, gen: F_scale },
    { id: 'sub_sign', star: false, minGrade: 5, gen: F_subSign },
    { id: 'neg_cmp', star: false, minGrade: 6, gen: F_negCmp },
    { id: 'sq_sign', star: false, minGrade: 6, gen: F_sqSign },
    { id: 'sum_sign', star: false, minGrade: 6, gen: F_sumSign }
  ];

  /* Раунд «Сапёра»: n-1 решений с ошибкой и одно верное. С корнями минимум два решения про корни. */
  function makeSaper7Round(grade, roots, n) {
    n = n || 5;
    var fams = FAMILIES.filter(function (f) { return f.minGrade <= grade && (roots || !f.star); });
    var star = shuffle(fams.filter(function (f) { return f.star; })), base = shuffle(fams.filter(function (f) { return !f.star; }));
    var order = roots ? star.slice(0, 2).concat(shuffle(star.slice(2).concat(base))) : base;
    var nErr = Math.min(n - 1, order.length);
    var errFams = order.slice(0, nErr), rest = order.slice(nErr);
    var okFam = rest.length ? pick(rest) : pick(errFams);
    var items = errFams.map(function (f) { return f.gen(false); });
    items.push(okFam.gen(true));
    return shuffle(items);
  }

  function trapCount7() { return Object.keys(TRAPS7).length; }

  /* ---------- статистика задания 7 (хранится в stats.t7) ---------- */
  function t7(st) {
    var t = st.t7 || (st.t7 = {});
    if (typeof t.points !== 'number') t.points = 0;
    if (typeof t.roots !== 'boolean') t.roots = false;
    t.estimate = Object.assign({ ok: 0, total: 0, caught: 0 }, t.estimate);
    t.exact = Object.assign({ ok: 0, total: 0 }, t.exact);
    ['prikidka7', 'saper7'].forEach(function (k) {
      if (typeof st.rounds[k] !== 'number') st.rounds[k] = 0;
      if (typeof st.best[k] !== 'number') st.best[k] = 0;
    });
    return t;
  }
  function skillRec(st, id) { return st.skills[id] || (st.skills[id] = { ok: 0, total: 0 }); }
  function recordPrikidka7(st, task, r) { /* {estOk, exactFirst, caught, points} */
    var T = t7(st);
    T.estimate.total++;
    if (r.estOk) T.estimate.ok++;
    if (r.caught) T.estimate.caught++;
    T.exact.total++;
    if (r.exactFirst) T.exact.ok++;
    var s = skillRec(st, task.skill);
    s.total++;
    if (r.exactFirst) s.ok++;
    T.points += r.points;
  }
  function recordSaper7(st, item, r) { /* {found, foundFirst, fixedOk, points} */
    var T = t7(st);
    L.recordSaper(st, item, { found: r.found, foundFirst: r.foundFirst, fixedOk: r.fixedOk, points: 0 });
    T.points += r.points;
  }
  function catalogFound7(st) {
    return Object.keys(st.traps || {}).filter(function (k) { return st.traps[k].found > 0 && TRAPS7[k]; }).length;
  }

  return Object.assign(L, {
    SKILLS7: SKILLS7, TRAPS7: TRAPS7, SAPER7_FAMILIES: FAMILIES,
    makePrikidka7Round: makePrikidka7Round, genPrikidka7: genPrikidka7, makeSaper7Round: makeSaper7Round,
    trapCount7: trapCount7, catalogFound7: catalogFound7, t7: t7,
    recordPrikidka7: recordPrikidka7, recordSaper7: recordSaper7
  });
});
