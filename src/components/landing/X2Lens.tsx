import { motion, useReducedMotion } from 'framer-motion';
import { useId, useMemo, useState } from 'react';
import { formatCop, formatPct, formatSignedMoney } from '../../lib/format';

/** Variaciones diarias ilustrativas del índice (%), fijas para que el dibujo sea estable. */
const DAILY = [
  0.6, -0.4, 0.9, 0.3, -1.1, 0.7, 1.2, -0.3, 0.4, -0.8, 1.0, 0.5, -0.6, 0.8, 0.2, -1.3, 0.9, 1.1,
  -0.2, 0.6, -0.5, 0.7,
];
const CAPITAL = 1_000_000;
const W = 640;
const H = 300;
const PAD = { top: 24, right: 92, bottom: 24, left: 8 };

function series(daily: number[], factor: number) {
  const out = [100];
  for (const r of daily) out.push(out[out.length - 1] * (1 + (factor * r) / 100));
  return out;
}

// Dominio fijo calculado con los extremos del slider: el gráfico no se reescala al arrastrar.
const DOMAIN = (() => {
  const all = [-5, 5].flatMap((m) => [...series([...DAILY, m], 1), ...series([...DAILY, m], 2)]);
  return { min: Math.min(...all) - 2, max: Math.max(...all) + 2 };
})();

const x = (i: number) => PAD.left + (i / DAILY.length) * (W - PAD.left - PAD.right);
const y = (v: number) =>
  PAD.top + (1 - (v - DOMAIN.min) / (DOMAIN.max - DOMAIN.min)) * (H - PAD.top - PAD.bottom);
const path = (values: number[]) =>
  values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');

