// Worker du site : sert les pages statiques et porte les comptes clients des simulateurs.
//
// Routes :
//   /api/lead                  suivi d'utilisation vers la Google Sheet
//   /api/auth/start, /verify   connexion par code à 6 chiffres envoyé par e-mail ; /logout
//   /api/me                    compte, crédits, formule et simulations
//   /api/sim/open, /save, /dossier   droits d'accès : simulation offerte, crédits, Pass Pro
//   /api/checkout, /checkout/confirm, /stripe/webhook   paiements Stripe
//   /api/dossier               contexte d'un dossier de décision appartenant au compte
//   /api/account/brand         nom et logo du cabinet (Pass Pro)
//
// Base de données : D1, liée sous le nom DB (créée automatiquement au premier déploiement).
// Secrets (Cloudflare, Worker malaheim, Settings, Variables and Secrets) :
//   LEADS_URL, LEADS_TOKEN    script Google (Sheet des contacts, envoi des codes et des e-mails)
//   STRIPE_SECRET_KEY         clé secrète Stripe
//   STRIPE_WEBHOOK_SECRET     facultatif, secret de signature du webhook Stripe
// Variables facultatives, montants encaissés en centimes TTC :
//   PRICE_CREDIT_CENTS (2280), PRICE_PACK_CENTS (8280), PRICE_PRO_CENTS (46800)

