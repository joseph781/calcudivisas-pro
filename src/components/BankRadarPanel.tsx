import { Bot, ExternalLink, Landmark, Terminal } from 'lucide-react';
import { VENEZUELAN_BANKS } from '../data/banks';
import { MarketSnapshot } from '../services/ratesApi';
import { TelegramConfig } from '../services/telegramApi';
import { fmtBs, fmtPct } from '../utils/format';

interface BankRadarPanelProps {
  snapshot: MarketSnapshot;
  config: TelegramConfig;
  onChangeConfig: (next: TelegramConfig) => void;
}

const TOP_5_BANK_IDS = ['bdv', 'tesoro', 'mercantil', 'banesco', 'bdt'];

export function BankRadarPanel({
  snapshot,
  config,
  onChangeConfig,
}: BankRadarPanelProps) {
  const toggleBank = (bankId: string) => {
    const exists = config.followedBanks.includes(bankId);
    const nextBanks = exists
      ? config.followedBanks.filter((id) => id !== bankId)
      : [...config.followedBanks, bankId];
    onChangeConfig({ ...config, followedBanks: nextBanks });
  };

  const selectTop5 = () => {
    onChangeConfig({ ...config, followedBanks: [...TOP_5_BANK_IDS] });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      {/* Public Telegram Bot Subscription Card */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 shadow-xl shadow-black/20 lg:col-span-5">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-4 w-4 text-sky-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              Bot Oficial de Telegram
            </h2>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            En línea
          </span>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-slate-300">
          Suscribe tu Telegram en un clic al bot oficial{' '}
          <strong className="text-sky-300">@midivisas_pro_bot</strong> para consultar tasas en
          vivo, ranking de bancos y alertas directamente desde tu celular.
        </p>

        <a
          href="https://t.me/midivisas_pro_bot?start=web"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-sky-500 px-4 py-3 text-xs font-bold text-slate-950 transition hover:bg-sky-400"
        >
          <ExternalLink className="h-4 w-4" />
          Abrir @midivisas_pro_bot en Telegram
        </a>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="mb-2.5 flex items-center gap-2 text-xs font-semibold text-slate-200">
            <Terminal className="h-3.5 w-3.5 text-amber-400" />
            Comandos disponibles en el chat
          </div>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-center justify-between">
              <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-sky-300">
                /tasas
              </code>
              <span>BCV ({fmtBs(snapshot.bcvUsd)}), P2P y brecha ({fmtPct(snapshot.brechaPct)})</span>
            </li>
            <li className="flex items-center justify-between">
              <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-sky-300">
                /ranking 100
              </code>
              <span>Top bancos más rentables por monto</span>
            </li>
            <li className="flex items-center justify-between">
              <code className="rounded bg-slate-900 px-1.5 py-0.5 font-mono text-sky-300">
                /bancos
              </code>
              <span>Lista de los 5 bancos principales</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Bank Opening Radar Subscriptions */}
      <section className="rounded-2xl border border-slate-800/90 bg-slate-900/75 p-5 shadow-xl shadow-black/20 lg:col-span-7">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Landmark className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold tracking-wide text-slate-200 uppercase">
              Radar de Apertura por Banco
            </h2>
          </div>
          <button
            type="button"
            onClick={selectTop5}
            className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition hover:bg-amber-500/20"
          >
            Activar Top 5 (BDV, Tesoro, Mercantil, Banesco, BDT)
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {VENEZUELAN_BANKS.map((bank) => {
            const active = config.followedBanks.includes(bank.id);
            const isTop5 = TOP_5_BANK_IDS.includes(bank.id);
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => toggleBank(bank.id)}
                style={{ borderLeftColor: bank.accentColor }}
                className={`flex items-center justify-between rounded-xl border border-l-4 px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-sky-500/50 bg-sky-500/10 text-slate-100'
                    : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{bank.shortName}</div>
                  {isTop5 && (
                    <div className="text-[10px] text-amber-400/90">Alta frecuencia</div>
                  )}
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    active ? 'bg-emerald-400' : 'bg-slate-700'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
