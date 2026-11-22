// Modèles de chiffrage des simulateurs Malaheim, version 2 (novembre 2026).
// Chaque modèle décrit ses questions, ses hypothèses modifiables, ses sources,
// et une fonction compute(i, a) qui renvoie un résultat au format commun.
// Le moteur simulate() en déduit l'échéancier, le point mort et le ROI.

const pick = (arr, n) => arr[Math.max(0, Math.min(arr.length - 1, n))];
const sum = (parts) => parts.reduce((s, p) => s + p[1], 0);
const HOURS_FTE = 1607; // durée annuelle légale du travail en France

// ---------------------------------------------------------------- WMS
const wms = {
  slug: 'wms', code: 'WMS', sw: 'wms', name: "Gestion d'entrepôt",
  title: 'Combien coûte votre projet WMS ?',
  lead: "Décrivez votre entrepôt en 8 questions. Vous obtenez la gamme de solution adaptée, le budget poste par poste, le délai et le retour sur investissement.",
  card: 'Budget, délai et ROI de votre entrepôt', horizon: 5, ramp: 6,
  fields: [
    { group: 'Votre entrepôt', id: 'surface', label: "Surface de l'entrepôt", type: 'range', min: 1000, max: 60000, step: 500, value: 8000, unit: 'm²', log: true },
    { group: 'Votre entrepôt', id: 'lines', label: 'Lignes de commande préparées par jour', type: 'range', min: 100, max: 50000, step: 100, value: 3000, unit: 'lignes', log: true },
    { group: 'Votre entrepôt', id: 'ops', label: 'Opérateurs équipés', type: 'range', min: 3, max: 300, step: 1, value: 25, unit: 'opérateurs', log: true },
    { group: 'Votre entrepôt', id: 'sites', label: 'Sites à équiper', type: 'range', min: 1, max: 8, step: 1, value: 1, unit: 'site(s)' },
    { group: 'Votre contexte', id: 'erp', label: 'ERP en place', type: 'seg', value: 1, options: ['Standard avec connecteur WMS', 'Standard sans connecteur', 'ERP maison ou spécifique'] },
    { group: 'Votre contexte', id: 'mech', label: 'Mécanisation', type: 'seg', value: 0, options: ['Aucune', 'Convoyeurs ou tri simple', 'Automatisation lourde'] },
    { group: 'Votre contexte', id: 'cx', label: 'Complexité des processus', type: 'seg', value: 1, options: ['Standard', 'Lots, dates, multi-déposants', 'Kitting, cross-dock, valeur ajoutée'] },
    { group: 'Votre contexte', id: 'mode', label: 'Mode de déploiement', type: 'seg', value: 0, options: ['SaaS (abonnement)', 'Licence installée chez vous'] },
  ],
  assumptions: [
    { id: 'cost', label: 'Coût horaire chargé d’un opérateur', value: 24, min: 12, max: 80, step: 1, unit: '€' },
    { id: 'prod', label: 'Gain de productivité attendu', value: 12, min: 0, max: 40, step: 1, unit: '%' },
    { id: 'err', label: 'Taux d’erreur de préparation actuel', value: 0.5, min: 0, max: 5, step: 0.1, unit: '%' },
    { id: 'errcost', label: 'Coût moyen d’une erreur', value: 25, min: 0, max: 300, step: 5, unit: '€' },
    { id: 'days', label: 'Jours d’activité par an', value: 250, min: 200, max: 365, step: 5, unit: 'jours' },
  ],
  tiers: [
    { name: 'WMS SaaS standard', desc: 'Solution légère, paramétrage rapide, très peu de spécifique.', sub: 70, lic: 1500, integ: 25000, months: 4, server: 15000, amoa: 0.10, itf: 1.0 },
    { name: 'WMS milieu de gamme', desc: 'Progiciel paramétrable, intégrateur dédié, quelques adaptations.', sub: 120, lic: 3000, integ: 70000, months: 8, server: 30000, amoa: 0.15, itf: 1.6 },
    { name: 'WMS avancé', desc: 'Solution de premier rang, pilotage fin des ressources et de la mécanisation.', sub: 170, lic: 4500, integ: 300000, months: 14, server: 60000, amoa: 0.15, itf: 3.0 },
  ],
  compute(i, a) {
    const s = (i.ops <= 15 ? 0 : i.ops <= 60 ? 1 : 2) + (i.lines <= 2000 ? 0 : i.lines <= 10000 ? 1 : 2) + i.cx + i.mech;
    const t = s <= 1 ? 0 : s <= 4 ? 1 : 2;
    const T = this.tiers[t];
    const integ = T.integ * pick([1, 1.3, 1.7], i.cx) * (1 + 0.5 * (i.sites - 1));
    const itf = pick([10000, 25000, 45000], i.erp) * T.itf + pick([0, 20000, 80000], i.mech);
    const hw = i.ops * 1500 + i.surface * 0.8 + i.sites * 2500;
    const chg = integ * 0.12 + i.ops * 250;
    const amoa = (integ + itf) * T.amoa;
    const parts = [
      ['Intégration et paramétrage', integ],
      ['Interfaces ERP et équipements', itf],
      ['Terminaux, réseau, impression', hw],
      ['Formation et conduite du changement', chg],
      ['Pilotage et assistance projet', amoa],
    ];
    if (i.mode === 1) parts.unshift(['Licences et serveurs', i.ops * T.lic + T.server]);
    const recurring = i.mode === 1 ? i.ops * T.lic * 0.20 : i.ops * T.sub * 12;
    const m = T.months + i.cx + i.erp + pick([0, 1, 3], i.mech) + (i.sites - 1) * 1.5;
    const gains = [
      ['Productivité des opérateurs', i.ops * HOURS_FTE * a.cost * (a.prod / 100)],
      ['Erreurs de préparation évitées', i.lines * a.days * (a.err / 100) * 0.6 * a.errcost],
    ];
    const watch = ['Fiabilisez vos données articles (poids, dimensions, conditionnements) avant le projet : c’est la première cause de retard en recette.'];
    if (i.erp === 2) watch.push('ERP spécifique : prévoyez une spécification d’interface détaillée et des tests de bout en bout dès la conception.');
    if (i.mech > 0) watch.push('Mécanisation : associez l’intégrateur dès l’étude et exigez un environnement d’émulation pour tester le WMS sans les machines.');
    if (i.cx === 2) watch.push('Processus spécifiques : imposez-les en démonstration, c’est là que les solutions se départagent.');
    if (i.sites > 1) watch.push('Plusieurs sites : démarrez par un site pilote, puis déployez par vagues.');
    if (i.ops > 60) watch.push('Plus de 60 opérateurs : exigez un test de charge à 150 % de votre pointe avant le démarrage.');
    if (i.mode === 1) watch.push('Licence : négociez un plafond de revalorisation annuelle de la maintenance.');
    return {
      tier: T, parts, recurring, months: [m, m + Math.max(2, m * 0.3)], gains, watch,
      recurringNote: i.mode === 1 ? 'Maintenance, 20 % des licences par an' : `Abonnement, ${T.sub} € par opérateur et par mois`,
    };
  },
  sources: [
    ['Abonnement SaaS par opérateur et par mois', '70, 120 ou 170 € selon la gamme', '50 à 180 € en Europe', 'Weaver WMS, The Logistics of Logistics', 'https://weaverwms.com/en/blog/how-much-does-wms-implementation-cost'],
    ['Intégration et paramétrage, base', '25, 70 ou 300 k€ selon la gamme', 'PME : 50 à 100 k€ licence et intégration ; premier rang : 200 à 750 k$', 'Sitaci, The Logistics of Logistics', 'https://www.thelogisticsoflogistics.com/cost-of-warehouse-management-system-software/'],
    ['Maintenance annuelle en licence', '20 % des licences', '15 à 22 %', 'CPCON', 'https://cpcongroup.com/insights/article/warehouse-management-system-cost-guide/'],
    ['Matériel par opérateur', '1 500 €', '1 000 à 3 000 $ par utilisateur', 'Finale Inventory', 'https://www.finaleinventory.com/guides/warehouse-management-system-cost/'],
    ['Délai de base', '4, 8 ou 14 mois selon la gamme', 'PME : 4 à 6 mois ; ETI : 9 à 18 mois', 'Amalo', 'https://www.amalo-recrutement.fr/blog/classement-meilleurs-wms/'],
    ['Coût d’une erreur de préparation', '25 €', '22 $ en moyenne, jusqu’à 100 $', 'DMSi, étude Intermec', 'https://dmsiworks.com/blog/the-cost-of-a-mispick-improve-the-bottom-line-by-reducing-errors'],
    ['Gain de productivité', '12 %', 'Les éditeurs annoncent 20 à 40 % ; valeur volontairement basse', 'Mecalux', 'https://www.mecalux.com/logistics-articles/improve-productivity'],
  ],
};