const DAY = 86400000;
const WINDOW = 7 * DAY; // durée pendant laquelle une simulation reste réglable librement
const FREE = ['gmail.com', 'googlemail.com', 'hotmail.com', 'hotmail.fr', 'outlook.com', 'outlook.fr', 'live.com', 'live.fr', 'yahoo.com', 'yahoo.fr', 'icloud.com', 'me.com', 'orange.fr', 'wanadoo.fr', 'free.fr', 'sfr.fr', 'laposte.net', 'gmx.fr', 'gmx.com', 'aol.com', 'protonmail.com', 'proton.me', 'bbox.fr', 'neuf.fr'];
const SIMS = { wms: 'WMS', tms: 'TMS', erp: 'ERP', automatisation: 'automatisation', oms: 'OMS', planification: 'S&OP', donnees: 'données' };
const PRODUCTS = {
  credit: { env: 'PRICE_CREDIT_CENTS', def: 2280, name: 'Simulation complète avec dossier de décision', desc: 'Une simulation complète, réglable pendant 7 jours, avec son dossier de décision (PDF et modèle Excel).' },
  pack: { env: 'PRICE_PACK_CENTS', def: 8280, name: 'Pack de 5 simulations avec dossiers', desc: 'Cinq simulations complètes avec leurs dossiers de décision, valables 12 mois.' },
  pro: { env: 'PRICE_PRO_CENTS', def: 46800, name: 'Pass Pro, 12 mois', desc: 'Simulations et dossiers illimités pendant 12 mois, dossiers à votre nom et à votre logo.' },
};
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const frDate = (t) => { const d = new Date(t); return `${d.getUTCDate()} ${MOIS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

// ---------------------------------------------------------------- Outils
const json = (body, status = 200, headers = {}) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers } });
const clean = (v, n) => String(v ?? '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim().slice(0, n);
const cleanText = (v, n) => String(v ?? '').replace(/[\u0000-\u0008\u000b-\u001f\u007f]/g, ' ').trim().slice(0, n);
const isEmail = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(e);
const cleanQ = (q) => { const s = clean(q, 900); return /^[A-Za-z0-9_=&.%-]*$/.test(s) ? s : ''; };
const b64url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const rand = (n = 24) => b64url(crypto.getRandomValues(new Uint8Array(n)));
const sha = async (s) => b64url(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)));
const sameOrigin = (req) => { const o = req.headers.get('origin'); return !o || new URL(o).host === new URL(req.url).host; };
const body = async (req) => { const t = await req.text(); if (t.length > 300000) throw new Error('trop grand'); return t ? JSON.parse(t) : {}; };
const cookie = (req, name) => { const m = (req.headers.get('cookie') || '').match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`)); return m ? m[1] : null; };
const SESSION = 'mlh_s';
const setSession = (token, maxAge) => `${SESSION}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

let ready = false;
async function db(env) {
  if (!env.DB) throw new Error('Base de données absente');
  if (!ready) {
    await env.DB.batch([
      env.DB.prepare('CREATE TABLE IF NOT EXISTS accounts (email TEXT PRIMARY KEY, name TEXT, company TEXT, role TEXT, phone TEXT, optin INTEGER DEFAULT 0, created INTEGER, verified INTEGER, credits INTEGER DEFAULT 0, credits_until INTEGER DEFAULT 0, pro_until INTEGER DEFAULT 0, free_used INTEGER DEFAULT 0, cabinet TEXT, logo TEXT)'),
      env.DB.prepare('CREATE TABLE IF NOT EXISTS codes (email TEXT PRIMARY KEY, hash TEXT, expires INTEGER, tries INTEGER DEFAULT 0, sent INTEGER)'),
      env.DB.prepare('CREATE TABLE IF NOT EXISTS sessions (token TEXT PRIMARY KEY, email TEXT, expires INTEGER)'),
      env.DB.prepare('CREATE TABLE IF NOT EXISTS sims (id TEXT PRIMARY KEY, email TEXT, sim TEXT, q TEXT, kind TEXT, dossier INTEGER DEFAULT 0, created INTEGER, until INTEGER, updated INTEGER)'),
      env.DB.prepare('CREATE INDEX IF NOT EXISTS sims_email ON sims(email, created)'),
      env.DB.prepare('CREATE TABLE IF NOT EXISTS purchases (session TEXT PRIMARY KEY, email TEXT, product TEXT, amount INTEGER, created INTEGER, sim TEXT)'),
    ]);
    ready = true;
  }
  return env.DB;
}

// Envoi vers le script Google : Sheet des contacts, codes de connexion, e-mails de vente
const google = (env, payload) => (env.LEADS_URL && env.LEADS_TOKEN
  ? fetch(env.LEADS_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, redirect: 'follow', body: JSON.stringify({ token: env.LEADS_TOKEN, date: new Date().toISOString(), ...payload }) })
    .then((r) => r.json().catch(() => ({}))).catch((e) => { console.log('Script Google injoignable', String(e)); return {}; })
  : Promise.resolve({ skipped: true }));

async function account(req, env) {
  const t = cookie(req, SESSION); if (!t) return null;
  const D = await db(env);
  const s = await D.prepare('SELECT email, expires FROM sessions WHERE token = ?').bind(await sha(t)).first();
  if (!s || s.expires < Date.now()) return null;
  return D.prepare('SELECT * FROM accounts WHERE email = ?').bind(s.email).first();
}
const credits = (a, now = Date.now()) => (a.credits > 0 && (!a.credits_until || a.credits_until > now) ? a.credits : 0);
const view = (a) => {
  const now = Date.now();
  return { email: a.email, name: a.name, company: a.company, role: a.role, credits: credits(a, now), creditsUntil: a.credits_until || 0, pro: a.pro_until > now, proUntil: a.pro_until || 0, freeUsed: !!a.free_used, cabinet: a.cabinet || '', hasLogo: !!a.logo };
};
const simView = (s, now = Date.now()) => ({ id: s.id, sim: s.sim, code: SIMS[s.sim] || s.sim, q: s.q || '', kind: s.kind, dossier: !!s.dossier, created: s.created, until: s.until, active: s.until > now, ref: s.id.slice(-8).toUpperCase() });

// ---------------------------------------------------------------- Suivi d'utilisation
async function lead(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  let d; try { d = await body(req); } catch { return json({ ok: false }, 400); }
  const a = await account(req, env).catch(() => null);
  if (!a) return json({ ok: true, stored: false });
  await google(env, {
    type: 'usage', email: a.email, name: a.name, company: a.company, event: clean(d.event, 30), sim: clean(d.sim, 30), code: clean(d.code, 20),
    verdict: clean(d.verdict, 120), budget: clean(d.budget, 60), tier: clean(d.tier, 120), link: clean(d.link, 2000),
  });
  return json({ ok: true });
}

// ---------------------------------------------------------------- Connexion par code
async function authStart(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  let d; try { d = await body(req); } catch { return json({ ok: false, error: 'Requête illisible.' }, 400); }
  if (clean(d.website, 200)) return json({ ok: true });
  const email = clean(d.email, 120).toLowerCase();
  if (!isEmail(email)) return json({ ok: false, error: 'Saisissez une adresse e-mail valide.' }, 400);
  const D = await db(env); const now = Date.now();
  let a = await D.prepare('SELECT * FROM accounts WHERE email = ?').bind(email).first();
  // L'e-mail suffit : le compte est créé s'il n'existe pas, sinon c'est une connexion
  if (!a) {
    await D.prepare('INSERT INTO accounts (email, name, company, role, phone, optin, created) VALUES (?, \'\', \'\', \'\', \'\', ?, ?)').bind(email, d.optin ? 1 : 0, now).run();
    a = await D.prepare('SELECT * FROM accounts WHERE email = ?').bind(email).first();
  } else if (d.optin) await D.prepare('UPDATE accounts SET optin = 1 WHERE email = ?').bind(email).run();
  const prev = await D.prepare('SELECT sent FROM codes WHERE email = ?').bind(email).first();
  if (prev && now - prev.sent < 40000) return json({ ok: false, error: 'Un code vient d’être envoyé. Patientez quelques secondes avant d’en demander un autre.' }, 429);
  const code = String(100000 + (crypto.getRandomValues(new Uint32Array(1))[0] % 900000));
  await D.prepare('INSERT OR REPLACE INTO codes (email, hash, expires, tries, sent) VALUES (?, ?, ?, 0, ?)').bind(email, await sha(`${email}:${code}`), now + 15 * 60000, now).run();
  const r = await google(env, { type: 'code', email, name: a.name, code });
  // Tant que le script Google n'est pas branché, le code s'affiche à l'écran (mode test, site non public)
  return json({ ok: true, ...(r.skipped ? { devCode: code } : {}) });
}

async function authVerify(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  let d; try { d = await body(req); } catch { return json({ ok: false }, 400); }
  const email = clean(d.email, 120).toLowerCase(); const code = clean(d.code, 10).replace(/\D/g, '');
  const D = await db(env); const now = Date.now();
  const c = await D.prepare('SELECT * FROM codes WHERE email = ?').bind(email).first();
  if (!c || c.expires < now) return json({ ok: false, error: 'Code expiré. Demandez-en un nouveau.' }, 400);
  if (c.tries >= 5) return json({ ok: false, error: 'Trop d’essais. Demandez un nouveau code.' }, 400);
  if (c.hash !== await sha(`${email}:${code}`)) {
    await D.prepare('UPDATE codes SET tries = tries + 1 WHERE email = ?').bind(email).run();
    return json({ ok: false, error: 'Code incorrect.' }, 400);
  }
  await D.prepare('DELETE FROM codes WHERE email = ?').bind(email).run();
  const a = await D.prepare('SELECT * FROM accounts WHERE email = ?').bind(email).first();
  const first = !a.verified;
  if (first) await D.prepare('UPDATE accounts SET verified = ? WHERE email = ?').bind(now, email).run();
  const token = rand(32);
  await D.prepare('INSERT INTO sessions (token, email, expires) VALUES (?, ?, ?)').bind(await sha(token), email, now + 180 * DAY).run();
  if (first) {
    await google(env, {
      type: 'unlock', email, name: a.name, company: a.company, role: a.role, phone: a.phone, optin: !!a.optin, freeEmail: FREE.includes(email.split('@')[1]),
      sim: clean(d.sim, 30), code: clean(d.simCode, 20), verdict: clean(d.verdict, 120), budget: clean(d.budget, 60), tier: clean(d.tier, 120),
      summary: cleanText(d.summary, 6000), link: clean(d.link, 2000), country: (req.cf && req.cf.country) || '',
    });
  }
  return json({ ok: true, account: view(a) }, 200, { 'set-cookie': setSession(token, 180 * 86400) });
}

// Nom et entreprise facultatifs, demandés au moment où ils servent (couverture du dossier)
async function profile(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  const a = await account(req, env); if (!a) return json({ ok: false, error: 'Connectez-vous.' }, 401);
  let d; try { d = await body(req); } catch { return json({ ok: false }, 400); }
  const company = clean(d.company, 100), name = clean(d.name, 80);
  await (await db(env)).prepare('UPDATE accounts SET company = ?, name = COALESCE(NULLIF(?, \'\'), name) WHERE email = ?').bind(company, name, a.email).run();
  if (company && company !== a.company) await google(env, { type: 'profil', email: a.email, company, name: name || a.name });
  return json({ ok: true, company });
}

async function logout(req, env) {
  const t = cookie(req, SESSION);
  if (t) await (await db(env)).prepare('DELETE FROM sessions WHERE token = ?').bind(await sha(t)).run();
  return json({ ok: true }, 200, { 'set-cookie': setSession('', 0) });
}

async function me(req, env) {
  const a = await account(req, env);
  if (!a) return json({ ok: true, account: null });
  const rows = await (await db(env)).prepare('SELECT * FROM sims WHERE email = ? ORDER BY created DESC LIMIT 100').bind(a.email).all();
  return json({ ok: true, account: view(a), sims: (rows.results || []).map((s) => simView(s)), logo: a.logo || '' });
}

// ---------------------------------------------------------------- Droits d'accès aux simulations
async function newSim(D, a, sim, q, kind, dossier, until) {
  const id = `s_${rand(12).replace(/[-_]/g, "x")}`; const now = Date.now();
  await D.prepare('INSERT INTO sims (id, email, sim, q, kind, dossier, created, until, updated) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').bind(id, a.email, sim, q, kind, dossier ? 1 : 0, now, until, now).run();
  return D.prepare('SELECT * FROM sims WHERE id = ?').bind(id).first();
}
async function useCredit(D, a) {
  const r = await D.prepare('UPDATE accounts SET credits = credits - 1 WHERE email = ? AND credits > 0 AND (credits_until = 0 OR credits_until > ?)').bind(a.email, Date.now()).run();
  return r.meta && r.meta.changes > 0;
}

async function simOpen(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  const a = await account(req, env); if (!a) return json({ ok: false, need: 'auth' }, 401);
  let d; try { d = await body(req); } catch { return json({ ok: false }, 400); }
  const sim = clean(d.sim, 20); if (!SIMS[sim]) return json({ ok: false }, 400);
  const q = cleanQ(d.q); const D = await db(env); const now = Date.now(); const pro = a.pro_until > now;
  if (!d.fresh) {
    const act = await D.prepare('SELECT * FROM sims WHERE email = ? AND sim = ? AND until > ? ORDER BY created DESC LIMIT 1').bind(a.email, sim, now).first();
    if (act) { if (q) await D.prepare('UPDATE sims SET q = ?, updated = ? WHERE id = ?').bind(q, now, act.id).run(); return json({ ok: true, access: 'full', sim: simView({ ...act, q: q || act.q }), account: view(a) }); }
  }
  if (pro) { const s = await newSim(D, a, sim, q, 'pro', true, a.pro_until); return json({ ok: true, access: 'full', sim: simView(s), account: view(a) }); }
  if (!a.free_used) {
    const r = await D.prepare('UPDATE accounts SET free_used = 1 WHERE email = ? AND free_used = 0').bind(a.email).run();
    if (r.meta && r.meta.changes > 0) { const s = await newSim(D, a, sim, q, 'free', false, now + WINDOW); return json({ ok: true, access: 'full', sim: simView(s), account: view({ ...a, free_used: 1 }) }); }
  }
  const last = await D.prepare('SELECT * FROM sims WHERE email = ? ORDER BY created DESC LIMIT 1').bind(a.email).first();
  if (credits(a, now) > 0) {
    if (!d.confirm) return json({ ok: true, access: 'preview', need: 'confirm', account: view(a), last: last ? simView(last) : null });
    if (await useCredit(D, a)) { const s = await newSim(D, a, sim, q, 'paid', true, now + WINDOW); return json({ ok: true, access: 'full', sim: simView(s), account: view({ ...a, credits: a.credits - 1 }) }); }
  }
  return json({ ok: true, access: 'preview', need: 'purchase', account: view(a), last: last ? simView(last) : null });
}

async function simSave(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  const a = await account(req, env); if (!a) return json({ ok: false }, 401);
  let d; try { d = await body(req); } catch { return json({ ok: false }, 400); }
  const q = cleanQ(d.q); const now = Date.now();
  await (await db(env)).prepare('UPDATE sims SET q = ?, updated = ? WHERE id = ? AND email = ? AND until > ?').bind(q, now, clean(d.id, 40), a.email, now).run();
  return json({ ok: true });
}

async function simDossier(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  const a = await account(req, env); if (!a) return json({ ok: false, need: 'auth' }, 401);
  let d; try { d = await body(req); } catch { return json({ ok: false }, 400); }
  const D = await db(env); const s = await D.prepare('SELECT * FROM sims WHERE id = ? AND email = ?').bind(clean(d.id, 40), a.email).first();
  if (!s) return json({ ok: false, error: 'Simulation introuvable.' }, 404);
  if (s.dossier) return json({ ok: true, id: s.id });
  const now = Date.now();
  if (a.pro_until > now || (d.confirm && await useCredit(D, a))) {
    await D.prepare('UPDATE sims SET dossier = 1 WHERE id = ?').bind(s.id).run();
    return json({ ok: true, id: s.id });
  }
  return json({ ok: true, need: credits(a, now) > 0 ? 'confirm' : 'purchase', credits: credits(a, now) });
}

// ---------------------------------------------------------------- Paiements Stripe
const stripe = (env, path, form) => fetch(`https://api.stripe.com/v1/${path}`, {
  method: form ? 'POST' : 'GET',
  headers: { authorization: `Bearer ${env.STRIPE_SECRET_KEY}`, ...(form ? { 'content-type': 'application/x-www-form-urlencoded' } : {}) },
  body: form,
});
const amount = (env, p) => parseInt(env[PRODUCTS[p].env] || (p === 'credit' && env.DOSSIER_AMOUNT_CENTS) || PRODUCTS[p].def, 10);

