import { getUser } from './_lib/auth.js';
import { json, handleError } from './_lib/http.js';

export default async function handler(req, res) {
  try {
    const user = getUser(req);
    if (!user) return json(res, 401, { user: null });
    json(res, 200, { user });
  } catch (err) {
    handleError(res, err);
  }
}
