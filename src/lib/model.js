// Modele de chiffrage WMS, partage par l'accueil et le simulateur.

export const TIERS = [
  {name:'WMS SaaS standard', desc:'Solution légère, paramétrage rapide, très peu de spécifique.', sub:70, lic:1500, integ:25000, months:4, server:15000, amoa:0.10, itf:1.0},
  {name:'WMS milieu de gamme', desc:'Progiciel paramétrable, intégrateur dédié, quelques adaptations.', sub:120, lic:3000, integ:70000, months:8, server:30000, amoa:0.15, itf:1.6},
  {name:'WMS avancé', desc:'Solution de premier rang, pilotage fin des ressources et de la mécanisation.', sub:170, lic:4500, integ:300000, months:14, server:60000, amoa:0.15, itf:3.0}
];
const ERP_COST = [10000, 25000, 45000];
const MECH_COST = [0, 20000, 80000];
const CX_FACTOR = [1, 1.3, 1.7];

export function compute(i){
  const s = (i.ops<=15?0:i.ops<=60?1:2) + (i.lines<=2000?0:i.lines<=10000?1:2) + i.cx + i.mech;
  const t = s<=1?0:s<=4?1:2;
  const T = TIERS[t];
  const integ = T.integ * CX_FACTOR[i.cx] * (1 + 0.5*(i.sites-1));
  const itf = ERP_COST[i.erp]*T.itf + MECH_COST[i.mech];
  const hw = i.ops*1500 + i.surface*0.8 + i.sites*2500;
  const chg = integ*0.12 + i.ops*250;
  const amoa = (integ+itf)*T.amoa;
  const lic = i.mode===1 ? i.ops*T.lic + T.server : 0;
  const parts = [
    ['Intégration et paramétrage', integ],
    ['Interfaces ERP et équipements', itf],
    ['Terminaux, réseau, impression', hw],
    ['Formation et conduite du changement', chg],
    ['Pilotage et assistance projet', amoa]
  ];
  if(lic>0) parts.unshift(['Licences et serveurs', lic]);
  const initial = parts.reduce((a,p)=>a+p[1],0);
  const recurring = i.mode===1 ? i.ops*T.lic*0.20 : i.ops*T.sub*12;
  const months = T.months + i.cx + i.erp + [0,1,3][i.mech] + (i.sites-1)*1.5;
  const gProd = i.ops*1607*i.cost*(i.prod/100);
  const gErr = i.lines*250*(i.err/100)*0.6*i.errcost;
  const gains = gProd+gErr;
  const net = gains-recurring;
  const payback = net>0 ? initial/net*12 : null;
  const tco5 = initial + 5*recurring;
  const roi5 = (5*gains - tco5)/tco5;
  return {tier:t, parts, initial, recurring, months, gProd, gErr, gains, payback, tco5, roi5};
}
