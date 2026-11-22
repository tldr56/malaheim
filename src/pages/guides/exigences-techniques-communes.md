---
layout: ../../layouts/Guide.astro
title: "Sécurité, SSO, API, hébergement : le socle technique de tout logiciel supply chain"
description: "Les exigences techniques à imposer à n'importe quel éditeur, du WMS à l'outil de données : identité et SSO, chiffrement, certifications, disponibilité, API, journalisation, réversibilité et réglementation."
slug: exigences-techniques-communes
sw: transverse
updated: 2026-11-22
readingTime: 9
---

Un logiciel supply chain est branché sur votre ERP, vos clients, vos transporteurs et parfois vos machines. Il devient donc une porte d'entrée sur votre système d'information. Les fonctions métier se comparent facilement ; la solidité technique beaucoup moins, parce que les éditeurs répondent souvent « oui » à tout. Voici le socle à exiger, avec les preuves à demander.

## 1. Architecture et hébergement

- **Mode de déploiement.** SaaS mutualisé (une seule application pour tous les clients, données cloisonnées), SaaS dédié (une instance pour vous) ou installation chez vous. Le mutualisé est moins cher et toujours à jour, le dédié laisse choisir la date des montées de version.
- **Localisation.** Exigez l'hébergement des données et des sauvegardes dans l'Union européenne, avec le nom de l'hébergeur et de la région (Paris, Francfort, Amsterdam).
- **Sous-traitants.** La liste complète des sous-traitants qui accèdent aux données, y compris le support hors Union européenne. Un hébergeur soumis à une législation extraterritoriale comme le CLOUD Act américain n'est pas un problème en soi, mais c'est un risque à connaître.
- **Données sensibles.** Pour un opérateur sensible ou des données stratégiques, la qualification SecNumCloud de l'ANSSI est le niveau de référence en France.

## 2. Identité et accès

- **SSO (authentification unique).** Le logiciel doit se brancher sur votre annuaire d'entreprise, Microsoft Entra ID, Google Workspace ou Okta, en SAML 2.0 ou en OpenID Connect. Vos salariés n'ont alors qu'un seul mot de passe, et un départ se traite en un seul endroit.
- **Authentification forte (MFA).** Obligatoire pour les administrateurs et pour tous les comptes externes : transporteurs, prestataires, clients sur un portail.
- **Provisionnement automatique (SCIM 2.0).** Les comptes sont créés, modifiés et désactivés automatiquement depuis votre annuaire. Sans SCIM, les comptes des anciens salariés restent actifs des mois.
- **Droits par rôle et par périmètre.** Un chef d'équipe ne voit que son entrepôt, un transporteur que ses envois. Demandez la matrice des rôles et la possibilité d'en créer.
- **Comptes techniques.** Les interfaces utilisent des comptes de service avec des jetons à durée limitée (OAuth 2.0), jamais le compte d'un salarié.
- **Accès de l'éditeur.** Le support ne doit accéder à vos données qu'avec votre accord, de façon tracée et limitée dans le temps.

## 3. Protection des données

- **Chiffrement en transit :** TLS 1.2 au minimum, TLS 1.3 de préférence, sur toutes les connexions, interfaces comprises.
- **Chiffrement au repos :** AES-256 sur les bases et les sauvegardes. Pour les grands comptes, la gestion de vos propres clés (BYOK) est un plus.
- **Cloisonnement :** en SaaS mutualisé, demandez comment les données d'un client sont isolées de celles des autres, et comment c'est testé.

## 4. Certifications et preuves

Une déclaration commerciale ne vaut rien. Demandez des documents :

