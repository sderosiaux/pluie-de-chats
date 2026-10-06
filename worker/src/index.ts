// Classement par averse (GAME_SPEC §23). POST /submit rejoue la partie et garde le meilleur score
// par appareil ; GET /top renvoie le top 50 et le rang de l'appareil.

import { parseSubmission, verify } from './submission';

export interface Env {
  DB: D1Database;
  ALLOWED_ORIGINS: string;
}

const MAX_BODY = 16 * 1024;
const TOP_N = 50;

function cors(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') ?? '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map(s => s.trim());
  if (!allowed.includes(origin)) return {};
  return { 'Access-Control-Allow-Origin': origin, 'Vary': 'Origin', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' };
}

function json(data: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json', ...headers } });
}

async function rankOf(env: Env, averseId: string, score: number): Promise<{ rank: number; total: number }> {
  const row = await env.DB.prepare(
    'SELECT (SELECT COUNT(*) FROM scores WHERE averse_id = ?1 AND score > ?2) + 1 AS rank, (SELECT COUNT(*) FROM scores WHERE averse_id = ?1) AS total',
  ).bind(averseId, score).first<{ rank: number; total: number }>();
  return { rank: row?.rank ?? 1, total: row?.total ?? 0 };
}

async function submit(req: Request, env: Env, h: Record<string, string>): Promise<Response> {
  const text = await req.text();
  if (text.length > MAX_BODY) return json({ error: 'bad_request' }, 413, h);
  let body: unknown;
  try { body = JSON.parse(text); } catch { return json({ error: 'bad_request' }, 400, h); }
  const sub = parseSubmission(body);
  if (!sub) return json({ error: 'bad_request' }, 400, h);
  const v = verify(sub);
  if (typeof v === 'string') return json({ error: v }, 422, h);

  // Un appareil = une ligne par averse ; on ne remplace que par un meilleur score.
  await env.DB.prepare(
    `INSERT INTO scores (averse_id, device_id, pseudo, score, stars, best_chain, log, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
     ON CONFLICT (averse_id, device_id) DO UPDATE SET
       pseudo = excluded.pseudo, score = excluded.score, stars = excluded.stars,
       best_chain = excluded.best_chain, log = excluded.log, created_at = excluded.created_at
     WHERE excluded.score > scores.score`,
  ).bind(v.averseId, v.deviceId, v.pseudo, v.score, v.stars, v.bestChain, JSON.stringify(v.log), Date.now()).run();

  const best = await env.DB.prepare('SELECT score FROM scores WHERE averse_id = ?1 AND device_id = ?2')
    .bind(v.averseId, v.deviceId).first<{ score: number }>();
  const bestScore = best?.score ?? v.score;
  return json({ accepted: true, score: v.score, best: bestScore, ...(await rankOf(env, v.averseId, bestScore)) }, 200, h);
}

async function top(url: URL, env: Env, h: Record<string, string>): Promise<Response> {
  const averseId = url.searchParams.get('averse') ?? '';
  if (!/^\d{1,2}-[1-5]$/.test(averseId)) return json({ error: 'bad_request' }, 400, h);
  const { results } = await env.DB.prepare(
    'SELECT pseudo, score, stars, best_chain AS bestChain FROM scores WHERE averse_id = ?1 ORDER BY score DESC, created_at ASC LIMIT ?2',
  ).bind(averseId, TOP_N).all<{ pseudo: string; score: number; stars: number; bestChain: number }>();
  const deviceId = url.searchParams.get('deviceId');
  let me: { score: number; rank: number; total: number } | null = null;
  if (deviceId) {
    const mine = await env.DB.prepare('SELECT score FROM scores WHERE averse_id = ?1 AND device_id = ?2')
      .bind(averseId, deviceId).first<{ score: number }>();
    if (mine) me = { score: mine.score, ...(await rankOf(env, averseId, mine.score)) };
  }
  return json({ averseId, top: results, me }, 200, h);
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const h = cors(req, env);
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method === 'POST' && url.pathname === '/submit') return submit(req, env, h);
    if (req.method === 'GET' && url.pathname === '/top') return top(url, env, h);
    return json({ error: 'not_found' }, 404, h);
  },
} satisfies ExportedHandler<Env>;
