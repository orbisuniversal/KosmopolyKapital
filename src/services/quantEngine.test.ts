import { describe, it, expect } from 'vitest';
import {
  computeRollingPearsonCorrelation,
  computeFlowZScore,
  classifyMacroRegime,
} from './quantEngine';

describe('Kosmopoly Quant Engine', () => {
  it('computes Pearson correlation between two aligned series', () => {
    const s1 = Array.from({ length: 15 }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, value: 100 + i * 2 }));
    const s2 = Array.from({ length: 15 }, (_, i) => ({ date: `2026-01-${String(i + 1).padStart(2, '0')}`, value: 50 + i * 4 }));
    const res = computeRollingPearsonCorrelation(s1, s2);
    expect(res.currentCorrelation).not.toBeNull();
    expect(res.currentCorrelation!).toBeGreaterThan(0.95);
  });

  it('returns normal signal when series is empty', () => {
    const res = computeFlowZScore([]);
    expect(res.zScore).toBe(0);
    expect(res.signal).toBe('normal');
  });

  it('classifies macro regime deterministically with two series', () => {
    const growth = Array.from({ length: 12 }, (_, i) => ({
      date: `2026-${String(i + 1).padStart(2, '0')}-01`,
      value: 100 + i * 2,
    }));
    const inflation = Array.from({ length: 12 }, (_, i) => ({
      date: `2026-${String(i + 1).padStart(2, '0')}-01`,
      value: 300 + i * 3,
    }));
    const regime = classifyMacroRegime(growth, inflation);
    expect(regime.regime).toBeDefined();
    expect(['alta', 'media', 'baja']).toContain(regime.confidence);
  });
});