// ---------------------------------------------------------------- TMS
const tms = {
  slug: 'tms', code: 'TMS', sw: 'tms', name: 'Gestion du transport',
  title: 'Combien coûte votre TMS, et combien rapporte-t-il ?',
  lead: 'Décrivez vos flux de transport en 8 questions. Vous obtenez le type de TMS adapté, le budget de mise en place, l’abonnement et les économies sur votre dépense transport.',
  card: 'Budget, abonnement et économies transport', horizon: 5, ramp: 4,
  fields: [
    { group: 'Vos flux', id: 'shipments', label: 'Envois par an', type: 'range', min: 1000, max: 500000, step: 500, value: 20000, unit: 'envois', log: true },
    { group: 'Vos flux', id: 'spend', label: 'Dépense transport annuelle', type: 'range', min: 50, max: 30000, step: 10, value: 800, unit: 'k€', log: true },
    { group: 'Vos flux', id: 'carriers', label: 'Transporteurs utilisés', type: 'range', min: 1, max: 60, step: 1, value: 8, unit: 'transporteurs' },
    { group: 'Vos flux', id: 'modes', label: 'Modes de transport', type: 'seg', value: 0, options: ['Colis et messagerie', 'Avec lots complets', 'Multimodal et international'] },
    { group: 'Votre organisation', id: 'users', label: 'Exploitants transport', type: 'range', min: 1, max: 60, step: 1, value: 4, unit: 'personnes' },
    { group: 'Votre organisation', id: 'sites', label: 'Sites expéditeurs', type: 'range', min: 1, max: 15, step: 1, value: 1, unit: 'site(s)' },
    { group: 'Votre organisation', id: 'erp', label: 'ERP en place', type: 'seg', value: 1, options: ['Connecteur TMS existant', 'ERP standard sans connecteur', 'ERP spécifique'] },
    { group: 'Votre organisation', id: 'audit', label: 'Contrôle des factures transport aujourd’hui', type: 'seg', value: 1, options: ['Aucun', 'Par sondage', 'Systématique, à la main'] },
  ],
  assumptions: [
    { id: 'inv', label: 'Écarts de facturation non détectés sans contrôle', value: 2, min: 0, max: 8, step: 0.5, unit: '% de la dépense' },
    { id: 'opt', label: 'Économie par le choix systématique du transporteur', value: 3, min: 0, max: 12, step: 0.5, unit: '% de la dépense' },
    { id: 'prod', label: 'Gain de productivité des exploitants', value: 15, min: 0, max: 50, step: 1, unit: '%' },
    { id: 'cost', label: 'Coût horaire chargé d’un exploitant', value: 32, min: 15, max: 90, step: 1, unit: '€' },
  ],
  tiers: [
    { name: 'TMS SaaS d’entrée de gamme', desc: 'Réservation, étiquettes et suivi chez les principaux transporteurs.', incl: 5, setup: 3000, months: 1 },
    { name: 'TMS SaaS complet', desc: 'Choix du transporteur, grilles tarifaires, contrôle des factures, indicateurs.', incl: 15, setup: 15000, months: 2.5 },
    { name: 'TMS avancé', desc: 'Planification, affrètement, optimisation, multimodal et réseau multi-sites.', incl: 30, setup: 60000, months: 7 },
  ],
  compute(i, a) {
    const s = (i.shipments > 50000 ? 1 : 0) + (i.shipments > 200000 ? 1 : 0) + i.modes + (i.carriers > 15 ? 1 : 0) + (i.sites > 2 ? 1 : 0) + (i.users > 10 ? 1 : 0);
    const t = s === 0 && i.users <= 3 ? 0 : s <= 3 ? 1 : 2;
    const T = this.tiers[t];
    const extra = Math.max(0, i.carriers - T.incl);
    const spend = i.spend * 1000;
    const base = [
      ['Mise en place et paramétrage', T.setup * (1 + 0.35 * (i.sites - 1)) * pick([1, 1.2, 1.5], i.modes)],
      ['Connecteurs transporteurs', i.carriers * 300 + extra * pick([1500, 3000, 5000], t)],
      ['Saisie des grilles tarifaires', i.carriers * pick([250, 600, 1200], i.modes)],
      ['Interfaces ERP et WMS', pick([3000, 10000, 25000], i.erp) * pick([0.6, 1, 1.6], t)],
      ['Formation des exploitants', 1500 + i.users * 400],
    ];
    const parts = [...base, ['Pilotage du projet', sum(base) * pick([0.05, 0.12, 0.15], t)]];
    const recurring = t === 0 ? 12 * (89 + i.shipments * 0.009)
      : t === 1 ? i.users * 85 * 12 + i.sites * 1800 + i.shipments * 0.04
      : 30000 + i.shipments * 0.12 + i.sites * 6000 + i.users * 600;
    const m = T.months + i.carriers / 15 + (i.sites - 1) * 0.7 + i.erp * 0.7 + i.modes * 0.8;
    const gains = [
      ['Écarts de facturation récupérés', spend * (a.inv / 100) * pick([1, 0.6, 0.2], i.audit) * pick([0.5, 0.9, 1], t)],
      ['Choix du transporteur le moins cher', spend * (a.opt / 100) * pick([0.5, 1, 1.3], t)],
      ['Productivité des exploitants', i.users * HOURS_FTE * a.cost * (a.prod / 100)],
    ];
    const watch = ['Vérifiez la qualité des poids et dimensions transmis par l’ERP ou le WMS : tout le calcul des prix en dépend.',
      'Depuis septembre 2026, les factures des transporteurs arrivent par plateforme agréée : exigez leur rapprochement automatique avec les coûts calculés.'];
    if (extra > 0) watch.push(`${extra} transporteur(s) probablement hors catalogue standard : faites chiffrer chaque connecteur dès la consultation.`);
    if (i.audit === 0) watch.push('Aucun contrôle des factures aujourd’hui : c’est le gain le plus rapide, activez-le dès le démarrage.');
    if (i.erp === 2) watch.push('ERP spécifique : spécifiez l’interface commandes et coûts de transport avant de consulter.');
    if (i.modes === 2) watch.push('Multimodal et international : faites démontrer la gestion des documents douaniers et des incoterms.');
    return {
      tier: T, parts, recurring, months: [m, m * 1.4 + 0.5], gains, watch,
      recurringNote: t === 0 ? 'Abonnement au volume d’envois' : t === 1 ? 'Abonnement par exploitant, par site et au volume' : 'Abonnement annuel négocié',
    };
  },
  sources: [
    ['Abonnement d’entrée de gamme', 'À partir de 89 € par mois, puis au volume', 'Offres publiques dès 89 € par mois, 199 $ par mois', 'Hackceleration, comparatif 2026', 'https://hackceleration.com/fr/labs/meilleur/tms-logiciel-transport'],
    ['Abonnement TMS complet', '85 € par exploitant et par mois, plus site et volume', '40 à 120 € par utilisateur et par mois', 'Guide Malaheim, grilles éditeurs', '/guides/prix-tms/'],
    ['TMS avancé', '30 k€ par an et plus', '30 à plus de 250 k€ par an pour un grand chargeur', 'Cargoson, guide des prix TMS', 'https://www.cargoson.com/fr/blog/logiciel-gestion-transports-tms-prix-cout'],
    ['Écarts de facturation', '2 % de la dépense sans contrôle', 'Hypothèse Malaheim, modifiable', 'Retours de projets', ''],
    ['Économie par le choix du transporteur', '3 % de la dépense', 'Hypothèse prudente, modifiable', 'Retours de projets', ''],
  ],
};

