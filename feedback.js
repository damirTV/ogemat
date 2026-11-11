/* Обратная связь: без endpoint сообщения остаются только на устройстве.
   Для доставки укажите HTTPS endpoint в feedback-config.js. */
(function () {
  'use strict';
  var O = window.OGE, app = O.app, esc = O.esc;
  var QKEY = 'oge-feedback-v1', MAX = 2000, MIN = 5;
  var config = { endpoint: window.OGE_FEEDBACK_ENDPOINT || '' };
  var KINDS = [['bug', 'Ошибка'], ['idea', 'Идея'], ['other', 'Другое']];
  var F = { text: '', kind: 'bug', stage: 'form', busy: false, err: '' };

  function readQ() { try { var q = JSON.parse(localStorage.getItem(QKEY) || '[]'); return Array.isArray(q) ? q : []; } catch (e) { return []; } }
  function writeQ(q) { try { localStorage.setItem(QKEY, JSON.stringify(q.slice(-50))); } catch (e) { /* нет места или запрещено */ } }

  /* false означает локальную очередь без отправки в сеть */
  function transport(msg) {
    if (!config.endpoint) return Promise.resolve(false);
    return fetch(config.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(msg) })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return true; });
  }
  /* Сообщение всегда попадает в локальную очередь и удаляется только после HTTP-успеха. */
  function send(msg) {
    var q = readQ(); q.push(msg); writeQ(q);
    return transport(msg).then(function (delivered) {
      if (delivered) writeQ(readQ().filter(function (m) { return m.id !== msg.id; }));
      return { delivered: delivered };
    });
  }

  function valid() { return F.text.trim().length >= MIN; }
  function render() {
    if (F.stage === 'done') {
      app.innerHTML = '<div class="hero" style="padding-top:28px"><div class="badge badge-ok pop">' + O.ICON.check(36) + '</div><h1 class="h1">Спасибо!</h1>' +
        '<div class="hero-sub">' + (F.delivered ? 'Сообщение отправлено. Спасибо!' : 'Сообщение сохранено на этом устройстве.') + '</div></div>' +
        (F.delivered ? '' : '<p class="hint">Отправка ещё не настроена. Сообщение не покидало устройство.</p>') +
        '<div class="actions spacer"><button class="btn btn-primary" data-act="menu" data-primary>К заданиям</button></div>';
      O.postRender(); return;
    }
    var kinds = KINDS.map(function (k) { return '<button class="opt' + (F.kind === k[0] ? ' is-picked' : '') + '" data-act="fb-kind" data-k="' + k[0] + '" aria-pressed="' + (F.kind === k[0]) + '" style="justify-content:center;min-height:48px"><span class="sx">' + k[1] + '</span></button>'; }).join('');
    app.innerHTML = '<button class="btn-small back" data-act="menu">← Все задания</button>' +
      '<header class="home-hero"><h1 class="h1">Обратная связь</h1><p class="lead">Нашли ошибку, не понятно задание или есть идея? Напишите, и мы это учтём.</p></header>' +
      '<section class="card fb-card"><div class="label">О чём сообщение</div><div class="fb-kinds" role="group" aria-label="Тип сообщения">' + kinds + '</div>' +
      '<label class="label" for="fb-text">Сообщение</label><textarea id="fb-text" class="fb-area" rows="6" maxlength="' + MAX + '" placeholder="Например: в задании 11 неверно нарисован график…">' + esc(F.text) + '</textarea>' +
      '<div class="fb-count" id="fb-count">' + F.text.length + ' из ' + MAX + '</div></section>' +
      (F.err ? '<div class="banner banner-warn" id="fb-err" role="alert">' + esc(F.err) + '</div>' : '') +
      '<button class="btn btn-primary" data-act="fb-send" data-primary id="fb-send"' + (valid() && !F.busy ? '' : ' disabled') + '>' + (F.busy ? 'Отправляем…' : 'Отправить') + '</button>' +
      '<p class="hint">Прогресс и ответы не отправляются, только то, что вы здесь напишете.</p>';
    O.postRender();
  }
  function submit() {
    if (!valid() || F.busy) return;
    F.busy = true; F.err = '';
    var msg = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6), kind: F.kind, text: F.text.trim(), ts: new Date().toISOString() };
    render();
    send(msg).then(function (result) { F.busy = false; F.stage = 'done'; F.delivered = result.delivered; F.text = ''; O.announce(result.delivered ? 'Сообщение отправлено' : 'Сообщение сохранено на устройстве'); if (O.screen === 'feedback') render(); })
      .catch(function () { F.busy = false; F.err = 'Не удалось отправить. Сообщение сохранено на устройстве и уйдёт при следующей попытке.'; if (O.screen === 'feedback') render(); });
  }
  document.addEventListener('input', function (e) {
    var t = e.target;
    if (!t || O.screen !== 'feedback') return;
    if (t.id === 'fb-text') {
      F.text = t.value;
      var c = document.getElementById('fb-count'), b = document.getElementById('fb-send');
      if (c) c.textContent = F.text.length + ' из ' + MAX;
      if (b) b.disabled = !valid() || F.busy;
    }
  });

  O.feedback = { config: config, send: send, queue: readQ };
  O.screens.feedback = render;
  Object.assign(O.ACT, {
    feedback: function () { F.stage = 'form'; F.err = ''; F.busy = false; F.delivered = false; O.go('feedback'); },
    'fb-kind': function (d) { F.kind = d.k; render(); },
    'fb-send': submit
  });
})();
