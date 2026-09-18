/* Локальный просмотр сайта: node serve.js  →  http://localhost:4173
   Для хостинга этот файл НЕ нужен — загружайте только index.html, css, js, img
   и текстовые файлы (robots.txt, sitemap.xml, .htaccess, favicon.svg). */
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname);
const PORT = 4173;
const TYPES = {
  '.html':'text/html; charset=utf-8', '.css':'text/css; charset=utf-8',
  '.js':'application/javascript; charset=utf-8', '.svg':'image/svg+xml',
  '.json':'application/json; charset=utf-8', '.txt':'text/plain; charset=utf-8',
  '.xml':'application/xml; charset=utf-8', '.webmanifest':'application/manifest+json',
  '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png',
  '.webp':'image/webp', '.avif':'image/avif', '.ico':'image/x-icon',
  '.woff2':'font/woff2', '.woff':'font/woff'
};

http.createServer(function (req, res) {
  var p = decodeURIComponent(req.url.split('?')[0]);
  if (p.endsWith('/')) p += 'index.html';
  var file = path.resolve(path.join(ROOT, p));
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('forbidden'); return; }

  fs.readFile(file, function (err, data) {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('404 — не найдено: ' + p);
      return;
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}).listen(PORT, function () {
  console.log('Сайт открыт: http://localhost:' + PORT);
});