async function checkout(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  const a = await account(req, env); if (!a) return json({ ok: false, need: 'auth' }, 401);
  let d; try { d = await body(req); } catch { return json({ ok: false }, 400); }
  const product = PRODUCTS[d.product] ? d.product : 'credit';
  // Accès immédiat demandé et renonciation au droit de rétractation, cochés avant le paiement (L221-28, 13°)
  if (d.consent !== true) return json({ ok: false, reason: 'consent', error: 'Cochez la case d’accès immédiat pour continuer.' }, 400);
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, reason: 'not_configured' });
  const host = new URL(req.url).origin;
  const back = /^\/[A-Za-z0-9/_?=&.%-]*$/.test(String(d.back || '')) ? d.back : '/compte/';
  const p = new URLSearchParams();
  p.set('mode', 'payment'); p.set('locale', 'fr'); p.set('customer_email', a.email);
  p.set('line_items[0][quantity]', '1');
  p.set('line_items[0][price_data][currency]', 'eur');
  p.set('line_items[0][price_data][unit_amount]', String(amount(env, product)));
  p.set('line_items[0][price_data][product_data][name]', PRODUCTS[product].name);
  p.set('line_items[0][price_data][product_data][description]', PRODUCTS[product].desc);
  p.set('success_url', `${host}/compte/?paiement={CHECKOUT_SESSION_ID}&retour=${encodeURIComponent(back)}`);
  p.set('cancel_url', `${host}${back}`);
  p.set('metadata[email]', a.email); p.set('metadata[product]', product); p.set('metadata[sim]', clean(d.simId, 40));
  p.set('metadata[acces_immediat]', new Date().toISOString());
  p.set('billing_address_collection', 'required');
  p.set('tax_id_collection[enabled]', 'true');
  p.set('custom_text[submit][message]', 'Accès immédiat dans votre espace client. Vous avez demandé cet accès immédiat et renoncé au droit de rétractation (article L221-28, 13° du Code de la consommation). Conditions de vente sur malaheim.com.');
  const r = await stripe(env, 'checkout/sessions', p.toString());
  const s = await r.json().catch(() => ({}));
  if (!r.ok || !s.url) { console.log('Stripe a refusé la session', r.status, JSON.stringify(s.error || {})); return json({ ok: false, reason: 'stripe' }); }
  return json({ ok: true, url: s.url });
}