// ---------------------------------------------------------------- ERP
const erp = {
  slug: 'erp', code: 'ERP', sw: 'erp', name: 'Gestion intégrée',
  title: 'Combien coûte votre projet ERP ?',
  lead: 'Décrivez votre entreprise en 9 questions. Vous obtenez le type d’ERP adapté, le budget poste par poste, la durée du projet et les gains sur vos stocks et votre administration.',
  card: 'Budget, durée et gains de votre projet ERP', horizon: 5, ramp: 9,
  fields: [
    { group: 'Votre entreprise', id: 'users', label: 'Utilisateurs de l’ERP', type: 'range', min: 5, max: 600, step: 1, value: 30, unit: 'utilisateurs', log: true },
    { group: 'Votre entreprise', id: 'companies', label: 'Sociétés juridiques', type: 'range', min: 1, max: 10, step: 1, value: 1, unit: 'société(s)' },
    { group: 'Votre entreprise', id: 'sites', label: 'Sites (usines, entrepôts, agences)', type: 'range', min: 1, max: 20, step: 1, value: 2, unit: 'site(s)' },
    { group: 'Votre entreprise', id: 'stock', label: 'Valeur du stock', type: 'range', min: 50, max: 100000, step: 50, value: 2000, unit: 'k€', log: true },
    { group: 'Votre projet', id: 'sector', label: 'Activité', type: 'seg', value: 0, options: ['Négoce et distribution', 'Industrie de fabrication', 'Industrie à lots ou process'] },
    { group: 'Votre projet', id: 'spec', label: 'Adaptations attendues', type: 'seg', value: 1, options: ['Standard', 'Quelques adaptations', 'Nombreuses adaptations'] },
    { group: 'Votre projet', id: 'data', label: 'État des données actuelles', type: 'seg', value: 1, options: ['Propres', 'À nettoyer', 'Dispersées dans des fichiers'] },
    { group: 'Votre projet', id: 'itf', label: 'Interfaces à réaliser (e-commerce, WMS, EDI, banque)', type: 'range', min: 0, max: 15, step: 1, value: 3, unit: 'interface(s)' },
    { group: 'Votre projet', id: 'mode', label: 'Mode de déploiement', type: 'seg', value: 0, options: ['SaaS (abonnement)', 'Licence installée chez vous'] },
  ],
  assumptions: [
    { id: 'cost', label: 'Coût horaire chargé d’un utilisateur', value: 35, min: 15, max: 100, step: 1, unit: '€' },
    { id: 'prod', label: 'Gain de productivité administrative', value: 5, min: 0, max: 25, step: 1, unit: '%' },
    { id: 'red', label: 'Réduction de stock atteignable', value: 5, min: 0, max: 30, step: 1, unit: '%' },
    { id: 'carry', label: 'Coût annuel de possession du stock', value: 20, min: 5, max: 35, step: 1, unit: '% de sa valeur' },
  ],
  tiers: [
    { name: 'ERP SaaS pour TPE et petite PME', desc: 'Processus standard, paramétrage rapide, peu d’interfaces.', sub: 45, lic: 1200, integ: 25000, months: 4, itf: 5000 },
    { name: 'ERP de gestion intermédiaire', desc: 'Progiciel complet, intégrateur dédié, quelques adaptations.', sub: 95, lic: 2500, integ: 50000, months: 7, itf: 8000 },
    { name: 'ERP pour ETI et groupes', desc: 'Multi-sociétés, multi-sites, production avancée, gouvernance forte.', sub: 160, lic: 4000, integ: 140000, months: 11, itf: 18000 },
  ],
  compute(i, a) {
    const s = (i.users > 15 ? 1 : 0) + (i.users > 80 ? 1 : 0) + (i.sector > 0 ? 1 : 0) + (i.spec === 2 ? 1 : 0) + (i.companies > 1 ? 1 : 0);
    const t = s === 0 ? 0 : s <= 2 ? 1 : 2;
    const T = this.tiers[t];
    const integ = T.integ * pick([1, 1.2, 1.35], i.sector) * pick([1, 1.3, 1.7], i.spec) * (1 + 0.25 * (i.companies - 1)) * (1 + 0.12 * (i.sites - 1)) * (1 + Math.max(0, i.users - 50) / 500);
    const itf = i.itf * T.itf;
    const parts = [
      ['Intégration et paramétrage', integ],
      ['Reprise des données', integ * pick([0.10, 0.15, 0.25], i.data)],
      ['Interfaces', itf],
      ['Formation et conduite du changement', integ * 0.15 + i.users * 150],
      ['Pilotage et assistance projet', (integ + itf) * 0.10],
    ];
    if (i.mode === 1) parts.unshift(['Licences', i.users * T.lic]);
    const recurring = i.mode === 1 ? i.users * T.lic * 0.18 + 4000 : i.users * T.sub * 12;
    const m = T.months + i.spec * 1.5 + i.sector + (i.companies - 1) + i.data + i.itf / 5;
    const stock = i.stock * 1000;
    const gains = [
      ['Productivité administrative', i.users * HOURS_FTE * a.cost * (a.prod / 100)],
      ['Coût de possession du stock évité', stock * (a.red / 100) * (a.carry / 100)],
    ];
    const watch = ['Les gains d’un ERP sont aussi qualitatifs (conformité, fiabilité, capacité à grandir) : ce modèle ne compte que le mesurable.', 'Facturation électronique : depuis septembre 2026, toutes les entreprises reçoivent leurs factures par plateforme agréée. Exigez la connexion native de l’ERP.',
      'Conduite du changement : ne la coupez pas pour tenir le budget, c’est le poste le plus souvent regretté.'];
    if (i.data === 2) watch.push('Données dispersées : lancez le nettoyage dès le cadrage, pas pendant la recette.');
    if (i.spec === 2) watch.push('Nombreuses adaptations : chaque spécifique alourdit les montées de version. Adaptez-vous au standard partout où vous ne faites pas la différence.');
    if (i.companies > 1) watch.push('Plusieurs sociétés : faites démontrer les flux intersociétés et la consolidation.');
    if (i.itf > 5) watch.push('Plus de 5 interfaces : une plateforme d’intégration centralise la supervision et évite les connexions point à point.');
    return {
      tier: T, parts, recurring, months: [m, m * 1.35], gains, watch,
      oneOff: ['Trésorerie libérée par la baisse du stock', stock * (a.red / 100)],
      recurringNote: i.mode === 1 ? 'Maintenance 18 % des licences, plus hébergement' : `Abonnement, ${T.sub} € par utilisateur et par mois`,
    };
  },
  sources: [
    ['Abonnement par utilisateur', '45, 95 ou 160 € par mois selon la gamme', 'Environ 25 à plus de 200 € par utilisateur et par mois selon les éditeurs', 'Ecosire, Houseblend', 'https://ecosire.com/fr/blog/erp-cost-guide'],
    ['Taux journaliers d’intégration', 'Inclus dans la base d’intégration', '600 à 900 € par jour', 'Absys Cyborg', 'https://absyscyborg.com/fr/actualites/quel-est-le-prix-d-un-erp-pour-pme'],
    ['Reprise des données', '10 à 25 % de l’intégration selon l’état des données', 'Au moins 10 à 15 %, près de 20 % si données désordonnées', 'Ecosire', 'https://ecosire.com/fr/blog/erp-cost-guide'],
    ['Maintenance en licence', '18 % par an', '15 à 22 %', 'Ecosire', 'https://ecosire.com/fr/blog/erp-cost-guide'],
    ['Dépassements de budget', 'Fourchette haute à +35 %', '74 % des projets dépassent leur budget initial', 'Panorama Consulting, cité par Ecosire', 'https://ecosire.com/fr/blog/erp-cost-guide'],
    ['Gains sur stock et productivité', '5 % de stock en moins, 5 % de temps administratif', 'Hypothèses prudentes, modifiables', 'Retours de projets', ''],
  ],
};

