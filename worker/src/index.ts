interface Env {
  DB: D1Database;
  ADMIN_KEY: string;
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === 'POST' && url.pathname === '/verify') {
      return verify(req, env);
    }
    if (req.method === 'POST' && url.pathname === '/admin/issue') {
      return admin(req, env, issue);
    }
    if (req.method === 'POST' && url.pathname === '/admin/revoke') {
      return admin(req, env, revoke);
    }

    return json({ error: 'not_found' }, 404);
  },
};

async function verify(req: Request, env: Env): Promise<Response> {
  const body = await req.json<{ key?: string; hwid?: string; discord?: string }>().catch(() => null);
  if (!body?.key || !body.hwid) return json({ ok: false, error: 'missing' }, 400);

  const row = await env.DB.prepare(
    `SELECT hwid, discord_id, revoked, expires_at FROM licenses WHERE key = ?`
  ).bind(body.key.toUpperCase()).first<{
    hwid: string | null;
    discord_id: string | null;
    revoked: number;
    expires_at: number;
  }>();

  if (!row)                               return json({ ok: false, error: 'invalid' }, 404);
  if (row.revoked)                        return json({ ok: false, error: 'revoked' }, 403);
  if (row.expires_at < Date.now() / 1000) return json({ ok: false, error: 'expired' }, 403);

  // First check in, bind it.
  if (!row.hwid) {
    await env.DB.prepare(
      `UPDATE licenses SET hwid = ?, discord_id = ? WHERE key = ?`
    ).bind(body.hwid, body.discord ?? null, body.key.toUpperCase()).run();
    return json({ ok: true, bound: true });
  }

  if (row.hwid !== body.hwid) return json({ ok: false, error: 'hwid_mismatch' }, 409);
  return json({ ok: true });
}

async function admin(req: Request, env: Env, fn: (b: any, env: Env) => Promise<Response>): Promise<Response> {
  if (req.headers.get('x-admin-key') !== env.ADMIN_KEY) return json({ error: 'forbidden' }, 403);
  const body = await req.json<any>().catch(() => ({}));
  return fn(body, env);
}

async function issue(body: { tier?: string; days?: number }, env: Env): Promise<Response> {
  const key = randomKey();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (body.days ?? 30) * 86400;
  await env.DB.prepare(
    `INSERT INTO licenses (key, tier, created_at, expires_at, revoked) VALUES (?, ?, ?, ?, 0)`
  ).bind(key, body.tier ?? 'standard', now, exp).run();
  return json({ ok: true, key });
}

async function revoke(body: { key?: string }, env: Env): Promise<Response> {
  if (!body.key) return json({ error: 'missing' }, 400);
  await env.DB.prepare(`UPDATE licenses SET revoked = 1 WHERE key = ?`).bind(body.key.toUpperCase()).run();
  return json({ ok: true });
}

function randomKey(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let s = '';
  for (let i = 0; i < 20; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return `${s.slice(0, 5)}-${s.slice(5, 10)}-${s.slice(10, 15)}-${s.slice(15, 20)}`;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
