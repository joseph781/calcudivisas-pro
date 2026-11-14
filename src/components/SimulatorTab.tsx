import { useMemo, useState } from 'react';
import { BANK_BY_ID, VENEZUELAN_BANKS } from '../data/banks';
import { buildSensitivityMatrix, calculateForwardArbitrage } from '../engine/arbitrage';
import { MarketSnapshot } from '../services/ratesApi';
import { fmtBs, fmtPct, fmtUsd } from '../utils/format';

interface SimulatorTabProps {
  snapshot: MarketSnapshot;
  selectedBankId: string;
}

export function SimulatorTab({ snapshot, selectedBankId }: SimulatorTabProps) {
  const [usdAmount, setUsdAmount] = useState(200);
  const [bcvShiftPct, setBcvShiftPct] = useState(0);
  const [p2pShiftPct, setP2pShiftPct] = useState(0);
  const [p2pFeePct, setP2pFeePct] = useState(0);

  const bank = BANK_BY_ID[selectedBankId] ?? VENEZUELAN_BANKS[0];

  const simBcv = snapshot.bcvUsd * (1 + bcvShiftPct / 100);
  const simP2p = snapshot.binanceBuy * (1 + p2pShiftPct / 100);

  const simResult = useMemo(
    () =>
      calculateForwardArbitrage({
        usdAmount,
        tasaBanco: simBcv,
        tasaP2P: simP2p,
        bank,
        p2pFeePct,
      }),
    [usdAmount, simBcv, simP2p, bank, p2pFeePct],
  );

  const matrix = useMemo(
    () =>
      buildSensitivityMatrix(
        {
          usdAmount,
          tasaBanco: snapshot.bcvUsd,
          tasaP2P: snapshot.binanceBuy,
          bank,
          p2pFeePct,
        },
        [-3, -1.5, 0, 1.5, 3],
        [-3, -1.5, 0, 1.5, 3],
      ),
    [usdAmount, snapshot.bcvUsd, snapshot.binanceBuy, bank, p2pFeePct],
  );

  const p2pHeaders = [-3, -1.5, 0, 1.5, 3];

  return (
    <div className="space-y-6">
      {/* Interactive Stress-Test Controls */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
            Simulador de Estrés — {bank.name}
          </h2>
          <button
            type="button"
            onClick={() => {
              setBcvShiftPct(0);
              setP2pShiftPct(0);
            }}
            className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Restablecer (0%)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div>
            <label className="mb-1.5 flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Monto Base (USD)</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                ${usdAmount}
              </span>
            </label>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={usdAmount}
              onChange={(e) => setUsdAmount(Number(e.target.value))}
              className="w-full accent-[#0067b8]"
            />
          </div>

          <div>
            <label className="mb-1.5 flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Variación BCV</span>
              <span className="font-mono font-semibold text-[#0067b8] dark:text-sky-300">
                {fmtPct(bcvShiftPct, 1, true)} ({fmtBs(simBcv)})
              </span>
            </label>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={bcvShiftPct}
              onChange={(e) => setBcvShiftPct(Number(e.target.value))}
              className="w-full accent-[#0067b8]"
            />
          </div>

          <div>
            <label className="mb-1.5 flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Variación P2P</span>
              <span className="font-mono font-semibold text-slate-900 dark:text-amber-300">
                {fmtPct(p2pShiftPct, 1, true)} ({fmtBs(simP2p)})
              </span>
            </label>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={p2pShiftPct}
              onChange={(e) => setP2pShiftPct(Number(e.target.value))}
              className="w-full accent-[#0067b8]"
            />
          </div>

          <div>
            <label className="mb-1.5 flex justify-between text-xs text-slate-600 dark:text-slate-400">
              <span>Comisión P2P</span>
              <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-300">
                {p2pFeePct}%
              </span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={p2pFeePct}
              onChange={(e) => setP2pFeePct(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-100 pt-4 sm:grid-cols-4 dark:border-slate-800">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Ganancia Simulada
            </span>
            <div
              className={`mt-1 font-mono text-base font-bold ${
                simResult.gananciaBs >= 0
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-rose-700 dark:text-rose-300'
              }`}
            >
              {fmtBs(simResult.gananciaBs)} Bs
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Equivalente USDT
            </span>
            <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-slate-100">
              {fmtUsd(simResult.gananciaUsdt)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">ROI Simulado</span>
            <div className="mt-1 font-mono text-base font-bold text-[#0067b8] dark:text-sky-300">
              {fmtPct(simResult.roiPct, 2, true)}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Brecha Simulada
            </span>
            <div className="mt-1 font-mono text-base font-bold text-slate-900 dark:text-slate-200">
              {fmtPct(simResult.brechaBrutaPct)}
            </div>
          </div>
        </div>
      </section>

      {/* 5x5 Sensitivity Heatmap */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
            Matriz de Sensibilidad (BCV vs P2P)
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Filas: variación BCV · Columnas: variación P2P · Monto: ${usdAmount} USD
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-50 text-[11px] font-semibold text-slate-600 dark:bg-slate-950 dark:text-slate-400">
              <tr>
                <th className="border-r border-b border-slate-200 px-3 py-2.5 text-left dark:border-slate-800">
                  BCV \ P2P
                </th>
                {p2pHeaders.map((d) => (
                  <th
                    key={d}
                    className="border-b border-slate-200 px-3 py-2.5 font-mono dark:border-slate-800"
                  >
                    {fmtPct(d, 1, true)}
                    <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                      {fmtBs(snapshot.binanceBuy * (1 + d / 100))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {matrix.map((row, rIdx) => {
                const bcvDelta = row[0].bcvDeltaPct;
                return (
                  <tr key={rIdx}>
                    <td className="border-r border-slate-200 bg-slate-50/70 px-3 py-2.5 text-left font-mono font-semibold text-slate-700 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                      {fmtPct(bcvDelta, 1, true)}
                      <div className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
                        {fmtBs(row[0].tasaBanco)}
                      </div>
                    </td>
                    {row.map((cell, cIdx) => {
                      const isCenter = cell.bcvDeltaPct === 0 && cell.p2pDeltaPct === 0;
                      const bgClass =
                        cell.roiPct >= 12
                          ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                          : cell.roiPct >= 5
                            ? 'bg-emerald-50/50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                            : cell.roiPct >= 0
                              ? 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200'
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300';

                      return (
                        <td
                          key={cIdx}
                          className={`px-3 py-2.5 font-mono transition ${bgClass} ${
                            isCenter ? 'ring-2 ring-[#0067b8] ring-inset dark:ring-sky-400' : ''
                          }`}
                        >
                          <div className="font-bold">{fmtPct(cell.roiPct, 2, true)}</div>
                          <div className="text-[10px] opacity-80">{fmtBs(cell.gananciaBs)} Bs</div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