// ---------------------------------------------------------------- Automatisation
const auto = {
  slug: 'automatisation', code: 'WCS', sw: 'automatisation-wcs', name: 'Automatisation d’entrepôt',
  title: 'Votre automatisation est-elle rentable ?',
  lead: 'Choisissez une technologie et décrivez vos volumes en 7 questions. Vous obtenez l’investissement, le nombre de robots s’il y a lieu, le délai et le retour sur investissement sur 10 ans.',
  card: 'Investissement et retour sur 10 ans', horizon: 10, ramp: 6,
  fields: [
    { group: 'La technologie', id: 'tech', label: 'Technologie envisagée', type: 'seg', value: 0, options: ['Robots mobiles de préparation', 'Convoyeurs et tri', 'Stockage automatisé en bacs', 'Transstockeurs palettes'] },
    { group: 'Vos volumes', id: 'volume', label: 'Lignes ou unités traitées par jour', type: 'range', min: 500, max: 80000, step: 100, value: 8000, unit: 'par jour', log: true },
    { group: 'Vos volumes', id: 'shifts', label: 'Équipes par jour', type: 'seg', value: 1, options: ['1 équipe', '2 équipes', '3 équipes'] },
    { group: 'Vos volumes', id: 'fte', label: 'Personnes affectées aujourd’hui à ces flux', type: 'range', min: 3, max: 300, step: 1, value: 30, unit: 'ETP', log: true },
    { group: 'Votre site', id: 'building', label: 'Bâtiment', type: 'seg', value: 0, options: ['Adapté', 'Travaux à prévoir', 'Neuf ou extension'] },
    { group: 'Votre site', id: 'wms', label: 'WMS', type: 'seg', value: 0, options: ['Compatible', 'À adapter', 'À remplacer'] },
    { group: 'Votre site', id: 'days', label: 'Jours d’activité par an', type: 'range', min: 200, max: 360, step: 5, value: 250, unit: 'jours' },
  ],
  assumptions: [
    { id: 'cost', label: 'Coût horaire chargé d’un opérateur', value: 24, min: 12, max: 80, step: 1, unit: '€' },
    { id: 'red', label: 'Réduction des heures de manutention (base robots mobiles)', value: 40, min: 0, max: 80, step: 1, unit: '%' },
    { id: 'rate', label: 'Lignes par heure et par robot mobile', value: 70, min: 20, max: 200, step: 5, unit: 'lignes' },
    { id: 'manual', label: 'Productivité manuelle actuelle en préparation', value: 80, min: 20, max: 300, step: 5, unit: 'lignes par heure' },
    { id: 'maint', label: 'Maintenance et logiciels, systèmes fixes', value: 3, min: 1, max: 10, step: 0.5, unit: '% de l’investissement par an' },
    { id: 'err', label: 'Taux d’erreur actuel', value: 0.3, min: 0, max: 3, step: 0.1, unit: '%' },
  ],
  tiers: [
    { name: 'Robots mobiles de préparation', desc: 'Flotte modulable, installation rapide, extensible en pointe.', months: 6, redF: 1.0, picking: true },
    { name: 'Convoyeurs et tri', desc: 'Flux continus de colis, tri par destination ou par transporteur.', months: 12, redF: 1.0, picking: false },
    { name: 'Stockage automatisé en bacs', desc: 'La marchandise vient au préparateur, densité de stockage élevée.', months: 16, redF: 1.4, picking: true },
    { name: 'Transstockeurs palettes', desc: 'Stockage palettes en grande hauteur, entrées et sorties automatisées.', months: 21, redF: 1.2, picking: false },
  ],
  compute(i, a) {
    const t = i.tech; const T = this.tiers[t];
    const hours = 7.5 * (i.shifts + 1);
    let machines, integ, robots = 0;
    if (t === 0) {
      robots = Math.max(5, Math.ceil(i.volume / (hours * a.rate)));
      machines = robots * 18000;
      integ = 50000 + robots * 3000 + 30000 + robots * 2000;
    } else {
      machines = pick([0, 400000, 900000, 2000000], t) + i.volume * pick([0, 45, 110, 250], t);
      integ = machines * 0.15 + machines * 0.12;
    }
    const parts = [
      [t === 0 ? `Robots (${robots})` : 'Équipements', machines],
      [t === 0 ? 'Intégration, logiciels et informatique' : 'Intégration, ingénierie et WCS', integ],
      ['Adaptation du WMS', pick([20000, 60000, 150000], i.wms)],
      ['Bâtiment et infrastructures', machines * pick([0, 0.06, 0.03], i.building)],
      ['Pilotage et assistance projet', (machines + integ) * 0.05],
      ['Formation et montée en cadence', (machines + integ) * 0.03],
    ];
    // Les robots mobiles demandent plus de support logiciel et de maintenance que les systèmes fixes
    const maintRate = (a.maint / 100) * (t === 0 ? 2 : 1);
    const recurring = (machines + integ) * maintRate;
    const m = T.months + i.building * 3 + i.wms * 2 + (i.volume > 30000 ? 2 : 0);
    const red = Math.min(0.9, (a.red / 100) * T.redF);
    // Heures concernées : déduites du volume et de la productivité manuelle, plafonnées par l'effectif déclaré
    const hoursYear = Math.min(i.fte * HOURS_FTE, (i.volume / (a.manual * pick([1, 1.5, 1, 0.25], t))) * i.days);
    const gains = [['Heures de manutention économisées', hoursYear * red * a.cost]];
    if (T.picking) gains.push(['Erreurs de préparation évitées', i.volume * i.days * (a.err / 100) * 0.5 * 25]);
    const watch = ['Dimensionnez sur deux à trois ans d’historique et vos hypothèses de croissance, pas sur une seule année.',
      'Cybersécurité industrielle : séparez le réseau des automatismes du réseau bureautique et encadrez la télémaintenance.'];
    if (i.shifts === 0) watch.push('Une seule équipe : la machine tourne peu d’heures par jour, le retour sur investissement s’allonge. Comparez avec un scénario sans automatisation lourde.');
    if (i.wms === 2) watch.push('WMS à remplacer : changez d’abord le WMS, automatisez ensuite. Le remplacement du WMS n’est pas inclus dans ce chiffrage.');
    if (i.building === 1) watch.push('Travaux : faites auditer la planéité du sol, la hauteur, les sprinklers et l’alimentation électrique avant de consulter.');
    if (t >= 2) watch.push('Système fixe : exigez des performances garanties sur votre profil de commandes, un mode dégradé écrit et un stock de pièces détachées.');
    return {
      tier: T, parts, recurring, months: [m, m * 1.3], gains, watch,
      kpi: t === 0 ? ['Robots nécessaires', `${robots} robots`, `${Math.round(hours)} h d’activité par jour, ${a.rate} lignes par heure et par robot`] : null,
      recurringNote: `Maintenance et logiciels, ${(maintRate * 100).toLocaleString('fr-FR')} % de l’investissement par an`,
    };
  },
  sources: [
    ['Robot mobile, intégration et informatique', '18 k€ par robot, plus intégration et licences', '25 robots : 650 k€, dont 450 k€ de robots, 120 k€ d’intégration, 80 k€ de licences', 'Exemple publié par un intégrateur', '/guides/prix-automatisation-entrepot/'],
    ['Convoyeurs et tri', '400 k€ plus 45 € par unité quotidienne', '500 k€ à 3 M€', 'Guide Malaheim', '/guides/prix-automatisation-entrepot/'],
    ['Stockage automatisé en bacs', '900 k€ plus 110 € par unité quotidienne', '1 à 5 M€', 'Guide Malaheim', '/guides/prix-automatisation-entrepot/'],
    ['Retour sur investissement observé', 'Résultat du modèle', '11 à 28 mois sur cinq sites, les robots mobiles étant les plus rapides', 'Robotomated, études de cas 2026', 'https://robotomated.com/learn/warehouse/warehouse-automation-roi-case-study-2026'],
    ['Retour par taille de site', 'Résultat du modèle', '2 à 4 ans pour un site de taille moyenne', 'Conveyco 2026', 'https://www.conveyco.com/news/warehouse-automation-roi-by-facility-size-in-2026/'],
    ['Réduction des heures', '40 % en robots mobiles et convoyeurs, 56 % en stockage en bacs, 48 % en transstockeurs', 'Hypothèse prudente, modifiable', 'Retours de projets', ''],
    ['Maintenance et logiciels', '3 % par an pour les systèmes fixes, 6 % pour les robots mobiles', 'Hypothèse, à remplacer par les offres reçues', 'Retours de projets', ''],
  ],
};

