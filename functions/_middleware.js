const ARTICLES = {
  shadow_ai: {
    title: "How a 'Go-AI-First' Company Eliminated Shadow AI Risk | ZTAI.AI",
    description:
      "An enterprise tech firm achieved 100% AI usage visibility and SOC2/GDPR audit-readiness by deploying a corporate AI sandbox with EDR and SIEM integration — without slowing developers.",
  },
  skills: {
    title: "The Hidden Threat in Your AI Toolchain | ZTAI.AI",
    description:
      "13.4% of community AI skills contain critical security flaws. A single malicious skill can silently harvest AWS credentials, SSH keys, and database secrets while appearing to work perfectly.",
  },
};

export async function onRequest(context) {
  const { request, next } = context;
  const url = new URL(request.url);
  const slug = url.searchParams.get("blogname");
  const article = slug && ARTICLES[slug];

  if (!article) return next();

  const response = await next();
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  let html = await response.text();

  const ogTags = `
  <meta property="og:title" content="${article.title}" />
  <meta property="og:description" content="${article.description}" />
  <meta property="og:url" content="${url.href}" />
  <meta property="og:type" content="article" />
  <meta property="og:site_name" content="ZTAI.AI" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${article.title}" />
  <meta name="twitter:description" content="${article.description}" />`;

  // Replace default title and inject article-specific OG tags
  html = html
    .replace(/<title>.*?<\/title>/, `<title>${article.title}</title>`)
    .replace(/(<meta property="og:title"[^>]*>)/, ogTags + "\n  <!-- og:replaced -->")
    .replace(/\s*<meta property="og:(?!replaced)[^>]*>\n?/g, "")
    .replace(/\s*<meta name="twitter:[^>]*>\n?/g, "")
    .replace("<!-- og:replaced -->", "");

  return new Response(html, {
    status: response.status,
    headers: { ...Object.fromEntries(response.headers), "content-type": "text/html;charset=UTF-8" },
  });
}
