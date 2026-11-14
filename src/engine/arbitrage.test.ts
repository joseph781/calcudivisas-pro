import { describe, expect, it } from 'vitest';
import { BANK_BY_ID } from '../data/banks';
import {
  buildSensitivityMatrix,
  calculateForwardArbitrage,
  calculateReverseArbitrage,
  calculateVwapFromOffers,
  compareBridgeRoutes,
  rankAllBanks,
} from './arbitrage';

describe('Arbitrage Engine', () => {
  it('computes forward arbitrage accurately for BDV (0.5% bank + 2.5% card)', () => {
    const res = calculateForwardArbitrage({
      usdAmount: 100,
      tasaBanco: 914,
      tasaP2P: 1068,
      bank: BANK_BY_ID.bdv,
      p2pFeePct: 0,
    });

    expect(res.costoBaseBs).toBeCloseTo(91400, 2);
    expect(res.comisionBancoBs).toBeCloseTo(457, 2);
    expect(res.totalInvertidoBs).toBeCloseTo(91857, 2);
    expect(res.enBinanceUsdt).toBeCloseTo(97.5, 4);
    expect(res.retornoBs).toBeCloseTo(97.5 * 1068, 2);
    expect(res.gananciaBs).toBeCloseTo(97.5 * 1068 - 91857, 2);
    expect(res.roiPct).toBeGreaterThan(10);
    expect(res.breakEvenP2pRate).toBeCloseTo(91857 / 97.5, 2);
  });

  it('computes Banesco deferred Bs fee properly', () => {
    const res = calculateForwardArbitrage({
      usdAmount: 100,
      tasaBanco: 900,
      tasaP2P: 1050,
      bank: BANK_BY_ID.banesco,
      p2pFeePct: 0,
    });

    expect(res.enBinanceUsdt).toBe(100);
    expect(res.diferidoBs).toBeCloseTo(1350, 2);
    expect(res.gananciaBs).toBeCloseTo(105000 - (90000 + 450 + 1350), 2);
  });

  it('computes reverse arbitrage integer USD max and leftover Bs', () => {
    const rev = calculateReverseArbitrage({
      bsDisponibles: 100000,
      tasaBanco: 914,
      tasaP2P: 1068,
      bank: BANK_BY_ID.bnc,
      p2pFeePct: 0.35,
    });

    expect(rev).not.toBeNull();
    expect(rev!.usdAmount).toBe(Math.floor(100000 / (1.003 * 914)));
    expect(rev!.sobranteBs).toBeGreaterThanOrEqual(0);
    expect(rev!.sobranteBs).toBeLessThan(914 * 1.003);
  });

  it('ranks banks with BNC / Mercantil above Bancamiga for identical rates', () => {
    const ranked = rankAllBanks({
      usdAmount: 200,
      tasaBanco: 914,
      tasaP2P: 1068,
      p2pFeePct: 0,
    });

    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].deltaFromBestBs).toBe(0);
    const bancamiga = ranked.find((r) => r.bank.id === 'bancamiga')!;
    expect(bancamiga.rank).toBeGreaterThan(ranked[0].rank);
    expect(bancamiga.deltaFromBestBs).toBeLessThan(0);
  });

  it('builds a 5x5 sensitivity matrix with center cell matching base calculation', () => {
    const base = {
      usdAmount: 100,
      tasaBanco: 914,
      tasaP2P: 1068,
      bank: BANK_BY_ID.bdv,
      p2pFeePct: 0,
    };
    const matrix = buildSensitivityMatrix(base);
    expect(matrix).toHaveLength(5);
    expect(matrix[2][2].bcvDeltaPct).toBe(0);
    expect(matrix[2][2].p2pDeltaPct).toBe(0);
    expect(matrix[2][2].gananciaBs).toBeCloseTo(calculateForwardArbitrage(base).gananciaBs, 2);
  });

  it('computes T+N temporal devaluation drag and daily ROI', () => {
    const t0 = calculateForwardArbitrage({
      usdAmount: 100,
      tasaBanco: 914,
      tasaP2P: 1068,
      bank: BANK_BY_ID.bdv,
      p2pFeePct: 0,
      settlementDays: 0,
      dailyBcvDriftPct: 0.3,
    });
    const t2 = calculateForwardArbitrage({
      usdAmount: 100,
      tasaBanco: 914,
      tasaP2P: 1068,
      bank: BANK_BY_ID.bdv,
      p2pFeePct: 0,
      settlementDays: 2,
      dailyBcvDriftPct: 0.3,
    });

    expect(t0.devaluationDragBs).toBe(0);
    expect(t2.devaluationDragBs).toBeGreaterThan(0);
    expect(t2.riskAdjustedProfitBs).toBeLessThan(t2.gananciaBs);
    expect(t2.dailyRoiPct).toBeCloseTo(t2.roiPct / 2, 4);
  });

  it('compares direct card vs bridge routes (Zinli, Mercantil Panama, Wally)', () => {
    const routes = compareBridgeRoutes({
      usdAmount: 500,
      tasaBanco: 914,
      tasaP2P: 1068,
      bank: BANK_BY_ID.bancamiga,
      p2pFeePct: 0,
    });

    expect(routes).toHaveLength(4);
    // Bancamiga's 4.8% card fee should make Mercantil Panama / Zinli beat direct
    expect(routes[0].id).not.toBe('direct');
  });

  it('calculates VWAP and slippage across multiple P2P order book offers', () => {
    const vwap = calculateVwapFromOffers(
      [
        {
          merchant: 'DeskA',
          price: 1070,
          availableUsdt: 400,
          minBs: 50000,
          maxBs: 500000,
          completionRatePct: 99.5,
          method: 'PagoMovil',
        },
        {
          merchant: 'DeskB',
          price: 1064,
          availableUsdt: 600,
          minBs: 50000,
          maxBs: 1000000,
          completionRatePct: 98.8,
          method: 'Banesco',
        },
      ],
      1000,
    );

    expect(vwap.filledUsdt).toBe(1000);
    expect(vwap.unfilledUsdt).toBe(0);
    expect(vwap.vwapPrice).toBeCloseTo((400 * 1070 + 600 * 1064) / 1000, 2);
    expect(vwap.slippagePct).toBeGreaterThan(0);
    expect(vwap.offersUsed).toBe(2);
  });
});