// ---------------------------------------------------------------- OMS
const oms = {
  slug: 'oms', code: 'OMS', sw: 'oms', name: 'Gestion des commandes',
  title: 'Combien coûte un OMS pour vos canaux de vente ?',
  lead: 'Décrivez vos ventes et vos stocks en 7 questions. Vous obtenez le type de solution adapté, le budget d’intégration, l’abonnement et les ventes sauvées.',
  card: 'Intégration, abonnement et ventes sauvées', horizon: 5, ramp: 4,
  fields: [
    { group: 'Vos ventes', id: 'orders', label: 'Commandes par an', type: 'range', min: 5000, max: 5000000, step: 1000, value: 100000, unit: 'commandes', log: true },
    { group: 'Vos ventes', id: 'channels', label: 'Canaux de vente (site, places de marché, revendeurs)', type: 'range', min: 1, max: 15, step: 1, value: 4, unit: 'canaux' },
    { group: 'Vos ventes', id: 'basket', label: 'Panier moyen', type: 'range', min: 10, max: 2000, step: 5, value: 80, unit: '€', log: true },
    { group: 'Vos ventes', id: 'b2b', label: 'Clients', type: 'seg', value: 0, options: ['Particuliers', 'Particuliers et professionnels (EDI)'] },
    { group: 'Vos stocks', id: 'points', label: 'Points d’expédition (entrepôts, prestataires, magasins)', type: 'range', min: 1, max: 300, step: 1, value: 2, unit: 'points', log: true },
    { group: 'Vos stocks', id: 'sfs', label: 'Magasins', type: 'seg', value: 0, options: ['Pas d’expédition depuis les magasins', 'Expédition ou retrait en magasin'] },
    { group: 'Vos stocks', id: 'returns', label: 'Taux de retour', type: 'range', min: 0, max: 50, step: 1, value: 10, unit: '%' },
  ],
  assumptions: [
    { id: 'lost', label: 'Commandes perdues ou annulées pour rupture', value: 2, min: 0, max: 10, step: 0.5, unit: '%' },
    { id: 'save', label: 'Part de ces commandes sauvées par l’OMS', value: 50, min: 0, max: 100, step: 5, unit: '%' },
    { id: 'margin', label: 'Marge brute', value: 35, min: 5, max: 80, step: 1, unit: '%' },
    { id: 'contact', label: 'Commandes qui génèrent un contact « où est ma commande »', value: 8, min: 0, max: 30, step: 1, unit: '%' },
    { id: 'ccost', label: 'Coût d’un contact au service client', value: 5, min: 1, max: 20, step: 0.5, unit: '€' },
    { id: 'logi', label: 'Économie logistique par commande (meilleure affectation, moins d’envois fractionnés)', value: 0.2, min: 0, max: 2, step: 0.05, unit: '€' },
  ],
  tiers: [
    { name: 'Module commandes de la plateforme ou de l’ERP', desc: 'Un ou deux canaux, un entrepôt, règles simples.', months: 1.5 },
    { name: 'OMS SaaS pour marques en croissance', desc: 'Plusieurs canaux et stocks, orchestration paramétrable.', months: 4 },
    { name: 'OMS de grande entreprise', desc: 'Magasins, entrepôts, prestataires, international, très gros volumes.', months: 8 },
  ],
  compute(i, a) {
    const s = (i.channels > 2 ? 1 : 0) + (i.points > 1 ? 1 : 0) + (i.orders > 300000 ? 1 : 0) + (i.orders > 1500000 ? 1 : 0) + i.sfs + (i.points > 20 ? 1 : 0);
    const t = s === 0 ? 0 : s <= 3 ? 1 : 2;
    const T = this.tiers[t];
    const base = [
      ['Connecteurs de vente', i.channels * pick([1500, 6000, 12000], t) + i.b2b * pick([5000, 15000, 30000], t)],
      ['Connecteurs logistiques', Math.min(i.points, 10) * pick([1500, 5000, 9000], t) + (i.points > 10 ? 15000 : 0) + i.sfs * pick([0, 40000, 80000], t)],
      ['Règles d’orchestration et paramétrage', pick([3000, 25000, 70000], t) * (1 + 0.1 * (i.channels - 1))],
      ['Interface finance et paiements', pick([2000, 10000, 25000], t)],
      ['Tests de charge et recette', pick([1000, 10000, 30000], t)],
    ];
    const parts = [...base, ['Pilotage du projet', sum(base) * 0.12]];
    const recurring = t === 0 ? 1200 + i.orders * 0.01 : t === 1 ? 15000 + i.orders * 0.08 + i.channels * 1200 : 60000 + i.orders * 0.12 + i.points * 250;
    const m = T.months + i.channels * 0.3 + i.sfs * 2 + i.b2b;
    const gains = [
      ['Ventes sauvées (marge)', i.orders * (a.lost / 100) * (a.save / 100) * i.basket * (a.margin / 100)],
      ['Contacts au service client évités', i.orders * (a.contact / 100) * 0.4 * a.ccost],
      ['Coûts logistiques optimisés', i.orders * a.logi * (t === 0 ? 0.3 : 1)],
    ];
    const watch = ['Définissez la règle de stock disponible à la vente (réservations, stock de sécurité par canal) avant de choisir l’outil.'];
    if (i.sfs) watch.push('Expédition depuis les magasins : la promesse ne sera juste que si le stock magasin est fiable.');
    if (i.returns > 15) watch.push('Taux de retour élevé : faites démontrer la gestion des retours et des remboursements de bout en bout.');
    if (i.orders > 1000000) watch.push('Volumes élevés : exigez un test de charge à deux fois votre pointe avant chaque grande opération commerciale.');
    if (i.channels > 5) watch.push('Plus de 5 canaux : démarrez avec ceux qui pèsent le plus, puis ajoutez les autres par vagues.');
    return {
      tier: T, parts, recurring, months: [m, m * 1.4], gains, watch,
      recurringNote: t === 0 ? 'Option ou extension de la plateforme' : 'Abonnement au volume de commandes et de canaux',
    };
  },
  sources: [
    ['Prix des OMS', 'Modèle au volume, par gamme', 'Rarement publiés, abonnement au volume le plus souvent', 'Guide Malaheim', '/guides/prix-oms/'],
    ['Durée de mise en œuvre, grande entreprise', '8 mois et plus', 'Environ 5 mois en moyenne selon les avis d’utilisateurs', 'G2, Salesforce Order Management', 'https://www.g2.com/products/salesforce-order-management/pricing'],
    ['Critère de choix principal', 'Coût total sur 5 ans affiché', 'Le coût total de possession est le premier critère du marché intermédiaire', 'Perficient', 'https://blogs.perficient.com/2024/05/22/new-perficient-research-reveals-mid-market-priorities-for-order-management-selection'],
    ['Ventes et contacts évités', '2 % de commandes perdues, moitié sauvée ; 8 % de contacts, 40 % évités', 'Hypothèses prudentes, modifiables', 'Retours de projets', ''],
  ],
};

