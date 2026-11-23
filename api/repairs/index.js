import { requireSupabase, GROUP_ID } from '../_lib/supabase.js';
import { getUser, unauthorized } from '../_lib/auth.js';
import { json, readBody, handleError } from '../_lib/http.js';

const VALID_STATUS = ['pending', 'processing', 'done'];

// GET /api/repairs?status=all|pending|processing|done
// POST /api/repairs  { reporterName, officeArea, device, description }
export default async function handler(req, res) {
  try {
    const user = getUser(req);
    if (!user) throw unauthorized();
    const supabase = requireSupabase();

    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost');
      const status = url.searchParams.get('status') || 'all';
      let query = supabase
        .from('repairs')
        .select('id, reporter_name, office_area, device, description, status, created_at')
        .eq('group_id', GROUP_ID)
        .order('created_at', { ascending: false });
      if (status !== 'all') query = query.eq('status', status);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      return json(res, 200, { repairs: data || [] });
    }

    if (req.method === 'POST') {
      const body = await readBody(req);
      const { reporterName, officeArea, device, description } = body || {};
      if (!reporterName || !officeArea || !device || !description) {
        return json(res, 400, { error: '姓名、办公区、设备、故障描述均为必填项' });
      }
      const supabase = requireSupabase();
      const { data, error } = await supabase
        .from('repairs')
        .insert({
          reporter_name: reporterName,
          office_area: officeArea,
          device,
          description,
          status: 'pending',
          group_id: GROUP_ID,
        })
        .select('id, reporter_name, office_area, device, description, status, created_at')
        .single();
      if (error) throw new Error(error.message);
      return json(res, 201, { repair: data });
    }

    json(res, 405, { error: '仅支持 GET / POST' });
  } catch (err) {
    handleError(res, err);
  }
}
