/**
 * CalcuDivisas Pro — Standalone Telegram Bot (Node 24+, zero dependencies)
 * Usage:
 *   node bot/telegram-bot.mjs   (reads TELEGRAM_BOT_TOKEN from .env or environment)
 */
import fs from 'node:fs';
import path from 'node:path';

function loadEnvToken() {
  if (process.env.TELEGRAM_BOT_TOKEN) return process.env.TELEGRAM_BOT_TOKEN;
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    const raw = fs.readFileSync(envPath, 'utf8');
    for (const line of raw.split(/\r?\n/)) {
      const m = line.match(/^\s*TELEGRAM_BOT_TOKEN\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  } catch {
    // ignore missing .env
  }
  return '';
}

const TOKEN = loadEnvToken();
if (!TOKEN) {
  console.error('Error: define TELEGRAM_BOT_TOKEN en .env o en el entorno.');
  process.exit(1);
}

const TG_API = `https://api.telegram.org/bot${TOKEN}`;

const BANKS = [
  { id: 'bnc', name: 'BNC', comision: 0.003, tarjeta: 0.015 },
  { id: 'bbva', name: 'BBVA Provincial', comision: 0.005, tarjeta: 0.015 },
  { id: 'bdv', name: 'BDV', comision: 0.005, tarjeta: 0.025 },
  { id: 'banesco', name: 'Banesco', comision: 0.005, tarjeta: 0.0, diferido: 0.015 },
  { id: 'tesoro', name: 'Banco del Tesoro', comision: 0.005, tarjeta: 0.025 },
  { id: 'bdt', name: 'BDT', comision: 0.005, tarjeta: 0.025 },
  { id: 'bancamiga', name: 'Bancamiga', comision: 0.005, tarjeta: 0.048 },
];

async function tgCall(method, body) {
  const res = await fetch(`${TG_API}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

async function fetchLiveRates() {
  const [bcvRes, usdtRes] = await Promise.all([
    fetch('https://rates.dolarvzla.com/bcv/current.json').then((r) => r.json()),
    fetch('https://www.usdt.com.ve/api/v1/rates/current').then((r) => r.json()),
  ]);
  const bcvUsd = bcvRes?.current?.usd ?? 0;
  const bcvEur = bcvRes?.current?.eur ?? 0;
  const binanceBuy = usdtRes?.data?.binance?.buy_rate ?? 0;
  const bybitBuy = usdtRes?.data?.bybit?.buy_rate ?? 0;
  const brechaPct = bcvUsd > 0 ? ((binanceBuy - bcvUsd) / bcvUsd) * 100 : 0;
  return { bcvUsd, bcvEur, binanceBuy, bybitBuy, brechaPct };
}

function fmt(n, d = 2) {
  return Number(n).toLocaleString('es-VE', {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
}

async function handleMessage(msg) {
  const chatId = msg.chat?.id;
  const text = (msg.text || '').trim();
  if (!chatId || !text) return;

  if (text.startsWith('/start')) {
    const welcome = [
      `<b>CalcuDivisas Pro — Bot Oficial</b>`,
      `Monitoreo en vivo de tasas BCV, Binance P2P, Bybit y ranking bancario.`,
      ``,
      `<b>Comandos disponibles:</b>`,
      `/tasas — Ver BCV, Binance, Bybit y brecha actual`,
      `/ranking 100 — Ranking de rentabilidad para $100 USD`,
      `/bancos — Top 5 bancos monitoreados (BDV, Tesoro, Mercantil, Banesco, BDT)`,
    ].join('\n');
    await tgCall('sendMessage', { chat_id: chatId, text: welcome, parse_mode: 'HTML' });
    return;
  }

  if (text.startsWith('/tasas')) {
    const rates = await fetchLiveRates();
    const reply = [
      `<b>Tasas en Vivo</b>`,
      `BCV USD: <b>${fmt(rates.bcvUsd)} Bs</b>`,
      `BCV EUR: <b>${fmt(rates.bcvEur)} Bs</b>`,
      `Binance P2P: <b>${fmt(rates.binanceBuy)} Bs</b>`,
      `Bybit P2P: <b>${fmt(rates.bybitBuy)} Bs</b>`,
      `Brecha BCV vs Binance: <b>${fmt(rates.brechaPct)}%</b>`,
    ].join('\n');
    await tgCall('sendMessage', { chat_id: chatId, text: reply, parse_mode: 'HTML' });
    return;
  }

  if (text.startsWith('/ranking')) {
    const parts = text.split(/\s+/);
    const usd = Math.max(1, parseFloat(parts[1]) || 100);
    const rates = await fetchLiveRates();
    const ranked = BANKS.map((b) => {
      const invertido = usd * rates.bcvUsd * (1 + b.comision);
      const netoUsdt = usd * (1 - b.tarjeta);
      const diferido = usd * (b.diferido || 0) * rates.bcvUsd;
      const ganancia = netoUsdt * rates.binanceBuy - invertido - diferido;
      const roi = invertido > 0 ? (ganancia / (invertido + diferido)) * 100 : 0;
      return { name: b.name, ganancia, roi };
    }).sort((a, b) => b.ganancia - a.ganancia);

    const lines = ranked.map(
      (r, i) => `${i + 1}. <b>${r.name}</b>: ${fmt(r.ganancia)} Bs (${fmt(r.roi)}% ROI)`,
    );
    const reply = [
      `<b>Ranking para $${usd} USD</b> (BCV ${fmt(rates.bcvUsd)} / P2P ${fmt(rates.binanceBuy)})`,
      ...lines,
    ].join('\n');
    await tgCall('sendMessage', { chat_id: chatId, text: reply, parse_mode: 'HTML' });
    return;
  }

  if (text.startsWith('/bancos')) {
    const reply = [
      `<b>Top 5 Bancos Monitoreados</b>`,
      `• Banco de Venezuela (BDV)`,
      `• Banco del Tesoro`,
      `• Banco Mercantil`,
      `• Banesco`,
      `• Banco Digital de los Trabajadores (BDT)`,
      ``,
      `Configura tus alertas en la pestaña <b>Radar TG</b> de CalcuDivisas Pro.`,
    ].join('\n');
    await tgCall('sendMessage', { chat_id: chatId, text: reply, parse_mode: 'HTML' });
  }
}

async function poll() {
  let offset = 0;
  console.log('CalcuDivisas Pro Telegram Bot iniciado...');
  while (true) {
    try {
      const data = await tgCall('getUpdates', { offset, timeout: 25 });
      if (data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          offset = update.update_id + 1;
          if (update.message) {
            await handleMessage(update.message);
          }
        }
      }
    } catch (err) {
      console.error('Polling error:', err);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

poll();
