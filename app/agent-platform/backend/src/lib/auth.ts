import { verify } from "./jwt";
import { err } from "./http";

export interface Claims { sub: string; role: "admin" | "device"; adminId?: string; }

export async function requireAdmin(req: Request, secret: string): Promise<Claims | Response> {
  const h = req.headers.get("Authorization") ?? "";
  const t = h.startsWith("Bearer ") ? h.slice(7) : "";
  const c = await verify(t, secret);
  if (!c || c.role !== "admin") return err("unauthorized", 401);
  return { sub: c.sub, role: "admin" };
}

export async function pbkdf2(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const base = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 100_000, hash: "SHA-256" },
    base, 256,
  );
  return [...new Uint8Array(bits)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
