// Reglages du site. Remplir les liens au fur et a mesure de l'ouverture des comptes.
export const SITE = {
  name: 'Malaheim',
  company: 'MALAHEIM Consulting',
  tagline: 'Le bon logiciel supply chain, choisi sur des chiffres',
  author: 'Robin Thomas-Le Déoré',
  url: 'https://www.malaheim.com',
  // Lien de paiement Lemon Squeezy du kit (vide tant que la SASU n'est pas immatriculée).
  kitCheckoutUrl: '',
  // Lien de reservation Cal.com pour l'appel de 30 minutes.
  bookingUrl: '',
  // Adresse d'action du formulaire Brevo (copiee depuis le formulaire cree dans Brevo).
  brevoFormAction: '',
  // Adresse e-mail de contact affichee sur le site.
  contactEmail: '[adresse e-mail de contact]',
  kitName: 'Kit Consultation WMS',
  kitPrice: '349 € HT',
  kitEssentialPrice: '149 € HT',
  kitBundlePrice: '990 € HT',
  kitFrom: 'Dès 149 € HT',
  reviewPrice: '690 € HT',
};

// Les logiciels couverts. status : 'complet' (outils et kit disponibles) ou 'guide' (guide de choix et accompagnement).
export const SOFTWARE = [
  {
    slug: 'wms', code: 'WMS', name: "Gestion d'entrepôt", long: "WMS, logiciel de gestion d'entrepôt",
    problem: "Mon stock n'est pas fiable et les erreurs de préparation se multiplient",
    does: 'Pilote la réception, le stockage, la préparation et l’expédition en entrepôt',
    budget: '60 k€ à plus de 1 M€', delay: '4 à 24 mois', status: 'complet',
  },
  {
    slug: 'tms', code: 'TMS', name: 'Gestion du transport', long: 'TMS, logiciel de gestion du transport',
    problem: 'Mes coûts de transport dérapent et l’affrètement se gère au téléphone',
    does: 'Choisit les transporteurs, planifie, suit les expéditions et contrôle la facturation transport',
    budget: 'De 1 000 € à plus de 250 k€ par an', delay: 'Quelques semaines à 18 mois', status: 'guide',
  },
  {
    slug: 'erp', code: 'ERP', name: 'ERP et gestion commerciale', long: 'ERP, progiciel de gestion intégré',
    problem: 'Mon outil de gestion ne suit plus : achats, ventes, stocks et comptabilité ne se parlent pas',
    does: 'Centralise ventes, achats, stocks, production et comptabilité',
    budget: '20 k€ à 250 k€ d’intégration', delay: '3 à 18 mois', status: 'guide',
  },
  {
    slug: 'automatisation-wcs', code: 'WCS', name: 'Automatisation et robotique', long: "Automatisation d'entrepôt et WCS",
    problem: 'Mes volumes saturent l’entrepôt et je manque de bras en pic',
    does: 'Pilote convoyeurs, trieurs, navettes et robots mobiles, sous les ordres du WMS',
    budget: 'Quelques centaines de k€ à plusieurs M€', delay: '9 à 24 mois', status: 'guide',
  },
  {
    slug: 'oms', code: 'OMS', name: 'Gestion des commandes omnicanal', long: 'OMS, logiciel de gestion des commandes',
    problem: 'Je vends sur plusieurs canaux et je promets mal les délais ou le stock disponible',
    does: 'Centralise les commandes de tous les canaux et choisit d’où servir chacune',
    budget: 'Sur devis, abonnement le plus souvent', delay: '6 semaines à 12 mois', status: 'guide',
  },
  {
    slug: 'planification-aps', code: 'APS', name: 'Planification', long: 'APS, logiciel de planification avancée',
    problem: 'Je subis à la fois des ruptures et des surstocks',
    does: 'Prévoit la demande, calcule les besoins et planifie la production sous contraintes',
    budget: 'Sur devis, intégration souvent supérieure à l’abonnement', delay: '4 à 12 mois', status: 'guide',
  },
];

export const GUIDES = [
  { slug: 'prix-wms', title: 'Combien coûte un WMS ?', figure: '60 k€ à plus de 1 M€', summary: "Les fourchettes par taille d'entrepôt et les six postes d'un budget." },
  { slug: 'etapes-projet-wms', title: "Les 7 étapes d'un projet WMS", figure: '4 à 24 mois', summary: 'Du cadrage au démarrage, avec la durée et le livrable de chaque étape.' },
  { slug: 'erreurs-projet-wms', title: 'Les 8 erreurs qui font déraper un projet', figure: '4 sur 8', summary: 'La moitié se commettent avant même la signature du contrat.' },
  { slug: 'wms-pme-eti', title: 'Quel WMS selon la taille de votre entreprise', figure: '3 gammes, 4 critères', summary: 'Opérateurs, lignes par jour, processus, mécanisation : trouvez votre gamme.' },
  { slug: 'wms-saas-ou-licence', title: 'WMS en SaaS ou en licence : comment trancher', figure: 'Équilibre vers 5 ans', summary: "La comparaison chiffrée sur un cas type et les questions à poser à l'éditeur." },
];
