/* Задания 1–5 (7 класс): сюжеты «Листы бумаги», «Тарифы», «Шины». Без DOM. Нужны logic.js, logic7.js, logic8.js. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { require('./logic.js'); require('./logic7.js'); require('./logic8.js'); module.exports = factory(require('./logic.js')); }
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, round = U.round;
  function f(n) { return L.fmt(n); }
  function sp(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function retry(fn, name) { return function () { for (var i = 0; i < 5000; i++) { var v = fn(); if (v) return v; } throw new Error(name + ': не удалось составить вариант'); }; }
  function frac(x) { return Math.abs(x - Math.round(x)); }

  /* ======================= ЛИСТЫ БУМАГИ ======================= */
  var A = [[1189, 841], [841, 594], [594, 420], [420, 297], [297, 210], [210, 148], [148, 105]];
  var SQ2 = Math.SQRT2;
  function makePaper() {
    /* тип 1: четыре формата из А1–А6, листы в таблице перемешаны */
    var fm = shuffle([1, 2, 3, 4, 5, 6]).slice(0, 4).sort(function (a, b) { return a - b; });
    var nums = shuffle([1, 2, 3, 4]), numOf = {};
    fm.forEach(function (k, i) { numOf[k] = nums[i]; });
    var rows = [1, 2, 3, 4].map(function (n) { var k = fm[nums.indexOf(n)]; return [String(n), String(A[k][0]), String(A[k][1])]; });
    var tbl = { head: ['Номер листа', 'Длина (мм)', 'Ширина (мм)'], rows: rows };
    var common = [
      'Общепринятые форматы листов бумаги обозначают буквой А и цифрой: А0, А1, А2 и так далее. Лист формата А0 имеет форму прямоугольника, площадь которого равна 1 кв. м. Если лист формата А0 разрезать пополам параллельно меньшей стороне, получится два равных листа формата А1. Если так же лист А1 разрезать пополам, получится два листа формата А2. И так далее.',
      'Отношение длины большей стороны листа к длине меньшей стороны у всех форматов, обозначенных буквой А, одно и то же. Поэтому листы всех форматов подобны друг другу.',
      'В таблице даны размеры (с точностью до мм) четырёх листов, имеющих форматы ' + fm.slice(0, 3).map(function (k) { return 'А' + k; }).join(', ') + ' и А' + fm[3] + '.'
    ];
    var t1 = {
      kind: 'slots', title: 'Какой это формат', skill: 's15_read', fig: 'paper', maxVal: 4, paras: [], tables: [tbl],
      ask: 'Установите соответствие между форматами и номерами листов. Ответ — четыре цифры подряд в порядке форматов.',
      slots: fm.map(function (k) { return { id: 'a' + k, name: 'Формат А' + k }; }), answer: fm.map(function (k) { return numOf[k]; }).join(''),
      wrong: 'Не сходится. Чем больше номер формата, тем меньше лист: длина нового листа равна ширине прежнего. Попробуй ещё раз.',
      explain: 'Размеры уменьшаются вдвое по площади: ' + fm.map(function (k) { return 'А' + k + ' — ' + A[k][0] + '×' + A[k][1] + ' (лист № ' + numOf[k] + ')'; }).join(', ') + '. Ответ: ' + fm.map(function (k) { return numOf[k]; }).join('') + '.'
    };
    /* тип 2: сколько листов Am из An */
    var n2 = randInt(0, 4), m2 = n2 + randInt(1, 3), cnt = Math.pow(2, m2 - n2);
    var t2 = {
      kind: 'steps', title: 'Раскрой листа', skill: 's15_units', fig: 'paper',
      paras: ['Сколько листов формата А' + m2 + ' получится из одного листа формата А' + n2 + '?'],
      steps: [
        { q: 'Сколько раз нужно разрезать пополам каждый лист, чтобы от А' + n2 + ' дойти до А' + m2 + '?', unit: 'раз', ans: m2 - n2, hl: [], aid: 'Каждое разрезание пополам увеличивает номер формата на 1: ' + m2 + ' − ' + n2 + ' = ' + (m2 - n2) + '.', traps: [] },
        { q: 'Сколько листов А' + m2 + ' получится?', unit: 'листов', ans: cnt, hl: [], aid: 'При каждом разрезании листов становится вдвое больше: ' + Array(m2 - n2 + 1).join('2·').slice(0, -1) + ' = ' + cnt + '.',
          traps: [{ val: m2 - n2, msg: 'Это число разрезаний. А листов становится вдвое больше после каждого.' }, { val: 2 * (m2 - n2), msg: 'Листов не прибавляется по 2, а становится вдвое больше: 2, 4, 8…' }] }
      ], answer: String(cnt), explain: 'От А' + n2 + ' до А' + m2 + ' — ' + (m2 - n2) + ' разрезания пополам, листов 2^' + (m2 - n2) + ' = ' + cnt + '.'
    };
    /* тип 3: площадь в см² по размерам из таблицы */
    var k3 = pick(fm), l3 = A[k3][0], w3 = A[k3][1], mm2 = l3 * w3, cm2 = round(mm2 / 100, 2);
    var t3 = {
      kind: 'steps', title: 'Площадь листа', skill: 's15_area', fig: null, tables: [tbl],
      paras: ['Найдите площадь листа формата А' + k3 + '. Ответ дайте в квадратных сантиметрах.'],
      steps: [
        { q: 'Какова длина листа А' + k3 + ' в мм? Найди его номер в таблице.', unit: 'мм', ans: l3, hl: [], aid: 'Лист А' + k3 + ' — № ' + numOf[k3] + ': ' + l3 + ' × ' + w3 + ' мм.', traps: fm.filter(function (k) { return k !== k3; }).map(function (k) { return { val: A[k][0], msg: 'Это длина листа А' + k + '.' }; }) },
        { q: 'А ширина в мм?', unit: 'мм', ans: w3, hl: [], aid: 'Ширина листа А' + k3 + ': ' + w3 + ' мм.', traps: [] },
        { q: 'Найдите площадь в квадратных сантиметрах.', unit: 'см²', ans: cm2, hl: [], aid: l3 + '·' + w3 + ' = ' + sp(mm2) + ' мм². В 1 см² — 100 мм²: ' + sp(mm2) + ' : 100 = ' + f(cm2) + ' см².',
          traps: [{ val: mm2, msg: 'Это квадратные миллиметры. В 1 см² — 100 мм².' }, { val: round(mm2 / 10, 2), msg: 'Для площади делят на 100: 1 см² = 10 мм · 10 мм.' }] }
      ], answer: String(cm2), explain: l3 + '·' + w3 + ' = ' + sp(mm2) + ' мм² = ' + f(cm2) + ' см².'
    };
    /* тип 4: отношение сторон или длина с округлением */
    var k4 = pick(fm), l4 = A[k4][0], w4 = A[k4][1], t4;
    if (Math.random() < 0.6) {
      var inv = Math.random() < 0.5, r = inv ? l4 / w4 : w4 / l4, r1 = round(r, 1);
      t4 = { paras: ['Найдите отношение ' + (inv ? 'большей стороны к меньшей' : 'меньшей стороны к большей') + ' у листа формата А' + k4 + '. Ответ округлите до десятых.'],
        steps: [
          { q: 'Какие стороны у листа А' + k4 + '? Введи большую в мм.', unit: 'мм', ans: l4, hl: [], aid: 'Лист А' + k4 + ' — № ' + numOf[k4] + ': ' + l4 + ' × ' + w4 + ' мм.', traps: [{ val: w4, msg: 'Это меньшая сторона.' }] },
          { q: 'Найдите отношение и округлите до десятых.', unit: '', ans: r1, hl: [], aid: (inv ? l4 + ' : ' + w4 : w4 + ' : ' + l4) + ' = ' + f(round(r, 3)) + '… ≈ ' + f(r1) + '.',
            traps: [{ val: round(1 / r, 1), msg: 'Делили наоборот. «Отношение ' + (inv ? 'большей к меньшей' : 'меньшей к большей') + '»: первое число — делимое.' }] }
        ], answer: String(r1), explain: (inv ? l4 + ' : ' + w4 : w4 + ' : ' + l4) + ' ≈ ' + f(round(r, 3)) + ' ≈ ' + f(r1) + '. У всех форматов это примерно ' + (inv ? '√2 ≈ 1,4' : '0,7') + '.' };
    } else {
      var side = Math.random() < 0.5 ? 'длину' : 'ширину', sv = side === 'длину' ? l4 : w4, sr = Math.round(sv / 10) * 10;
      t4 = { paras: ['Найдите ' + side + ' листа формата А' + k4 + '. Ответ дайте в миллиметрах и округлите до десятков.'],
        steps: [
          { q: 'Чему равна ' + (side === 'длину' ? 'длина' : 'ширина') + ' листа А' + k4 + ' по таблице?', unit: 'мм', ans: sv, hl: [], aid: 'Лист А' + k4 + ' — № ' + numOf[k4] + ': ' + l4 + ' × ' + w4 + ' мм.', traps: [{ val: side === 'длину' ? w4 : l4, msg: 'Это другая сторона.' }] },
          { q: 'Округлите до десятков миллиметров.', unit: 'мм', ans: sr, hl: [], aid: sv + ' ≈ ' + sr + ': смотрим на цифру единиц (' + (sv % 10) + ')' + (sv % 10 >= 5 ? ', она 5 или больше — округляем вверх.' : ', она меньше 5 — округляем вниз.'),
            traps: [{ val: Math.floor(sv / 10) * 10 === sr ? sr + 10 : Math.floor(sv / 10) * 10, msg: 'Округлили не в ту сторону: смотри на цифру единиц.' }] }
        ], answer: String(sr), explain: (side === 'длину' ? 'Длина' : 'Ширина') + ' листа А' + k4 + ' — ' + sv + ' мм ≈ ' + sr + ' мм.' };
    }
    t4.kind = 'steps'; t4.title = 'Стороны листа'; t4.skill = 's15_units'; t4.fig = null; t4.tables = [tbl];
    /* тип 5: масса пачки или размер шрифта */
    var t5;
    if (Math.random() < 0.55) {
      var opts = [];
      [3, 4, 5, 6].forEach(function (k) {
        [500, 400, 250, 200, 100, 80, 50].forEach(function (N) {
          [80, 100, 120, 160, 200].forEach(function (d) {
            var m = N / Math.pow(2, k) * d, area = N / Math.pow(2, k);
            if (Math.abs(m - Math.round(m)) < 1e-9 && round(area, 4) === round(area, 6)) opts.push({ k: k, N: N, d: d, m: Math.round(m), area: round(area, 4) });
          });
        });
      });
      var o = pick(opts), per = Math.pow(2, o.k);
      t5 = { title: 'Масса пачки', paras: ['Плотность бумаги ' + o.d + ' г/м² означает, что квадратный метр бумаги весит ' + o.d + ' г. Сколько граммов весит пачка из ' + o.N + ' листов формата А' + o.k + '?'],
        steps: [
          { q: 'Сколько листов А' + o.k + ' получается из листа А0 площадью 1 м²?', unit: 'листов', ans: per, hl: [], aid: 'Каждое разрезание удваивает число листов: 2^' + o.k + ' = ' + per + '. Значит, лист А' + o.k + ' — это 1/' + per + ' м².', traps: [{ val: o.k, msg: 'Это число разрезаний. Листов вдвое больше после каждого: 2^' + o.k + '.' }] },
          { q: 'Сколько квадратных метров бумаги в пачке из ' + o.N + ' листов?', unit: 'м²', ans: o.area, hl: [], aid: o.N + ' : ' + per + ' = ' + f(o.area) + ' м².', traps: [] },
          { q: 'Сколько граммов весит пачка?', unit: 'г', ans: o.m, hl: [], aid: f(o.area) + '·' + o.d + ' = ' + o.m + ' г.', traps: [{ val: o.N * o.d, msg: 'Плотность дана на 1 м², а лист А' + o.k + ' гораздо меньше квадратного метра.' }] }
        ], answer: String(o.m), explain: 'Лист А' + o.k + ' — 1/' + per + ' м². ' + o.N + ' : ' + per + ' · ' + o.d + ' = ' + o.m + ' г.' };
    } else {
      var up = Math.random() < 0.5, kf = randInt(3, 5), kt = up ? kf - 1 : kf + 1, p0 = null, res = null;
      shuffle([10, 11, 12, 13, 14, 15, 16, 17, 18, 20, 22, 24]).some(function (p) {
        var a = up ? p * SQ2 : p / SQ2, b = up ? p * 1.4 : p / 1.4;
        if (Math.round(a) !== Math.round(b) || Math.abs(frac(a) - 0.5) < 0.1) return false;
        p0 = p; res = Math.round(a); return true;
      });
      if (p0 === null) return null;
      t5 = { title: 'Размер шрифта', paras: ['Бумагу формата А' + kf + ' заменили на бумагу формата А' + kt + '. Текст на листе сохранили, увеличив (или уменьшив) все размеры в одно и то же число раз. Размер шрифта был ' + p0 + ' пунктов. Какой размер шрифта стал? Ответ округлите до целого.'],
        steps: [
          { q: 'Во сколько раз длина листа А' + Math.min(kf, kt) + ' больше длины листа А' + Math.max(kf, kt) + '? Округлите до десятых.', unit: 'раз', ans: 1.4, hl: [], aid: 'Длина А' + Math.min(kf, kt) + ' — ' + A[Math.min(kf, kt)][0] + ' мм, А' + Math.max(kf, kt) + ' — ' + A[Math.max(kf, kt)][0] + ' мм: ' + A[Math.min(kf, kt)][0] + ' : ' + A[Math.max(kf, kt)][0] + ' ≈ 1,4 (это √2).', traps: [{ val: 2, msg: 'Вдвое отличаются площади, а стороны — примерно в 1,4 раза (√2).' }, { val: 0.7, msg: 'Это обратное отношение. Большее делим на меньшее.' }] },
          { q: 'Какой размер шрифта стал? Округлите до целого.', unit: 'пт', ans: res, hl: [], aid: (up ? 'Лист больше — шрифт больше: ' + p0 + '·1,4 ≈ ' + f(round(p0 * SQ2, 2)) : 'Лист меньше — шрифт меньше: ' + p0 + ' : 1,4 ≈ ' + f(round(p0 / SQ2, 2))) + ' ≈ ' + res + '.',
            traps: [{ val: up ? Math.round(p0 / SQ2) : Math.round(p0 * SQ2), msg: up ? 'Лист стал больше — значит, и шрифт должен увеличиться.' : 'Лист стал меньше — значит, и шрифт должен уменьшиться.' }, { val: up ? p0 * 2 : p0 / 2, msg: 'Вдвое меняется площадь, а размеры — в √2 ≈ 1,4 раза.' }] }
        ], answer: String(res), explain: 'Соседние форматы отличаются по размерам в √2 ≈ 1,4 раза. ' + p0 + (up ? '·' : ' : ') + '1,4 ≈ ' + res + ' пт.' };
    }
    t5.kind = 'steps'; t5.skill = 's15_units'; t5.fig = null;
    return { ctx: 'paper', name: 'Листы бумаги', done: 'Бумага разрезана', common: common, formats: fm, numOf: numOf, tasks: [t1, t2, t3, t4, t5] };
  }

  /* ======================= ТАРИФЫ ======================= */
  var MONTHS = ['январе', 'феврале', 'марте', 'апреле', 'мае', 'июне', 'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре'];
  function makeTariff() {
    var F = pick([300, 350, 400, 450]), M = pick([200, 250, 300]), G = pick([2, 2.5, 3]), r = pick([2, 2.5, 3, 4]), c = pick([60, 80, 90, 100, 120]);
    var min = [], gb = [], i;
    for (i = 0; i < 12; i++) { min.push(randInt(4, 17) * 25); gb.push(randInt(2, 17) * 0.25); }
    /* тип 1: четыре значения минут, которые встречаются ровно один раз */
    var once = min.filter(function (x) { return min.indexOf(x) === min.lastIndexOf(x); });
    if (once.length < 5) return null;
    var vals = shuffle(once).slice(0, 4), months = vals.map(function (x) { return min.indexOf(x) + 1; });
    /* тип 2: месяц с перерасходом и минут, и интернета */
    var both = []; for (i = 0; i < 12; i++) if (min[i] > M && gb[i] > G) both.push(i);
    var inPack = 0, overNet = 0; for (i = 0; i < 12; i++) { if (min[i] <= M && gb[i] <= G) inPack++; if (gb[i] > G) overNet++; }
    if (!both.length || inPack < 1 || inPack > 6 || overNet < 2 || overNet > 9) return null;
    var mi = both.indexOf(11) >= 0 && Math.random() < 0.6 ? 11 : pick(both);
    var om = min[mi] - M, og = round(gb[mi] - G, 2), packs = Math.ceil(og / 0.5 - 1e-9), cm = round(om * r, 2), cg = packs * c, total = round(F + cm + cg, 2);
    var common = [
      'На рисунке точками показано количество минут исходящих вызовов и трафик мобильного интернета в гигабайтах, израсходованных абонентом за каждый месяц года. Для удобства точки, соответствующие минутам и гигабайтам, соединены сплошными и пунктирными линиями соответственно.',
      'В течение года абонент пользовался тарифом «Стандартный», абонентская плата по которому составляла ' + F + ' рублей в месяц. В абонентскую плату входят: пакет из ' + M + ' минут исходящих вызовов, пакет из ' + f(G) + ' гигабайт мобильного интернета, пакет из 120 СМС в месяц, безлимитные входящие вызовы. Стоимость минут, интернета и СМС сверх пакета указана в таблице. Абонент не пользовался роумингом. За весь год абонент отправил 110 СМС.'
    ];
    var tPrice = { head: ['Услуга сверх пакета', 'Стоимость'], rows: [['Исходящие вызовы', f(r) + ' руб./мин.'], ['Мобильный интернет (пакет)', c + ' руб. за 0,5 ГБ'], ['СМС', '2 руб./шт.']] };
    var t1 = {
      kind: 'slots', title: 'Месяцы на графике', skill: 's15_read', fig: 'chart', maxVal: 12, paras: [],
      ask: 'Определите, какие месяцы соответствуют указанному количеству исходящих вызовов. Ответ — номера месяцев подряд, без пробелов (например, май, январь, ноябрь, август — это 51118).',
      slots: vals.map(function (x, j) { return { id: 'm' + j, name: x + ' мин.' }; }), answer: months.join(''), vals: months,
      wrong: 'Не сходится. Минуты — сплошная линия и левая шкала, гигабайты — пунктир и правая шкала. Попробуй ещё раз.',
      explain: vals.map(function (x, j) { return x + ' мин. — месяц № ' + months[j]; }).join(', ') + '. Ответ: ' + months.join('') + '.'
    };
    var t2 = {
      kind: 'steps', title: 'Счёт за месяц', skill: 's15_money', fig: 'chart', tables: [tPrice],
      paras: ['Сколько рублей потратил абонент на услуги связи в ' + MONTHS[mi] + '?'],
      steps: [
        { q: 'Сколько минут сверх пакета наговорил абонент в ' + MONTHS[mi] + '?', unit: 'мин', ans: om, hl: ['m' + mi], aid: 'По графику ' + min[mi] + ' мин, в пакете ' + M + ': ' + min[mi] + ' − ' + M + ' = ' + om + '.', traps: [{ val: min[mi], msg: 'Это все минуты за месяц. Платят только за то, что сверх пакета.' }] },
        { q: 'Сколько рублей стоят эти минуты?', unit: 'руб.', ans: cm, hl: [], aid: om + '·' + f(r) + ' = ' + f(cm) + ' руб.', traps: [] },
        { q: 'Сколько пакетов по 0,5 ГБ пришлось докупить? Трафик ' + f(gb[mi]) + ' ГБ при пакете ' + f(G) + ' ГБ.', unit: 'пакетов', ans: packs, hl: ['g' + mi], aid: f(gb[mi]) + ' − ' + f(G) + ' = ' + f(og) + ' ГБ. Пакеты по 0,5 ГБ: ' + f(og) + ' : 0,5 → ' + packs + (packs !== og / 0.5 ? ' (неполный пакет покупают целиком)' : '') + '.',
          traps: [{ val: og, msg: 'Это гигабайты сверх пакета. Посчитай, сколько это пакетов по 0,5 ГБ.' }].concat(packs !== og / 0.5 ? [{ val: Math.floor(og / 0.5), msg: 'Неполный пакет тоже покупают целиком: округляй вверх.' }] : []) },
        { q: 'Сколько рублей заплачено за дополнительный интернет?', unit: 'руб.', ans: cg, hl: [], aid: packs + '·' + c + ' = ' + cg + ' руб.', traps: [{ val: round(og * c, 2), msg: 'Цена ' + c + ' руб. — за пакет 0,5 ГБ, а не за гигабайт.' }] },
        { q: 'Сколько всего потрачено в ' + MONTHS[mi] + '?', unit: 'руб.', ans: total, hl: [], aid: F + ' + ' + f(cm) + ' + ' + cg + ' = ' + f(total) + ' руб. СМС в пакете: за год их всего 110.', traps: [{ val: round(cm + cg, 2), msg: 'Не забудь абонентскую плату ' + F + ' руб.' }] }
      ], answer: String(total), explain: F + ' + ' + om + '·' + f(r) + ' + ' + packs + '·' + c + ' = ' + f(total) + ' руб.'
    };
    var t3;
    if (Math.random() < 0.6) {
      var minOk = min.filter(function (x) { return x <= M; }).length;
      t3 = { paras: ['Сколько месяцев в году расходы по тарифу составили ровно ' + F + ' рублей?'],
        steps: [
          { q: 'В скольких месяцах минуты уложились в пакет (не больше ' + M + ')?', unit: 'мес.', ans: minOk, hl: ['limM'], aid: 'Считаем точки сплошной линии не выше уровня ' + M + ' мин: ' + minOk + '.', traps: [] },
          { q: 'В скольких месяцах и минуты, и интернет (не больше ' + f(G) + ' ГБ) уложились в пакет?', unit: 'мес.', ans: inPack, hl: ['limM', 'limG'], aid: 'Нужно, чтобы обе точки месяца были не выше своих линий: ' + inPack + ' мес.', traps: [{ val: minOk, msg: 'Учтены только минуты. Интернет тоже должен уложиться в пакет.' }, { val: 12 - overNet, msg: 'Учтён только интернет. Минуты тоже должны уложиться в пакет.' }] }
        ], answer: String(inPack), explain: 'Ровно ' + F + ' руб. платят, когда нет перерасхода ни минут, ни интернета: таких месяцев ' + inPack + '.' };
    } else {
      t3 = { paras: ['Сколько месяцев в году абонент превысил лимит по пакету мобильного интернета?'],
        steps: [
          { q: 'Сколько месяцев пунктирная линия выше уровня ' + f(G) + ' ГБ?', unit: 'мес.', ans: overNet, hl: ['limG'], aid: 'Считаем точки пунктирной линии выше ' + f(G) + ' ГБ: ' + overNet + '.', traps: [{ val: 12 - overNet, msg: 'Это месяцы без превышения.' }, { val: min.filter(function (x) { return x > M; }).length, msg: 'Это превышения по минутам (сплошная линия). Нужен интернет — пунктир.' }] }
        ], answer: String(overNet), explain: 'Трафик выше ' + f(G) + ' ГБ был в ' + overNet + ' мес.' };
    }
    t3.kind = 'steps'; t3.title = 'Месяцы без перерасхода'; t3.skill = 's15_read'; t3.fig = 'chart';
    /* тип 4: плата год назад */
    var P4 = [];
    [10, 15, 20, 25, 30, 40, 50].forEach(function (p) {
      [-1, 1].forEach(function (sg) { var old = F / (1 + sg * p / 100); if (Math.abs(old - Math.round(old)) < 1e-9) P4.push({ p: p, sg: sg, old: Math.round(old) }); });
    });
    if (!P4.length) return null;
    var q4 = pick(P4), share = 100 + q4.sg * q4.p;
    var t4 = {
      kind: 'steps', title: 'Плата до изменения', skill: 's15_pct', fig: null,
      paras: ['Известно, что в этом году абонентская плата по тарифу «Стандартный» ' + (q4.sg < 0 ? 'снизилась' : 'выросла') + ' на ' + q4.p + '% по сравнению с прошлым годом. Сколько рублей составляла абонентская плата в прошлом году?'],
      steps: [
        { q: 'Сколько процентов от прошлогодней платы составляет нынешняя?', unit: '%', ans: share, hl: [], aid: 'Прошлогодняя плата — 100%. ' + (q4.sg < 0 ? 'Снизилась на ' + q4.p + '%: 100 − ' + q4.p : 'Выросла на ' + q4.p + '%: 100 + ' + q4.p) + ' = ' + share + '%.', traps: [{ val: 100 - q4.sg * q4.p, msg: (q4.sg < 0 ? 'Плата снизилась, значит, её стало меньше 100%.' : 'Плата выросла, значит, её стало больше 100%.') }] },
        { q: 'Найдите прошлогоднюю плату.', unit: 'руб.', ans: q4.old, hl: [], aid: share + '% — это ' + F + ' руб. Значит, 100% — ' + F + ' : ' + f(share / 100) + ' = ' + q4.old + ' руб.',
          traps: [{ val: round(F * (1 - q4.sg * q4.p / 100), 2), msg: 'Проценты считаются от прошлогодней платы, а она неизвестна. Нужно делить на ' + f(share / 100) + ', а не умножать.' }, { val: F - q4.sg * q4.p, msg: 'Проценты — не рубли.' }] }
      ], answer: String(q4.old), explain: F + ' руб. — это ' + share + '% прошлогодней платы: ' + F + ' : ' + f(share / 100) + ' = ' + q4.old + ' руб.'
    };
    var t5 = L.internetTask15('Помимо мобильного интернета, абонент использует домашний интернет.', 'Абонент предполагает, что трафик составит', 'Сколько рублей должен будет заплатить абонент за месяц, если трафик действительно будет равен');
    if (!t5) return null;
    return { ctx: 'tariff', name: 'Тарифы', done: 'Счета проверены', common: common, min: min, gb: gb, M: M, G: G, F: F, tasks: [t1, t2, t3, t4, t5] };
  }

  /* ======================= ШИНЫ ======================= */
  function makeTires() {
    var d1 = pick([13, 14, 15]), discs = [d1, d1 + 1, d1 + 2], w0 = pick([155, 165, 175, 185]), widths = [w0, w0 + 10, w0 + 20, w0 + 30];
    var cells = widths.map(function (w, wi) {
      return discs.map(function (d, di) {
        var base = 70 - 5 * di - 5 * Math.max(0, wi - 1) - (w0 >= 175 ? 5 : 0);
        if ((wi === 0 && di === 2) || (wi === 3 && di === 0) || Math.random() < 0.12) return [];
        var out = [Math.max(40, base)];
        if (Math.random() < 0.3) out.push(Math.max(40, base - 5));
        return out.filter(function (x, i, a) { return a.indexOf(x) === i; });
      });
    });
    function H(w, p) { return round(w * p / 100, 2); }
    function D(w, p, d) { return round(d * 25.4 + 2 * H(w, p), 2); }
    var all = [];
    cells.forEach(function (row, wi) { row.forEach(function (ps, di) { ps.forEach(function (p) { all.push({ w: widths[wi], p: p, d: discs[di], di: di, wi: wi }); }); }); });
    if (all.length < 6) return null;
    /* тип 1: наименьшая ширина для диска, у которого верхняя клетка пустая */
    var colOpts = [0, 1, 2].filter(function (di) { return !cells[0][di].length && widths.some(function (w, wi) { return cells[wi][di].length; }); });
    if (!colOpts.length) return null;
    var c1 = pick(colOpts), minW = widths.filter(function (w, wi) { return cells[wi][c1].length; })[0];
    var fac = pick(all.filter(function (x) { return x.di === 1 || x.di === 0; }));
    var D0 = D(fac.w, fac.p, fac.d), H0 = H(fac.w, fac.p);
    var tbl = { head: ['Ширина шины (мм)'].concat(discs.map(function (d) { return 'Диск ' + d + '″'; })),
      rows: widths.map(function (w, wi) { return [String(w)].concat(cells[wi].map(function (ps) { return ps.length ? ps.map(function (p) { return w + '/' + p; }).join('; ') : '—'; })); }) };
    var common = [
      'Автомобильное колесо состоит из металлического диска и резиновой шины. Диаметр диска совпадает с диаметром внутреннего отверстия в шине. Для маркировки шин применяется единая система обозначений, например 195/65 R15. Первое число — ширина шины B в миллиметрах. Второе число — высота боковины H в процентах от ширины: H = B · 65 : 100. Буква R означает радиальную шину. Последнее число — диаметр диска d в дюймах (в одном дюйме 25,4 мм). Общий диаметр колеса D = d + 2H.',
      'Завод производит легковые автомобили определённой модели и устанавливает на них колёса с шинами маркировки ' + fac.w + '/' + fac.p + ' R' + fac.d + '. Завод допускает установку шин с другими маркировками. В таблице показаны разрешённые размеры шин.'
    ];
    var t1 = {
      kind: 'steps', title: 'Подбор шин', skill: 's15_read', fig: 'tirepic',
      paras: ['Шины какой наименьшей ширины можно устанавливать на автомобиль, если диаметр диска равен ' + discs[c1] + ' дюймам? Ответ дайте в миллиметрах.'],
      steps: [{ q: 'Найди столбец «' + discs[c1] + '″» и самую верхнюю строку с маркировкой. Какая это ширина?', unit: 'мм', ans: minW, hl: [], aid: 'В столбце ' + discs[c1] + '″ клетки со знаком «—» пропускаем. Первая заполненная строка — ширина ' + minW + ' мм.',
        traps: [{ val: widths[0], msg: 'В этой строке для диска ' + discs[c1] + '″ стоит «—»: такие шины не разрешены.' }] }],
      answer: String(minW), explain: 'В столбце ' + discs[c1] + '″ первая разрешённая ширина — ' + minW + ' мм.'
    };
    var m2 = pick(all.filter(function (x) { return x !== fac; })), H2 = H(m2.w, m2.p);
    var t2 = {
      kind: 'steps', title: 'Высота боковины', skill: 's15_units', fig: 'wheel',
      paras: ['Сколько миллиметров составляет высота боковины шины, имеющей маркировку ' + m2.w + '/' + m2.p + ' R' + m2.d + '?'],
      steps: [{ q: 'Найдите H для шины ' + m2.w + '/' + m2.p + '.', unit: 'мм', ans: H2, hl: ['H'], aid: 'H = ' + m2.w + ' · ' + m2.p + ' : 100 = ' + f(H2) + ' мм.', traps: [{ val: m2.p, msg: m2.p + ' — это проценты от ширины, а не миллиметры.' }, { val: round(m2.w * m2.p / 10, 2), msg: 'Проценты — сотые доли: делить нужно на 100.' }] }],
      answer: String(H2), explain: 'H = ' + m2.w + ' · ' + m2.p + '% = ' + f(H2) + ' мм.'
    };
    var t3 = {
      kind: 'steps', title: 'Диаметр колеса', skill: 's15_units', fig: 'wheel',
      paras: ['Найдите диаметр колеса автомобиля, выходящего с завода. Ответ дайте в миллиметрах.'],
      steps: [
        { q: 'Сколько миллиметров диаметр диска ' + fac.d + '″?', unit: 'мм', ans: round(fac.d * 25.4, 2), hl: ['d'], aid: fac.d + ' · 25,4 = ' + f(round(fac.d * 25.4, 2)) + ' мм.', traps: [{ val: fac.d, msg: 'Это дюймы. 1 дюйм = 25,4 мм.' }] },
        { q: 'Какова высота боковины шины ' + fac.w + '/' + fac.p + '?', unit: 'мм', ans: H0, hl: ['H'], aid: fac.w + ' · ' + fac.p + ' : 100 = ' + f(H0) + ' мм.', traps: [{ val: fac.p, msg: 'Это проценты от ширины.' }] },
        { q: 'Найдите диаметр колеса D.', unit: 'мм', ans: D0, hl: ['D'], aid: f(round(fac.d * 25.4, 2)) + ' + 2 · ' + f(H0) + ' = ' + f(D0) + ' мм.', traps: [{ val: round(fac.d * 25.4 + H0, 2), msg: 'Боковина есть и сверху, и снизу диска: прибавь 2H.' }] }
      ], answer: String(D0), explain: 'D = ' + fac.d + '·25,4 + 2·' + f(H0) + ' = ' + f(D0) + ' мм.'
    };
    var cand = all.filter(function (x) { return Math.abs(D(x.w, x.p, x.d) - D0) > 0.5; });
    if (cand.length < 2) return null;
    var m4 = pick(cand), D4 = D(m4.w, m4.p, m4.d), diff = round(Math.abs(D4 - D0), 2), up4 = D4 > D0;
    var t4 = {
      kind: 'steps', title: 'Изменение диаметра', skill: 's15_units', fig: 'wheel',
      paras: ['На сколько миллиметров ' + (up4 ? 'увеличится' : 'уменьшится') + ' диаметр колеса, если заменить колёса, установленные на заводе, колёсами с шинами маркировки ' + m4.w + '/' + m4.p + ' R' + m4.d + '?'],
      steps: [
        { q: 'Каков диаметр заводского колеса?', unit: 'мм', ans: D0, hl: ['D'], aid: fac.d + '·25,4 + 2·' + f(H0) + ' = ' + f(D0) + ' мм.', traps: [] },
        { q: 'Каков диаметр нового колеса ' + m4.w + '/' + m4.p + ' R' + m4.d + '?', unit: 'мм', ans: D4, hl: ['D'], aid: m4.d + '·25,4 + 2·' + f(H(m4.w, m4.p)) + ' = ' + f(D4) + ' мм.', traps: [{ val: round(m4.d * 25.4 + H(m4.w, m4.p), 2), msg: 'Боковин две: прибавь 2H.' }] },
        { q: 'На сколько миллиметров ' + (up4 ? 'увеличится' : 'уменьшится') + ' диаметр?', unit: 'мм', ans: diff, hl: [], aid: (up4 ? f(D4) + ' − ' + f(D0) : f(D0) + ' − ' + f(D4)) + ' = ' + f(diff) + ' мм.', traps: [{ val: round(Math.abs(H(m4.w, m4.p) - H0), 2), msg: 'Это разница одной боковины. Сравни диаметры целиком.' }] }
      ], answer: String(diff), explain: 'Было ' + f(D0) + ' мм, стало ' + f(D4) + ' мм: разница ' + f(diff) + ' мм.'
    };
    var m5 = null, pc = 0;
    shuffle(cand).some(function (x) {
      var Dx = D(x.w, x.p, x.d), p = (Dx / D0 - 1) * 100, a = Math.abs(p) * 10;
      if (Math.abs(a - Math.floor(a) - 0.5) < 0.06 || Math.abs(p) < 0.15) return false;
      m5 = x; pc = p; return true;
    });
    if (!m5) return null;
    var D5 = D(m5.w, m5.p, m5.d), pr = round(Math.abs(pc), 1), up5 = pc > 0;
    var t5 = {
      kind: 'steps', title: 'Пробег за оборот', skill: 's15_pct', fig: 'wheel',
      paras: ['На сколько процентов ' + (up5 ? 'увеличится' : 'уменьшится') + ' пробег автомобиля при одном обороте колеса, если заменить колёса, установленные на заводе, колёсами с шинами маркировки ' + m5.w + '/' + m5.p + ' R' + m5.d + '? Результат округлите до десятых.'],
      steps: [
        { q: 'Каков диаметр нового колеса?', unit: 'мм', ans: D5, hl: ['D'], aid: m5.d + '·25,4 + 2·' + f(H(m5.w, m5.p)) + ' = ' + f(D5) + ' мм. Заводское колесо — ' + f(D0) + ' мм.', traps: [] },
        { q: 'Пробег за оборот — длина окружности πD, π сокращается. На сколько процентов ' + (up5 ? 'увеличится' : 'уменьшится') + ' пробег? Округлите до десятых.', unit: '%', ans: pr, hl: [], aid: 'За 100% берём заводское колесо: |' + f(D5) + ' − ' + f(D0) + '| : ' + f(D0) + ' · 100 ≈ ' + f(round(Math.abs(pc), 3)) + ' ≈ ' + f(pr) + '%.',
          traps: [{ val: round(Math.abs(D0 / D5 - 1) * 100, 1), msg: 'За 100% берут заводское колесо — то, с чем сравнивают.' }, { val: round(Math.abs(D5 - D0), 1), msg: 'Это разница в миллиметрах, а нужны проценты.' }] }
      ], answer: String(pr), explain: 'Пробег за оборот пропорционален диаметру. (' + f(D5) + ' − ' + f(D0) + ') : ' + f(D0) + ' · 100% ≈ ' + (up5 ? '' : '−') + f(pr) + '%.'
    };
    return { ctx: 'tires', name: 'Шины', done: 'Колёса подобраны', common: common, commonTables: [tbl], factory: fac, tasks: [t1, t2, t3, t4, t5] };
  }

  L.register15('paper', 'Листы бумаги', 'Форматы А0–А6', retry(makePaper, 'Листы бумаги'));
  L.register15('tariff', 'Тарифы', 'Минуты и гигабайты', retry(makeTariff, 'Тарифы'));
  L.register15('tires', 'Шины', 'Маркировка колеса', retry(makeTires, 'Шины'));
  return L;
});
