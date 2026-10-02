import { describe, it, expect, beforeEach } from 'vitest';
import { lireOrigine, retenirOrigine, origine, avecOrigine } from './origine';

describe('origine des visiteurs', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });

  it('lit ?src= et les utm_*, en mots courts', () => {
    expect(lireOrigine('?src=WhatsApp')).toEqual({ src: 'whatsapp' });
    expect(lireOrigine('?utm_source=tiktok&utm_medium=video&utm_campaign=Octobre 2026')).toEqual({ src: 'tiktok', medium: 'video', campagne: 'octobre-2026' });
    expect(lireOrigine('?q=robe')).toBeNull();
    expect(lireOrigine('?src=' + 'x'.repeat(100)).src).toHaveLength(40);
  });

  it('retient la visite et la première étiquette 30 jours', () => {
    const t0 = Date.UTC(2026, 9, 2);
    retenirOrigine('?src=statut', t0);
    expect(origine(t0)).toEqual({ src: 'statut' });
    // nouvelle visite, autre canal : la visite change, la première reste
    sessionStorage.clear();
    retenirOrigine('?src=tiktok', t0 + 86_400_000);
    expect(origine(t0 + 86_400_000)).toEqual({ src: 'tiktok' });
    sessionStorage.clear();
    expect(origine(t0 + 2 * 86_400_000)).toEqual({ src: 'statut', premiere: true });
    // au-delà de 30 jours, plus rien
    expect(origine(t0 + 31 * 86_400_000)).toBeNull();
  });

  it('une visite sans étiquette ne remplace rien', () => {
    const t0 = Date.UTC(2026, 9, 2);
    retenirOrigine('?src=whatsapp', t0);
    sessionStorage.clear();
    expect(retenirOrigine('', t0 + 1000)).toEqual({ src: 'whatsapp', premiere: true });
  });

  it('avecOrigine étiquette un lien partagé sans écraser une étiquette existante', () => {
    expect(avecOrigine('https://finjaro.net/boutique/patysha', 'statut')).toBe('https://finjaro.net/boutique/patysha?src=statut');
    expect(avecOrigine('https://finjaro.net/?src=tiktok', 'statut')).toBe('https://finjaro.net/?src=tiktok');
    expect(avecOrigine('pas une adresse', 'statut')).toBe('pas une adresse');
  });
});
