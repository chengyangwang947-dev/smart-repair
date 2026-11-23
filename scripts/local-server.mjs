// 本地开发/验证服务器：复用 Vercel 函数处理程序，无需安装 Vercel CLI
// 用法：node scripts/local-server.mjs  [端口]

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

// 读取本地 .env（不覆盖已存在的环境变量）
try {
  const envText = fs.readFileSync(path.join(root, '.env'), 'utf8');
  for (const line of envText.split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch {
  // 无 .env 时忽略
}

const routes = [
  ['POST', '/api/login', 'api/login.js'],
  ['POST', '/api/logout', 'api/logout.js'],
  ['GET', '/api/me', 'api/me.js'],
  ['GET', '/api/repairs', 'api/repairs/index.js'],
  ['POST', '/api/repairs', 'api/repairs/index.js'],
  ['GET', /^\/api\/repairs\/([^/]+)$/, 'api/repairs/[id].js'],
  ['PATCH', /^\/api\/repairs\/([^/]+)$/, 'api/repairs/[id].js'],
  ['POST', /^\/api\/suggestions\/([^/]+)$/, 'api/suggestions/[id].js'],
];

async function loadHandler(file) {
  const mod = await import(path.join(root, file));
  return mod.default;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const match = routes.find(([method, pattern]) => {
    if (method !== req.method) return false;
    return pattern instanceof RegExp ? pattern.test(url.pathname) : pattern === url.pathname;
  });

  if (match) {
    const [, pattern, file] = match;
    const handler = await loadHandler(file);
    const groups = pattern instanceof RegExp ? pattern.exec(url.pathname) : [];
    req.params = { id: groups[1] };
    req.query = { id: groups[1] };
    return handler(req, res);
  }

  if (req.method === 'GET' && url.pathname === '/') {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.end(fs.readFileSync(path.join(root, 'index.html')));
  }

  res.statusCode = 404;
  res.end('Not Found');
});

const port = Number(process.argv[2]) || 3100;
server.listen(port, () => console.log(`本地服务器已启动：http://localhost:${port}`));
