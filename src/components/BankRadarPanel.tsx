import { ExternalLink } from 'lucide-react';
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
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 dark:border-slate-800/90 dark:bg-slate-900/75">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
            Bot Oficial de Telegram
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-mono text-[10px] font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            EN LÍNEA
          </span>
        </div>

        <p className="mb-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          Suscribe tu Telegram en un clic al bot oficial{' '}
          <strong className="text-[#0067b8] dark:text-sky-300">@midivisas_pro_bot</strong> para
          consultar tasas en vivo, ranking de bancos y alertas directamente desde tu celular.
        </p>

        <a
          href="https://t.me/midivisas_pro_bot?start=web"
          target="_blank"
          rel="noopener noreferrer"
          className="mb-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0067b8] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#00569c]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Abrir @midivisas_pro_bot en Telegram
        </a>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950/60">
          <div className="mb-2.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
            Comandos disponibles en el chat
          </div>
          <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
            <li className="flex items-center justify-between gap-2">
              <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[#0067b8] dark:bg-slate-900 dark:text-sky-300">
                /tasas
              </code>
              <span>
                BCV ({fmtBs(snapshot.bcvUsd)}), P2P y brecha ({fmtPct(snapshot.brechaPct)})
              </span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[#0067b8] dark:bg-slate-900 dark:text-sky-300">
                /ranking 100
              </code>
              <span>Top bancos más rentables por monto</span>
            </li>
            <li className="flex items-center justify-between gap-2">
              <code className="rounded bg-slate-200/80 px-1.5 py-0.5 font-mono text-[#0067b8] dark:bg-slate-900 dark:text-sky-300">
                /bancos
              </code>
              <span>Lista de los 5 bancos principales</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Bank Opening Radar Subscriptions */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-7 dark:border-slate-800/90 dark:bg-slate-900/75">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
            Radar de Apertura por Banco
          </h2>
          <button
            type="button"
            onClick={selectTop5}
            className="rounded-md border border-blue-200 bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-[#0067b8] transition hover:bg-blue-100 dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300 dark:hover:bg-sky-500/20"
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
                className={`flex items-center justify-between rounded-lg border border-l-4 px-3 py-2.5 text-left transition ${
                  active
                    ? 'border-[#0067b8] bg-blue-50/70 text-slate-900 dark:border-sky-500/50 dark:bg-sky-500/10 dark:text-slate-100'
                    : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:border-slate-300 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400 dark:hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{bank.shortName}</div>
                  {isTop5 && (
                    <div className="text-[10px] text-[#0067b8] dark:text-sky-400">
                      Alta frecuencia
                    </div>
                  )}
                </div>
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
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
