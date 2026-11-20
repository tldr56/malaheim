# Malaheim

Site d'aide au choix et au budget d'un WMS, construit avec Astro.

## Modifier le contenu

- Les guides sont des fichiers texte dans `src/pages/guides/` (format Markdown).
- Les liens de paiement, de réservation et d'emailing se règlent dans `src/config.ts`.
- Les pages légales sont dans `src/pages/` (`mentions-legales.md`, `confidentialite.md`, `conditions-de-vente.md`).

## Lancer en local

```
npm install
npm run dev
```

## Mise en ligne

Cloudflare Pages, commande de build `npm run build`, dossier de sortie `dist`.
