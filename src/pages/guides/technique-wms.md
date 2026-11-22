---
layout: ../../layouts/Guide.astro
title: "Les exigences techniques d'un WMS"
description: "Terminaux, temps de réponse, impression, interfaces ERP et automatismes, haute disponibilité, sécurité : ce qu'un WMS doit garantir techniquement, et les questions à poser à l'éditeur."
slug: technique-wms
sw: wms
updated: 2026-11-22
readingTime: 7
---

Un WMS est un logiciel temps réel : chaque scan d'un préparateur attend une réponse. Quand il ralentit ou s'arrête, l'entrepôt s'arrête. Ses exigences techniques sont donc plus strictes que celles d'un logiciel de gestion classique. Ce guide complète [le socle technique commun](/guides/exigences-techniques-communes/).

## Terminaux et mobilité

- **Système des terminaux.** La plupart des terminaux durcis tournent sous Android. Vérifiez que l'application WMS est compatible avec Android Enterprise et avec votre outil de gestion de flotte (MDM), qui déploie les mises à jour et bloque un terminal perdu.
- **Application ou navigateur.** Une application native gère mieux le scanner, le mode déconnecté et l'économie de batterie ; une interface web est plus simple à déployer. Demandez ce que l'éditeur recommande pour vos volumes.
- **Mode déconnecté.** Que se passe-t-il quand le wifi coupe dans une allée ? Le terminal doit conserver la saisie et la renvoyer, sans doublon.
- **Autres modes de saisie.** Commande vocale, port d'un scanner bague, lecture RFID : vérifiez qu'ils sont natifs et pas seulement « possibles ».

## Temps de réponse

C'est l'exigence la plus importante et la moins souvent écrite. Fixez une cible mesurable : par exemple **moins de 500 millisecondes pour 95 % des validations de scan**, mesurées en pointe, depuis vos terminaux. Un WMS en SaaS hébergé loin de l'entrepôt ajoute de la latence : demandez la région d'hébergement et un test depuis votre site.

## Réseau

Le wifi est la colonne vertébrale du WMS. Prévoyez un audit de couverture, y compris en hauteur et dans les zones froides, et une bascule sans coupure d'une borne à l'autre. En SaaS, la liaison internet devient critique : un second accès de secours chez un autre opérateur est indispensable.

## Impression

- **Étiquettes.** Le WMS doit piloter les imprimantes thermiques dans leur langage natif (ZPL pour la plupart) et produire des étiquettes logistiques GS1-128 avec SSCC.
- **Impression locale depuis le cloud.** En SaaS, un petit serveur ou un agent d'impression sur site relaie les travaux vers les imprimantes. Demandez comment il est sécurisé et ce qui se passe s'il tombe.
- **Documents.** Bons de livraison, listes de colisage, documents transport : vérifiez les modèles fournis et le coût de leur personnalisation.

## Interfaces avec l'ERP

Listez les flux, leur sens et leur fréquence :

| Flux | Sens | Mode habituel |
|---|---|---|
| Articles, conditionnements, codes-barres | ERP vers WMS | Au fil de l'eau |
| Commandes fournisseurs attendues | ERP vers WMS | Au fil de l'eau |
| Réceptions confirmées | WMS vers ERP | Temps réel |
| Commandes clients à préparer | ERP vers WMS | Temps réel ou par vagues |
| Confirmations d'expédition | WMS vers ERP | Temps réel |
| Ajustements et inventaires | WMS vers ERP | Temps réel ou quotidien |

Exigez des échanges asynchrones par file de messages ou par API avec reprise automatique : si l'ERP est indisponible, le WMS doit continuer à préparer et rejouer les messages ensuite. Demandez un tableau de bord des messages en erreur, consultable par vos équipes.

## Échanges avec les clients et les transporteurs

Avis d'expédition (DESADV en EDI ou équivalent par API), étiquettes transporteurs, données de suivi : vérifiez les connecteurs existants avec vos transporteurs et vos grands clients.

## Interfaces avec les automatismes

Si l'entrepôt est ou sera mécanisé, le WMS dialogue avec le WCS ou directement avec les machines : missions envoyées, comptes rendus reçus, en messages TCP/IP, en REST ou en OPC UA. Exigez la liste des intégrateurs déjà interfacés et un environnement d'émulation pour tester sans les machines. Voir [le guide technique de l'automatisation](/guides/technique-automatisation/).

## Volumétrie et performance

Donnez vos chiffres de pointe : lignes par heure, utilisateurs simultanés, nombre d'emplacements, de références et de mouvements par jour. Exigez un test de charge à 150 % de cette pointe avant le démarrage, avec ses résultats.

## Disponibilité

Un WMS mérite les engagements les plus élevés du système d'information : 99,9 % sur les heures d'activité, des interventions de maintenance hors de vos créneaux d'expédition, et un mode dégradé documenté (préparation sur listes imprimées, rattrapage des saisies). Si vous travaillez la nuit ou le week-end, le support doit aussi être joignable à ces heures.

## Sécurité propre au WMS

- Droits fins : qui peut ajuster un stock, débloquer un lot, forcer une expédition.
- Traçabilité de chaque mouvement de stock, avec l'utilisateur, le terminal et l'heure.
- Sessions des terminaux partagés : connexion rapide par badge, déconnexion automatique.

## Les questions à poser à l'éditeur

1. Quel temps de réponse garantissez-vous pour une validation de scan, et comment le mesurez-vous ?
2. Comment fonctionne le mode déconnecté sur les terminaux ?
3. Comment l'impression locale est-elle assurée depuis votre cloud ?
4. Vos interfaces ERP sont-elles asynchrones, avec reprise automatique ?
5. Avec quels WCS et intégrateurs êtes-vous déjà interfacés ?
6. Pouvez-vous réaliser un test de charge sur nos volumes de pointe ?

Voir aussi [combien coûte un WMS](/guides/prix-wms/) et [les 8 erreurs qui font déraper un projet WMS](/guides/erreurs-projet-wms/).
