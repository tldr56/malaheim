/**
 * Collecte des contacts des simulateurs Malaheim dans une Google Sheet.
 *
 * Installation (une seule fois) :
 * 1. Créer une Google Sheet vide, par exemple « Malaheim, contacts des simulateurs ».
 * 2. Extensions, Apps Script. Remplacer tout le contenu par ce fichier.
 * 3. Remplacer JETON ci-dessous par une longue suite de caractères au hasard (la même que le secret LEADS_TOKEN du Worker).
 * 4. Déployer, Nouveau déploiement, type Application Web. Exécuter en tant que : moi. Accès : tout le monde.
 * 5. Autoriser l'accès demandé par Google, puis copier l'adresse de l'application Web (elle finit par /exec).
 * 6. Dans Cloudflare, Worker malaheim, Settings, Variables and Secrets : ajouter deux secrets,
 *    LEADS_URL (l'adresse /exec) et LEADS_TOKEN (le jeton).
 * Après toute modification de ce script : Déployer, Gérer les déploiements, modifier, Nouvelle version.
 */

const JETON = 'REMPLACER_PAR_LE_MEME_JETON_QUE_LEADS_TOKEN';
const NOTIFIER = 'contact@malaheim.com'; // reçoit un e-mail à chaque inscription
const ENVOYER_RECAP = true; // envoie au visiteur le récapitulatif de sa simulation

const ONGLETS = {
  unlock: ['Contacts', ['Date', 'Nom', 'E-mail', 'Entreprise', 'Fonction', 'Téléphone', 'Nouveautés', 'Adresse gratuite', 'Simulateur', 'Solution', 'Budget', 'Verdict', 'Pays', 'Lien', 'Résumé']],
  usage: ['Utilisation', ['Date', 'E-mail', 'Nom', 'Entreprise', 'Simulateur', 'Événement', 'Solution', 'Budget', 'Verdict', 'Lien']],
  achat: ['Ventes', ['Date', 'Référence', 'E-mail', 'Nom', 'Entreprise', 'Dossier', 'Montant TTC', 'Lien du dossier', 'Session Stripe']],
};

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const d = JSON.parse(e.postData.contents);
    if (d.token !== JETON) return sortie({ ok: false });
    const [nom, entetes] = ONGLETS[ONGLETS[d.type] ? d.type : 'unlock'];
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sh = ss.getSheetByName(nom) || ss.insertSheet(nom);
    if (sh.getLastRow() === 0) { sh.appendRow(entetes); sh.setFrozenRows(1); sh.getRange(1, 1, 1, entetes.length).setFontWeight('bold'); }
    const date = new Date(d.date || Date.now());
    if (d.type === 'achat') {
      // Le Worker signale la vente à chaque ouverture du dossier : on n'enregistre qu'une fois par session
      const deja = sh.getLastRow() > 1 && sh.getRange(2, 9, sh.getLastRow() - 1, 1).getValues().some((r) => r[0] === d.session);
      if (deja) return sortie({ ok: true });
      sh.appendRow([date, d.ref, d.email, d.name, d.company, d.code, d.amount, d.link, d.session].map(texte));
      MailApp.sendEmail({ to: NOTIFIER, subject: `Vente : dossier ${d.code}, ${d.company || d.email}`, body: `${d.name}\n${d.email}\n${d.company}\nMontant : ${d.amount} € TTC\nRéférence : ${d.ref}\n${d.link}` });
      if (d.email) MailApp.sendEmail({
        to: d.email, replyTo: NOTIFIER, name: 'MALAHEIM Consulting',
        subject: `Votre dossier de décision ${d.code}, référence ${d.ref}`,
        body: `Bonjour,\n\nMerci pour votre achat. Votre dossier de décision reste accessible à tout moment à ce lien personnel :\n${d.link}\n\nVous pouvez le télécharger en PDF et récupérer le modèle de calcul Excel depuis cette page.\n\nCe montant est déduit du kit de consultation : indiquez la référence ${d.ref} lors de votre commande.\n\nPour toute question, répondez simplement à cet e-mail.\n\nMALAHEIM Consulting\nhttps://www.malaheim.com`,
      });
      return sortie({ ok: true });
    }
    if (d.type === 'usage') {
      sh.appendRow([date, d.email, d.name, d.company, d.code, d.event, d.tier, d.budget, d.verdict, d.link].map(texte));
      return sortie({ ok: true });
    }
    sh.appendRow([date, d.name, d.email, d.company, d.role, d.phone, d.optin ? 'oui' : 'non', d.freeEmail ? 'oui' : 'non', d.code, d.tier, d.budget, d.verdict, d.country, d.link, d.summary].map(texte));
    MailApp.sendEmail({
      to: NOTIFIER,
      subject: `Nouveau contact simulateur ${d.code} : ${d.company} (${d.role})`,
      body: `${d.name}\n${d.email}${d.phone ? `\n${d.phone}` : ''}\n${d.company}, ${d.role}\nNouveautés : ${d.optin ? 'oui' : 'non'}\n\n${d.summary}`,
    });
    let mailed = false;
    if (ENVOYER_RECAP) {
      MailApp.sendEmail({
        to: d.email, replyTo: NOTIFIER, name: 'MALAHEIM Consulting',
        subject: `Votre simulation ${d.code}`,
        body: `Bonjour,\n\nVoici le récapitulatif de votre simulation. Le lien en bas rouvre la simulation avec vos réponses.\n\n${d.summary}\n\nPour passer de l’estimation au projet, répondez simplement à cet e-mail.\n\nMALAHEIM Consulting\nhttps://www.malaheim.com\n\nVous recevez cet e-mail parce que vous avez débloqué un simulateur sur malaheim.com. Pour ne plus être recontacté, répondez « stop ».`,
      });
      mailed = true;
    }
    return sortie({ ok: true, mailed });
  } catch (err) {
    return sortie({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Une cellule qui commence par =, +, - ou @ serait lue comme une formule : on la neutralise.
function texte(v) {
  if (v instanceof Date) return v;
  const s = v == null ? '' : String(v);
  return /^[=+\-@]/.test(s) ? `'${s}` : s;
}

function sortie(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
