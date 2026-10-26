import { json, err, body, uid } from "../lib/http";
import { sign } from "../lib/jwt";
import type { Claims } from "../lib/auth";

// Called by the Android app after install
export async function registerDevice(req: Request, env: any): Promise<Response> {
  const { inviteToken, androidId, model, osVersion, sdk } = await body(req);
  if (!inviteToken || !androidId) return err("inviteToken and androidId required");

  const invite = await env.DB
    .prepare("SELECT * FROM invites WHERE token=?")
    .bind(inviteToken).first<any>();
  if (!invite) return err("invalid invite", 404);
  if (invite.expires_at < Date.now()) return err("invite expired", 410);

  let device = await env.DB
    .prepare("SELECT * FROM devices WHERE android_id=?")
    .bind(androidId).first<any>();

  if (!device) {
    const id = uid();
    await env.DB
      .prepare(`INSERT INTO devices (id,admin_id,invite_token,android_id,model,os_version,sdk,status,last_seen,created_at)
                VALUES (?,?,?,?,?,?,?,'pending',?,?)`)
      .bind(id, invite.admin_id, inviteToken, androidId, model ?? null, osVersion ?? null, sdk ?? null, Date.now(), Date.now())
      .run();
    device = { id };
  }

  const deviceJwt = await sign(
    { sub: device.id, role: "device", adminId: invite.admin_id },
    env.JWT_SECRET,
    60 * 60 * 24 * 365,
  );

  return json({ deviceId: device.id, deviceToken: deviceJwt, hub: `/ws?role=device&id=${device.id}` });
}

export async function listDevices(env: any, admin: Claims): Promise<Response> {
  const { results } = await env.DB
    .prepare("SELECT * FROM devices WHERE admin_id=? ORDER BY created_at DESC")
    .bind(admin.sub).all();
  return json({ devices: results });
}

export async function deviceHistory(env: any, deviceId: string): Promise<Response> {
  const { results } = await env.DB
    .prepare("SELECT lat,lng,accuracy,ts FROM location_pings WHERE device_id=? ORDER BY ts DESC LIMIT 500")
    .bind(deviceId).all();
  return json({ pings: results });
}