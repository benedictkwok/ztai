export const PRICING_DATA = {
  tiers: [
    {
      badge: "Most Popular", badgeColor: "neon",
      title: "Monthly Retainer",
      description: "Ongoing AI security support to build and mature your defenses. 10–40 hours/month depending on tier.",
      type: "tiers",
      items: [
        { label: "Small Business", price: "US$2,000–US$4,000", period: "/mo", detail: "~10 hrs/mo — foundational AI security guidance" },
        { label: "Mid-Market",     price: "US$5,000–US$8,000", period: "/mo", detail: "~20–30 hrs/mo — deep engagement reviewing the security posture of AI & providing advisory" },
        { label: "Enterprise",     price: "US$10,000–US$12,000", period: "/mo", detail: "~40 hrs/mo — full-spectrum program: red teaming, adversarial defense, compliance & AI Supply Chain security." },
      ],
    },
    {
      badge: "Time-Bound", badgeColor: "cyber",
      title: "Project-Based",
      description: "Best for one-time security assessments, red team engagements, and compliance preparation with defined deliverables.",
      type: "fixed",
      price: "US$12,000", suffix: "+",
      detail: "2 weeks minimum — scope-dependent",
      features: ["Defined scope & deliverables", "Written assessment report", "Compliance readiness packages", "Executive briefing included"],
    },
    {
      badge: "Flexible", badgeColor: "neon",
      title: "Hourly Advisory",
      description: "Ad-hoc advisory, intermittent security policy review, or expert consultation on demand. No long-term commitment.",
      type: "fixed",
      price: "US$250", suffix: "/hr+",
      detail: "Billed in 1-hour increments",
      features: ["No retainer required", "Ad-hoc advisory sessions", "Security policy review", "On-demand expert access"],
    },
  ],
};

async function signToken(secret) {
  const ts = Date.now().toString();
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(ts));
  const sig = Array.from(new Uint8Array(sigBuf))
    .map(b => b.toString(16).padStart(2, "0")).join("");
  return `${ts}.${sig}`;
}

export async function onRequestPost({ request, env }) {
  try {
    const { code } = await request.json();
    const expected = env.PRICING_CODE || "";

    if (!expected)
      return Response.json({ error: "Not configured" }, { status: 503 });

    if (!code || String(code).trim().toUpperCase() !== expected.trim().toUpperCase())
      return Response.json({ error: "Invalid code" }, { status: 401 });

    const token = await signToken(env.PRICING_SECRET || "dev-secret");
    const maxAge = 7 * 24 * 60 * 60;

    return new Response(JSON.stringify({ ok: true, pricing: PRICING_DATA }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Set-Cookie": `_ztp=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
      },
    });
  } catch {
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
