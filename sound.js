/* Звуки без музыки: тихие синтезированные сигналы (Web Audio), файлов не нужно.
   Выключается кнопкой «Звук» в меню; выбор хранится на устройстве. */
(function () {
  'use strict';
  var O = window.OGE, app = O.app;
  var SKEY = 'oge-sound';
  var on = true;
  try { on = localStorage.getItem(SKEY) !== '0'; } catch (e) { /* по умолчанию включён */ }

  var ctx = null, master = null, played = [];
  function ac() {
    if (!on) return null;
    try {
      if (!ctx) {
        var C = window.AudioContext || window.webkitAudioContext;
        if (!C) return null;
        ctx = new C();
        master = ctx.createGain(); master.gain.value = 0.5;
        var lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200;
        master.connect(lp); lp.connect(ctx.destination);
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    } catch (e) { return null; }
  }
  /* Мягкая нота: быстрое нарастание и плавное затухание, с тихим верхним тоном для «колокольчика» */
  function tone(freq, at, dur, peak, glideTo, bell) {
    var c = ctx, t = c.currentTime + at;
    [[1, 1], [2, bell ? 0.22 : 0]].forEach(function (h) {
      if (!h[1]) return;
      var o = c.createOscillator(), g = c.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(freq * h[0], t);
      if (glideTo) o.frequency.exponentialRampToValueAtTime(glideTo * h[0], t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(peak * h[1], t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(master);
      o.start(t); o.stop(t + dur + 0.05);
    });
  }
  var SOUNDS = {
    good:    function () { tone(660, 0, 0.28, 0.07, 0, true); },
    success: function () { tone(523, 0, 0.45, 0.1, 0, true); tone(784, 0.13, 0.6, 0.1, 0, true); },
    soft:    function () { tone(330, 0, 0.45, 0.08, 262); },
    oops:    function () { tone(300, 0, 0.3, 0.07, 240); },
    finish:  function () { tone(523, 0, 0.6, 0.09, 0, true); tone(659, 0.17, 0.6, 0.09, 0, true); tone(784, 0.34, 0.9, 0.09, 0, true); }
  };
  function play(name) {
    played.push(name); if (played.length > 200) played.shift();
    if (!ac() || !SOUNDS[name]) return;
    try { SOUNDS[name](); } catch (e) { /* звук не должен ломать игру */ }
  }

  /* Звуки результата: смотрим, что появилось на экране после очередной отрисовки */
  var lastSig = '', pending = false;
  function txt(el) { return el ? el.textContent.replace(/\s+/g, ' ').trim() : ''; }
  function check() {
    pending = false;
    var base = txt(app.querySelector('.progress-label')) + '|' + txt(app.querySelector('.chip-pts')) + '|';
    var h1 = txt(app.querySelector('h1'));
    var kind = null, sig = '';
    var wrong = app.querySelector('#msg, .banner-err, .banner-warn, .opt.is-wrong');
    var good = app.querySelector('.banner-info b, .chip-ok');
    if (app.querySelector('.badge-ok') && /Раунд завершён/.test(h1)) { kind = 'finish'; sig = base + h1; }
    else if (app.querySelector('.hero .badge-ok')) { kind = 'success'; sig = base + h1; }
    else if (app.querySelector('.hero .badge-warn')) { kind = 'soft'; sig = base + h1; }
    else if (wrong) { kind = 'oops'; sig = base + txt(wrong) + '|' + txt(app.querySelector('.foot .label:last-child')); }
    else if (good && /^(Верно|Порядок верный|Порядок расставлен|Доли одинаковые|Подходит|Твоя прикидка|Нашёл)/.test(txt(good).replace(/^\S*\s?(?=Твоя)/, ''))) { kind = 'good'; sig = base + txt(good); }
    if (!kind) { lastSig = ''; return; }
    if (sig === lastSig) return;
    lastSig = sig;
    play(kind);
  }
  new MutationObserver(function () { if (!pending) { pending = true; setTimeout(check, 0); } }).observe(app, { childList: true });

  /* Переключатель */
  O.ACT.sound = function () {
    on = !on;
    try { localStorage.setItem(SKEY, on ? '1' : '0'); } catch (e) { /* ничего */ }
    if (on) play('good');
    O.refresh();
  };
  O.sound = { on: function () { return on; }, play: play, get played() { return played; } };
  O.refresh();
})();
