import { useMemo } from 'react';
import { ArrowRight, Check, Moon, Sun } from 'lucide-react';
import { rankAllBanks } from '../engine/arbitrage';
import { MarketSnapshot } from '../services/ratesApi';
import { fmtBs, fmtPct } from '../utils/format';

interface LandingPageProps {
  snapshot: MarketSnapshot;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onEnterTerminal: (tab?: 'terminal' | 'simulator' | 'ledger' | 'alerts' | 'radar') => void;
}

export function LandingPage({
  snapshot,
  theme,
  onToggleTheme,
  onEnterTerminal,
}: LandingPageProps) {
  const top3Banks = useMemo(
    () =>
      rankAllBanks({
        usdAmount: 1000,
        tasaBanco: snapshot.bcvUsd,
        tasaP2P: snapshot.binanceBuy,
        p2pFeePct: 0,
      }).slice(0, 3),
    [snapshot.bcvUsd, snapshot.binanceBuy],
  );

  return (
    <div className="min-h-screen bg-white text-slate-900 transition-colors dark:bg-[#0b1120] dark:text-slate-100">
      {/* Enterprise Top Bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800 dark:bg-[#0b1120]/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0067b8] font-mono text-xs font-bold text-white">
              CD
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                CalcuDivisas <span className="text-[#0067b8] dark:text-sky-400">Pro</span>
              </span>
              <span className="hidden text-xs font-medium text-slate-400 sm:inline">
                FX &amp; P2P Intelligence
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex dark:text-slate-300">
            <a href="#flujo" className="transition hover:text-[#0067b8] dark:hover:text-sky-400">
              Metodología
            </a>
            <a href="#empresas" className="transition hover:text-[#0067b8] dark:hover:text-sky-400">
              Para Comercios
            </a>
            <a href="#modulos" className="transition hover:text-[#0067b8] dark:hover:text-sky-400">
              Módulos
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Cambiar a fondo blanco' : 'Cambiar a fondo oscuro'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
            <button
              type="button"
              onClick={() => onEnterTerminal('terminal')}
              className="inline-flex items-center gap-2 rounded-md bg-[#0067b8] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#00569c]"
            >
              Abrir Terminal
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-[#0f172a]/50">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-6">
            <p className="mb-3 font-mono text-xs font-semibold tracking-widest text-[#0067b8] uppercase dark:text-sky-400">
              Plataforma de Gestión Cambiaria · Venezuela
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.1] dark:text-white">
              Control exacto de tus márgenes cambiarios en tiempo real.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300">
              Integra cotizaciones oficiales del <strong>BCV</strong> con liquidez de{' '}
              <strong>Binance P2P</strong> y <strong>Bybit</strong>, audita las comisiones reales de
              14 entidades bancarias y calcula tu punto de equilibrio antes de ejecutar cualquier
              operación.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onEnterTerminal('terminal')}
                className="inline-flex items-center gap-2 rounded-md bg-[#0067b8] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#00569c]"
              >
                Ingresar a la Terminal
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
              <a
                href="#flujo"
                className="inline-flex items-center rounded-md border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                Ver arquitectura y uso
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 border-t border-slate-200 pt-6 dark:border-slate-800">
              <div>
                <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                  14
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Bancos modelados
                </div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-slate-900 dark:text-white">
                  60s
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Actualización continua
                </div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-[#0067b8] dark:text-sky-400">
                  {fmtPct(snapshot.brechaPct)}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Brecha BCV / P2P actual
                </div>
              </div>
            </div>
          </div>

          {/* Institutional Live Market Table Card */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <div>
                  <span className="font-mono text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
                    Referencia en Vivo · Base $1,000 USD
                  </span>
                  <h2 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                    Comparativa Neta por Entidad
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-mono text-xs font-semibold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
                  EN VIVO
                </span>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    BCV USD
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {fmtBs(snapshot.bcvUsd)} Bs
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Binance P2P
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-[#0067b8] dark:text-sky-400">
                    {fmtBs(snapshot.binanceBuy)} Bs
                  </div>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    Bybit P2P
                  </div>
                  <div className="mt-1 font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {fmtBs(snapshot.bybitBuy)} Bs
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-[11px] font-semibold tracking-wider text-slate-500 uppercase dark:bg-slate-950 dark:text-slate-400">
                    <tr>
                      <th className="px-3.5 py-2.5">#</th>
                      <th className="px-3.5 py-2.5">Entidad</th>
                      <th className="px-3.5 py-2.5 text-right">Break-Even</th>
                      <th className="px-3.5 py-2.5 text-right">Ganancia Neta</th>
                      <th className="px-3.5 py-2.5 text-right">ROI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {top3Banks.map((item) => (
                      <tr key={item.bank.id}>
                        <td className="px-3.5 py-3 font-mono font-semibold text-slate-500">
                          {item.rank}
                        </td>
                        <td className="px-3.5 py-3 font-semibold text-slate-900 dark:text-slate-100">
                          {item.bank.shortName}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                          {fmtBs(item.result.breakEvenP2pRate)}
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                          +{fmtBs(item.result.gananciaBs)} Bs
                        </td>
                        <td className="px-3.5 py-3 text-right font-mono font-semibold text-slate-900 dark:text-slate-200">
                          {fmtPct(item.result.roiPct, 2, true)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button
                type="button"
                onClick={() => onEnterTerminal('terminal')}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-[#0067b8] dark:hover:bg-[#00569c]"
              >
                Abrir Calculadora Completa
                <ArrowRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section id="flujo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="font-mono text-xs font-semibold tracking-widest text-[#0067b8] uppercase dark:text-sky-400">
            Metodología
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            Del dato oficial a la ejecución sin fricción
          </h2>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              num: '01',
              title: 'Captura de Mercado',
              body: 'Sincroniza automáticamente tasas oficiales BCV (USD y EUR), intervenciones cambiarias y libros de Binance y Bybit P2P.',
            },
            {
              num: '02',
              title: 'Desglose de Fricción Bancaria',
              body: 'Aplica las comisiones de compra, recarga de tarjeta, cargos diferidos y tarifas P2P para rankear los 14 bancos en tiempo real.',
            },
            {
              num: '03',
              title: 'Registro y Alertas en Telegram',
              body: 'Documenta cada operación en la bitácora exportable a CSV y recibe avisos automáticos cuando la brecha alcanza tu objetivo.',
            },
          ].map((step) => (
            <div
              key={step.num}
              className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="font-mono text-xs font-bold text-[#0067b8] dark:text-sky-400">
                {step.num}
              </div>
              <h3 className="mt-2 text-base font-bold text-slate-900 dark:text-white">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {step.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Business & Individual Comparison */}
      <section
        id="empresas"
        className="border-y border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/40"
      >
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="font-mono text-xs font-semibold tracking-widest text-[#0067b8] uppercase dark:text-sky-400">
              Casos de Uso
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              Diseñada para comercios y operadores diarios
            </h2>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Dueños de Comercios y Empresas
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Protección de capital de reposición y conciliación financiera
                </p>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {[
                  'Determina el precio mínimo de equilibrio (Break-Even) antes de reponer inventario.',
                  'Compara el rendimiento neto por banco para elegir la cuenta corporativa más eficiente.',
                  'Evalúa escenarios de devaluación (±3% en BCV o P2P) con la Matriz de Sensibilidad 5×5.',
                  'Exporta el historial completo en formato CSV compatible con Excel y sistemas contables.',
                ].map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[#0067b8] dark:text-sky-400"
                      strokeWidth={2}
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-100 pb-4 dark:border-slate-800">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Usuarios del Día a Día
                </h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  Operaciones personales transparentes sin comisiones sorpresa
                </p>
              </div>
              <ul className="mt-5 space-y-3 text-sm text-slate-700 dark:text-slate-300">
                {[
                  'Visualiza el descuento real de tarjetas internacionales (1,5% a 4,8%) antes de comprar.',
                  'Calcula en modo inverso cuántos dólares enteros puedes adquirir con tu saldo en Bs.',
                  'Consulta en una sola tabla qué banco te entrega mayor retorno neto en USDT.',
                  'Suscríbete en un clic al bot @midivisas_pro_bot para consultar tasas desde Telegram.',
                ].map((line, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400"
                      strokeWidth={2}
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modules */}
      <section id="modulos" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold tracking-widest text-[#0067b8] uppercase dark:text-sky-400">
              Arquitectura Modular
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Módulos de la Terminal
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onEnterTerminal('terminal')}
            className="text-sm font-semibold text-[#0067b8] hover:underline dark:text-sky-400"
          >
            Ir a la Terminal →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              tab: 'terminal' as const,
              code: '01',
              title: 'Terminal',
              desc: 'Calculadora directa e inversa con ranking simultáneo de 14 bancos.',
            },
            {
              tab: 'simulator' as const,
              code: '02',
              title: 'Simulador',
              desc: 'Gráfico histórico de brecha y matriz de sensibilidad 5×5.',
            },
            {
              tab: 'ledger' as const,
              code: '03',
              title: 'Bitácora',
              desc: 'Métricas de portafolio, rendimiento por banco y exportación CSV.',
            },
            {
              tab: 'alerts' as const,
              code: '04',
              title: 'Alertas',
              desc: 'Reglas configurables sobre brecha, BCV o tasas P2P.',
            },
            {
              tab: 'radar' as const,
              code: '05',
              title: 'Radar TG',
              desc: 'Suscripción directa a @midivisas_pro_bot y monitoreo por banco.',
            },
          ].map((m) => (
            <button
              key={m.tab}
              type="button"
              onClick={() => onEnterTerminal(m.tab)}
              className="flex flex-col items-start rounded-xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#0067b8] dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500"
            >
              <span className="font-mono text-[11px] font-bold text-[#0067b8] dark:text-sky-400">
                MÓDULO {m.code}
              </span>
              <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-white">
                {m.title}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                {m.desc}
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-slate-50 py-8 dark:border-slate-800 dark:bg-[#0b1120]">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:px-6 lg:px-8 dark:text-slate-400">
          <span>CalcuDivisas Pro v2.0 — Inteligencia Cambiaria</span>
          <span>Datos públicos: BCV (dolarvzla) · Binance &amp; Bybit P2P (usdt.com.ve)</span>
        </div>
      </footer>
    </div>
  );
}
