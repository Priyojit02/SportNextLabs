import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT || 3000;
const DIST = path.join(process.cwd(), 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};

function sendFile(filePath, res) {
  const ext = path.extname(filePath);
  res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname);
  let filePath = path.join(DIST, urlPath === '/' ? 'index.html' : urlPath);

  fs.stat(filePath, (err, stats) => {
    if (!err && stats.isFile()) return sendFile(filePath, res);

    // SPA fallback to 200.html (created by postbuild)
    const fallback = path.join(DIST, '200.html');
    fs.stat(fallback, (e2, s2) => {
      if (!e2 && s2.isFile()) return sendFile(fallback, res);
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    });
  });
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Static server listening on port ${PORT}`);
});
