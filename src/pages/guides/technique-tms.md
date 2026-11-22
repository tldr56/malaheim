---
layout: ../../layouts/Guide.astro
title: "Les exigences techniques d'un TMS"
description: "Connecteurs transporteurs, EDI et API de suivi, cartographie, portail transporteurs, facturation électronique, sécurité des tarifs : ce qu'un TMS doit garantir techniquement."
slug: technique-tms
sw: tms
updated: 2026-11-22
readingTime: 6
---

Un TMS vaut ce que valent ses connexions : avec l'ERP et le WMS d'un côté, avec des dizaines de transporteurs de l'autre. C'est aussi un logiciel ouvert sur l'extérieur, puisque des transporteurs et parfois des clients s'y connectent. Ce guide complète [le socle technique commun](/guides/exigences-techniques-communes/).

## Connecteurs transporteurs

- **Catalogue existant.** Demandez la liste des transporteurs déjà connectés et, pour chacun, ce qui est couvert : réservation, étiquette, suivi, preuve de livraison, facture.
- **Modes d'échange.** Les grands transporteurs proposent des API REST ; beaucoup d'autres échangent en EDI EDIFACT (IFTMIN pour l'ordre de transport, IFTSTA pour les statuts) ou en fichiers sur SFTP. Le TMS doit savoir faire les trois.
- **Nouveau connecteur.** Délai et prix d'un connecteur pour un transporteur absent du catalogue, et qui le maintient quand le transporteur change son format.
- **Étiquettes.** Chaque transporteur impose son format d'étiquette et ses codes. Le TMS doit les produire et les envoyer à vos imprimantes, ou les transmettre au WMS.

## Suivi des expéditions

Exigez une réception des statuts par webhooks ou par EDI au fil de l'eau, une normalisation des statuts (chaque transporteur a ses propres codes) et la notification automatique de vos clients. Pour le lot complet, l'intégration de la géolocalisation des camions, par les plateformes de télématique ou de visibilité, est un plus.

## Cartographie et calcul

Calcul des distances, géocodage des adresses, optimisation de tournées : vérifiez quel service cartographique est utilisé, s'il est inclus dans le prix et comment sont traitées les adresses mal géocodées.

## Portail transporteurs et utilisateurs externes

Les transporteurs se connectent pour accepter des missions, déclarer un enlèvement ou déposer une facture. Exigez des comptes nominatifs, l'authentification forte, un cloisonnement strict (un transporteur ne voit jamais les tarifs ou les envois d'un concurrent) et la désactivation simple d'un compte.

## Confidentialité des tarifs

Vos grilles tarifaires et vos résultats d'appels d'offres sont des données sensibles. Demandez qui, chez l'éditeur, peut y accéder, et si elles servent à des analyses de marché anonymisées, ce que certains contrats prévoient.

## Facturation transport et réforme de la facture électronique

Depuis septembre 2026, les factures de vos transporteurs vous arrivent progressivement sous forme électronique par les plateformes agréées. Le TMS, qui sait combien chaque envoi aurait dû coûter, doit pouvoir rapprocher ces factures automatiquement, en lien avec votre ERP ou votre plateforme de réception.

## Documents dématérialisés

Lettre de voiture électronique (e-CMR), preuves de livraison photographiées, documents douaniers : vérifiez ce que le TMS produit et archive, et pendant combien de temps.

## Interfaces avec l'ERP et le WMS

Les commandes doivent entrer avec leurs poids, volumes et adresses complètes ; les coûts de transport doivent revenir en comptabilité par commande ou par client. Exigez des échanges en temps réel pour le colis et la messagerie, où l'étiquette se produit au moment de l'emballage.

## Performance

En pointe, un TMS peut devoir coter et étiqueter plusieurs milliers de colis par heure. Demandez le temps de réponse pour une cotation et une étiquette, et un test sur vos volumes.

## Les questions à poser à l'éditeur

1. Quels transporteurs sont connectés aujourd'hui, et pour quelles fonctions ?
2. Combien coûte et combien de temps prend un nouveau connecteur ?
3. Comment cloisonnez-vous les données entre transporteurs sur le portail ?
4. Comment rapprochez-vous les factures électroniques des transporteurs ?
5. Quel temps de réponse pour une étiquette en pointe ?

Voir aussi [combien coûte un TMS](/guides/prix-tms/) et [les étapes pour choisir un TMS](/guides/choisir-tms/).
