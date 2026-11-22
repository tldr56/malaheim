---
layout: ../../layouts/Guide.astro
title: "Les exigences techniques d'un projet de données"
description: "Styles d'architecture MDM, règles de rapprochement, GS1 et GDSN, chaîne de données vers l'entrepôt de données, catalogue et lignage, sécurité par ligne, données et IA : ce qu'un projet de données doit garantir techniquement."
slug: technique-donnees
sw: donnees-pilotage
updated: 2026-11-22
readingTime: 7
---

Les données de référence et les indicateurs alimentent tous les autres logiciels. Un projet de données mal conçu techniquement crée un système de plus, avec des chiffres de plus, au lieu de les réconcilier. Ce guide complète [le socle technique commun](/guides/exigences-techniques-communes/).

## Choisir le style d'architecture des données de référence

| Style | Principe | Pour qui |
|---|---|---|
| Registre | Un index relie les fiches des différents systèmes, sans les modifier | Premier pas, vision consolidée |
| Consolidation | Les données sont rassemblées et nettoyées dans un référentiel, pour l'analyse | Tableaux de bord fiables |
| Coexistence | Le référentiel et les systèmes sources se synchronisent dans les deux sens | Transition progressive |
| Centralisé | Les fiches naissent dans le référentiel et sont diffusées aux autres systèmes | Cible la plus robuste |

Le choix conditionne le logiciel, les interfaces et l'organisation. Décidez-le avant de consulter.

## Fonctions du référentiel

- **Modèle de données** extensible sans développement : attributs, hiérarchies, relations.
- **Rapprochement et dédoublonnage** : règles de correspondance paramétrables, et règles de survie qui décident quelle valeur garder quand deux sources se contredisent.
- **Circuits de validation** : création, enrichissement par chaque service, approbation, diffusion.
- **Règles de qualité** : champs obligatoires, formats, cohérences (un carton ne pèse pas plus que la palette qui le contient).
- **Diffusion** vers l'ERP, le WMS, le TMS et l'e-commerce, par API ou par événements.

## Standards produits

Pour les données articles, les standards GS1 sont la référence : codes GTIN, conditionnements, et le réseau GDSN pour échanger les fiches avec les distributeurs. Vérifiez que l'outil les gère nativement si vous vendez à la grande distribution.

## La chaîne de données des tableaux de bord

- **Extraction et chargement.** Des connecteurs vers chaque source, avec des chargements incrémentaux et une reprise en cas d'échec.
- **Entrepôt de données.** Les données sont rassemblées dans un entrepôt ou une plateforme de données dans le cloud, puis transformées par des règles versionnées.
- **Couche sémantique.** Une définition unique de chaque indicateur (taux de service, couverture, productivité), partagée par tous les tableaux de bord.
- **Fraîcheur.** Pour chaque indicateur, le délai de mise à jour attendu : temps réel pour une tour de contrôle, quotidien pour un tableau de bord de direction.

## Catalogue et lignage

Un catalogue décrit chaque donnée : définition, propriétaire, source, qualité. Le lignage montre d'où vient un chiffre et par quelles transformations il est passé. Indispensables dès que plusieurs équipes utilisent les mêmes données.

## Sécurité

- **Sécurité par ligne** : un responsable de site ne voit que son site, un commercial que ses clients.
- **Données personnelles** : minimisation, pseudonymisation dans les environnements d'analyse, durées de conservation.
- **Journalisation des accès** aux données sensibles : marges, prix d'achat, salaires.

## Données et intelligence artificielle

Les assistants qui interrogent les données en langage naturel se multiplient. Ils héritent des défauts des données et des droits mal définis. Exigez qu'ils respectent la sécurité par ligne, citent leurs sources, et que vos données ne servent pas à entraîner des modèles tiers sans votre accord.

## Les questions à poser à l'éditeur

1. Quels styles d'architecture votre outil permet-il ?
2. Comment paramètre-t-on les règles de rapprochement et de survie ?
3. Gérez-vous GS1 et le réseau GDSN ?
4. Comment est assurée la sécurité par ligne dans les tableaux de bord ?
5. Vos fonctions d'IA respectent-elles nos droits d'accès, et nos données servent-elles à entraîner vos modèles ?

Voir aussi [combien coûte un projet de données](/guides/prix-projet-donnees/) et [fiabiliser ses données articles](/guides/fiabiliser-donnees-articles/).
