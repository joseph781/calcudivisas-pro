interface Env {
  DB: D1Database;
  TELEGRAM_BOT_TOKEN?: string;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

async function fetchLiveSnapshot() {
  const [bcvRes, usdtRes] = await Promise.all([
    fetch('https://rates.dolarvzla.com/bcv/current.json').then((r) => r.json()) as Promise<{
      current?: { usd?: number; eur?: number };
    }>,
    fetch('https://www.usdt.com.ve/api/v1/rates/current').then((r) => r.json()) as Promise<{
      data?: {
        binance?: { buy_rate?: number };
        bybit?: { buy_rate?: number };
      };
    }>,
  ]);

  const bcvUsd = bcvRes?.current?.usd ?? 0;
  const bcvEur = bcvRes?.current?.eur ?? 0;
  const binanceBuy = usdtRes?.data?.binance?.buy_rate ?? 0;
  const bybitBuy = usdtRes?.data?.bybit?.buy_rate ?? 0;
  const brechaPct = bcvUsd > 0 ? ((binanceBuy - bcvUsd) / bcvUsd) * 100 : 0;

  return {
    capturedAt: new Date().toISOString(),
    bcvUsd,
    bcvEur,
    binanceBuy,
    bybitBuy,
    brechaPct,
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    const url = new URL(request.url);

    if (url.pathname === '/api/health') {
      return Response.json(
        { ok: true, service: 'calcudivisas-pro-worker', timestamp: new Date().toISOString() },
        { headers: CORS_HEADERS },
      );
    }

    if (url.pathname === '/api/history') {
      const days = Math.min(90, Math.max(1, Number(url.searchParams.get('days')) || 30));
      const since = new Date(Date.now() - days * 86400 * 1000).toISOString();
      const { results } = await env.DB.prepare(
        `SELECT captured_at AS timestamp, bcv_usd AS bcvUsd, binance_buy AS binanceBuy, brecha_pct AS brechaPct
         FROM spread_history
         WHERE captured_at >= ?
         ORDER BY captured_at ASC
         LIMIT 500`,
      )
        .bind(since)
        .all();

      return Response.json({ ok: true, points: results ?? [] }, { headers: CORS_HEADERS });
    }

    return Response.json({ ok: false, error: 'Not found' }, { status: 404, headers: CORS_HEADERS });
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    const snap = await fetchLiveSnapshot();
    if (snap.bcvUsd <= 0 || snap.binanceBuy <= 0) return;

    await env.DB.prepare(
      `INSERT INTO spread_history (captured_at, bcv_usd, bcv_eur, binance_buy, bybit_buy, brecha_pct)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        snap.capturedAt,
        snap.bcvUsd,
        snap.bcvEur,
        snap.binanceBuy,
        snap.bybitBuy,
        snap.brechaPct,
      )
      .run();

    if (!env.TELEGRAM_BOT_TOKEN) return;

    const { results } = await env.DB.prepare(
      `SELECT id, chat_id, metric, threshold, last_triggered_at FROM alert_subscriptions`,
    ).all<{
      id: number;
      chat_id: string;
      metric: string;
      threshold: number;
      last_triggered_at: string | null;
    }>();

    const now = Date.now();
    for (const sub of results ?? []) {
      const last = sub.last_triggered_at ? Date.parse(sub.last_triggered_at) : 0;
      if (now - last < 15 * 60 * 1000) continue;

      const value =
        sub.metric === 'binance_buy'
          ? snap.binanceBuy
          : sub.metric === 'bcv_usd'
            ? snap.bcvUsd
            : snap.brechaPct;

      if (value >= sub.threshold) {
        const text = [
          `<b>Alerta 24/7 — CalcuDivisas Pro</b>`,
          `Brecha actual: <b>${snap.brechaPct.toFixed(2)}%</b>`,
          `BCV USD: <b>${snap.bcvUsd.toFixed(2)} Bs</b>`,
          `Binance P2P: <b>${snap.binanceBuy.toFixed(2)} Bs</b>`,
        ].join('\n');

        await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: sub.chat_id, text, parse_mode: 'HTML' }),
        });

        await env.DB.prepare(`UPDATE alert_subscriptions SET last_triggered_at = ? WHERE id = ?`)
          .bind(snap.capturedAt, sub.id)
          .run();
      }
    }
  },
};
