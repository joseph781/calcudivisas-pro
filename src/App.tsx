import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, BookOpen, Bot, Calculator, Home, Moon, Sliders, Sun } from 'lucide-react';
import { ArbitrageTerminal } from './components/ArbitrageTerminal';
import { AlertsTab } from './components/AlertsTab';
import { BankRadarPanel } from './components/BankRadarPanel';
import { LandingPage } from './components/LandingPage';
import { LedgerTab } from './components/LedgerTab';
import { MarketTickerBar } from './components/MarketTickerBar';
import { SimulatorTab } from './components/SimulatorTab';
import { SpreadHistoryChart, SpreadPoint } from './components/SpreadHistoryChart';
import { useLocalStorage } from './hooks/useLocalStorage';
import {
  fetchLiveMarketSnapshot,
  fetchWorkerSpreadHistory,
  loadCachedMarketSnapshot,
  MarketSnapshot,
} from './services/ratesApi';
import { sendTelegramMessage, TelegramConfig } from './services/telegramApi';
import { AlertRule, OperationRecord } from './types/operations';
import { fmtBs, fmtPct } from './utils/format';

type ActiveTab = 'terminal' | 'simulator' | 'ledger' | 'alerts' | 'radar';

const DEFAULT_SNAPSHOT: MarketSnapshot =
  loadCachedMarketSnapshot() ?? {
    bcvUsd: 914.02,
    bcvEur: 1010.56,
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
    sourceStatus: 'cached',
  };

const DEFAULT_ALERTS: AlertRule[] = [
  {
    id: 'default-brecha-15',
    metric: 'brecha_pct',
    condition: 'gte',
    threshold: 15,
    enabled: true,
    label: 'Brecha (%) ≥ 15',
  },
];

