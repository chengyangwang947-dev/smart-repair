import { requireSupabase, GROUP_ID } from '../_lib/supabase.js';
import { getUser, unauthorized } from '../_lib/auth.js';
import { generateSuggestions } from '../_lib/ai.js';
import { json, handleError } from '../_lib/http.js';

// POST /api/suggestions/:id — 为某条报修生成并保存三条 AI 排查建议
export default async function handler(req, res) {
  try {
    const user = getUser(req);
    if (!user) throw unauthorized();
    const supabase = requireSupabase();
    const repairId = req.query?.id || req.params?.id;
    if (!repairId) return json(res, 400, { error: '缺少报修单 ID' });

    const { data: repair, error: findErr } = await supabase
      .from('repairs')
      .select('id, device, description, status')
      .eq('id', repairId)
      .eq('group_id', GROUP_ID)
      .single();
    if (findErr || !repair) return json(res, 404, { error: '未找到该报修单' });

    // 已有建议则直接返回，避免重复点击重复消耗 AI 额度
    const { data: existing } = await supabase
      .from('repair_suggestions')
      .select('id, content, created_at')
      .eq('repair_id', repairId)
      .order('created_at', { ascending: true });
    if (existing && existing.length > 0) {
      return json(res, 200, { suggestions: existing, reused: true });
    }

    const suggestions = await generateSuggestions({
      device: repair.device,
      description: repair.description,
    });

    const rows = suggestions.map((content) => ({ repair_id: repairId, content }));
    const { data: saved, error: saveErr } = await supabase
      .from('repair_suggestions')
      .insert(rows)
      .select('id, content, created_at');

    if (saveErr) {
      // AI 已生成但保存失败：明确提示，不影响原报修单
      return json(res, 500, { error: `建议已生成但保存失败：${saveErr.message}` });
    }
    return json(res, 201, { suggestions: saved || [], reused: false });
  } catch (err) {
    handleError(res, err);
  }
}
