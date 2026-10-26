import { json, err, body, uid, token } from "../lib/http";
import { pbkdf2 } from "../lib/auth";
import { sign } from "../lib/jwt";

export async function login(req: Request, env: any): Promise<Response> {
  const { email, password } = await body(req);
  if (!email || !password) return err("email and password required");

  const user = await env.DB
    .prepare("SELECT * FROM users WHERE email=?")
    .bind(email.toLowerCase()).first<any>();

  if (!user) return err("invalid credentials", 401);
  const hash = await pbkdf2(password, user.pw_salt);
  if (hash !== user.pw_hash) return err("invalid credentials", 401);

  const jwt = await sign({ sub: user.id, role: "admin" }, env.JWT_SECRET);
  return json({ token: jwt, email: user.email });
}

export async function registerAdmin(req: Request, env: any): Promise<Response> {
  const { email, password } = await body(req);
  if (!email || !password) return err("email and password required");

  const exists = await env.DB.prepare("SELECT id FROM users WHERE email=?")
    .bind(email.toLowerCase()).first();
  if (exists) return err("user exists");

  const salt = token(16);
  const hash = await pbkdf2(password, salt);
  const id = uid();
  await env.DB
    .prepare("INSERT INTO users (id,email,pw_hash,pw_salt,created_at) VALUES (?,?,?,?,?)")
    .bind(id, email.toLowerCase(), hash, salt, Date.now()).run();

  const jwt = await sign({ sub: id, role: "admin" }, env.JWT_SECRET);
  return json({ token: jwt, email });
}