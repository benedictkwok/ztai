"use strict";

require("dotenv").config();

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true", // true for port 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.resolve(__dirname, "public");

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css":  "text/css; charset=utf-8",
  ".js":   "text/javascript; charset=utf-8",
  ".svg":  "image/svg+xml",
  ".png":  "image/png",
  ".jpg":  "image/jpeg",
  ".ico":  "image/x-icon",
  ".woff2": "font/woff2",
  ".woff":  "font/woff",
};

// ── Pricing cookie helpers ────────────────────────────────────────────────

function parseCookies(req) {
  return Object.fromEntries(
    (req.headers.cookie || "").split(";")
      .map(c => c.trim().split("="))
      .filter(p => p.length === 2)
      .map(([k, v]) => [k.trim(), decodeURIComponent(v.trim())])
  );
}

function signPricingToken() {
  const secret = process.env.PRICING_SECRET || "dev-secret";
  const ts = Date.now().toString();
  const sig = crypto.createHmac("sha256", secret).update(ts).digest("hex");
  return `${ts}.${sig}`;
}

function verifyPricingToken(token) {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2) return false;
  const [ts, sig] = parts;
  if (Date.now() - parseInt(ts, 10) > 7 * 24 * 60 * 60 * 1000) return false;
  const secret = process.env.PRICING_SECRET || "dev-secret";
  const expected = crypto.createHmac("sha256", secret).update(ts).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
  } catch { return false; }
}

const PRICING_DATA = {
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

/**
 * Resolve a URL pathname to an absolute file path inside PUBLIC_DIR.
 * Returns null if the resolved path escapes PUBLIC_DIR (path traversal guard).
 */
function resolvePublicPath(urlPath) {
  const decoded = decodeURIComponent(urlPath);
  const relative = decoded === "/" ? "index.html" : decoded.replace(/^\/+/, "");
  const absolute = path.resolve(PUBLIC_DIR, relative);
  // Security: ensure the resolved path stays inside PUBLIC_DIR
  if (!absolute.startsWith(PUBLIC_DIR + path.sep) && absolute !== PUBLIC_DIR) {
    return null;
  }
  return absolute;
}

const server = http.createServer((req, res) => {
  // API route: assessment intake
  if (req.method === "POST" && req.url === "/api/intake") {
    handleIntake(req, res);
    return;
  }

  // API route: general contact form
  if (req.method === "POST" && req.url === "/api/contact") {
    handleContact(req, res);
    return;
  }

  // API route: NDA pricing unlock
  if (req.method === "POST" && req.url === "/api/pricing-unlock") {
    handlePricingUnlock(req, res);
    return;
  }

  // API route: check existing pricing cookie
  if (req.method === "GET" && req.url === "/api/pricing-check") {
    handlePricingCheck(req, res);
    return;
  }

  // Only allow GET and HEAD for static files
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { Allow: "GET, HEAD, POST" });
    res.end("Method Not Allowed");
    return;
  }

  const urlPath = req.url.split("?")[0]; // strip query strings
  const filePath = resolvePublicPath(urlPath);

  if (!filePath) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === "ENOENT") {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      } else {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("Internal Server Error");
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, {
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    });
    res.end(req.method === "HEAD" ? undefined : data);
  });
});

function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function handleIntake(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
    if (body.length > 8192) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Payload too large" }));
      req.destroy();
    }
  });
  req.on("end", async () => {
    try {
      const data = JSON.parse(body);
      const email = String(data.email || "").trim();
      const architecture = String(data.architecture || "").trim();

      if (!email || !architecture) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required fields" }));
        return;
      }

      // Basic email format check
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid email address" }));
        return;
      }

      // Send email notification
      await transporter.sendMail({
        from: `"ZTAI Intake" <${process.env.SMTP_USER}>`,
        to: "support@ztai.ai",
        subject: `New Assessment Request from ${email}`,
        text: [
          `Email: ${email}`,
          "",
          "AI Architecture Description:",
          architecture,
        ].join("\n"),
        html: `
          <h2 style="font-family:monospace">New Assessment Request</h2>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          <h3 style="font-family:monospace">AI Architecture Description</h3>
          <pre style="background:#f4f4f4;padding:12px;border-radius:4px">${escapeHtml(architecture)}</pre>
        `,
      });

      console.log("[intake] email sent →", email);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "received" }));
    } catch (err) {
      console.error("[intake] error:", err.message, err.code || "", err.responseCode || "");
      if (err.responseCode || (err.code && err.code.startsWith("ECONNECTION"))) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to send email" }));
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON" }));
      }
    }
  });
}

async function handleContact(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
    if (body.length > 8192) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Payload too large" }));
      req.destroy();
    }
  });
  req.on("end", async () => {
    try {
      const data = JSON.parse(body);
      const name    = String(data.name    || "").trim();
      const email   = String(data.email   || "").trim();
      const message = String(data.message || "").trim();

      if (!name || !email || !message) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing required fields" }));
        return;
      }

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid email address" }));
        return;
      }

      // Send email if SMTP is configured; skip silently in dev when it's not
      if (process.env.SMTP_HOST) {
        await transporter.sendMail({
          from: `"ZTAI Contact" <${process.env.SMTP_USER}>`,
          to: "support@ztai.ai",
          subject: `Contact Form: ${name} <${email}>`,
          text: [`Name: ${name}`, `Email: ${email}`, "", "Message:", message].join("\n"),
          html: `
            <h2 style="font-family:monospace">New Contact Submission</h2>
            <p><strong>Name:</strong> ${escapeHtml(name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(email)}</p>
            <h3 style="font-family:monospace">Message</h3>
            <pre style="background:#f4f4f4;padding:12px;border-radius:4px">${escapeHtml(message)}</pre>
          `,
        });
        console.log("[contact] email sent →", email);
      } else {
        console.log("[contact] SMTP not configured — submission logged only:", { name, email });
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "received" }));
    } catch (err) {
      console.error("[contact] error:", err.message);
      if (err.responseCode || (err.code && err.code.startsWith("ECONNECTION"))) {
        res.writeHead(502, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Failed to send email" }));
      } else {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid request" }));
      }
    }
  });
}

function handlePricingUnlock(req, res) {
  let body = "";
  req.on("data", (chunk) => {
    body += chunk.toString();
    if (body.length > 1024) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Payload too large" }));
      req.destroy();
    }
  });
  req.on("end", () => {
    try {
      const { code } = JSON.parse(body);
      const expected = process.env.PRICING_CODE || "";
      if (!expected) {
        res.writeHead(503, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Not configured" }));
        return;
      }
      if (!code || String(code).trim().toUpperCase() !== expected.trim().toUpperCase()) {
        res.writeHead(401, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid code" }));
        return;
      }
      const token = signPricingToken();
      const maxAge = 7 * 24 * 60 * 60;
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Set-Cookie": `_ztp=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`,
      });
      res.end(JSON.stringify({ ok: true, pricing: PRICING_DATA }));
    } catch {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid request" }));
    }
  });
}

function handlePricingCheck(req, res) {
  const cookies = parseCookies(req);
  const token = cookies._ztp || "";
  if (!verifyPricingToken(token)) {
    res.writeHead(401, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Unauthorized" }));
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: true, pricing: PRICING_DATA }));
}

server.listen(PORT, "127.0.0.1", () => {
  console.log(`ZTAI server running → http://localhost:${PORT}`);
});
