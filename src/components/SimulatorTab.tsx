import { useMemo, useState } from 'react';
import { Sliders, Grid3X3 } from 'lucide-react';
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
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              Simulador de Estrés — {bank.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => {
              setBcvShiftPct(0);
              setP2pShiftPct(0);
            }}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300 hover:bg-slate-700"
          >
            Restablecer (0%)
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
          <div>
            <label className="mb-1.5 flex justify-between text-xs text-slate-400">
              <span>Monto Base (USD)</span>
              <span className="font-mono font-semibold text-slate-200">${usdAmount}</span>
            </label>
            <input
              type="range"
              min="50"
              max="2000"
              step="50"
              value={usdAmount}
              onChange={(e) => setUsdAmount(Number(e.target.value))}
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex justify-between text-xs text-slate-400">
              <span>Variación BCV</span>
              <span className="font-mono font-semibold text-sky-300">
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
              className="w-full accent-sky-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex justify-between text-xs text-slate-400">
              <span>Variación P2P</span>
              <span className="font-mono font-semibold text-amber-300">
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
              className="w-full accent-amber-500"
            />
          </div>

          <div>
            <label className="mb-1.5 flex justify-between text-xs text-slate-400">
              <span>Comisión P2P</span>
              <span className="font-mono font-semibold text-emerald-300">{p2pFeePct}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={p2pFeePct}
              onChange={(e) => setP2pFeePct(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 border-t border-slate-800 pt-4 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[11px] text-slate-400">Ganancia Simulada</span>
            <div
              className={`mt-1 font-mono text-base font-bold ${
                simResult.gananciaBs >= 0 ? 'text-emerald-300' : 'text-rose-300'
              }`}
            >
              {fmtBs(simResult.gananciaBs)} Bs
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[11px] text-slate-400">Equivalente USDT</span>
            <div className="mt-1 font-mono text-base font-bold text-slate-100">
              {fmtUsd(simResult.gananciaUsdt)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[11px] text-slate-400">ROI Simulado</span>
            <div className="mt-1 font-mono text-base font-bold text-amber-300">
              {fmtPct(simResult.roiPct, 2, true)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3">
            <span className="text-[11px] text-slate-400">Brecha Simulada</span>
            <div className="mt-1 font-mono text-base font-bold text-sky-300">
              {fmtPct(simResult.brechaBrutaPct)}
            </div>
          </div>
        </div>
      </section>

      {/* 5x5 Sensitivity Heatmap */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 shadow-xl shadow-black/20">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Grid3X3 className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              Matriz de Sensibilidad (BCV vs P2P)
            </h2>
          </div>
          <span className="text-xs text-slate-400">
            Filas: variación BCV · Columnas: variación P2P · Monto: ${usdAmount} USD
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-center text-xs">
            <thead className="bg-slate-950 text-[11px] font-semibold text-slate-400">
              <tr>
                <th className="border-b border-r border-slate-800 px-3 py-2.5 text-left">
                  BCV \ P2P
                </th>
                {p2pHeaders.map((d) => (
                  <th key={d} className="border-b border-slate-800 px-3 py-2.5 font-mono">
                    {fmtPct(d, 1, true)}
                    <div className="text-[10px] font-normal text-slate-500">
                      {fmtBs(snapshot.binanceBuy * (1 + d / 100))}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {matrix.map((row, rIdx) => {
                const bcvDelta = row[0].bcvDeltaPct;
                return (
                  <tr key={rIdx}>
                    <td className="border-r border-slate-800 bg-slate-950/70 px-3 py-2.5 text-left font-mono font-semibold text-slate-300">
                      {fmtPct(bcvDelta, 1, true)}
                      <div className="text-[10px] font-normal text-slate-500">
                        {fmtBs(row[0].tasaBanco)}
                      </div>
                    </td>
                    {row.map((cell, cIdx) => {
                      const isCenter = cell.bcvDeltaPct === 0 && cell.p2pDeltaPct === 0;
                      const bgClass =
                        cell.roiPct >= 12
                          ? 'bg-emerald-500/20 text-emerald-200'
                          : cell.roiPct >= 5
                            ? 'bg-emerald-500/10 text-emerald-300'
                            : cell.roiPct >= 0
                              ? 'bg-amber-500/10 text-amber-200'
                              : 'bg-rose-500/15 text-rose-300';

                      return (
                        <td
                          key={cIdx}
                          className={`px-3 py-2.5 font-mono transition ${bgClass} ${
                            isCenter ? 'ring-2 ring-inset ring-amber-400/80' : ''
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
