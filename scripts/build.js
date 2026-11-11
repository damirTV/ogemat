const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const out = path.join(root, 'dist');
const staticFiles = [
  'index.html',
  'styles.css',
  'app.js',
  'feedback-config.js',
  'feedback.js',
  'manifest.webmanifest',
  'sound.js',
  'sw.js',
  ...Array.from({ length: 11 }, (_, index) => `logic${index ? index + 1 : ''}.js`),
  ...Array.from({ length: 9 }, (_, index) => `modes${index ? index + 1 : ''}.js`)
];

function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(out, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function copyDirectory(relativePath) {
  const source = path.join(root, relativePath);
  fs.readdirSync(source, { withFileTypes: true }).forEach((entry) => {
    const child = path.join(relativePath, entry.name);
    if (entry.isDirectory()) copyDirectory(child);
    else copyFile(child);
  });
}

function cacheVersion(files) {
  const hash = crypto.createHash('sha256');
  files.forEach((relativePath) => {
    hash.update(relativePath);
    hash.update(fs.readFileSync(path.join(root, relativePath)));
  });
  return `oge-calc-${hash.digest('hex').slice(0, 12)}`;
}

fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });

staticFiles.filter((file) => file !== 'sw.js').forEach(copyFile);
copyDirectory('icons');

const versionedServiceWorker = fs
  .readFileSync(path.join(root, 'sw.js'), 'utf8')
  .replace('oge-calc-build', cacheVersion(staticFiles.filter((file) => file !== 'sw.js')));
fs.writeFileSync(path.join(out, 'sw.js'), versionedServiceWorker);

console.log(`Built ${out}`);
