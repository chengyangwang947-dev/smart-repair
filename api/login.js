import { signToken, verifyCredentials } from './_lib/auth.js';
import { json, readBody, handleError } from './_lib/http.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return json(res, 405, { error: '仅支持 POST' });
  try {
    const { username, password } = await readBody(req);
    const user = verifyCredentials(username || '', password || '');
    if (!user) {
      return json(res, 401, { error: '账号或密码不正确' });
    }
    const token = signToken(user.username);
    res.setHeader(
      'Set-Cookie',
      `sr_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200`
    );
    json(res, 200, { user });
  } catch (err) {
    handleError(res, err);
  }
}
