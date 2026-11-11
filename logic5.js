/* Задание 7: логика режимов «Числовая прямая», «Мастерская сравнений», «Знаки и шкала», «Лупа».
   Без DOM. Дополняет Logic (нужны logic.js и logic4.js). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { require('./logic.js'); module.exports = factory(require('./logic4.js')); }
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, MINUS = L.MINUS, fmt = L.fmt;
  var randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, gcd = U.gcd;

  function fr(k, d) { return '[' + k + '/' + d + ']'; }
  function rt(s) { return '√(' + s + ')'; }
  function isSquare(n) { var r = Math.round(Math.sqrt(n)); return r * r === n; }
  function isqrt(n) { var r = Math.floor(Math.sqrt(n)); while (r * r > n) r--; while ((r + 1) * (r + 1) <= n) r++; return r; }
  function sgn(n) { return n < 0 ? MINUS + Math.abs(n) : String(n); }
  function frac(x) { return x - Math.floor(x); }
  function skillRec(st, id) { return st.skills[id] || (st.skills[id] = { ok: 0, total: 0 }); }
  function nonSq(lo, hi) { var n; do { n = randInt(lo, hi); } while (isSquare(n)); return n; }

  /* десятичная запись целого m, делённого на 10^L: dstr(435,2) = «4,35» */
  function dstr(m, L2) {
    if (!L2) return String(m);
    var p = Math.pow(10, L2), w = Math.floor(m / p), r = String(m % p);
    while (r.length < L2) r = '0' + r;
    return w + ',' + r;
  }

  /* ---------- числа разных видов: {label, value, kind, n?/p?/q?} ---------- */
  function mkDec(lo, hi) {
    var v = randInt(Math.round(lo * 10) + 1, Math.round(hi * 10) - 1) / 10;
    return { label: fmt(v), value: v, kind: 'dec' };
  }
  function mkFrac(lo, hi) {
    var q = pick([2, 3, 4, 5, 6, 7, 8]), neg = hi <= 0, a = Math.abs(neg ? lo : lo), b = Math.abs(neg ? hi : hi);
    var mn = neg ? Math.abs(hi) : lo, mx = neg ? Math.abs(lo) : hi;
    var p = randInt(Math.floor(mn * q) + 1, Math.ceil(mx * q) - 1);
    if (p % q === 0) p++;
    var v = p / q;
    return { label: (neg ? MINUS : '') + fr(p, q), value: neg ? -v : v, kind: 'frac', p: p, q: q };
  }
  function mkRoot(lo, hi) {
    var n = nonSq(Math.max(2, Math.ceil(lo * lo)), Math.floor(hi * hi));
    return { label: rt(n), value: Math.sqrt(n), kind: 'root', n: n };
  }
  /* число вида kind, с дробной частью не у самой целой точки */
  function mkNum(kind, lo, hi) {
    for (var i = 0; i < 200; i++) {
      var x = kind === 'root' ? mkRoot(lo, hi) : kind === 'frac' ? mkFrac(lo, hi) : mkDec(lo, hi);
      var f = frac(x.value);
      if (f >= 0.22 && f <= 0.78 && x.value > lo + 0.05 && x.value < hi - 0.05) return x;
    }
    return mkDec(lo + 0.3, hi - 0.3);
  }
  function kindsFor(grade, roots) {
    var k = ['dec', 'frac', 'dec', 'frac'];
    return roots ? k.concat(['root', 'root']) : k;
  }
  function spaced(list, gap) {
    for (var i = 0; i < list.length; i++) for (var j = i + 1; j < list.length; j++) if (Math.abs(list[i].value - list[j].value) < gap) return false;
    return true;
  }
  function whyInterval(x) {
    var a = Math.floor(x.value), b = a + 1;
    if (x.kind === 'root') return a * a + ' < ' + x.n + ' < ' + b * b + ', поэтому ' + a + ' < ' + rt(x.n) + ' < ' + b + '.';
    if (x.kind === 'frac') {
      var p = x.p, q = x.q, w = Math.floor(p / q);
      return fr(p, q) + ' = ' + (w ? w + ' ' : '') + fr(p % q, q) + ', это между ' + w + ' и ' + (w + 1) + '.';
    }
    return fmt(x.value) + ' лежит между ' + sgn(a) + ' и ' + sgn(b) + '.';
  }

  /* ---------- Числовая прямая ---------- */
  var TOL = 0.2;
  function lineAround(grade, v) {
    var f = Math.floor(v), lo = f - randInt(1, 4);
    if (grade < 6 && lo < 0) lo = 0;
    return { lo: lo, hi: lo + 7 };
  }
  function rangeFor(grade) { return grade >= 6 && Math.random() < 0.4 ? { lo: -6, hi: -1 } : { lo: 1, hi: 8 }; }

  function genPlace(grade, roots) {
    var r = rangeFor(grade), kind = pick(kindsFor(grade, roots));
    if (kind === 'root') r = { lo: 2, hi: 8 };
    var x = mkNum(kind, r.lo, r.hi);
    return { kind: 'place', skill: 't7_point', number: x, value: x.value, tol: TOL, line: lineAround(grade, x.value),
      title: 'Отметь число на прямой', explain: whyInterval(x) };
  }
  function genMatch(grade, roots) {
    var r = rangeFor(grade), kind = pick(kindsFor(grade, roots));
    if (kind === 'root') r = { lo: 2, hi: 8 };
    var x = mkNum(kind, r.lo, r.hi), line = lineAround(grade, x.value), pts, tries = 0;
    do {
      pts = [x.value];
      while (pts.length < 4) pts.push(line.lo + 0.4 + Math.random() * (line.hi - line.lo - 0.8));
      pts = pts.map(function (v) { return Math.round(v * 20) / 20; });
      pts[0] = x.value;
      var okSp = spaced(pts.map(function (v) { return { value: v }; }), 0.6);
      var okInt = pts.every(function (v, i) { return i === 0 || (frac(v) > 0.12 && frac(v) < 0.88); });
      tries++;
    } while (!(okSp && okInt) && tries < 500);
    var letters = ['A', 'B', 'C', 'D'], order = shuffle([0, 1, 2, 3]);
    var points = order.map(function (src, i) { return { x: pts[src], letter: letters[i], ok: src === 0 }; });
    points.sort(function (a, b) { return a.x - b.x; });
    points.forEach(function (p, i) { p.letter = letters[i]; });
    var good = points.filter(function (p) { return p.ok; })[0];
    return { kind: 'match', skill: 't7_point', number: x, value: x.value, line: { lo: line.lo, hi: line.hi, points: points },
      correctLetter: good.letter, title: 'Какая точка соответствует числу?',
      explain: whyInterval(x) + ' Подходит точка ' + good.letter + '.' };
  }
  function genOrder(grade, roots) {
    var kinds = shuffle(kindsFor(grade, roots)), items, tries = 0, r = grade >= 6 ? { lo: -5, hi: 6 } : { lo: 1, hi: 8 };
    do {
      items = [];
      var ks = roots ? ['root', pick(['dec', 'frac']), 'dec', 'frac'] : ['dec', 'frac', 'dec', 'frac'];
      ks.forEach(function (k) {
        var rr = k === 'root' ? { lo: 2, hi: 8 } : r;
        var x = mkNum(k, rr.lo, rr.hi);
        items.push({ label: x.label, value: x.value });
      });
      tries++;
    } while (!spaced(items, 0.3) && tries < 500);
    var sorted = items.slice().sort(function (a, b) { return a.value - b.value; });
    var shuffled = shuffle(items.slice());
    if (shuffled.every(function (it, i) { return it === sorted[i]; })) shuffled.reverse();
    return { kind: 'order', skill: 't7_compare', items: shuffled, sorted: sorted.map(function (s) { return s.label; }),
      title: 'Расставь числа по возрастанию',
      explain: 'Порядок от меньшего к большему: ' + sorted.map(function (s) { return s.label; }).join(' < ') + '.' };
  }
  function makeNumline7Round(grade, roots, n) {
    n = n || 5;
    var plan = shuffle(['place', 'place', 'match', 'match', 'order']).slice(0, n);
    return plan.map(function (k) { return k === 'place' ? genPlace(grade, roots) : k === 'match' ? genMatch(grade, roots) : genOrder(grade, roots); });
  }
  function checkPlace7(task, x) {
    var d = Math.abs(x - task.value);
    return { ok: d <= task.tol, intervalOk: Math.floor(x) === Math.floor(task.value) };
  }
  function checkOrder7(task, labels) {
    return labels.length === task.sorted.length && labels.every(function (l, i) { return l === task.sorted[i]; });
  }

  /* ---------- Мастерская сравнений ---------- */
  function cmpSign(a, b) { return a > b ? '>' : '<'; }
  function lcm(a, b) { return a * b / gcd(a, b); }
  function wsTask(fam, trap, skill, a, b, answer, conv, explain) {
    return { family: fam, trap: trap, skill: skill, a: a, b: b, answer: answer, conv: conv, explain: explain,
      title: 'Сравни числа' };
  }
  function wsDec() {
    var w = randInt(0, 6), d1 = randInt(1, 8), d1b = Math.max(0, Math.min(9, d1 + pick([-1, 0, 0, 1]))), d2 = randInt(1, 9);
    var A = 100 * w + 10 * d1, B = 100 * w + 10 * d1b + d2;
    var swap = Math.random() < 0.5, x = { label: dstr(A / 10, 1), value: A / 100 }, y = { label: dstr(B, 2), value: B / 100 };
    var a = swap ? y : x, b = swap ? x : y, va = swap ? B : A, vb = swap ? A : B;
    var ans = cmpSign(va, vb);
    var conv = { a: dstr(va, 2), b: dstr(vb, 2) };
    return wsTask('ws_dec', 't7_dec_len', 't7_compare', a, b, ans, conv,
      'Уравняем число знаков после запятой: ' + conv.a + ' и ' + conv.b + '. Сравниваем по разрядам: ' + conv.a + ' ' + ans + ' ' + conv.b + '.');
  }
  function wsDen() {
    var q1, q2, p1, p2;
    do {
      q1 = randInt(3, 9); q2 = randInt(3, 9);
      if (Math.random() < 0.4) { p1 = p2 = randInt(2, 6); } else { p1 = randInt(1, 2 * q1); p2 = randInt(1, 2 * q2); }
    } while (q1 === q2 || p1 * q2 === p2 * q1 || p1 % q1 === 0 || p2 % q2 === 0);
    var Lc = lcm(q1, q2), n1 = p1 * Lc / q1, n2 = p2 * Lc / q2, ans = cmpSign(n1, n2);
    var conv = { a: fr(n1, Lc), b: fr(n2, Lc) };
    return wsTask('ws_den', 't7_den_big', 't7_compare', { label: fr(p1, q1), value: p1 / q1 }, { label: fr(p2, q2), value: p2 / q2 }, ans, conv,
      'Общий знаменатель ' + Lc + ': ' + fr(p1, q1) + ' = ' + conv.a + ', ' + fr(p2, q2) + ' = ' + conv.b + '. Так как ' + n1 + (n1 > n2 ? ' > ' : ' < ') + n2 + ', получаем ' + fr(p1, q1) + ' ' + ans + ' ' + fr(p2, q2) + '.');
  }
  function wsSq() {
    var n, k, d, M;
    do {
      k = randInt(2, 9); d = randInt(1, 9); M = 10 * k + d;
      n = Math.round(M * M / 100) + pick([-1, 0, 1]);
    } while (n < 2 || isSquare(n) || 100 * n === M * M);
    var swap = Math.random() < 0.5, x = { label: rt(n), value: Math.sqrt(n) }, y = { label: dstr(M, 1), value: M / 10 };
    var gt = 100 * n > M * M, ans = swap ? (gt ? '<' : '>') : (gt ? '>' : '<');
    var sq = dstr(M * M, 2);
    return wsTask('ws_sq', 't7_root_half', 't7_roots', swap ? y : x, swap ? x : y, ans, { a: swap ? sq : String(n), b: swap ? String(n) : sq },
      'Возведём оба числа в квадрат: (' + rt(n) + ')² = ' + n + ' и (' + dstr(M, 1) + ')² = ' + sq + '. Так как ' + n + (gt ? ' > ' : ' < ') + sq + ', то ' + (swap ? y.label + ' ' + ans + ' ' + x.label : x.label + ' ' + ans + ' ' + y.label) + '.');
  }
  function wsSq2() {
    var k, p, q, N;
    do {
      k = randInt(2, 5); p = randInt(2, 7); N = k * k * p; q = Math.round(Math.sqrt(N)) + pick([-1, 0, 1]);
    } while (isSquare(p) || q < 2 || q * q === N);
    var swap = Math.random() < 0.5, x = { label: k + rt(p), value: k * Math.sqrt(p) }, y = { label: String(q), value: q };
    var gt = N > q * q, ans = swap ? (gt ? '<' : '>') : (gt ? '>' : '<');
    return wsTask('ws_sq2', 't7_root_half', 't7_roots', swap ? y : x, swap ? x : y, ans,
      { a: swap ? String(q * q) : rt(N), b: swap ? rt(N) : String(q * q) },
      'Внесём множитель под корень: ' + k + rt(p) + ' = ' + rt(k + '²·' + p) + ' = ' + rt(N) + '. Число ' + q + ' = ' + rt(q * q) + '. Сравниваем подкоренные числа: ' + N + (gt ? ' > ' : ' < ') + q * q + ', значит ' + (swap ? y.label + ' ' + ans + ' ' + x.label : x.label + ' ' + ans + ' ' + y.label) + '.');
  }
  function makeWs7Round(grade, roots, n) {
    n = n || 5;
    var base = [wsDec, wsDen, wsDec, wsDen, wsDen], list;
    if (roots) list = [wsSq, wsSq2].concat(shuffle([wsDec, wsDen, wsDen, wsSq, wsSq2, wsDec]).slice(0, 3));
    else list = base;
    return shuffle(list.slice(0, n).map(function (f) { return f(); }));
  }

  /* ---------- Знаки и шкала ---------- */
  var SCALES = [[1, 2], [1, 4], [1, 5], [2, 4], [2, 5]];
  function genScale(grade) {
    var sc = pick(SCALES), m = sc[0], n = sc[1], price = m / n;
    var A = grade >= 6 ? randInt(-4, 2) : randInt(0, 4), ib = n, T = ib + randInt(1, n), j;
    do { j = randInt(1, T); } while (j === ib);
    var val = Math.round((A + j * price) * 100) / 100;
    var cand = [A + j, Math.round((A + j * 0.1) * 100) / 100, val + price, val - price, val + 1, A + m + (j - ib), Math.round((A + (j - ib) * price) * 100) / 100];
    var wrong = [];
    shuffle(cand).forEach(function (c) { c = Math.round(c * 100) / 100; if (c !== val && wrong.indexOf(c) < 0 && wrong.length < 3 && (grade >= 6 || c >= 0)) wrong.push(c); });
    var opts = shuffle([{ label: fmt(val), ok: true }].concat(wrong.map(function (c) { return { label: fmt(c), ok: false }; })));
    return { kind: 'scale', skill: 't7_point', trap: 't7_scale', title: 'Чему равна координата точки?',
      line: { A: A, B: A + m, price: price, n: n, ib: ib, T: T, j: j }, value: val, opts: opts,
      hint: 'Между ' + sgn(A) + ' и ' + sgn(A + m) + ' поровну ' + n + ' делений. Цена одного деления: ' + m + ' : ' + n + ' = ' + fmt(price) + '.',
      explain: 'Цена деления ' + fmt(price) + '. Точка стоит на ' + j + '-м делении от ' + sgn(A) + ': ' + sgn(A) + ' + ' + j + '·' + fmt(price) + ' = ' + fmt(val) + '.' };
  }
  var XY_POOL = [
    { t: 'a − b > 0', f: function (a, b) { return a - b > 0; } }, { t: 'a − b < 0', f: function (a, b) { return a - b < 0; } },
    { t: 'b − a > 0', f: function (a, b) { return b - a > 0; } }, { t: 'b − a < 0', f: function (a, b) { return b - a < 0; } },
    { t: 'a + b > 0', f: function (a, b) { return a + b > 0; } }, { t: 'a + b < 0', f: function (a, b) { return a + b < 0; } },
    { t: 'ab > 0', f: function (a, b) { return a * b > 0; } }, { t: 'ab < 0', f: function (a, b) { return a * b < 0; } }
  ];
  function genXY() {
    var a, b, vals = [-5, -4.5, -4, -3.5, -3, -2.5, -2, -1.5, -1, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
    do { a = pick(vals); b = pick(vals); } while (Math.abs(a - b) < 1 || Math.abs(a + b) < 1);
    var tr = [], fl = [];
    XY_POOL.forEach(function (s) { (s.f(a, b) ? tr : fl).push(s.t.replace('−', MINUS)); });
    var good = pick(tr), bad = shuffle(fl).slice(0, 3);
    var opts = shuffle([{ label: good, ok: true }].concat(bad.map(function (t) { return { label: t, ok: false }; })));
    var ex = 'Точка a ' + (a < b ? 'левее' : 'правее') + ' точки b, значит a ' + MINUS + ' b ' + (a < b ? '<' : '>') + ' 0. ' +
      (a * b > 0 ? 'Числа одного знака: ab > 0.' : 'Числа разных знаков: ab < 0.') + ' ' +
      (Math.abs(a) > Math.abs(b) ? 'Число a дальше от нуля, поэтому знак суммы как у a: a + b ' + (a > 0 ? '>' : '<') + ' 0.' : 'Число b дальше от нуля, поэтому знак суммы как у b: a + b ' + (b > 0 ? '>' : '<') + ' 0.');
    return { kind: 'xy', skill: 't7_signs', title: 'Какое утверждение верно?', line: { lo: -6, hi: 6, points: [{ x: a, letter: 'a' }, { x: b, letter: 'b' }] },
      a: a, b: b, opts: opts, hint: 'Сначала определи знаки чисел a и b относительно нуля и какое из них дальше от нуля.', explain: ex + ' Верно: ' + good + '.' };
  }
  function makeSigns7Round(grade, roots, n) {
    n = n || 5;
    if (grade < 6) { var r = []; for (var i = 0; i < n; i++) r.push(genScale(grade)); return r; }
    var plan = shuffle(['scale', 'scale', 'xy', 'xy', 'xy']).slice(0, n);
    return plan.map(function (k) { return k === 'scale' ? genScale(grade) : genXY(); });
  }

  /* ---------- Лупа: приближаем число к ответу ----------
     Глубина по номеру задания: [0,0,1,2,2] → шагов 1,1,2,3,3 (целые, десятые, сотые). */
  var DEPTH = [0, 0, 1, 2, 2];
  function floorScaled(x, lv) {
    var p = Math.pow(10, lv);
    if (x.kind === 'root') return isqrt(x.n * p * p);
    return Math.floor(x.p * p / x.q);
  }
  function loupeStep(x, lv) {
    var m = floorScaled(x, lv), p = Math.pow(10, lv);
    var offs = shuffle(lv === 0 ? [-1, 0, 1, 2] : [-1, 0, 1, 2]);
    var lowest = lv === 0 ? 1 : 0;
    var picks = offs.map(function (o) { return m + o; }).filter(function (v) { return v >= lowest; });
    while (picks.length < 4) { var nx = Math.max.apply(null, picks) + 1; picks.push(nx); }
    picks = shuffle(picks.slice(0, 4));
    if (picks.indexOf(m) < 0) picks[0] = m;
    picks = shuffle(picks);
    var opts = picks.map(function (v) { return { label: dstr(v, lv) + ' и ' + dstr(v + 1, lv), ok: v === m }; });
    var aid, expl;
    if (x.kind === 'root') {
      var s1 = lv ? dstr(m * m, 2 * lv) : String(m * m), s2 = lv ? dstr((m + 1) * (m + 1), 2 * lv) : String((m + 1) * (m + 1));
      aid = '(' + dstr(m, lv) + ')² = ' + s1 + ' и (' + dstr(m + 1, lv) + ')² = ' + s2 + '. Сравни с ' + x.n + '.';
      expl = s1 + ' < ' + x.n + ' < ' + s2 + ', поэтому ' + dstr(m, lv) + ' < ' + rt(x.n) + ' < ' + dstr(m + 1, lv) + '.';
    } else {
      var dec = dstr(Math.floor(x.p * Math.pow(10, lv + 2) / x.q), lv + 2);
      aid = 'Поделим числитель на знаменатель: ' + x.p + ' : ' + x.q + ' = ' + dec + '…';
      expl = fr(x.p, x.q) + ' = ' + dec + '…, значит ' + dstr(m, lv) + ' < ' + fr(x.p, x.q) + ' < ' + dstr(m + 1, lv) + '.';
    }
    var title = lv === 0 ? 'Между какими целыми числами?' : lv === 1 ? 'Приблизим: между какими десятыми?' : 'Ещё ближе: между какими сотыми?';
    return { level: lv, title: title, opts: opts, aid: aid, explain: expl };
  }
  function genLoupe(grade, roots, idx) {
    var depth = DEPTH[idx % DEPTH.length], x;
    if (roots && Math.random() < 0.6) { var n = nonSq(5, 99); x = { kind: 'root', n: n, label: rt(n), value: Math.sqrt(n) }; }
    else {
      var q = pick([3, 6, 7, 9, 11, 13]), p;
      do { p = randInt(q + 2, 9 * q); } while (p % q === 0);
      x = { kind: 'frac', p: p, q: q, label: fr(p, q), value: p / q };
    }
    var steps = [];
    for (var lv = 0; lv <= depth; lv++) steps.push(loupeStep(x, lv));
    return { kind: x.kind, skill: x.kind === 'root' ? 't7_roots' : 't7_between', number: x, steps: steps, depth: depth,
      title: 'Найди число с помощью лупы' };
  }
  function makeLoupe7Round(grade, roots, n) {
    n = n || 5;
    var r = [];
    for (var i = 0; i < n; i++) r.push(genLoupe(grade, roots, i));
    return r;
  }

  /* ---------- статистика и очки ---------- */
  var KEYS7 = ['numline7', 'ws7', 'signs7', 'loupe7'];
  var baseT7 = L.t7;
  function t7(st) {
    var t = baseT7(st);
    KEYS7.forEach(function (k) {
      if (typeof st.rounds[k] !== 'number') st.rounds[k] = 0;
      if (typeof st.best[k] !== 'number') st.best[k] = 0;
    });
    t.modes = Object.assign({ numline: { ok: 0, total: 0 }, ws: { ok: 0, total: 0 }, signs: { ok: 0, total: 0 }, loupe: { ok: 0, total: 0 } }, t.modes);
    return t;
  }
  function bumpMode(st, name, task, ok, points) {
    var T = t7(st), m = T.modes[name];
    m.total++; if (ok) m.ok++;
    var s = skillRec(st, task.skill);
    s.total++; if (ok) s.ok++;
    T.points += points;
  }
  function recordNumline7(st, task, r) { /* {ok(с первой попытки), solved} */
    var pts = r.ok ? 10 : r.solved ? 4 : 0;
    bumpMode(st, 'numline', task, r.ok, pts);
    return pts;
  }
  function recordWs7(st, task, r) { /* {firstOk, usedConv, solved} */
    var pts = r.firstOk ? (r.usedConv ? 6 : 10) : r.solved ? 3 : 0;
    bumpMode(st, 'ws', task, r.firstOk, pts);
    return pts;
  }
  function recordSigns7(st, task, r) { /* {ok, hint, solved} */
    var pts = r.ok ? (r.hint ? 7 : 10) : r.solved ? 3 : 0;
    bumpMode(st, 'signs', task, r.ok, pts);
    return pts;
  }
  function recordLoupe7(st, task, r) { /* {steps:[{firstOk, aid, solved}]} */
    var pts = 0, allOk = true;
    r.steps.forEach(function (s) {
      var p = s.firstOk ? (s.aid ? 3 : 4) : s.solved ? 1 : 0;
      pts += p; if (!s.firstOk) allOk = false;
    });
    bumpMode(st, 'loupe', task, allOk, pts);
    return pts;
  }
  function maxPoints7(mode, task) {
    if (mode === 'loupe') return 4 * task.steps.length;
    return 10;
  }

  return Object.assign(L, {
    makeNumline7Round: makeNumline7Round, genPlace7: genPlace, genMatch7: genMatch, genOrder7: genOrder,
    checkPlace7: checkPlace7, checkOrder7: checkOrder7,
    makeWs7Round: makeWs7Round, makeSigns7Round: makeSigns7Round, genScale7: genScale, genXY7: genXY,
    makeLoupe7Round: makeLoupe7Round, genLoupe7: genLoupe, LOUPE7_DEPTH: DEPTH,
    t7: t7, KEYS7: KEYS7, maxPoints7: maxPoints7,
    recordNumline7: recordNumline7, recordWs7: recordWs7, recordSigns7: recordSigns7, recordLoupe7: recordLoupe7
  });
});
