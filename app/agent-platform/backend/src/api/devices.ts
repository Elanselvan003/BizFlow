import { json, err, body, uid } from "../lib/http";
import { sign } from "../lib/jwt";
import type { Claims } from "../lib/auth";

// Called by the Android app after install
export async function registerDevice(req: Request, env: any): Promise<Response> {
  const data = await body(req).catch(() => ({}));
  let inviteToken = (data.inviteToken ?? data.inviteCode ?? data.code ?? "").toString().trim();
  const androidId = (data.androidId ?? data.deviceId ?? data.id ?? uid()).toString().trim();
  const model = data.model ?? "Android Device";
  const osVersion = data.osVersion ?? "Android";
  const sdk = data.sdk ?? 34;

  // Clean up if user pasted full invite URL like https://.../i/TOKEN or with query params
  if (inviteToken.includes("/i/")) {
    inviteToken = inviteToken.split("/i/")[1].split("?")[0].trim();
  } else if (inviteToken.includes("token=")) {
    inviteToken = inviteToken.split("token=")[1].split("&")[0].trim();
  }

  if (!inviteToken) return err("Invite code is required", 400);

  const invite = await env.DB
    .prepare("SELECT * FROM invites WHERE token=?")
    .bind(inviteToken).first<any>();
  if (!invite) return err(`Invalid invite code "${inviteToken}". Please generate a new invite code from the dashboard.`, 404);
  if (invite.expires_at < Date.now()) return err("This invite code has expired. Please generate a new one from the dashboard.", 410);

  let device = await env.DB
    .prepare("SELECT * FROM devices WHERE id=? OR android_id=?")
    .bind(androidId, androidId).first<any>();

  if (!device) {
    const id = androidId;
    await env.DB
      .prepare(`INSERT INTO devices (id,admin_id,invite_token,android_id,model,os_version,sdk,status,last_seen,created_at)
                VALUES (?,?,?,?,?,?,?,'online',?,?)`)
      .bind(id, invite.admin_id, inviteToken, androidId, model, osVersion, sdk, Date.now(), Date.now())
      .run();
    device = { id };
  } else {
    await env.DB
      .prepare(`UPDATE devices SET admin_id=?, invite_token=?, model=?, os_version=?, status='online', last_seen=? WHERE id=? OR android_id=?`)
      .bind(invite.admin_id, inviteToken, model, osVersion, Date.now(), device.id, androidId)
      .run();
  }

  // Mark invite as used if column exists
  await env.DB.prepare("UPDATE invites SET used=1 WHERE token=?").bind(inviteToken).run().catch(() => {});

  const deviceJwt = await sign(
    { sub: device.id, role: "device", adminId: invite.admin_id },
    env.JWT_SECRET,
    60 * 60 * 24 * 365,
  );

  return json({ ok: true, deviceId: device.id, deviceToken: deviceJwt, hub: `/ws?role=device&id=${device.id}` });
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