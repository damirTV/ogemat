/* Задания 9, 11, 12 (7 класс): линейные уравнения, графики функций, расчёты по формулам. Без DOM. Нужен logic.js.
   Разметка формул: {числитель|знаменатель} — дробь, ^2 — степень, ‹C› — нижний индекс (рисует OGE.mathX в modes8.js).
   Задача: { kind, skill, text, steps: [{q, ans, aid, traps}], answer: 'строка', explain } */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { require('./logic.js'); module.exports = factory(require('./logic.js')); }
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, round = U.round;
  var MINUS = '−';
  function f(n) { return L.fmt(n); }
  function nz(a, b) { var x; do { x = randInt(a, b); } while (x === 0); return x; }
  function fin(x) { return isFinite(x) && Math.abs(x * 100 - Math.round(x * 100)) < 1e-7; }
  function retry(fn) { return function () { for (var i = 0; i < 5000; i++) { var r = fn.apply(null, arguments); if (r) return r; } throw new Error('Не удалось составить задачу'); }; }
  function cleanTraps(steps) {
    steps.forEach(function (st) { st.traps = (st.traps || []).filter(function (t, i, all) { return isFinite(t.val) && Math.abs(t.val - st.ans) > 1e-9 && all.findIndex(function (u) { return Math.abs(u.val - t.val) < 1e-9; }) === i; }); });
    return steps;
  }
  function sg(n) { return n < 0 ? -1 : 1; }
  function ab(n) { return Math.abs(n); }

  /* ======================= ЗАДАНИЕ 9: ЛИНЕЙНЫЕ УРАВНЕНИЯ ======================= */
  var SKILLS9 = { q9_open: 'Раскрытие скобок (знак и множитель перед скобкой)', q9_move: 'Перенос слагаемых через знак «=»', q9_div: 'Деление на коэффициент при x' };
  /* выражение — список кусков {s: ±1, t: 'x' | 'c' | 'br', a | c | k, inner} */
  function lin(parts) {
    var A = 0, B = 0;
    parts.forEach(function (p) {
      if (p.t === 'x') A += p.s * p.a;
      else if (p.t === 'c') B += p.s * p.c;
      else { var r = lin(p.inner); A += p.s * p.k * r[0]; B += p.s * p.k * r[1]; }
    });
    return [A, B];
  }
  function show(parts) {
    var out = '';
    parts.forEach(function (p, i) {
      var sign = p.s < 0 ? (i ? ' ' + MINUS + ' ' : MINUS) : (i ? ' + ' : ''), body;
      if (p.t === 'x') body = (p.a === 1 ? '' : f(p.a)) + 'x';
      else if (p.t === 'c') body = f(p.c);
      else body = (p.k === 1 ? '' : f(p.k)) + '(' + show(p.inner) + ')';
      out += sign + body;
    });
    return out;
  }
  function X(s, a) { return { s: s, t: 'x', a: a }; }
  function C(s, c) { return { s: s, t: 'c', c: c }; }
  function BR(s, k, inner) { return { s: s, t: 'br', k: k, inner: inner }; }
  function showLin(A, B) {
    var s = '';
    if (A) s = (A === 1 ? '' : A === -1 ? MINUS : f(A)) + 'x';
    if (B || !A) s += s ? (B < 0 ? ' ' + MINUS + ' ' : ' + ') + f(ab(B)) : f(B);
    return s;
  }
  /* шаблоны как в банке ОГЭ; последний свободный член справа подбирается под корень */
  var EQ9 = [
    function () { var a1 = nz(-6, 9), a2 = nz(-6, 9); return [[X(sg(a1), ab(a1)), C(pick([1, -1]), randInt(1, 15))], [X(sg(a2), ab(a2)), C(1, 0)]]; },
    function () { return [[X(1, randInt(2, 15)), C(-1, randInt(2, 20))], [C(1, 0), X(1, randInt(1, 14))]]; },
    function () { return [[BR(1, randInt(2, 5), [X(1, 1), C(pick([1, -1]), randInt(1, 6))])], [X(1, 1), C(1, 0)]]; },
    function () { return [[C(1, randInt(1, 9)), BR(-1, randInt(2, 4), [X(1, randInt(1, 3)), C(1, randInt(1, 5))])], [C(1, 0), X(-1, randInt(1, 5))]]; },
    function () { return [[C(-1, randInt(1, 9)), X(1, randInt(1, 5))], [X(-1, randInt(1, 5)), C(-1, 0)]]; },
    function () { return [[BR(1, randInt(2, 4), [X(1, 1), C(1, randInt(1, 5))]), BR(-1, randInt(2, 3), [X(1, 1), C(-1, randInt(1, 5))])], [C(1, 0)]]; },
    function () { return [[X(1, randInt(2, 4)), C(1, randInt(1, 6)), BR(1, 1, [X(1, 1), C(1, randInt(1, 6))])], [BR(1, 1, [C(1, randInt(1, 5)), X(-1, 1)]), C(1, 0)]]; },
    function () { return [[X(-1, 1), C(-1, randInt(1, 5)), BR(1, randInt(2, 4), [X(1, 1), C(-1, randInt(1, 5))])], [BR(1, randInt(2, 4), [C(1, randInt(1, 6)), X(-1, 1)]), C(-1, 0)]]; }
  ];
  function make9raw() {
    var tpl = pick(EQ9)(), Lp = tpl[0], Rp = tpl[1];
    var x0 = Math.random() < 0.8 ? nz(-9, 9) : pick([0.5, -0.5, 1.5, -1.5, 2.5, 0.25, -0.25]);
    var l = lin(Lp), r = lin(Rp);
    if (l[0] === r[0]) return null;
    var lastC = null;
    for (var i = Rp.length - 1; i >= 0; i--) if (Rp[i].t === 'c') { lastC = Rp[i]; break; }
    if (!lastC) return null;
    var cur = lastC.s * lastC.c + (l[0] * x0 + l[1]) - (r[0] * x0 + r[1]);
    if (Math.abs(cur - Math.round(cur)) > 1e-9 || Math.abs(cur) > 40) return null;
    cur = Math.round(cur);
    lastC.s = cur < 0 ? -1 : 1; lastC.c = Math.abs(cur);
    if (!lastC.c) Rp.splice(Rp.indexOf(lastC), 1);
    if (!Rp.length) Rp.push(C(1, 0));
    if (Rp[0].t === 'c' && Rp[0].c === 0 && Rp.length > 1) Rp.shift();
    l = lin(Lp); r = lin(Rp);
    var A = l[0] - r[0], Bv = r[1] - l[1];
    if (!A || Math.abs(Bv / A - x0) > 1e-9) return null;
    var hasBr = Lp.concat(Rp).some(function (p) { return p.t === 'br' && (p.k !== 1 || p.s < 0); });
    var text = show(Lp) + ' = ' + show(Rp);
    if (text.length > 42) return null;
    return { Lp: Lp, Rp: Rp, l: l, r: r, A: A, B: Bv, x: x0, hasBr: hasBr, text: text };
  }
  /* типичная ошибка при раскрытии скобок: минус перед скобкой не поменял знак числа или множитель не применён к числу */
  function wrongOpen(parts) {
    var B = 0;
    parts.forEach(function (p) {
      if (p.t === 'c') B += p.s * p.c;
      else if (p.t === 'br') { var r = lin(p.inner); B += p.s < 0 ? p.k * r[1] : r[1]; }
    });
    return B;
  }
  function brSide(e) { return e.Lp.some(function (p) { return p.t === 'br' && (p.k !== 1 || p.s < 0); }) ? 'L' : 'R'; }
  function make9() {
    var e = retry(make9raw)(), steps = [], l = e.l, r = e.r;
    var expanded = showLin(l[0], l[1]) + ' = ' + showLin(r[0], r[1]);
    if (e.hasBr) {
      var lb = brSide(e) === 'L', side = lb ? e.Lp : e.Rp, val = lb ? l : r;
      steps.push({ q: 'Раскрой скобки и приведи подобные в ' + (lb ? 'левой' : 'правой') + ' части. Какое число получится без x (свободный член)?', ans: val[1], skill: 'q9_open',
        aid: (lb ? 'Левая' : 'Правая') + ' часть после раскрытия скобок: ' + showLin(val[0], val[1]) + '. Множитель перед скобкой умножают на каждое слагаемое в скобке, а минус перед скобкой меняет их знаки.',
        traps: [{ val: wrongOpen(side), msg: 'Множитель перед скобкой (вместе с его знаком) умножают на каждое слагаемое в скобке, в том числе на число.' }] });
    }
    steps.push({ q: 'Уравнение после упрощения: ' + expanded + '. Перенеси слагаемые с x влево. Какой коэффициент при x получится?', ans: e.A, skill: 'q9_move',
      aid: 'При переносе через «=» знак меняется: ' + f(l[0]) + ' ' + MINUS + ' (' + f(r[0]) + ') = ' + f(e.A) + '.',
      traps: [{ val: l[0] + r[0], msg: 'При переносе через знак «=» слагаемое меняет знак.' }] });
    steps.push({ q: 'Перенеси числа вправо. Какое число получится справа?', ans: e.B, skill: 'q9_move',
      aid: f(r[1]) + ' ' + MINUS + ' (' + f(l[1]) + ') = ' + f(e.B) + '. Получаем ' + showLin(e.A, 0) + ' = ' + f(e.B) + '.',
      traps: [{ val: r[1] + l[1], msg: 'Число переходит в другую часть с противоположным знаком.' }, { val: l[1] - r[1], msg: 'Знак перепутан: справа должно получиться ' + f(r[1]) + ' ' + MINUS + ' (' + f(l[1]) + ').' }] });
    steps.push({ q: 'Найди x.', ans: e.x, skill: 'q9_div',
      aid: showLin(e.A, 0) + ' = ' + f(e.B) + ', x = ' + f(e.B) + ' : ' + (e.A < 0 ? '(' + f(e.A) + ')' : f(e.A)) + ' = ' + f(e.x) + '.',
      traps: [{ val: e.B && fin(e.A / e.B) ? e.A / e.B : NaN, msg: 'Делили наоборот: число справа делят на коэффициент при x.' }, { val: -e.x, msg: 'Знак потерян: проверь, на какое число с каким знаком делишь.' }, { val: e.B - e.A, msg: 'Коэффициент при x не вычитают, а на него делят.' }] });
    var skill = e.hasBr ? 'q9_open' : 'q9_move';
    return { kind: 'eq', skill: skill, text: e.text, ask: 'Решите уравнение', steps: cleanTraps(steps), answer: String(e.x), eq: e,
      explain: e.text + ' → ' + expanded + ' → ' + showLin(e.A, 0) + ' = ' + f(e.B) + ' → x = ' + f(e.x) + '.' };
  }
  /* «Сапёр»: решение по строкам, в одной строке ошибка; дальше решение честно продолжает её */
  function make9saper() {
    for (var tries = 0; tries < 500; tries++) {
      var e = retry(make9raw)(), l = e.l, r = e.r;
      var kinds = ['move', 'num', 'div', 'sign'];
      if (e.hasBr) kinds.push('open', 'open');
      var kind = pick(kinds), lines = [e.text], why;
      var l2 = l.slice(), r2 = r.slice();
      if (kind === 'open') {
        var lb = brSide(e) === 'L', w = wrongOpen(lb ? e.Lp : e.Rp);
        if (w === (lb ? l[1] : r[1])) continue;
        if (lb) l2[1] = w; else r2[1] = w;
        why = 'Ошибка при раскрытии скобок: множитель перед скобкой (вместе со знаком) умножают на каждое слагаемое в скобке.';
      }
      lines.push(showLin(l2[0], l2[1]) + ' = ' + showLin(r2[0], r2[1]));
      var A = l2[0] - r2[0], B = r2[1] - l2[1];
      if (kind === 'move') { A = l2[0] + r2[0]; why = 'При переносе слагаемого с x через «=» не поменяли его знак.'; }
      if (kind === 'num') { B = r2[1] + l2[1]; why = 'При переносе числа через «=» не поменяли его знак.'; }
      if (!A || (kind === 'move' && A === l2[0] - r2[0]) || (kind === 'num' && B === r2[1] - l2[1])) continue;
      lines.push(showLin(A, 0) + ' = ' + f(B));
      var x = B / A;
      if (kind === 'div') { if (!B || !fin(A / B) || Math.abs(A / B - x) < 1e-9) continue; x = A / B; why = 'Делили наоборот: нужно число справа разделить на коэффициент при x.'; }
      if (kind === 'sign') { if (!x) continue; x = -x; why = 'Потерян знак при делении на ' + f(A) + '.'; }
      if (!fin(x) || Math.abs(x) > 60) continue;
      lines.push('x = ' + f(x));
      var errAt = kind === 'open' ? 1 : kind === 'move' || kind === 'num' ? 2 : 3;
      return { kind: 'saper', skill: kind === 'open' ? 'q9_open' : kind === 'div' || kind === 'sign' ? 'q9_div' : 'q9_move', text: e.text, lines: lines, err: errAt, why: why, answer: String(errAt + 1),
        explain: why + ' Верно: ' + e.text + ' → ' + showLin(e.l[0], e.l[1]) + ' = ' + showLin(e.r[0], e.r[1]) + ' → ' + showLin(e.A, 0) + ' = ' + f(e.B) + ' → x = ' + f(e.x) + '.' };
    }
    throw new Error('Сапёр 9: не удалось составить решение');
  }

  /* ======================= ЗАДАНИЕ 11: ГРАФИКИ ФУНКЦИЙ ======================= */
  var SKILLS11 = { q11_line: 'Прямая y = kx + b: знаки и значения k и b', q11_parab: 'Парабола: ветви, вершина, точка на оси y', q11_hyp: 'Гипербола y = k/x: четверти и удалённость ветвей', q11_mix: 'Различать прямую, параболу и гиперболу' };
  function fracTxt(k) {
    var a = ab(k), s = k < 0 ? MINUS : '';
    if (Math.abs(a - 0.5) < 1e-9) return s + '{1|2}';
    if (Math.abs(a - 1 / 3) < 1e-9) return s + '{1|3}';
    return s + (a === 1 ? '' : f(a));
  }
  function fmlLine(k, b) {
    var s = 'y = ';
    if (k) s += fracTxt(k) + 'x';
    if (b || !k) s += k ? (b < 0 ? ' ' + MINUS + ' ' : ' + ') + f(ab(b)) : f(b);
    return s;
  }
  function fmlHyp(k) {
    var a = ab(k), s = k < 0 ? MINUS : '';
    if (a >= 1) return 'y = ' + s + '{' + f(a) + '|x}';
    return 'y = ' + s + '{1|' + Math.round(1 / a) + 'x}';
  }
  function fmlPar(a, b, c) {
    var s = 'y = ' + (a === 1 ? '' : a === -1 ? MINUS : f(a)) + 'x^2';
    if (b) s += (b < 0 ? ' ' + MINUS + ' ' : ' + ') + (ab(b) === 1 ? '' : f(ab(b))) + 'x';
    if (c) s += (c < 0 ? ' ' + MINUS + ' ' : ' + ') + f(ab(c));
    return s;
  }
  function fml(g) { return g.type === 'line' ? fmlLine(g.k, g.b) : g.type === 'hyp' ? fmlHyp(g.k) : fmlPar(g.a, g.b, g.c); }
  var TYPE_ACC = { line: 'прямую', parab: 'параболу', hyp: 'гиперболу' }, TYPE_NOM = { line: 'прямая', parab: 'парабола', hyp: 'гипербола' };
  function quarters(k) { return k > 0 ? 'I и III' : 'II и IV'; }
  /* чем график g (подпись n) отличается от формулы h (подпись fn) */
  function diffMsg(n, g, h, fn) {
    var F = fn ? 'формула ' + fn : 'формула', Fg = fn ? 'формуле ' + fn : 'формуле', Fu = fn ? 'у формулы ' + fn : 'у формулы';
    if (g.type !== h.type) return 'График ' + n + ' — ' + TYPE_NOM[g.type] + ', а ' + F + ' задаёт ' + TYPE_ACC[h.type] + '.';
    if (g.type === 'hyp') {
      if (sg(g.k) !== sg(h.k)) return 'Ветви графика ' + n + ' в ' + quarters(g.k) + ' четвертях, значит k ' + (g.k > 0 ? '> 0' : '< 0') + '. А в ' + Fg + ' k ' + (h.k > 0 ? '> 0' : '< 0') + '.';
      return 'Проверь точку x = 1: на графике ' + n + ' y = ' + f(g.k) + ', а по ' + Fg + ' y = ' + f(h.k) + '.';
    }
    if (g.type === 'line') {
      if (sg(g.k) !== sg(h.k) || !g.k !== !h.k) return 'График ' + n + ' ' + (g.k > 0 ? 'возрастает (k > 0)' : g.k < 0 ? 'убывает (k < 0)' : 'горизонтален (k = 0)') + ', а ' + Fu + ' k ' + (h.k > 0 ? '> 0' : h.k < 0 ? '< 0' : '= 0') + '.';
      if (g.b !== h.b) return 'График ' + n + ' пересекает ось y в точке ' + f(g.b) + ', а по ' + Fg + ' b = ' + f(h.b) + '.';
      return 'Наклон другой: на графике ' + n + ' при шаге на 1 вправо y меняется на ' + f(g.k) + ', а по ' + Fg + ' — на ' + f(h.k) + '.';
    }
    if (sg(g.a) !== sg(h.a)) return 'Ветви графика ' + n + ' направлены ' + (g.a > 0 ? 'вверх (a > 0)' : 'вниз (a < 0)') + ', а ' + Fu + ' a ' + (h.a > 0 ? '> 0' : '< 0') + '.';
    if (g.c !== h.c) return 'График ' + n + ' пересекает ось y в точке ' + f(g.c) + ', а по ' + Fg + ' c = ' + f(h.c) + '.';
    return 'Вершина графика ' + n + ' при x = ' + f(-g.b / (2 * g.a)) + ', а по ' + Fg + ' x = ' + MINUS + 'b : (2a) = ' + f(-h.b / (2 * h.a)) + '.';
  }
  function featureAid(h) {
    if (h.type === 'hyp') return 'Гипербола: k ' + (h.k > 0 ? '> 0 — ветви в I и III четвертях' : '< 0 — ветви во II и IV четвертях') + '. При x = 1 y = ' + f(h.k) + ': так видно, далеко ли ветви от осей.';
    if (h.type === 'line') return 'Прямая: k ' + (h.k > 0 ? '> 0 — возрастает' : h.k < 0 ? '< 0 — убывает' : '= 0 — горизонтальна') + ', пересекает ось y в точке b = ' + f(h.b) + '.';
    return 'Парабола: a ' + (h.a > 0 ? '> 0 — ветви вверх' : '< 0 — ветви вниз') + ', пересекает ось y в точке c = ' + f(h.c) + ', вершина при x = ' + MINUS + 'b : (2a) = ' + f(-h.b / (2 * h.a)) + '.';
  }
  function same(g, h) { return g.type === h.type && g.k === h.k && g.b === h.b && g.a === h.a && g.c === h.c; }
  var FAM11 = [
    { skill: 'q11_hyp', make: function () {
      var ks = shuffle([-6, -4, -3, -2, -1, -0.5, 0.5, 1, 2, 3, 4, 6]).slice(0, 3);
      for (var i = 0; i < 3; i++) for (var j = i + 1; j < 3; j++) if (sg(ks[i]) === sg(ks[j]) && Math.max(ab(ks[i]), ab(ks[j])) / Math.min(ab(ks[i]), ab(ks[j])) < 2) return null;
      return ks.map(function (k) { return { type: 'hyp', k: k }; });
    } },
    { skill: 'q11_line', make: function () {
      var c = nz(-3, 3);
      return [{ type: 'line', k: 0, b: c }, { type: 'line', k: pick([1, -1]), b: c }, { type: 'line', k: pick([2, -2, 1, -1]), b: 0 }];
    } },
    { skill: 'q11_line', make: function () {
      var k = pick([0.5, 2]), b = pick([1, 2, 3]);
      return shuffle([[k, b], [k, -b], [-k, b], [-k, -b]]).slice(0, 3).map(function (p) { return { type: 'line', k: p[0], b: p[1] }; });
    } },
    { skill: 'q11_parab', make: function () {
      var c = randInt(2, 4), b = 2;
      return shuffle([[-1, b, c], [1, -b, -c], [-1, -b, c], [1, b, -c], [-1, b, -c]]).slice(0, 3).map(function (p) { return { type: 'parab', a: p[0], b: p[1], c: p[2] }; });
    } },
    { skill: 'q11_mix', make: function () {
      return [{ type: 'line', k: pick([2, -2, 0.5, -0.5, 1]), b: nz(-3, 3) }, { type: 'parab', a: pick([1, -1]), b: pick([0, 2, -2]), c: nz(-3, 3) }, { type: 'hyp', k: pick([-6, -4, -2, 2, 4, 6]) }];
    } }
  ];
  /* знаки коэффициентов: графики (буквы) → варианты (цифры) */
  var SIGN11 = [
    { skill: 'q11_parab', make: function () {
      var keys = shuffle([[1, -1], [1, 1], [-1, 1], [-1, -1]]).slice(0, 3);
      return { keys: keys, opts: keys.map(function (o) { return 'a ' + (o[0] > 0 ? '> 0' : '< 0') + ', c ' + (o[1] > 0 ? '> 0' : '< 0'); }),
        graphs: keys.map(function (o) { return { type: 'parab', a: o[0], b: pick([-2, 0, 2]), c: o[1] * randInt(1, 3) }; }),
        why: function (o, w) { return o[0] !== w[0] ? 'Ветви направлены ' + (o[0] > 0 ? 'вверх, значит a > 0' : 'вниз, значит a < 0') + '.' : 'Парабола пересекает ось y ' + (o[1] > 0 ? 'выше нуля, значит c > 0' : 'ниже нуля, значит c < 0') + '.'; },
        aid: function (o) { return 'Ветви ' + (o[0] > 0 ? 'вверх → a > 0' : 'вниз → a < 0') + '; пересечение с осью y (при x = 0 y = c) ' + (o[1] > 0 ? 'выше нуля → c > 0' : 'ниже нуля → c < 0') + '.'; },
        intro: 'На рисунках изображены графики функций вида y = ax^2 + bx + c. Установите соответствие между графиками функций и знаками коэффициентов a и c.' };
    } },
    { skill: 'q11_line', make: function () {
      var keys = shuffle([[1, 1], [-1, 1], [1, -1], [-1, -1]]).slice(0, 3);
      return { keys: keys, opts: keys.map(function (o) { return 'k ' + (o[0] > 0 ? '> 0' : '< 0') + ', b ' + (o[1] > 0 ? '> 0' : '< 0'); }),
        graphs: keys.map(function (o) { return { type: 'line', k: o[0] * pick([0.5, 1, 2]), b: o[1] * randInt(1, 3) }; }),
        why: function (o, w) { return o[0] !== w[0] ? 'Прямая ' + (o[0] > 0 ? 'возрастает, значит k > 0' : 'убывает, значит k < 0') + '.' : 'Прямая пересекает ось y ' + (o[1] > 0 ? 'выше нуля, значит b > 0' : 'ниже нуля, значит b < 0') + '.'; },
        aid: function (o) { return 'Прямая ' + (o[0] > 0 ? 'возрастает → k > 0' : 'убывает → k < 0') + '; пересекает ось y ' + (o[1] > 0 ? 'выше нуля → b > 0' : 'ниже нуля → b < 0') + '.'; },
        intro: 'На рисунках изображены графики функций вида y = kx + b. Установите соответствие между графиками функций и знаками коэффициентов k и b.' };
    } }
  ];
  var LET = ['А', 'Б', 'В'];
  function make11() {
    if (Math.random() < 0.3) {
      var sf = pick(SIGN11), sd = sf.make(), perm = shuffle([0, 1, 2]);
      var graphs = perm.map(function (i) { return sd.graphs[i]; }), ans = perm.map(function (i) { return i + 1; });
      var steps = perm.map(function (i, li) {
        return { q: 'График ' + LET[li] + ': какой вариант знаков (номер) ему подходит?', ans: i + 1, aid: sd.aid(sd.keys[i]), hl: li,
          traps: [0, 1, 2].filter(function (j) { return j !== i; }).map(function (j) { return { val: j + 1, msg: sd.why(sd.keys[i], sd.keys[j]) }; }) };
      });
      return { kind: 'match', skill: sf.skill, text: sd.intro, opts: sd.opts, oLabels: ['1', '2', '3'], graphs: graphs, gLabels: LET, mode: 'signs', steps: cleanTraps(steps), answer: ans.join(''),
        explain: steps.map(function (s, li) { return LET[li] + ' — ' + s.ans + '. ' + s.aid; }).join(' ') };
    }
    var fam, set = null;
    while (!set) { fam = pick(FAM11); set = fam.make(); }
    set = shuffle(set);
    var grs = shuffle(set.slice()), fms = set, ans2, steps2;
    if (Math.random() < 0.6) {
      /* формулы А, Б, В — графики 1, 2, 3 */
      ans2 = fms.map(function (h) { for (var j = 0; j < 3; j++) if (same(grs[j], h)) return j + 1; });
      steps2 = fms.map(function (h, li) {
        return { q: 'Формула ' + LET[li] + ': ' + fml(h) + '. Какой номер у её графика?', ans: ans2[li], aid: featureAid(h), hl: -1,
          traps: [0, 1, 2].filter(function (j) { return j + 1 !== ans2[li]; }).map(function (j) { return { val: j + 1, msg: diffMsg(j + 1, grs[j], h) }; }) };
      });
      return { kind: 'match', skill: fam.skill, text: 'Установите соответствие между функциями и их графиками.', opts: fms.map(fml), oLabels: LET, graphs: grs, gLabels: ['1', '2', '3'], mode: 'f2g', steps: cleanTraps(steps2), answer: ans2.join(''),
        explain: fms.map(function (h, li) { return LET[li] + ' — ' + ans2[li] + '. ' + featureAid(h); }).join(' ') };
    }
    /* графики А, Б, В — формулы 1, 2, 3 */
    ans2 = grs.map(function (g) { for (var j = 0; j < 3; j++) if (same(fms[j], g)) return j + 1; });
    steps2 = grs.map(function (g, li) {
      return { q: 'График ' + LET[li] + ': какая формула (номер) его задаёт?', ans: ans2[li], aid: featureAid(g), hl: li,
        traps: [0, 1, 2].filter(function (j) { return j + 1 !== ans2[li]; }).map(function (j) { return { val: j + 1, msg: diffMsg(LET[li], g, fms[j], j + 1) }; }) };
    });
    return { kind: 'match', skill: fam.skill, text: 'Установите соответствие между графиками функций и формулами, которые их задают.', opts: fms.map(fml), oLabels: ['1', '2', '3'], graphs: grs, gLabels: LET, mode: 'g2f', steps: cleanTraps(steps2), answer: ans2.join(''),
      explain: grs.map(function (g, li) { return LET[li] + ' — ' + ans2[li] + '. ' + featureAid(g); }).join(' ') };
  }
  function evalG(g, x) {
    if (g.type === 'line') return g.k * x + g.b;
    if (g.type === 'hyp') return Math.abs(x) < 1e-9 ? NaN : g.k / x;
    return g.a * x * x + g.b * x + g.c;
  }

  /* ======================= ЗАДАНИЕ 12: РАСЧЁТЫ ПО ФОРМУЛАМ ======================= */
  var SKILLS12 = { q12_direct: 'Подстановка чисел в формулу и порядок действий', q12_inverse: 'Нахождение неизвестной величины из формулы', q12_units: 'Формулы с дробями и скобками' };
  var F12 = [
    function () {
      var m = nz(-5, 15), tF = 32 + 9 * m, tC = 5 * m;
      return { skill: 'q12_units',
        text: 'Перевести значение температуры по шкале Фаренгейта в шкалу Цельсия позволяет формула t‹C› = {5|9}(t‹F› ' + MINUS + ' 32), где t‹C› — температура в градусах Цельсия, t‹F› — температура в градусах Фаренгейта. Скольким градусам по шкале Цельсия соответствует ' + f(tF) + ' градусов по шкале Фаренгейта?',
        steps: [{ q: 'Сначала скобка: t‹F› ' + MINUS + ' 32 = ?', ans: tF - 32, aid: f(tF) + ' ' + MINUS + ' 32 = ' + f(tF - 32) + '.', traps: [{ val: tF + 32, msg: 'В скобке вычитание, а не сложение.' }] },
          { q: 'Умножь на {5|9}: t‹C› = ?', ans: tC, aid: f(tF - 32) + ' : 9 · 5 = ' + f(tC) + '.', traps: [{ val: (tF - 32) * 9 / 5, msg: 'Множитель {5|9}: делим на 9 и умножаем на 5, а не наоборот.' }, { val: round(5 / 9 * tF - 32, 2), msg: 'Сначала вычисляют скобку, потом умножают.' }] }],
        answer: tC };
    },
    function () {
      var tC = pick([-30, -25, -20, -15, -10, -5, 5, 10, 15, 20, 25, 30, 35, 40]), tF = round(1.8 * tC + 32, 2);
      return { skill: 'q12_direct',
        text: 'Чтобы перевести значение температуры по шкале Цельсия в шкалу Фаренгейта, пользуются формулой t‹F› = 1,8t‹C› + 32, где t‹C› — градусы Цельсия, t‹F› — градусы Фаренгейта. Какая температура по шкале Фаренгейта соответствует ' + f(tC) + '° по шкале Цельсия?',
        steps: [{ q: 'Сначала умножение: 1,8 · ' + (tC < 0 ? '(' + f(tC) + ')' : f(tC)) + ' = ?', ans: round(1.8 * tC, 2), aid: '1,8 · ' + f(tC) + ' = ' + f(round(1.8 * tC, 2)) + '.', traps: [] },
          { q: 'Прибавь 32: t‹F› = ?', ans: tF, aid: f(round(1.8 * tC, 2)) + ' + 32 = ' + f(tF) + '.', traps: [{ val: round(1.8 * (tC + 32), 2), msg: 'Сначала умножение, потом сложение.' }] }],
        answer: tF };
    },
    function () {
      var a = randInt(8, 16) * 500, b = randInt(30, 52) * 100, n = randInt(5, 14), Cc = a + b * n;
      return { skill: 'q12_direct',
        text: 'В фирме ' + pick(['«Родник»', '«Колодезь»', '«Чистая вода»']) + ' стоимость (в рублях) колодца из железобетонных колец рассчитывается по формуле C = ' + a + ' + ' + b + ' · n, где n — число колец, установленных при рытье колодца. Пользуясь этой формулой, рассчитайте стоимость колодца из ' + n + ' колец. Ответ дайте в рублях.',
        steps: [{ q: 'Сначала умножение: ' + b + ' · ' + n + ' = ?', ans: b * n, aid: b + ' · ' + n + ' = ' + b * n + '.', traps: [] },
          { q: 'Найдите C.', ans: Cc, aid: a + ' + ' + b * n + ' = ' + Cc + '.', traps: [{ val: (a + b) * n, msg: 'Умножение выполняется раньше сложения: на n умножают только ' + b + '.' }] }],
        answer: Cc };
    },
    function () {
      var I = pick([1.5, 2, 2.5, 3, 3.5, 4, 5, 6]), R = pick([2, 3, 4, 5, 6, 8, 10, 12, 13, 15]), P = round(I * I * R, 4);
      return { skill: 'q12_inverse',
        text: 'Мощность постоянного тока (в ваттах) вычисляется по формуле P = I^2R, где I — сила тока (в амперах), R — сопротивление (в омах). Пользуясь этой формулой, найдите сопротивление R (в омах), если мощность составляет ' + f(P) + ' Вт, а сила тока равна ' + f(I) + ' А.',
        steps: [{ q: 'Чему равно I^2?', ans: round(I * I, 4), aid: f(I) + '^2 = ' + f(round(I * I, 4)) + '.', traps: [{ val: 2 * I, msg: 'Квадрат — это умножение числа на себя, а не на 2.' }] },
          { q: 'Найдите R = P : I^2.', ans: R, aid: f(P) + ' : ' + f(round(I * I, 4)) + ' = ' + f(R) + '.', traps: [{ val: fin(P / I) ? round(P / I, 4) : NaN, msg: 'Делить нужно на I^2, а не на I.' }, { val: round(P * I * I, 4), msg: 'Чтобы найти R, P делят на I^2, а не умножают.' }] }],
        answer: R };
    },
    function () {
      var m = pick([800, 1000, 1200, 1500, 1600, 2000, 2400, 2800]), v = randInt(5, 30), E = m * v * v / 2;
      if (E % 100) return null;
      return { skill: 'q12_inverse',
        text: 'Кинетическая энергия тела массой m кг, движущегося со скоростью v м/с, вычисляется по формуле E = {mv^2|2} и измеряется в джоулях. Известно, что автомобиль массой ' + m + ' кг обладает кинетической энергией ' + f(E / 1000) + ' тысяч джоулей. Найдите скорость этого автомобиля в метрах в секунду.',
        steps: [{ q: 'Переведи энергию в джоули: E = ?', ans: E, aid: f(E / 1000) + ' тысяч = ' + E + ' Дж.', traps: [{ val: E / 1000, msg: 'Энергия дана в тысячах джоулей: умножь на 1000.' }] },
          { q: 'Из формулы v^2 = {2E|m}. Чему равно v^2?', ans: v * v, aid: '2 · ' + E + ' : ' + m + ' = ' + v * v + '.', traps: [{ val: E / m, msg: 'Не забудь умножить E на 2: v^2 = 2E : m.' }] },
          { q: 'Найдите v.', ans: v, aid: '√' + v * v + ' = ' + v + ' м/с.', traps: [{ val: v * v, msg: 'Это v^2. Извлеки квадратный корень.' }] }],
        answer: v };
    },
    function () {
      var w = pick([2, 2.5, 3, 4, 5, 5.5, 6]), R = randInt(2, 12), a = round(w * w * R, 4);
      return { skill: 'q12_inverse',
        text: 'Центростремительное ускорение при движении по окружности (в м/с^2) можно вычислить по формуле a = ω^2R, где ω — угловая скорость (в с⁻¹), а R — радиус окружности. Пользуясь этой формулой, найдите расстояние R (в метрах), если угловая скорость равна ' + f(w) + ' с⁻¹, а центростремительное ускорение равно ' + f(a) + ' м/с^2.',
        steps: [{ q: 'Чему равно ω^2?', ans: round(w * w, 4), aid: f(w) + '^2 = ' + f(round(w * w, 4)) + '.', traps: [{ val: 2 * w, msg: 'Квадрат — это ω · ω.' }] },
          { q: 'Найдите R = a : ω^2.', ans: R, aid: f(a) + ' : ' + f(round(w * w, 4)) + ' = ' + R + ' м.', traps: [{ val: fin(a / w) ? round(a / w, 4) : NaN, msg: 'Делить нужно на ω^2, а не на ω.' }] }],
        answer: R };
    },
    function () {
      var V = pick([0.01, 0.02, 0.005, 0.03, 0.05, 0.002, 0.04]), F = round(1000 * 9.8 * V, 4);
      return { skill: 'q12_direct',
        text: 'Сила Архимеда, выталкивающая на поверхность погружённое в воду тело, вычисляется по формуле F = ρgV, где ρ = 1000 кг/м^3 — плотность воды, g = 9,8 м/с^2 — ускорение свободного падения, а V — объём тела в кубических метрах. Найдите силу Архимеда, действующую на погружённое в воду тело объёмом ' + f(V) + ' куб. м. Ответ дайте в ньютонах.',
        steps: [{ q: 'Чему равно ρg = 1000 · 9,8?', ans: 9800, aid: '1000 · 9,8 = 9800.', traps: [{ val: 98, msg: 'При умножении на 1000 запятая сдвигается на три знака вправо.' }] },
          { q: 'Найдите F = 9800 · V.', ans: F, aid: '9800 · ' + f(V) + ' = ' + f(F) + ' Н.', traps: [{ val: round(9.8 * V, 4), msg: 'Забыли умножить на плотность 1000.' }] }],
        answer: F };
    },
    function () {
      var m = randInt(2, 40), h = pick([5, 8, 10, 12, 15, 20, 25]), P = round(m * 9.8 * h, 4);
      return { skill: 'q12_inverse',
        text: 'Если тело массой m кг подвешено на высоте h м над горизонтальной поверхностью земли, то его потенциальная энергия в джоулях вычисляется по формуле P = mgh, где g = 9,8 м/с^2 — ускорение свободного падения. Найдите массу тела, подвешенного на высоте ' + h + ' м над поверхностью земли, если его потенциальная энергия равна ' + f(P) + ' джоулям. Ответ дайте в килограммах.',
        steps: [{ q: 'Чему равно g · h?', ans: round(9.8 * h, 4), aid: '9,8 · ' + h + ' = ' + f(round(9.8 * h, 4)) + '.', traps: [] },
          { q: 'Найдите m = P : (gh).', ans: m, aid: f(P) + ' : ' + f(round(9.8 * h, 4)) + ' = ' + m + ' кг.', traps: [{ val: fin(P / h) ? round(P / h, 4) : NaN, msg: 'Делить нужно на произведение g · h.' }] }],
        answer: m };
    },
    function () {
      var d2 = randInt(4, 20), s = pick([0.5, 0.4, 0.6, 0.8, 0.25]), d1 = randInt(3, 20), S = round(d1 * d2 * s / 2, 4);
      if (!fin(S) || !fin(d2 * s / 2)) return null;
      return { skill: 'q12_inverse',
        text: 'Площадь четырёхугольника можно вычислить по формуле S = {d‹1›d‹2›sin α|2}, где d‹1› и d‹2› — длины диагоналей четырёхугольника, α — угол между диагоналями. Пользуясь этой формулой, найдите длину диагонали d‹1›, если d‹2› = ' + d2 + ', sin α = ' + f(s) + ', а S = ' + f(S) + '.',
        steps: [{ q: 'Чему равно {d‹2›sin α|2}?', ans: round(d2 * s / 2, 4), aid: d2 + ' · ' + f(s) + ' : 2 = ' + f(round(d2 * s / 2, 4)) + '.', traps: [{ val: round(d2 * s, 4), msg: 'Не забудь разделить на 2.' }] },
          { q: 'Найдите d‹1› = S : {d‹2›sin α|2}.', ans: d1, aid: f(S) + ' : ' + f(round(d2 * s / 2, 4)) + ' = ' + d1 + '.', traps: [{ val: fin(S / (d2 * s)) ? round(S / (d2 * s), 4) : NaN, msg: 'Не потеряй деление на 2: d‹1› = 2S : (d‹2›sin α).' }] }],
        answer: d1 };
    },
    function () {
      var I = randInt(2, 10), t = randInt(2, 10), R = randInt(2, 20), Q = I * I * R * t;
      return { skill: 'q12_inverse',
        text: 'Закон Джоуля–Ленца можно записать в виде Q = I^2Rt, где Q — количество теплоты (в джоулях), I — сила тока (в амперах), R — сопротивление цепи (в омах), а t — время (в секундах). Пользуясь этой формулой, найдите сопротивление цепи R (в омах), если Q = ' + Q + ' Дж, I = ' + I + ' А, t = ' + t + ' с.',
        steps: [{ q: 'Чему равно I^2 · t?', ans: I * I * t, aid: I + '^2 · ' + t + ' = ' + I * I + ' · ' + t + ' = ' + I * I * t + '.', traps: [{ val: 2 * I * t, msg: 'I^2 = I · I, а не 2 · I.' }] },
          { q: 'Найдите R = Q : (I^2t).', ans: R, aid: Q + ' : ' + I * I * t + ' = ' + R + ' Ом.', traps: [{ val: fin(Q / (I * t)) ? Q / (I * t) : NaN, msg: 'Делить нужно на I^2 · t: ток в квадрате.' }] }],
        answer: R };
    },
    function () {
      var a = randInt(3, 15), b = randInt(3, 15) + a, h = randInt(2, 12), S = (a + b) / 2 * h;
      return { skill: 'q12_inverse',
        text: 'Площадь трапеции вычисляется по формуле S = {a + b|2} · h, где a и b — основания трапеции, h — её высота. Пользуясь этой формулой, найдите высоту h, если основания равны ' + a + ' и ' + b + ', а площадь S = ' + f(S) + '.',
        steps: [{ q: 'Чему равна полусумма оснований {a + b|2}?', ans: (a + b) / 2, aid: '(' + a + ' + ' + b + ') : 2 = ' + f((a + b) / 2) + '.', traps: [{ val: a + b, msg: 'Сумму оснований ещё нужно разделить на 2.' }, { val: a + b / 2, msg: 'Дробная черта работает как скобки: сначала сложи a и b, потом дели на 2.' }] },
          { q: 'Найдите h.', ans: h, aid: f(S) + ' : ' + f((a + b) / 2) + ' = ' + h + '.', traps: [{ val: fin(S / (a + b)) ? round(S / (a + b), 4) : NaN, msg: 'Делить нужно на полусумму оснований, а не на сумму.' }] }],
        answer: h };
    },
    function () {
      var R = pick([2, 4, 5, 8, 10, 12, 20, 25]), I = pick([0.5, 1.5, 2, 2.5, 3, 4, 6]), U = round(I * R, 4);
      return { skill: 'q12_inverse',
        text: 'Закон Ома для участка цепи: I = {U|R}, где I — сила тока (в амперах), U — напряжение (в вольтах), R — сопротивление (в омах). Пользуясь этой формулой, найдите сопротивление R (в омах), если U = ' + f(U) + ' В, а I = ' + f(I) + ' А.',
        steps: [{ q: 'Из формулы R = {U|I}. Найдите R.', ans: R, aid: f(U) + ' : ' + f(I) + ' = ' + R + ' Ом.', traps: [{ val: round(U * I, 4), msg: 'R = U : I, а не U · I.' }, { val: fin(I / U) ? round(I / U, 4) : NaN, msg: 'Делили наоборот: R = U : I.' }] }],
        answer: R };
    }
  ];
  function make12() {
    var p = null;
    while (!p) p = pick(F12)();
    var last = p.steps[p.steps.length - 1];
    last.ans = p.answer;
    return { kind: 'formula', skill: p.skill, text: p.text, steps: cleanTraps(p.steps), answer: String(p.answer),
      explain: p.steps.map(function (s) { return s.aid; }).join(' ') + ' Ответ: ' + f(last.ans) + '.' };
  }

  return Object.assign(L, {
    SKILLS9: SKILLS9, SKILLS11: SKILLS11, SKILLS12: SKILLS12, F12_COUNT: F12.length,
    make9: make9, make9saper: make9saper, make11: make11, make12: make12, evalG11: evalG, fml11: fml, lin9: lin,
    same11: same, diffMsg11: diffMsg, featureAid11: featureAid
  });
});
