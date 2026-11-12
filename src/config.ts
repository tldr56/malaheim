// Reglages du site. Remplir les liens au fur et a mesure de l'ouverture des comptes.
export const SITE = {
  name: 'Décision Entrepôt',
  author: 'Robin Thomas-Le Déoré',
  // Lien de paiement Lemon Squeezy du kit (vide tant que la SASU n'est pas immatriculée).
  kitCheckoutUrl: '',
  // Lien de reservation Cal.com pour l'appel de 30 minutes.
  bookingUrl: '',
  // Adresse d'action du formulaire Brevo (copiee depuis le formulaire cree dans Brevo).
  brevoFormAction: '',
  // Adresse e-mail de contact affichee sur le site.
  contactEmail: '[adresse e-mail de contact]',
  kitPrice: '99 € HT',
  reviewPrice: '690 € HT',
};

export const GUIDES = [
  { slug: 'prix-wms', title: 'Combien coûte un WMS ?', figure: '60 k€ à plus de 1 M€', summary: "Les fourchettes par taille d'entrepôt et les six postes d'un budget." },
  { slug: 'etapes-projet-wms', title: "Les 7 étapes d'un projet WMS", figure: '4 à 24 mois', summary: 'Du cadrage au démarrage, avec la durée et le livrable de chaque étape.' },
  { slug: 'erreurs-projet-wms', title: 'Les 8 erreurs qui font déraper un projet', figure: '4 sur 8', summary: 'La moitié se commettent avant même la signature du contrat.' },
  { slug: 'wms-pme-eti', title: 'Quel WMS selon la taille de votre entreprise', figure: '3 gammes, 4 critères', summary: 'Opérateurs, lignes par jour, processus, mécanisation : trouvez votre gamme.' },
  { slug: 'wms-saas-ou-licence', title: 'WMS en SaaS ou en licence : comment trancher', figure: 'Équilibre vers 5 ans', summary: "La comparaison chiffrée sur un cas type et les questions à poser à l'éditeur." },
];
