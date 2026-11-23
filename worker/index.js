// Worker du site : sert les pages statiques et reçoit les inscriptions des simulateurs sur /api/lead.
// Les contacts partent vers une Google Sheet par un script Google (Apps Script) dont l'adresse et le jeton
// sont des secrets du Worker : LEADS_URL et LEADS_TOKEN (Cloudflare, Worker malaheim, Settings, Variables and Secrets).

const FREE = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'yahoo.com', 'yahoo.fr', 'icloud.com', 'me.com', 'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net', 'gmx.fr', 'gmx.com', 'aol.com', 'protonmail.com', 'proton.me', 'bbox.fr', 'neuf.fr'];
const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const cleanText = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').trim().slice(0, n);

async function lead(request, env) {
  if (request.method !== 'POST') return json({ ok: false }, 405);
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false }, 403);
  const raw = await request.text();
  if (raw.length > 20000) return json({ ok: false }, 413);
  let d;
  try { d = JSON.parse(raw); } catch { return json({ ok: false, error: 'Requête illisible.' }, 400); }
  const type = d.type === 'usage' ? 'usage' : 'unlock';
  // Piège à robots : un champ invisible rempli, ou un envoi en moins de 2 secondes, est ignoré sans le dire
  if (clean(d.website, 200) || (type === 'unlock' && Number(d.elapsed) > 0 && Number(d.elapsed) < 2000)) return json({ ok: true, stored: false });
  const email = clean(d.email, 120).toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) return json({ ok: false, error: 'Saisissez une adresse e-mail valide.' }, 400);
  const row = {
    type, email,
    name: clean(d.name, 80), company: clean(d.company, 100), role: clean(d.role, 60), phone: clean(d.phone, 30),
    optin: !!d.optin, event: clean(d.event, 30),
    freeEmail: FREE.includes(email.split('@')[1]),
    sim: clean(d.sim, 30), code: clean(d.code, 10), verdict: clean(d.verdict, 120), budget: clean(d.budget, 60), tier: clean(d.tier, 120),
    summary: cleanText(d.summary, 6000), link: clean(d.link, 2000),
    country: (request.cf && request.cf.country) || '', date: new Date().toISOString(),
  };
  if (type === 'unlock' && (row.name.length < 2 || row.company.length < 2 || !row.role)) return json({ ok: false, error: 'Complétez les champs obligatoires.' }, 400);
  if (!env.LEADS_URL || !env.LEADS_TOKEN) { console.log('Contact non stocké : LEADS_URL ou LEADS_TOKEN manquant', row.type, row.email); return json({ ok: true, stored: false }); }
  try {
    const r = await fetch(env.LEADS_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ token: env.LEADS_TOKEN, ...row }), redirect: 'follow' });
    const out = await r.json().catch(() => ({}));
    return json({ ok: true, stored: !!out.ok, mailed: !!out.mailed });
  } catch (e) {
    console.log('Envoi vers la Google Sheet impossible', String(e));
    return json({ ok: true, stored: false });
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lead') return lead(request, env);
    return env.ASSETS.fetch(request);
  },
};
