export function landingPage(token: string, host: string): Response {
  const deepLink = `orvian://bind?token=${token}&host=${encodeURIComponent(host)}`;
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Install Orvian Agent</title>
<style>
  :root{--bg:#0b0f17;--fg:#e8eefc;--accent:#3b82f6}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
       background:var(--bg);color:var(--fg);display:flex;min-height:100vh;
       align-items:center;justify-content:center;padding:24px}
  .card{max-width:420px;width:100%;background:#131a26;border:1px solid #1e293b;
        border-radius:16px;padding:32px;text-align:center}
  h1{font-size:22px;margin:0 0 8px}
  p{color:#94a3b8;font-size:14px;line-height:1.5}
  a.btn{display:block;background:var(--accent);color:#fff;text-decoration:none;
        padding:14px;border-radius:10px;font-weight:600;margin-top:20px}
  .meta{margin-top:20px;font-size:12px;color:#64748b;word-break:break-all}
  .code{background:#0b0f17;border:1px solid #1e293b;border-radius:8px;
        padding:10px;margin-top:12px;font-family:monospace;font-size:12px}
</style>
</head>
<body>
  <div class="card">
    <h1>Orvian Agent</h1>
    <p>Install the Orvian agent to enable live fleet tracking, screen streaming, and remote terminal management.</p>
    <a class="btn" href="/apk/orvian-agent.apk?token=${token}">Download Orvian for Android</a>
    <a class="btn" style="background:#1e293b" href="${deepLink}">Already installed? Open Orvian</a>
    <div class="meta">Invite token</div>
    <div class="code">${token}</div>
  </div>
</body>
</html>`;
  return new Response(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
}