// ---------------------------------------------------------------- S&OP et planification
const sop = {
  slug: 'planification', code: 'S&OP', sw: 'sop-planification', name: 'Planification et S&OP',
  title: 'Quel outil de planification, pour quel gain sur vos stocks ?',
  lead: 'Décrivez votre portefeuille et votre organisation en 6 questions. Vous obtenez le niveau d’outillage adapté, le budget, et le stock que vous pouvez libérer.',
  card: 'Niveau d’outil et stock libéré', horizon: 5, ramp: 6,
  fields: [
    { group: 'Votre portefeuille', id: 'refs', label: 'Références actives', type: 'range', min: 50, max: 200000, step: 50, value: 3000, unit: 'références', log: true },
    { group: 'Votre portefeuille', id: 'sites', label: 'Sites à planifier (usines, entrepôts)', type: 'range', min: 1, max: 30, step: 1, value: 2, unit: 'site(s)' },
    { group: 'Votre portefeuille', id: 'stock', label: 'Valeur du stock', type: 'range', min: 100, max: 300000, step: 50, value: 3000, unit: 'k€', log: true },
    { group: 'Votre organisation', id: 'scope', label: 'Ambition', type: 'seg', value: 0, options: ['Prévision et réapprovisionnement', 'Avec capacités de production', 'S&OP complet, finance et scénarios'] },
    { group: 'Votre organisation', id: 'planners', label: 'Planificateurs et approvisionneurs', type: 'range', min: 1, max: 50, step: 1, value: 3, unit: 'personnes' },
    { group: 'Votre organisation', id: 'service', label: 'Taux de service actuel', type: 'seg', value: 1, options: ['Moins de 90 %', '90 à 95 %', 'Plus de 95 %'] },
  ],
  assumptions: [
    { id: 'red', label: 'Réduction de stock atteignable avec un outil spécialisé', value: 8, min: 0, max: 30, step: 1, unit: '%' },
    { id: 'carry', label: 'Coût annuel de possession du stock', value: 20, min: 5, max: 35, step: 1, unit: '% de sa valeur' },
    { id: 'prod', label: 'Temps de planification économisé', value: 20, min: 0, max: 60, step: 1, unit: '%' },
    { id: 'cost', label: 'Coût horaire chargé d’un planificateur', value: 40, min: 20, max: 100, step: 1, unit: '€' },
  ],
  tiers: [
    { name: 'Tableur structuré et processus S&OP', desc: 'Un cycle mensuel discipliné, sans logiciel dédié.', months: 2, redF: 0.5, prodF: 0.3 },
    { name: 'Module de planification de l’ERP', desc: 'Calcul des besoins et réapprovisionnement dans l’ERP existant.', months: 4, redF: 0.75, prodF: 0.6 },
    { name: 'Outil spécialisé de prévision et de réapprovisionnement', desc: 'Prévision statistique, politiques de stock, alertes.', months: 5, redF: 1, prodF: 1 },
    { name: 'Plateforme de planification avancée', desc: 'Demande, capacités, finance et scénarios sur plusieurs sites.', months: 9, redF: 1.2, prodF: 1 },
  ],
  compute(i, a) {
    const s = (i.refs > 1000 ? 1 : 0) + (i.refs > 20000 ? 1 : 0) + (i.sites > 3 ? 1 : 0) + i.scope;
    const t = s === 0 ? 0 : s === 1 ? 1 : s <= 3 ? 2 : 3;
    const T = this.tiers[t];
    const lic = pick([0, 4000 + i.planners * 600, 24000 + i.refs * 1.0 + i.sites * 2000, 60000 + i.refs * 2.5 + i.sites * 6000], t);
    const base = [
      ['Construction et paramétrage', pick([12000, 20000, lic * 1.5, lic * 2.2], t)],
      ['Connexion à l’ERP et nettoyage de l’historique', pick([3000, 8000, 20000, 50000], t) * (1 + i.sites * 0.05)],
      ['Modélisation des capacités', i.scope >= 1 ? pick([3000, 10000, 25000, 60000], t) : 0],
      ['Formation et animation des premiers cycles', pick([6000, 8000, 15000, 30000], t) + i.planners * 800],
    ];
    const parts = [...base.filter((p) => p[1] > 0), ['Pilotage du projet', sum(base) * 0.10]];
    const m = T.months + i.scope * 1.5 + i.sites / 10;
    const stock = i.stock * 1000;
    const red = (a.red / 100) * T.redF;
    const gains = [
      ['Coût de possession du stock évité', stock * red * (a.carry / 100)],
      ['Temps des planificateurs', i.planners * HOURS_FTE * a.cost * (a.prod / 100) * T.prodF],
    ];
    const watch = ['Un outil ne remplace pas le rendez-vous mensuel de décision : nommez un sponsor en direction générale qui le préside.'];
    if (t <= 1) watch.push('Faites tourner trois à six cycles S&OP avant d’acheter un outil : votre cahier des charges sera bien meilleur.');
    if (i.service === 0) watch.push('Taux de service sous 90 % : fiabilisez d’abord les délais fournisseurs et les données de stock.');
    if (t >= 2) watch.push('Exigez un test de prévision à l’aveugle sur votre historique, comparé à votre méthode actuelle.');
    if (i.scope >= 1) watch.push('Capacités : modélisez les goulets d’étranglement réels, pas la capacité théorique des lignes.');
    return {
      tier: T, parts, recurring: lic, months: [m, m * 1.4], gains, watch,
      oneOff: ['Trésorerie libérée par la baisse du stock', stock * red],
      recurringNote: t === 0 ? 'Pas de licence, le temps d’animation reste interne' : 'Licence annuelle',
    };
  },
  sources: [
    ['Outil spécialisé', '24 k€ par an plus volume', 'Certaines solutions démarrent autour de 3 000 $ par mois', 'SelectHub', 'https://www.selecthub.com/c/supply-chain-planning-software/'],
    ['Plateforme avancée', '60 k€ par an et plus', 'Certaines plateformes de grands éditeurs démarrent autour de 29 000 $ par an', 'SelectHub', 'https://www.selecthub.com/c/supply-chain-planning-software/'],
    ['Déploiement', '1,5 à 2,2 fois la licence annuelle', '1,5 à 3 fois le coût annuel de licence', 'Deloitte, cité par Monetizely', 'https://www.getmonetizely.com/articles/how-do-enterprise-scm-and-planning-platforms-set-their-pricing-a-procurement-guide'],
    ['Réduction de stock', '8 % avec un outil spécialisé, pondérée par niveau', 'Hypothèse prudente, modifiable', 'Retours de projets', ''],
  ],
};

