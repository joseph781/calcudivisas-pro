import { useMemo, useState } from 'react';
import {
  BookmarkPlus,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import { BANK_BY_ID, VENEZUELAN_BANKS } from '../data/banks';
import {
  calculateForwardArbitrage,
  calculateReverseArbitrage,
  calculateVwapFromOffers,
  compareBridgeRoutes,
  P2pOffer,
  rankAllBanks,
} from '../engine/arbitrage';
import { MarketSnapshot } from '../services/ratesApi';
import { OperationRecord } from '../types/operations';
import { fmtBs, fmtPct, fmtUsd } from '../utils/format';

interface ArbitrageTerminalProps {
  snapshot: MarketSnapshot;
  selectedBankId: string;
  onSelectBank: (bankId: string) => void;
  onLogOperation: (op: Omit<OperationRecord, 'id' | 'createdAt'>) => void;
}

type CalcMode = 'forward' | 'reverse';
type BankRateSource = 'bcv_usd' | 'bcv_eur' | 'manual';
type P2pRateSource = 'binance' | 'bybit' | 'manual';

export function ArbitrageTerminal({
  snapshot,
  selectedBankId,
  onSelectBank,
  onLogOperation,
}: ArbitrageTerminalProps) {
  const [mode, setMode] = useState<CalcMode>('forward');
  const [usdInput, setUsdInput] = useState<string>('100');
  const [bsInput, setBsInput] = useState<string>('100000');

  const [bankRateSource, setBankRateSource] = useState<BankRateSource>('bcv_usd');
  const [manualBankRate, setManualBankRate] = useState<string>(snapshot.bcvUsd.toFixed(2));

  const [p2pRateSource, setP2pRateSource] = useState<P2pRateSource>('binance');
  const [manualP2pRate, setManualP2pRate] = useState<string>(snapshot.binanceBuy.toFixed(2));

  const [p2pFeePct, setP2pFeePct] = useState<number>(0);
  const [customCardFeePct, setCustomCardFeePct] = useState<string>('');
  const [settlementDays, setSettlementDays] = useState<number>(0);
  const [dailyBcvDriftPct, setDailyBcvDriftPct] = useState<string>('0.25');
  const [justLogged, setJustLogged] = useState(false);

  const selectedBank = BANK_BY_ID[selectedBankId] ?? VENEZUELAN_BANKS[0];

  const tasaBanco = useMemo(() => {
    if (bankRateSource === 'bcv_usd') return snapshot.bcvUsd;
    if (bankRateSource === 'bcv_eur') return snapshot.bcvEur;
    return Math.max(0, parseFloat(manualBankRate) || 0);
  }, [bankRateSource, manualBankRate, snapshot.bcvEur, snapshot.bcvUsd]);

  const tasaP2P = useMemo(() => {
    if (p2pRateSource === 'binance') return snapshot.binanceBuy;
    if (p2pRateSource === 'bybit') return snapshot.bybitBuy;
    return Math.max(0, parseFloat(manualP2pRate) || 0);
  }, [p2pRateSource, manualP2pRate, snapshot.binanceBuy, snapshot.bybitBuy]);

  const parsedCustomCardFee = useMemo(() => {
    if (customCardFeePct.trim() === '') return undefined;
    const val = parseFloat(customCardFeePct);
    return Number.isFinite(val) && val >= 0 ? val / 100 : undefined;
  }, [customCardFeePct]);

  const parsedDrift = Math.max(0, parseFloat(dailyBcvDriftPct) || 0);

  const reverseResult = useMemo(() => {
    if (mode !== 'reverse') return null;
    const bsDisp = Math.max(0, parseFloat(bsInput) || 0);
    return calculateReverseArbitrage({
      bsDisponibles: bsDisp,
      tasaBanco,
      tasaP2P,
      bank: selectedBank,
      customCardFeePct: parsedCustomCardFee,
      p2pFeePct,
      settlementDays,
      dailyBcvDriftPct: parsedDrift,
    });
  }, [mode, bsInput, tasaBanco, tasaP2P, selectedBank, parsedCustomCardFee, p2pFeePct, settlementDays, parsedDrift]);

  const activeResult = useMemo(() => {
    if (mode === 'reverse' && reverseResult) {
      return reverseResult;
    }
    const usdAmount = Math.max(0, parseFloat(usdInput) || 0);
    return calculateForwardArbitrage({
      usdAmount: mode === 'reverse' ? 0 : usdAmount,
      tasaBanco,
      tasaP2P,
      bank: selectedBank,
      customCardFeePct: parsedCustomCardFee,
      p2pFeePct,
      settlementDays,
      dailyBcvDriftPct: parsedDrift,
    });
  }, [mode, reverseResult, usdInput, tasaBanco, tasaP2P, selectedBank, parsedCustomCardFee, p2pFeePct, settlementDays, parsedDrift]);

  const bridgeRoutes = useMemo(
    () =>
      compareBridgeRoutes({
        usdAmount: activeResult.usdAmount || 100,
        tasaBanco,
        tasaP2P,
        bank: selectedBank,
        customCardFeePct: parsedCustomCardFee,
        p2pFeePct,
        settlementDays,
        dailyBcvDriftPct: parsedDrift,
      }),
    [activeResult.usdAmount, tasaBanco, tasaP2P, selectedBank, parsedCustomCardFee, p2pFeePct, settlementDays, parsedDrift],
  );

  const simulatedBook: P2pOffer[] = useMemo(() => {
    const base = tasaP2P || snapshot.binanceBuy;
    return [
      { merchant: 'Mesa_Top1', price: base, availableUsdt: 450, minBs: 20000, maxBs: 500000, completionRatePct: 99.4, method: 'PagoMóvil' },
      { merchant: 'Desk_VE2', price: base * 0.997, availableUsdt: 850, minBs: 50000, maxBs: 1200000, completionRatePct: 99.1, method: 'Banesco' },
      { merchant: 'Liquidez_3', price: base * 0.994, availableUsdt: 1500, minBs: 100000, maxBs: 2500000, completionRatePct: 98.7, method: 'BDV' },
      { merchant: 'Mayorista_4', price: base * 0.99, availableUsdt: 4000, minBs: 250000, maxBs: 6000000, completionRatePct: 98.2, method: 'Mercantil' },
    ];
  }, [tasaP2P, snapshot.binanceBuy]);

  const vwapStats = useMemo(
    () => calculateVwapFromOffers(simulatedBook, Math.max(1, activeResult.netoUsdt)),
    [simulatedBook, activeResult.netoUsdt],
  );

  const bankRankings = useMemo(() => {
    const amountForRanking =
      mode === 'reverse'
        ? reverseResult?.usdAmount ??
          Math.max(100, Math.floor((parseFloat(bsInput) || 100000) / Math.max(1, tasaBanco)))
        : Math.max(1, parseFloat(usdInput) || 100);
    return rankAllBanks({
      usdAmount: amountForRanking,
      tasaBanco,
      tasaP2P,
      p2pFeePct,
    });
  }, [mode, reverseResult, bsInput, usdInput, tasaBanco, tasaP2P, p2pFeePct]);

  const isProfitable = activeResult.gananciaBs > 0;
  const totalOutlay = activeResult.totalInvertidoBs + activeResult.diferidoBs;
  const feeRatio =
    activeResult.retornoBs > 0
      ? Math.min(100, (activeResult.totalFeesBs / activeResult.retornoBs) * 100)
      : 0;
  const profitRatio =
    activeResult.retornoBs > 0 && activeResult.gananciaBs > 0
      ? Math.min(100, (activeResult.gananciaBs / activeResult.retornoBs) * 100)
      : 0;
  const principalRatio = Math.max(0, 100 - feeRatio - profitRatio);

  const handleLog = () => {
    if (activeResult.usdAmount <= 0) return;
    onLogOperation({
      bankId: selectedBank.id,
      bankName: selectedBank.shortName,
      usdAmount: activeResult.usdAmount,
      tasaBanco: activeResult.tasaBanco,
      tasaP2P: activeResult.tasaP2P,
      totalInvertidoBs: activeResult.totalInvertidoBs,
      netoUsdt: activeResult.netoUsdt,
      gananciaBs: activeResult.gananciaBs,
      gananciaUsdt: activeResult.gananciaUsdt,
      roiPct: activeResult.roiPct,
    });
    setJustLogged(true);
    window.setTimeout(() => setJustLogged(false), 2200);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT COLUMN: Controls & Parameters */}
        <div className="space-y-5 lg:col-span-5">
          {/* Mode & Amount Card */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
                Parámetros de Operación
              </h2>
              <div className="inline-flex rounded-md border border-slate-200 bg-slate-100 p-0.5 dark:border-slate-800 dark:bg-slate-950">
                <button
                  type="button"
                  onClick={() => setMode('forward')}
                  className={`rounded px-3 py-1 text-xs font-semibold transition ${
                    mode === 'forward'
                      ? 'bg-[#0067b8] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Compra USD
                </button>
                <button
                  type="button"
                  onClick={() => setMode('reverse')}
                  className={`rounded px-3 py-1 text-xs font-semibold transition ${
                    mode === 'reverse'
                      ? 'bg-[#0067b8] text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  Capital en Bs
                </button>
              </div>
            </div>

            {mode === 'forward' ? (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Monto a comprar en el banco (USD)
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-mono text-sm font-semibold text-slate-400">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={usdInput}
                    onChange={(e) => setUsdInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-16 pl-8 font-mono text-lg font-semibold text-slate-900 outline-none transition focus:border-[#0067b8] focus:ring-2 focus:ring-[#0067b8]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="100"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400">
                    USD
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[50, 100, 200, 500, 1000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUsdInput(String(preset))}
                      className={`rounded-md border px-2.5 py-1 font-mono text-xs font-medium transition ${
                        Number(usdInput) === preset
                          ? 'border-[#0067b8] bg-blue-50 text-[#0067b8] dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      ${preset}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Bolívares disponibles para invertir (Bs)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="100"
                    step="any"
                    value={bsInput}
                    onChange={(e) => setBsInput(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-12 pl-3.5 font-mono text-lg font-semibold text-slate-900 outline-none transition focus:border-[#0067b8] focus:ring-2 focus:ring-[#0067b8]/20 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="100000"
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400">
                    Bs
                  </span>
                </div>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {[50000, 100000, 250000, 500000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setBsInput(String(preset))}
                      className={`rounded-md border px-2.5 py-1 font-mono text-xs font-medium transition ${
                        Number(bsInput) === preset
                          ? 'border-[#0067b8] bg-blue-50 text-[#0067b8] dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400'
                      }`}
                    >
                      {(preset / 1000).toFixed(0)}k Bs
                    </button>
                  ))}
                </div>
                {reverseResult && (
                  <p className="mt-2.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs text-slate-700 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-200">
                    Alcanza para comprar{' '}
                    <span className="font-mono font-bold text-[#0067b8] dark:text-white">
                      ${reverseResult.usdAmount} USD
                    </span>{' '}
                    y te sobran{' '}
                    <span className="font-mono font-semibold">
                      {fmtBs(reverseResult.sobranteBs)} Bs
                    </span>
                    .
                  </p>
                )}
              </div>
            )}

            {/* Rates Configuration */}
            <div className="mt-5 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800/80">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Tasa de Compra (Banco)
                </label>
                <div className="mb-1.5 flex gap-1">
                  {(['bcv_usd', 'bcv_eur', 'manual'] as const).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setBankRateSource(src)}
                      className={`flex-1 rounded border py-1 text-[11px] font-semibold transition ${
                        bankRateSource === src
                          ? 'border-[#0067b8] bg-blue-50 text-[#0067b8] dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                    >
                      {src === 'bcv_usd' ? 'BCV $' : src === 'bcv_eur' ? 'BCV €' : 'Manual'}
                    </button>
                  ))}
                </div>
                {bankRateSource === 'manual' ? (
                  <input
                    type="number"
                    step="0.01"
                    value={manualBankRate}
                    onChange={(e) => setManualBankRate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-semibold text-slate-900 outline-none focus:border-[#0067b8] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                ) : (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm font-semibold text-slate-900 dark:border-slate-800 dark:bg-slate-950/70 dark:text-sky-300">
                    {fmtBs(tasaBanco, 2)} Bs
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Tasa de Venta (P2P)
                </label>
                <div className="mb-1.5 flex gap-1">
                  {(['binance', 'bybit', 'manual'] as const).map((src) => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => setP2pRateSource(src)}
                      className={`flex-1 rounded border py-1 text-[11px] font-semibold transition ${
                        p2pRateSource === src
                          ? 'border-[#0067b8] bg-blue-50 text-[#0067b8] dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                    >
                      {src === 'binance' ? 'Binance' : src === 'bybit' ? 'Bybit' : 'Manual'}
                    </button>
                  ))}
                </div>
                {p2pRateSource === 'manual' ? (
                  <input
                    type="number"
                    step="0.01"
                    value={manualP2pRate}
                    onChange={(e) => setManualP2pRate(e.target.value)}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-sm font-semibold text-slate-900 outline-none focus:border-[#0067b8] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  />
                ) : (
                  <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-sm font-semibold text-[#0067b8] dark:border-slate-800 dark:bg-slate-950/70 dark:text-sky-300">
                    {fmtBs(tasaP2P, 2)} Bs
                  </div>
                )}
              </div>
            </div>

            {/* P2P Fee & Card Override */}
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800/80">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Comisión P2P / Anuncio (%)
                </label>
                <div className="flex gap-1.5">
                  {[0, 0.1, 0.2, 0.35].map((fee) => (
                    <button
                      key={fee}
                      type="button"
                      onClick={() => setP2pFeePct(fee)}
                      className={`flex-1 rounded-md border py-1.5 font-mono text-xs font-semibold transition ${
                        p2pFeePct === fee
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-500/15 dark:text-emerald-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                    >
                      {fee}%
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Override Tarjeta / Puente (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.1"
                  value={customCardFeePct}
                  onChange={(e) => setCustomCardFeePct(e.target.value)}
                  placeholder={`Default (${(selectedBank.pctFija * 100).toFixed(1)}%)`}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 placeholder-slate-400 outline-none focus:border-[#0067b8] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:placeholder-slate-600"
                />
              </div>
            </div>

            {/* Temporal Cycle T+N & BCV Drift */}
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 dark:border-slate-800/80">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Ciclo de Liquidación
                </label>
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((days) => (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setSettlementDays(days)}
                      className={`flex-1 rounded-md border py-1.5 font-mono text-xs font-semibold transition ${
                        settlementDays === days
                          ? 'border-[#0067b8] bg-blue-50 text-[#0067b8] dark:border-sky-500/60 dark:bg-sky-500/15 dark:text-sky-300'
                          : 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400'
                      }`}
                    >
                      T+{days}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                  Deriva BCV Estimada (%/día)
                </label>
                <input
                  type="number"
                  min="0"
                  max="5"
                  step="0.05"
                  value={dailyBcvDriftPct}
                  onChange={(e) => setDailyBcvDriftPct(e.target.value)}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-1.5 font-mono text-xs text-slate-900 outline-none focus:border-[#0067b8] dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                />
              </div>
            </div>
          </section>

          {/* Bank Selector Grid */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
                Banco Emisor (14)
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Compra:{' '}
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {(selectedBank.comisionCompra * 100).toFixed(1)}%
                </span>{' '}
                · Tarjeta:{' '}
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {(selectedBank.pctFija * 100).toFixed(1)}%
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VENEZUELAN_BANKS.map((bank) => {
                const isSelected = bank.id === selectedBank.id;
                const totalFee =
                  (bank.comisionCompra +
                    bank.pctFija +
                    (bank.pctRecarga ?? 0) +
                    (bank.pctBsDiferido ?? 0)) *
                  100;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => onSelectBank(bank.id)}
                    style={{ borderTopColor: bank.accentColor }}
                    className={`flex flex-col items-start rounded-lg border border-t-2 p-2.5 text-left transition ${
                      isSelected
                        ? 'border-[#0067b8] bg-blue-50/70 dark:border-sky-500/70 dark:bg-sky-500/10'
                        : 'border-slate-200 bg-slate-50/60 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      {bank.shortName}
                    </span>
                    <span className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      Costo ~{totalFee.toFixed(1)}%
                    </span>
                  </button>
                );
              })}
            </div>

            {selectedBank.note && (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0067b8] dark:text-sky-400" />
                <span>{selectedBank.note}</span>
              </div>
            )}
          </section>
        </div>

        {/* RIGHT COLUMN: Results, Waterfall & Multi-Bank Ranking */}
        <div className="space-y-5 lg:col-span-7">
          {/* KPI Hero Strip */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div
              className={`rounded-xl border p-4 ${
                isProfitable
                  ? 'border-emerald-200 bg-emerald-50/60 dark:border-emerald-500/35 dark:bg-emerald-500/10'
                  : 'border-rose-200 bg-rose-50/60 dark:border-rose-500/35 dark:bg-rose-500/10'
              }`}
            >
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Ganancia Neta
              </span>
              <div
                className={`mt-1 font-mono text-xl font-bold ${
                  isProfitable
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-rose-700 dark:text-rose-300'
                }`}
              >
                {fmtBs(activeResult.gananciaBs)} Bs
              </div>
              <div className="mt-0.5 font-mono text-xs text-slate-600 dark:text-slate-300">
                {fmtUsd(activeResult.gananciaUsdt)} USDT
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/75">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                ROI Neto
              </span>
              <div
                className={`mt-1 font-mono text-xl font-bold ${
                  activeResult.roiPct >= 0
                    ? 'text-[#0067b8] dark:text-sky-400'
                    : 'text-rose-600 dark:text-rose-300'
                }`}
              >
                {fmtPct(activeResult.roiPct, 2, true)}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Brecha: <span className="font-mono">{fmtPct(activeResult.brechaBrutaPct)}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/75">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Break-Even P2P
              </span>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-slate-100">
                {fmtBs(activeResult.breakEvenP2pRate, 2)}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Tasa mínima sin pérdida
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/75">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                Neto Recibido
              </span>
              <div className="mt-1 font-mono text-xl font-bold text-slate-900 dark:text-sky-300">
                {activeResult.netoUsdt.toFixed(2)}
              </div>
              <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">USDT en P2P</div>
            </div>
          </div>

          {/* Waterfall Breakdown + Action */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
                  Desglose de Flujo — {selectedBank.name}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Auditoría paso a paso desde Bolívares hasta USDT liquidado
                </p>
              </div>
              <button
                type="button"
                onClick={handleLog}
                disabled={activeResult.usdAmount <= 0}
                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition ${
                  justLogged
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0067b8] text-white hover:bg-[#00569c] disabled:opacity-40'
                }`}
              >
                {justLogged ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Registrada en Bitácora
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="h-4 w-4" />
                    Registrar Operación
                  </>
                )}
              </button>
            </div>

            {/* Visual Composition Bar */}
            <div className="mb-4">
              <div className="mb-1.5 flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Distribución del Retorno ({fmtBs(activeResult.retornoBs)} Bs)</span>
                <span className="font-mono">
                  Comisiones totales: {fmtBs(activeResult.totalFeesBs)} Bs
                </span>
              </div>
              <div className="flex h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                <div
                  style={{ width: `${principalRatio}%` }}
                  className="bg-[#0067b8] transition-all duration-300"
                />
                <div
                  style={{ width: `${feeRatio}%` }}
                  className="bg-rose-500 transition-all duration-300"
                />
                <div
                  style={{ width: `${profitRatio}%` }}
                  className="bg-emerald-500 transition-all duration-300"
                />
              </div>
              <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0067b8]" /> Capital Base
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500" /> Comisiones
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" /> Ganancia Neta
                </span>
              </div>
            </div>

            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200 bg-slate-50/60 text-xs dark:divide-slate-800/70 dark:border-slate-800 dark:bg-slate-950/50">
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-slate-600 dark:text-slate-400">
                  1. Compra base ({activeResult.usdAmount} USD × {fmtBs(activeResult.tasaBanco)})
                </span>
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-200">
                  {fmtBs(activeResult.costoBaseBs)} Bs
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-slate-600 dark:text-slate-400">
                  2. Comisión compra bancaria ({(selectedBank.comisionCompra * 100).toFixed(1)}%)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-300">
                  +{fmtBs(activeResult.comisionBancoBs)} Bs
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  Total Capital Invertido
                </span>
                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                  {fmtBs(totalOutlay)} Bs
                </span>
              </div>
              {(activeResult.comisionRecargaUsd > 0 || activeResult.comisionTarjetaUsd > 0) && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-slate-600 dark:text-slate-400">
                    3. Comisión tarjeta / recarga
                  </span>
                  <span className="font-mono text-rose-600 dark:text-rose-300">
                    -{(activeResult.comisionRecargaUsd + activeResult.comisionTarjetaUsd).toFixed(2)}{' '}
                    USD
                  </span>
                </div>
              )}
              {activeResult.diferidoBs > 0 && (
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-slate-600 dark:text-slate-400">
                    3b. Cargo diferido en Bs ({((selectedBank.pctBsDiferido ?? 0) * 100).toFixed(1)}
                    %)
                  </span>
                  <span className="font-mono text-rose-600 dark:text-rose-300">
                    +{fmtBs(activeResult.diferidoBs)} Bs
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between px-4 py-2.5">
                <span className="text-slate-600 dark:text-slate-400">
                  4. Comisión P2P ({p2pFeePct}%)
                </span>
                <span className="font-mono text-rose-600 dark:text-rose-300">
                  -{activeResult.comisionP2pUsdt.toFixed(2)} USDT
                </span>
              </div>
              <div className="flex items-center justify-between bg-slate-100/80 px-4 py-2.5 dark:bg-slate-900/60">
                <span className="font-medium text-slate-800 dark:text-slate-300">
                  5. Retorno bruto ({activeResult.netoUsdt.toFixed(2)} USDT ×{' '}
                  {fmtBs(activeResult.tasaP2P)})
                </span>
                <span className="font-mono font-bold text-[#0067b8] dark:text-sky-300">
                  {fmtBs(activeResult.retornoBs)} Bs
                </span>
              </div>
            </div>

            {!isProfitable && activeResult.usdAmount > 0 && (
              <div className="mt-3 flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200">
                <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>
                  Operación en pérdida con este banco y tasa. Necesitas vender en P2P por encima de{' '}
                  <strong className="font-mono">{fmtBs(activeResult.breakEvenP2pRate)} Bs</strong>{' '}
                  para cubrir costos.
                </span>
              </div>
            )}
          </section>

          {/* Multi-Bank Ranking Matrix */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
                Ranking Multi-Banco en Vivo
              </h2>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Haz clic en cualquier fila para seleccionar ese banco
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                  <tr>
                    <th className="px-3 py-2.5">#</th>
                    <th className="px-3 py-2.5">Banco</th>
                    <th className="px-3 py-2.5 text-right">Neto USDT</th>
                    <th className="px-3 py-2.5 text-right">Ganancia (Bs)</th>
                    <th className="px-3 py-2.5 text-right">ROI</th>
                    <th className="hidden px-3 py-2.5 text-right sm:table-cell">vs #1</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {bankRankings.map((item) => {
                    const isCurrent = item.bank.id === selectedBank.id;
                    return (
                      <tr
                        key={item.bank.id}
                        onClick={() => onSelectBank(item.bank.id)}
                        className={`cursor-pointer transition ${
                          isCurrent
                            ? 'bg-blue-50/70 dark:bg-sky-500/10'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">
                          {item.rank === 1 ? (
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-100 font-bold text-[#0067b8] dark:bg-sky-500/20 dark:text-sky-300">
                              1
                            </span>
                          ) : (
                            item.rank
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.bank.accentColor }}
                            />
                            <span className="font-medium text-slate-900 dark:text-slate-200">
                              {item.bank.shortName}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-slate-700 dark:text-slate-300">
                          {item.result.netoUsdt.toFixed(2)}
                        </td>
                        <td
                          className={`px-3 py-2 text-right font-mono font-semibold ${
                            item.result.gananciaBs >= 0
                              ? 'text-emerald-700 dark:text-emerald-300'
                              : 'text-rose-600 dark:text-rose-300'
                          }`}
                        >
                          {fmtBs(item.result.gananciaBs)}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">
                          <span
                            className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${
                              item.result.roiPct >= 0
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300'
                            }`}
                          >
                            {fmtPct(item.result.roiPct, 2, true)}
                          </span>
                        </td>
                        <td className="hidden px-3 py-2 text-right font-mono text-slate-500 sm:table-cell dark:text-slate-400">
                          {item.rank === 1 ? 'Óptimo' : `${fmtBs(item.deltaFromBestBs)} Bs`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Bridge Routes & VWAP Depth */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
                  Rutas Puente vs Directa
                </h2>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  ROI diario: {fmtPct(activeResult.dailyRoiPct, 2, true)}
                </span>
              </div>
              <div className="space-y-2">
                {bridgeRoutes.map((r, idx) => (
                  <div
                    key={r.id}
                    className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs ${
                      idx === 0
                        ? 'border-[#0067b8]/40 bg-blue-50/50 dark:border-sky-500/40 dark:bg-sky-500/10'
                        : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {r.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Fee {r.bridgeFeePct.toFixed(1)}%
                      </div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="font-bold text-emerald-700 dark:text-emerald-300">
                        {fmtBs(r.gananciaBs)} Bs
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {fmtPct(r.roiPct, 2, true)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/75">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
                  Profundidad P2P &amp; Slippage
                </h2>
                <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                  VWAP ({vwapStats.offersUsed} ofertas)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Precio Ponderado
                  </span>
                  <div className="mt-0.5 font-mono text-sm font-bold text-[#0067b8] dark:text-sky-300">
                    {fmtBs(vwapStats.vwapPrice)} Bs
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Slippage Estimado
                  </span>
                  <div className="mt-0.5 font-mono text-sm font-bold text-slate-900 dark:text-slate-100">
                    {fmtPct(vwapStats.slippagePct, 3)}
                  </div>
                </div>
                <div className="col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-2.5 dark:border-slate-800 dark:bg-slate-950/60">
                  <div className="flex justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>Ganancia ajustada (T+{activeResult.settlementDays})</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {fmtBs(activeResult.riskAdjustedProfitBs)} Bs (
                      {fmtPct(activeResult.riskAdjustedRoiPct, 2, true)})
                    </span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
