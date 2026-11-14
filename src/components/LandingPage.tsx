import { useMemo } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Bot,
  Building2,
  CheckCircle2,
  Landmark,
  ShieldCheck,
  Sliders,
  TrendingUp,
  UserCheck,
} from 'lucide-react';
import { rankAllBanks } from '../engine/arbitrage';
import { MarketSnapshot } from '../services/ratesApi';
import { fmtBs, fmtPct } from '../utils/format';

interface LandingPageProps {
  snapshot: MarketSnapshot;
  onEnterTerminal: (tab?: 'terminal' | 'simulator' | 'ledger' | 'alerts' | 'radar') => void;
}

export function LandingPage({ snapshot, onEnterTerminal }: LandingPageProps) {
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
    <div className="min-h-screen bg-white text-slate-900">
      {/* Enterprise Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0067b8] text-white shadow-sm">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900">
                CalcuDivisas <span className="text-[#0067b8]">Pro</span>
              </span>
              <span className="ml-2 hidden rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-600 sm:inline-block">
                Enterprise FX
              </span>
            </div>
          </div>

          <nav className="hidden items-center gap-7 text-sm font-medium text-slate-600 md:flex">
            <a href="#como-funciona" className="transition hover:text-[#0067b8]">
              Cómo funciona
            </a>
            <a href="#beneficios-negocio" className="transition hover:text-[#0067b8]">
              Para Comercios
            </a>
            <a href="#modulos" className="transition hover:text-[#0067b8]">
              Módulos
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs lg:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="text-slate-500">Brecha hoy:</span>
              <span className="font-mono font-semibold text-slate-900">
                {fmtPct(snapshot.brechaPct)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onEnterTerminal('terminal')}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0067b8] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00569c]"
            >
              Ingresar a la Terminal
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-12 lg:px-8 lg:py-24">
          <div className="lg:col-span-6">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0067b8]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Inteligencia Cambiaria en Tiempo Real · Venezuela
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl sm:leading-[1.12]">
              Protege el capital de tu negocio y maximiza cada operación cambiaria.
            </h1>
            <p className="mt-5 text-base leading-relaxed text-slate-600 sm:text-lg">
              CalcuDivisas Pro conecta las tasas oficiales del <strong>BCV</strong> con{' '}
              <strong>Binance P2P</strong> y <strong>Bybit</strong>, compara automáticamente las
              comisiones de <strong>14 bancos venezolanos</strong> y calcula tu ganancia neta real
              antes de mover un solo bolívar.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <button
                type="button"
                onClick={() => onEnterTerminal('terminal')}
                className="inline-flex items-center gap-2 rounded-lg bg-[#0067b8] px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-900/10 transition hover:bg-[#00569c]"
              >
                Abrir Terminal Ahora
                <ArrowRight className="h-4 w-4" />
              </button>
              <a
                href="#como-funciona"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Ver cómo funciona
              </a>
            </div>

            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-200 pt-6">
              <div>
                <div className="font-mono text-xl font-bold text-slate-900">14 Bancos</div>
                <div className="text-xs text-slate-500">Ranking simultáneo</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-slate-900">60 seg</div>
                <div className="text-xs text-slate-500">Sincronización en vivo</div>
              </div>
              <div>
                <div className="font-mono text-xl font-bold text-[#0067b8]">Telegram</div>
                <div className="text-xs text-slate-500">Alertas automáticas</div>
              </div>
            </div>
          </div>

          {/* Live Market Snapshot Preview Card */}
          <div className="lg:col-span-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="mb-4 flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                    Monitor en Vivo · Ejemplo $1,000 USD
                  </span>
                  <h2 className="mt-0.5 text-base font-bold text-slate-900">
                    Comparativa Bancaria Instantánea
                  </h2>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <Activity className="h-3.5 w-3.5" />
                  Brecha {fmtPct(snapshot.brechaPct)}
                </span>
              </div>

              <div className="mb-5 grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[11px] font-medium text-slate-500">BCV USD</span>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-900">
                    {fmtBs(snapshot.bcvUsd)} Bs
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[11px] font-medium text-slate-500">Binance P2P</span>
                  <div className="mt-0.5 font-mono text-base font-bold text-[#0067b8]">
                    {fmtBs(snapshot.binanceBuy)} Bs
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <span className="text-[11px] font-medium text-slate-500">Bybit P2P</span>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-900">
                    {fmtBs(snapshot.bybitBuy)} Bs
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  Top 3 Bancos Más Rentables Hoy ($1,000 USD)
                </div>
                {top3Banks.map((item) => (
                  <div
                    key={item.bank.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 transition hover:border-blue-300"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-bold ${
                          item.rank === 1
                            ? 'bg-blue-50 text-[#0067b8]'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {item.rank}
                      </span>
                      <div>
                        <div className="text-sm font-semibold text-slate-900">
                          {item.bank.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-500">
                          Break-Even: {fmtBs(item.result.breakEvenP2pRate)} Bs
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm font-bold text-emerald-700">
                        +{fmtBs(item.result.gananciaBs)} Bs
                      </div>
                      <div className="font-mono text-xs font-semibold text-slate-500">
                        {fmtPct(item.result.roiPct, 2, true)} ROI
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onEnterTerminal('terminal')}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Calcular con mi propio monto
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold tracking-wider text-[#0067b8] uppercase">
            Flujo de Trabajo Simplificado
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Decisiones financieras claras en 3 pasos
          </h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            Diseñada para que cualquier persona o equipo administrativo entienda su margen real sin
            hojas de cálculo complejas.
          </p>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              step: '01',
              title: 'Sincronización Automática',
              desc: 'Consulta en paralelo el dólar/euro BCV, intervenciones cambiarias y cotizaciones reales de Binance y Bybit P2P.',
              icon: Landmark,
            },
            {
              step: '02',
              title: 'Auditoría de Comisiones',
              desc: 'Descuenta automáticamente la comisión de compra bancaria, recargas, uso de tarjeta internacional y fees P2P en los 14 bancos.',
              icon: Award,
            },
            {
              step: '03',
              title: 'Control y Alertas en Telegram',
              desc: 'Registra cada operación en tu bitácora exportable a CSV y recibe notificaciones en Telegram cuando la brecha alcanza tu objetivo.',
              icon: Bot,
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-[#0067b8]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">PASO {item.step}</span>
                </div>
                <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Business & Daily User Benefits */}
      <section id="beneficios-negocio" className="border-y border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <span className="text-xs font-semibold tracking-wider text-[#0067b8] uppercase">
              Impacto Real
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Pensada para comercios y usuarios del día a día
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Business Owners */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0067b8] text-white">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Para Dueños de Comercios</h3>
                  <p className="text-xs text-slate-500">
                    Tiendas, bodegones, distribuidoras y servicios
                  </p>
                </div>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-700">
                {[
                  'Protege tu capital de reposición calculando el punto exacto de equilibrio (Break-Even) antes de reponer inventario.',
                  'Identifica qué banco de tu empresa ofrece la menor fricción porcentual por volumen operado.',
                  'Simula caídas o subidas del BCV (±3%) en la Matriz 5×5 para fijar precios sin descapitalizarte.',
                  'Exporta tu Bitácora mensual en formato CSV listo para Excel y conciliación contable.',
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#0067b8]" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Daily Users */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-600 text-white">
                  <UserCheck className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Para el Usuario del Día a Día</h3>
                  <p className="text-xs text-slate-500">
                    Ahorro personal, freelancers y operaciones P2P
                  </p>
                </div>
              </div>
              <ul className="space-y-3.5 text-sm text-slate-700">
                {[
                  'Evita comisiones ocultas de tarjetas internacionales (2,5% a 4,8%) que convierten una aparente ganancia en pérdida.',
                  'Calcula con tu saldo exacto en bolívares cuántos dólares enteros puedes comprar y cuánto te queda disponible.',
                  'Consulta la tabla de los 14 bancos en un segundo sin hacer cuentas manuales ni abrir múltiples páginas.',
                  'Conecta tu bot de Telegram para recibir alertas en el celular cuando la brecha alcance el porcentaje que buscas.',
                ].map((text, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modules Grid */}
      <section id="modulos" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="text-xs font-semibold tracking-wider text-[#0067b8] uppercase">
              Suite Completa
            </span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Cinco módulos integrados en una sola terminal
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onEnterTerminal('terminal')}
            className="text-sm font-semibold text-[#0067b8] hover:underline"
          >
            Explorar la Terminal →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              tab: 'terminal' as const,
              title: 'Terminal',
              desc: 'Cálculo directo/inverso y ranking de los 14 bancos.',
              icon: TrendingUp,
            },
            {
              tab: 'simulator' as const,
              title: 'Simulador',
              desc: 'Histórico de brecha y matriz de sensibilidad 5×5.',
              icon: Sliders,
            },
            {
              tab: 'ledger' as const,
              title: 'Bitácora',
              desc: 'Win rate, rendimiento por banco y exportación CSV.',
              icon: BookOpen,
            },
            {
              tab: 'alerts' as const,
              title: 'Alertas',
              desc: 'Reglas por umbral de brecha, BCV o tasa P2P.',
              icon: Bell,
            },
            {
              tab: 'radar' as const,
              title: 'Radar TG',
              desc: 'Conexión directa con tu bot oficial de Telegram.',
              icon: Bot,
            },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.tab}
                type="button"
                onClick={() => onEnterTerminal(m.tab)}
                className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white p-5 text-left transition hover:border-[#0067b8] hover:shadow-md"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-[#0067b8]">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="text-sm font-bold text-slate-900">{m.title}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-600">{m.desc}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Final CTA Banner */}
      <section className="bg-[#0f172a] text-white">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-4 py-14 text-center sm:px-6 lg:flex-row lg:px-8 lg:text-left">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              Toma el control de tus operaciones cambiarias hoy mismo
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Sin registros obligatorios ni publicidad invasiva. Datos en vivo listos para operar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEnterTerminal('terminal')}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-[#0067b8] px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#1a7ad1]"
          >
            Ingresar a la Terminal
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          <span>CalcuDivisas Pro v2.0 — Plataforma de Inteligencia Cambiaria P2P</span>
          <span>Fuentes públicas: BCV (dolarvzla) · Binance &amp; Bybit P2P (usdt.com.ve)</span>
        </div>
      </footer>
    </div>
  );
}
