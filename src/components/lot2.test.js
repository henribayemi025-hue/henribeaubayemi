// Audit du 01/10, lot 2 : bannière d'installation (M-9) et vignettes absentes (m-3).
import { describe, it, expect, beforeEach } from 'vitest';
import { pageDeDecouverte, compterVisite } from './InstallAppBanner';
import { vignetteAbsente, noterVignetteAbsente } from './SmartImage';

describe('bannière d’installation', () => {
  it('ne vient que sur les pages de découverte', () => {
    for (const p of ['/', '/boutiques', '/services', '/search', '/category/mode']) expect(pageDeDecouverte(p)).toBe(true);
    for (const p of ['/product/1', '/cart', '/checkout/tout', '/boutique/x', '/profile', '/legion', '/servicesx']) expect(pageDeDecouverte(p)).toBe(false);
  });

  it('compte une visite par session, pas une par page', () => {
    localStorage.clear(); sessionStorage.clear();
    expect(compterVisite()).toBe(1);
    expect(compterVisite()).toBe(1);
    sessionStorage.clear(); // nouvelle session
    expect(compterVisite()).toBe(2);
  });
});

describe('vignettes absentes', () => {
  beforeEach(() => localStorage.clear());
  it('une vignette notée absente est reconnue ensuite', () => {
    expect(vignetteAbsente('/img/products/a_thumb.webp')).toBe(false);
    noterVignetteAbsente('/img/products/a_thumb.webp');
    expect(vignetteAbsente('/img/products/a_thumb.webp')).toBe(true);
    expect(JSON.parse(localStorage.getItem('finjaro_vignettes_absentes'))).toContain('/img/products/a_thumb.webp');
  });
});
