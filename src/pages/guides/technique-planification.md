---
layout: ../../layouts/Guide.astro
title: "Les exigences techniques d'un outil de planification"
description: "Volumétrie et temps de calcul, connexion à l'ERP, modèle de données, scénarios, prévisions par apprentissage automatique explicables, droits par périmètre : ce qu'un outil S&OP ou de planification doit garantir techniquement."
slug: technique-planification
sw: sop-planification
updated: 2026-11-22
readingTime: 6
---

Un outil de planification manipule de gros volumes : chaque référence, sur chaque site, sur chaque semaine de l'horizon, dans plusieurs scénarios. Ses exigences techniques portent surtout sur les données, les calculs et la confiance dans les résultats. Ce guide complète [le socle technique commun](/guides/exigences-techniques-communes/).

## Volumétrie et temps de calcul

Calculez votre volume : nombre de références actives, multiplié par le nombre de sites, par le nombre de périodes de l'horizon (par exemple 104 semaines) et par le nombre de scénarios. Donnez ce chiffre aux éditeurs et exigez :

- le temps de calcul complet de la prévision et du plan d'approvisionnement, qui doit tenir dans votre fenêtre de nuit ;
- le temps de recalcul d'un scénario pendant une réunion S&OP : quelques secondes à quelques minutes, pas une heure.

## Connexion à l'ERP

- **Données entrantes.** Historique des ventes, commandes en cours, stocks, nomenclatures, gammes, capacités, délais fournisseurs.
- **Extractions incrémentales.** Seules les données modifiées sont transmises chaque nuit, pour tenir les délais.
- **Données sortantes.** Propositions d'achat et de fabrication renvoyées vers l'ERP, avec validation préalable du planificateur.
- **Contrôles.** Un rapport de qualité à chaque chargement : références sans délai, nomenclatures incomplètes, ventes négatives.

## Modèle de données

Hiérarchies produits, clients et géographies sur plusieurs niveaux, pour planifier par famille et descendre à la référence. Vérifiez qu'une hiérarchie se modifie sans développement et que l'historique est recalculé en conséquence.

## Scénarios et versions

Créer, comparer et archiver des scénarios (hausse de la demande, perte d'un fournisseur, ligne arrêtée), garder chaque version du plan validé en réunion, et retrouver qui a modifié quoi. La traçabilité des corrections manuelles permet de mesurer si elles améliorent ou dégradent la prévision.

## Prévisions par apprentissage automatique

Beaucoup d'éditeurs mettent en avant l'intelligence artificielle. Exigez :

- un test sur vos propres données, comparé à votre méthode actuelle, sur une période que l'éditeur n'a pas vue ;
- l'explication de chaque prévision : quels facteurs (saisonnalité, promotion, prix, météo) l'ont fait varier ;
- la possibilité de corriger et de figer une prévision ;
- la liste des données externes utilisées, et où elles sont traitées.

## Tableur et outils bureautiques

Les planificateurs aiment travailler dans un tableur. Un connecteur bureautique est utile, à condition que les données restent dans l'outil, avec les mêmes droits, et ne circulent pas en pièces jointes.

## Droits par périmètre

Un planificateur ne modifie que ses familles, un commercial que sa région, la direction voit tout. Demandez si les droits se définissent par ligne de données, et pas seulement par écran.

## Intégration avec le pilotage

Les indicateurs du S&OP (fiabilité des prévisions, taux de service, couverture de stock) doivent pouvoir alimenter votre outil de tableaux de bord sans ressaisie.

## Les questions à poser à l'éditeur

1. Combien de temps dure un calcul complet sur notre volume ?
2. Combien de temps pour recalculer un scénario en réunion ?
3. Comment se connecte-t-on à notre ERP, et avec quels contrôles de qualité ?
4. Pouvez-vous tester votre prévision sur notre historique, à l'aveugle ?
5. Comment expliquez-vous une prévision issue de l'apprentissage automatique ?

Voir aussi [combien coûte un outil de planification](/guides/prix-planification/) et [mettre en place un S&OP](/guides/mettre-en-place-sop/).
