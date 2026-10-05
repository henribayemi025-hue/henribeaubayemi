import { describe, it, expect } from 'vitest';
import { formatReel } from './image.js';

const blob = (bytes) => new Blob([new Uint8Array(bytes)]);
const ascii = (s) => [...s].map((c) => c.charCodeAt(0));

describe('formatReel', () => {
  it('reconnaît un PNG même annoncé AVIF', async () => {
    const png = new Blob([new Uint8Array([0x89, ...ascii('PNG'), 13, 10, 26, 10])], { type: 'image/avif' });
    expect(await formatReel(png)).toBe('image/png');
  });
  it('reconnaît WebP, JPEG et AVIF', async () => {
    expect(await formatReel(blob([...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBPVP8 ')]))).toBe('image/webp');
    expect(await formatReel(blob([0xff, 0xd8, 0xff, 0xe0]))).toBe('image/jpeg');
    expect(await formatReel(blob([0, 0, 0, 28, ...ascii('ftypavif')]))).toBe('image/avif');
  });
  it('renvoie null pour un fichier inconnu ou vide', async () => {
    expect(await formatReel(blob([1, 2, 3]))).toBe(null);
    expect(await formatReel(null)).toBe(null);
  });
});
