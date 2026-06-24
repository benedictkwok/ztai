import { PRICING_DATA } from "./pricing-unlock.js";

function parseCookies(request) {
  return Object.fromEntries(
    (request.headers.get("Cookie") || "").split(";")
      .map(c => c.trim().split("="))
      .filter(p => p.length === 2)
      .map(([k, v]) => [k.trim(), decodeURIComponent(v.trim())])
  );
}

async function verifyToken(token, secret) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  if (Date.now() - parseInt(ts, 10) > 7 * 24 * 60 * 60 * 1000) return false;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const expectedBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ts));
  const expected = Array.from(new Uint8Array(expectedBuf))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  if (sig.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < sig.length; i++) diff |= sig.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

export async function onRequestGet({ request, env }) {
  const cookies = parseCookies(request);
  const token = cookies._ztp || "";

  if (!await verifyToken(token, env.PRICING_SECRET || "dev-secret"))
    return Response.json({ error: "Unauthorized" }, { status: 401 });

  return Response.json({ ok: true, pricing: PRICING_DATA });
}
