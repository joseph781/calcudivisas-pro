import { useMemo } from 'react';
import { Award, BookOpen, Download, Landmark, Trash2, TrendingUp } from 'lucide-react';
import { OperationRecord } from '../types/operations';
import { fmtBs, fmtPct, fmtUsd } from '../utils/format';

interface LedgerTabProps {
  operations: OperationRecord[];
  onDeleteOperation: (id: string) => void;
  onClearAll: () => void;
}

export function LedgerTab({ operations, onDeleteOperation, onClearAll }: LedgerTabProps) {
  const totalCapitalBs = operations.reduce((acc, op) => acc + op.totalInvertidoBs, 0);
  const totalProfitBs = operations.reduce((acc, op) => acc + op.gananciaBs, 0);
  const totalProfitUsdt = operations.reduce((acc, op) => acc + op.gananciaUsdt, 0);
  const totalUsdBought = operations.reduce((acc, op) => acc + op.usdAmount, 0);
  const avgRoi =
    operations.length > 0
      ? operations.reduce((acc, op) => acc + op.roiPct, 0) / operations.length
      : 0;
  const winRate =
    operations.length > 0
      ? (operations.filter((op) => op.gananciaBs > 0).length / operations.length) * 100
      : 0;
  const avgTicketUsd = operations.length > 0 ? totalUsdBought / operations.length : 0;

  const bestOp = useMemo(() => {
    if (operations.length === 0) return null;
    return operations.reduce((best, cur) => (cur.gananciaBs > best.gananciaBs ? cur : best));
  }, [operations]);

  const byBank = useMemo(() => {
    const map = new Map<
      string,
      { bankName: string; count: number; totalUsd: number; profitBs: number; roiSum: number }
    >();
    for (const op of operations) {
      const prev = map.get(op.bankId) ?? {
        bankName: op.bankName,
        count: 0,
        totalUsd: 0,
        profitBs: 0,
        roiSum: 0,
      };
      prev.count += 1;
      prev.totalUsd += op.usdAmount;
      prev.profitBs += op.gananciaBs;
      prev.roiSum += op.roiPct;
      map.set(op.bankId, prev);
    }
    return Array.from(map.entries())
      .map(([id, data]) => ({
        id,
        ...data,
        avgRoi: data.count > 0 ? data.roiSum / data.count : 0,
      }))
      .sort((a, b) => b.profitBs - a.profitBs);
  }, [operations]);

  const exportCsv = () => {
    if (operations.length === 0) return;
    const headers = [
      'Fecha',
      'Banco',
      'USD_Comprados',
      'Tasa_Banco',
      'Tasa_P2P',
      'Invertido_Bs',
      'Neto_USDT',
      'Ganancia_Bs',
      'Ganancia_USDT',
      'ROI_Pct',
    ];
    const rows = operations.map((op) => [
      op.createdAt,
      op.bankName,
      op.usdAmount,
      op.tasaBanco,
      op.tasaP2P,
      op.totalInvertidoBs.toFixed(2),
      op.netoUsdt.toFixed(2),
      op.gananciaBs.toFixed(2),
      op.gananciaUsdt.toFixed(2),
      op.roiPct.toFixed(2),
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `calcudivisas_bitacora_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Portfolio Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Ganancia Acumulada
          </span>
          <div
            className={`mt-1 font-mono text-lg font-bold ${
              totalProfitBs >= 0 ? 'text-emerald-300' : 'text-rose-300'
            }`}
          >
            {fmtBs(totalProfitBs)} Bs
          </div>
          <div className="mt-0.5 font-mono text-xs text-slate-400">
            {fmtUsd(totalProfitUsdt)} USDT
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Volumen Operado
          </span>
          <div className="mt-1 font-mono text-lg font-bold text-slate-100">
            ${totalUsdBought.toLocaleString('en-US')}
          </div>
          <div className="mt-0.5 font-mono text-xs text-slate-400">
            {fmtBs(totalCapitalBs)} Bs
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            ROI Promedio
          </span>
          <div className="mt-1 font-mono text-lg font-bold text-amber-300">
            {fmtPct(avgRoi, 2, true)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">{operations.length} operaciones</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Win Rate
          </span>
          <div className="mt-1 font-mono text-lg font-bold text-sky-300">
            {fmtPct(winRate, 1)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">Operaciones en verde</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            Ticket Promedio
          </span>
          <div className="mt-1 font-mono text-lg font-bold text-slate-100">
            ${avgTicketUsd.toFixed(0)}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">USD por operación</div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/75 p-4">
          <span className="flex items-center gap-1 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
            <Award className="h-3 w-3 text-amber-400" /> Mejor Trade
          </span>
          <div className="mt-1 font-mono text-lg font-bold text-emerald-300">
            {bestOp ? `${fmtBs(bestOp.gananciaBs)} Bs` : '—'}
          </div>
          <div className="mt-0.5 text-xs text-slate-400">
            {bestOp ? `${bestOp.bankName} (${fmtPct(bestOp.roiPct, 1, true)})` : 'Sin datos'}
          </div>
        </div>
      </div>

      {/* Bank Breakdown */}
      {byBank.length > 0 && (
        <section className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
          <div className="mb-3 flex items-center gap-2">
            <Landmark className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              Rendimiento por Banco
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {byBank.map((b) => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{b.bankName}</span>
                  <span className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                    {b.count} ops
                  </span>
                </div>
                <div
                  className={`mt-1.5 font-mono text-sm font-bold ${
                    b.profitBs >= 0 ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {fmtBs(b.profitBs)} Bs
                </div>
                <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-400">
                  <span>Vol: ${b.totalUsd}</span>
                  <span>ROI: {fmtPct(b.avgRoi, 2, true)}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ledger Table */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              Bitácora de Operaciones
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCsv}
              disabled={operations.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 transition hover:bg-slate-700 disabled:opacity-40"
            >
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
            </button>
            {operations.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="inline-flex items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1.5 text-xs font-medium text-rose-300 transition hover:bg-rose-500/20"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Limpiar
              </button>
            )}
          </div>
        </div>

        {operations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-800 bg-slate-950/40 py-12 text-center">
            <TrendingUp className="mx-auto mb-2 h-8 w-8 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">
              Aún no has registrado operaciones
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Usa el botón &ldquo;Registrar Operación&rdquo; en la Terminal para guardar tu historial y medir tu ROI real.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                <tr>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Banco</th>
                  <th className="px-3 py-2.5 text-right">USD</th>
                  <th className="px-3 py-2.5 text-right">BCV / P2P</th>
                  <th className="px-3 py-2.5 text-right">Ganancia</th>
                  <th className="px-3 py-2.5 text-right">ROI</th>
                  <th className="px-3 py-2.5 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {operations.map((op) => (
                  <tr key={op.id} className="hover:bg-slate-800/30">
                    <td className="px-3 py-2.5 font-mono text-slate-400">
                      {new Date(op.createdAt).toLocaleDateString('es-VE', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-200">{op.bankName}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-200">
                      ${op.usdAmount}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-400">
                      {fmtBs(op.tasaBanco)} / {fmtBs(op.tasaP2P)}
                    </td>
                    <td
                      className={`px-3 py-2.5 text-right font-mono font-semibold ${
                        op.gananciaBs >= 0 ? 'text-emerald-300' : 'text-rose-300'
                      }`}
                    >
                      {fmtBs(op.gananciaBs)} Bs
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono">
                      <span
                        className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                          op.roiPct >= 0
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : 'bg-rose-500/10 text-rose-300'
                        }`}
                      >
                        {fmtPct(op.roiPct, 2, true)}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => onDeleteOperation(op.id)}
                        className="rounded p-1 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-400"
                        title="Eliminar registro"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
