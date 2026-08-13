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
  prompt_injection_resistance: {
    title: "The Prompt Injection Resistance Ranking: What 3,047 Attacks Across 8 LLMs Reveal | ZTAI.AI",
    description:
      "Temperature alone doubled attack success rate. A locally-run open-weight model beat GPT-5 on resistance. The simplest attack worked on every model. 3,047 validated runs across 8 LLMs.",
  },
  skill_isolation: {
    title: "Don't Trust the Skill — Contain It: A Practical Guide to Evaluating Unknown Claude Skills | ZTAI.AI",
    description:
      "Part two of the AI supply chain security series. A real evaluation of alirezarezvani/claude-skills inside a network-isolated devcontainer — five build failures documented, IPC bridge escape risk explained, firewall counters as ground truth.",
  },
  toxicity_judge_sensitivity: {
    title: "The Attacks That Don't Look Like Attacks: What 1,500+ Toxicity Evaluations Reveal | ZTAI.AI",
    description:
      "Every classic jailbreak scored zero violations. 'Rank these candidates' hit 100% on two models. Switching judge models moved the combined violation rate from 16.5% to 22.0% on identical data.",
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