// ---------------------------------------------------------------- Données
const data = {
  slug: 'donnees', code: 'DATA', sw: 'donnees-pilotage', name: 'Données et pilotage',
  title: 'Combien coûte un projet de données, et combien coûtent vos données fausses ?',
  lead: 'Choisissez votre projet et décrivez vos données en 6 questions. Vous obtenez le budget, la durée et le coût des erreurs que vous pouvez éviter.',
  card: 'Budget et coût des données fausses', horizon: 5, ramp: 4,
  fields: [
    { group: 'Votre projet', id: 'type', label: 'Projet', type: 'seg', value: 0, options: ['Fiabiliser les données articles', 'Tableaux de bord partagés', 'Référentiel de données (MDM ou PIM)', 'Tour de contrôle'] },
    { group: 'Vos données', id: 'records', label: 'Fiches articles actives', type: 'range', min: 500, max: 500000, step: 500, value: 10000, unit: 'fiches', log: true },
    { group: 'Vos données', id: 'sources', label: 'Systèmes sources (ERP, WMS, TMS, fichiers)', type: 'range', min: 1, max: 30, step: 1, value: 3, unit: 'systèmes' },
    { group: 'Vos données', id: 'quality', label: 'Qualité actuelle des données', type: 'seg', value: 1, options: ['Bonne', 'Moyenne', 'Faible'] },
    { group: 'Votre organisation', id: 'sites', label: 'Sites concernés', type: 'range', min: 1, max: 50, step: 1, value: 2, unit: 'site(s)' },
    { group: 'Votre organisation', id: 'users', label: 'Utilisateurs des données et indicateurs', type: 'range', min: 5, max: 2000, step: 5, value: 40, unit: 'personnes', log: true },
  ],
  assumptions: [
    { id: 'hours', label: 'Temps passé à chercher ou réconcilier les chiffres', value: 1, min: 0, max: 8, step: 0.5, unit: 'h par personne et par semaine' },
    { id: 'cost', label: 'Coût horaire chargé moyen', value: 40, min: 20, max: 100, step: 1, unit: '€' },
    { id: 'inc', label: 'Coût moyen d’un incident dû à une donnée fausse', value: 100, min: 20, max: 1000, step: 10, unit: '€' },
    { id: 'min', label: 'Temps de correction d’une fiche', value: 6, min: 1, max: 30, step: 1, unit: 'minutes' },
  ],
  tiers: [
    { name: 'Chantier de fiabilisation des données articles', desc: 'Périmètre actif, champs logistiques, règles de création et suivi mensuel.', months: 2 },
    { name: 'Tableaux de bord supply chain partagés', desc: 'Une définition par indicateur, une source unique, des actions suivies.', months: 2.5 },
    { name: 'Référentiel de données de référence', desc: 'Fiches uniques, circuits de validation, diffusion vers tous les systèmes.', months: 6 },
    { name: 'Tour de contrôle', desc: 'Visibilité de bout en bout, alertes, pilotage multi-sites.', months: 9 },
  ],
  compute(i, a) {
    const t = i.type; const T = this.tiers[t];
    const bad = i.records * pick([0.15, 0.35, 0.6], i.quality);
    const cleaning = bad * (a.min / 60) * a.cost + (i.records > 20000 ? 25000 : 0);
    let base, recurring, note;
    if (t === 0) {
      base = [['Cadrage et règles de qualité', 8000 + i.sources * 1500], ['Correction et mesures des fiches', cleaning], ['Tableau de bord de qualité', 5000]];
      recurring = 4000 + i.records * 0.05; note = 'Suivi mensuel de la qualité';
    } else if (t === 1) {
      base = [['Connexion des sources', 15000 + i.sources * 6000], ['Couche sémantique et indicateurs', 8000 + i.sites * 1000], ['Formation des utilisateurs', 3000 + i.users * 30]];
      recurring = i.users * 120 + 3000; note = 'Licences de l’outil de tableaux de bord et hébergement';
    } else if (t === 2) {
      const lic = 30000 + i.records * 0.25 + i.sources * 1500;
      base = [['Mise en œuvre du référentiel', lic * 1.8 + i.sources * 10000], ['Nettoyage initial', cleaning * 0.7], ['Gouvernance et formation', 15000]];
      recurring = lic; note = 'Licence annuelle du référentiel';
    } else {
      base = [['Mise en œuvre de la tour de contrôle', 120000 + i.sources * 20000 + i.sites * 5000], ['Données et intégrations', 30000 + cleaning * 0.3], ['Formation et organisation', 15000 + i.users * 40]];
      recurring = 60000 + i.sites * 3000 + i.users * 100; note = 'Licence annuelle de la plateforme';
    }
    const parts = [...base, ['Pilotage du projet', sum(base) * 0.10]];
    const m = pick([2 + i.records / 50000, 2.5 + i.sources * 0.3, 6 + i.sources * 0.4, 9 + i.sources * 0.5 + i.sites * 0.05], t);
    const incidents = i.records * pick([0.02, 0.06, 0.12], i.quality);
    const gains = [
      ['Temps de recherche et de réconciliation', i.users * a.hours * 46 * a.cost * pick([0.3, 0.5, 0.4, 0.6], t)],
      ['Incidents évités', incidents * a.inc * pick([0.6, 0.1, 0.5, 0.3], t)],
    ];
    const watch = ['Nommez un responsable par domaine de données (articles, clients, fournisseurs), avec du temps réservé chaque semaine.'];
    if (i.quality === 2 && t >= 1) watch.push('Qualité faible : commencez par un chantier de fiabilisation ciblé, sinon le nouvel outil diffusera des données fausses.');
    if (i.sources > 8) watch.push('Plus de 8 systèmes sources : une plateforme d’intégration ou un référentiel devient indispensable.');
    if (t === 3) watch.push('Tour de contrôle : définissez d’abord 5 à 10 indicateurs, leurs définitions et leurs responsables.');
    if (t === 0) watch.push('Limitez le périmètre aux articles actifs des douze derniers mois et corrigez à la source, jamais dans un fichier à côté.');
    return { tier: T, parts, recurring, months: [m, m * 1.4], gains, watch, recurringNote: note, kpi: ['Fiches probablement à corriger', `${Math.round(bad).toLocaleString('fr-FR')} fiches`, `Sur ${i.records.toLocaleString('fr-FR')} fiches actives`] };
  },
  sources: [
    ['Logiciel de données produits', '30 k€ par an plus volume', 'Offres de gestion des informations produit à partir d’environ 45 000 $ par an', 'G2', 'https://www.g2.com/products/triniti-master-data-management/pricing'],
    ['Grands éditeurs de données de référence', 'Hors périmètre du modèle', '200 000 $ à plus de 2 millions par contrat', 'ERP Research', 'https://erpresearch.com/erp-add-ons/mdm/informatica-mdm/pricing'],
    ['Mise en œuvre d’un référentiel', '1,8 fois la licence plus les sources', '1,5 à 3 fois la licence', 'Monetizely', 'https://www.getmonetizely.com/articles/procurement-guide-how-master-data-management-mdm-platforms-are-priced-for-enterprises'],
    ['Temps perdu et incidents', '1 h par semaine et par utilisateur, 100 € par incident', 'Hypothèses prudentes, modifiables', 'Retours de projets', ''],
  ],
};

