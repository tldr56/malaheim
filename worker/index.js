// Worker du site : sert les pages statiques, reçoit les inscriptions des simulateurs sur /api/lead
// et vend le dossier de décision sur /api/checkout et /api/dossier.
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

// ---------------------------------------------------------------- Dossier de décision payant (Stripe Checkout)
// Secrets : STRIPE_SECRET_KEY (clé secrète Stripe, sk_test_ puis sk_live_). Variable facultative : DOSSIER_AMOUNT_CENTS
// (montant encaissé en centimes, 2280 par défaut, soit 19 € HT plus 20 % de TVA ; 1900 si la société est en franchise de TVA).
const CODES = { wms: 'WMS', tms: 'TMS', erp: 'ERP', automatisation: 'automatisation', oms: 'OMS', planification: 'S&OP', donnees: 'données' };
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const frDate = (d) => `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
const stripe = (env, path, body) => fetch(`https://api.stripe.com/v1/${path}`, {
  method: body ? 'POST' : 'GET',
  headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, ...(body ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
  body,
});

async function checkout(request, env) {
  if (request.method !== 'POST') return json({ ok: false }, 405);
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false }, 403);
  let d; try { d = JSON.parse(await request.text()); } catch { return json({ ok: false }, 400); }
  const sim = clean(d.sim, 20);
  if (!CODES[sim]) return json({ ok: false, error: 'Simulateur inconnu.' }, 400);
  const q = clean(d.q, 480);
  if (!/^[A-Za-z0-9_=&.%-]*$/.test(q)) return json({ ok: false, error: 'Paramètres illisibles.' }, 400);
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, reason: 'not_configured' });
  const host = new URL(request.url).origin;
  const p = new URLSearchParams();
  p.set('mode', 'payment'); p.set('locale', 'fr');
  p.set('line_items[0][quantity]', '1');
  p.set('line_items[0][price_data][currency]', 'eur');
  p.set('line_items[0][price_data][unit_amount]', String(parseInt(env.DOSSIER_AMOUNT_CENTS || '2280', 10)));
  p.set('line_items[0][price_data][product_data][name]', `Dossier de décision ${CODES[sim]}`);
  p.set('line_items[0][price_data][product_data][description]', 'Synthèse pour la direction, budget, risque, marché, scénarios, planning, questions aux éditeurs et modèle de calcul Excel.');
  const email = clean(d.email, 120);
  if (/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(email)) p.set('customer_email', email);
  p.set('success_url', `${host}/dossier/?session_id={CHECKOUT_SESSION_ID}`);
  p.set('cancel_url', `${host}/simulateurs/${sim}/${q ? `?${q}` : ''}#dossier`);
  p.set('metadata[sim]', sim); p.set('metadata[q]', q);
  p.set('metadata[company]', clean(d.company, 100)); p.set('metadata[name]', clean(d.name, 80));
  p.set('billing_address_collection', 'required');
  p.set('tax_id_collection[enabled]', 'true');
  p.set('custom_text[submit][message]', 'Accès immédiat au dossier après le paiement. Offre réservée aux professionnels, conditions de vente sur malaheim.com.');
  const r = await stripe(env, 'checkout/sessions', p.toString());
  const s = await r.json().catch(() => ({}));
  if (!r.ok || !s.url) { console.log('Stripe a refusé la session', r.status, JSON.stringify(s.error || {})); return json({ ok: false, reason: 'stripe' }); }
  return json({ ok: true, url: s.url });
}

async function dossier(request, env, ctx) {
  const id = new URL(request.url).searchParams.get('session_id') || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) return json({ ok: false, error: 'Référence invalide.' }, 400);
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: 'Paiement non configuré.' }, 503);
  const r = await stripe(env, `checkout/sessions/${id}`);
  const s = await r.json().catch(() => ({}));
  if (!r.ok) return json({ ok: false, error: 'Dossier introuvable.' }, 404);
  if (s.payment_status !== 'paid') return json({ ok: false, error: 'Paiement non confirmé.' }, 402);
  const md = s.metadata || {}; const cd = s.customer_details || {};
  const out = {
    ok: true, sim: md.sim, q: md.q || '', company: md.company || cd.name || '',
    ref: id.slice(-8).toUpperCase(), date: frDate(new Date((s.created || Date.now() / 1000) * 1000)),
  };
  // Enregistrement de la vente dans la Google Sheet (le script ignore les doublons)
  if (env.LEADS_URL && env.LEADS_TOKEN) {
    ctx.waitUntil(fetch(env.LEADS_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow', body: JSON.stringify({
      token: env.LEADS_TOKEN, type: 'achat', session: id, ref: out.ref, email: cd.email || '', name: md.name || cd.name || '', company: out.company,
      code: CODES[md.sim] || md.sim, amount: (s.amount_total || 0) / 100, link: `${new URL(request.url).origin}/dossier/?session_id=${id}`, date: new Date().toISOString(),
    }) }).catch(() => {}));
  }
  return json(out);
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api/lead') return lead(request, env);
    if (url.pathname === '/api/checkout') return checkout(request, env);
    if (url.pathname === '/api/dossier') return dossier(request, env, ctx);
    return env.ASSETS.fetch(request);
  },
};
