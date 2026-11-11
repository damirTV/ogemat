/* Вычисления без ошибок: логика режимов «Порядок действий» и «Рецептура».
   Дополняет Logic из logic.js и logic2.js (без DOM). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic2.js'));
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, MINUS = L.MINUS, fmt = L.fmt;
  var randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, gcd = U.gcd, clean = U.clean;

  function fr(k, d) { return '[' + k + '/' + d + ']'; }
  function lcm(a, b) { return a * b / gcd(a, b); }
  function dp(v) { var s = String(clean(v)); var i = s.indexOf('.'); return i < 0 ? 0 : s.length - i - 1; }

  /* ================= ПОРЯДОК ДЕЙСТВИЙ ================= */
  var SYM = { '+': '+', '-': MINUS, '*': '·', '/': ':' };
  var PRIO = { '+': 1, '-': 1, '*': 2, '/': 2 };

  function leaf(v) { return { v: clean(v) }; }
  function N(op, l, r, paren) { return { op: op, l: l, r: r, paren: !!paren }; }
  function isLeaf(n) { return n.op === undefined; }
  function calc(op, a, b) {
    return clean(op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b);
  }
  function evalTree(n) {
    if (isLeaf(n)) return n.v;
    n.value = calc(n.op, evalTree(n.l), evalTree(n.r));
    return n.value;
  }
  /* Нумерация действий слева направо (как они стоят в записи) */
  function opsInOrder(n, out) {
    out = out || [];
    if (isLeaf(n)) return out;
    opsInOrder(n.l, out); out.push(n); opsInOrder(n.r, out);
    return out;
  }

  function d1() { var k; do { k = randInt(2, 99); } while (k % 10 === 0); return k / 10; }
  function d1s() { var k; do { k = randInt(2, 49); } while (k % 10 === 0); return k / 10; }
  function mulf() { return pick([2, 3, 4, 5, 6, 0.2, 0.4, 0.5, 1.5, 2.5]); }
  function divf() { return pick([0.2, 0.4, 0.5, 0.6, 0.8, 1.2, 1.5, 2, 2.5, 4, 5]); }
  function quot() { return Math.random() < 0.5 ? randInt(2, 15) : d1s(); }
  function below(x) { var m = Math.floor(clean(x * 10)) - 1; return m >= 1 ? randInt(1, m) / 10 : null; }

  var TEMPLATES = {
    'a+b*c': { g: 5, make: function () { return N('+', leaf(randInt(1, 99) / 10), N('*', leaf(d1()), leaf(mulf()))); } },
    'a-b*c': { g: 5, make: function () { var b = d1(), c = mulf(); return N('-', leaf(clean(b * c + d1())), N('*', leaf(b), leaf(c))); } },
    '(a+b)*c': { g: 5, make: function () { return N('*', N('+', leaf(d1()), leaf(d1()), true), leaf(mulf())); } },
    '(a-b)*c': { g: 5, make: function () { var b = d1(); return N('*', N('-', leaf(clean(b + d1())), leaf(b), true), leaf(mulf())); } },
    'a/b+c': { g: 5, make: function () { var b = divf(); return N('+', N('/', leaf(clean(b * quot())), leaf(b)), leaf(d1())); } },
    'a+b/c': { g: 5, make: function () { var c = divf(); return N('+', leaf(d1()), N('/', leaf(clean(c * quot())), leaf(c))); } },
    'a-b+c': { g: 5, make: function () { var b = d1(); return N('+', N('-', leaf(clean(b + d1())), leaf(b)), leaf(d1())); } },
    'a/b*c': { g: 5, make: function () { var b = divf(); return N('*', N('/', leaf(clean(b * quot())), leaf(b)), leaf(mulf())); } },
    'a*b-c/d': { g: 6, make: function () {
      var a = d1(), b = mulf(), p = clean(a * b), d = divf(), q = below(p);
      if (q === null) return null;
      return N('-', N('*', leaf(a), leaf(b)), N('/', leaf(clean(d * q)), leaf(d)));
    } },
    '(a+b)/c-d': { g: 6, make: function () {
      var c = divf(), q = quot(), s = clean(c * q), a = below(s), d = below(q);
      if (a === null || d === null) return null;
      return N('-', N('/', N('+', leaf(a), leaf(clean(s - a)), true), leaf(c)), leaf(d));
    } },
    'a*(b-c)+d': { g: 6, make: function () { var c = d1(); return N('+', N('*', leaf(mulf()), N('-', leaf(clean(c + d1())), leaf(c), true)), leaf(d1())); } },
    'a-(b+c)*d': { g: 6, make: function () {
      var b = d1(), c = d1(), d = mulf();
      return N('-', leaf(clean((b + c) * d + d1())), N('*', N('+', leaf(b), leaf(c), true), leaf(d)));
    } }
  };

  function validTree(t) {
    var ok = true;
    (function walk(n) {
      if (isLeaf(n)) { if (!(n.v > 0) || dp(n.v) > 2 || n.v >= 100) ok = false; return; }
      walk(n.l); walk(n.r);
      if (!(n.value > 0) || dp(n.value) > 3 || n.value >= 1000) ok = false;
      if ((n.op === '*' || n.op === '/') && (n.r.v === 1 || n.value === (isLeaf(n.l) ? n.l.v : n.l.value))) ok = false;
    })(t);
    return ok;
  }
  function makeOrderTask(key) {
    for (var g = 0; g < 500; g++) {
      var tree = TEMPLATES[key].make();
      if (!tree) continue;
      evalTree(tree);
      if (!validTree(tree)) continue;
      var ops = opsInOrder(tree);
      ops.forEach(function (n, i) { n.id = i; });
      return { type: 'orderops', kind: key, skill: 'order_ops', tree: tree, nOps: ops.length, value: tree.value };
    }
    throw new Error('orderops: ' + key);
  }
  function opById(task, id) { return opsInOrder(task.tree)[id]; }
  function isReady(n, done) {
    return [n.l, n.r].every(function (c) { return isLeaf(c) || done.indexOf(c.id) >= 0; });
  }
  /* Нажатие на знак: {ok:true} или {ok:false, why:'brackets'|'priority'|'left'} */
  function checkOpTap(task, done, id) {
    var n = opById(task, id);
    if (!n || done.indexOf(id) >= 0) return { ok: false, why: 'done' };
    if (isReady(n, done)) return { ok: true };
    var c = [n.l, n.r].filter(function (x) { return !isLeaf(x) && done.indexOf(x.id) < 0; })[0];
    if (c.paren) return { ok: false, why: 'brackets' };
    if (PRIO[c.op] > PRIO[n.op]) return { ok: false, why: 'priority' };
    return { ok: false, why: 'left' };
  }
  function readyOps(task, done) {
    return opsInOrder(task.tree).filter(function (n) { return done.indexOf(n.id) < 0 && isReady(n, done); }).map(function (n) { return n.id; });
  }
  var WHY = {
    brackets: 'Сначала выполняется действие в скобках.',
    priority: 'Умножение и деление выполняются раньше сложения и вычитания.',
    left: 'Действия одного уровня выполняются по порядку, слева направо.'
  };
  /* Значение операнда с учётом уже выполненных действий */
  function operandValue(n) { return isLeaf(n) ? n.v : n.value; }
  function stepText(task, id) {
    var n = opById(task, id);
    return fmt(operandValue(n.l)) + ' ' + SYM[n.op] + ' ' + fmt(operandValue(n.r));
  }
  /* Токены записи. done: выполненные действия сворачиваются в число; mark: id подсвеченного действия */
  function tokens(task, done, mark) {
    done = done || [];
    var out = [];
    (function walk(n, inMark) {
      if (isLeaf(n)) { out.push({ t: 'num', text: fmt(n.v), mark: inMark }); return; }
      if (done.indexOf(n.id) >= 0) { out.push({ t: 'num', text: fmt(n.value), mark: inMark, fresh: true }); return; }
      var m = inMark || n.id === mark;
      if (n.paren) out.push({ t: 'par', text: '(', mark: m });
      walk(n.l, m);
      out.push({ t: 'op', id: n.id, text: SYM[n.op], mark: m });
      walk(n.r, m);
      if (n.paren) out.push({ t: 'par', text: ')', mark: m });
    })(task.tree, false);
    return out;
  }
  function tokensText(tk) {
    var s = '';
    tk.forEach(function (x, i) {
      if (x.t === 'par' && x.text === ')') s += ')';
      else if (x.t === 'par') s += (i ? ' ' : '') + '(';
      else s += (i && tk[i - 1].text !== '(' ? ' ' : '') + x.text;
    });
    return s;
  }
  function makeOrderOpsRound(grade, n) {
    n = n || 5;
    var g5 = Object.keys(TEMPLATES).filter(function (k) { return TEMPLATES[k].g === 5; });
    var g6 = Object.keys(TEMPLATES).filter(function (k) { return TEMPLATES[k].g === 6; });
    var keys;
    if (grade >= 6) keys = shuffle(g5).slice(0, 2).concat(shuffle(g6).slice(0, 3));
    else {
      keys = shuffle(g5).slice(0, n);
      var hasPar = keys.some(function (k) { return k.indexOf('(') >= 0; });
      if (!hasPar) keys[n - 1] = pick(['(a+b)*c', '(a-b)*c']);
    }
    return keys.slice(0, n).map(makeOrderTask);
  }
  function scoreOrderOps(o) { /* {wrongOrder, steps:[1|2|0], hint} */
    var order = Math.max(0, 10 - 5 * o.wrongOrder);
    var comp = o.steps.reduce(function (s, x) { return s + (x === 1 ? 5 : x === 2 ? 2 : 0); }, 0);
    var perfect = o.wrongOrder === 0 && o.steps.every(function (x) { return x === 1; });
    var noHint = perfect && !o.hint ? 5 : 0;
    return { order: order, comp: comp, noHint: noHint, total: order + comp + noHint, perfect: perfect };
  }

  /* ================= РЕЦЕПТУРА ================= */
  var DENS5 = [2, 3, 4, 5, 6, 8, 10, 12], DENS6 = [2, 3, 4, 5, 6, 8, 9, 10, 12, 15];
  var VISUAL_MAX = 36; // больше делений в стакане не помещается
  var STORIES_PLUS = [
    function (a, b) { return 'В тесто для блинов кладут ' + a + ' стакана молока и ' + b + ' стакана кефира. Сколько всего стаканов жидкости?'; },
    function (a, b) { return 'Для крема берут ' + a + ' стакана сливок и ' + b + ' стакана йогурта. Сколько это всего стаканов?'; },
    function (a, b) { return 'В морс наливают ' + a + ' литра сока и ' + b + ' литра воды. Сколько литров морса получится?'; },
    function (a, b) { return 'В кекс кладут ' + a + ' стакана сахара и ' + b + ' стакана изюма. Сколько стаканов всего?'; }
  ];
  var STORIES_MINUS = [
    function (a, b) { return 'В кувшине было ' + a + ' литра сока, для коктейля взяли ' + b + ' литра. Сколько сока осталось?'; },
    function (a, b) { return 'В пакете было ' + a + ' стакана муки, на оладьи ушло ' + b + ' стакана. Сколько муки осталось?'; },
    function (a, b) { return 'В бутылке было ' + a + ' литра молока, на кашу взяли ' + b + ' литра. Сколько молока осталось?'; }
  ];

  function genRecipe(grade, op, opts) {
    opts = opts || {};
    var dens = grade >= 6 ? DENS6 : DENS5;
    var maxL = opts.abstract ? (grade >= 6 ? 60 : 36) : (grade >= 6 ? 30 : 24);
    for (var g = 0; g < 1000; g++) {
      var b1 = pick(dens), b2 = pick(dens);
      if (b1 === b2) continue;
      var Lc = lcm(b1, b2);
      if (Lc > maxL || Lc > (opts.abstract ? 60 : VISUAL_MAX)) continue;
      var divides = (b1 % b2 === 0) || (b2 % b1 === 0);
      if (opts.easy !== undefined && divides !== !!opts.easy) continue;
      var k1 = randInt(1, b1 - 1), k2 = randInt(1, b2 - 1);
      if (gcd(k1, b1) !== 1 || gcd(k2, b2) !== 1) continue;
      var n1 = k1 * Lc / b1, n2 = k2 * Lc / b2;
      var num = op === '+' ? n1 + n2 : n1 - n2;
      if (num <= 0 || num >= Lc) continue; // результат меньше целого стакана
      var gg = gcd(num, Lc);
      var a = fr(k1, b1), b = fr(k2, b2);
      return {
        type: 'recipe', skill: 'frac_addsub', op: op, k1: k1, b1: b1, k2: k2, b2: b2, lcm: Lc,
        num: num, rn: num / gg, rd: Lc / gg, value: num / Lc,
        expr: a + ' ' + (op === '+' ? '+' : MINUS) + ' ' + b,
        story: opts.abstract ? '' : (op === '+' ? pick(STORIES_PLUS) : pick(STORIES_MINUS))(a, b),
        scaffold: opts.scaffold
      };
    }
    throw new Error('recipe: no task');
  }
  function makeRecipeRound(grade, n) {
    n = n || 5;
    var spec = [
      { op: '+', easy: true, scaffold: 2 },
      { op: '+', easy: false, scaffold: 2 },
      { op: '-', easy: grade >= 6 ? false : undefined, scaffold: 2 },
      { op: pick(['+', '-']), easy: false, scaffold: 1 },
      { op: pick(['+', '-']), abstract: true, scaffold: 0 }
    ];
    var out = [], seen = {};
    spec.slice(0, n).forEach(function (sp) {
      for (var g = 0; g < 50; g++) {
        var t = genRecipe(grade, sp.op, sp);
        if (!seen[t.expr]) { seen[t.expr] = 1; out.push(t); return; }
      }
    });
    return out;
  }
  /* Разрезать каждую долю стакана на k частей: можно, если делений не больше VISUAL_MAX */
  function canSplit(d, k) { return d * k <= VISUAL_MAX; }
  /* Числитель после приведения к знаменателю den (den общий для обеих дробей) */
  function expectedNum(t, den) {
    var a = t.k1 * den / t.b1, b = t.k2 * den / t.b2;
    return t.op === '+' ? a + b : a - b;
  }
  function isCommonDen(t, den) { return den > 0 && den % t.b1 === 0 && den % t.b2 === 0; }
  /* Варианты сокращения: верный и два типичных промаха */
  function reduceOptions(num, den) {
    var g = gcd(num, den);
    if (g === 1) return null;
    var right = { n: num / g, d: den / g, ok: true };
    var wrong = [];
    var p = 0;
    for (var f = 2; f < g; f++) if (g % f === 0) { p = f; break; }
    if (p) wrong.push({ n: num / p, d: den / p, ok: false, note: 'Сократили не до конца: числитель и знаменатель ещё делятся на ' + (g / p) + '.' });
    wrong.push({ n: num / g, d: den, ok: false, note: 'Делить нужно и числитель, и знаменатель на одно и то же число.' });
    if (wrong.length < 2) wrong.push({ n: num, d: den / g, ok: false, note: 'Знаменатель разделили, а числитель забыли.' });
    var out = [right].concat(wrong.slice(0, 2));
    var keys = {};
    out = out.filter(function (o) { var k = o.n + '/' + o.d; if (keys[k]) return false; keys[k] = 1; return true; });
    return shuffle(out);
  }
  function scoreRecipe(o) { /* {den: 'lcm'|'common'|'fail', num: 1|2|0, reduce: null|true|false, hint} */
    var den = o.den === 'lcm' ? 10 : o.den === 'common' ? 5 : 0;
    var num = o.num === 1 ? 10 : o.num === 2 ? 5 : 0;
    var red = o.reduce === true ? 5 : 0;
    var perfect = o.den === 'lcm' && o.num === 1 && o.reduce !== false;
    var noHint = perfect && !o.hint ? 5 : 0;
    return { den: den, num: num, reduce: red, noHint: noHint, total: den + num + red + noHint, perfect: perfect };
  }

  return Object.assign(L, {
    OO_WHY: WHY,
    makeOrderOpsRound: makeOrderOpsRound, makeOrderTask: makeOrderTask, ORDER_TEMPLATES: Object.keys(TEMPLATES),
    checkOpTap: checkOpTap, readyOps: readyOps, stepText: stepText, opById: opById,
    ooTokens: tokens, ooTokensText: tokensText, scoreOrderOps: scoreOrderOps,
    makeRecipeRound: makeRecipeRound, genRecipe: genRecipe, canSplit: canSplit, expectedNum: expectedNum,
    isCommonDen: isCommonDen, reduceOptions: reduceOptions, scoreRecipe: scoreRecipe, RECIPE_VISUAL_MAX: VISUAL_MAX
  });
});
