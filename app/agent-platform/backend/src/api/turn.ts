import { json } from "../lib/http";
import type { Claims } from "../lib/auth";

// Returns ICE servers. Uses Cloudflare Calls TURN if configured, else public STUN.
export async function getTurn(env: any, _admin: Claims): Promise<Response> {
  const iceServers: any[] = [
    { urls: "stun:stun.cloudflare.com:3478" },
    { urls: "stun:stun.l.google.com:19302" },
  ];

  if (env.TURN_KEY_ID && env.TURN_API_TOKEN) {
    try {
      const res = await fetch(
        `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.TURN_API_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ttl: 86400 }),
        },
      );
      const data = await res.json<any>();
      if (data?.iceServers) iceServers.push(data.iceServers);
    } catch { }
  }

  return json({ iceServers });
}