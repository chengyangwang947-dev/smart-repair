import { requireSupabase, GROUP_ID } from '../_lib/supabase.js';
import { getUser, unauthorized } from '../_lib/auth.js';
import { json, readBody, handleError } from '../_lib/http.js';

const VALID_STATUS = ['pending', 'processing', 'done'];

async function findRepair(supabase, id) {
  const { data, error } = await supabase
    .from('repairs')
    .select('*')
    .eq('id', id)
    .eq('group_id', GROUP_ID)
    .single();
  if (error) return null;
  return data;
}

export default async function handler(req, res) {
  try {
    const user = getUser(req);
    if (!user) throw unauthorized();
    const supabase = requireSupabase();
    const id = req.query?.id || req.params?.id;
    if (!id) return json(res, 400, { error: '缺少报修单 ID' });

    const repair = await findRepair(supabase, id);
    if (!repair) return json(res, 404, { error: '未找到该报修单' });

    // GET 详情（含已保存的建议）
    if (req.method === 'GET') {
      const { data: suggestions, error } = await supabase
        .from('repair_suggestions')
        .select('id, content, created_at')
        .eq('repair_id', id)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return json(res, 200, { repair, suggestions: suggestions || [] });
    }

    // PATCH 修改状态
    if (req.method === 'PATCH') {
      const body = await readBody(req);
      const { status } = body || {};
      if (!VALID_STATUS.includes(status)) {
        return json(res, 400, { error: '状态值无效，可选：pending / processing / done' });
      }
      const { data, error } = await supabase
        .from('repairs')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('group_id', GROUP_ID)
        .select('id, reporter_name, office_area, device, description, status, created_at')
        .single();
      if (error) throw new Error(error.message);
      return json(res, 200, { repair: data });
    }

    json(res, 405, { error: '仅支持 GET / PATCH' });
  } catch (err) {
    handleError(res, err);
  }
}
