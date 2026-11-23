import { json } from '../_lib/http.js';

export default async function handler(req, res) {
  res.setHeader('Set-Cookie', 'sr_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
  json(res, 200, { ok: true });
}
