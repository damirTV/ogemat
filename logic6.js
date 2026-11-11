/* «Спринт»: 10 заданий в формате экзамена для заданий 6 и 7. Без DOM. Нужны logic.js и logic4.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { require('./logic.js'); require('./logic4.js'); module.exports = factory(require('./logic.js')); }
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, MINUS = L.MINUS, fmt = L.fmt;
  var randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, gcd = U.gcd;
  var SPRINT_SECONDS = 900;

  function fr(a, b) { return '{' + a + '|' + b + '}'; }
  function rt(n) { return '√(' + n + ')'; }
  function lcm(a, b) { return a * b / gcd(a, b); }
  function isSquare(n) { var r = Math.round(Math.sqrt(n)); return r * r === n; }
  function nonSq(lo, hi) { var n; do { n = randInt(lo, hi); } while (isSquare(n)); return n; }
  function r6(x) { return Math.round(x * 1e6) / 1e6; }
  function terminating(n, d) { var g = gcd(n, d); d = d / g; while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; }
  function sg(n) { return n < 0 ? MINUS + Math.abs(n) : String(n); }

  /* =============== СПРИНТ, ЗАДАНИЕ 6: вычисления с ответом-числом =============== */
  /* Несколько форм на каждый слот: слот задаёт тип задания (как в вариантах ОГЭ),
     форма и числа выбираются случайно. Ответ всегда конечная десятичная дробь. */
  function N(x) { return fmt(r6(x)); }                       // число в записи ответа
  function P(x) { return x < 0 ? '(' + N(x) + ')' : N(x); }   // отрицательное в скобках
  function dp(x) { var s = String(r6(Math.abs(x))), i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; }
  function okVal(v, maxDp) { return isFinite(v) && Math.abs(v) >= 0.05 && dp(v) <= (maxDp || 3); }
  function decN(lo, hi, places) { return r6(randInt(lo, hi) / Math.pow(10, places)); }
  /* Пытаемся собрать задание, пока форма не даст подходящий ответ */
  function tryMake(f, grade) { for (var i = 0; i < 4000; i++) { var t = f(grade); if (t) return t; } throw new Error('Спринт: не удалось составить задание'); }
  function anyOf(forms) { return function (grade) { return tryMake(pick(forms), grade); }; }

  /* ---- обыкновенные дроби: сложение и вычитание ---- */
  var DEN = [2, 4, 5, 8, 10, 20, 25, 40, 50];
  var DEN_ANY = [2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 18, 20, 24, 25];
  function fracPair(plus) {
    var b = pick(DEN), d = pick(DEN), a = randInt(1, 6 * b), c = randInt(1, 6 * d);
    if (!(b !== d && gcd(a, b) === 1 && gcd(c, d) === 1 && a % b !== 0 && c % d !== 0 && a / b > 0.4 && c / d > 0.4 && a / b < 13 && (plus || a / b > c / d + 0.3))) return null;
    return { a: a, b: b, c: c, d: d };
  }
  function addSubCore(f, plus) {
    var Lc = lcm(f.b, f.d), x = f.a * Lc / f.b, y = f.c * Lc / f.d;
    return { Lc: Lc, x: x, y: y, top: plus ? x + y : x - y, sign: plus ? ' + ' : ' ' + MINUS + ' ' };
  }
  function fsPlain(plus) {
    return function () {
      var f = fracPair(plus); if (!f) return null;
      var c = addSubCore(f, plus), v = c.top / c.Lc;
      if (!okVal(v)) return null;
      return { type: plus ? 'frac_add' : 'frac_sub', skill: 'frac_addsub', expr: fr(f.a, f.b) + c.sign + fr(f.c, f.d), value: r6(v),
        explain: 'Общий знаменатель ' + c.Lc + ': ' + fr(f.a, f.b) + ' = ' + fr(c.x, c.Lc) + ', ' + fr(f.c, f.d) + ' = ' + fr(c.y, c.Lc) + '. ' + (plus ? 'Сумма' : 'Разность') + ': ' + fr(c.top, c.Lc) + ' = ' + N(v) + '.' };
    };
  }
  /* (a/b ± c/d) · k: знаменатели любые, множитель «съедает» знаменатель */
  function fsTimes(plus) {
    return function () {
      var b = pick(DEN_ANY), d = pick(DEN_ANY), a = randInt(1, 2 * b), c = randInt(1, 2 * d);
      if (b === d || gcd(a, b) !== 1 || gcd(c, d) !== 1 || a === b || c === d) return null;
      var co = addSubCore({ a: a, b: b, c: c, d: d }, plus);
      if (co.top <= 0) return null;
      var k = pick([co.Lc, co.Lc * randInt(2, 3), co.Lc / gcd(co.Lc, 10) , co.Lc / gcd(co.Lc, 100)]);
      if (k < 2 || k > 90 || k !== Math.round(k)) return null;
      var v = co.top * k / co.Lc, g = gcd(co.top, co.Lc);
      if (!okVal(v, 2) || v > 200) return null;
      return { type: plus ? 'frac_add' : 'frac_sub', skill: 'frac_addsub', expr: '(' + fr(a, b) + co.sign + fr(c, d) + ') · ' + k, value: r6(v),
        explain: 'Сначала скобки, общий знаменатель ' + co.Lc + ': ' + fr(co.x + co.sign + co.y, co.Lc) + ' = ' + fr(co.top / g, co.Lc / g) + '. Потом умножаем: ' + fr(co.top / g, co.Lc / g) + ' · ' + k + ' = ' + N(v) + '.' };
    };
  }
  /* дробь ± десятичная дробь */
  function fsMixed(plus) {
    return function () {
      var b = pick([2, 4, 5, 8, 20, 25]), a = randInt(1, 3 * b);
      if (gcd(a, b) !== 1 || a === b) return null;
      var y = decN(1, 60, pick([1, 2])), fv = a / b, v = plus ? fv + y : fv - y;
      if (!plus && v <= 0.1) return null;
      if (!okVal(v)) return null;
      var first = Math.random() < 0.5 || !plus;
      return { type: plus ? 'frac_add' : 'frac_sub', skill: 'frac_addsub', expr: first ? fr(a, b) + (plus ? ' + ' : ' ' + MINUS + ' ') + N(y) : N(y) + ' + ' + fr(a, b), value: r6(v),
        explain: 'Переведём обыкновенную дробь в десятичную: ' + fr(a, b) + ' = ' + N(fv) + '. ' + (plus ? 'Сумма: ' + N(fv) + ' + ' + N(y) : 'Разность: ' + N(fv) + ' ' + MINUS + ' ' + N(y)) + ' = ' + N(v) + '.' };
    };
  }
  var sp6FracSub = anyOf([fsPlain(false), fsPlain(false), fsTimes(false), fsMixed(false)]);
  var sp6FracAdd = anyOf([fsPlain(true), fsPlain(true), fsTimes(true), fsMixed(true)]);

  /* ---- десятичные: сложение и вычитание ---- */
  function dsTwo(plus) {
    return function (grade) {
      var px = pick([1, 1, 2]), py = pick([1, 2]), x = decN(11, px === 1 ? 199 : 1999, px), y = decN(11, py === 1 ? 199 : 999, py);
      if (x === y || dp(x) === 0 || dp(y) === 0) return null;
      if (!plus) {
        if ((grade < 6 && x < y) || (grade >= 6 && x > y && Math.random() < 0.5)) { var t = x; x = y; y = t; }
      }
      var v = plus ? x + y : x - y;
      if (!okVal(v)) return null;
      var expl = plus ? 'Складываем в столбик, запятая под запятой: ' + N(x) + ' + ' + N(y) + ' = ' + N(v) + '.'
        : v > 0 ? 'Вычитаем в столбик, запятая под запятой: ' + N(x) + ' ' + MINUS + ' ' + N(y) + ' = ' + N(v) + '.'
        : 'Из большего числа вычитаем меньшее: ' + N(y) + ' ' + MINUS + ' ' + N(x) + ' = ' + N(-v) + '. Уменьшаемое меньше вычитаемого, поэтому ответ отрицательный: ' + N(v) + '.';
      return { type: plus ? 'dec_add' : 'dec_sub', skill: 'dec_addsub', expr: N(x) + (plus ? ' + ' : ' ' + MINUS + ' ') + N(y), value: r6(v), explain: expl };
    };
  }
  function dsThree(grade) {
    var a = decN(11, 199, pick([1, 2])), b = decN(11, 199, 1), c = decN(11, 199, pick([1, 2])), order = randInt(0, 1);
    var v = order ? a + b - c : a - b + c;
    if ((grade < 6 && (v <= 0 || (!order && a < b))) || !okVal(v)) return null;
    var e = order ? N(a) + ' + ' + N(b) + ' ' + MINUS + ' ' + N(c) : N(a) + ' ' + MINUS + ' ' + N(b) + ' + ' + N(c);
    var s1 = order ? a + b : a - b;
    return { type: 'dec_sub', skill: 'dec_addsub', expr: e, value: r6(v),
      explain: 'Действия выполняем по порядку слева направо: ' + (order ? N(a) + ' + ' + N(b) : N(a) + ' ' + MINUS + ' ' + N(b)) + ' = ' + N(s1) + ', затем ' + N(s1) + (order ? ' ' + MINUS + ' ' : ' + ') + N(c) + ' = ' + N(v) + '.' };
  }
  var sp6DecSub = anyOf([dsTwo(false), dsTwo(false), dsThree]);
  var sp6DecAdd = anyOf([dsTwo(true), dsTwo(true), dsThree]);

  /* ---- десятичные: деление (самый частый тип в вариантах) ---- */
  function divPair() {
    /* делитель d и частное q; делимое n = d · q имеет не больше двух знаков после запятой */
    var d = pick([decN(11, 99, 1), decN(11, 49, 1), decN(2, 9, 1), decN(12, 96, 2)]);
    var q = Math.random() < 0.5 ? randInt(2, 40) : decN(11, 99, 1);
    var n = r6(d * q);
    if (dp(n) > 2 || n === q || n > 300) return null;
    return { n: n, d: d, q: q };
  }
  function shiftText(d, frac) { var k = dp(d); return k ? 'Умножим ' + (frac ? 'числитель и знаменатель' : 'делимое и делитель') + ' на ' + Math.pow(10, k) + ', чтобы ' + (frac ? 'знаменатель' : 'делитель') + ' стал целым' : 'Делим'; }
  function ddFrac() {
    var p = divPair(); if (!p) return null;
    var k = Math.pow(10, dp(p.d));
    return { type: 'dec_div', skill: 'dec_div', expr: fr(N(p.n), N(p.d)), value: p.q,
      explain: 'Дробная черта означает деление. ' + shiftText(p.d, true) + ': ' + fr(N(p.n * k), N(p.d * k)) + ' = ' + N(p.q) + '.' };
  }
  function ddColon() {
    var p = divPair(); if (!p) return null;
    var k = Math.pow(10, dp(p.d));
    return { type: 'dec_div', skill: 'dec_div', expr: N(p.n) + ' : ' + N(p.d), value: p.q,
      explain: shiftText(p.d, false) + ': ' + N(p.n * k) + ' : ' + N(p.d * k) + ' = ' + N(p.q) + '.' };
  }
  /* {a | b ± c}: сначала знаменатель */
  function ddDenSum(grade) {
    var s = decN(11, 89, 1), q = Math.random() < 0.6 ? randInt(2, 15) : decN(5, 45, 1), a = r6(s * q);
    if (dp(a) > 2 || a > 150) return null;
    var minus = Math.random() < 0.35, b, c;
    if (!minus) { b = decN(1, Math.round(s * 10) - 1, 1); c = r6(s - b); if (b <= 0 || c <= 0) return null; }
    else { c = decN(5, 60, 1); b = r6(s + c); }
    var neg = grade >= 6 && minus && Math.random() < 0.5, den = neg ? r6(c - b) : s, v = r6(a / den);
    var e = neg ? fr(N(a), N(c) + ' ' + MINUS + ' ' + N(b)) : fr(N(a), N(b) + (minus ? ' ' + MINUS + ' ' : ' + ') + N(c));
    return { type: 'dec_div', skill: 'dec_div', expr: e, value: v,
      explain: 'Сначала знаменатель: ' + (neg ? N(c) + ' ' + MINUS + ' ' + N(b) : N(b) + (minus ? ' ' + MINUS + ' ' : ' + ') + N(c)) + ' = ' + N(den) + '. Потом делим: ' + N(a) + ' : ' + P(den) + ' = ' + N(v) + '.' };
  }
  /* {a ± b | c}: сначала числитель */
  function ddNumSum(grade) {
    var c = pick([decN(2, 9, 1), decN(11, 49, 1), randInt(2, 9)]), q = Math.random() < 0.6 ? randInt(2, 25) : decN(11, 99, 1), s = r6(c * q);
    if (dp(s) > 2 || s > 150) return null;
    var minus = Math.random() < 0.4, a, b;
    if (!minus) { a = decN(1, Math.round(s * 10) - 1, 1); b = r6(s - a); if (a <= 0 || b <= 0 || dp(b) > 2) return null; }
    else { b = decN(5, 80, 1); a = r6(s + b); }
    var neg = grade >= 6 && minus && Math.random() < 0.4, top = neg ? -s : s, v = r6(top / c);
    var e = neg ? fr(N(b) + ' ' + MINUS + ' ' + N(a), N(c)) : fr(N(a) + (minus ? ' ' + MINUS + ' ' : ' + ') + N(b), N(c));
    return { type: 'dec_div', skill: 'dec_div', expr: e, value: v,
      explain: 'Сначала числитель: ' + (neg ? N(b) + ' ' + MINUS + ' ' + N(a) : N(a) + (minus ? ' ' + MINUS + ' ' : ' + ') + N(b)) + ' = ' + N(top) + '. Потом делим: ' + N(top) + ' : ' + N(c) + ' = ' + N(v) + '.' };
  }
  /* {a · b | c}: сначала удобно поделить a на c */
  function ddProd() {
    var c = decN(2, 9, 1), m = randInt(2, 9), a = r6(c * m), b = pick([decN(11, 99, 1), randInt(3, 19), decN(11, 99, 2)]), v = r6(m * b);
    if (dp(a) > 2 || !okVal(v)) return null;
    return { type: 'dec_div', skill: 'dec_div', expr: fr(N(a) + ' · ' + N(b), N(c)), value: v,
      explain: 'Удобно сначала разделить ' + N(a) + ' на ' + N(c) + ': получится ' + m + '. Потом ' + m + ' · ' + N(b) + ' = ' + N(v) + '.' };
  }
  var sp6DecDiv = anyOf([ddFrac, ddFrac, ddColon, ddDenSum, ddNumSum, ddProd]);

  /* ---- десятичные: умножение ---- */
  function dmPlain() {
    var x = pick([decN(11, 99, 1), decN(101, 999, 2), randInt(2, 19)]), y = pick([decN(11, 99, 1), decN(2, 9, 1), decN(11, 95, 2)]);
    if (x === Math.round(x) && y === Math.round(y)) return null;
    var v = r6(x * y), k = dp(x) + dp(y), X = Math.round(x * Math.pow(10, dp(x))), Y = Math.round(y * Math.pow(10, dp(y)));
    if (!okVal(v) || k > 3) return null;
    return { type: 'dec_mul', skill: 'dec_mul', expr: N(x) + ' · ' + N(y), value: v,
      explain: 'Умножим как целые числа: ' + X + ' · ' + Y + ' = ' + X * Y + '. В множителях ' + k + ' ' + (k === 1 ? 'знак' : 'знака') + ' после запятой, столько же отделяем в ответе: ' + N(v) + '.' };
  }
  /* a · b ± c и a · (b ± c); в 6 классе с отрицательными числами */
  function dmExpr(grade) {
    var neg = grade >= 6 && Math.random() < 0.6, a = decN(11, 99, 1), b = decN(11, 99, 1), c = decN(11, 199, 1), form = randInt(0, 2);
    if (neg) { if (Math.random() < 0.5) a = -a; else b = -b; }
    var e, v, ex, p;
    if (form < 2) {
      var plus = form === 0; p = r6(a * b); v = r6(plus ? p + c : p - c);
      if (!neg && v <= 0) return null;
      e = P(a) + ' · ' + P(b) + (plus ? ' + ' : ' ' + MINUS + ' ') + N(c);
      ex = 'Сначала умножение: ' + P(a) + ' · ' + P(b) + ' = ' + N(p) + '. Потом ' + P(p) + (plus ? ' + ' : ' ' + MINUS + ' ') + N(c) + ' = ' + N(v) + '.';
    } else {
      var b2 = decN(11, 99, 1), s = r6(Math.abs(b) - b2); if (s <= 0 && !neg) return null;
      v = r6(a * s);
      e = P(a) + ' · (' + N(Math.abs(b)) + ' ' + MINUS + ' ' + N(b2) + ')';
      ex = 'Сначала скобки: ' + N(Math.abs(b)) + ' ' + MINUS + ' ' + N(b2) + ' = ' + N(s) + '. Потом ' + P(a) + ' · ' + P(s) + ' = ' + N(v) + '.';
    }
    if (!okVal(v)) return null;
    return { type: 'dec_mul', skill: 'dec_mul', expr: e, value: v, explain: ex };
  }
  var sp6DecMul = anyOf([dmPlain, dmPlain, dmExpr]);

  /* ---- обыкновенные дроби: деление и умножение ---- */
  function fdDiv() {
    var b = randInt(2, 12), d = randInt(2, 12), a = randInt(1, 25), c = randInt(1, 15), n = a * d, m = b * c;
    if (b === d || gcd(a, b) !== 1 || gcd(c, d) !== 1 || a / b === c / d || !terminating(n, m)) return null;
    var v = n / m;
    if (!okVal(v, 2) || v < 0.2 || v > 40) return null;
    return { type: 'frac_div', skill: 'frac_div', expr: fr(a, b) + ' : ' + fr(c, d), value: r6(v),
      explain: 'Деление заменяем умножением на перевёрнутую дробь: ' + fr(a, b) + ' · ' + fr(d, c) + ' = ' + fr(n, m) + ' = ' + N(v) + '.' };
  }
  function fdMul() {
    var b = randInt(2, 15), d = randInt(2, 15), a = randInt(1, 30), c = randInt(1, 30), n = a * c, m = b * d;
    if (gcd(a, b) !== 1 || gcd(c, d) !== 1 || a % b === 0 || c % d === 0 || !terminating(n, m)) return null;
    var v = n / m;
    if (!okVal(v, 2) || v < 0.2 || v > 40) return null;
    return { type: 'frac_div', skill: 'frac_div', expr: fr(a, b) + ' · ' + fr(c, d), value: r6(v),
      explain: 'Числитель умножаем на числитель, знаменатель на знаменатель: ' + fr(a + ' · ' + c, b + ' · ' + d) + ' = ' + fr(n, m) + ' = ' + N(v) + '.' };
  }
  function fdInt() {
    var k = randInt(2, 30), c = randInt(1, 15), d = randInt(2, 12);
    if (gcd(c, d) !== 1 || c % d === 0 || k % c === 0 || !terminating(k * d, c)) return null;
    var v = k * d / c;
    if (!okVal(v, 2) || v > 60) return null;
    return { type: 'frac_div', skill: 'frac_div', expr: k + ' : ' + fr(c, d), value: r6(v),
      explain: 'Делим на дробь, значит умножаем на перевёрнутую: ' + k + ' · ' + fr(d, c) + ' = ' + fr(k * d, c) + ' = ' + N(v) + '.' };
  }
  var sp6FracDiv = anyOf([fdDiv, fdDiv, fdMul, fdInt]);

  /* ---- многоэтажные дроби: 1 / (1/m ± 1/n) ---- */
  function stackForm() {
    var minus = Math.random() < 0.35, m = randInt(2, 60), n = randInt(m + 1, 90);
    var top = m * n, bot = minus ? n - m : n + m;
    if (!terminating(top, bot)) return null;
    var v = top / bot;
    if (!okVal(v, 2) || v > 90 || v < 1) return null;
    var Lc = lcm(m, n), x = Lc / m, y = Lc / n, s = minus ? x - y : x + y, sg2 = minus ? ' ' + MINUS + ' ' : ' + ';
    if (Lc > 240) return null;
    return { type: 'frac_stack', skill: 'frac_stack', expr: fr(1, fr(1, m) + sg2 + fr(1, n)), value: r6(v),
      explain: 'Сначала знаменатель, общий знаменатель ' + Lc + ': ' + fr(1, m) + ' = ' + fr(x, Lc) + ', ' + fr(1, n) + ' = ' + fr(y, Lc) + '. ' + (minus ? 'Разность' : 'Сумма') + ': ' + fr(s, Lc) + '. Теперь 1 : ' + fr(s, Lc) + ' = ' + fr(Lc, s) + ' = ' + N(v) + '.' };
  }
  function sp6Stack() { return tryMake(stackForm); }

  function makeSprint6(grade) {
    var slots = [sp6FracSub, sp6DecSub, sp6FracAdd, sp6DecDiv, sp6DecDiv, sp6DecAdd, sp6FracDiv, sp6DecMul, sp6Stack, sp6DecDiv];
    var seen = {};
    return slots.map(function (f) {
      var t, g = 0;
      do { t = f(grade || 5); g++; } while ((seen[t.expr] || seen['v' + t.value]) && g < 50);
      seen[t.expr] = 1; seen['v' + t.value] = 1;
      t.answer = fmt(t.value); t.title = 'Найдите значение выражения';
      return t;
    });
  }
  function checkSprint6(task, text) {
    var v = L.parseAnswer(text || '');
    return !isNaN(v) && Math.abs(v - task.value) < 1e-9;
  }

  /* =============== СПРИНТ, ЗАДАНИЕ 7: 4 варианта ответа, как в экзамене =============== */
  function build(type, skill, q, fig, labels, correctIdx, explain, extra) {
    var t = { type: type, skill: skill, q: q, fig: fig, opts: labels.map(function (l, i) { return { label: l, ok: i === correctIdx }; }), correct: correctIdx, explain: explain, title: 'Выберите правильный вариант' };
    return Object.assign(t, extra || {});
  }
  function frac(x) { return x - Math.floor(x); }
  function ticksInt(lo, hi, labelOnly) {
    var a = [];
    for (var k = lo; k <= hi; k++) a.push({ x: k, label: (!labelOnly || labelOnly.indexOf(k) >= 0) ? sg(k) : '' });
    return a;
  }
  var ITAL = { fill: '#E8812A', ink: '#A8500A' };

  function sp7MatchRoot() {
    var n, k, v;
    do { n = nonSq(10, 300); v = Math.sqrt(n); k = Math.floor(v); } while (frac(v) < 0.12 || frac(v) > 0.9);
    var lo = k - 1, hi = k + 2, xs = [v], guard = 0;
    while (xs.length < 4 && guard++ < 1000) {
      var x = Math.round((lo + 0.3 + Math.random() * (hi - lo - 0.6)) * 20) / 20;
      if (frac(x) > 0.1 && frac(x) < 0.9 && xs.every(function (o) { return Math.abs(o - x) >= 0.4; })) xs.push(x);
    }
    if (xs.length < 4) return sp7MatchRoot();
    var sorted = xs.slice().sort(function (a, b) { return a - b; }), letters = ['A', 'B', 'C', 'D'], ci = sorted.indexOf(v);
    return build('match_root', 't7_point', 'Одна из точек, отмеченных на координатной прямой, соответствует числу ' + rt(n) + '. Какая это точка?',
      { lo: lo, hi: hi, ticks: ticksInt(lo, hi, [k, k + 1, k + 2].filter(function (z) { return z <= hi; })), points: sorted.map(function (x, i) { return { x: x, label: letters[i], fill: ITAL.fill, ink: ITAL.ink }; }) },
      letters.map(function (l) { return 'точка ' + l; }), ci,
      k * k + ' < ' + n + ' < ' + (k + 1) * (k + 1) + ', поэтому ' + k + ' < ' + rt(n) + ' < ' + (k + 1) + '. Число лежит между ' + k + ' и ' + (k + 1) + ' ближе к ' + (frac(v) > 0.5 ? (k + 1) : k) + ': это точка ' + letters[ci] + '.',
      { vals: sorted, v: v });
  }
  function stmtOf(form, t) {
    return form === 0 ? 'a ' + MINUS + ' ' + t + ' > 0' : form === 1 ? t + ' ' + MINUS + ' a < 0' : form === 2 ? t + ' ' + MINUS + ' a > 0' : 'a ' + MINUS + ' ' + t + ' < 0';
  }
  function stmtTruth(form, t, a) { return form === 0 ? a - t > 0 : form === 1 ? t - a < 0 : form === 2 ? t - a > 0 : a - t < 0; }
  function sp7StmtScale() {
    var s0 = randInt(0, 6), k = s0 + randInt(2, 7), a = k + pick([0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8]), pool = [];
    for (var t = s0 + 1; t <= s0 + 9; t++) for (var f = 0; f < 4; f++) pool.push({ t: t, f: f, ok: stmtTruth(f, t, a) });
    var good = pick(pool.filter(function (p) { return p.ok; })), used = [good.t], bad = [];
    shuffle(pool.filter(function (p) { return !p.ok; })).forEach(function (p) { if (bad.length < 3 && used.indexOf(p.t) < 0) { bad.push(p); used.push(p.t); } });
    var all = shuffle([good].concat(bad)), ci = all.indexOf(good);
    return build('stmt_scale', 't7_signs', 'На координатной прямой отмечено число a. Какое из утверждений относительно этого числа является верным?',
      { lo: s0, hi: s0 + 9, ticks: ticksInt(s0, s0 + 9, [s0, s0 + 1]), points: [{ x: a, label: 'a', fill: ITAL.fill, ink: ITAL.ink }] },
      all.map(function (p) { return stmtOf(p.f, p.t); }), ci,
      'Подписаны числа ' + s0 + ' и ' + (s0 + 1) + ', значит одно деление равно 1. Число a лежит между ' + k + ' и ' + (k + 1) + '. ' + (good.t <= k ? 'Оно больше ' + good.t : 'Оно меньше ' + good.t) + ', поэтому верно: ' + stmtOf(good.f, good.t) + '.',
      { a: a, stmts: all });
  }
  function sp7SegRoot() {
    var k = randInt(3, 8), A = k * k, B = (k + 1) * (k + 1), ns = [nonSq(A + 1, B - 1)], g = 0;
    while (ns.length < 3 && g++ < 500) { var n = nonSq(2, A - 1); if (ns.indexOf(n) < 0 && n < A) ns.push(n); }
    var up = nonSq(B + 1, B + 12); ns.push(up);
    if (ns.length < 4) return sp7SegRoot();
    var good = ns[0]; ns.sort(function (a, b) { return a - b; });
    return build('seg_root', 't7_between', 'Какое из данных чисел принадлежит промежутку [' + k + '; ' + (k + 1) + ']?', null,
      ns.map(rt), ns.indexOf(good),
      'Квадраты границ: ' + k + '² = ' + A + ' и ' + (k + 1) + '² = ' + B + '. Подходит то число, у которого подкоренное выражение между ' + A + ' и ' + B + ': это ' + rt(good) + '.',
      { ns: ns, lo: k });
  }
  function sp7OrderPts() {
    for (var tries = 0; tries < 500; tries++) {
      var b = randInt(1, 4), q = pick([7, 9, 11]), p = Math.round((b + 0.3 + Math.random() * 0.5) * q);
      if (gcd(p, q) !== 1) continue;
      var half = pick([[3, 2], [5, 4], [7, 4], [5, 2], [9, 4]]);
      var d1 = Math.round((b + 0.35 + Math.random() * 0.5) * 100), d2 = Math.round((b + 0.35 + Math.random() * 0.5) * 100);
      var items = [{ label: fr(p, q), v: p / q }, { label: fr(half[0], half[1]), v: half[0] / half[1] }, { label: fmt(d1 / 100), v: d1 / 100 }, { label: fmt(d2 / 100), v: d2 / 100 }];
      var vs = items.map(function (i) { return i.v; }), mn = Math.min.apply(null, vs), mx = Math.max.apply(null, vs), ok = mx - mn < 0.6 && mx - mn > 0.2;
      for (var i = 0; i < 4 && ok; i++) for (var j = i + 1; j < 4; j++) if (Math.abs(vs[i] - vs[j]) < 0.035) ok = false;
      if (!ok) continue;
      var sorted = items.slice().sort(function (a, c) { return a.v - c.v; }), letters = ['A', 'B', 'C', 'D'], ask = randInt(0, 3);
      var good = sorted[ask], shown = shuffle(items.slice());
      var lo = mn - 0.12, hi = mx + 0.12;
      return build('order_pts', 't7_compare', 'На координатной прямой точками отмечены числа ' + shown.map(function (i) { return i.label; }).join('; ') + '. Какому числу соответствует точка ' + letters[ask] + '?',
        { lo: lo, hi: hi, ticks: [], points: sorted.map(function (it, i) { return { x: it.v, label: letters[i], fill: '#2F3A6E', ink: '#1F2340' }; }) },
        shown.map(function (i) { return i.label; }), shown.indexOf(good),
        'Сравним числа: ' + sorted.map(function (i) { return i.label + ' ≈ ' + fmt(Math.round(i.v * 1000) / 1000); }).join('; ') + '. По возрастанию они стоят в порядке A, B, C, D, значит точке ' + letters[ask] + ' соответствует ' + good.label + '.',
        { vals: sorted.map(function (i) { return i.v; }), ask: ask, shownVals: shown.map(function (i) { return i.v; }) });
    }
    return sp7OrderPts();
  }
  function sp7BetweenFrac() {
    var q = randInt(7, 19), p, v;
    do { p = randInt(3 * q + 1, 25 * q); v = p / q; } while (gcd(p, q) !== 1 || frac(v) < 0.08);
    var k = Math.floor(v), start = k - randInt(0, 3);
    if (start < 1) start = 1;
    var labels = [0, 1, 2, 3].map(function (i) { return (start + i) + ' и ' + (start + i + 1); });
    return build('between_frac', 't7_between', 'Между какими целыми числами заключено число ' + fr(p, q) + '?', null, labels, k - start,
      q + ' · ' + k + ' = ' + q * k + ' и ' + q + ' · ' + (k + 1) + ' = ' + q * (k + 1) + '. Числитель ' + p + ' между ними, поэтому ' + k + ' < ' + fr(p, q) + ' < ' + (k + 1) + '.',
      { p: p, den: q, k: k, start: start });
  }
  var XY_POOL = [['x²y > 0', function (x, y) { return x * x * y > 0; }], ['x²y < 0', function (x, y) { return x * x * y < 0; }],
    ['xy² > 0', function (x, y) { return x * y * y > 0; }], ['xy² < 0', function (x, y) { return x * y * y < 0; }],
    ['x + y > 0', function (x, y) { return x + y > 0; }], ['x + y < 0', function (x, y) { return x + y < 0; }],
    ['y ' + MINUS + ' x > 0', function (x, y) { return y - x > 0; }], ['y ' + MINUS + ' x < 0', function (x, y) { return y - x < 0; }],
    ['xy > 0', function (x, y) { return x * y > 0; }], ['xy < 0', function (x, y) { return x * y < 0; }]];
  function sp7Xy() {
    var vals = [-4, -3, -2, -1, 1, 2, 3, 4], x, y;
    do { x = pick(vals); y = pick(vals); } while (Math.abs(x) === Math.abs(y));
    var tr = XY_POOL.filter(function (s) { return s[1](x, y); }), fl = XY_POOL.filter(function (s) { return !s[1](x, y); });
    var good = pick(tr), all = shuffle([good].concat(shuffle(fl).slice(0, 3)));
    var why = 'x ' + (x > 0 ? 'положительное' : 'отрицательное') + ', y ' + (y > 0 ? 'положительное' : 'отрицательное') + ', ' + (Math.abs(x) > Math.abs(y) ? 'x дальше от нуля' : 'y дальше от нуля') +
      '. Квадрат числа всегда положителен, поэтому знак x²y как у y, а знак xy² как у x. Верно: ' + good[0] + '.';
    return build('xy', 't7_signs', 'На координатной прямой отмечены числа x и y. Какое из следующих неравенств верно?',
      { lo: -5, hi: 5, ticks: [{ x: 0, label: '0' }], points: [{ x: x, label: 'x', fill: ITAL.fill, ink: ITAL.ink }, { x: y, label: 'y', fill: '#4A6CF7', ink: '#2A47C2' }] },
      all.map(function (s) { return s[0]; }), all.indexOf(good), why, { x: x, y: y });
  }
  function sp7BetweenRoot() {
    var n = nonSq(20, 150), k = Math.floor(Math.sqrt(n)), c = Math.floor(n / 3), h = Math.floor(k / 2);
    var pairs = [[k, k + 1], [n - 1, n + 1], [c, c + 2], [h, h + 1]], key = {}, ok = true;
    pairs.forEach(function (p) { var s = p.join(); if (key[s]) ok = false; key[s] = 1; });
    if (!ok || h < 1) return sp7BetweenRoot();
    var all = shuffle(pairs.slice());
    return build('between_root', 't7_between', 'Между какими числами заключено число ' + rt(n) + '?', null,
      all.map(function (p) { return p[0] + ' и ' + p[1]; }), all.indexOf(pairs[0]),
      k * k + ' < ' + n + ' < ' + (k + 1) * (k + 1) + ', поэтому ' + k + ' < ' + rt(n) + ' < ' + (k + 1) + '.', { n: n, k: k });
  }
  function sp7RootOnLine() {
    for (var tries = 0; tries < 1000; tries++) {
      var set = [], g = 0, b0 = randInt(2, 8);
      while (set.length < 4 && g++ < 200) { var n = nonSq(b0 * b0 + 1, (b0 + 2) * (b0 + 2) - 1); if (set.indexOf(n) < 0) set.push(n); }
      set.sort(function (a, b) { return a - b; });
      var ok = set.length === 4;
      for (var i = 1; ok && i < 4; i++) if (Math.sqrt(set[i]) - Math.sqrt(set[i - 1]) < 0.3) ok = false;
      if (!ok) continue;
      var ci = randInt(0, 3), v = Math.sqrt(set[ci]);
      return build('root_on_line', 't7_roots', 'Одно из чисел ' + set.map(rt).join(', ') + ' отмечено на прямой точкой A. Какое это число?',
        { lo: b0, hi: b0 + 2, ticks: ticksInt(b0, b0 + 2), points: [{ x: v, label: 'A', fill: ITAL.fill, ink: ITAL.ink }] },
        set.map(rt), ci, 'Оценим корни: ' + set.map(function (n) { return rt(n) + ' ≈ ' + fmt(Math.round(Math.sqrt(n) * 100) / 100); }).join('; ') + '. Точка A стоит примерно в ' + fmt(Math.round(v * 100) / 100) + ': это ' + rt(set[ci]) + '.',
        { set: set, ci: ci });
    }
    return sp7RootOnLine();
  }
  function sp7SegFrac() {
    var k = randInt(3, 7), q = randInt(13, 19), A = k * q, B = (k + 1) * q;
    var good = randInt(A + 1, B - 1), below = randInt(Math.max(q, A - 2 * q), A - 1), a1 = randInt(B + 1, B + q - 1), a2 = randInt(B + 1, B + q);
    var ns = [good, below, a1, a2];
    if (new Set(ns).size < 4 || ns.some(function (p) { return gcd(p, q) !== 1; })) return sp7SegFrac();
    ns.sort(function (a, b) { return a - b; });
    return build('seg_frac', 't7_between', 'Какое из данных ниже чисел принадлежит отрезку [' + k + '; ' + (k + 1) + ']?', null,
      ns.map(function (p) { return fr(p, q); }), ns.indexOf(good),
      'Запишем границы со знаменателем ' + q + ': ' + k + ' = ' + fr(A, q) + ', ' + (k + 1) + ' = ' + fr(B, q) + '. Подходит дробь с числителем между ' + A + ' и ' + B + ': ' + fr(good, q) + '.',
      { ns: ns, den: q, k: k });
  }
  function makeSprint7() {
    return [sp7MatchRoot, sp7StmtScale, sp7SegRoot, sp7OrderPts, sp7BetweenFrac, sp7StmtScale, sp7Xy, sp7BetweenRoot, sp7RootOnLine, sp7SegFrac].map(function (f) { return f(); });
  }

  return Object.assign(L, { SPRINT_SECONDS: SPRINT_SECONDS, makeSprint6: makeSprint6, checkSprint6: checkSprint6, makeSprint7: makeSprint7 });
});
