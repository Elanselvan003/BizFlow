import { json, body, uid, token } from "../lib/http";
import type { Claims } from "../lib/auth";

export async function createInvite(req: Request, env: any, admin: Claims): Promise<Response> {
  const { ttlHours = 24 } = await body(req).catch(() => ({} as any));
  const id = uid();
  const tok = token(12);
  const now = Date.now();

  await env.DB
    .prepare("INSERT INTO invites (id,token,admin_id,created_at,expires_at) VALUES (?,?,?,?,?)")
    .bind(id, tok, admin.sub, now, now + ttlHours * 3600_000).run();

  return json({
    token: tok,
    link: `${env.PUBLIC_HOST}/i/${tok}`,
    expiresAt: now + ttlHours * 3600_000,
  });
}

export async function listInvites(env: any, admin: Claims): Promise<Response> {
  const { results } = await env.DB
    .prepare("SELECT * FROM invites WHERE admin_id=? ORDER BY created_at DESC")
    .bind(admin.sub).all();
  return json({ invites: results });
}