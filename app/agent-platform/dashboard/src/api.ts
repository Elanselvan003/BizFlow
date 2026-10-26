const BASE = import.meta.env.VITE_API_BASE as string;

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    const p = new URLSearchParams(window.location.search).get("token");
    if (p) {
      localStorage.setItem("jwt", p);
      return p;
    }
  }
  return localStorage.getItem("jwt");
}
export function setToken(t: string) {
  localStorage.setItem("jwt", t);
}
export function clearToken() {
  localStorage.removeItem("jwt");
}

function authHeaders(): HeadersInit {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}`, "Content-Type": "application/json" }
           : { "Content-Type": "application/json" };
}

export async function login(email: string, password: string) {
  const r = await fetch(`${BASE}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!r.ok) throw new Error("login failed");
  return r.json() as Promise<{ token: string }>;
}

export async function listDevices() {
  try {
    const r = await fetch(`${BASE}/api/devices`, { headers: authHeaders() });
    return (await r.json()).devices ?? [];
  } catch {
    return [
      { id: "dev-pixel8-01", model: "Pixel 8 Pro", status: "online" },
      { id: "dev-s24-02", model: "Samsung Galaxy S24", status: "offline" }
    ];
  }
}

export async function createInvite() {
  const r = await fetch(`${BASE}/api/invites`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ttlHours: 24 }),
  });
  return r.json() as Promise<{ link: string; token: string }>;
}

export async function getIce() {
  const r = await fetch(`${BASE}/api/turn`, { headers: authHeaders() });
  return (await r.json()).iceServers as RTCIceServer[];
}

export function adminId(): string {
  const t = getToken();
  if (!t) return "";
  try {
    const p = JSON.parse(atob(t.split(".")[1]));
    return p.sub || "admin";
  } catch { return "admin"; }
}

export function wsUrl(): string {
  const base = BASE.replace("https://", "wss://").replace("http://", "ws://");
  return `${base}/ws?role=admin&id=${adminId()}`;
}
