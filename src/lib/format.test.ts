import { describe, expect, it } from 'vitest';
import { formatDay, formatMoney, formatPct, formatSignedMoney } from './format';

describe('format', () => {
  it('una fecha sin hora no se corre un día por la zona horaria', () => {
    expect(formatDay('2026-11-01')).toMatch(/^1 de nov/);
  });

  it('porcentajes con signo y coma decimal', () => {
    expect(formatPct(1.7)).toBe('+1,7 %');
    expect(formatPct(-2.05)).toBe('-2,05 %');
    expect(formatPct(0)).toBe('0,0 %');
  });

  it('dinero con signo explícito', () => {
    expect(formatSignedMoney(17000)).toBe(`+${formatMoney(17000)}`);
    expect(formatSignedMoney(-66000)).toBe(`−${formatMoney(66000)}`);
    expect(formatMoney(1000000)).toContain('1.000.000');
  });
});
