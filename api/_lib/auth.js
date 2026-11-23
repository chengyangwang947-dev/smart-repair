import crypto from 'node:crypto';

// 测试用户由环境变量 TEST_USERS 提供，格式：
// [{"username":"studentA","password":"repair2026A","name":"A同学"}, ...]
function parseUsers() {
  try {
    const list = JSON.parse(process.env.TEST_USERS || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function verifyCredentials(username, password) {
  const u = parseUsers().find(
    (item) => item.username === username && item.password === password
  );
  if (!u) return null;
  return { username: u.username, name: u.name || u.username };
}

function secret() {
  return process.env.SESSION_SECRET || 'dev-insecure-secret-change-me';
}

export function signToken(username) {
  const payload = `${username}.${Date.now() + 1000 * 60 * 60 * 12}`;
  const sig = crypto.createHmac('sha256', secret()).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyToken(token) {
  if (!token || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [username, expiry, sig] = parts;
  const expected = crypto
    .createHmac('sha256', secret())
    .update(`${username}.${expiry}`)
    .digest('hex');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  if (Number(expiry) < Date.now()) return null;
  const user = parseUsers().find((item) => item.username === username);
  if (!user) return null;
  return { username: user.username, name: user.name || user.username };
}

function parseCookies(header = '') {
  const out = {};
  header.split(';').forEach((piece) => {
    const idx = piece.indexOf('=');
    if (idx > -1) out[piece.slice(0, idx).trim()] = decodeURIComponent(piece.slice(idx + 1).trim());
  });
  return out;
}

// 从请求头解析当前登录用户；未登录返回 null
export function getUser(req) {
  const cookies = parseCookies(req.headers.cookie || '');
  const token = cookies.sr_session;
  return verifyToken(token);
}

export function unauthorized(message = '未登录或登录已过期，请先登录') {
  const err = new Error(message);
  err.statusCode = 401;
  return err;
}
