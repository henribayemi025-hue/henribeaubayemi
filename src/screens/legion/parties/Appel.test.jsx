// L'appel d'un agent (D3) : ça sonne, puis il décroche et dit « Allô ».
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

vi.mock('../../../lib/supabase', () => ({ supabase: { from: vi.fn(), storage: { from: vi.fn() }, functions: { invoke: vi.fn() } } }));
vi.mock('./Visage', () => ({ Visage: () => <span>visage</span> }));
vi.mock('./voixAgent', async (orig) => ({ ...(await orig()), sonner: vi.fn(() => Promise.resolve()) }));

import { Appel } from './Appel';

const t = (k, o) => ({ 'legion.appel.sonne': 'Ça sonne…', 'legion.appel.decroche': `Allô ? C’est ${o?.nom}, je t’écoute.` }[k] || k);

describe('Appeler un agent', () => {
  let dit;
  beforeEach(() => {
    dit = [];
    globalThis.SpeechSynthesisUtterance = function U(texte) { this.texte = texte; };
    window.speechSynthesis = { getVoices: () => [{ name: 'Microsoft Denise', lang: 'fr-FR' }], cancel: () => {}, speak: (u) => dit.push(u), speaking: false };
  });

  it('sonne, puis l’agent décroche avec sa voix', async () => {
    render(<Appel agent={{ id: 'a1', nom: 'Ada', poste: 'Développeuse', apparence: { description: 'a young woman' } }} salon={{}} moi={{}} entrepriseId="e" langue="fr" t={t} onMessages={() => {}} onRaccrocher={() => {}} />);
    expect(screen.getByText('Ça sonne…')).toBeTruthy();
    await waitFor(() => expect(dit.length).toBe(1));
    expect(dit[0].texte).toBe('Allô ? C’est Ada, je t’écoute.');
    expect(dit[0].voice.name).toMatch(/Denise/);
    expect(dit[0].pitch).toBeGreaterThanOrEqual(0.9);
  });
});
