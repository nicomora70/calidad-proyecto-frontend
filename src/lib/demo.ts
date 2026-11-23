import type { Simulation, Statistics } from '../types/api';

/**
 * Datos de ejemplo para los dashboards cuando la base aún no tiene simulaciones (demo).
 * Siempre se muestran con la etiqueta "Datos de ejemplo"; nunca se mezclan con datos reales.
 */
const VARIATIONS = [1.12, -0.64, 0.83, 1.47, -1.21, 0.38, 0.95, -0.27, 1.68, -0.82, 0.54, 1.05];
const CAPITALS = [1_000_000, 2_500_000, 1_500_000, 5_000_000, 800_000, 3_000_000];

export const DEMO_SIMULATIONS: Simulation[] = VARIATIONS.map((v, i) => {
  const day = new Date(Date.now() - i * 86_400_000);
  const capital = CAPITALS[i % CAPITALS.length]!;
  const returnPct = +(v * 2).toFixed(4);
  const profit = Math.round(capital * returnPct) / 100;
  return {
    id: `demo-${i}`,
    userId: 'demo',
    initialCapital: capital,
    currency: 'COP',
    symbol: 'QQQ',
    marketDate: day.toISOString().slice(0, 10),
    marketVariationPct: v,
    leverage: 2,
    returnPct,
    finalAmount: capital + profit,
    profit,
    createdAt: day.toISOString(),
  };
});

export const DEMO_STATISTICS: Statistics = (() => {
  const sims = DEMO_SIMULATIONS;
  const returns = sims.map((s) => s.returnPct);
  const mean = returns.reduce((a, r) => a + r, 0) / returns.length;
  const totalCapital = sims.reduce((a, s) => a + s.initialCapital, 0);
  const totalProfit = sims.reduce((a, s) => a + s.profit, 0);
  const stdev = Math.sqrt(returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1));
  return {
    count: sims.length,
    totalCapital,
    totalProfit,
    meanReturnPct: +mean.toFixed(2),
    weightedReturnPct: +((totalProfit / totalCapital) * 100).toFixed(2),
    stdevReturnPct: +stdev.toFixed(2),
    bestReturnPct: Math.max(...returns),
    worstReturnPct: Math.min(...returns),
    maxDrawdownPct: 4.86,
    winRatePct: +((returns.filter((r) => r > 0).length / returns.length) * 100).toFixed(1),
  };
})();
