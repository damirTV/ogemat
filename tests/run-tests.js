/* Запуск автотестов в Node:  node tests/run-tests.js   (из папки игры)
   Ничего устанавливать не нужно. Без Node те же проверки логики есть в tests/tests.html. */
'use strict';
var fs = require('fs'), path = require('path'), vm = require('vm');
var ROOT = path.join(__dirname, '..');
var N = Number((process.argv.find(function (a) { return /^--n=/.test(a); }) || '--n=300').slice(4));

var pass = 0, fail = 0, group = '';
var T = {
  group: function (name) { group = name; console.log('\n' + name); },
  ok: function (cond, name, detail) {
    if (cond) { pass++; console.log('  ✓ ' + name); }
    else { fail++; console.log('  ✗ ' + name + (detail ? '\n      ' + detail : '')); }
  }
};
function read(f) { return fs.readFileSync(path.join(ROOT, f), 'utf8'); }

/* Скрипты в том порядке, в каком их подключает index.html */
var html = read('index.html');
var scripts = []; html.replace(/<script src="([^"]+)"/g, function (_, s) { scripts.push(s); });

/* ---------- логика: в «браузерном» окружении, как в игре ---------- */
var ctx = { console: console, Math: Math, Set: Set };
ctx.self = ctx;
vm.createContext(ctx);
scripts.filter(function (s) { return /^logic\d*\.js$/.test(s); }).forEach(function (f) { vm.runInContext(read(f), ctx, { filename: f }); });
vm.runInContext(read('tests/logic-tests.js'), ctx, { filename: 'logic-tests.js' });
ctx.OGETests.run(ctx.Logic, T, { n: N });

/* ---------- проверки кода ---------- */
T.group('Код: кнопки и действия');
/* Ключи верхнего уровня в каждом Object.assign(…ACT, { … }) */
function actKeys(src) {
  var keys = [], re = /Object\.assign\((?:O|OGE)?\.?ACT,\s*\{/g, m;
  while ((m = re.exec(src))) {
    var i = m.index + m[0].length, depth = 1, tok = '';
    while (i < src.length && depth > 0) {
      var c = src.charAt(i);
      if (c === "'" || c === '"') {
        var j = src.indexOf(c, i + 1);
        while (src.charAt(j - 1) === '\\') j = src.indexOf(c, j + 1);
        var str = src.slice(i + 1, j); i = j + 1;
        if (depth === 1 && /^\s*:/.test(src.slice(i, i + 5))) keys.push(str);
        continue;
      }
      if (c === '{' || c === '(' || c === '[') depth++;
      else if (c === '}' || c === ')' || c === ']') depth--;
      else if (depth === 1 && /[A-Za-z_$]/.test(c)) {
        var w = /^[A-Za-z_$][\w$]*/.exec(src.slice(i))[0];
        if (/^\s*:/.test(src.slice(i + w.length, i + w.length + 5)) && /[{,]\s*$/.test(src.slice(Math.max(0, i - 20), i))) keys.push(w);
        i += w.length; continue;
      }
      i++;
    }
  }
  /* и одиночные назначения: O.ACT.sound = …, ACT['x'] = … */
  src.replace(/\bACT(?:\.([\w$]+)|\[['"]([a-z0-9-]+)['"]\])\s*=[^=]/g, function (_, a, b) { keys.push(a || b); });
  return keys;
}
var owner = {}, dups = [], allSrc = '';
scripts.filter(function (s) { return !/^logic/.test(s); }).forEach(function (f) {
  var src = read(f); allSrc += src;
  actKeys(src).forEach(function (k) {
    if (owner[k] && owner[k] !== f) dups.push('«' + k + '» в ' + owner[k] + ' и ' + f);
    owner[k] = owner[k] || f;
  });
});
T.ok(Object.keys(owner).length > 50, 'Найдены обработчики кнопок', Object.keys(owner).length + ' шт.');
T.ok(!dups.length, 'Имена действий не повторяются в разных файлах (иначе одно затирает другое)', dups.join('; '));
var missing = {};
allSrc.replace(/data-act=\\?"([a-z0-9-]+)\\?"/g, function (_, a) { if (!owner[a]) missing[a] = 1; });
allSrc.replace(/optBtn\('([a-z0-9-]+)'/g, function (_, a) { if (!owner[a]) missing[a] = 1; });
T.ok(!Object.keys(missing).length, 'У каждой кнопки есть обработчик', Object.keys(missing).join(', '));

T.group('Код: файлы и офлайн-режим');
var sw = read('sw.js'), cache = /var CACHE = '([^']+)'/.exec(sw);
T.ok(!!cache, 'В sw.js указана версия кэша', cache && cache[1]);
var notCached = scripts.concat(['styles.css', 'manifest.webmanifest']).filter(function (f) { return sw.indexOf("'" + f + "'") < 0; });
T.ok(!notCached.length, 'Все файлы игры попадают в офлайн-кэш (sw.js)', notCached.join(', '));
var absent = scripts.filter(function (f) { return !fs.existsSync(path.join(ROOT, f)); });
T.ok(!absent.length, 'Все скрипты из index.html существуют', absent.join(', '));
scripts.concat(['sw.js']).forEach(function (f) {
  try { new vm.Script(read(f), { filename: f }); T.ok(true, f + ': без синтаксических ошибок'); }
  catch (e) { T.ok(false, f + ': синтаксическая ошибка', e.message); }
});

console.log('\nИтого: ' + pass + ' пройдено, ' + fail + ' не пройдено');
process.exit(fail ? 1 : 0);
