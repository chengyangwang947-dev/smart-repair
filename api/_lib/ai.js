// AI 排查建议生成：火山方舟豆包（OpenAI 兼容协议），服务端调用，密钥不下发浏览器

const BASE_URL = process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3';
const API_KEY = process.env.DOUBAO_API_KEY;
const MODEL = process.env.DOUBAO_MODEL || 'doubao-seed-2-1-pro-260628';

export const aiReady = Boolean(API_KEY);

function buildPrompt({ device, description }) {
  const system = [
    '你是办公设备故障排查助手。根据报修信息，给出三条普通人可以安全尝试的初步排查建议。',
    '要求：',
    '1. 建议通俗、简短、可操作；',
    '2. 只做安全的外围检查（检查连接线、重启、换端口/纸张、查看报错提示等）；',
    '3. 严禁指导带电拆机、拆部件、触碰内部电路等危险操作；',
    '4. 若问题需要专业维修，最后一条建议明确提示联系专业维修人员；',
    '5. 严格按如下格式输出，不要寒暄、不要编号以外的解释：',
    '建议一：……',
    '建议二：……',
    '建议三：……',
  ].join('\n');
  const user = `设备：${device}\n故障描述：${description}\n请给出三条排查建议。`;
  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

// 调用模型并解析出三条建议；失败时抛出带 statusCode 的错误
export async function generateSuggestions({ device, description }) {
  if (!API_KEY) {
    const err = new Error('AI 服务未配置密钥（DOUBAO_API_KEY）');
    err.statusCode = 503;
    throw err;
  }
  let resp;
  try {
    resp = await fetch(`${BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: buildPrompt({ device, description }),
        temperature: 0.4,
        stream: false,
      }),
    });
  } catch (e) {
    const err = new Error(`AI 服务网络请求失败：${e.message}`);
    err.statusCode = 502;
    throw err;
  }

  if (!resp.ok) {
    const text = await resp.text();
    const err = new Error(`AI 服务返回错误（HTTP ${resp.status}）：${text.slice(0, 200)}`);
    err.statusCode = 502;
    throw err;
  }

  const data = await resp.json();
  const content = data?.choices?.[0]?.message?.content || '';
  const suggestions = parseSuggestions(content);

  if (suggestions.length === 0) {
    const err = new Error('AI 返回内容无法解析为有效建议');
    err.statusCode = 502;
    throw err;
  }
  return suggestions.slice(0, 3);
}

// 解析 “建议一：xxx / 1. xxx” 等格式为字符串数组
function parseSuggestions(content) {
  if (!content) return [];
  const lines = content
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  const out = [];
  for (const line of lines) {
    const cleaned = line
      .replace(/^(建议[一二三四1-3][：:、.．])/u, '')
      .replace(/^\d+[.、．]/, '')
      .trim();
    if (cleaned) out.push(cleaned);
  }
  return out;
}
