const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'links.json');
const RESERVED = new Set(['api', 'favicon.ico', 'health']);

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]\n');

function readLinks() {
  try { return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
  catch { return []; }
}
function writeLinks(links) {
  const temporary = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(links, null, 2));
  fs.renameSync(temporary, DATA_FILE);
}
function send(res, status, body, contentType = 'application/json; charset=utf-8') {
  res.writeHead(status, { 'Content-Type': contentType, 'Cache-Control': 'no-store' });
  res.end(Buffer.isBuffer(body) || typeof body === 'string' ? body : JSON.stringify(body));
}
function parseJson(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk;
      if (body.length > 100000) { reject(new Error('Request too large')); req.destroy(); }
    });
    req.on('end', () => {
      try { resolve(body ? JSON.parse(body) : {}); } catch { reject(new Error('Invalid JSON')); }
    });
  });
}
function isSafeCode(code) { return /^[a-zA-Z0-9_-]{3,32}$/.test(code) && !RESERVED.has(code.toLowerCase()); }
function createCode(links) {
  let code;
  do { code = crypto.randomBytes(4).toString('base64url'); }
  while (links.some(link => link.code.toLowerCase() === code.toLowerCase()));
  return code;
}
function validateUrl(value) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.href : null;
  } catch { return null; }
}
function publicLink(req, code) { return `http://${req.headers.host}/${code}`; }
function cleanLink(req, link) {
  return { ...link, shortUrl: publicLink(req, link.code) };
}
function serveStatic(req, res, pathname) {
  const requested = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) return false;
  const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'application/javascript; charset=utf-8', '.svg': 'image/svg+xml' }[path.extname(filePath)] || 'application/octet-stream';
  send(res, 200, fs.readFileSync(filePath), mime);
  return true;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = decodeURIComponent(url.pathname);
  try {
    if (req.method === 'GET' && pathname === '/health') return send(res, 200, { status: 'ok' });
    if (req.method === 'GET' && pathname === '/api/links') {
      const links = readLinks().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return send(res, 200, links.map(link => cleanLink(req, link)));
    }
    if (req.method === 'POST' && pathname === '/api/links') {
      const input = await parseJson(req);
      const destination = validateUrl(String(input.url || '').trim());
      if (!destination) return send(res, 400, { error: 'Enter a valid http:// or https:// URL.' });
      const links = readLinks();
      const requestedCode = String(input.code || '').trim();
      if (requestedCode && !isSafeCode(requestedCode)) return send(res, 400, { error: 'Custom alias must be 3–32 letters, numbers, hyphens, or underscores.' });
      const code = requestedCode || createCode(links);
      if (links.some(link => link.code.toLowerCase() === code.toLowerCase())) return send(res, 409, { error: 'That custom alias is already taken.' });
      const link = { id: crypto.randomUUID(), code, destination, title: String(input.title || '').trim().slice(0, 120), createdAt: new Date().toISOString(), clicks: 0, lastVisitedAt: null };
      links.push(link); writeLinks(links);
      return send(res, 201, cleanLink(req, link));
    }
    if (req.method === 'DELETE' && pathname.startsWith('/api/links/')) {
      const id = pathname.split('/').pop();
      const links = readLinks(); const filtered = links.filter(link => link.id !== id);
      if (links.length === filtered.length) return send(res, 404, { error: 'Link not found.' });
      writeLinks(filtered); return send(res, 204, '');
    }
    if (req.method === 'GET' && pathname.startsWith('/api/links/')) {
      const id = pathname.split('/').pop();
      const link = readLinks().find(item => item.id === id);
      return link ? send(res, 200, cleanLink(req, link)) : send(res, 404, { error: 'Link not found.' });
    }
    if (req.method === 'GET' && pathname.length > 1) {
      const code = pathname.slice(1);
      const links = readLinks(); const link = links.find(item => item.code.toLowerCase() === code.toLowerCase());
      if (link) {
        link.clicks += 1; link.lastVisitedAt = new Date().toISOString(); writeLinks(links);
        res.writeHead(302, { Location: link.destination, 'Cache-Control': 'no-store' }); return res.end();
      }
    }
    if (req.method === 'GET' && serveStatic(req, res, pathname)) return;
    return send(res, 404, { error: 'Not found.' });
  } catch (error) {
    console.error(error); return send(res, 500, { error: 'Something went wrong. Please try again.' });
  }
});
server.listen(PORT, '0.0.0.0', () => console.log(`Shortly is running at http://${HOST}:${PORT}`));
