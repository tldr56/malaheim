---
layout: ../../layouts/Guide.astro
title: "Automatisation d'entrepôt : les exigences techniques et la cybersécurité industrielle"
description: "WCS, automates, réseaux industriels, segmentation IT et OT, télémaintenance, émulation, redondance, règlement machines et Cyber Resilience Act : ce qu'un projet d'automatisation doit garantir techniquement."
slug: technique-automatisation
sw: automatisation-wcs
updated: 2026-11-22
readingTime: 8
---

Une installation automatisée mêle deux mondes : l'informatique de gestion (le WMS, le WCS) et l'informatique industrielle (automates, variateurs, capteurs, robots). Ce second monde, souvent appelé OT, a longtemps été isolé. Il ne l'est plus : les automatismes sont connectés au réseau et télémaintenus par les intégrateurs. C'est devenu une cible. Ce guide complète [le socle technique commun](/guides/exigences-techniques-communes/).

## L'architecture à exiger

| Niveau | Rôle | Exemples |
|---|---|---|
| Gestion | Quoi préparer, quoi stocker | ERP, WMS |
| Pilotage | Quelle machine fait quoi, dans quel ordre | WCS ou WES |
| Contrôle | Commande des équipements en temps réel | Automates programmables, contrôleurs de robots |
| Terrain | Capteurs, moteurs, actionneurs | Convoyeurs, navettes, robots mobiles |

Exigez un schéma d'architecture complet, avec chaque flux, son protocole et son sens.

## Interfaces WMS et WCS

- **Messages.** Missions envoyées par le WMS, comptes rendus renvoyés par le WCS : par messages TCP/IP, par API REST, par MQTT ou par OPC UA. Le format et le contenu de chaque message doivent être spécifiés et validés par les deux parties.
- **Temps réel.** Fixez des délais : par exemple, une décision d'aiguillage en moins de 200 millisecondes, une mission transmise en moins d'une seconde.
- **Reprise.** Que se passe-t-il quand la liaison coupe ? Les machines doivent finir leurs missions en cours et les messages être rejoués sans doublon.
- **Responsabilités.** Un seul pilote du stock par zone : soit le WMS, soit le WCS, jamais les deux.

## Cybersécurité industrielle

- **Segmentation.** Le réseau des automatismes doit être séparé du réseau bureautique par des pare-feu, en zones et conduits selon la norme IEC 62443, la référence du secteur. Aucun poste bureautique ne doit pouvoir joindre directement un automate.
- **Protocoles.** Beaucoup de protocoles industriels historiques (Modbus TCP, certains usages de Profinet) ne sont ni chiffrés ni authentifiés. Ils doivent rester confinés dans leur zone. Préférez OPC UA avec ses fonctions de sécurité activées pour les échanges entre niveaux.
- **Télémaintenance.** L'intégrateur doit intervenir à distance, mais jamais par une connexion permanente ou un logiciel de prise en main installé sur un poste. Exigez un accès par bastion ou passerelle dédiée, avec authentification forte, ouverture à la demande, enregistrement des sessions et votre validation.
- **Postes industriels.** Les PC de supervision tournent souvent sous des versions anciennes de Windows. Exigez une politique de correctifs, un antivirus compatible, la désactivation des ports USB et la liste des logiciels installés.
- **Sauvegardes.** Les programmes des automates et la configuration du WCS doivent être sauvegardés, versionnés et restaurables par vos équipes.
- **Inventaire.** La liste de tous les équipements connectés, avec leurs versions de micrologiciel, est le point de départ de toute gestion des failles.

## Réglementation

- **Règlement machines.** Le règlement européen 2023/1230, applicable à partir du 20 janvier 2027, intègre la protection contre la corruption malveillante des systèmes de commande dans les exigences de sécurité des machines.
- **Cyber Resilience Act.** Pour les équipements et logiciels comportant des éléments numériques, les obligations de signalement des failles activement exploitées s'appliquent depuis le 11 septembre 2026, l'ensemble du règlement à partir du 11 décembre 2027. Demandez à l'intégrateur comment il s'y conforme.
- **NIS2.** Si votre entreprise est une entité essentielle ou importante, vos installations automatisées entrent dans le périmètre de votre politique de cybersécurité.

## Tests avant la mise en service

- **Émulation.** Un jumeau numérique de l'installation permet de tester le WMS et le WCS avant l'arrivée des machines. Exigez-le dans le contrat : il fait gagner des semaines.
- **Recette usine puis sur site.** Recette en usine chez l'intégrateur, puis recette sur site avec vos flux réels et vos cas d'exception : colis hors gabarit, code illisible, panne d'une navette.
- **Performances garanties.** Mesurées sur votre profil de commandes, avec un protocole écrit et des pénalités.

## Disponibilité

Serveurs WCS redondés, onduleurs, pièces détachées critiques en stock, contrat de maintenance avec délais d'intervention. Fixez un taux de disponibilité de l'installation, souvent 98 à 99,5 % sur les heures d'exploitation, et la manière de le mesurer.

## Les questions à poser à l'intégrateur

1. Pouvez-vous fournir le schéma complet des flux et des protocoles ?
2. Comment séparez-vous le réseau des automatismes du réseau bureautique ?
3. Comment se déroule une télémaintenance, et qui l'autorise ?
4. Fournissez-vous un environnement d'émulation pour tester le WMS ?
5. Comment gérez-vous les correctifs de sécurité des postes industriels ?
6. Comment vous conformez-vous au règlement machines et au Cyber Resilience Act ?

Voir aussi [combien coûte l'automatisation d'un entrepôt](/guides/prix-automatisation-entrepot/) et [les erreurs d'un projet d'automatisation](/guides/erreurs-projet-automatisation/).

Sources : [Commission européenne, Cyber Resilience Act](https://commission.europa.eu/news-and-media/news/safer-and-more-secure-digital-products-2026-09-11_bg), [Journal du Net, transposition de NIS2](https://www.journaldunet.com/cybersecurite/1557881-nis2-l-assemblee-adopte-enfin-la-transposition-et-la-reecrit-contre-l-avis-du-gouvernement/).