- le **certificat ISO/IEC 27001**, avec son périmètre exact (le produit que vous achetez doit y figurer, pas seulement le siège de l'éditeur) ;
- ou le **rapport SOC 2 Type II**, qui atteste du fonctionnement des contrôles sur une période de 6 à 12 mois ;
- la **synthèse du dernier test d'intrusion**, réalisé par un tiers dans les 12 derniers mois, et le délai de correction des failles critiques ;
- le **plan d'assurance sécurité**, qui décrit les engagements de l'éditeur pour votre contrat.

## 5. Disponibilité et continuité

- **Taux de disponibilité garanti.** 99,5 % autorise environ 3 h 40 d'interruption par mois ; 99,9 % environ 43 minutes. Pour un entrepôt qui expédie tous les jours, visez 99,9 % sur les heures d'activité, avec des pénalités.
- **RPO et RTO.** Le RPO est la quantité de données que l'on accepte de perdre (par exemple 15 minutes), le RTO le temps de remise en service (par exemple 4 heures). Faites-les écrire dans le contrat.
- **Plan de reprise.** Testé au moins une fois par an, avec un compte rendu communicable.
- **Mode dégradé.** Que faites-vous si le logiciel est indisponible deux heures un jour de pointe ? La réponse doit exister avant le démarrage.

## 6. Intégration et API

- **API documentées.** API REST décrites en OpenAPI, avec un environnement de test (bac à sable) et des exemples. Demandez la liste des objets couverts en lecture et en écriture.
- **Événements.** Des webhooks signés pour être prévenu d'un changement (commande expédiée, stock modifié) plutôt que d'interroger le logiciel toutes les minutes.
- **Échanges historiques.** EDI EDIFACT, fichiers sur SFTP, AS2 : souvent indispensables avec les grands clients et les transporteurs.
- **Limites.** Nombre d'appels autorisés par minute, taille des lots, pagination. Elles doivent tenir vos volumes de pointe.
- **Versions.** Une politique de version des API, avec au moins 12 mois de préavis avant l'arrêt d'une ancienne version.
- **Plateforme d'intégration.** Au-delà de trois ou quatre interfaces, un middleware ou une plateforme d'intégration (iPaaS) centralise la supervision et évite les connexions point à point.

## 7. Journalisation et supervision

Le logiciel doit tracer les connexions, les actions sensibles (modification de droits, de prix, de stock) et les erreurs d'interface. Exigez la durée de conservation des journaux (12 mois est un bon repère), l'export vers votre outil de supervision de sécurité (SIEM) et un tableau de bord des interfaces en erreur.

## 8. Cycle de vie et montées de version

En SaaS, les nouvelles versions sont imposées, souvent deux à quatre fois par an. Demandez le calendrier, le préavis, l'accès anticipé en pré-production et les notes de version. Prévoyez des tests de non-régression, idéalement automatisés, sur vos processus critiques.

## 9. Réversibilité

Le jour où vous partez, vous devez récupérer toutes vos données, historique compris, dans un format ouvert et documenté, dans un délai écrit, avec une assistance chiffrée à l'avance. Exigez aussi une attestation de destruction des données après la sortie.

## 10. Réglementation

- **RGPD.** Un accord de sous-traitance conforme à l'article 28, la liste des données personnelles traitées (salariés, clients, chauffeurs), les durées de conservation.
- **NIS2.** La directive européenne impose des obligations de cybersécurité aux entités essentielles et importantes, et indirectement à leurs fournisseurs. En France, la loi de transposition, dite loi Résilience, a été adoptée en première lecture par l'Assemblée nationale le 17 novembre 2026, après le Sénat. Si votre entreprise est concernée, vos éditeurs doivent pouvoir suivre.
- **Cyber Resilience Act.** Pour les logiciels installés et les équipements connectés, les obligations de signalement des failles activement exploitées s'appliquent depuis le 11 septembre 2026, et l'ensemble du règlement à partir du 11 décembre 2027.
- **Facturation électronique.** Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir leurs factures électroniques par une plateforme agréée. Les logiciels qui produisent ou contrôlent des factures (ERP, TMS) doivent s'y connecter.

## Les 12 questions à poser à chaque éditeur

1. Où sont hébergées mes données et mes sauvegardes, et par qui ?
2. Quels sous-traitants y accèdent, et depuis quels pays ?
3. Proposez-vous le SSO en SAML 2.0 ou OpenID Connect, sans surcoût ?
4. Gérez-vous le provisionnement SCIM ?
5. Pouvez-vous me transmettre votre certificat ISO 27001 ou votre rapport SOC 2 Type II, avec le périmètre ?
6. Quand a eu lieu votre dernier test d'intrusion, et par qui ?
7. Quels taux de disponibilité, RPO et RTO garantissez-vous contractuellement ?
8. Où est la documentation de vos API, et puis-je accéder au bac à sable avant de signer ?
9. Quelles sont les limites d'appels, et comment sont gérées les versions d'API ?
10. Comment les journaux sont-ils conservés et exportés ?
11. Comment se passent les montées de version, avec quel préavis ?
12. Que récupère-t-on, sous quel format et sous quel délai, à la fin du contrat ?

Chaque famille de logiciels ajoute ses propres exigences : voir les guides techniques [WMS](/guides/technique-wms/), [TMS](/guides/technique-tms/), [ERP](/guides/technique-erp/), [automatisation](/guides/technique-automatisation/), [OMS](/guides/technique-oms/), [planification](/guides/technique-planification/) et [données](/guides/technique-donnees/).

Sources : [Service Public Entreprendre, réforme de la facturation électronique](https://entreprendre.service-public.gouv.fr/actualites/A18953?lang=fr), [Acteurs publics, adoption de la loi Résilience](https://acteurspublics.fr/articles/apres-le-fiasco-du-projet-scribe-la-responsabilite-financiere-des-agents-publics-appelee-a-setendre-a-la-cybersecurite/), [Commission européenne, Cyber Resilience Act](https://commission.europa.eu/news-and-media/news/safer-and-more-secure-digital-products-2026-09-11_bg).
