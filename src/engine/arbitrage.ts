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
  /** Settlement cycle in days (T+0 = 0, T+1 = 1, T+2 = 2) */
  settlementDays?: number;
  /** Expected daily BCV drift % during lockup (e.g. 0.25 = 0.25%/day) */
  dailyBcvDriftPct?: number;
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
  /** Temporal risk metrics (T+N) */
  settlementDays: number;
  dailyRoiPct: number;
  devaluationDragBs: number;
  riskAdjustedProfitBs: number;
  riskAdjustedRoiPct: number;
}

export interface ReverseArbitrageInput {
  bsDisponibles: number;
  tasaBanco: number;
  tasaP2P: number;
  bank: BankConfig;
  customCardFeePct?: number;
  p2pFeePct: number;
  settlementDays?: number;
  dailyBcvDriftPct?: number;
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

export interface BridgeRoute {
  id: 'direct' | 'zinli' | 'mercantil_panama' | 'wally';
  name: string;
  description: string;
  /** Fee % applied at the wallet/bridge hop */
  bridgeFeePct: number;
  /** Extra P2P premium/discount % when selling via this bridge */
  p2pSpreadAdjPct: number;
  netoUsdt: number;
  gananciaBs: number;
  roiPct: number;
  deltaVsDirectBs: number;
}

export interface P2pOffer {
  merchant: string;
  price: number;
  availableUsdt: number;
  minBs: number;
  maxBs: number;
  completionRatePct: number;
  method: string;
}

export interface VwapSlippageResult {
  requestedUsdt: number;
  filledUsdt: number;
  unfilledUsdt: number;
  topPrice: number;
  vwapPrice: number;
  slippagePct: number;
  offersUsed: number;
}

export function getEffectiveCardFee(bank: BankConfig, customCardFeePct?: number): number {
  if (typeof customCardFeePct === 'number' && !Number.isNaN(customCardFeePct)) {
    return Math.max(0, customCardFeePct);
  }
  return bank.pctFija;
}

export function calculateForwardArbitrage(input: ArbitrageInput): ArbitrageResult {
  const {
    usdAmount,
    tasaBanco,
    tasaP2P,
    bank,
    customCardFeePct,
    p2pFeePct,
    settlementDays = 0,
    dailyBcvDriftPct = 0.25,
  } = input;

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
      settlementDays,
      dailyRoiPct: 0,
      devaluationDragBs: 0,
      riskAdjustedProfitBs: 0,
      riskAdjustedRoiPct: 0,
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

  const cycleDays = Math.max(0, settlementDays);
  const effectiveDays = Math.max(1, cycleDays);
  const dailyRoiPct = roiPct / effectiveDays;
  const devaluationDragBs =
    cycleDays > 0 ? totalOutlayBs * (Math.max(0, dailyBcvDriftPct) / 100) * cycleDays : 0;
  const riskAdjustedProfitBs = gananciaBs - devaluationDragBs;
  const riskAdjustedRoiPct = totalOutlayBs > 0 ? (riskAdjustedProfitBs / totalOutlayBs) * 100 : 0;

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
    settlementDays: cycleDays,
    dailyRoiPct,
    devaluationDragBs,
    riskAdjustedProfitBs,
    riskAdjustedRoiPct,
  };
}

export function calculateReverseArbitrage(input: ReverseArbitrageInput): ReverseArbitrageResult | null {
  const { bsDisponibles, tasaBanco, tasaP2P, bank, customCardFeePct, p2pFeePct, settlementDays, dailyBcvDriftPct } = input;
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
    settlementDays,
    dailyBcvDriftPct,
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
  settlementDays?: number;
  dailyBcvDriftPct?: number;
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
      settlementDays: params.settlementDays,
      dailyBcvDriftPct: params.dailyBcvDriftPct,
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

export function compareBridgeRoutes(input: ArbitrageInput): BridgeRoute[] {
  const direct = calculateForwardArbitrage(input);

  const bridges: Array<{
    id: BridgeRoute['id'];
    name: string;
    description: string;
    bridgeFeePct: number;
    p2pSpreadAdjPct: number;
  }> = [
    {
      id: 'direct',
      name: 'Tarjeta Nacional Directa',
      description: `Compra en ${input.bank.shortName} y uso directo en P2P`,
      bridgeFeePct: getEffectiveCardFee(input.bank, input.customCardFeePct) * 100,
      p2pSpreadAdjPct: 0,
    },
    {
      id: 'zinli',
      name: 'Puente Zinli',
      description: 'Recarga Zinli + intercambio USD→USDT en P2P',
      bridgeFeePct: 1.9,
      p2pSpreadAdjPct: -0.6,
    },
    {
      id: 'mercantil_panama',
      name: 'Mercantil Panamá (Mony)',
      description: 'Transferencia Mony + venta P2P USD→USDT',
      bridgeFeePct: 0.5,
      p2pSpreadAdjPct: -0.9,
    },
    {
      id: 'wally',
      name: 'Puente Wally Tech',
      description: 'Fondeo tarjeta internacional + P2P USD',
      bridgeFeePct: 2.2,
      p2pSpreadAdjPct: -0.5,
    },
  ];

  return bridges
    .map((b) => {
      if (b.id === 'direct') {
        return {
          ...b,
          netoUsdt: direct.netoUsdt,
          gananciaBs: direct.gananciaBs,
          roiPct: direct.roiPct,
          deltaVsDirectBs: 0,
        };
      }
      const res = calculateForwardArbitrage({
        ...input,
        customCardFeePct: b.bridgeFeePct / 100,
        tasaP2P: input.tasaP2P * (1 + b.p2pSpreadAdjPct / 100),
      });
      return {
        ...b,
        netoUsdt: res.netoUsdt,
        gananciaBs: res.gananciaBs,
        roiPct: res.roiPct,
        deltaVsDirectBs: res.gananciaBs - direct.gananciaBs,
      };
    })
    .sort((a, b) => b.gananciaBs - a.gananciaBs);
}

export function calculateVwapFromOffers(
  offers: P2pOffer[],
  requestedUsdt: number,
): VwapSlippageResult {
  if (offers.length === 0 || requestedUsdt <= 0) {
    return {
      requestedUsdt,
      filledUsdt: 0,
      unfilledUsdt: Math.max(0, requestedUsdt),
      topPrice: 0,
      vwapPrice: 0,
      slippagePct: 0,
      offersUsed: 0,
    };
  }

  const sorted = [...offers].sort((a, b) => b.price - a.price);
  const topPrice = sorted[0].price;
  let remaining = requestedUsdt;
  let totalBs = 0;
  let filled = 0;
  let offersUsed = 0;

  for (const offer of sorted) {
    if (remaining <= 0) break;
    const take = Math.min(remaining, Math.max(0, offer.availableUsdt));
    if (take <= 0) continue;
    totalBs += take * offer.price;
    filled += take;
    remaining -= take;
    offersUsed += 1;
  }

  const vwapPrice = filled > 0 ? totalBs / filled : topPrice;
  const slippagePct = topPrice > 0 ? ((topPrice - vwapPrice) / topPrice) * 100 : 0;

  return {
    requestedUsdt,
    filledUsdt: filled,
    unfilledUsdt: Math.max(0, requestedUsdt - filled),
    topPrice,
    vwapPrice,
    slippagePct,
    offersUsed,
  };
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
