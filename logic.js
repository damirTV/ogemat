/* Вычисления без ошибок: логика игры (без DOM).
   Работает и в браузере (window.Logic), и в Node (для тестов). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.Logic = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var MINUS = '−';

  /* ---------- вспомогательные функции ---------- */
  function rand(n) { return Math.floor(Math.random() * n); }
  function randInt(a, b) { return a + rand(b - a + 1); }
  function pick(arr) { return arr[rand(arr.length)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = rand(i + 1), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function round(x, d) { return Number(x.toFixed(d)); }
  function clean(x) { return Number(x.toPrecision(12)); }

  /* Число в российской записи: запятая, настоящий минус */
  function fmt(x) {
    if (!isFinite(x)) return '?';
    var s = String(Number(x.toFixed(4)));
    if (s === '-0') s = '0';
    s = s.replace('.', ',');
    if (s.charAt(0) === '-') s = MINUS + s.slice(1);
    return s;
  }

  /* Ответ ученика -> число (или NaN). Принимает запятую и точку, минус любого вида */
  function parseAnswer(str) {
    var s = String(str).replace(/\s+/g, '').replace(/[−–—]/g, '-');
    if (!/^-?\d+([.,]\d+)?$/.test(s)) return NaN;
    return Number(s.replace(',', '.'));
  }
  function isCorrect(value, answer) { return Math.abs(value - answer) < 1e-6; }

  /* Округление до одной значащей цифры: 8,16 -> 8; 17,5 -> 20; 0,28 -> 0,3 */
  function sig1(v) {
    if (v === 0) return 0;
    var a = Math.abs(v);
    var e = Math.floor(Math.log10(a) + 1e-12);
    var m = a / Math.pow(10, e);
    var out = Math.round(m) * Math.pow(10, e);
    return clean(v < 0 ? -out : out);
  }
  /* Грубое округление операнда для прикидки */
  function approx(x) { return Math.abs(x) >= 1 ? Math.round(x) : round(x, 1); }

  /* ---------- названия ---------- */
  var SKILLS = {
    dec_addsub: 'Сложение и вычитание десятичных',
    dec_mul: 'Умножение десятичных',
    dec_div: 'Деление десятичных',
    frac_decimal: 'Обыкновенные и десятичные дроби',
    frac_div: 'Деление обыкновенных дробей',
    frac_stack: 'Многоэтажные дроби',
    numline: 'Числовая прямая',
    conversion: 'Превращение дробей',
    order_ops: 'Порядок действий',
    frac_addsub: 'Сложение и вычитание дробей'
  };

  /* ---------- прикидка: варианты ответа ---------- */
  function buildEstimate(value, style) {
    var s = sig1(value);
    var vals;
    if (style === 'sign') vals = [s, -s, clean(s * 10)];
    else vals = [clean(s / 10), s, clean(s * 10)];
    vals.sort(function (a, b) { return a - b; });
    return {
      s: s,
      style: style,
      options: vals.map(function (v) { return { value: v, label: 'около ' + fmt(v) }; }),
      correctIndex: vals.indexOf(s)
    };
  }

  /* Ответ ученика «не сходится» с прикидкой: другой знак или порядок отличается в 4+ раза */
  function estimateConflict(s, a) {
    if (s === 0 || a === 0) return false;
    if ((s < 0) !== (a < 0)) return true;
    var r = Math.abs(a / s);
    return r >= 4 || r <= 0.25;
  }

  /* ---------- генераторы заданий типа 6 ---------- */
  function genDecAddSub(grade) {
    var mode = grade >= 6 ? pick(['add', 'sub', 'neg']) : pick(['add', 'sub']);
    var a, b, tries = 0;
    do {
      a = randInt(11, 99) / 10; b = randInt(11, 99) / 10; tries++;
    } while (mode !== 'add' && Math.abs(a - b) < 1.5 && tries < 50);
    if (mode === 'sub' && a < b) { var t = a; a = b; b = t; }
    if (mode === 'neg' && a > b) { var t2 = a; a = b; b = t2; }
    var value = round(mode === 'add' ? a + b : a - b, 1);
    var ra = Math.round(a), rb = Math.round(b);
    var approxResult = mode === 'add' ? ra + rb : ra - rb;
    var explain;
    if (mode === 'add') explain = 'Складываем в столбик, запятая под запятой: ' + fmt(a) + ' + ' + fmt(b) + ' = ' + fmt(value) + '.';
    else if (mode === 'sub') explain = 'Вычитаем в столбик, запятая под запятой: ' + fmt(a) + ' ' + MINUS + ' ' + fmt(b) + ' = ' + fmt(value) + '.';
    else explain = 'Из большего числа вычитаем меньшее: ' + fmt(b) + ' ' + MINUS + ' ' + fmt(a) + ' = ' + fmt(-value) + '. Уменьшаемое меньше вычитаемого, поэтому ответ отрицательный: ' + fmt(value) + '.';
    return {
      kind: 'dec_addsub', skill: 'dec_addsub',
      expr: fmt(a) + ' ' + (mode === 'add' ? '+' : MINUS) + ' ' + fmt(b),
      value: value, allowNeg: mode === 'neg',
      hintOps: fmt(a) + ' ≈ ' + ra + ', ' + fmt(b) + ' ≈ ' + rb,
      approxResult: approxResult,
      explain: explain,
      est: buildEstimate(value, mode === 'neg' ? 'sign' : 'ratio')
    };
  }

  function genDecMul() {
    var A, B;
    do { A = randInt(12, 99); } while (A % 10 === 0);
    do { B = randInt(12, 99); } while (B % 10 === 0);
    var a = A / 10, b = B / 10;
    var value = round(A * B / 100, 2);
    var ra = Math.round(a), rb = Math.round(b);
    return {
      kind: 'dec_mul', skill: 'dec_mul',
      expr: fmt(a) + ' · ' + fmt(b),
      value: value, allowNeg: false,
      hintOps: fmt(a) + ' ≈ ' + ra + ', ' + fmt(b) + ' ≈ ' + rb,
      approxResult: ra * rb,
      explain: 'Считаем без запятых: ' + A + ' · ' + B + ' = ' + (A * B) + '. В множителях по одному знаку после запятой, значит в ответе их будет два: ' + fmt(value) + '.',
      est: buildEstimate(value, 'ratio')
    };
  }

  function genDecDiv() {
    var B;
    do { B = randInt(12, 49); } while (B % 10 === 0);
    var k = randInt(2, 9);
    var A = B * k;
    var a = A / 10, b = B / 10;
    var ra = Math.round(a), rb = Math.round(b);
    var asFraction = Math.random() < 0.6;
    return {
      kind: 'dec_div', skill: 'dec_div',
      expr: asFraction ? '{' + fmt(a) + '|' + fmt(b) + '}' : fmt(a) + ' : ' + fmt(b),
      value: k, allowNeg: false,
      hintOps: fmt(a) + ' ≈ ' + ra + ', ' + fmt(b) + ' ≈ ' + rb,
      approxResult: round(ra / rb, 1),
      explain: 'Сдвигаем запятую в обоих числах на один знак вправо: ' + fmt(a) + ' : ' + fmt(b) + ' = ' + A + ' : ' + B + ' = ' + k + '.',
      est: buildEstimate(k, 'ratio')
    };
  }

  function genFracDecimal(grade) {
    var dens = grade >= 6 ? [2, 4, 5, 10, 20, 25] : [2, 4, 5, 10];
    var q1 = pick(dens), q2 = pick(dens.filter(function (q) { return q > 2; }));
    var p1, p2, g = 0;
    do { p1 = randInt(q1 + 1, Math.min(q1 * 9, 40)); } while (gcd(p1, q1) !== 1);
    do { p2 = randInt(1, q2 - 1); } while (gcd(p2, q2) !== 1);
    var d1 = round(p1 / q1, 2), d2 = round(p2 / q2, 2);
    var add = Math.random() < 0.5;
    var value = round(add ? d1 + d2 : d1 - d2, 2);
    var big = '[' + p1 + '/' + q1 + ']', small = '[' + p2 + '/' + q2 + ']';
    var expr = add ? (Math.random() < 0.5 ? big + ' + ' + small : small + ' + ' + big) : big + ' ' + MINUS + ' ' + small;
    var a1 = approx(d1), a2 = approx(d2);
    return {
      kind: 'frac_decimal', skill: 'frac_decimal',
      expr: expr, value: value, allowNeg: false,
      hintOps: p1 + '/' + q1 + ' ≈ ' + fmt(a1) + ', ' + p2 + '/' + q2 + ' ≈ ' + fmt(a2),
      approxResult: round(add ? a1 + a2 : a1 - a2, 1),
      explain: 'Переводим дроби в десятичные: ' + p1 + '/' + q1 + ' = ' + fmt(d1) + ', ' + p2 + '/' + q2 + ' = ' + fmt(d2) + '. Тогда ' + fmt(d1) + ' ' + (add ? '+' : MINUS) + ' ' + fmt(d2) + ' = ' + fmt(value) + '.',
      est: buildEstimate(value, 'ratio')
    };
  }

  var FRAC_DIV_POOL = [
    [21, 5, 6, 7], [9, 4, 3, 8], [14, 5, 7, 10], [18, 7, 9, 14], [5, 2, 25, 4],
    [27, 8, 9, 4], [35, 6, 7, 12], [12, 5, 3, 10], [8, 3, 4, 9], [15, 4, 5, 8]
  ];
  function genFracDiv() {
    var q = pick(FRAC_DIV_POOL), a = q[0], b = q[1], c = q[2], d = q[3];
    var value = round((a * d) / (b * c), 3);
    var x1 = approx(a / b), x2 = approx(c / d);
    return {
      kind: 'frac_div', skill: 'frac_div',
      expr: '[' + a + '/' + b + '] : [' + c + '/' + d + ']',
      value: value, allowNeg: false,
      hintOps: a + '/' + b + ' ≈ ' + fmt(x1) + ', ' + c + '/' + d + ' ≈ ' + fmt(x2),
      approxResult: round(x1 / x2, 1),
      explain: 'Делить на дробь значит умножать на обратную: ' + a + '/' + b + ' · ' + d + '/' + c + ' = ' + (a * d) + '/' + (b * c) + ' = ' + fmt(value) + '.',
      est: buildEstimate(value, 'ratio')
    };
  }

  var FRAC_STACK_POOL = [[30, 42], [12, 20], [20, 30], [42, 56], [10, 15], [15, 60], [4, 12], [6, 12]];
  function genFracStack() {
    var q = pick(FRAC_STACK_POOL), p = q[0], r = q[1];
    var lcm = p * r / gcd(p, r);
    var num = lcm / p + lcm / r;
    var value = round(lcm / num, 3);
    var s1 = round(1 / p, 2), s2 = round(1 / r, 2);
    var sum = round(s1 + s2, 2);
    return {
      kind: 'frac_stack', skill: 'frac_stack',
      expr: '{1|[1/' + p + '] + [1/' + r + ']}',
      value: value, allowNeg: false,
      hintOps: '1/' + p + ' ≈ ' + fmt(s1) + ', 1/' + r + ' ≈ ' + fmt(s2),
      approxResult: Math.round(1 / sum),
      explain: 'Сначала считаем сумму в знаменателе: 1/' + p + ' + 1/' + r + ' = ' + (lcm / p) + '/' + lcm + ' + ' + (lcm / r) + '/' + lcm + ' = ' + num + '/' + lcm + '. Потом переворачиваем: ' + lcm + '/' + num + ' = ' + fmt(value) + '.',
      est: buildEstimate(value, 'ratio')
    };
  }

  function kindsFor(grade) {
    var k = ['dec_addsub', 'dec_mul', 'dec_div', 'frac_decimal'];
    if (grade >= 6) k.push('frac_div', 'frac_stack');
    return k;
  }
  function generateTask(kind, grade) {
    switch (kind) {
      case 'dec_addsub': return genDecAddSub(grade);
      case 'dec_mul': return genDecMul(grade);
      case 'dec_div': return genDecDiv(grade);
      case 'frac_decimal': return genFracDecimal(grade);
      case 'frac_div': return genFracDiv(grade);
      case 'frac_stack': return genFracStack(grade);
    }
    throw new Error('unknown kind ' + kind);
  }

  /* Раунд «Прикидки»: n заданий, виды перемешаны, без повторов выражений */
  function makePrikidkaRound(grade, n) {
    n = n || 5;
    var kinds = kindsFor(grade), bag = [], out = [], seen = {}, guard = 0;
    while (out.length < n && guard++ < 500) {
      if (!bag.length) bag = shuffle(kinds);
      var t = generateTask(bag.pop(), grade);
      if (seen[t.expr]) continue;
      seen[t.expr] = true;
      out.push(t);
    }
    return out;
  }

  /* ---------- «Сапёр ошибок»: каталог ловушек и решения ---------- */
  var TRAPS = {
    fracdiv_flip: {
      name: 'Не перевернули дробь при делении',
      rule: 'Делить на дробь значит умножать на обратную. Переворачивай вторую дробь, а первую не трогай.'
    },
    fracadd_den: {
      name: 'Сложили числители и знаменатели',
      rule: 'Дроби с разными знаменателями складывают через общий знаменатель. Числители и знаменатели по отдельности не складывают.'
    },
    decmul_comma: {
      name: 'Запятая уехала при умножении',
      rule: 'Перемножаем числа без запятых, затем считаем знаки после запятой в обоих множителях. Столько же знаков должно быть в ответе.'
    },
    sign_lost: {
      name: 'Потеряли минус',
      rule: 'Если из меньшего числа вычитают большее, ответ отрицательный. Поменяй числа местами и поставь минус перед скобкой.'
    },
    decdiv_shift: {
      name: 'Запятую сдвинули только в одном числе',
      rule: 'При делении десятичных запятую переносят сразу в обоих числах на одинаковое число знаков.'
    },
    frac_to_dec: {
      name: 'Ошибка при переводе дроби в десятичную',
      rule: 'Чтобы перевести дробь в десятичную, приведи знаменатель к 10, 100 или 1000: 7/25 = 28/100 = 0,28.'
    },
    stack_sum: {
      name: 'Перевернули каждую дробь по отдельности',
      rule: 'В многоэтажной дроби сначала считают сумму в знаменателе и только потом переворачивают результат.'
    }
  };

  var NOTE_FLIP1 = 'Здесь перевернули первую дробь, а нужно вторую.';
  var NOTE_MUL_SUM = 'Это умножение числителей и знаменателей, а нужно сложение.';
  var NOTE_MUL_DIV = 'Произведение чисел без запятых нужно делить, а не умножать.';
  var NOTE_STACK1 = 'Складывать нужно сами дроби в знаменателе, а не их знаменатели.';
  var NOTE_STACK2 = 'Так дроби в знаменателе перемножили, а их нужно сложить.';

  var SAPER_ITEMS = [
    { id: 'fd1', trap: 'fracdiv_flip', skill: 'frac_div', minGrade: 6, value: 4.9, answer: '4,9',
      steps: ['[21/5] : [6/7]', '= [21/5] · [6/7]', '= [126/35]', '= 3,6'], err: 1,
      solution: ['[21/5] : [6/7]', '= [21/5] · [7/6]', '= [147/30]', '= 4,9'],
      fixes: [
        { s: '= [21/5] · [7/6]', ok: true },
        { s: '= [5/21] · [6/7]', note: NOTE_FLIP1 },
        { s: '= [21/5] − [6/7]', note: 'Деление нельзя заменить вычитанием.' }
      ],
      hint: 'Посмотри, что стало со второй дробью после замены деления.' },
    { id: 'fd2', trap: 'fracdiv_flip', skill: 'frac_div', minGrade: 6, value: 6, answer: '6',
      steps: ['[9/4] : [3/8]', '= [9/4] · [3/8]', '= [27/32]', '≈ 0,84'], err: 1,
      solution: ['[9/4] : [3/8]', '= [9/4] · [8/3]', '= [72/12]', '= 6'],
      fixes: [
        { s: '= [9/4] · [8/3]', ok: true },
        { s: '= [4/9] · [3/8]', note: NOTE_FLIP1 },
        { s: '= [9/4] + [3/8]', note: 'Деление нельзя заменить сложением.' }
      ],
      hint: 'Посмотри, что стало со второй дробью после замены деления.' },
    { id: 'fa1', trap: 'fracadd_den', skill: 'frac_decimal', minGrade: 5, value: 2.06, answer: '2,06',
      steps: ['[14/25] + [3/2]', '= {14 + 3|25 + 2}', '= [17/27]', '≈ 0,63'], err: 1,
      solution: ['[14/25] + [3/2]', '= [28/50] + [75/50]', '= [103/50]', '= 2,06'],
      fixes: [
        { s: '= [28/50] + [75/50]', ok: true },
        { s: '= {14 · 3|25 · 2}', note: NOTE_MUL_SUM },
        { s: '= [14/25] + [2/3]', note: 'Вторую дробь переворачивать не нужно.' }
      ],
      hint: 'Посмотри, как сложили дроби с разными знаменателями.' },
    { id: 'fa2', trap: 'fracadd_den', skill: 'frac_decimal', minGrade: 5, value: 0.65, answer: '0,65',
      steps: ['[1/4] + [2/5]', '= {1 + 2|4 + 5}', '= [3/9]', '≈ 0,33'], err: 1,
      solution: ['[1/4] + [2/5]', '= [5/20] + [8/20]', '= [13/20]', '= 0,65'],
      fixes: [
        { s: '= [5/20] + [8/20]', ok: true },
        { s: '= {1 · 2|4 · 5}', note: NOTE_MUL_SUM },
        { s: '= [4/1] + [5/2]', note: 'Дроби переворачивать не нужно.' }
      ],
      hint: 'Посмотри, как сложили дроби с разными знаменателями.' },
    { id: 'dm1', trap: 'decmul_comma', skill: 'dec_mul', minGrade: 5, value: 8.16, answer: '8,16',
      steps: ['1,6 · 5,1', '= 16 · 51 : 10', '= 816 : 10', '= 81,6'], err: 1,
      solution: ['1,6 · 5,1', '= 16 · 51 : 100', '= 816 : 100', '= 8,16'],
      fixes: [
        { s: '= 16 · 51 : 100', ok: true },
        { s: '= 16 · 51 · 10', note: NOTE_MUL_DIV },
        { s: '= 16 · 51 : 1000', note: 'В множителях два знака после запятой, а не три.' }
      ],
      hint: 'Проверь, на сколько разделили произведение чисел без запятых.' },
    { id: 'dm2', trap: 'decmul_comma', skill: 'dec_mul', minGrade: 5, value: 8.4, answer: '8,4',
      steps: ['2,4 · 3,5', '= 24 · 35 : 10', '= 840 : 10', '= 84'], err: 1,
      solution: ['2,4 · 3,5', '= 24 · 35 : 100', '= 840 : 100', '= 8,4'],
      fixes: [
        { s: '= 24 · 35 : 100', ok: true },
        { s: '= 24 · 35 · 10', note: NOTE_MUL_DIV },
        { s: '= 24 · 35 : 1000', note: 'В множителях два знака после запятой, а не три.' }
      ],
      hint: 'Проверь, на сколько разделили произведение чисел без запятых.' },
    { id: 'sg1', trap: 'sign_lost', skill: 'dec_addsub', minGrade: 6, value: -4.5, answer: '−4,5',
      steps: ['4,9 − 9,4', '= 9,4 − 4,9', '= 4,5'], err: 1,
      solution: ['4,9 − 9,4', '= −(9,4 − 4,9)', '= −4,5'],
      fixes: [
        { s: '= −(9,4 − 4,9)', ok: true },
        { s: '= 4,9 + 9,4', note: 'Вычитание не превращается в сложение.' },
        { s: '= −9,4 − 4,9', note: 'Так получится −14,3: минус нужен только перед скобкой.' }
      ],
      hint: 'Сравни числа: какое больше, и подумай о знаке ответа.' },
    { id: 'sg2', trap: 'sign_lost', skill: 'dec_addsub', minGrade: 6, value: -4.3, answer: '−4,3',
      steps: ['3,2 − 7,5', '= 7,5 − 3,2', '= 4,3'], err: 1,
      solution: ['3,2 − 7,5', '= −(7,5 − 3,2)', '= −4,3'],
      fixes: [
        { s: '= −(7,5 − 3,2)', ok: true },
        { s: '= 3,2 + 7,5', note: 'Вычитание не превращается в сложение.' },
        { s: '= −7,5 − 3,2', note: 'Так получится −10,7: минус нужен только перед скобкой.' }
      ],
      hint: 'Сравни числа: какое больше, и подумай о знаке ответа.' },
    { id: 'dd1', trap: 'decdiv_shift', skill: 'dec_div', minGrade: 5, value: 7, answer: '7',
      steps: ['{8,4|1,2}', '= 84 : 1,2', '= 70'], err: 1,
      solution: ['{8,4|1,2}', '= 84 : 12', '= 7'],
      fixes: [
        { s: '= 84 : 12', ok: true },
        { s: '= 8,4 : 12', note: 'Запятую нужно сдвинуть в обоих числах, а не только в делителе.' },
        { s: '= 840 : 12', note: 'Запятую сдвинули на разное число знаков: в делимом на два, в делителе на один.' }
      ],
      hint: 'Проверь, как перенесли запятую.' },
    { id: 'ok1', trap: null, skill: 'dec_div', minGrade: 5, value: 6, answer: '6',
      steps: ['{9,6|1,6}', '= 96 : 16', '= 6'], err: null,
      solution: ['{9,6|1,6}', '= 96 : 16', '= 6'], fixes: [],
      hint: 'Проверь, как перенесли запятую.' },
    { id: 'ok2', trap: null, skill: 'dec_div', minGrade: 5, value: 2, answer: '2',
      steps: ['{8,2|4,1}', '= 82 : 41', '= 2'], err: null,
      solution: ['{8,2|4,1}', '= 82 : 41', '= 2'], fixes: [],
      hint: 'Проверь, как перенесли запятую.' },
    { id: 'fc1', trap: 'frac_to_dec', skill: 'frac_decimal', minGrade: 5, value: 9.22, answer: '9,22',
      steps: ['[19/2] − [7/25]', '= 9,5 − 0,7', '= 8,8'], err: 1,
      solution: ['[19/2] − [7/25]', '= 9,5 − 0,28', '= 9,22'],
      fixes: [
        { s: '= 9,5 − 0,28', ok: true },
        { s: '= 9,5 − 0,72', note: '7/25 это 28/100, то есть 0,28, а не 0,72.' },
        { s: '= 9,5 − 2,5', note: '2,5 это 5/2, а не 7/25.' }
      ],
      hint: 'Проверь, как вторую дробь превратили в десятичную.' },
    { id: 'st1', trap: 'stack_sum', skill: 'frac_stack', minGrade: 6, value: 17.5, answer: '17,5',
      steps: ['{1|[1/30] + [1/42]}', '= 30 + 42', '= 72'], err: 1,
      solution: ['{1|[1/30] + [1/42]}', '= {1|[7/210] + [5/210]}', '= {1|[12/210]} = [210/12]', '= 17,5'],
      fixes: [
        { s: '= {1|[7/210] + [5/210]}', ok: true },
        { s: '= 1 : [1/72]', note: NOTE_STACK1 },
        { s: '= 30 · 42', note: NOTE_STACK2 }
      ],
      hint: 'Посмотри, что сделали с дробями в знаменателе.' },
    { id: 'st2', trap: 'stack_sum', skill: 'frac_stack', minGrade: 6, value: 7.5, answer: '7,5',
      steps: ['{1|[1/12] + [1/20]}', '= 12 + 20', '= 32'], err: 1,
      solution: ['{1|[1/12] + [1/20]}', '= {1|[5/60] + [3/60]}', '= {1|[8/60]} = [60/8]', '= 7,5'],
      fixes: [
        { s: '= {1|[5/60] + [3/60]}', ok: true },
        { s: '= 1 : [1/32]', note: NOTE_STACK1 },
        { s: '= 12 · 20', note: NOTE_STACK2 }
      ],
      hint: 'Посмотри, что сделали с дробями в знаменателе.' }
  ];

  var NAMES = [
    ['Даня', 'получил'], ['Маша', 'получила'], ['Саша', 'получил'],
    ['Ира', 'получила'], ['Миша', 'получил'], ['Аня', 'получила']
  ];

  function prepareItem(it) {
    var who = pick(NAMES);
    return Object.assign({}, it, {
      who: who[0], verb: who[1],
      fixes: shuffle(it.fixes || []),
      final: it.steps[it.steps.length - 1].replace(/^[=≈]\s*/, '')
    });
  }

  function makeSaperRound(grade, n) {
    n = n || 5;
    var pool = SAPER_ITEMS.filter(function (it) { return it.minGrade <= grade; });
    var oks = shuffle(pool.filter(function (it) { return it.err === null; }));
    var errs = shuffle(pool.filter(function (it) { return it.err !== null; }));
    var nOk = Math.min(oks.length, n >= 8 && grade < 6 ? 2 : 1);
    var nErr = Math.min(errs.length, n - nOk);
    return shuffle(errs.slice(0, nErr).concat(oks.slice(0, nOk))).map(prepareItem);
  }

  function trapCount() { return Object.keys(TRAPS).length; }

  /* ---------- очки ---------- */
  function scorePrikidka(o) { /* {estOk, tries, ok, hint} */
    var est = o.estOk ? 10 : 0;
    var exact = o.ok ? (o.tries === 1 ? 20 : 10) : 0;
    var noHint = o.ok && !o.hint ? 5 : 0;
    return { est: est, exact: exact, noHint: noHint, total: est + exact + noHint };
  }
  function scoreSaper(o) { /* {hasError, foundOk, fixOk, wrongTaps, wrongFix, hint} */
    var find = o.foundOk ? Math.max(0, (o.hasError ? 20 : 30) - 10 * o.wrongTaps) : 0;
    var fix = o.hasError && o.fixOk ? Math.max(0, 20 - 10 * o.wrongFix) : 0;
    var noHint = o.foundOk && (!o.hasError || o.fixOk) && !o.hint ? 10 : 0;
    return { find: find, fix: fix, noHint: noHint, total: find + fix + noHint };
  }

  /* ---------- статистика (хранится в localStorage) ---------- */
  function defaultStats() {
    return {
      v: 2, points: 0, grade: 5,
      rounds: { prikidka: 0, saper: 0, numline: 0, conversion: 0, orderops: 0, recipe: 0 },
      best: { prikidka: 0, saper: 0, numline: 0, conversion: 0, orderops: 0, recipe: 0 },
      estimate: { ok: 0, total: 0, caught: 0 },
      exact: { ok: 0, total: 0 },
      skills: {}, traps: {}
    };
  }
  function skillRec(st, id) { return st.skills[id] || (st.skills[id] = { ok: 0, total: 0 }); }
  function trapRec(st, id) { return st.traps[id] || (st.traps[id] = { seen: 0, found: 0, first: 0 }); }

  function recordPrikidka(st, task, r) { /* {estOk, exactFirst, caught, points} */
    st.estimate.total++;
    if (r.estOk) st.estimate.ok++;
    if (r.caught) st.estimate.caught++;
    st.exact.total++;
    if (r.exactFirst) st.exact.ok++;
    var s = skillRec(st, task.skill);
    s.total++;
    if (r.exactFirst) s.ok++;
    st.points += r.points;
  }
  function recordSaper(st, item, r) { /* {found, foundFirst, fixedOk, points} */
    var s = skillRec(st, item.skill);
    s.total++;
    if (r.foundFirst && (item.err === null || r.fixedOk)) s.ok++;
    if (item.trap) {
      var t = trapRec(st, item.trap);
      t.seen++;
      if (r.found) t.found++;
      if (r.foundFirst) t.first++;
    }
    st.points += r.points;
  }
  /* Задания «просто верно/неверно с первой попытки» (числовая прямая, мастерская) */
  function recordSimple(st, task, r) { /* {firstTry, points} */
    var s = skillRec(st, task.skill);
    s.total++;
    if (r.firstTry) s.ok++;
    st.points += r.points;
  }
  /* Старые сохранения (v1) -> v2. В v1 раунды были длиннее, поэтому рекорды сбрасываем. */
  function migrateStats(s) {
    var d = defaultStats();
    if (!s || typeof s !== 'object') return d;
    var m = Object.assign({}, d, s);
    ['rounds', 'best'].forEach(function (k) { m[k] = Object.assign({}, d[k], s[k] || {}); });
    m.estimate = Object.assign({}, d.estimate, s.estimate || {});
    m.exact = Object.assign({}, d.exact, s.exact || {});
    m.skills = s.skills || {}; m.traps = s.traps || {};
    if (s.v !== 2) { m.best = Object.assign({}, d.best); m.v = 2; }
    return m;
  }
  function catalogFound(st) {
    return Object.keys(st.traps).filter(function (k) { return st.traps[k].found > 0 && TRAPS[k]; }).length;
  }

  return {
    MINUS: MINUS, SKILLS: SKILLS, TRAPS: TRAPS, SAPER_ITEMS: SAPER_ITEMS,
    fmt: fmt, parseAnswer: parseAnswer, isCorrect: isCorrect, sig1: sig1, approx: approx,
    buildEstimate: buildEstimate, estimateConflict: estimateConflict,
    generateTask: generateTask, kindsFor: kindsFor,
    makePrikidkaRound: makePrikidkaRound, makeSaperRound: makeSaperRound, trapCount: trapCount,
    scorePrikidka: scorePrikidka, scoreSaper: scoreSaper,
    defaultStats: defaultStats, recordPrikidka: recordPrikidka, recordSaper: recordSaper,
    catalogFound: catalogFound, recordSimple: recordSimple, migrateStats: migrateStats,
    util: { rand: rand, randInt: randInt, pick: pick, shuffle: shuffle, gcd: gcd, round: round, clean: clean }
  };
});
