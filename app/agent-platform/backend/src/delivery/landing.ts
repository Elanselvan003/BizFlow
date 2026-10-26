export function landingPage(token: string, host: string): Response {
  const apkUrl = `/apk/orvian-agent.apk?token=${token}`;
  const deepLink = `orvian://bind?token=${token}&host=${encodeURIComponent(host)}`;

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Install Orvian Agent</title>
<style>
  :root{--bg:#0b0f17;--fg:#e8eefc;--accent:#3b82f6;--done:#22c55e}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;
       background:var(--bg);color:var(--fg);display:flex;min-height:100vh;
       align-items:center;justify-content:center;padding:24px}
  .card{max-width:440px;width:100%;background:#131a26;border:1px solid #1e293b;
        border-radius:16px;padding:28px}
  h1{font-size:22px;margin:0 0 8px}
  p.sub{color:#94a3b8;font-size:14px;line-height:1.5;margin:0 0 20px}
  .step{display:flex;gap:12px;align-items:flex-start;margin-bottom:14px}
  .num{flex:none;width:26px;height:26px;border-radius:50%;background:#1e293b;
       display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700}
  .num.active{background:var(--accent);color:#fff}
  .num.done{background:var(--done);color:#fff}
  .step-body{flex:1}
  .step-title{font-size:14px;font-weight:600;margin-bottom:6px}
  a.btn{display:block;text-align:center;background:var(--accent);color:#fff;
        text-decoration:none;padding:13px;border-radius:10px;font-weight:600}
  a.btn.ghost{background:#1e293b}
  a.btn.disabled{opacity:.45;pointer-events:none}
  .meta{margin-top:22px;font-size:11px;color:#64748b;text-transform:uppercase;
        letter-spacing:.06em}
  .code{background:#0b0f17;border:1px solid #1e293b;border-radius:8px;padding:10px;
        margin-top:6px;font-family:monospace;font-size:12px;word-break:break-all}
</style>
</head>
<body>
  <div class="card">
    <h1>Orvian Agent</h1>
    <p class="sub">Two steps to enable live tracking, screen streaming and remote control.</p>

    <div class="step">
      <div class="num active" id="n1">1</div>
      <div class="step-body">
        <div class="step-title">Download &amp; install the app</div>
        <a class="btn" id="dl" href="${apkUrl}">Download Orvian for Android</a>
        <div style="font-size:12px;color:#64748b;margin-top:6px">
          After downloading, tap the file to install. Allow "unknown sources" if asked.
        </div>
      </div>
    </div>

    <div class="step">
      <div class="num" id="n2">2</div>
      <div class="step-body">
        <div class="step-title">Activate this device</div>
        <a class="btn ghost" id="act" href="${deepLink}">Tap to activate</a>
        <div style="font-size:12px;color:#64748b;margin-top:6px">
          Opens the app and links it to this invite.
        </div>
      </div>
    </div>

    <div class="meta">Invite token</div>
    <div class="code">${token}</div>
  </div>

<script>
  var dl = document.getElementById('dl');
  dl.addEventListener('click', function () {
    document.getElementById('n1').className = 'num done';
    document.getElementById('n2').className = 'num active';
    document.getElementById('act').className = 'btn';
  });
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html;charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}