export function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [activeTab, setActiveTab] = useState<ActiveTab>('terminal');
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('calcudivisas_pro_theme', 'light');
  const [snapshot, setSnapshot] = useState<MarketSnapshot>(DEFAULT_SNAPSHOT);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(60);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const [selectedBankId, setSelectedBankId] = useLocalStorage<string>('calcudivisas_pro_bank', 'bnc');
  const [operations, setOperations] = useLocalStorage<OperationRecord[]>('calcudivisas_pro_ops', []);
  const [alerts, setAlerts] = useLocalStorage<AlertRule[]>('calcudivisas_pro_alerts', DEFAULT_ALERTS);
  const [telegramConfig, setTelegramConfig] = useLocalStorage<TelegramConfig>('calcudivisas_pro_tg', {
    botToken: '',
    chatId: '',
    enabled: true,
    followedBanks: ['bdv', 'tesoro', 'mercantil', 'banesco', 'bdt'],
  });
  const [spreadHistory, setSpreadHistory] = useLocalStorage<SpreadPoint[]>(
    'calcudivisas_pro_spread_history',
    [
      {
        timestamp: DEFAULT_SNAPSHOT.capturedAt,
        bcvUsd: DEFAULT_SNAPSHOT.bcvUsd,
        binanceBuy: DEFAULT_SNAPSHOT.binanceBuy,
        brechaPct: DEFAULT_SNAPSHOT.brechaPct,
      },
    ],
  );

  const alertsRef = useRef(alerts);
  alertsRef.current = alerts;
  const tgRef = useRef(telegramConfig);
  tgRef.current = telegramConfig;

  const evaluateAlerts = useCallback(
    async (next: MarketSnapshot) => {
      const now = Date.now();
      const cooldownMs = 15 * 60 * 1000;
      const currentAlerts = alertsRef.current;
      const tg = tgRef.current;

      const getVal = (m: AlertRule['metric']) => {
        if (m === 'brecha_pct') return next.brechaPct;
        if (m === 'binance_buy') return next.binanceBuy;
        if (m === 'bybit_buy') return next.bybitBuy;
        return next.bcvUsd;
      };

      const triggeredIds: string[] = [];

      for (const rule of currentAlerts) {
        if (!rule.enabled) continue;
        const lastTs = rule.lastTriggeredAt ? Date.parse(rule.lastTriggeredAt) : 0;
        if (now - lastTs < cooldownMs) continue;

        const currentVal = getVal(rule.metric);
        const hit =
          rule.condition === 'gte' ? currentVal >= rule.threshold : currentVal <= rule.threshold;
        if (!hit) continue;

        triggeredIds.push(rule.id);

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('Alerta CalcuDivisas Pro', {
            body: `${rule.label} — Brecha actual: ${fmtPct(next.brechaPct)}`,
          });
        }

        if (tg.enabled && tg.botToken && tg.chatId) {
          const msg = [
            `<b>Alerta Automática — CalcuDivisas Pro</b>`,
            `Regla activada: <b>${rule.label}</b>`,
            `BCV USD: <b>${fmtBs(next.bcvUsd)} Bs</b>`,
            `Binance P2P: <b>${fmtBs(next.binanceBuy)} Bs</b>`,
            `Bybit P2P: <b>${fmtBs(next.bybitBuy)} Bs</b>`,
            `Brecha actual: <b>${fmtPct(next.brechaPct)}</b>`,
          ].join('\n');
          void sendTelegramMessage(tg.botToken, tg.chatId, msg);
        }
      }

      if (triggeredIds.length > 0) {
        const isoNow = new Date(now).toISOString();
        setAlerts((prev) =>
          prev.map((a) => (triggeredIds.includes(a.id) ? { ...a, lastTriggeredAt: isoNow } : a)),
        );
      }
    },
    [setAlerts],
  );

  const refreshMarket = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const next = await fetchLiveMarketSnapshot();
      setSnapshot(next);
      setSecondsUntilRefresh(60);

      setSpreadHistory((prev) => {
        const last = prev[prev.length - 1];
        if (
          last &&
          Math.abs(last.brechaPct - next.brechaPct) < 0.001 &&
          Date.now() - Date.parse(last.timestamp) < 5 * 60 * 1000
        ) {
          return prev;
        }
        const nextPoint: SpreadPoint = {
          timestamp: next.capturedAt || new Date().toISOString(),
          bcvUsd: next.bcvUsd,
          binanceBuy: next.binanceBuy,
          brechaPct: next.brechaPct,
        };
        return [...prev, nextPoint].slice(-48);
      });

      void evaluateAlerts(next);
    } finally {
      setIsRefreshing(false);
    }
  }, [evaluateAlerts, setSpreadHistory]);

  useEffect(() => {
    void refreshMarket();
    void fetchWorkerSpreadHistory(30).then((remote) => {
      if (remote.length > 0) {
        setSpreadHistory(remote.slice(-120));
      }
    });
  }, [refreshMarket, setSpreadHistory]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsUntilRefresh((prev) => {
        if (prev <= 1) {
          void refreshMarket();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [refreshMarket]);

  const handleLogOperation = (op: Omit<OperationRecord, 'id' | 'createdAt'>) => {
    const record: OperationRecord = {
      ...op,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setOperations((prev) => [record, ...prev]);
  };

  const handleDeleteOperation = (id: string) => {
    setOperations((prev) => prev.filter((op) => op.id !== id));
  };

  const handleClearOperations = () => {
    setOperations([]);
  };

  const handleAddAlert = (rule: Omit<AlertRule, 'id'>) => {
    setAlerts((prev) => [{ ...rule, id: crypto.randomUUID() }, ...prev]);
  };

  const handleToggleAlert = (id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, enabled: !a.enabled } : a)),
    );
  };

  const handleDeleteAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const navItems: { id: ActiveTab; label: string; icon: typeof Calculator; badge?: number }[] = [
    { id: 'terminal', label: 'Terminal', icon: Calculator },
    { id: 'simulator', label: 'Simulador', icon: Sliders },
    { id: 'ledger', label: 'Bitácora', icon: BookOpen, badge: operations.length || undefined },
    { id: 'alerts', label: 'Alertas', icon: Bell, badge: alerts.filter((a) => a.enabled).length || undefined },
    { id: 'radar', label: 'Radar TG', icon: Bot, badge: telegramConfig.followedBanks.length || undefined },
  ];

  if (view === 'landing') {
    return (
      <LandingPage
        snapshot={snapshot}
        theme={theme}
        onToggleTheme={toggleTheme}
        onEnterTerminal={(tab) => {
          if (tab) setActiveTab(tab);
          setView('app');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0b1120] dark:text-slate-100">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0b1120]/95">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setView('landing')}
              title="Volver a la página de inicio"
              className="flex h-8 w-8 items-center justify-center rounded-md bg-[#0067b8] font-mono text-xs font-bold text-white transition hover:bg-[#00569c]"
            >
              CD
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold tracking-tight text-slate-900 sm:text-base dark:text-slate-100">
                  CalcuDivisas <span className="text-[#0067b8] dark:text-sky-400">Pro</span>
                </h1>
                <button
                  type="button"
                  onClick={() => setView('landing')}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  <Home className="h-3 w-3" strokeWidth={1.75} />
                  Inicio
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Terminal Cambiaria · BCV vs Binance &amp; Bybit P2P
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <nav className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900/80">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? 'bg-[#0067b8] text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] leading-none ${
                          isActive
                            ? 'bg-white/20 text-white'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Cambiar a fondo blanco' : 'Cambiar a fondo oscuro'}
              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.75} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.75} />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Live Market Ticker */}
      <MarketTickerBar
        snapshot={snapshot}
        isRefreshing={isRefreshing}
        secondsUntilRefresh={secondsUntilRefresh}
        onRefresh={() => void refreshMarket()}
      />

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {activeTab === 'terminal' && (
          <ArbitrageTerminal
            snapshot={snapshot}
            selectedBankId={selectedBankId}
            onSelectBank={setSelectedBankId}
            onLogOperation={handleLogOperation}
          />
        )}
        {activeTab === 'simulator' && (
          <div className="space-y-6">
            <SpreadHistoryChart points={spreadHistory} />
            <SimulatorTab snapshot={snapshot} selectedBankId={selectedBankId} />
          </div>
        )}
        {activeTab === 'ledger' && (
          <LedgerTab
            operations={operations}
            onDeleteOperation={handleDeleteOperation}
            onClearAll={handleClearOperations}
          />
        )}
        {activeTab === 'alerts' && (
          <AlertsTab
            snapshot={snapshot}
            alerts={alerts}
            onAddAlert={handleAddAlert}
            onToggleAlert={handleToggleAlert}
            onDeleteAlert={handleDeleteAlert}
          />
        )}
        {activeTab === 'radar' && (
          <BankRadarPanel
            snapshot={snapshot}
            config={telegramConfig}
            onChangeConfig={setTelegramConfig}
          />
        )}
      </main>
    </div>
  );
}

export default App;
