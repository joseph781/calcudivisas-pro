import { BankConfig, VENEZUELAN_BANKS } from '../data/banks';

export interface ArbitrageInput {
  /** Amount in USD bought at the bank */
  usdAmount: number;
  /** Bank / BCV exchange rate (Bs per USD) */
  tasaBanco: number;
  /** P2P sell rate (Bs per USDT) */
  tasaP2P: number;
  /** Bank configuration */
  bank: BankConfig;
  /** Optional override for card/bridge fee (0..1, e.g. 0.025 = 2.5%) */
  customCardFeePct?: number;
  /** P2P platform/BPay sell fee in percent (e.g. 0.35 = 0.35%) */
  p2pFeePct: number;
}

export interface ArbitrageResult {
  usdAmount: number;
  tasaBanco: number;
  tasaP2P: number;
  costoBaseBs: number;
  comisionBancoBs: number;
  totalInvertidoBs: number;
  comisionRecargaUsd: number;
  enTarjetaUsd: number;
  comisionTarjetaUsd: number;
  enBinanceUsdt: number;
  comisionP2pUsdt: number;
  netoUsdt: number;
  retornoBs: number;
  diferidoBs: number;
  gananciaBs: number;
  gananciaUsdt: number;
  roiPct: number;
  /** Minimum P2P rate (Bs/USDT) required to break even (0 Bs profit) */
  breakEvenP2pRate: number;
  /** Effective cost in Bs per net USDT obtained */
  effectiveCostPerUsdt: number;
  /** Gross market spread % between P2P and Bank rate */
  brechaBrutaPct: number;
  /** Net yield % after all bank, card, and P2P fees */
  brechaNetaPct: number;
  totalFeesBs: number;
}

export interface ReverseArbitrageInput {
  bsDisponibles: number;
  tasaBanco: number;
  tasaP2P: number;
  bank: BankConfig;
  customCardFeePct?: number;
  p2pFeePct: number;
}

export interface ReverseArbitrageResult extends ArbitrageResult {
  bsDisponibles: number;
  sobranteBs: number;
}

export interface BankRankingItem {
  bank: BankConfig;
  result: ArbitrageResult;
  rank: number;
  deltaFromBestBs: number;
}

export function getEffectiveCardFee(bank: BankConfig, customCardFeePct?: number): number {
  if (typeof customCardFeePct === 'number' && !Number.isNaN(customCardFeePct)) {
    return Math.max(0, customCardFeePct);
  }
  return bank.pctFija;
}

export function calculateForwardArbitrage(input: ArbitrageInput): ArbitrageResult {
  const { usdAmount, tasaBanco, tasaP2P, bank, customCardFeePct, p2pFeePct } = input;

  if (usdAmount <= 0 || tasaBanco <= 0 || tasaP2P <= 0) {
    return {
      usdAmount: 0,
      tasaBanco,
      tasaP2P,
      costoBaseBs: 0,
      comisionBancoBs: 0,
      totalInvertidoBs: 0,
      comisionRecargaUsd: 0,
      enTarjetaUsd: 0,
      comisionTarjetaUsd: 0,
      enBinanceUsdt: 0,
      comisionP2pUsdt: 0,
      netoUsdt: 0,
      retornoBs: 0,
      diferidoBs: 0,
      gananciaBs: 0,
      gananciaUsdt: 0,
      roiPct: 0,
      breakEvenP2pRate: 0,
      effectiveCostPerUsdt: 0,
      brechaBrutaPct: tasaBanco > 0 ? ((tasaP2P - tasaBanco) / tasaBanco) * 100 : 0,
      brechaNetaPct: 0,
      totalFeesBs: 0,
    };
  }

  const costoBaseBs = usdAmount * tasaBanco;
  const comisionBancoBs = costoBaseBs * bank.comisionCompra;
  const totalInvertidoBs = costoBaseBs + comisionBancoBs;

  const pctRecarga = bank.pctRecarga ?? 0;
  const comisionRecargaUsd = usdAmount * pctRecarga;
  const enTarjetaUsd = usdAmount - comisionRecargaUsd;

  const pctTarjeta = getEffectiveCardFee(bank, customCardFeePct);
  const comisionTarjetaUsd = enTarjetaUsd * pctTarjeta;
  const enBinanceUsdt = enTarjetaUsd - comisionTarjetaUsd;

  const p2pFeeRatio = Math.max(0, p2pFeePct) / 100;
  const comisionP2pUsdt = enBinanceUsdt * p2pFeeRatio;
  const netoUsdt = enBinanceUsdt - comisionP2pUsdt;

  const retornoBs = netoUsdt * tasaP2P;
  const diferidoBs = usdAmount * (bank.pctBsDiferido ?? 0) * tasaBanco;
  const totalOutlayBs = totalInvertidoBs + diferidoBs;

  const gananciaBs = retornoBs - totalOutlayBs;
  const gananciaUsdt = tasaP2P > 0 ? gananciaBs / tasaP2P : 0;
  const roiPct = totalOutlayBs > 0 ? (gananciaBs / totalOutlayBs) * 100 : 0;

  const breakEvenP2pRate = netoUsdt > 0 ? totalOutlayBs / netoUsdt : 0;
  const effectiveCostPerUsdt = breakEvenP2pRate;
  const brechaBrutaPct = ((tasaP2P - tasaBanco) / tasaBanco) * 100;
  const brechaNetaPct = roiPct;

  const totalFeesBs =
    comisionBancoBs +
    diferidoBs +
    (comisionRecargaUsd + comisionTarjetaUsd + comisionP2pUsdt) * tasaP2P;

  return {
    usdAmount,
    tasaBanco,
    tasaP2P,
    costoBaseBs,
    comisionBancoBs,
    totalInvertidoBs,
    comisionRecargaUsd,
    enTarjetaUsd,
    comisionTarjetaUsd,
    enBinanceUsdt,
    comisionP2pUsdt,
    netoUsdt,
    retornoBs,
    diferidoBs,
    gananciaBs,
    gananciaUsdt,
    roiPct,
    breakEvenP2pRate,
    effectiveCostPerUsdt,
    brechaBrutaPct,
    brechaNetaPct,
    totalFeesBs,
  };
}

