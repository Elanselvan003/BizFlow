/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

export class DeviceHub {
  state: DurableObjectState;
  env: Env;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);

    // WebSocket upgrade
    if (url.pathname.endsWith("/ws")) {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair) as [WebSocket, WebSocket];
      const role = url.searchParams.get("role") as "admin" | "device";
      const id = url.searchParams.get("id") ?? "";

      this.state.acceptWebSocket(server, [role, id]);
      server.serializeAttachment({ role, id });

      if (role === "device") {
        this.broadcast("admin", { type: "device_online", deviceId: id });
        await this.env.DB
          .prepare("UPDATE devices SET status='online', last_seen=? WHERE id=?")
          .bind(Date.now(), id).run();
      } else {
        // send current online device list
        const online = this.state.getWebSockets("device")
          .map((w) => (w.deserializeAttachment() as any)?.id);
        server.send(JSON.stringify({ type: "snapshot", online }));
      }

      return new Response(null, { status: 101, webSocket: client });
    }

    // POST /control — admin → device
    if (url.pathname.endsWith("/control")) {
      const { deviceId, action, ...rest } = await req.json<any>();
      const target = this.state.getWebSockets(deviceId)[0];
      if (!target) return new Response(JSON.stringify({ ok: false, reason: "offline" }), { status: 200 });
      target.send(JSON.stringify({ type: "control", action, ...rest }));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }

    return new Response("not found", { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, raw: string | ArrayBuffer) {
    const msg = JSON.parse(typeof raw === "string" ? raw : new TextDecoder().decode(raw));
    const att = ws.deserializeAttachment() as { role: string; id: string };

    if (att.role === "device") {
      if (msg.type === "location") {
        await this.env.DB
          .prepare("INSERT INTO location_pings (device_id,lat,lng,accuracy,speed,bearing,ts) VALUES (?,?,?,?,?,?,?)")
          .bind(att.id, msg.lat, msg.lng, msg.acc ?? null, msg.speed ?? null, msg.bearing ?? null, Date.now())
          .run();
        this.broadcast("admin", { type: "location", deviceId: att.id, ...msg });
      } else if (msg.type === "screen_state" || msg.type === "ack") {
        this.broadcast("admin", { ...msg, deviceId: att.id });
      } else if (msg.type === "offer" || msg.type === "answer" || msg.type === "ice") {
        this.broadcast("admin", { ...msg, deviceId: att.id });
      }
      // heartbeat
      await this.env.DB.prepare("UPDATE devices SET last_seen=? WHERE id=?")
        .bind(Date.now(), att.id).run();
    } else {
      // admin → device signaling / control
      const targetId = msg.deviceId;
      if (msg.type === "offer" || msg.type === "answer" || msg.type === "ice" || msg.type === "control") {
        const target = this.state.getWebSockets(targetId)[0];
        if (target) target.send(JSON.stringify(msg));
      }
    }
  }

  async webSocketClose(ws: WebSocket) {
    const att = ws.deserializeAttachment() as { role: string; id: string };
    if (att.role === "device") {
      this.broadcast("admin", { type: "device_offline", deviceId: att.id });
      await this.env.DB
        .prepare("UPDATE devices SET status='offline', last_seen=? WHERE id=?")
        .bind(Date.now(), att.id).run();
    }
  }

  broadcast(tag: string, data: unknown) {
    const payload = JSON.stringify(data);
    for (const ws of this.state.getWebSockets(tag)) {
      try { ws.send(payload); } catch { }
    }
  }
}
