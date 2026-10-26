import { cors, json, err } from "./lib/http";
import { requireAdmin } from "./lib/auth";
import { login, registerAdmin } from "./api/auth";
import { createInvite, listInvites } from "./api/invites";
import { registerDevice, listDevices, deviceHistory } from "./api/devices";
import { getTurn } from "./api/turn";
import { landingPage } from "./delivery/landing";

export { DeviceHub } from "./durable/hub";

export default {
  async fetch(req: Request, env: any, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(req.url);

    if (req.method === "OPTIONS") return new Response(null, { headers: cors });

    // ---- WebSocket entry -> route into the admin's Durable Object ----
    if (url.pathname === "/ws") {
      const role = url.searchParams.get("role") ?? url.searchParams.get("type");
      const id = url.searchParams.get("id") ?? url.searchParams.get("deviceId");
      const adminId = url.searchParams.get("admin") ?? id ?? "";
      if (!role || !id) return err("role and id required", 400);

      let hubKey = adminId;
      if (role === "device") {
        const dev = await env.DB.prepare("SELECT admin_id FROM devices WHERE id=? OR android_id=?").bind(id, id).first<any>();
        if (!dev) return err("unknown device", 404);
        hubKey = dev.admin_id;
      }
      const stub = env.HUB.get(env.HUB.idFromName(hubKey));
      return stub.fetch(new Request(`${url.origin}/ws?role=${role}&id=${id}`, req));
    }

    // ---- Landing page ----
    if (url.pathname.startsWith("/i/")) {
      const token = url.pathname.split("/i/")[1];
      return landingPage(token, env.PUBLIC_HOST);
    }

    // ---- Public API ----
    if (url.pathname === "/api/login" && req.method === "POST") return login(req, env);
    if (url.pathname === "/api/register" && req.method === "POST") return registerAdmin(req, env);
    if (url.pathname === "/api/devices/register" && req.method === "POST") return registerDevice(req, env);

    // ---- Admin API ----
    if (url.pathname.startsWith("/api/")) {
      const admin = await requireAdmin(req, env.JWT_SECRET);
      if (admin instanceof Response) return admin;

      if (url.pathname === "/api/invites" && req.method === "POST") return createInvite(req, env, admin);
      if (url.pathname === "/api/invites" && req.method === "GET") return listInvites(env, admin);
      if (url.pathname === "/api/devices" && req.method === "GET") return listDevices(env, admin);
      if (url.pathname === "/api/turn" && req.method === "GET") return getTurn(env, admin);

      const hist = url.pathname.match(/^\/api\/devices\/([^/]+)\/history$/);
      if (hist) return deviceHistory(env, hist[1]);

      const ctl = url.pathname.match(/^\/api\/devices\/([^/]+)\/control$/);
      if (ctl && req.method === "POST") {
        const payload = await req.json<any>();
        const dev = await env.DB.prepare("SELECT admin_id FROM devices WHERE id=?").bind(ctl[1]).first<any>();
        if (!dev) return err("unknown device", 404);
        const stub = env.HUB.get(env.HUB.idFromName(dev.admin_id));
        return stub.fetch(new Request(`${url.origin}/control`, {
          method: "POST",
          body: JSON.stringify({ deviceId: ctl[1], ...payload }),
        }));
      }
    }

    // ---- Static assets (APK, index.html, etc.) ----
    if (url.pathname.startsWith("/apk/")) {
      const assetUrl = new URL(url.pathname, req.url);
      const assetReq = new Request(assetUrl.toString(), { headers: req.headers });
      if (env.ASSETS) {
        const res = await env.ASSETS.fetch(assetReq);
        if (res.status !== 404) {
          const headers = new Headers(res.headers);
          headers.set("Content-Type", "application/vnd.android.package-archive");
          headers.set("Content-Disposition", 'attachment; filename="orvian-agent.apk"');
          return new Response(res.body, { status: res.status, headers });
        }
      }
    }

    if (env.ASSETS) {
      const res = await env.ASSETS.fetch(req);
      if (res.status !== 404) return res;
    }

    return json({ ok: true, service: "orvian-api" });
  },
};