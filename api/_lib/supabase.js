import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseReady = Boolean(url && key);

export const supabase = supabaseReady
  ? createClient(url, key, { auth: { persistSession: false } })
  : null;

export function requireSupabase() {
  if (!supabase) {
    const err = new Error('数据库未配置（缺少 SUPABASE_URL / SUPABASE_ANON_KEY）');
    err.statusCode = 503;
    throw err;
  }
  return supabase;
}

// 本组练习的小组标识：两名测试用户共享同一组报修
export const GROUP_ID = process.env.REPAIR_GROUP || 'group-01';
