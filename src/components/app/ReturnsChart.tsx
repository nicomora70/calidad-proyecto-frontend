import {
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatDay, formatPct, formatShortDay } from '../../lib/format';
import type { Simulation } from '../../types/api';

interface Row {
  id: string;
  day: string;
  index: number;
  x2: number;
}

function ChartTooltip({ active, payload }: { active?: boolean; payload?: { payload: Row }[] }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-ctrl border border-line bg-surface px-3 py-2 text-sm shadow-soft">
      <p className="mb-1 font-medium">{formatDay(row.day)}</p>
      <p className="flex items-center gap-2">
        <span className="size-2.5 rounded-sm bg-series-index" /> NASDAQ 100
        <span className="num ml-auto pl-4 font-semibold">{formatPct(row.index)}</span>
      </p>
      <p className="flex items-center gap-2">
        <span className="size-2.5 rounded-sm bg-series-x2" /> Tu retorno x2
        <span className="num ml-auto pl-4 font-semibold">{formatPct(row.x2)}</span>
      </p>
    </div>
  );
}

/** Índice vs. retorno x2 de las últimas simulaciones (más antigua a la izquierda). */
export function ReturnsChart({ simulations }: { simulations: Simulation[] }) {
  const rows: Row[] = [...simulations].reverse().map((s) => ({
    id: s.id,
    day: s.marketDate,
    index: s.marketVariationPct,
    x2: s.returnPct,
  }));

  return (
    <figure>
      <ul className="mb-3 flex gap-5 text-sm" aria-hidden>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-series-index" />
          <span className="text-ash">NASDAQ 100</span>
        </li>
        <li className="flex items-center gap-2">
          <span className="size-2.5 rounded-sm bg-series-x2" />
          <span className="text-ash">Tu retorno x2</span>
        </li>
      </ul>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            barGap={2}
            barCategoryGap="28%"
            margin={{ top: 8, right: 4, bottom: 0, left: -12 }}
          >
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="day"
              tickFormatter={formatShortDay}
              tick={{ fill: 'var(--ash)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              minTickGap={16}
            />
            <YAxis
              tickFormatter={(v: number) => `${v}%`}
              tick={{ fill: 'var(--ash)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <ReferenceLine y={0} stroke="var(--ash)" strokeOpacity={0.6} />
            <Tooltip
              content={<ChartTooltip />}
              cursor={{ fill: 'var(--surface-2)', opacity: 0.6 }}
            />
            <Bar
              dataKey="index"
              name="NASDAQ 100"
              fill="var(--series-index)"
              radius={3}
              maxBarSize={18}
            />
            <Bar
              dataKey="x2"
              name="Tu retorno x2"
              fill="var(--series-x2)"
              radius={3}
              maxBarSize={18}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-ash hover:text-ink">Ver como tabla</summary>
        <table className="mt-2 w-full">
          <thead>
            <tr className="text-left text-ash">
              <th className="py-1 font-medium">Día de mercado</th>
              <th className="py-1 text-right font-medium">NASDAQ 100</th>
              <th className="py-1 text-right font-medium">Tu retorno x2</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-line">
                <td className="py-1">{formatDay(r.day)}</td>
                <td className="num py-1 text-right">{formatPct(r.index)}</td>
                <td className="num py-1 text-right">{formatPct(r.x2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