// Applique un paiement une seule fois, qu'il arrive par la page de retour ou par le webhook
async function apply(env, s, origin) {
  if (s.payment_status !== 'paid') return { ok: false, error: 'Paiement non confirmé.' };
  const md = s.metadata || {}; const email = md.email; const product = PRODUCTS[md.product] ? md.product : 'credit';
  const D = await db(env); const now = Date.now();
  const ins = await D.prepare('INSERT OR IGNORE INTO purchases (session, email, product, amount, created, sim) VALUES (?, ?, ?, ?, ?, ?)').bind(s.id, email, product, s.amount_total || 0, now, md.sim || '').run();
  const fresh = ins.meta && ins.meta.changes > 0;
  if (fresh) {
    if (product === 'pro') await D.prepare('UPDATE accounts SET pro_until = MAX(pro_until, ?) + ? WHERE email = ?').bind(now, 365 * DAY, email).run();
    else {
      const n = product === 'pack' ? 5 : 1;
      await D.prepare('UPDATE accounts SET credits = (CASE WHEN credits_until > 0 AND credits_until < ? THEN 0 ELSE credits END) + ?, credits_until = MAX(credits_until, ?) WHERE email = ?').bind(now, n, now + 365 * DAY, email).run();
      // Achat déclenché depuis un dossier : le crédit débloque aussitôt ce dossier
      if (md.sim) {
        const sim = await D.prepare('SELECT * FROM sims WHERE id = ? AND email = ?').bind(md.sim, email).first();
        if (sim && !sim.dossier) { await D.prepare('UPDATE accounts SET credits = credits - 1 WHERE email = ? AND credits > 0').bind(email).run(); await D.prepare('UPDATE sims SET dossier = 1 WHERE id = ?').bind(sim.id).run(); }
      }
    }
    const a = await D.prepare('SELECT * FROM accounts WHERE email = ?').bind(email).first();
    await google(env, {
      type: 'achat', session: s.id, ref: s.id.slice(-8).toUpperCase(), email, name: a ? a.name : '', company: a ? a.company : '',
      code: PRODUCTS[product].name, amount: (s.amount_total || 0) / 100, link: `${origin}/compte/`,
    });
  }
  return { ok: true, product, fresh, sim: md.sim || '' };
}

