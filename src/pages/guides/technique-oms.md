---
layout: ../../layouts/Guide.astro
title: "Les exigences techniques d'un OMS"
description: "Architecture événementielle, tenue des pics, calcul du stock disponible en temps réel, idempotence, paiement et PCI DSS, données clients et RGPD : ce qu'un OMS doit garantir techniquement."
slug: technique-oms
sw: oms
updated: 2026-11-22
readingTime: 6
---

Un OMS se trouve au carrefour des ventes et de la logistique. Il reçoit des commandes de partout, interroge les stocks de partout et pilote des expéditions depuis plusieurs sites. Sa faiblesse technique se voit immédiatement chez vos clients : survente, retard, double expédition. Ce guide complète [le socle technique commun](/guides/exigences-techniques-communes/).

## Architecture

- **Événementielle.** Chaque changement (commande créée, payée, préparée, expédiée, retournée) doit produire un événement diffusé aux autres systèmes, par webhooks ou par bus de messages. C'est ce qui permet le temps réel sans surcharger les interfaces.
- **Ouverte.** Les OMS modernes s'intègrent par API à une boutique en ligne indépendante (architecture dite composable ou headless). Vérifiez la qualité de la documentation et l'existence d'un bac à sable.
- **Idempotence.** Une commande reçue deux fois, à cause d'une coupure réseau, ne doit être créée qu'une fois. Exigez des clés d'idempotence sur les API de création.

## Stock disponible à la vente

- **Temps de calcul.** Le site interroge l'OMS à chaque affichage de fiche produit ou de panier. Fixez une cible : par exemple moins de 200 millisecondes pour une disponibilité, même en pointe.
- **Fraîcheur.** Délai maximum entre un mouvement de stock dans le WMS et sa prise en compte dans l'OMS : quelques secondes, pas une nuit.
- **Règles.** Stock de sécurité par canal, réservations, stock en transit, stock magasin : les règles doivent être paramétrables sans développement.

## Tenue des pics

Le Black Friday, les soldes ou une opération d'influence peuvent multiplier les commandes par dix en quelques minutes. Exigez :

- votre volume de pointe en commandes par minute, multiplié par deux, écrit dans le contrat ;
- un test de charge avant chaque grande période commerciale ;
- une montée en capacité automatique de l'infrastructure.

## Paiement

L'OMS ne doit jamais stocker de numéros de carte. Il manipule des jetons fournis par votre prestataire de paiement, ce qui sort l'essentiel du système du périmètre de la norme PCI DSS. Vérifiez la gestion des remboursements partiels, des paiements fractionnés et des avoirs, en lien avec l'ERP.

## Données clients

Noms, adresses, téléphones, historiques d'achat : l'OMS concentre des données personnelles. Exigez des durées de conservation paramétrables, l'anonymisation des commandes anciennes, la réponse aux demandes d'accès et d'effacement, et des droits qui limitent l'accès du service client au strict nécessaire.

## Intégrations

Boutique, places de marché, EDI des clients professionnels, application magasin, WMS, prestataires logistiques, transporteurs, finance. Pour chaque connecteur, demandez s'il est standard, maintenu par l'éditeur et inclus dans l'abonnement.

## Supervision

Un tableau de bord des commandes bloquées (paiement refusé, stock introuvable, interface en erreur) et des alertes automatiques. Une commande qui dort deux jours sans que personne ne le sache est un client perdu.

## Les questions à poser à l'éditeur

1. Quel temps de réponse garantissez-vous pour une disponibilité en pointe ?
2. Quel volume de commandes par minute avez-vous déjà tenu chez un client ?
3. Comment évitez-vous les doublons de commandes ?
4. Quels connecteurs sont standard et maintenus par vous ?
5. Comment purgez-vous ou anonymisez-vous les données clients ?

Voir aussi [combien coûte un OMS](/guides/prix-oms/) et [les erreurs d'un projet OMS](/guides/erreurs-projet-oms/).
