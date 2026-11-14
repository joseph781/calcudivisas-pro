export interface BcvRateResponse {
  current: {
    date: string;
    usd: number;
    eur: number;
  };
  previous: {
    date: string;
    usd: number;
    eur: number;
  };
  changePercentage: {
    usd: number;
    eur: number;
  };
}

export interface UsdtRatesResponse {
  success: boolean;
  data: {
    binance: {
      buy_rate: number;
      sell_rate: number;
      spread: number;
    };
    bybit: {
      buy_rate: number;
      sell_rate: number;
      spread: number;
    };
    bcv: {
      rate: number;
    };
    best: {
      source: string;
      buy_rate: number;
    };
    brecha_pct: number;
    captured_at: string;
  };
}

export interface InterventionResponse {
  id: string;
  date: string;
  rate: number;
}

export interface MarketSnapshot {
  bcvUsd: number;
  bcvEur: number;
  bcvDate: string;
  bcvUsdChangePct: number;
  bcvEurChangePct: number;
  binanceBuy: number;
  binanceSell: number;
  binanceSpreadPct: number;
  bybitBuy: number;
  bybitSell: number;
  bybitSpreadPct: number;
  brechaPct: number;
  interventionRate: number | null;
  interventionId: string | null;
  interventionDate: string | null;
  capturedAt: string;
  sourceStatus: 'live' | 'cached' | 'fallback';
}

const CACHE_KEY = 'calcudivisas_pro_market_cache_v1';

const FALLBACK_SNAPSHOT: MarketSnapshot = {
  bcvUsd: 914.0218,
  bcvEur: 1010.5608,
  bcvDate: new Date().toISOString().slice(0, 10),
  bcvUsdChangePct: 0.26,
  bcvEurChangePct: 0.12,
  binanceBuy: 1067.85,
  binanceSell: 1066.1,
  binanceSpreadPct: 0.16,
  bybitBuy: 1073.5,
  bybitSell: 1062.69,
  bybitSpreadPct: 1.02,
  brechaPct: 16.83,
  interventionRate: 1.003,
  interventionId: '036-26',
  interventionDate: new Date().toISOString().slice(0, 10),
  capturedAt: new Date().toISOString(),
  sourceStatus: 'fallback',
};

async function fetchJsonWithTimeout<T>(url: string, timeoutMs = 6500): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal, cache: 'no-store' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    window.clearTimeout(timer);
  }
}

export function loadCachedMarketSnapshot(): MarketSnapshot | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MarketSnapshot;
    return { ...parsed, sourceStatus: 'cached' };
  } catch {
    return null;
  }
}

export async function fetchLiveMarketSnapshot(): Promise<MarketSnapshot> {
  const [bcvRes, usdtRes, intRes] = await Promise.allSettled([
    fetchJsonWithTimeout<BcvRateResponse>('https://rates.dolarvzla.com/bcv/current.json'),
    fetchJsonWithTimeout<UsdtRatesResponse>('https://www.usdt.com.ve/api/v1/rates/current'),
    fetchJsonWithTimeout<InterventionResponse>('https://rates.dolarvzla.com/interventions/current.json'),
  ]);

  const bcv = bcvRes.status === 'fulfilled' ? bcvRes.value : null;
  const usdt = usdtRes.status === 'fulfilled' && usdtRes.value?.success ? usdtRes.value.data : null;
  const intervention = intRes.status === 'fulfilled' ? intRes.value : null;

  if (!bcv && !usdt) {
    return loadCachedMarketSnapshot() ?? FALLBACK_SNAPSHOT;
  }

  const cached = loadCachedMarketSnapshot() ?? FALLBACK_SNAPSHOT;
  const bcvUsd = bcv?.current?.usd ?? usdt?.bcv?.rate ?? cached.bcvUsd;
  const binanceBuy = usdt?.binance?.buy_rate ?? cached.binanceBuy;
  const brechaPct = bcvUsd > 0 ? ((binanceBuy - bcvUsd) / bcvUsd) * 100 : cached.brechaPct;

  const snapshot: MarketSnapshot = {
    bcvUsd,
    bcvEur: bcv?.current?.eur ?? cached.bcvEur,
    bcvDate: bcv?.current?.date ?? cached.bcvDate,
    bcvUsdChangePct: bcv?.changePercentage?.usd ?? cached.bcvUsdChangePct,
    bcvEurChangePct: bcv?.changePercentage?.eur ?? cached.bcvEurChangePct,
    binanceBuy,
    binanceSell: usdt?.binance?.sell_rate ?? cached.binanceSell,
    binanceSpreadPct: usdt?.binance?.spread ?? cached.binanceSpreadPct,
    bybitBuy: usdt?.bybit?.buy_rate ?? cached.bybitBuy,
    bybitSell: usdt?.bybit?.sell_rate ?? cached.bybitSell,
    bybitSpreadPct: usdt?.bybit?.spread ?? cached.bybitSpreadPct,
    brechaPct,
    interventionRate: intervention?.rate ?? cached.interventionRate,
    interventionId: intervention?.id ?? cached.interventionId,
    interventionDate: intervention?.date ?? cached.interventionDate,
    capturedAt: usdt?.captured_at ?? new Date().toISOString(),
    sourceStatus: 'live',
  };

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage quota issues
  }

  return snapshot;
}

export interface RemoteSpreadPoint {
  timestamp: string;
  bcvUsd: number;
  binanceBuy: number;
  brechaPct: number;
}

const WORKER_URL = 'https://calcudivisas-pro-worker.windowstelecom.workers.dev';

export async function fetchWorkerSpreadHistory(days = 30): Promise<RemoteSpreadPoint[]> {
  try {
    const res = await fetchJsonWithTimeout<{ ok: boolean; points?: RemoteSpreadPoint[] }>(
      `${WORKER_URL}/api/history?days=${days}`,
      5000,
    );
    return res.ok && Array.isArray(res.points) ? res.points : [];
  } catch {
    return [];
  }
}
