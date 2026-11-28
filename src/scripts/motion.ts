// Animations communes : chiffres qui défilent, montants qui glissent d'une valeur à l'autre,
// halo qui suit la souris sur les cartes, ombre de l'en-tête au défilement.
// Rien ne bouge pour les visiteurs qui ont demandé à réduire les animations.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const NUM = /\d{1,3}(?:[   ]\d{3})+(?:,\d+)?|\d+(?:,\d+)?/g;

type N = { v: number; dec: number; sep: string };
const parse = (s: string): N[] => (s.match(NUM) || []).map((t) => {
  const sep = (t.match(/[   ]/) || [' '])[0];
  const [int, frac = ''] = t.replace(/[   ]/g, '').split(',');
  return { v: Number(`${int}.${frac || 0}`), dec: frac.length, sep };
});
const fmt = (v: number, dec: number, sep: string) => {
  const [i, f] = Math.abs(v).toFixed(dec).split('.');
  return i.replace(/\B(?=(\d{3})+(?!\d))/g, sep) + (f ? `,${f}` : '');
};
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const running = new WeakMap<Element, number>();

function animate(el: Element, from: number[], to: N[], next: string, dur: number) {
  const prev = running.get(el); if (prev) cancelAnimationFrame(prev);
  const t0 = performance.now();
  const frame = (now: number) => {
    const p = Math.min(1, (now - t0) / dur); const e = ease(p);
    let k = 0;
    el.textContent = p >= 1 ? next : next.replace(NUM, () => { const n = to[k]; const v = from[k] + (n.v - from[k]) * e; k++; return fmt(v, n.dec, n.sep); });
    if (p < 1) running.set(el, requestAnimationFrame(frame)); else running.delete(el);
  };
  running.set(el, requestAnimationFrame(frame));
}

// Fait glisser les nombres d'un texte vers ceux du nouveau texte, si la phrase garde la même forme
export function tween(el: Element | null, next: string, dur = 520) {
  if (!el) return;
  const old = el.textContent || '';
  if (old === next) return;
  const to = parse(next);
  if (reduce || !to.length) { el.textContent = next; return; }
  const from = parse(old);
  const same = from.length === to.length && old.replace(NUM, '#') === next.replace(NUM, '#');
  if (same) animate(el, from.map((x) => x.v), to, next, dur);
  else if (!from.length) animate(el, to.map(() => 0), to, next, dur + 200);
  else el.textContent = next;
}
(window as any).mlhTween = tween;

// Chiffres clés qui défilent jusqu'à leur valeur à leur entrée à l'écran
const COUNT = '.tr-p b, .hero-prices li b, .fact-n, .fig-n, .tf-p, .sx-tv:not(.sm), .kt-buy b, [data-count]';
function counters() {
  if (reduce || !('IntersectionObserver' in window)) return;
  const els = [...document.querySelectorAll<HTMLElement>(COUNT)].filter((el) => /\d/.test(el.textContent || '') && !el.children.length);
  const io = new IntersectionObserver((en) => {
    en.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement; io.unobserve(el);
      const next = el.dataset.final || el.textContent || ''; const to = parse(next);
      animate(el, to.map(() => 0), to, next, 1300);
    });
  }, { threshold: 0.35 });
  els.forEach((el) => {
    const text = el.textContent || '';
    el.dataset.final = text;
    const to = parse(text);
    let k = 0; el.textContent = text.replace(NUM, () => fmt(0, to[k++].dec, to[0].sep));
    io.observe(el);
  });
}

// Halo lumineux qui suit la souris sur les cartes
const GLOW = '.sx-tile, .tr-q, .tf-c, .hero-prices li, .kitband, .decide, .step, .kt-step, .kt-forget, .done-c, .card-lift, .kt-buy';
function glow() {
  if (reduce || !matchMedia('(hover: hover)').matches) return;
  document.querySelectorAll<HTMLElement>(GLOW).forEach((el) => el.classList.add('glow'));
  document.addEventListener('pointermove', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('.glow'); if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`); el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, { passive: true });
}

// En-tête : ombre légère dès qu'on a défilé
function header() {
  const bar = document.querySelector('.topbar'); if (!bar) return;
  const upd = () => bar.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', upd, { passive: true }); upd();
}

counters(); glow(); header();
