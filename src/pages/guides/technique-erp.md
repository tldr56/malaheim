---
layout: ../../layouts/Guide.astro
title: "Les exigences techniques d'un ERP"
description: "Architecture SaaS, extensions sans toucher au cœur, API et événements, facturation électronique, banque, séparation des tâches, montées de version : ce qu'un ERP doit garantir techniquement."
slug: technique-erp
sw: erp
updated: 2026-11-22
readingTime: 7
---

L'ERP est le système de référence de l'entreprise : articles, clients, fournisseurs, stocks, comptabilité. Tous les autres logiciels supply chain s'y connectent. Ses choix techniques engagent donc l'entreprise pour dix ans. Ce guide complète [le socle technique commun](/guides/exigences-techniques-communes/).

## Architecture et personnalisation

- **Garder le cœur standard.** Les ERP modernes recommandent de ne jamais modifier le code de base, mais d'ajouter des extensions, des champs et des règles par des outils prévus à cet effet. C'est la condition pour absorber les montées de version sans tout retester.
- **Outils d'extension.** Demandez ce qui se fait par paramétrage, par outils sans code ou à faible code, et ce qui exige du développement. Faites chiffrer vos trois adaptations les plus probables.
- **Multi-sociétés et multi-sites.** Si vous avez plusieurs entités, vérifiez la consolidation, les flux intersociétés et la gestion des devises.

## API et événements

- **Couverture.** Demandez la liste des objets accessibles par API en lecture et en écriture : articles, commandes, stocks, factures, écritures. Les API REST ou OData documentées sont la norme.
- **Événements.** L'ERP doit pouvoir prévenir les autres systèmes d'une création ou d'une modification (webhooks ou bus de messages), plutôt que d'être interrogé sans cesse.
- **Volumes.** Imports en masse pour les reprises et les tarifs, limites d'appels compatibles avec vos interfaces WMS, TMS et e-commerce.

## Facturation électronique

C'est l'exigence réglementaire de 2026 et 2027. Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir leurs factures électroniques par une plateforme agréée ; les grandes entreprises et les ETI doivent aussi les émettre, les PME et TPE à partir du 1er septembre 2027. Exigez :

- la connexion native de l'ERP à au moins une plateforme agréée ;
- les formats de la réforme (Factur-X, UBL, CII) en émission et en réception ;
- la transmission des données de transaction à l'administration (e-reporting) pour vos ventes aux particuliers et à l'international ;
- le suivi des statuts de chaque facture dans l'ERP.

## Banque et comptabilité

Échanges bancaires sécurisés (EBICS ou connecteurs bancaires), virements et prélèvements SEPA, rapprochement automatique, et production du fichier des écritures comptables (FEC) exigé en cas de contrôle fiscal.

## Séparation des tâches et piste d'audit

Une même personne ne doit pas pouvoir créer un fournisseur et payer ses factures. Exigez des règles de séparation des tâches, des circuits de validation paramétrables et une piste d'audit sur les données sensibles : coordonnées bancaires, prix, conditions de paiement.

## Montées de version

En SaaS, l'éditeur impose généralement deux mises à jour majeures par an. Demandez le calendrier, l'accès anticipé à un environnement de test, et prévoyez une campagne de tests de non-régression sur vos processus critiques à chaque version. Les outils de tests automatisés deviennent rentables dès quelques dizaines de scénarios.

## Environnements

Au minimum : un environnement de production, un de recette alimenté avec une copie récente des données, et un bac à sable pour les développements. Vérifiez que la copie de production vers la recette est possible sans l'éditeur et que les données personnelles peuvent y être anonymisées.

## Données personnelles

L'ERP contient des données de salariés, de clients particuliers, parfois de santé pour certains secteurs. Exigez des durées de conservation paramétrables, la purge ou l'anonymisation, et la capacité de répondre à une demande d'accès ou d'effacement.

## Performance

Les traitements lourds (calcul des besoins, clôture mensuelle, facturation de masse) doivent tenir dans vos fenêtres de temps. Demandez des mesures sur des volumes comparables aux vôtres.

## Les questions à poser à l'éditeur

1. Comment ajoute-t-on un champ ou une règle sans modifier le cœur ?
2. Quels objets sont couverts par vos API, en lecture et en écriture ?
3. Avec quelles plateformes agréées de facturation électronique êtes-vous connectés ?
4. Quelles règles de séparation des tâches sont prévues en standard ?
5. Combien de montées de version par an, avec quel préavis et quel environnement de test ?
6. Peut-on copier la production en recette en anonymisant les données ?

Voir aussi [combien coûte un ERP](/guides/prix-erp/) et [les erreurs qui font déraper un projet ERP](/guides/erreurs-projet-erp/).

Sources : [Service Public Entreprendre, calendrier de la facturation électronique](https://entreprendre.service-public.gouv.fr/actualites/A18953?lang=fr), [economie.gouv.fr, coup d'envoi de la réforme](https://www.economie.gouv.fr/node/3241932).
