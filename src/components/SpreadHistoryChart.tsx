import { useMemo, useState } from 'react';
import { fmtBs, fmtPct } from '../utils/format';

export interface SpreadPoint {
  timestamp: string;
  bcvUsd: number;
  binanceBuy: number;
  brechaPct: number;
}

interface SpreadHistoryChartProps {
  points: SpreadPoint[];
  sourceLabel?: string;
}

export function SpreadHistoryChart({ points, sourceLabel }: SpreadHistoryChartProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const stats = useMemo(() => {
    if (points.length === 0) {
      return { min: 0, max: 0, avg: 0, latest: 0 };
    }
    const vals = points.map((p) => p.brechaPct);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    return { min, max, avg, latest: vals[vals.length - 1] };
  }, [points]);

  const width = 760;
  const height = 210;
  const padX = 40;
  const padY = 22;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  const { coords, pathD, areaD, minVal, maxVal } = useMemo(() => {
    if (points.length === 0) {
      return { coords: [], pathD: '', areaD: '', minVal: 0, maxVal: 10 };
    }
    const vals = points.map((p) => p.brechaPct);
    const rawMin = Math.min(...vals);
    const rawMax = Math.max(...vals);
    const span = Math.max(1.5, rawMax - rawMin);
    const minV = Math.max(0, rawMin - span * 0.2);
    const maxV = rawMax + span * 0.2;

    const pts = points.map((p, idx) => {
      const x =
        points.length === 1
          ? padX + innerW / 2
          : padX + (idx / (points.length - 1)) * innerW;
      const y = padY + ((maxV - p.brechaPct) / Math.max(0.01, maxV - minV)) * innerH;
      return { x, y, point: p };
    });

    const line = pts
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
      .join(' ');
    const area =
      pts.length > 0
        ? `${line} L ${pts[pts.length - 1].x.toFixed(1)} ${(height - padY).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(height - padY).toFixed(1)} Z`
        : '';

    return { coords: pts, pathD: line, areaD: area, minVal: minV, maxVal: maxV };
  }, [points, innerW, innerH]);

  const activePoint = hoverIdx !== null ? coords[hoverIdx] : coords[coords.length - 1];

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
            Histórico de Brecha (BCV vs Binance P2P)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {sourceLabel ?? `Registro continuo en vivo (${points.length} muestras)`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
            Mín: <strong className="text-[#0067b8] dark:text-sky-300">{fmtPct(stats.min)}</strong>
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
            Prom: <strong className="text-slate-900 dark:text-amber-300">{fmtPct(stats.avg)}</strong>
          </span>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 font-mono text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
            Máx: <strong className="text-emerald-700 dark:text-emerald-300">{fmtPct(stats.max)}</strong>
          </span>
        </div>
      </div>

      {activePoint && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs dark:border-slate-800/80 dark:bg-slate-950/60">
          <span className="font-mono text-slate-600 dark:text-slate-300">
            {new Date(activePoint.point.timestamp).toLocaleString('es-VE', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <span className="text-slate-700 dark:text-sky-300">
              BCV: {fmtBs(activePoint.point.bcvUsd)} Bs
            </span>
            <span className="text-[#0067b8] dark:text-amber-300">
              P2P: {fmtBs(activePoint.point.binanceBuy)} Bs
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              Brecha: {fmtPct(activePoint.point.brechaPct)}
            </span>
          </div>
        </div>
      )}

      <div className="relative w-full overflow-hidden rounded-lg border border-slate-200 bg-slate-50/60 p-2 dark:border-slate-800 dark:bg-slate-950/60">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-48 w-full select-none"
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="brechaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0067b8" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0067b8" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 0.5, 1].map((t, i) => {
            const y = padY + t * innerH;
            const val = maxVal - t * (maxVal - minVal);
            return (
              <g key={i}>
                <line
                  x1={padX}
                  y1={y}
                  x2={width - padX}
                  y2={y}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-slate-800"
                  strokeDasharray="4 4"
                />
                <text
                  x={4}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {val.toFixed(1)}%
                </text>
              </g>
            );
          })}

          {areaD && <path d={areaD} fill="url(#brechaGrad)" />}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke="#0067b8"
              strokeWidth="2.25"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          )}

          {coords.map((c, idx) => (
            <g key={idx}>
              <circle
                cx={c.x}
                cy={c.y}
                r={hoverIdx === idx ? 5 : 2.75}
                fill={hoverIdx === idx ? '#059669' : '#0067b8'}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <rect
                x={c.x - 14}
                y={0}
                width={28}
                height={height}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(idx)}
              />
            </g>
          ))}
        </svg>
      </div>
    </section>
  );
}