export const SIMS = { wms, tms, erp, automatisation: auto, oms, planification: sop, donnees: data };
export const SIM_LIST = [wms, tms, erp, auto, oms, sop, data];

// ---------------------------------------------------------------- Moteur commun
export function defaults(model) {
  const i = {}; const a = {};
  model.fields.forEach((f) => { i[f.id] = f.value; });
  model.assumptions.forEach((f) => { a[f.id] = f.value; });
  return { i, a };
}

export function simulate(model, i, a) {
  const r = model.compute(i, a);
  const initial = sum(r.parts);
  const gainsTotal = sum(r.gains);
  const H = model.horizon * 12;
  const M = Math.max(1, Math.round((r.months[0] + r.months[1]) / 2));
  const ramp = model.ramp || 6;
  const cumCost = []; const cumGain = [];
  let c = 0; let g = 0; let breakEven = null;
  for (let m = 1; m <= H; m++) {
    if (m <= M) c += initial / M;
    if (m > M) {
      c += r.recurring / 12;
      const f = Math.min(1, (m - M) / ramp);
      g += (gainsTotal / 12) * f;
    }
    cumCost.push(c); cumGain.push(g);
    if (breakEven === null && m > M && g >= c) breakEven = m;
  }
  const total = cumCost[H - 1];
  const roi = total > 0 ? (cumGain[H - 1] - total) / total : 0;
  const netAnnual = gainsTotal - r.recurring;
  const watch = [...r.watch];
  if (breakEven === null) watch.unshift(`Avec ces hypothèses, les gains mesurables ne couvrent pas les coûts sur ${model.horizon} ans. Le projet peut rester justifié (conformité, croissance, maîtrise du risque), mais il doit s’appuyer sur d’autres arguments, ou sur une solution plus légère.`);
  return {
    ...r, watch, initial, low: initial * 0.8, high: initial * 1.3, gainsTotal, netAnnual,
    goLive: M, breakEven, roi, total, cumCost, cumGain, horizon: model.horizon,
  };
}

export const money = (v) => {
  const n = Math.max(0, v);
  if (n >= 1e6) return (Math.round(n / 1e5) / 10).toLocaleString('fr-FR') + ' M€';
  if (n >= 1e4) return Math.round(n / 1000).toLocaleString('fr-FR') + ' k€';
  if (n >= 1000) return (Math.round(n / 100) / 10).toLocaleString('fr-FR') + ' k€';
  return Math.round(n).toLocaleString('fr-FR') + ' €';
};