async function confirm(req, env) {
  const id = new URL(req.url).searchParams.get('session_id') || '';
  if (!/^cs_(test|live)_[A-Za-z0-9]{10,200}$/.test(id)) return json({ ok: false, error: 'Référence invalide.' }, 400);
  if (!env.STRIPE_SECRET_KEY) return json({ ok: false, error: 'Paiement non configuré.' }, 503);
  const a = await account(req, env);
  const r = await stripe(env, `checkout/sessions/${id}`); const s = await r.json().catch(() => ({}));
  if (!r.ok) return json({ ok: false, error: 'Paiement introuvable.' }, 404);
  if (a && s.metadata && s.metadata.email !== a.email) return json({ ok: false, error: 'Ce paiement appartient à un autre compte.' }, 403);
  return json(await apply(env, s, new URL(req.url).origin));
}

async function webhook(req, env) {
  if (!env.STRIPE_WEBHOOK_SECRET) return json({ ok: false }, 404);
  const raw = await req.text(); const sig = req.headers.get('stripe-signature') || '';
  const parts = Object.fromEntries(sig.split(',').map((x) => x.split('=')));
  if (!parts.t || !parts.v1 || Math.abs(Date.now() / 1000 - Number(parts.t)) > 600) return json({ ok: false }, 400);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = [...new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${raw}`)))].map((b) => b.toString(16).padStart(2, '0')).join('');
  if (mac !== parts.v1) return json({ ok: false }, 400);
  const ev = JSON.parse(raw);
  if (ev.type === 'checkout.session.completed' || ev.type === 'checkout.session.async_payment_succeeded') await apply(env, ev.data.object, new URL(req.url).origin);
  return json({ ok: true });
}

// ---------------------------------------------------------------- Dossier et marque du cabinet
async function dossier(req, env) {
  const a = await account(req, env); if (!a) return json({ ok: false, need: 'auth', error: 'Connectez-vous pour ouvrir ce dossier.' }, 401);
  const id = clean(new URL(req.url).searchParams.get('id'), 40);
  const s = await (await db(env)).prepare('SELECT * FROM sims WHERE id = ? AND email = ?').bind(id, a.email).first();
  if (!s) return json({ ok: false, error: 'Dossier introuvable sur ce compte.' }, 404);
  if (!s.dossier) return json({ ok: false, need: 'unlock', error: 'Ce dossier n’est pas encore débloqué.' }, 402);
  const pro = a.pro_until > Date.now() && (a.cabinet || a.logo);
  return json({ ok: true, sim: s.sim, q: s.q || '', company: a.company || '', ref: s.id.slice(-8).toUpperCase(), date: frDate(s.updated || s.created), brand: pro ? { cabinet: a.cabinet || '', logo: a.logo || '' } : null });
}

async function brand(req, env) {
  if (req.method !== 'POST' || !sameOrigin(req)) return json({ ok: false }, 405);
  const a = await account(req, env); if (!a) return json({ ok: false }, 401);
  if (!(a.pro_until > Date.now())) return json({ ok: false, error: 'Réservé au Pass Pro.' }, 403);
  let d; try { d = await body(req); } catch { return json({ ok: false, error: 'Fichier trop lourd.' }, 400); }
  const logo = String(d.logo || '');
  if (logo && (!/^data:image\/(png|jpeg|svg\+xml);base64,[A-Za-z0-9+/=]+$/.test(logo) || logo.length > 270000)) return json({ ok: false, error: 'Logo au format PNG, JPEG ou SVG, 200 Ko au maximum.' }, 400);
  await (await db(env)).prepare('UPDATE accounts SET cabinet = ?, logo = ? WHERE email = ?').bind(clean(d.cabinet, 80), logo || null, a.email).run();
  return json({ ok: true });
}

// ---------------------------------------------------------------- Routage
const ROUTES = {
  '/api/lead': lead, '/api/auth/start': authStart, '/api/auth/verify': authVerify, '/api/auth/logout': logout, '/api/me': me,
  '/api/sim/open': simOpen, '/api/sim/save': simSave, '/api/sim/dossier': simDossier,
  '/api/checkout': checkout, '/api/checkout/confirm': confirm, '/api/stripe/webhook': webhook,
  '/api/dossier': dossier, '/api/account/brand': brand, '/api/account/profile': profile,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const route = ROUTES[url.pathname];
    if (route) {
      try { return await route(request, env); } catch (e) { console.log('Erreur API', url.pathname, String(e && e.stack || e)); return json({ ok: false, error: 'Service momentanément indisponible.' }, 500); }
    }
    return env.ASSETS.fetch(request);
  },
};
