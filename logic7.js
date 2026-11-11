/* «Дачный участок»: один вариант заданий 1–5 (типы 1–5) на общем плане участка. Без DOM. Нужен logic.js.
   Все размеры на плане хранятся в метрах и целые. Клетка плана = 2 м, дорожки шириной 1 м. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { require('./logic.js'); module.exports = factory(require('./logic.js')); }
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, randInt = U.randInt, pick = U.pick, shuffle = U.shuffle;
  var C = 2, WC = 22, HC = 14;          // клетка 2 м; участок 22 × 14 клеток

  /* Навыки заданий 1–5: общие для всех сюжетов, чтобы отчёт для родителя показывал умение, а не сюжет */
  var SKILLS15 = {
    s15_read: 'Чтение плана, таблицы, графика и описания',
    s15_round: 'Упаковки и округление вверх',
    s15_area: 'Площади и объёмы',
    s15_pyth: 'Расстояние по прямой (теорема Пифагора)',
    s15_pct: 'Проценты',
    s15_units: 'Масштаб, единицы измерения и формулы',
    s15_motion: 'Путь, скорость и время',
    s15_money: 'Стоимость покупок, тарифы и окупаемость'
  };
  /* старые навыки «Дачного участка» → общие (для переноса статистики) */
  var SKILL15_OLD = { d_plan: 's15_read', d_tiles: 's15_round', d_area: 's15_area', d_pyth: 's15_pyth', d_payback: 's15_money' };

  /* Реестр сюжетов заданий 1–5. Каждый make() возвращает вариант:
     { ctx, name, done, common: [абзацы], commonTables, tasks: [5 заданий] }
     задание: { kind: 'slots' | 'steps', title, skill, paras, tables, ask, fig, answer, explain,
                slots: [{id, name}], maxVal (для slots), steps: [{q, unit, ans, aid, traps, hl}] } */
  var CTX15 = [];
  function register15(id, title, note, make) { CTX15.push({ id: id, title: title, note: note, make: function () { return finalize15(make()); } }); }
  function finalize15(v) {
    v.tasks.forEach(function (t) {
      if (t.kind === 'slots' && !t.vals) t.vals = t.answer.split('').map(Number);
      if (t.kind !== 'steps') return;
      t.steps.forEach(function (st) { st.traps = (st.traps || []).filter(function (tr) { return isFinite(tr.val) && !numEq(tr.val, st.ans); }); });
    });
    return v;
  }
  function make15(id) {
    for (var i = 0; i < CTX15.length; i++) if (CTX15[i].id === id) return CTX15[i].make();
    throw new Error('Нет сюжета ' + id);
  }

  /* ---------- геометрия (метры, y вниз) ---------- */
  function R(x0, y0, x1, y1) { return { x0: x0, y0: y0, x1: x1, y1: y1 }; }
  function areaOf(r) { return (r.x1 - r.x0) * (r.y1 - r.y0); }
  function overlap(a, b) { return a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1; }
  function inside(a, b) { return a.x0 >= b.x0 && a.y0 >= b.y0 && a.x1 <= b.x1 && a.y1 <= b.y1; }
  function gap(a, b) {
    var dx = Math.max(0, a.x0 - b.x1, b.x0 - a.x1), dy = Math.max(0, a.y0 - b.y1, b.y0 - a.y1);
    return { dx: dx, dy: dy, d: Math.sqrt(dx * dx + dy * dy) };
  }
  function flip(r, W, H, fx, fy) {
    return R(fx ? W - r.x1 : r.x0, fy ? H - r.y1 : r.y0, fx ? W - r.x0 : r.x1, fy ? H - r.y0 : r.y1);
  }
  function mid(r) { return { x: (r.x0 + r.x1) / 2, y: (r.y0 + r.y1) / 2 }; }
  function isSq(n) { var r = Math.round(Math.sqrt(n)); return r * r === n; }

  /* ---------- план ---------- */
  function tryPlan() {
    var W = WC * C, H = HC * C;
    var tri = pick([[4, 3], [3, 4], [8, 6], [4, 3], [3, 4]]), dx = tri[0], dy = tri[1];
    var S = pick([[3, 2], [2, 3], [3, 3], [4, 2], [2, 2]]), G = pick([[3, 3], [3, 2], [4, 3], [3, 4], [2, 3]]);
    var sa = S[0], sb = S[1], ga = G[0], gb = G[1], pw = Math.min(sa, ga);
    var lw = randInt(2, 3), lh = randInt(1, 3), hw = lw + randInt(1, 3), uh = randInt(2, 3);
    var ygLo = Math.max(sb, dy + uh + lh - 2), ygHi = Math.min(HC - 2 - gb, 9);
    if (ygLo > ygHi) return null;
    var yg = randInt(ygLo, ygHi);
    var shed = R((WC - sa) * C, (yg - sb) * C, W, yg * C);
    var garage = R((WC - ga) * C, (yg + 2) * C, W, (yg + 2 + gb) * C);
    var pad = R((WC - pw) * C, yg * C, W, (yg + 2) * C);
    var Hx = (WC - ga - dx) * C, Hy = (yg + 2 - dy) * C;
    var houseB = R(Hx - lw * C, Hy - lh * C, Hx, Hy);
    var houseA = R(Hx - lw * C, Hy - lh * C - uh * C, Hx - lw * C + hw * C, Hy - lh * C);
    var hx0 = houseB.x0;
    if (hx0 < 12 || houseA.y0 < 0) return null;
    var ym = yg * C + 1;
    /* огород и теплица */
    var gx1 = hx0 - C * randInt(1, 2), gx0 = gx1 - C * randInt(4, 6), gy0 = C * randInt(0, 1), gy1 = gy0 + C * randInt(3, 4);
    if (gx0 < C) return null;
    var gwm = C * randInt(2, 3), ghm = C * randInt(1, 2);
    var garden = R(gx0, gy0, gx1, gy1), green = R(gx0 + 2, gy0 + 2, gx0 + 2 + gwm, gy0 + 2 + ghm);
    if (!inside(green, garden)) return null;
    var xg = randInt(gx0 + 1, gx1 - 2);
    if (xg < green.x1 + 1 && xg + 1 > green.x0 - 1 && gy1 - green.y1 < 1) return null;
    var pathG = R(xg, gy1, xg + 1, ym);
    /* баня и дорожка к ней */
    var bw = randInt(2, 3), bh = 2, bx0 = C * randInt(1, 2), bx1 = bx0 + bw * C, by = ym + 1 + randInt(3, 6);
    var bath = R(bx0, by, bx1, by + bh * C);
    var xb = randInt(bx0 + 1, bx1 - 2);
    var pathB = R(xb, ym + 1, xb + 1, by);
    /* яблони напротив дома */
    var apples = R(hx0, ym + 3, hx0 + 6, ym + 7), trees = [];
    [[1, 1], [5, 1], [1, 3], [5, 3]].forEach(function (p) { trees.push({ x: apples.x0 + p[0], y: apples.y0 + p[1] }); });
    var xe = Math.min(xb, xg), xp = pad.x0;
    var main = R(xe, ym, xp, ym + 1);
    var plot = R(0, 0, W, H);
    var solids = [shed, garage, houseA, houseB, bath, garden, apples];
    var flat = [shed, garage, houseA, houseB, bath, apples, pad, pathG, pathB, main];
    var i, j;
    for (i = 0; i < flat.length; i++) {
      if (!inside(flat[i], plot)) return null;
      for (j = i + 1; j < flat.length; j++) {
        /* дом из двух прямоугольников соприкасается сам с собой */
        if (flat[i] === houseA && flat[j] === houseB) continue;
        if (overlap(flat[i], flat[j])) return null;
      }
    }
    if (overlap(garden, houseA) || overlap(garden, houseB) || overlap(garden, bath) || overlap(garden, main) || overlap(garden, apples)) return null;
    if (!(by + bh * C <= H)) return null;
    /* ближайшие точки дома и гаража: нужен угол к углу и целое расстояние */
    var ga1 = gap(houseA, garage), ga2 = gap(houseB, garage), best = ga1.d <= ga2.d ? ga1 : ga2;
    if (!(best.dx > 0 && best.dy > 0 && isSq(best.dx * best.dx + best.dy * best.dy))) return null;
    if (Math.abs(ga1.d - ga2.d) < 1e-9 && ga1.dx !== ga2.dx) return null;
    var pts = [];
    return {
      W: W, H: H, yg: yg, shed: shed, garage: garage, pad: pad, houseA: houseA, houseB: houseB, garden: garden, green: green,
      bath: bath, apples: apples, trees: trees, main: main, pathB: pathB, pathG: pathG, dx: best.dx, dy: best.dy, pts: pts
    };
  }

  /* ---------- вариант ---------- */
  function fmtN(n) { return L.fmt(n); }
  function spaced(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
  function kopecks(x) { return Math.round(x * 100); }

  function makeHeating() {
    for (var k = 0; k < 4000; k++) {
      var g = pick([1.2, 1.4, 1.5, 1.6, 1.8, 2]), pg = pick([5.2, 5.5, 5.8, 6, 6.4, 7.2]);
      var P = pick([4.5, 5, 5.5, 6, 6.5, 7]), pe = pick([3.5, 3.8, 4, 4.2, 4.4, 4.6]);
      var gc = kopecks(g * pg), ec = kopecks(P * pe), d = ec - gc;
      if (d < 500) continue;
      var h = randInt(30, 95) * 10;
      if ((h * d) % 100 !== 0) continue;
      var D = h * d / 100, boilerE = pick([13000, 14000, 15000, 16000, 17000]), otherE = pick([9000, 11000, 12000, 13000, 14000]);
      var elTotal = boilerE + otherE, gasTotal = elTotal + D;
      var boilerG = pick([18000, 20000, 22000, 24000, 25000]), otherG = gasTotal - boilerG;
      if (otherG < 8000) continue;
      return { g: g, pg: pg, P: P, pe: pe, gc: gc / 100, ec: ec / 100, d: d / 100, hours: h, D: D, boilerE: boilerE, otherE: otherE, boilerG: boilerG, otherG: otherG, gasTotal: gasTotal, elTotal: elTotal };
    }
    throw new Error('Дача: не удалось составить расчёт отопления');
  }

  function makeDachaVariant() {
    var p = null, tries = 0;
    while (!p) { p = tryPlan(); if (++tries > 20000) throw new Error('Дача: не удалось составить план'); }
    var fx = Math.random() < 0.5, fy = Math.random() < 0.5, W = p.W, H = p.H;
    var gateEast = !fx;
    function F(r) { return flip(r, W, H, fx, fy); }
    var o = {
      shed: F(p.shed), garage: F(p.garage), pad: F(p.pad), houseA: F(p.houseA), houseB: F(p.houseB), garden: F(p.garden),
      green: F(p.green), bath: F(p.bath), apples: F(p.apples), main: F(p.main), pathB: F(p.pathB), pathG: F(p.pathG)
    };
    var trees = p.trees.map(function (t) { return { x: fx ? W - t.x : t.x, y: fy ? H - t.y : t.y }; });
    var gateY0 = (fy ? H - (p.yg + 2) * C : p.yg * C), gate = { side: gateEast ? 'E' : 'W', x: gateEast ? W : 0, y0: gateY0, y1: gateY0 + 2 * C };

    /* номера на плане */
    var nums = shuffle([1, 2, 3, 4, 5, 6, 7]);
    var label = { shed: nums[0], garage: nums[1], house: nums[2], bath: nums[3], green: nums[4], garden: nums[5], apples: nums[6] };

    /* лево и право от ворот: идём в участок, смотрим вдоль оси x */
    var southBuild = mid(o.shed).y > mid(o.garage).y ? 'shed' : 'garage';
    var northBuild = southBuild === 'shed' ? 'garage' : 'shed';
    var leftB = gateEast ? southBuild : northBuild, rightB = leftB === 'shed' ? 'garage' : 'shed';
    var shedArea = areaOf(o.shed), name = { shed: 'сарай', garage: 'гараж' };
    function desc(b) { return name[b] + (b === 'shed' ? ' площадью ' + shedArea + ' кв. м' : ''); }
    var pack = pick([8, 10, 10, 12]);
    var text = {
      intro: 'На плане изображён дачный участок (сторона каждой клетки на плане равна 2 м). Участок имеет прямоугольную форму. Выезд и въезд осуществляются через единственные ворота.',
      left: 'При входе на участок слева от ворот находится ' + desc(leftB) + '.',
      right: 'Справа от ворот находится ' + desc(rightB) + ', а чуть подальше — жилой дом.',
      apples: 'Напротив жилого дома расположены яблоневые посадки.',
      bath: 'Также на участке есть баня, к которой ведёт дорожка, выложенная плиткой,',
      garden: 'и огород с теплицей внутри (огород отмечен на плане цифрой ' + label.garden + ').',
      tiles: 'Все дорожки внутри участка имеют ширину 1 м и вымощены тротуарной плиткой размером 1 м × 1 м. Между гаражом и сараем находится площадка, вымощенная такой же плиткой.',
      utils: 'К участку подведено электричество. Имеется магистральное газоснабжение.'
    };
    /* тип 1 */
    var t1 = {
      type: 1, kind: 'slots', title: 'Что где стоит', skill: 's15_read', fig: 'plan', maxVal: 7, paras: [],
      ask: 'Определите, какими цифрами на плане обозначены жилой дом, баня, гараж и теплица. Ответ — четыре цифры подряд, без пробелов.',
      wrong: 'Не сходится. Лево и право считают от ворот, глядя внутрь участка. Попробуй ещё раз.',
      slots: [{ id: 'house', name: 'жилой дом' }, { id: 'bath', name: 'баня' }, { id: 'garage', name: 'гараж' }, { id: 'green', name: 'теплица' }],
      answer: [label.house, label.bath, label.garage, label.green].join(''),
      explain: 'Гараж — слева от ворот, если смотреть от ворот внутрь участка: это № ' + label.garage + '. Сарай — № ' + label.shed + '. Огород № ' + label.garden + ', теплица внутри него: № ' + label.green +
        '. Яблони — № ' + label.apples + ', напротив них дом: № ' + label.house + '. Остаётся баня, к ней ведёт дорожка: № ' + label.bath + '. Ответ: ' + [label.house, label.bath, label.garage, label.green].join('') + '.',
      traps: [{ msg: 'Лево и право считают от ворот, глядя внутрь участка, а не от экрана.' }]
    };

    /* тип 2 */
    var segs = [
      { id: 'pad', name: 'Площадка между сараем и гаражом', rect: o.pad, hl: ['pad'] },
      { id: 'main', name: 'Главная дорожка от площадки', rect: o.main, hl: ['main'] },
      { id: 'pathB', name: 'Дорожка к бане', rect: o.pathB, hl: ['pathB'] },
      { id: 'pathG', name: 'Дорожка к огороду', rect: o.pathG, hl: ['pathG'] }
    ];
    var total = 0;
    segs.forEach(function (s) { s.tiles = areaOf(s.rect); total += s.tiles; });
    var packs = Math.ceil(total / pack), left = packs * pack - total;
    var t2steps = segs.map(function (s) {
      var w = s.rect.x1 - s.rect.x0, h = s.rect.y1 - s.rect.y0, isPad = s.id === 'pad';
      return {
        q: 'Сколько плиток 1 м × 1 м нужно для объекта, выделенного на плане: ' + s.name.toLowerCase() + '?', unit: 'плиток', ans: s.tiles, hl: s.hl,
        aid: isPad ? 'Площадка — прямоугольник ' + w / C + ' × ' + h / C + ' клетки, то есть ' + w + ' × ' + h + ' м. Плитка 1 м² — значит, плиток столько же, сколько квадратных метров: ' + w + '·' + h + ' = ' + s.tiles + '.'
          : 'Дорожка шириной 1 м, а длина — ' + Math.max(w, h) / C + ' клеток по 2 м: ' + Math.max(w, h) + ' м. Одна плитка на каждый метр длины: ' + s.tiles + '.',
        traps: [{ val: isPad ? w / C * h / C : Math.max(w, h) / C, msg: 'Это число клеток. Клетка — 2 м, а не 1 м.' }]
      };
    });
    t2steps.push({ q: 'Сколько всего плиток нужно на все дорожки и площадку?', unit: 'плиток', ans: total, hl: ['pad', 'main', 'pathB', 'pathG'],
      aid: 'Сложи четыре числа: ' + segs.map(function (s) { return s.tiles; }).join(' + ') + ' = ' + total + '.', traps: [] });
    t2steps.push({ q: 'Плитки продаются упаковками по ' + pack + ' штук. Сколько упаковок понадобилось?', unit: 'упаковок', ans: packs, hl: ['pad', 'main', 'pathB', 'pathG'],
      aid: total + ' : ' + pack + ' = ' + (total / pack).toFixed(1).replace('.', ',') + '. Упаковку нельзя разделить, поэтому берём ' + packs + ' (останется ' + left + ' плиток).',
      traps: [{ val: Math.floor(total / pack), msg: 'Округлили вниз: плитки из неполной упаковки тоже нужны. Округляй вверх.' }, { val: Math.round(total / pack), msg: 'Округлили до ближайшего. Неполная упаковка всё равно нужна: округляй вверх.' }] });
    var t2 = { type: 2, kind: 'steps', title: 'Плитка для дорожек', skill: 's15_round', fig: 'plan', text: 'Плитки для садовых дорожек продаются в упаковках по ' + pack + ' штук. Сколько упаковок плиток понадобилось, чтобы выложить все дорожки и площадку между сараем и гаражом?',
      steps: t2steps, answer: String(packs), explain: segs.map(function (s) { return s.name + ': ' + s.tiles; }).join('; ') + '. Всего ' + total + ' плиток, упаковок ' + total + ' : ' + pack + ' → ' + packs + '.' };

    /* тип 3 */
    var hcells = (areaOf(o.houseA) + areaOf(o.houseB)) / (C * C), harea = hcells * C * C;
    var t3 = { type: 3, kind: 'steps', title: 'Площадь дома', skill: 's15_area', fig: 'plan', text: 'Найдите площадь, которую занимает жилой дом. Ответ дайте в квадратных метрах.',
      steps: [
        { q: 'Сколько клеток занимает дом? Раздели его на два прямоугольника.', unit: 'клеток', ans: hcells, hl: ['house'], aid: 'Верхняя часть ' + areaOf(o.houseA) / (C * C) + ' клеток и нижняя ' + areaOf(o.houseB) / (C * C) + ' клеток: ' + hcells + '.', traps: [] },
        { q: 'Какова площадь одной клетки в квадратных метрах? Сторона клетки 2 м.', unit: 'м²', ans: C * C, hl: [], aid: '2 м × 2 м = 4 м².', traps: [{ val: 2, msg: 'Сторона клетки 2 м, а площадь — это сторона в квадрате: 4 м².' }] },
        { q: 'Найдите площадь дома в квадратных метрах.', unit: 'м²', ans: harea, hl: ['house'], aid: hcells + ' клеток · 4 м² = ' + harea + ' м².', traps: [{ val: hcells, msg: 'Это число клеток. Умножь на площадь клетки, 4 м².' }, { val: hcells * C, msg: 'Клетка 2 м × 2 м занимает 4 м², а не 2.' }] }
      ], answer: String(harea), explain: 'Дом — ' + hcells + ' клеток по 4 м²: ' + hcells + '·4 = ' + harea + ' м².' };

    /* тип 4 */
    var dxm = p.dx, dym = p.dy;
    var distM = Math.round(Math.sqrt(dxm * dxm + dym * dym));
    var t4 = { type: 4, kind: 'steps', title: 'Расстояние до гаража', skill: 's15_pyth', fig: 'plan', text: 'Найдите расстояние от жилого дома до гаража (расстояние между двумя ближайшими точками по прямой) в метрах.',
      steps: [
        { q: 'На плане отмечены две ближайшие точки. Сколько метров между ними по горизонтали?', unit: 'м', ans: dxm, hl: ['house', 'garage'], tri: true, aid: dxm / C + ' клеток по 2 м: ' + dxm + ' м.', traps: [{ val: dxm / C, msg: 'Это число клеток. Переведи в метры: клетка 2 м.' }] },
        { q: 'А по вертикали?', unit: 'м', ans: dym, hl: ['house', 'garage'], tri: true, aid: dym / C + ' клеток по 2 м: ' + dym + ' м.', traps: [{ val: dym / C, msg: 'Это число клеток. Переведи в метры: клетка 2 м.' }] },
        { q: 'Найдите расстояние между точками по прямой (гипотенуза).', unit: 'м', ans: distM, hl: ['house', 'garage'], tri: true, aid: 'c² = ' + dxm + '² + ' + dym + '² = ' + (dxm * dxm + dym * dym) + ', c = ' + distM + '.', traps: [{ val: dxm + dym, msg: 'Катеты складывать нельзя. Нужна гипотенуза: корень из суммы квадратов.' }] }
      ], answer: String(distM), explain: 'Катеты ' + dxm + ' м и ' + dym + ' м, гипотенуза √(' + dxm + '² + ' + dym + '²) = ' + distM + ' м.' };

    /* тип 5 */
    var h = makeHeating();
    var gasH = h.g * h.pg, elH = h.P * h.pe;
    var hrs = h.hours;
    var t5 = { type: 5, kind: 'steps', title: 'Когда окупится газ', skill: 's15_money', fig: null, heat: h,
      text: 'Хозяин участка планирует установить в жилом доме систему отопления. Он рассматривает два варианта: электрическое или газовое отопление. Цены на оборудование и стоимость его установки, данные о расходе газа, электроэнергии и их стоимости даны в таблице. Обдумав оба варианта, хозяин решил установить газовое отопление. Через сколько часов непрерывной работы отопления экономия от использования газа вместо электричества компенсирует разницу в стоимости покупки и установки газового и электрического оборудования?',
      steps: [
        { q: 'Сколько рублей в час стоит газ? Расход умножь на цену.', unit: 'руб./ч', ans: L.util.round(gasH, 2), hl: [], aid: fmtN(h.g) + '·' + fmtN(h.pg) + ' = ' + fmtN(L.util.round(gasH, 2)) + ' руб. в час.', traps: [] },
        { q: 'Сколько рублей в час стоит электричество?', unit: 'руб./ч', ans: L.util.round(elH, 2), hl: [], aid: fmtN(h.P) + '·' + fmtN(h.pe) + ' = ' + fmtN(L.util.round(elH, 2)) + ' руб. в час.', traps: [] },
        { q: 'На сколько рублей газовое оборудование (котёл и монтаж) дороже электрического?', unit: 'руб.', ans: h.D, hl: [], aid: 'Газовое: ' + spaced(h.boilerG) + ' + ' + spaced(h.otherG) + ' = ' + spaced(h.gasTotal) + ' руб. Электрическое: ' + spaced(h.boilerE) + ' + ' + spaced(h.otherE) + ' = ' + spaced(h.elTotal) + ' руб. Разница ' + spaced(h.D) + ' руб.',
          traps: [{ val: h.boilerG - h.boilerE, msg: 'Нужно сравнить всё вместе: котёл плюс прочее оборудование и монтаж.' }] },
        { q: 'Сколько рублей в час экономит газ по сравнению с электричеством?', unit: 'руб./ч', ans: L.util.round(h.d, 2), hl: [], aid: fmtN(L.util.round(elH, 2)) + ' − ' + fmtN(L.util.round(gasH, 2)) + ' = ' + fmtN(L.util.round(h.d, 2)) + ' руб. в час.', traps: [] },
        { q: 'Через сколько часов экономия покроет разницу в цене оборудования?', unit: 'ч', ans: hrs, hl: [], aid: spaced(h.D) + ' : ' + fmtN(L.util.round(h.d, 2)) + ' = ' + hrs + ' ч.', traps: [{ val: L.util.round(h.D / gasH, 2), msg: 'Делить нужно на экономию в час, а не на расход газа.' }] }
      ], answer: String(hrs), explain: 'Газ стоит ' + fmtN(L.util.round(gasH, 2)) + ' руб./ч, электричество ' + fmtN(L.util.round(elH, 2)) + ' руб./ч, экономия ' + fmtN(L.util.round(h.d, 2)) + ' руб./ч. Оборудование дороже на ' + spaced(h.D) + ' руб. ' + spaced(h.D) + ' : ' + fmtN(L.util.round(h.d, 2)) + ' = ' + hrs + ' ч.' };

    [t2, t3, t4, t5].forEach(function (t) { t.paras = [t.text]; });
    t5.tables = [{ head: ['', 'Нагреватель (котёл)', 'Прочее оборудование и монтаж', 'Средний расход газа / средняя потребляемая мощность', 'Стоимость газа / электроэнергии'], rows: [
      ['Газовое отопление', spaced(h.boilerG) + ' руб.', spaced(h.otherG) + ' руб.', fmtN(h.g) + ' куб. м/ч', fmtN(h.pg) + ' руб./куб. м'],
      ['Электрическое отопление', spaced(h.boilerE) + ' руб.', spaced(h.otherE) + ' руб.', fmtN(h.P) + ' кВт', fmtN(h.pe) + ' руб./(кВт·ч)']] }];
    return finalize15({
      ctx: 'dacha', name: 'Дачный участок', done: 'Участок обустроен',
      common: [text.intro, text.left + ' ' + text.right + ' ' + text.apples + ' ' + text.bath + ' ' + text.garden, text.tiles, text.utils],
      c: C, W: W, H: H, gate: gate, obj: o, trees: trees, label: label, text: text, pack: pack,
      near: { dxm: dxm, dym: dym }, tasks: [t1, t2, t3, t4, t5]
    });
  }

  /* разбор ввода: «7,7» и «7.7» — одно число */
  function parseNum(s) {
    s = String(s === undefined || s === null ? '' : s).replace(/ |\s/g, '').replace(',', '.').replace(/[−–—]/g, '-');
    if (!/^-?\d+(\.\d+)?$/.test(s)) return NaN;
    return Number(s);
  }
  function numEq(a, b) { return isFinite(a) && Math.abs(a - b) < 1e-6; }
  /* подсказка про типичную ошибку по шагу задания (или null) */
  function stepTrap(step, value) {
    for (var i = 0; i < (step.traps || []).length; i++) if (numEq(value, step.traps[i].val)) return step.traps[i].msg;
    return null;
  }

  register15('dacha', 'Дачный участок', 'Дорожки, дом, отопление', makeDachaVariant);

  return Object.assign(L, { SKILLS15: SKILLS15, DACHA_SKILLS: SKILLS15, SKILL15_OLD: SKILL15_OLD, CTX15: CTX15, make15: make15, register15: register15, finalize15: finalize15, makeDachaVariant: makeDachaVariant, dachaParse: parseNum, dachaNumEq: numEq, dachaStepTrap: stepTrap });
});
