import { RefreshCw, ArrowUpRight, ArrowDownRight } from 'lucide-react';
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
    live: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30',
    cached:
      'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30',
    fallback:
      'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30',
  }[snapshot.sourceStatus];

  const statusLabel = {
    live: 'EN VIVO',
    cached: 'CACHÉ',
    fallback: 'OFFLINE',
  }[snapshot.sourceStatus];

  return (
    <div className="border-b border-slate-200 bg-white dark:border-slate-800/80 dark:bg-slate-900/70">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          {/* BCV USD */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              BCV USD
            </span>
            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
              {fmtBs(snapshot.bcvUsd, 2)} Bs
            </span>
            <span
              className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-medium ${
                snapshot.bcvUsdChangePct >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
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

          <div className="hidden h-4 w-px bg-slate-200 sm:block dark:bg-slate-800" />

          {/* BCV EUR */}
          <div className="hidden items-center gap-2 md:flex">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              BCV EUR
            </span>
            <span className="font-mono text-sm font-semibold text-slate-900 dark:text-slate-100">
              {fmtBs(snapshot.bcvEur, 2)} Bs
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-200 md:block dark:bg-slate-800" />

          {/* Binance P2P */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Binance P2P
            </span>
            <span className="font-mono text-sm font-semibold text-[#0067b8] dark:text-sky-400">
              {fmtBs(snapshot.binanceBuy, 2)} Bs
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-200 sm:block dark:bg-slate-800" />

          {/* Bybit P2P */}
          <div className="hidden items-center gap-2 lg:flex">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Bybit P2P
            </span>
            <span className="font-mono text-sm font-semibold text-slate-800 dark:text-indigo-300">
              {fmtBs(snapshot.bybitBuy, 2)} Bs
            </span>
          </div>

          <div className="hidden h-4 w-px bg-slate-200 lg:block dark:bg-slate-800" />

          {/* Brecha */}
          <div className="flex items-center gap-1.5 rounded-md border border-blue-200 bg-blue-50 px-2 py-0.5 dark:border-sky-500/25 dark:bg-sky-500/10">
            <span className="text-[11px] font-medium text-slate-600 dark:text-sky-200/80">
              Brecha
            </span>
            <span className="font-mono text-xs font-bold text-[#0067b8] dark:text-sky-300">
              {fmtPct(snapshot.brechaPct, 2)}
            </span>
          </div>

          {snapshot.interventionRate !== null && (
            <div className="hidden items-center gap-1.5 text-xs text-slate-500 xl:flex dark:text-slate-400">
              <span>Intervención {snapshot.interventionId}:</span>
              <span className="font-mono font-medium text-slate-800 dark:text-slate-200">
                {fmtBs(snapshot.interventionRate, 3)}
              </span>
            </div>
          )}
        </div>

        {/* Status & Refresh */}
        <div className="flex items-center gap-2.5">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${statusStyles}`}
          >
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
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#0067b8] dark:text-sky-400' : ''}`}
              strokeWidth={1.75}
            />
            <span className="hidden sm:inline">Sincronizar</span>
          </button>
        </div>
      </div>
    </div>
  );
}
