// 今日文章生成 Worker。产品形态见 docs/product-shape.md
//
// 这个 Worker 只干一件事：把「今天背的词 + 今天这一格语法」写成一段能读的短文。
// 它不编排学习、不判断掌握度、不解锁课程——那些用确定性规则做，更可控也更便宜。
//
// 和 Azure 发音评测 Worker（worker/）保持完全独立：两种风险、两套密钥，不混在一起。
import { auditArticle, requiredSeedHits } from './a1-guard.js';
import { validateArticleRequest, normalizeArticle } from './schema.js';

const DEFAULT_ORIGIN = 'https://zhujiang777.github.io';
const MAX_ATTEMPTS = 2;

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function allowedOrigins(env) {
  return String(env.ALLOWED_ORIGINS || DEFAULT_ORIGIN)
    .split(',').map(value => value.trim().replace(/\/+$/, '')).filter(Boolean);
}

function corsHeaders(origin, env) {
  const normalized = String(origin || '').replace(/\/+$/, '');
  const allowed = allowedOrigins(env);
  return {
    'Access-Control-Allow-Origin': allowed.includes(normalized) ? normalized : allowed[0],
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}

function json(value, status, origin, env) {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(origin, env),
    },
  });
}

async function sameSecret(provided, expected) {
  if (!provided || !expected) return false;
  const encoder = new TextEncoder();
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(provided)),
    crypto.subtle.digest('SHA-256', encoder.encode(expected)),
  ]);
  const a = new Uint8Array(left);
  const b = new Uint8Array(right);
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.min(a.length, b.length); i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

async function requireAuth(request, env) {
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!await sameSecret(token, env.APP_ACCESS_TOKEN)) {
    throw new HttpError(401, 'unauthorized', '访问码不正确');
  }
}

/** 生成失败一律返回这个：客户端看到 article:null 就退回库里的现成材料。 */
function giveUp(reason, audit = null) {
  return { schemaVersion: 1, source: 'fallback', article: null, reason, audit };
}

export function buildMessages(summary) {
  const need = requiredSeedHits(summary.seedWords);
  const rules = [
    '你在给一位零基础德语学习者写今天的短文。只返回 JSON，不要任何解释。',
    `必须用上这些词（至少 ${need} 个，可以变形）：${summary.seedWords.join('、')}`,
    summary.grammarZh ? `必须练到这个语法点：${summary.grammarZh}` : '',
    summary.sceneHint ? `场景设定：${summary.sceneHint}` : '场景自己挑一个德国日常生活里真会遇到的',
    '3 到 5 句，每句不超过 12 个词，句句配中文翻译。',
    '只用 Goethe A1 范围：不许有从句（weil/dass/wenn 都不行）、不许第二格介词、不许被动、不许过去时。',
    '除给定的词外，最多再引入 3 个新词。',
    '再出一道中文理解题，两个选项，answer 是正确选项的下标。',
    'JSON 结构：{sceneZh,titleDe,titleZh,sentences:[{de,zh}],question:{zh,options:[a,b],answer}}',
  ].filter(Boolean).join('\n');

  return [
    { role: 'system', content: rules },
    {
      role: 'user',
      content: JSON.stringify({
        seedWords: summary.seedWords,
        grammarZh: summary.grammarZh,
        sceneHint: summary.sceneHint,
        // 已知词只作为"可以放心使用"的参考，不要求全部用上。
        knownWordsSample: summary.knownWords.slice(0, 120),
        variant: summary.variant,
      }),
    },
  ];
}

function providerUrl(env) {
  const base = String(env.OPENAI_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!base || !env.OPENAI_MODEL || !env.OPENAI_API_KEY) return null;
  let url;
  try { url = new URL(`${base}/chat/completions`); }
  catch { return null; }
  if (url.protocol !== 'https:') return null;
  return url.toString();
}

async function askOnce(summary, env, attempt) {
  const url = providerUrl(env);
  const controller = new AbortController();
  const configured = Number(env.REQUEST_TIMEOUT_MS);
  const timeoutMs = Number.isFinite(configured) && configured > 0 ? Math.min(configured, 20000) : 12000;
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: env.OPENAI_MODEL,
        // 低温：这是教学材料，不是创意写作。第二次重试稍微放开，换个说法而不是换个词。
        temperature: attempt === 0 ? 0.3 : 0.6,
        response_format: { type: 'json_object' },
        messages: buildMessages(summary),
      }),
      signal: controller.signal,
    });
  } catch {
    return { error: 'provider-unavailable' };
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok) return { error: response.status === 429 ? 'quota' : 'provider-error' };
  try {
    const body = await response.json();
    return { raw: JSON.parse(body.choices?.[0]?.message?.content || '') };
  } catch {
    return { error: 'invalid-provider-response' };
  }
}

export async function generateArticle(summary, env) {
  if (!providerUrl(env)) return giveUp('not-configured');
  let lastAudit = null;
  let lastError = 'schema-rejected';

  // 过不了闸就重来一次。两次都不行就退回库存——绝不把不合格的东西放进学习流程。
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const { raw, error } = await askOnce(summary, env, attempt);
    if (error) { lastError = error; if (error !== 'invalid-provider-response') break; continue; }
    const article = normalizeArticle(raw);
    if (!article) { lastError = 'schema-rejected'; continue; }
    const audit = auditArticle(article, {
      knownWords: summary.knownWords, seedWords: summary.seedWords,
    });
    if (audit.ok) return { schemaVersion: 1, source: 'model', article, audit };
    lastAudit = audit;
    lastError = `a1-${audit.flags[0]}`;
  }
  return giveUp(lastError, lastAudit);
}

async function handle(request, env) {
  const origin = request.headers.get('Origin') || '';
  if (origin && !allowedOrigins(env).includes(origin.replace(/\/+$/, ''))) {
    throw new HttpError(403, 'origin-denied', '不允许的网页来源');
  }
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders(origin, env) });
  await requireAuth(request, env);
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/v1/health') {
    return json({ ok: true, configured: !!providerUrl(env), schemaVersion: 1 }, 200, origin, env);
  }
  if (request.method === 'POST' && url.pathname === '/v1/article/generate') {
    let body;
    try { body = await request.json(); }
    catch { throw new HttpError(400, 'invalid-json', '请求不是有效 JSON'); }
    const summary = validateArticleRequest(body);
    if (!summary) throw new HttpError(400, 'invalid-summary', '学习摘要不符合 Schema');
    return json(await generateArticle(summary, env), 200, origin, env);
  }
  throw new HttpError(404, 'not-found', '接口不存在');
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    try { return await handle(request, env); }
    catch (error) {
      const status = error instanceof HttpError ? error.status : 500;
      const code = error instanceof HttpError ? error.code : 'internal';
      const message = error instanceof HttpError ? error.message : 'Coach Worker 内部错误';
      return json({ error: { code, message } }, status, origin, env);
    }
  },
};
