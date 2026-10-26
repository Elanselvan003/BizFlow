import { SignJWT, jwtVerify } from "jose";

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function sign(
  payload: Record<string, unknown>,
  secret: string,
  ttlSec = 60 * 60 * 24 * 30,
): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + ttlSec)
    .sign(key(secret));
}

export async function verify(
  jwt: string,
  secret: string,
): Promise<Record<string, any> | null> {
  try {
    const { payload } = await jwtVerify(jwt, key(secret));
    return payload as Record<string, any>;
  } catch {
    return null;
  }
}
