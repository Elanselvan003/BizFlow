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
      const role = url.searchParams.get("role");
      const id = url.searchParams.get("id");
      const adminId = url.searchParams.get("admin") ?? id ?? "";
      if (!role || !id) return err("role and id required");

      // devices join their admin's hub; admins join their own hub
      let hubKey = adminId;
      if (role === "device") {
        const dev = await env.DB.prepare("SELECT admin_id FROM devices WHERE id=?").bind(id).first<any>();
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

      // proxy control command into the hub
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

    return json({ ok: true, service: "orvian-api" });
  },
};