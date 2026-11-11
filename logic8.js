/* Задания 1–5 (7 класс): сюжеты «План местности», «Квартира», «Печь для бани». Без DOM. Нужны logic.js и logic7.js.
   Каждый сюжет — генератор варианта из пяти заданий в общем формате (см. logic7.js, register15). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { require('./logic.js'); require('./logic7.js'); module.exports = factory(require('./logic.js')); }
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, round = U.round;
  function f(n) { return L.fmt(n); }
  function sp(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function isSq(n) { var r = Math.round(Math.sqrt(n)); return r * r === n; }
  function ceilDiv(a, b) { return Math.ceil(a / b - 1e-9); }

  /* ======================= ПЛАН МЕСТНОСТИ ======================= */
  var MAP_NAMES = [
    ['Ёлочки', 'Сосенки', 'Жуки', 'Кленовое'], ['Ясная', 'Камышевка', 'Хомяково', 'Майское'], ['Грушевка', 'Таловка', 'Новая', 'Абрамово'],
    ['Масловка', 'Весенка', 'Полянка', 'Захарово'], ['Ольховка', 'Берёзки', 'Липки', 'Дубровное'], ['Малиновка', 'Ручьи', 'Озерки', 'Горское'],
    ['Луговая', 'Сокол', 'Каменка', 'Покровское']
  ];
  var MAP_KIDS = ['Володя', 'Полина', 'Гриша', 'Саша', 'Таня', 'Миша', 'Даша', 'Костя'];
  var DAYS = ['понедельник', 'вторник', 'среду', 'четверг', 'пятницу', 'субботу', 'воскресенье'];
  /* пары катетов: (a = AC, c = BC) при общем b = CD, обе гипотенузы целые */
  var MAP_GEOM = (function () {
    var out = [];
    for (var b = 3; b <= 12; b++) for (var a = 4; a <= 16; a++) for (var c = 2; c < a - 1; c++) {
      if (isSq(a * a + b * b) && isSq(c * c + b * b) && a + 1 <= 16) out.push({ a: a, b: b, c: c });
    }
    return out;
  })();

  function makeMap() {
    var g = pick(MAP_GEOM), a = g.a, b = g.b, c = g.c;
    var names = pick(MAP_NAMES), N = { A: names[0], B: names[1], C: names[2], D: names[3] };
    var kid = pick(MAP_KIDS), bike = Math.random() < 0.5, s = bike ? pick([1, 2]) : pick([2, 4]);
    /* точки в клетках: C — вершина прямого угла, A ниже C, D правее C; затем поворот и отражение */
    var P = { A: { x: 0, y: a }, B: { x: 0, y: c }, C: { x: 0, y: 0 }, D: { x: b, y: 0 } };
    var rot = randInt(0, 3), mir = Math.random() < 0.5;
    Object.keys(P).forEach(function (k) {
      var x = P[k].x, y = P[k].y, t;
      if (mir) x = -x;
      for (var i = 0; i < rot; i++) { t = x; x = -y; y = t; }
      P[k] = { x: x, y: y };
    });
    var minX = Math.min(P.A.x, P.B.x, P.C.x, P.D.x), minY = Math.min(P.A.y, P.B.y, P.C.y, P.D.y);
    Object.keys(P).forEach(function (k) { P[k] = { x: P[k].x - minX + 1, y: P[k].y - minY + 1 }; });
    var gw = Math.max(P.A.x, P.B.x, P.C.x, P.D.x) + 1, gh = Math.max(P.A.y, P.B.y, P.C.y, P.D.y) + 1;
    var u = { x: P.C.x - P.A.x, y: P.C.y - P.A.y }, w = { x: P.D.x - P.C.x, y: P.D.y - P.C.y };
    var turn = u.x * w.y - u.y * w.x > 0 ? 'направо' : 'налево';
    var digits = shuffle([1, 2, 3, 4]), lab = { A: digits[0], B: digits[1], C: digits[2], D: digits[3] };
    var road = bike ? 'лесной дорожке' : 'грунтовой дороге', road2 = bike ? 'тропинку' : 'грунтовую дорогу', road2d = bike ? 'тропинке' : 'грунтовой дороге';
    var v1 = bike ? pick([15, 18, 20]) : pick([60, 80, 90]), v2 = bike ? pick([10, 12, 15]) : pick([30, 40, 45]);
    var AC = a * s, CD = b * s, AD = Math.sqrt(a * a + b * b) * s, BD = Math.sqrt(c * c + b * b) * s, AB = (a - c) * s;
    var who = kid + ' с дедушкой';
    var common = [
      kid + ' летом отдыхает у дедушки в деревне ' + N.A + '. В ' + pick(DAYS) + ' они собираются съездить на ' + (bike ? 'велосипедах' : 'машине') + ' в село ' + N.D + '. Из деревни ' + N.A + ' в село ' + N.D +
      ' можно проехать по прямой ' + road + '. Есть более длинный путь: по прямолинейному шоссе через деревню ' + N.B + ' до деревни ' + N.C + ', где нужно повернуть под прямым углом ' + turn +
      ' на другое шоссе, ведущее в село ' + N.D + '. Есть и третий маршрут: в деревне ' + N.B + ' можно свернуть на прямую ' + road2 + ' в село ' + N.D + ', которая идёт мимо пруда.',
      (bike ? 'Лесная дорожка и тропинка образуют' : 'Шоссе и грунтовые дороги образуют') + ' прямоугольные треугольники' + (bike ? ' с шоссе.' : '.'),
      'По шоссе ' + who + ' едут со скоростью ' + v1 + ' км/ч, а по ' + (bike ? 'лесной дорожке и тропинке' : 'грунтовым дорогам') + ' — со скоростью ' + v2 + ' км/ч. На плане изображено взаимное расположение населённых пунктов, длина стороны каждой клетки равна ' + s + ' км.'
    ];
    var NAME = { A: 'д. ' + N.A, B: 'д. ' + N.B, C: 'д. ' + N.C, D: 'с. ' + N.D };
    /* тип 1 */
    var pickK = shuffle(['A', 'B', 'C', 'D']).slice(0, 3);
    var t1 = {
      kind: 'slots', title: 'Какие цифры на плане', skill: 's15_read', fig: 'map', maxVal: 4, paras: [],
      ask: 'Пользуясь описанием, определите, какими цифрами на плане обозначены населённые пункты. Ответ — три цифры подряд.',
      slots: pickK.map(function (k) { return { id: k, name: NAME[k] }; }),
      answer: pickK.map(function (k) { return lab[k]; }).join(''),
      wrong: 'Не сходится. Шоссе с поворотом под прямым углом — это путь через две деревни; дорога мимо пруда начинается в деревне на шоссе. Попробуй ещё раз.',
      explain: 'Прямой угол — у деревни ' + N.C + ' (№ ' + lab.C + '). Шоссе к ней идёт от деревни ' + N.A + ' (№ ' + lab.A + ') через деревню ' + N.B + ' (№ ' + lab.B + '), от которой дорога мимо пруда ведёт в село ' + N.D + ' (№ ' + lab.D + '). Ответ: ' + pickK.map(function (k) { return lab[k]; }).join('') + '.'
    };
    /* тип 2: путь по шоссе через C */
    var t2 = {
      kind: 'steps', title: 'Путь по шоссе', skill: 's15_units', fig: 'map',
      paras: ['Сколько километров проедут ' + who + ' от деревни ' + N.A + ' до села ' + N.D + ', если они поедут по шоссе через деревню ' + N.C + '?'],
      steps: [
        { q: 'Сколько километров от деревни ' + N.A + ' до деревни ' + N.C + ' по шоссе?', unit: 'км', ans: AC, hl: ['AC'], aid: a + ' клеток по ' + s + ' км: ' + a + '·' + s + ' = ' + AC + ' км.', traps: [{ val: a, msg: 'Это число клеток. Умножь на длину клетки: ' + s + ' км.' }] },
        { q: 'А от деревни ' + N.C + ' до села ' + N.D + '?', unit: 'км', ans: CD, hl: ['CD'], aid: b + ' клеток по ' + s + ' км: ' + CD + ' км.', traps: [{ val: b, msg: 'Это число клеток. Умножь на ' + s + ' км.' }] },
        { q: 'Сколько километров весь путь по шоссе?', unit: 'км', ans: AC + CD, hl: ['AC', 'CD'], aid: AC + ' + ' + CD + ' = ' + (AC + CD) + ' км.', traps: [{ val: AD, msg: 'Это путь по прямой. По шоссе едут через поворот: сложи два участка.' }] }
      ], answer: String(AC + CD),
      explain: 'По шоссе ' + a + ' + ' + b + ' = ' + (a + b) + ' клеток, по ' + s + ' км: ' + (AC + CD) + ' км.'
    };
    /* тип 3: по прямой */
    var useB = Math.random() < 0.4, from = useB ? 'B' : 'A', leg = useB ? c : a, hyp = useB ? BD : AD, legKm = leg * s;
    var t3 = {
      kind: 'steps', title: 'Расстояние по прямой', skill: 's15_pyth', fig: 'map',
      paras: ['Найдите расстояние от деревни ' + N[from] + ' до села ' + N.D + ' по прямой. Ответ дайте в километрах.'],
      steps: [
        { q: 'Первый катет: сколько километров от деревни ' + N[from] + ' до деревни ' + N.C + '?', unit: 'км', ans: legKm, hl: [from + 'C'], aid: leg + ' клеток · ' + s + ' км = ' + legKm + ' км.', traps: [{ val: leg, msg: 'Это клетки, а нужны километры.' }] },
        { q: 'Второй катет: от деревни ' + N.C + ' до села ' + N.D + '?', unit: 'км', ans: CD, hl: ['CD'], aid: b + ' клеток · ' + s + ' км = ' + CD + ' км.', traps: [{ val: b, msg: 'Это клетки, а нужны километры.' }] },
        { q: 'Найдите расстояние по прямой (гипотенузу).', unit: 'км', ans: hyp, hl: [from + 'D'], aid: '√(' + legKm + '² + ' + CD + '²) = √' + (legKm * legKm + CD * CD) + ' = ' + hyp + ' км.', traps: [{ val: legKm + CD, msg: 'Катеты не складывают. Гипотенуза — корень из суммы их квадратов.' }] }
      ], answer: String(hyp),
      explain: 'Прямоугольный треугольник с катетами ' + legKm + ' км и ' + CD + ' км: √(' + legKm + '² + ' + CD + '²) = ' + hyp + ' км.'
    };
    /* тип 4: время в пути */
    var opts = [], t4;
    function mins(d, v) { return d / v * 60; }
    var mDirect = mins(AD, v2), mHigh = mins(AC + CD, v1), mB = mins(AB, v1) + mins(BD, v2);
    if (Math.abs(mDirect - Math.round(mDirect)) < 1e-9) opts.push('direct');
    if (Math.abs(mHigh - Math.round(mHigh)) < 1e-9) opts.push('high');
    if (Math.abs(mins(AB, v1) - Math.round(mins(AB, v1))) < 1e-9 && Math.abs(mins(BD, v2) - Math.round(mins(BD, v2))) < 1e-9) opts.push('viaB');
    if (!opts.length) return null;
    var kind4 = pick(opts);
    if (kind4 === 'direct') {
      t4 = { paras: ['Сколько минут затратят на дорогу из деревни ' + N.A + ' в село ' + N.D + ' ' + who + ', если они поедут по прямой ' + road + '?'],
        steps: [
          { q: 'Сколько километров по прямой ' + road + '?', unit: 'км', ans: AD, hl: ['AD'], aid: '√(' + AC + '² + ' + CD + '²) = ' + AD + ' км.', traps: [{ val: AC + CD, msg: 'Это путь по шоссе. По прямой — гипотенуза.' }] },
          { q: 'Сколько минут займёт дорога при скорости ' + v2 + ' км/ч?', unit: 'мин', ans: Math.round(mDirect), hl: ['AD'], aid: AD + ' : ' + v2 + ' ч = ' + AD + '·60 : ' + v2 + ' = ' + Math.round(mDirect) + ' мин.',
            traps: [{ val: round(AD / v2, 4), msg: 'Это время в часах. Переведи в минуты: умножь на 60.' }, { val: Math.round(mins(AD, v1)), msg: 'По ' + road + ' скорость ' + v2 + ' км/ч, а не ' + v1 + '.' }] }
        ], answer: String(Math.round(mDirect)), explain: 'По прямой ' + AD + ' км со скоростью ' + v2 + ' км/ч: ' + AD + ' : ' + v2 + ' · 60 = ' + Math.round(mDirect) + ' мин.' };
    } else if (kind4 === 'high') {
      t4 = { paras: ['Сколько минут затратят на дорогу из деревни ' + N.A + ' в село ' + N.D + ' ' + who + ', если поедут по шоссе через деревню ' + N.C + '?'],
        steps: [
          { q: 'Сколько километров путь по шоссе?', unit: 'км', ans: AC + CD, hl: ['AC', 'CD'], aid: AC + ' + ' + CD + ' = ' + (AC + CD) + ' км.', traps: [{ val: AD, msg: 'Это путь по прямой, а едут по шоссе с поворотом.' }] },
          { q: 'Сколько минут займёт дорога при скорости ' + v1 + ' км/ч?', unit: 'мин', ans: Math.round(mHigh), hl: ['AC', 'CD'], aid: (AC + CD) + ' : ' + v1 + ' ч = ' + Math.round(mHigh) + ' мин.',
            traps: [{ val: round((AC + CD) / v1, 4), msg: 'Это время в часах. Переведи в минуты: умножь на 60.' }, { val: Math.round(mins(AC + CD, v2)), msg: 'По шоссе скорость ' + v1 + ' км/ч.' }] }
        ], answer: String(Math.round(mHigh)), explain: 'По шоссе ' + (AC + CD) + ' км со скоростью ' + v1 + ' км/ч: ' + (AC + CD) + ' : ' + v1 + ' · 60 = ' + Math.round(mHigh) + ' мин.' };
    } else {
      var m1 = Math.round(mins(AB, v1)), m2 = Math.round(mins(BD, v2));
      t4 = { paras: ['Сколько минут затратят на дорогу из деревни ' + N.A + ' в село ' + N.D + ' ' + who + ', если поедут по шоссе до деревни ' + N.B + ', а дальше — по ' + road2d + ' мимо пруда?'],
        steps: [
          { q: 'Сколько минут по шоссе от деревни ' + N.A + ' до деревни ' + N.B + '? Расстояние ' + (a - c) + ' клеток.', unit: 'мин', ans: m1, hl: ['AB'], aid: AB + ' км : ' + v1 + ' км/ч · 60 = ' + m1 + ' мин.', traps: [{ val: round(AB / v1, 4), msg: 'Это часы. Нужны минуты.' }] },
          { q: 'Сколько километров от деревни ' + N.B + ' до села ' + N.D + ' мимо пруда?', unit: 'км', ans: BD, hl: ['BD'], aid: '√(' + (c * s) + '² + ' + CD + '²) = ' + BD + ' км.', traps: [{ val: c * s + CD, msg: 'Это путь по шоссе. Мимо пруда — по прямой, гипотенуза.' }] },
          { q: 'Сколько минут займёт этот участок при скорости ' + v2 + ' км/ч?', unit: 'мин', ans: m2, hl: ['BD'], aid: BD + ' : ' + v2 + ' · 60 = ' + m2 + ' мин.', traps: [{ val: Math.round(mins(BD, v1)), msg: 'Мимо пруда скорость ' + v2 + ' км/ч.' }] },
          { q: 'Сколько минут вся дорога?', unit: 'мин', ans: m1 + m2, hl: ['AB', 'BD'], aid: m1 + ' + ' + m2 + ' = ' + (m1 + m2) + ' мин.', traps: [] }
        ], answer: String(m1 + m2), explain: 'По шоссе ' + AB + ' км: ' + m1 + ' мин; мимо пруда ' + BD + ' км: ' + m2 + ' мин. Всего ' + (m1 + m2) + ' мин.' };
    }
    t4.kind = 'steps'; t4.title = 'Время в пути'; t4.skill = 's15_motion'; t4.fig = 'map';
    /* тип 5: продукты */
    var PROD = [['Молоко (1 л)', 30, 55, 'л молока'], ['Хлеб (1 батон)', 18, 35, 'батона хлеба'], ['Сыр «Российский» (1 кг)', 250, 340, 'кг сыра «Российский»'], ['Говядина (1 кг)', 330, 460, 'кг говядины'], ['Картофель (1 кг)', 10, 35, 'кг картофеля']];
    var shops = ['A', 'D', 'B', 'C'], price = PROD.map(function (p) { return shops.map(function () { return randInt(p[1], p[2]); }); });
    var basket = shuffle([0, 1, 2, 3, 4]).slice(0, 3).sort().map(function (i) { return { i: i, q: randInt(2, 5) }; });
    var tot = shops.map(function (sh, j) { return basket.reduce(function (sum, it) { return sum + it.q * price[it.i][j]; }, 0); });
    var sorted = tot.slice().sort(function (x, y) { return x - y; });
    if (sorted[1] - sorted[0] < 5) return null;
    var best = tot.indexOf(sorted[0]);
    var naive = shops.map(function (sh, j) { return basket.reduce(function (sum, it) { return sum + price[it.i][j]; }, 0); });
    var basketText = basket.map(function (it) { return it.q + ' ' + (it.i === 1 ? (it.q >= 5 ? 'батонов хлеба' : 'батона хлеба') : PROD[it.i][3]); }).join(', ').replace(/, ([^,]*)$/, ' и $1');
    var t5 = {
      kind: 'steps', title: 'Где дешевле', skill: 's15_money', fig: null,
      paras: ['В таблице указана стоимость (в рублях) некоторых продуктов в четырёх магазинах, расположенных в деревне ' + N.A + ', селе ' + N.D + ', деревне ' + N.B + ' и деревне ' + N.C + '.',
        who + ' хотят купить ' + basketText + '. В каком магазине такой набор продуктов будет стоить дешевле всего? В ответ запишите стоимость данного набора в этом магазине.'],
      tables: [{ head: ['Наименование продукта'].concat(shops.map(function (k) { return NAME[k]; })), rows: PROD.map(function (p, i) { return [p[0]].concat(price[i].map(String)); }) }],
      steps: shops.map(function (k, j) {
        return { q: 'Сколько стоит набор в магазине: ' + NAME[k] + '?', unit: 'руб.', ans: tot[j], hl: [], aid: basket.map(function (it) { return it.q + '·' + price[it.i][j]; }).join(' + ') + ' = ' + tot[j] + ' руб.',
          traps: [{ val: naive[j], msg: 'Сложены цены за единицу. Умножь каждую цену на количество.' }] };
      }).concat([{ q: 'Какова стоимость набора в самом дешёвом магазине?', unit: 'руб.', ans: sorted[0], hl: [], aid: 'Сравни четыре суммы: ' + tot.join(', ') + '. Меньше всех ' + sorted[0] + ' (' + NAME[shops[best]] + ').',
        traps: tot.filter(function (x) { return x !== sorted[0]; }).map(function (x) { return { val: x, msg: 'Это не самый дешёвый магазин. Найди наименьшую сумму.' }; }) }]),
      answer: String(sorted[0]),
      explain: shops.map(function (k, j) { return NAME[k] + ': ' + tot[j]; }).join('; ') + '. Дешевле всего — ' + NAME[shops[best]] + ', ' + sorted[0] + ' руб.'
    };
    return {
      ctx: 'map', name: 'План местности', done: 'Поездка спланирована', common: common,
      grid: { w: gw, h: gh, s: s }, P: P, label: lab, names: N, a: a, b: b, c: c, s: s, v1: v1, v2: v2, turn: turn, bike: bike,
      tasks: [t1, t2, t3, t4, t5]
    };
  }

  /* ======================= КВАРТИРА ======================= */
  var CELL = 0.4;
  function makeFlat() {
    var kw = randInt(6, 8), lw = randInt(11, 14), bw = randInt(7, 9), rh = randInt(9, 12), ch = randInt(5, 6), sw = randInt(5, 7), kl = randInt(3, 4);
    var lh1 = randInt(3, 4), lh2 = randInt(3, 4), lg1w = kw - randInt(0, 1), lg2w = bw - randInt(0, 2);
    if (lg1w * lh1 === lg2w * lh2) return null;
    var W = kw + lw + bw, LH = Math.max(lh1, lh2), Y1 = LH + rh, Y2 = Y1 + ch, H = Y2;
    function R(x0, y0, x1, y1) { return { x0: x0, y0: y0, x1: x1, y1: y1 }; }
    var rooms = {
      kitchen: R(0, LH, kw, Y1), living: R(kw, LH, kw + lw, Y1), bedroom: R(kw + lw, LH, W, Y1),
      bath: R(0, Y1, sw, Y2), corridor: R(sw, Y1, W - kl, Y2), store: R(W - kl, Y1, W, Y2),
      loggia1: R(0, LH - lh1, lg1w, LH), loggia2: R(W - lg2w, LH - lh2, W, LH)
    };
    /* двери: отрезки на стенах, в клетках (горизонтальные: y, x0..x1; вертикальные: x, y0..y1) */
    var doors = [
      { h: true, y: Y2, a: sw + 1, b: sw + 3, entry: true },
      { h: false, x: sw, a: Y1 + 1, b: Y1 + 3 },
      { h: false, x: W - kl, a: Y1 + 1, b: Y1 + 3 },
      { h: true, y: Y1, a: kw + lw + 1, b: kw + lw + 3 },
      { h: true, y: Y1, a: kw + 3, b: kw + 5 },
      { h: false, x: kw, a: LH + 3, b: LH + 5 },
      { h: true, y: LH, a: 1, b: 3 },
      { h: true, y: LH, a: W - lg2w + 1, b: W - lg2w + 3 }
    ];
    if (kw + 5 > W - kl - 1) return null;
    var fx = Math.random() < 0.5, fy = Math.random() < 0.5;
    function FR(r) { return R(fx ? W - r.x1 : r.x0, fy ? H - r.y1 : r.y0, fx ? W - r.x0 : r.x1, fy ? H - r.y0 : r.y1); }
    Object.keys(rooms).forEach(function (k) { rooms[k] = FR(rooms[k]); });
    doors = doors.map(function (d) {
      if (d.h) return { h: true, y: fy ? H - d.y : d.y, a: fx ? W - d.b : d.a, b: fx ? W - d.a : d.b, entry: d.entry };
      return { h: false, x: fx ? W - d.x : d.x, a: fy ? H - d.b : d.a, b: fy ? H - d.a : d.b };
    });
    var side = fx === fy ? 'Слева' : 'Справа';
    var ids = ['corridor', 'bath', 'store', 'bedroom', 'living', 'kitchen', 'loggia1', 'loggia2'];
    var nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8]), lab = {};
    ids.forEach(function (k, i) { lab[k] = nums[i]; });
    var RN = { corridor: 'коридор', bath: 'санузел', store: 'кладовая', bedroom: 'спальня', living: 'гостиная', kitchen: 'кухня' };
    var RG = { corridor: 'коридора', bath: 'санузла', store: 'кладовой', bedroom: 'спальни', living: 'гостиной', kitchen: 'кухни', loggia1: 'лоджии', loggia2: 'лоджии' };
    var RP = { bedroom: 'в спальне', living: 'в гостиной', kitchen: 'на кухне' };
    function cells(k) { var r = rooms[k]; return (r.x1 - r.x0) * (r.y1 - r.y0); }
    if (['corridor', 'bath', 'store', 'bedroom', 'kitchen', 'loggia1', 'loggia2'].some(function (k) { return cells(k) >= cells('living'); })) return null;
    function dims(k) { var r = rooms[k]; return [r.x1 - r.x0, r.y1 - r.y0]; }
    var common = [
      'На рисунке изображён план двухкомнатной квартиры в многоэтажном жилом доме. Сторона одной клетки на плане соответствует 0,4 м, а условные обозначения двери и окна приведены рядом с планом.',
      'Вход в квартиру находится в коридоре. ' + side + ' от входа в квартиру находится санузел, а в противоположном конце коридора — дверь в кладовую. Рядом с кладовой находится спальня, из которой можно пройти на одну из застеклённых лоджий. Самое большое по площади помещение — гостиная, откуда можно попасть в коридор и на кухню. Из кухни также можно попасть на застеклённую лоджию.'
    ];
    /* тип 1 */
    var pk = shuffle(['corridor', 'bath', 'store', 'bedroom', 'living', 'kitchen']).slice(0, 4);
    var t1 = {
      kind: 'slots', title: 'Комнаты на плане', skill: 's15_read', fig: 'flat', maxVal: 8, paras: [],
      ask: 'Для объектов в полях определите, какими цифрами они обозначены на плане. Ответ — четыре цифры подряд.',
      slots: pk.map(function (k) { return { id: k, name: RN[k] }; }), answer: pk.map(function (k) { return lab[k]; }).join(''),
      wrong: 'Не сходится. Встань у входной двери лицом в квартиру: «слева» и «справа» считают так. Двери показывают, какие комнаты соединены. Попробуй ещё раз.',
      explain: 'Вход — в коридоре (№ ' + lab.corridor + '). ' + side + ' от входа санузел (№ ' + lab.bath + '), в конце коридора кладовая (№ ' + lab.store + '), рядом спальня с выходом на лоджию (№ ' + lab.bedroom + '). Самая большая комната — гостиная (№ ' + lab.living + '), из неё дверь на кухню (№ ' + lab.kitchen + '). Ответ: ' + pk.map(function (k) { return lab[k]; }).join('') + '.'
    };
    /* тип 2: паркет */
    var room = pick(['kitchen', 'living', 'bedroom']), dm = dims(room), nc = cells(room);
    var board = pick([{ t: '40 см на 40 см', pack: 12 }, { t: '20 см на 80 см', pack: 14 }, { t: '40 см на 40 см', pack: pick([10, 16]) }]);
    var packs = ceilDiv(nc, board.pack);
    var t2 = {
      kind: 'steps', title: 'Паркет', skill: 's15_round', fig: 'flat',
      paras: ['Паркетная доска размером ' + board.t + ' продаётся в упаковках по ' + board.pack + ' штук. Сколько упаковок паркетной доски понадобилось, чтобы выложить пол ' + RP[room] + '?'],
      steps: [
        { q: 'Сколько клеток занимает пол ' + RG[room] + '? Сторона клетки — 0,4 м.', unit: 'клеток', ans: nc, hl: [room], aid: 'Комната ' + dm[0] + ' × ' + dm[1] + ' клеток: ' + dm[0] + '·' + dm[1] + ' = ' + nc + '.', traps: [{ val: dm[0] + dm[1], msg: 'Стороны нужно перемножить, а не сложить.' }] },
        { q: 'Сколько досок ' + board.t + ' нужно? Площадь одной клетки 0,4·0,4 = 0,16 м².', unit: 'досок', ans: nc, hl: [room], aid: 'Доска ' + board.t + ' имеет площадь ' + (board.pack === 14 ? '0,2·0,8' : '0,4·0,4') + ' = 0,16 м² — ровно одна клетка. Досок столько же, сколько клеток: ' + nc + '.',
          traps: [{ val: round(nc * 0.16, 2), msg: 'Это площадь пола в м². А нужно число досок: одна доска закрывает одну клетку.' }] },
        { q: 'Сколько упаковок по ' + board.pack + ' штук нужно купить?', unit: 'упаковок', ans: packs, hl: [room], aid: nc + ' : ' + board.pack + ' = ' + f(round(nc / board.pack, 2)) + '. Неполную упаковку тоже покупают: ' + packs + '.',
          traps: [{ val: Math.floor(nc / board.pack), msg: 'Округлили вниз: досок не хватит. Округляй вверх.' }] }
      ], answer: String(packs), explain: 'Пол — ' + nc + ' клеток, по одной доске на клетку. ' + nc + ' : ' + board.pack + ' → ' + packs + ' упаковок (округляем вверх).'
    };
    /* тип 3: площадь лоджии */
    var big = cells('loggia1') > cells('loggia2') ? 'loggia1' : 'loggia2', small = big === 'loggia1' ? 'loggia2' : 'loggia1';
    var lgK = pick([big, small]), ld = dims(lgK), la = round(ld[0] * CELL * ld[1] * CELL, 2);
    var t3 = {
      kind: 'steps', title: 'Площадь лоджии', skill: 's15_area', fig: 'flat',
      paras: ['Найдите площадь ' + (lgK === big ? 'большей' : 'меньшей') + ' лоджии. Ответ дайте в квадратных метрах.'],
      steps: [
        { q: 'Какова длина ' + (lgK === big ? 'большей' : 'меньшей') + ' лоджии в метрах?', unit: 'м', ans: round(ld[0] * CELL, 2), hl: [lgK], aid: ld[0] + ' клеток · 0,4 м = ' + f(round(ld[0] * CELL, 2)) + ' м.', traps: [{ val: ld[0], msg: 'Это клетки. Умножь на 0,4 м.' }, { val: round(ld[1] * CELL, 2), msg: 'Это другая сторона лоджии.' }] },
        { q: 'А ширина в метрах?', unit: 'м', ans: round(ld[1] * CELL, 2), hl: [lgK], aid: ld[1] + ' клеток · 0,4 м = ' + f(round(ld[1] * CELL, 2)) + ' м.', traps: [{ val: ld[1], msg: 'Это клетки. Умножь на 0,4 м.' }] },
        { q: 'Найдите площадь лоджии в квадратных метрах.', unit: 'м²', ans: la, hl: [lgK], aid: f(round(ld[0] * CELL, 2)) + '·' + f(round(ld[1] * CELL, 2)) + ' = ' + f(la) + ' м².', traps: [{ val: ld[0] * ld[1], msg: 'Это число клеток. Площадь клетки 0,16 м².' }, { val: round(ld[0] * ld[1] * CELL, 2), msg: 'На 0,4 умножена только одна сторона. Площадь клетки 0,4·0,4 = 0,16 м².' }] }
      ], answer: String(la), explain: 'Лоджия ' + ld[0] + ' × ' + ld[1] + ' клеток, то есть ' + f(round(ld[0] * CELL, 2)) + ' × ' + f(round(ld[1] * CELL, 2)) + ' м: площадь ' + f(la) + ' м².'
    };
    /* тип 4: на сколько процентов больше */
    var PAIRS = [['kitchen', 'bath'], ['bedroom', 'kitchen'], ['living', 'bedroom'], ['kitchen', 'store'], ['bedroom', 'bath'], ['living', 'kitchen']];
    var pr = null;
    shuffle(PAIRS).some(function (p) {
      var A = cells(p[0]), B = cells(p[1]); if (A <= B) return false;
      var pc = (A - B) / B * 100, fr = pc - Math.floor(pc);
      if (Math.abs(fr - 0.5) < 0.08) return false;
      pr = { a: p[0], b: p[1], A: A, B: B, pc: pc }; return true;
    });
    if (!pr) return null;
    var pcR = Math.round(pr.pc), exact = Math.abs(pr.pc - pcR) < 1e-9;
    var t4 = {
      kind: 'steps', title: 'На сколько процентов больше', skill: 's15_pct', fig: 'flat',
      paras: ['На сколько процентов площадь ' + RG[pr.a] + ' больше площади ' + RG[pr.b] + '?' + (exact ? '' : ' Ответ округлите до целого числа.')],
      steps: [
        { q: 'Сколько клеток занимает ' + RN[pr.a] + '?', unit: 'клеток', ans: pr.A, hl: [pr.a], aid: dims(pr.a).join(' · ') + ' = ' + pr.A + '. Проценты можно считать прямо в клетках: масштаб сокращается.', traps: [] },
        { q: 'А ' + RN[pr.b] + '?', unit: 'клеток', ans: pr.B, hl: [pr.b], aid: dims(pr.b).join(' · ') + ' = ' + pr.B + '.', traps: [] },
        { q: 'На сколько процентов первая площадь больше второй?' + (exact ? '' : ' Округлите до целого.'), unit: '%', ans: pcR, hl: [pr.a, pr.b], aid: 'За 100% берём то, с чем сравнивают — ' + RN[pr.b] + ': (' + pr.A + ' − ' + pr.B + ') : ' + pr.B + ' · 100 = ' + f(round(pr.pc, 2)) + '%' + (exact ? '.' : ' ≈ ' + pcR + '%.'),
          traps: [{ val: Math.round((pr.A - pr.B) / pr.A * 100), msg: 'За 100% взята большая площадь. Сравнивают с ' + RG[pr.b] + ' — её и берём за 100%.' }, { val: Math.round(pr.A / pr.B * 100), msg: 'Это сколько процентов составляет одна площадь от другой. Вычти 100%.' }] }
      ], answer: String(pcR), explain: '(' + pr.A + ' − ' + pr.B + ') : ' + pr.B + ' · 100% = ' + f(round(pr.pc, 2)) + '%' + (exact ? '.' : ' ≈ ' + pcR + '%.')
    };
    /* тип 5: интернет */
    var t5 = internetTask('В квартире планируется подключить интернет.', 'Предполагается, что трафик составит', 'Сколько рублей нужно будет заплатить за интернет за месяц, если трафик действительно будет равен');
    if (!t5) return null;
    return {
      ctx: 'flat', name: 'Квартира', done: 'Квартира обустроена', common: common,
      W: W, H: H, rooms: rooms, doors: doors, label: lab, side: side, flip: { x: fx, y: fy }, tasks: [t1, t2, t3, t4, t5]
    };
  }

  /* три тарифных плана интернета: «X» и «Y» с пакетом и безлимит (или план без абонентской платы) */
  function internetTask(lead, mid, ask) {
    var X = pick([200, 300, 500, 600, 800]), Y = X + pick([200, 300, 400, 500]);
    var F1 = X + pick([-100, 0, 50, 100]) , p1 = pick([1.5, 2, 2.5, 3]), F2 = F1 + pick([100, 150, 200, 250]), p2 = pick([1, 1.2, 1.5]);
    var zero = Math.random() < 0.35, pz = pick([1.5, 2, 2.5]), F3 = F2 + pick([50, 100, 150]);
    var T = pick([X + pick([50, 100, 150]), Y + pick([50, 100]), X - 50]);
    if (T <= 0) return null;
    function cost(F, lim, p) { return F + Math.max(0, T - lim) * p; }
    var plans = [
      { n: '«' + X + '»', fee: F1 + ' руб. за ' + X + ' Мб трафика в месяц', over: f(p1) + ' руб. за 1 Мб сверх ' + X + ' Мб', c: cost(F1, X, p1), naive: F1 + T * p1, over0: Math.max(0, T - X), p: p1, F: F1, lim: X },
      { n: '«' + Y + '»', fee: F2 + ' руб. за ' + Y + ' Мб трафика в месяц', over: f(p2) + ' руб. за 1 Мб сверх ' + Y + ' Мб', c: cost(F2, Y, p2), naive: F2 + T * p2, over0: Math.max(0, T - Y), p: p2, F: F2, lim: Y },
      zero ? { n: '«0»', fee: 'нет', over: f(pz) + ' руб. за 1 Мб', c: round(T * pz, 2), naive: null, over0: T, p: pz, F: 0, lim: 0 }
        : { n: '«Безлимитный»', fee: F3 + ' руб. за неограниченное количество Мб трафика', over: '—', c: F3, naive: null, over0: 0, p: 0, F: F3, lim: Infinity }
    ];
    plans.forEach(function (p) { p.c = round(p.c, 2); });
    var cs = plans.map(function (p) { return p.c; }), srt = cs.slice().sort(function (a, b) { return a - b; });
    if (srt[1] - srt[0] < 20 || srt[0] !== Math.round(srt[0])) return null;
    var best = cs.indexOf(srt[0]);
    var steps = plans.map(function (p) {
      var how = p.lim === Infinity ? 'Безлимитный: только абонентская плата ' + p.c + ' руб.' : p.lim === 0 ? T + ' Мб · ' + f(p.p) + ' руб. = ' + f(p.c) + ' руб.'
        : p.over0 ? p.F + ' + (' + T + ' − ' + p.lim + ')·' + f(p.p) + ' = ' + p.F + ' + ' + f(round(p.over0 * p.p, 2)) + ' = ' + f(p.c) + ' руб.' : 'Трафик ' + T + ' Мб укладывается в ' + p.lim + ' Мб: платим только ' + p.F + ' руб.';
      var tr = [];
      if (p.naive !== null && p.over0) tr.push({ val: round(p.naive, 2), msg: 'Сверх пакета платят только за ' + p.over0 + ' Мб, а не за весь трафик.' });
      if (p.over0 && p.F) tr.push({ val: round(p.over0 * p.p, 2), msg: 'Не забудь абонентскую плату ' + p.F + ' руб.' });
      return { q: 'Сколько рублей в месяц по плану ' + p.n + '?', unit: 'руб.', ans: p.c, hl: [], aid: how, traps: tr };
    });
    steps.push({ q: 'Сколько рублей нужно заплатить по самому дешёвому плану?', unit: 'руб.', ans: srt[0], hl: [], aid: 'Сравни: ' + cs.map(f).join(', ') + '. Меньше всех ' + srt[0] + ' руб. (план ' + plans[best].n + ').',
      traps: cs.filter(function (x) { return x !== srt[0]; }).map(function (x) { return { val: x, msg: 'Это не самый дешёвый план. Выбери наименьшую сумму.' }; }) });
    return {
      kind: 'steps', title: 'Выгодный тариф', skill: 's15_money', fig: null,
      paras: [lead + ' ' + mid + ' ' + T + ' Мб в месяц, и исходя из этого выбирается наиболее дешёвый вариант. Интернет-провайдер предлагает три тарифных плана.', ask + ' ' + T + ' Мб?'],
      tables: [{ head: ['Тарифный план', 'Абонентская плата', 'Плата за трафик'], rows: plans.map(function (p) { return [(p.n === '«0»' || p.n === '«Безлимитный»' ? '' : 'План ') + p.n, p.fee, p.over]; }) }],
      steps: steps, answer: String(srt[0]), traffic: T, plans: plans,
      explain: plans.map(function (p) { return p.n + ': ' + f(p.c) + ' руб.'; }).join('; ') + '. Дешевле всего — ' + srt[0] + ' руб.'
    };
  }

  /* ======================= ПЕЧЬ ДЛЯ БАНИ ======================= */
  var ARCH = (function () {
    var out = [];
    [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]].forEach(function (t) {
      [[t[0], t[1]], [t[1], t[0]]].forEach(function (p) {
        for (var k = 1; k <= 12; k++) {
          var half = p[0] * k, hh = p[1] * k, R = t[2] * k;
          if (half * 2 >= 40 && half * 2 <= 90 && hh >= 20 && hh <= 70) out.push({ half: half, h: hh, R: R });
        }
      });
    });
    return out;
  })();
  function makeStove() {
    var Ln = pick([30, 32, 34, 35, 36, 38, 40]) / 10, Wd = pick([20, 21, 22, 24, 25]) / 10, Hh = pick([20, 21, 22, 24]) / 10;
    var dw = pick([60, 65, 70, 75, 80]), dh = pick([17, 18, 19]) / 10;
    var mins = shuffle([6, 7, 8, 9, 10, 11, 12]).slice(0, 3), maxs = mins.map(function (m) { return m + pick([4, 5, 6, 7]); });
    if (new Set(maxs).size < 3) return null;
    var types = shuffle(['Дровяная', 'Дровяная', 'Электрическая']);
    maxs = maxs.map(function (m, i) { return types[i] === 'Электрическая' && Math.random() < 0.5 ? m + 0.5 : m; });
    var mass = types.map(function (t) { return t === 'Дровяная' ? randInt(36, 60) : randInt(12, 20); });
    if (new Set(mass).size < 3) return null;
    var cost = types.map(function (t) { return (t === 'Дровяная' ? randInt(32, 50) : randInt(26, 36)) * 500; });
    var cable = pick([5000, 6000, 6500, 7000]);
    if (round(Ln * Wd * Hh, 2) !== round(Ln * Wd * Hh, 6) || round(2 * (Ln + Wd) * Hh - dw / 100 * dh, 2) !== round(2 * (Ln + Wd) * Hh - dw / 100 * dh, 6)) return null;
    var V = round(Ln * Wd * Hh, 4), floorA = round(Ln * Wd, 4), per = round(2 * (Ln + Wd), 4), walls = round(per * Hh, 4), door = round(dw / 100 * dh, 4), net = round(walls - door, 4);
    var tbl = { head: ['Номер печи', 'Тип', 'Объём помещения (куб. м)', 'Масса (кг)', 'Стоимость (руб.)'],
      rows: types.map(function (t, i) { return [String(i + 1), t, f(mins[i]) + '–' + f(maxs[i]), String(mass[i]), sp(cost[i])]; }) };
    var common = [
      'Хозяин дачного участка строит баню с парным отделением. Парное отделение имеет размеры: длина ' + f(Ln) + ' м, ширина ' + f(Wd) + ' м, высота ' + f(Hh) + ' м. Окон в парном отделении нет, для доступа внутрь планируется дверь шириной ' + dw + ' см, высота дверного проёма ' + f(dh) + ' м. Для прогрева парного отделения можно использовать электрическую или дровяную печь. В таблице представлены характеристики трёх печей.',
      'Для установки дровяной печи дополнительных затрат не потребуется. Установка электрической печи потребует подведения специального кабеля, что обойдётся в ' + sp(cable) + ' руб.'
    ];
    /* тип 1 */
    var big = Math.random() < 0.4, ends = big ? maxs : mins;
    var order = [0, 1, 2].sort(function (i, j) { return ends[i] - ends[j]; });
    var t1 = {
      kind: 'slots', title: 'Подбор печи', skill: 's15_read', fig: 'stoves', maxVal: 3, paras: [], tables: [tbl],
      ask: 'Установите соответствие между объёмами помещения и номерами печей, для которых данный объём является ' + (big ? 'наибольшим' : 'наименьшим') + ' для отопления помещений. Ответ — три цифры подряд.',
      slots: order.map(function (i) { return { id: 'v' + i, name: 'Объём ' + f(ends[i]) }; }),
      answer: order.map(function (i) { return i + 1; }).join(''),
      wrong: 'Не сходится. ' + (big ? 'Наибольший объём — правая граница диапазона' : 'Наименьший объём — левая граница диапазона') + ', а не любое число внутри. Попробуй ещё раз.',
      explain: (big ? 'Наибольшие объёмы — правые границы: ' : 'Наименьшие объёмы — левые границы: ') + order.map(function (i) { return f(ends[i]) + ' у печи № ' + (i + 1); }).join(', ') + '. Ответ: ' + order.map(function (i) { return i + 1; }).join('') + '.'
    };
    var t2 = {
      kind: 'steps', title: 'Объём парной', skill: 's15_area', fig: 'room',
      paras: ['Найдите объём парного отделения строящейся бани. Ответ дайте в кубических метрах.'],
      steps: [
        { q: 'Какова площадь пола парной?', unit: 'м²', ans: floorA, hl: ['floor'], aid: f(Ln) + '·' + f(Wd) + ' = ' + f(floorA) + ' м².', traps: [{ val: round(Ln + Wd, 4), msg: 'Стороны пола перемножают, а не складывают.' }] },
        { q: 'Найдите объём парной.', unit: 'м³', ans: V, hl: ['box'], aid: f(floorA) + '·' + f(Hh) + ' = ' + f(V) + ' м³.', traps: [{ val: round(Ln + Wd + Hh, 4), msg: 'Объём — произведение трёх измерений, а не сумма.' }] }
      ], answer: String(V), explain: f(Ln) + '·' + f(Wd) + '·' + f(Hh) + ' = ' + f(V) + ' м³.'
    };
    var t3 = {
      kind: 'steps', title: 'Площадь стен', skill: 's15_area', fig: 'room',
      paras: ['Найдите суммарную площадь стен парного отделения строящейся бани (без площади двери). Ответ дайте в квадратных метрах.'],
      steps: [
        { q: 'Каков периметр пола парной?', unit: 'м', ans: per, hl: ['floor'], aid: '2·(' + f(Ln) + ' + ' + f(Wd) + ') = ' + f(per) + ' м.', traps: [{ val: round(Ln + Wd, 4), msg: 'Это половина периметра. Стен четыре: умножь на 2.' }] },
        { q: 'Какова площадь всех четырёх стен вместе с дверью?', unit: 'м²', ans: walls, hl: ['walls'], aid: 'Развернём стены в ленту: ' + f(per) + '·' + f(Hh) + ' = ' + f(walls) + ' м².', traps: [{ val: round(walls + 2 * floorA, 4), msg: 'Пол и потолок — не стены.' }] },
        { q: 'Какова площадь двери? Ширина ' + dw + ' см переведи в метры.', unit: 'м²', ans: door, hl: ['door'], aid: f(dw / 100) + '·' + f(dh) + ' = ' + f(door) + ' м².', traps: [{ val: round(dw * dh, 4), msg: 'Ширина двери в сантиметрах. Переведи: ' + dw + ' см = ' + f(dw / 100) + ' м.' }] },
        { q: 'Найдите площадь стен без двери.', unit: 'м²', ans: net, hl: ['walls'], aid: f(walls) + ' − ' + f(door) + ' = ' + f(net) + ' м².', traps: [{ val: walls, msg: 'Дверь не забыли вычесть?' }] }
      ], answer: String(net), explain: '2·(' + f(Ln) + ' + ' + f(Wd) + ')·' + f(Hh) + ' − ' + f(dw / 100) + '·' + f(dh) + ' = ' + f(walls) + ' − ' + f(door) + ' = ' + f(net) + ' м².'
    };
    var si = randInt(0, 2), pct = pick([5, 10, 15, 20, 25]), disc = cost[si] * pct / 100, newP = cost[si] - disc;
    var t4 = {
      kind: 'steps', title: 'Цена со скидкой', skill: 's15_pct', fig: 'stoves', tables: [tbl],
      paras: ['На ' + (types[si] === 'Дровяная' ? 'дровяную' : 'электрическую') + ' печь, масса которой ' + mass[si] + ' кг, сделали скидку ' + pct + '%. Сколько рублей стала стоить печь?'],
      steps: [
        { q: 'Сколько стоила эта печь до скидки? Найди её в таблице по массе.', unit: 'руб.', ans: cost[si], hl: [], aid: 'Масса ' + mass[si] + ' кг — печь № ' + (si + 1) + ', цена ' + sp(cost[si]) + ' руб.', traps: cost.filter(function (c, i) { return i !== si; }).map(function (c) { return { val: c, msg: 'Это цена другой печи. Ищи по массе ' + mass[si] + ' кг.' }; }) },
        { q: 'Сколько рублей составляет скидка ' + pct + '%?', unit: 'руб.', ans: disc, hl: [], aid: sp(cost[si]) + '·' + pct + ' : 100 = ' + sp(disc) + ' руб.', traps: [{ val: pct, msg: 'Скидка ' + pct + '% — это не ' + pct + ' рублей, а ' + pct + ' сотых цены.' }] },
        { q: 'Сколько рублей стала стоить печь?', unit: 'руб.', ans: newP, hl: [], aid: sp(cost[si]) + ' − ' + sp(disc) + ' = ' + sp(newP) + ' руб.', traps: [{ val: cost[si] - pct, msg: 'Вычитают не ' + pct + ' рублей, а ' + pct + '% цены.' }, { val: disc, msg: 'Это размер скидки. Вычти его из цены.' }] }
      ], answer: String(newP), explain: sp(cost[si]) + ' − ' + sp(cost[si]) + '·' + pct + '% = ' + sp(cost[si]) + ' − ' + sp(disc) + ' = ' + sp(newP) + ' руб.'
    };
    var ar = pick(ARCH), width = ar.half * 2;
    var t5 = {
      kind: 'steps', title: 'Радиус арки', skill: 's15_pyth', fig: 'arch', arch: { w: width, h: ar.h, R: ar.R },
      paras: ['Хозяин выбрал дровяную печь. Печь снабжена кожухом вокруг дверцы топки. Верхняя часть кожуха выполнена в виде арки, приваренной к передней стенке печки по дуге окружности с центром в середине нижней части кожуха (см. рисунок). Размеры кожуха в сантиметрах показаны на рисунке. Найдите радиус закругления арки R в сантиметрах.'],
      steps: [
        { q: 'Центр дуги — середина нижней стороны. Сколько сантиметров от центра до боковой стороны кожуха?', unit: 'см', ans: ar.half, hl: ['half'], aid: 'Половина ширины: ' + width + ' : 2 = ' + ar.half + ' см.', traps: [{ val: width, msg: 'Центр стоит посередине: нужна половина ширины.' }] },
        { q: 'Радиус — гипотенуза треугольника с катетами ' + ar.half + ' и ' + ar.h + ' см. Чему равен R²?', unit: 'см²', ans: ar.R * ar.R, hl: ['tri'], aid: ar.half + '² + ' + ar.h + '² = ' + ar.half * ar.half + ' + ' + ar.h * ar.h + ' = ' + ar.R * ar.R + '.', traps: [{ val: ar.half + ar.h, msg: 'Складывают квадраты катетов, а не сами катеты.' }] },
        { q: 'Найдите радиус R.', unit: 'см', ans: ar.R, hl: ['tri'], aid: '√' + ar.R * ar.R + ' = ' + ar.R + ' см.', traps: [{ val: ar.h, msg: 'Это высота боковой стороны. Радиус идёт из центра к верхнему углу боковой стороны.' }, { val: ar.half, msg: 'Это половина ширины, а радиус — гипотенуза.' }] }
      ], answer: String(ar.R), explain: 'R² = ' + ar.half + '² + ' + ar.h + '² = ' + ar.R * ar.R + ', R = ' + ar.R + ' см.'
    };
    return { ctx: 'stove', name: 'Печь для бани', done: 'Парная готова', common: common, room: { L: Ln, W: Wd, H: Hh, dw: dw, dh: dh }, stoves: { mins: mins, maxs: maxs, mass: mass, cost: cost, types: types }, tasks: [t1, t2, t3, t4, t5] };
  }

  function retry(fn, name) { return function () { for (var i = 0; i < 5000; i++) { var v = fn(); if (v) return v; } throw new Error(name + ': не удалось составить вариант'); }; }
  var makeMapV = retry(makeMap, 'План местности'), makeFlatV = retry(makeFlat, 'Квартира'), makeStoveV = retry(makeStove, 'Печь');
  L.register15('map', 'План местности', 'Деревни и магазины', makeMapV);
  L.register15('flat', 'Квартира', 'Комнаты и интернет', makeFlatV);
  L.register15('stove', 'Печь для бани', 'Объём, стены и арка', makeStoveV);
  return Object.assign(L, { internetTask15: internetTask });
});
