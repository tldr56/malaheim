// Contenu expert du dossier de décision : questions à poser aux éditeurs, phases du projet, prochaines étapes.

const COMMON = [
  'Combien de projets comparables au nôtre avez-vous menés ces trois dernières années ? Donnez deux références que nous pouvons appeler.',
  'Qui compose l’équipe projet, à quel taux d’affectation, et pouvons-nous refuser un changement de chef de projet en cours de route ?',
  'Quels niveaux de service sont contractuels (disponibilité, délai de prise en charge, délai de correction), et quelles pénalités s’appliquent ?',
  'Comment récupérons-nous nos données et notre paramétrage en fin de contrat, dans quel format, sous quel délai et à quel coût ?',
  'Quelle est la hausse annuelle maximale de l’abonnement ou de la maintenance sur toute la durée du contrat ?',
];

export const QUESTIONS = {
  wms: [
    'Montrez notre flux le plus complexe en démonstration, sur nos propres données : combien de jours de paramétrage faut-il pour l’obtenir ?',
    'Pour chaque exigence de notre cahier des charges, indiquez si elle relève du standard, du paramétrage ou du développement spécifique, et chiffrez chaque spécifique.',
    'Quel est le coût de chaque interface (ERP, transporteurs, mécanisation), et qui en assure la maintenance après le démarrage ?',
    'Quelle performance garantissez-vous à 150 % de notre pointe d’activité, et comment le prouvez-vous avant le démarrage ?',
    'Comment se passe une montée de version, à quelle fréquence, et que deviennent nos paramétrages et nos développements spécifiques ?',
  ],
  tms: [
    'Combien de nos transporteurs sont connectés en standard, et quels sont le coût et le délai de connexion pour chacun des autres ?',
    'Qui saisit et met à jour nos grilles tarifaires, y compris les surcharges carburant et les prestations annexes ?',
    'Montrez le rapprochement automatique d’une facture transporteur avec le coût calculé, écart compris, et le circuit de litige.',
    'Comment le TMS reçoit-il les factures des transporteurs arrivant par plateforme agréée depuis septembre 2026 ?',
    'Comment l’outil choisit-il le transporteur : sur le coût seul, ou sur le coût, le délai et la qualité de service pondérés ?',
  ],
  erp: [
    'Montrez notre processus de bout en bout (commande, achat, stock, facturation) dans le standard, sans aucun développement.',
    'Combien de licences complètes et de licences limitées faut-il pour nos utilisateurs, et à quel prix chacune ?',
    'Qui reprend nos données, avec quels outils, et combien de répétitions de reprise sont prévues avant le démarrage ?',
    'Comment l’ERP émet-il et reçoit-il les factures électroniques, et par quelle plateforme agréée ?',
    'Quel est le nombre de jours d’intégration chiffré par phase, et le taux journalier de chaque profil intervenant ?',
  ],
  automatisation: [
    'Quel débit garantissez-vous sur notre profil de commandes réel, et quelles pénalités s’appliquent si l’objectif n’est pas atteint ?',
    'Comment fonctionne le mode dégradé en cas de panne, et combien de temps faut-il pour revenir à la normale ?',
    'Quelles sont la disponibilité garantie, le délai d’intervention et la liste des pièces détachées stockées sur site ?',
    'Comment l’installation peut-elle être étendue, et combien coûte une extension prévue dès la conception ?',
    'Qui porte l’interface avec notre WMS, et existe-t-il un environnement d’émulation pour la tester avant l’installation ?',
  ],
  oms: [
    'Comment l’outil calcule-t-il le stock disponible à la vente par canal, réservations et stock de sécurité compris ?',
    'Montrez la règle d’affectation d’une commande entre plusieurs entrepôts et magasins, et sa modification sans développement.',
    'Quel volume de commandes à la minute l’outil tient-il en pointe, et sur quelle preuve mesurée ?',
    'Comment sont gérés les retours, les remboursements partiels et les échanges, de bout en bout ?',
    'Quels connecteurs de places de marché et de transporteurs sont standards, et lesquels sont facturés en plus ?',
  ],
  planification: [
    'Acceptez-vous un test de prévision à l’aveugle sur deux ans de notre historique, comparé à notre méthode actuelle ?',
    'Comment l’outil traite-t-il les nouveaux produits, les promotions et les ruptures présentes dans l’historique ?',
    'Comment les politiques de stock (stock de sécurité, couverture) sont-elles calculées et ajustées article par article ?',
    'Comment le plan se connecte-t-il à notre ERP, dans les deux sens, et à quelle fréquence ?',
    'Qui anime les premiers cycles S&OP avec nous, et combien de cycles sont inclus dans l’offre ?',
  ],
  donnees: [
    'Quelles règles de qualité sont livrées en standard pour les données articles logistiques (poids, dimensions, conditionnements) ?',
    'Comment la qualité est-elle mesurée dans le temps, et qui reçoit les alertes ?',
    'Comment les données corrigées sont-elles diffusées vers l’ERP, le WMS et le TMS ?',
    'Quel circuit de validation est prévu à la création d’un article, et peut-on le modifier sans développement ?',
    'Quelle part du projet est consacrée au nettoyage initial, et qui le réalise ?',
  ],
};
export const questionsFor = (slug) => [...(QUESTIONS[slug] || []), ...COMMON];

// Répartition type d'un projet de logiciel, en part de la durée totale du cadrage au démarrage
export const PHASES = [
  ['Cadrage et cahier des charges', 0, 0.15],
  ['Consultation et choix', 0.15, 0.20],
  ['Conception détaillée', 0.35, 0.18],
  ['Paramétrage et interfaces', 0.53, 0.25],
  ['Recette et formation', 0.78, 0.17],
  ['Démarrage et stabilisation', 0.95, 0.05],
];

export const NEXT_STEPS = [
  ['Faire valider le budget prudent', 'Présentez à la direction le budget couvert 9 fois sur 10, pas le scénario central : c’est lui qui évite de revenir demander une rallonge.'],
  ['Écrire le cahier des charges', 'Décrivez vos flux, vos volumes et vos exceptions. Le kit de consultation fournit les exigences commentées, les scénarios de démonstration et la grille de dépouillement.'],
  ['Consulter 3 à 5 éditeurs', 'Imposez vos scénarios en démonstration et posez les questions de ce dossier. Comparez les offres sur le coût total à 5 ans, pas sur le prix d’entrée.'],
  ['Faire relire avant d’envoyer', 'Une relecture experte du cahier des charges coûte peu au regard d’un écart de périmètre découvert pendant le projet.'],
  ['Sécuriser le contrat', 'Plafonnez les hausses annuelles, écrivez la réversibilité, liez les paiements aux étapes de recette.'],
];
