// La monnaie d'une boutique, côté serveur — la même règle que
// currencyForCountry (src/lib/currency.js) : celle du pays de la boutique,
// et USD quand le pays est inconnu (un aveu d'ignorance, jamais le FCFA par
// défaut ; CLAUDE.md §1). Copie de PAYS_MONNAIE (src/lib/monnaies-donnees.js,
// généré depuis Unicode CLDR) : les fonctions edge ne lisent pas src/.
// monnaie-boutique.test.ts vérifie que les deux listes restent identiques.
//
// Pourquoi (06/10) : les outils vendeuse de Finia prenaient un « prix en
// FCFA ». Une vendeuse à Londres qui dit « 25 livres » créait un article à
// 25 FCFA. Le prix se dit maintenant dans la monnaie de SA boutique (§2).

export const PAYS_MONNAIE: Record<string, string> = Object.fromEntries(
  'AC:SHP,AD:EUR,AE:AED,AF:AFN,AG:XCD,AI:XCD,AL:ALL,AM:AMD,AO:AOA,AR:ARS,AS:USD,AT:EUR,AU:AUD,AW:AWG,AX:EUR,AZ:AZN,BA:BAM,BB:BBD,BD:BDT,BE:EUR,BF:FCFA,BG:EUR,BH:BHD,BI:BIF,BJ:FCFA,BL:EUR,BM:BMD,BN:BND,BO:BOB,BQ:USD,BR:BRL,BS:BSD,BT:BTN,BV:NOK,BW:BWP,BY:BYN,BZ:BZD,CA:CAD,CC:AUD,CD:CDF,CF:FCFA,CG:FCFA,CH:CHF,CI:FCFA,CK:NZD,CL:CLP,CM:FCFA,CN:CNY,CO:COP,CR:CRC,CU:CUP,CV:CVE,CW:XCG,CX:AUD,CY:EUR,CZ:CZK,DE:EUR,DG:USD,DJ:DJF,DK:DKK,DM:XCD,DO:DOP,DZ:DZD,EA:EUR,EC:USD,EE:EUR,EG:EGP,EH:MAD,ER:ERN,ES:EUR,ET:ETB,FI:EUR,FJ:FJD,FK:FKP,FM:USD,FO:DKK,FR:EUR,GA:FCFA,GB:GBP,GD:XCD,GE:GEL,GF:EUR,GG:GBP,GH:GHS,GI:GIP,GL:DKK,GM:GMD,GN:GNF,GP:EUR,GQ:FCFA,GR:EUR,GS:GBP,GT:GTQ,GU:USD,GW:FCFA,GY:GYD,HK:HKD,HM:AUD,HN:HNL,HR:EUR,HT:HTG,HU:HUF,IC:EUR,ID:IDR,IE:EUR,IL:ILS,IM:GBP,IN:INR,IO:USD,IQ:IQD,IR:IRR,IS:ISK,IT:EUR,JE:GBP,JM:JMD,JO:JOD,JP:JPY,KE:KES,KG:KGS,KH:KHR,KI:AUD,KM:KMF,KN:XCD,KR:KRW,KW:KWD,KY:KYD,KZ:KZT,LA:LAK,LB:LBP,LC:XCD,LI:CHF,LK:LKR,LR:LRD,LS:ZAR,LT:EUR,LU:EUR,LV:EUR,LY:LYD,MA:MAD,MC:EUR,MD:MDL,ME:EUR,MF:EUR,MG:MGA,MH:USD,MK:MKD,ML:FCFA,MM:MMK,MN:MNT,MO:MOP,MP:USD,MQ:EUR,MR:MRU,MS:XCD,MT:EUR,MU:MUR,MV:MVR,MW:MWK,MX:MXN,MY:MYR,MZ:MZN,NA:NAD,NC:XPF,NE:FCFA,NF:AUD,NG:NGN,NI:NIO,NL:EUR,NO:NOK,NP:NPR,NR:AUD,NU:NZD,NZ:NZD,OM:OMR,PA:PAB,PE:PEN,PF:XPF,PG:PGK,PH:PHP,PK:PKR,PL:PLN,PM:EUR,PN:NZD,PR:USD,PS:ILS,PT:EUR,PW:USD,PY:PYG,QA:QAR,RE:EUR,RO:RON,RS:RSD,RU:RUB,RW:RWF,SA:SAR,SB:SBD,SC:SCR,SD:SDG,SE:SEK,SG:SGD,SH:SHP,SI:EUR,SJ:NOK,SK:EUR,SL:SLE,SM:EUR,SN:FCFA,SO:SOS,SR:SRD,SS:SSP,ST:STN,SV:USD,SX:XCG,SY:SYP,SZ:SZL,TA:GBP,TC:USD,TD:FCFA,TF:EUR,TG:FCFA,TH:THB,TJ:TJS,TK:NZD,TL:USD,TM:TMT,TN:TND,TO:TOP,TR:TRY,TT:TTD,TV:AUD,TW:TWD,TZ:TZS,UA:UAH,UG:UGX,UM:USD,US:USD,UY:UYU,UZ:UZS,VA:EUR,VC:XCD,VE:VES,VG:USD,VI:USD,VN:VND,VU:VUV,WF:XPF,WS:WST,XK:EUR,YE:YER,YT:EUR,ZA:ZAR,ZM:ZMW,ZW:ZWG'.split(',').map((x) => x.split(':') as [string, string]),
);

export const FCFA_PAR_EURO = 655.957;
const FIXES: Record<string, number> = { FCFA: FCFA_PAR_EURO, XAF: FCFA_PAR_EURO, XOF: FCFA_PAR_EURO, EUR: 1 };

export function monnaieDeBoutique(pays: string | null | undefined): string {
  if (!pays) return 'USD';
  return PAYS_MONNAIE[String(pays).toUpperCase()] || 'USD';
}

/** Unités de `devise` pour 1 euro quand la parité est fixe, sinon null (à lire dans taux_du_jour). */
export function tauxFixe(devise: string): number | null {
  return FIXES[devise] ?? null;
}

/** Un montant tapé dans `devise` (parEuro unités pour 1 €) → FCFA entiers. */
export function versFcfa(montant: number, parEuro: number): number {
  return Math.round((montant * FCFA_PAR_EURO) / parEuro);
}

/** Un montant en FCFA → la devise (parEuro unités pour 1 €), arrondi au centime. */
export function depuisFcfa(fcfa: number, parEuro: number): number {
  return Math.round(((fcfa * parEuro) / FCFA_PAR_EURO) * 100) / 100;
}
