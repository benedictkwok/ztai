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

  // Replace <title>
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${article.title}</title>`);

  // Replace content attributes in-place for each existing OG/twitter tag
  html = html
    .replace(/(<meta property="og:title"\s+content=")[^"]*(")/,       `$1${article.title}$2`)
    .replace(/(<meta property="og:description"\s+content=")[^"]*(")/,  `$1${article.description}$2`)
    .replace(/(<meta property="og:url"\s+content=")[^"]*(")/,          `$1${url.href}$2`)
    .replace(/(<meta property="og:type"\s+content=")[^"]*(")/,         `$1article$2`)
    .replace(/(<meta name="twitter:title"\s+content=")[^"]*(")/,       `$1${article.title}$2`)
    .replace(/(<meta name="twitter:description"\s+content=")[^"]*(")/,  `$1${article.description}$2`);

  return new Response(html, {
    status: response.status,
    headers: { ...Object.fromEntries(response.headers), "content-type": "text/html;charset=UTF-8" },
  });
}
