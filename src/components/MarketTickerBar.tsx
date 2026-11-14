import { RefreshCw, Activity, Landmark, ArrowUpRight, ArrowDownRight, Radio } from 'lucide-react';
import { MarketSnapshot } from '../services/ratesApi';
import { fmtBs, fmtPct, fmtTimeAgo } from '../utils/format';

interface MarketTickerBarProps {
  snapshot: MarketSnapshot;
  isRefreshing: boolean;
  secondsUntilRefresh: number;
  onRefresh: () => void;
}

export function MarketTickerBar({
  snapshot,
  isRefreshing,
  secondsUntilRefresh,
  onRefresh,
}: MarketTickerBarProps) {
  const statusStyles = {
    live: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    cached: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    fallback: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  }[snapshot.sourceStatus];

  const statusLabel = {
    live: 'EN VIVO',
    cached: 'CACHÉ',
    fallback: 'OFFLINE',
  }[snapshot.sourceStatus];

  return (
    <div className="border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* BCV USD */}
          <div className="flex items-center gap-2">
            <Landmark className="h-3.5 w-3.5 text-sky-400" />
            <span className="text-xs font-medium text-slate-400">BCV USD</span>
            <span className="font-mono text-sm font-semibold text-slate-100">
              {fmtBs(snapshot.bcvUsd, 2)} Bs
            </span>
            <span
              className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-medium ${
                snapshot.bcvUsdChangePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {snapshot.bcvUsdChangePct >= 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {fmtPct(snapshot.bcvUsdChangePct, 2, true)}
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-800 sm:block" />

          {/* BCV EUR */}
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-xs font-medium text-slate-400">BCV EUR</span>
            <span className="font-mono text-sm font-semibold text-slate-100">
              {fmtBs(snapshot.bcvEur, 2)} Bs
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-800 md:block" />

          {/* Binance P2P */}
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            <span className="text-xs font-medium text-slate-400">Binance P2P</span>
            <span className="font-mono text-sm font-semibold text-amber-300">
              {fmtBs(snapshot.binanceBuy, 2)} Bs
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-800 sm:block" />

          {/* Bybit P2P */}
          <div className="hidden items-center gap-2 lg:flex">
            <span className="inline-block h-2 w-2 rounded-full bg-indigo-400" />
            <span className="text-xs font-medium text-slate-400">Bybit P2P</span>
            <span className="font-mono text-sm font-semibold text-indigo-300">
              {fmtBs(snapshot.bybitBuy, 2)} Bs
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-800 lg:block" />

          {/* Brecha */}
          <div className="flex items-center gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5">
            <Activity className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-[11px] font-medium text-amber-200/80">Brecha</span>
            <span className="font-mono text-xs font-bold text-amber-300">
              {fmtPct(snapshot.brechaPct, 2)}
            </span>
          </div>

          {snapshot.interventionRate !== null && (
            <div className="hidden items-center gap-1.5 text-xs text-slate-400 xl:flex">
              <span>Intervención {snapshot.interventionId}:</span>
              <span className="font-mono font-medium text-slate-200">
                {fmtBs(snapshot.interventionRate, 3)}
              </span>
            </div>
          )}
        </div>

        {/* Status & Refresh */}
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${statusStyles}`}
          >
            <Radio className="h-3 w-3" />
            {statusLabel}
          </span>
          <span className="hidden text-[11px] text-slate-500 sm:inline">
            {fmtTimeAgo(snapshot.capturedAt)} · {secondsUntilRefresh}s
          </span>
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Actualizar tasas en vivo"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-600 hover:bg-slate-800 disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : ''}`} />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
