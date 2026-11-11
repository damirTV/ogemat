/* Вычисления без ошибок: логика режимов «Числовая прямая» и «Мастерская превращений».
   Дополняет Logic из logic.js (без DOM). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./logic.js'));
  else root.Logic = factory(root.Logic);
})(typeof self !== 'undefined' ? self : this, function (L) {
  'use strict';
  var U = L.util, MINUS = L.MINUS, fmt = L.fmt;
  var randInt = U.randInt, pick = U.pick, shuffle = U.shuffle, gcd = U.gcd;

  function fr(k, d) { return '[' + k + '/' + d + ']'; }
  function mixed(k, d) { var n = Math.floor(k / d), r = k % d; return n + ' ' + fr(r, d); }
  function lcm(a, b) { return a * b / gcd(a, b); }

  /* ================= ЧИСЛОВАЯ ПРЯМАЯ ================= */
  /* Сцена: от min до max (целые), d делений на единицу, значение = k / d. */
  function scene(min, max, d) { return { min: min, max: max, d: d, minK: min * d, maxK: max * d }; }

  function placeTask(kind, label, sc, k, hint) {
    return { type: 'place', kind: kind, skill: 'numline', label: label,
      min: sc.min, max: sc.max, d: sc.d, minK: sc.minK, maxK: sc.maxK, k: k, value: k / sc.d, hint: hint };
  }

  function genPlaceDec() {
    if (Math.random() < 0.65) {
      var n = randInt(0, 5), k = n * 10 + randInt(1, 9);
      return placeTask('place_dec', fmt(k / 10), scene(n, n + 1, 10), k,
        'Между ' + n + ' и ' + (n + 1) + ' десять одинаковых делений, одно деление = 0,1.');
    }
    var m = randInt(0, 2), kq;
    do { kq = m * 4 + randInt(1, 11); } while (kq % 4 === 0);
    return placeTask('place_dec', fmt(kq / 4), scene(m, m + 3, 4), kq,
      'Каждая единица разделена на 4 части, одна часть = 0,25.');
  }

  var FRAC_L = { 2: 4, 3: 3, 4: 3, 5: 2, 6: 2, 8: 1 };
  function genPlaceFrac(grade) {
    var ds = grade >= 6 ? [2, 3, 4, 5, 6, 8] : [2, 3, 4, 5, 6, 8].slice(0, 5);
    var d = pick(ds), L = FRAC_L[d], k;
    do { k = randInt(1, L * d - 1); } while (k % d === 0 || gcd(k, d) !== 1);
    var label = (k > d && Math.random() < 0.5) ? mixed(k, d) : fr(k, d);
    return placeTask('place_frac', label, scene(0, L, d), k,
      'Каждая единица разделена на ' + d + ' равных частей, одна часть = ' + fr(1, d) + '.');
  }

  function genPlaceExpr() {
    if (Math.random() < 0.5) {
      var n = randInt(0, 3), r = n * 10 + randInt(2, 9), label;
      if (Math.random() < 0.5 && r >= 6) {
        var a = randInt(2, r - 2);
        label = fmt(a / 10) + ' + ' + fmt((r - a) / 10);
      } else {
        var b = randInt(2, 9);
        label = fmt((r + b) / 10) + ' ' + MINUS + ' ' + fmt(b / 10);
      }
      return placeTask('place_expr', label, scene(n, n + 1, 10), r,
        'Сначала вычисли, потом ищи результат: десять делений между ' + n + ' и ' + (n + 1) + '.');
    }
    var pairs = [[2, 4], [2, 6], [3, 6], [2, 8], [4, 8]];
    for (var guard = 0; guard < 200; guard++) {
      var pr = pick(pairs), d1 = pr[0], d2 = pr[1], d = lcm(d1, d2);
      var k1 = randInt(1, d1 - 1), k2 = randInt(1, d2 - 1);
      var sum = k1 * (d / d1) + k2 * (d / d2);
      var L = Math.min(2, Math.floor(12 / d));
      if (sum % d === 0 || sum >= L * d) continue;
      if (gcd(k1, d1) !== 1 || gcd(k2, d2) !== 1) continue;
      return placeTask('place_expr', fr(k1, d1) + ' + ' + fr(k2, d2), scene(0, L, d), sum,
        'Приведи к общему знаменателю ' + d + ': одно деление = ' + fr(1, d) + '.');
    }
    return genPlaceDec();
  }

  function genPlaceNeg() {
    var v = randInt(0, 2);
    if (v === 0) {
      var k = pick([-5, -3, -1, 1]);
      var label = k < 0 ? (Math.random() < 0.5 ? fmt(k / 2) : MINUS + fr(-k, 2)) : fmt(k / 2);
      return placeTask('place_neg', label, scene(-3, 1, 2), k, 'Одно деление = 0,5. Отрицательные числа лежат левее нуля.');
    }
    var n = v === 1 ? 1 : 2, kk = -(n - 1) * 10 - randInt(1, 9);
    return placeTask('place_neg', fmt(kk / 10), scene(-n, -(n - 1), 10), kk,
      'Между ' + (-n) + ' и ' + (-(n - 1)) + ' десять делений, одно = 0,1. Чем левее, тем меньше.');
  }

  function makeItem(grade) {
    var neg = grade >= 6 && Math.random() < 0.25, t = randInt(0, 2), v, label;
    if (t === 0) { var k = randInt(1, 29); v = k / 10; label = fmt(v); }
    else if (t === 1) { var h = randInt(5, 195); if (h % 10 === 0) h++; v = h / 100; label = fmt(v); }
    else {
      var d = pick([2, 3, 4, 5, 6, 8]), kf;
      do { kf = randInt(1, d * 2 + d - 1); } while (kf % d === 0 || gcd(kf, d) !== 1);
      v = kf / d; label = (kf > d && Math.random() < 0.4) ? mixed(kf, d) : fr(kf, d);
    }
    if (neg) { v = -v; label = (t === 2 ? MINUS : '') + (t === 2 ? label : fmt(v)); }
    return { label: label, value: v };
  }
  function genOrder(grade) {
    for (var guard = 0; guard < 500; guard++) {
      var items = [], ok = true;
      for (var i = 0; i < 4; i++) items.push(makeItem(grade));
      for (var a = 0; a < 4 && ok; a++) for (var b = a + 1; b < 4; b++)
        if (Math.abs(items[a].value - items[b].value) < 0.04) { ok = false; break; }
      var types = {}; items.forEach(function (it) { types[it.label.indexOf('[') >= 0 ? 'f' : 'd'] = 1; });
      if (!ok || !(types.f && types.d)) continue;
      items.forEach(function (it, i) { it.id = i; });
      var hint = items.map(function (it) {
        var dv = Math.round(it.value * 100) / 100;
        return it.label + (it.label.indexOf('[') >= 0 ? ' ≈ ' + fmt(dv) : '');
      }).join('; ');
      return { type: 'order', kind: 'order', skill: 'numline', items: items, hint: 'Переведи всё в десятичные: ' + hint + '.' };
    }
    throw new Error('order: no set');
  }

  function makeNumlineRound(grade, n) {
    n = n || 5;
    var kinds = grade >= 6
      ? ['place_frac', 'place_expr', 'place_neg', 'order', pick(['place_dec', 'order'])]
      : ['place_dec', 'place_frac', 'place_expr', 'order', pick(['place_frac', 'place_expr', 'order'])];
    var gens = { place_dec: genPlaceDec, place_frac: genPlaceFrac, place_expr: genPlaceExpr, place_neg: genPlaceNeg, order: genOrder };
    var out = [], seen = {};
    shuffle(kinds).slice(0, n).forEach(function (kd) {
      for (var g = 0; g < 50; g++) {
        var t = gens[kd](grade), key = t.label || t.items.map(function (i) { return i.label; }).join('|');
        if (!seen[key]) { seen[key] = 1; out.push(t); return; }
      }
    });
    return out;
  }

  function checkPlace(task, k) { return k === task.k; }
  /* Порядок: нужно выбирать от меньшего к большему. chosen: id уже выбранных */
  function orderNext(task, chosen) {
    var rest = task.items.filter(function (it) { return chosen.indexOf(it.id) < 0; });
    rest.sort(function (a, b) { return a.value - b.value; });
    return rest.length ? rest[0] : null;
  }
  function checkOrderTap(task, chosen, id) { var nx = orderNext(task, chosen); return !!nx && nx.id === id; }

  function scoreNumline(o) { /* {type, ok, wrong, hint} */
    var base = 0;
    if (o.ok) base = o.type === 'order' ? Math.max(5, 20 - 5 * Math.min(o.wrong, 3)) : Math.max(10, 20 - 10 * o.wrong);
    var noHint = o.ok && o.wrong === 0 && !o.hint ? 5 : 0;
    return { base: base, noHint: noHint, total: base + noHint };
  }

  /* ================= МАСТЕРСКАЯ ПРЕВРАЩЕНИЙ ================= */
  var OPS = [2, 4, 5, 25, 125];
  var MAX_DEN = 1000;

  function workshopApply(task, st, k) {
    if (task.mode === 'mul') {
      if (st.b * k > MAX_DEN) return null;
      return { a: st.a * k, b: st.b * k };
    }
    if (st.a % k || st.b % k) return null;
    return { a: st.a / k, b: st.b / k };
  }
  function workshopDone(task, st) {
    return task.mode === 'mul' ? (st.b === 10 || st.b === 100 || st.b === 1000) : gcd(st.a, st.b) === 1;
  }
  /* Кратчайший путь (поиск в ширину): {dist, op} */
  function workshopMin(task, st) {
    if (workshopDone(task, st)) return { dist: 0, op: null };
    var seen = {}, q = [{ s: st, d: 0, first: null }];
    seen[st.a + '/' + st.b] = 1;
    for (var i = 0; i < q.length; i++) {
      var cur = q[i];
      for (var j = 0; j < task.ops.length; j++) {
        var nx = workshopApply(task, cur.s, task.ops[j]);
        if (!nx) continue;
        var key = nx.a + '/' + nx.b;
        if (seen[key]) continue;
        seen[key] = 1;
        var first = cur.first === null ? task.ops[j] : cur.first;
        if (workshopDone(task, nx)) return { dist: cur.d + 1, op: first };
        q.push({ s: nx, d: cur.d + 1, first: first });
      }
    }
    return { dist: Infinity, op: null };
  }
  function workshopDecimal(st) { return fmt(st.a / st.b); }

  var POOL_EASY = [2, 4, 5, 20, 25, 50], POOL_HARD = [8, 40, 125];
  function wsTask(kind, mode, start, extra) {
    var t = Object.assign({ type: 'workshop', kind: kind, skill: 'conversion', mode: mode, ops: OPS.slice(), start: start }, extra);
    t.min = workshopMin(t, start).dist;
    return t;
  }
  function genF2D(grade, hard) {
    var b = pick(hard ? POOL_HARD : POOL_EASY), a;
    do { a = randInt(1, b * (grade >= 6 ? 2 : 1) - 1); } while (gcd(a, b) !== 1);
    return wsTask('f2d', 'mul', { a: a, b: b }, { title: 'В десятичную дробь', label: fr(a, b) });
  }
  function genD2F(grade, hard) {
    var q = pick(hard ? POOL_HARD : [2, 4, 5, 20, 25, 50]), p;
    do { p = randInt(1, q * (grade >= 6 ? 2 : 1) - 1); } while (gcd(p, q) !== 1);
    var den = q >= 8 && q !== 20 && q !== 25 && q !== 50 ? 1000 : (q === 2 || q === 5 ? 10 : 100);
    var a = p * (den / q);
    return wsTask('d2f', 'div', { a: a, b: den }, { title: 'В обыкновенную дробь', label: fmt(a / den), dec: fmt(a / den) });
  }
  function makeWorkshopRound(grade, n) {
    n = n || 5;
    var spec = [['f2d', 0], ['d2f', 0], ['f2d', 0], ['d2f', grade >= 6 ? 1 : 0], ['f2d', 1]];
    var out = [], seen = {};
    spec.slice(0, n).forEach(function (sp) {
      for (var g = 0; g < 80; g++) {
        var t = sp[0] === 'f2d' ? genF2D(grade, !!sp[1]) : genD2F(grade, !!sp[1]);
        var key = t.kind + t.label;
        if (!seen[key] && t.min >= 1 && isFinite(t.min)) { seen[key] = 1; out.push(t); return; }
      }
    });
    return out;
  }
  function scoreWorkshop(o) { /* {steps, min, hint} */
    var extra = Math.max(0, o.steps - o.min);
    var base = Math.max(5, 20 - 5 * extra);
    var noHint = extra === 0 && !o.hint ? 5 : 0;
    return { base: base, noHint: noHint, total: base + noHint };
  }

  return Object.assign(L, {
    makeNumlineRound: makeNumlineRound, checkPlace: checkPlace, orderNext: orderNext, checkOrderTap: checkOrderTap,
    scoreNumline: scoreNumline,
    makeWorkshopRound: makeWorkshopRound, workshopApply: workshopApply, workshopDone: workshopDone,
    workshopMin: workshopMin, workshopDecimal: workshopDecimal, scoreWorkshop: scoreWorkshop
  });
});
