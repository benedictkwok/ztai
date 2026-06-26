const PERSONAL_EMAIL_DOMAINS = new Set([
  "gmail.com","googlemail.com","outlook.com","hotmail.com","live.com","msn.com",
  "yahoo.com","ymail.com","aol.com","icloud.com","me.com","mac.com",
  "protonmail.com","proton.me","mail.com","gmx.com","gmx.net","zohomail.com",
  "qq.com","163.com","126.com","sina.com","sohu.com",
]);

export async function onRequestPost({ request, env }) {
  try {
    const { name, company, email, website, message } = await request.json();

    if (!name || !company || !email || !website || !message)
      return Response.json({ error: "Missing required fields" }, { status: 400 });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Response.json({ error: "Invalid email address" }, { status: 400 });

    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && PERSONAL_EMAIL_DOMAINS.has(domain))
      return Response.json({ error: "Company email required" }, { status: 400 });

    if (env.RESEND_API_KEY) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "ZTAI Contact <noreply@ztai.ai>",
          to: "support@ztai.ai",
          subject: `Contact Form: ${name} — ${company} <${email}>`,
          text: [
            `Name:    ${name}`,
            `Company: ${company}`,
            `Email:   ${email}`,
            `Website: ${website}`,
            "",
            "Message:",
            message,
          ].join("\n"),
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("[contact] Resend error:", err);
        return Response.json({ error: "Failed to send email" }, { status: 502 });
      }
    } else {
      console.log("[contact] RESEND_API_KEY not set — logged only:", { name, company, email, website });
    }

    return Response.json({ status: "received" });
  } catch (err) {
    console.error("[contact]", err.message);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