export function calculateReverseArbitrage(input: ReverseArbitrageInput): ReverseArbitrageResult | null {
  const { bsDisponibles, tasaBanco, tasaP2P, bank, customCardFeePct, p2pFeePct } = input;
  if (bsDisponibles <= 0 || tasaBanco <= 0 || tasaP2P <= 0) return null;

  const unitCostBs = (1 + bank.comisionCompra) * tasaBanco;
  const usdMax = Math.floor(bsDisponibles / unitCostBs);
  if (usdMax <= 0) return null;

  const forward = calculateForwardArbitrage({
    usdAmount: usdMax,
    tasaBanco,
    tasaP2P,
    bank,
    customCardFeePct,
    p2pFeePct,
  });

  return {
    ...forward,
    bsDisponibles,
    sobranteBs: bsDisponibles - forward.totalInvertidoBs,
  };
}

export function rankAllBanks(params: {
  usdAmount: number;
  tasaBanco: number;
  tasaP2P: number;
  p2pFeePct: number;
  banks?: BankConfig[];
}): BankRankingItem[] {
  const list = params.banks ?? VENEZUELAN_BANKS;
  const computed = list.map((bank) => ({
    bank,
    result: calculateForwardArbitrage({
      usdAmount: params.usdAmount,
      tasaBanco: params.tasaBanco,
      tasaP2P: params.tasaP2P,
      bank,
      p2pFeePct: params.p2pFeePct,
    }),
  }));

  computed.sort((a, b) => b.result.gananciaBs - a.result.gananciaBs);
  const bestProfit = computed[0]?.result.gananciaBs ?? 0;

  return computed.map((item, idx) => ({
    bank: item.bank,
    result: item.result,
    rank: idx + 1,
    deltaFromBestBs: item.result.gananciaBs - bestProfit,
  }));
}

export interface SensitivityCell {
  bcvDeltaPct: number;
  p2pDeltaPct: number;
  tasaBanco: number;
  tasaP2P: number;
  gananciaBs: number;
  roiPct: number;
}

export function buildSensitivityMatrix(
  baseInput: ArbitrageInput,
  bcvDeltasPct: number[] = [-3, -1.5, 0, 1.5, 3],
  p2pDeltasPct: number[] = [-3, -1.5, 0, 1.5, 3],
): SensitivityCell[][] {
  return bcvDeltasPct.map((bcvDelta) =>
    p2pDeltasPct.map((p2pDelta) => {
      const tasaBanco = baseInput.tasaBanco * (1 + bcvDelta / 100);
      const tasaP2P = baseInput.tasaP2P * (1 + p2pDelta / 100);
      const res = calculateForwardArbitrage({
        ...baseInput,
        tasaBanco,
        tasaP2P,
      });
      return {
        bcvDeltaPct: bcvDelta,
        p2pDeltaPct: p2pDelta,
        tasaBanco,
        tasaP2P,
        gananciaBs: res.gananciaBs,
        roiPct: res.roiPct,
      };
    }),
  );
}
