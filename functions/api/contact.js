export async function onRequestPost({ request, env }) {
  try {
    const { name, email, message } = await request.json();

    if (!name || !email || !message)
      return Response.json({ error: "Missing required fields" }, { status: 400 });

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return Response.json({ error: "Invalid email address" }, { status: 400 });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "ZTAI Contact <noreply@ztai.ai>",
        to: "support@ztai.ai",
        subject: `Contact Form: ${name} <${email}>`,
        text: [`Name: ${name}`, `Email: ${email}`, "", "Message:", message].join("\n"),
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("[contact] Resend error:", err);
      return Response.json({ error: "Failed to send email" }, { status: 502 });
    }

    return Response.json({ status: "received" });
  } catch (err) {
    console.error("[contact]", err.message);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
