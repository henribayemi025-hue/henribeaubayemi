import { describe, it, expect } from 'vitest';
import { deflateRawSync } from 'node:zlib';
import { listerZip, resumerPowerBI } from './powerbi';

const enc = new TextEncoder();
const u16le = (s) => { const b = new Uint8Array(2 + s.length * 2); b[0] = 0xff; b[1] = 0xfe; for (let i = 0; i < s.length; i++) { b[2 + i * 2] = s.charCodeAt(i) & 255; b[3 + i * 2] = s.charCodeAt(i) >> 8; } return b; };

// Une archive ZIP minimale (entrées compressées en deflate).
function zip(entrees) {
  const morceaux = []; const central = []; let pos = 0;
  const w32 = (v) => [v & 255, (v >> 8) & 255, (v >> 16) & 255, (v >>> 24) & 255];
  const w16 = (v) => [v & 255, (v >> 8) & 255];
  for (const [nom, donnees] of Object.entries(entrees)) {
    const brut = Buffer.from(donnees); const comp = deflateRawSync(brut); const n = Buffer.from(nom);
    const local = Buffer.from([0x50, 0x4b, 3, 4, ...w16(20), ...w16(0), ...w16(8), ...w16(0), ...w16(0), ...w32(0), ...w32(comp.length), ...w32(brut.length), ...w16(n.length), ...w16(0)]);
    morceaux.push(local, n, comp);
    central.push(Buffer.from([0x50, 0x4b, 1, 2, ...w16(20), ...w16(20), ...w16(0), ...w16(8), ...w16(0), ...w16(0), ...w32(0), ...w32(comp.length), ...w32(brut.length), ...w16(n.length), ...w16(0), ...w16(0), ...w16(0), ...w16(0), ...w32(0), ...w32(pos)]), n);
    pos += local.length + n.length + comp.length;
  }
  const c = Buffer.concat(central);
  const fin = Buffer.from([0x50, 0x4b, 5, 6, ...w16(0), ...w16(0), ...w16(Object.keys(entrees).length), ...w16(Object.keys(entrees).length), ...w32(c.length), ...w32(pos), ...w16(0)]);
  return new Uint8Array(Buffer.concat([...morceaux, c, fin]));
}

const layout = { sections: [{ displayName: 'Ventes', visualContainers: [{ config: JSON.stringify({ singleVisual: { visualType: 'columnChart', prototypeQuery: { Select: [{ Name: 'Ventes.Region' }, { Name: 'Sum(Ventes.Montant)' }] } } }) }] }] };

describe('lecture d\'un rapport Power BI', () => {
  it('liste les entrées de l\'archive', async () => {
    const e = listerZip(zip({ 'Version': '1.28', 'Report/Layout': 'x' }));
    expect([...e.keys()]).toEqual(['Version', 'Report/Layout']);
  });

  it('résume les pages, visuels et champs d\'un .pbix', async () => {
    const mashup = zip({ 'Formulas/Section1.m': 'section Section1;\nshared Ventes = Excel.Workbook(File.Contents("ventes.xlsx"));' });
    const dm = new Uint8Array(8 + mashup.length); dm.set([0, 0, 0, 0, mashup.length & 255, (mashup.length >> 8) & 255, 0, 0]); dm.set(mashup, 8);
    const f = new File([zip({ 'Report/Layout': Buffer.from(u16le(JSON.stringify(layout))), 'DataModel': 'binaire', 'DataMashup': Buffer.from(dm) })], 'ventes.pbix');
    const { texte, avertissements } = await resumerPowerBI(f);
    expect(texte).toContain('Page 1 : Ventes');
    expect(texte).toContain('columnChart : Ventes.Region, sum de Ventes.Montant');
    expect(texte).toContain('Excel.Workbook');
    expect(avertissements[0]).toContain('.pbit');
    expect(texte).toContain('CE QUI NE SE LIT PAS');
  });

  it('lit les mesures DAX d\'un .pbit', async () => {
    const schema = { model: { tables: [{ name: 'Ventes', columns: [{ name: 'Montant', dataType: 'double' }], measures: [{ name: 'Total', expression: 'SUM(Ventes[Montant])' }] }] } };
    const f = new File([zip({ 'DataModelSchema': Buffer.from(u16le(JSON.stringify(schema))) })], 'modele.pbit');
    const { texte } = await resumerPowerBI(f);
    expect(texte).toContain('Mesure Total = SUM(Ventes[Montant])');
  });

  it('refuse un fichier qui n\'est pas une archive', async () => {
    await expect(resumerPowerBI(new File(['pas un zip'], 'x.pbix'))).rejects.toThrow();
  });
});