export function X2Lens() {
  const [move, setMove] = useState(2);
  const reduce = useReducedMotion();
  const sliderId = useId();

  const { index, levered } = useMemo(
    () => ({ index: series([...DAILY, move], 1), levered: series([...DAILY, move], 2) }),
    [move],
  );

  const gain = (CAPITAL * 2 * move) / 100;
  const last = DAILY.length;
  const area = `${path(levered)} L${x(last)} ${H - PAD.bottom} L${x(0)} ${H - PAD.bottom} Z`;
  const draw = reduce ? { duration: 0 } : { duration: 1.6, ease: [0.65, 0, 0.35, 1] as const };
  const morph = { type: 'spring' as const, stiffness: 160, damping: 22 };

  return (
    <div className="relative">
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(closest-side, var(--glow), transparent)' }}
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: reduce ? 0 : 0.9, duration: reduce ? 0 : 1.4 }}
      />

      <div className="rounded-shell border border-line bg-surface/80 p-5 shadow-soft backdrop-blur-sm sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-3">
          <div>
            <p className="text-sm text-ash">
              Con {formatCop(CAPITAL)} invertidos, hoy{' '}
              {gain > 0 ? 'ganarías' : gain < 0 ? 'perderías' : 'no ganarías ni perderías'}
            </p>
            <p
              className={`num font-display text-4xl font-extrabold sm:text-5xl ${gain >= 0 ? 'text-flare' : 'text-frost'}`}
              aria-live="polite"
            >
              {formatSignedMoney(gain)}
            </p>
          </div>
          <dl className="flex gap-6 text-sm">
            <div>
              <dt className="flex items-center gap-2 text-ash">
                <span className="h-0.5 w-4 rounded bg-frost" /> NASDAQ 100
              </dt>
              <dd className="num mt-1 font-semibold">{formatPct(move)}</dd>
            </div>
            <div>
              <dt className="flex items-center gap-2 text-ash">
                <span className="h-1 w-4 rounded bg-ember" /> Tu inversión x2
              </dt>
              <dd className="num mt-1 font-semibold text-ember">{formatPct(move * 2)}</dd>
            </div>
          </dl>
        </div>

        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="mt-4 h-auto w-full overflow-visible"
          role="img"
          aria-label={`Si el NASDAQ 100 se mueve ${formatPct(move)}, la inversión apalancada se mueve ${formatPct(move * 2)}.`}
        >
          <defs>
            <linearGradient id="x2-fill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="var(--ember)" stopOpacity="0.22" />
              <stop offset="1" stopColor="var(--ember)" stopOpacity="0" />
            </linearGradient>
            <filter id="x2-glow" x="-10%" y="-30%" width="120%" height="160%">
              <feGaussianBlur stdDeviation="6" />
            </filter>
          </defs>

          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(100)}
            y2={y(100)}
            stroke="var(--line)"
            strokeDasharray="3 6"
          />
          <rect
            x={x(last - 1)}
            y={PAD.top}
            width={x(last) - x(last - 1)}
            height={H - PAD.top - PAD.bottom}
            fill="var(--surface-2)"
            opacity="0.7"
            rx="6"
          />
          <text x={x(last - 1) + 6} y={H - 6} fill="var(--ash)" fontSize="12">
            hoy
          </text>

          <motion.path
            fill="url(#x2-fill)"
            initial={{ opacity: 0, d: area }}
            animate={{ opacity: 1, d: area }}
            transition={{ opacity: { delay: reduce ? 0 : 1.2, duration: 0.8 }, d: morph }}
          />
          <motion.path
            fill="none"
            stroke="var(--frost)"
            strokeWidth="1.75"
            strokeLinejoin="round"
            initial={{ pathLength: 0, d: path(index) }}
            animate={{ pathLength: 1, d: path(index) }}
            transition={{ pathLength: draw, d: morph }}
          />
          <motion.path
            fill="none"
            stroke="var(--ember)"
            strokeWidth="8"
            filter="url(#x2-glow)"
            opacity="0.55"
            initial={{ pathLength: 0, d: path(levered) }}
            animate={{ pathLength: 1, d: path(levered) }}
            transition={{ pathLength: { ...draw, delay: reduce ? 0 : 0.25 }, d: morph }}
          />
          <motion.path
            fill="none"
            stroke="var(--ember)"
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
            initial={{ pathLength: 0, d: path(levered) }}
            animate={{ pathLength: 1, d: path(levered) }}
            transition={{ pathLength: { ...draw, delay: reduce ? 0 : 0.25 }, d: morph }}
          />

          <motion.circle
            r="4.5"
            fill="var(--frost)"
            cx={x(last)}
            animate={{ cy: y(index[last]) }}
            transition={morph}
          />
          <motion.circle
            r="6"
            fill="var(--ember)"
            stroke="var(--surface)"
            strokeWidth="3"
            cx={x(last)}
            animate={{ cy: y(levered[last]) }}
            transition={morph}
          />
          <motion.text
            x={x(last) + 14}
            fill="var(--ember)"
            fontSize="15"
            fontWeight="600"
            className="num"
            animate={{ y: y(levered[last]) + 5 }}
            transition={morph}
          >
            {formatPct(move * 2)}
          </motion.text>
          <motion.text
            x={x(last) + 14}
            fill="var(--frost)"
            fontSize="13"
            className="num"
            animate={{ y: y(index[last]) + (Math.abs(move) < 1 ? 20 : 5) }}
            transition={morph}
          >
            {formatPct(move)}
          </motion.text>
        </svg>

        <div className="mt-4">
          <label htmlFor={sliderId} className="flex justify-between text-sm">
            <span className="font-medium">Si el índice se mueve hoy</span>
            <span className="num text-ash">{formatPct(move)}</span>
          </label>
          <input
            id={sliderId}
            type="range"
            min={-5}
            max={5}
            step={0.5}
            value={move}
            onChange={(e) => setMove(Number(e.target.value))}
            className="mt-3 w-full cursor-grab accent-[var(--ember)] active:cursor-grabbing"
          />
          <div className="num mt-1 flex justify-between text-xs text-ash">
            <span>−5 %</span>
            <span>0</span>
            <span>+5 %</span>
          </div>
        </div>
      </div>
    </div>
  );
}
