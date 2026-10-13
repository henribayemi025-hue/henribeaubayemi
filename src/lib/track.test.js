import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const insert = vi.fn(() => Promise.resolve({}));
vi.mock('./supabase', () => ({ supabase: { from: vi.fn(() => ({ insert })) } }));
vi.mock('./origine', () => ({ origine: () => null }));

import { track } from './track';

describe('track', () => {
  beforeEach(() => { insert.mockClear(); });
  afterEach(() => { Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true }); });

  it('enregistre un événement pour une vraie personne', () => {
    Object.defineProperty(navigator, 'webdriver', { value: false, configurable: true });
    track('product_view', 'abc');
    expect(insert).toHaveBeenCalledTimes(1);
    expect(insert.mock.calls[0][0]).toMatchObject({ type: 'product_view', target_id: 'abc' });
  });

  it('n’enregistre rien quand le navigateur est piloté par un programme', () => {
    Object.defineProperty(navigator, 'webdriver', { value: true, configurable: true });
    track('contact_intent', 'abc');
    expect(insert).not.toHaveBeenCalled();
  });
});
