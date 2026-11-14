import { useState } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { MarketSnapshot } from '../services/ratesApi';
import { AlertRule } from '../types/operations';
import { fmtBs, fmtPct } from '../utils/format';

interface AlertsTabProps {
  snapshot: MarketSnapshot;
  alerts: AlertRule[];
  onAddAlert: (rule: Omit<AlertRule, 'id'>) => void;
  onToggleAlert: (id: string) => void;
  onDeleteAlert: (id: string) => void;
}

export function AlertsTab({
  snapshot,
  alerts,
  onAddAlert,
  onToggleAlert,
  onDeleteAlert,
}: AlertsTabProps) {
  const [metric, setMetric] = useState<AlertRule['metric']>('brecha_pct');
  const [condition, setCondition] = useState<AlertRule['condition']>('gte');
  const [threshold, setThreshold] = useState<string>('18');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission | 'unsupported'>(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported',
  );

  const requestPush = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === 'granted') {
      new Notification('CalcuDivisas Pro', {
        body: 'Alertas de brecha y P2P activadas correctamente.',
      });
    }
  };

  const getCurrentValue = (m: AlertRule['metric']): number => {
    switch (m) {
      case 'brecha_pct':
        return snapshot.brechaPct;
      case 'binance_buy':
        return snapshot.binanceBuy;
      case 'bybit_buy':
        return snapshot.bybitBuy;
      case 'bcv_usd':
        return snapshot.bcvUsd;
    }
  };

  const isTriggered = (rule: AlertRule): boolean => {
    if (!rule.enabled) return false;
    const val = getCurrentValue(rule.metric);
    return rule.condition === 'gte' ? val >= rule.threshold : val <= rule.threshold;
  };

  const metricLabel: Record<AlertRule['metric'], string> = {
    brecha_pct: 'Brecha (%)',
    binance_buy: 'Binance P2P (Bs)',
    bybit_buy: 'Bybit P2P (Bs)',
    bcv_usd: 'BCV USD (Bs)',
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(threshold);
    if (!Number.isFinite(num) || num <= 0) return;
    onAddAlert({
      metric,
      condition,
      threshold: num,
      enabled: true,
      label: `${metricLabel[metric]} ${condition === 'gte' ? '≥' : '≤'} ${num}`,
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-5 dark:border-slate-800/90 dark:bg-slate-900/75">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
            Nueva Regla de Alerta
          </h2>
          {notifPermission !== 'unsupported' && (
            <button
              type="button"
              onClick={requestPush}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold transition ${
                notifPermission === 'granted'
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
                  : 'border-blue-200 bg-blue-50 text-[#0067b8] hover:bg-blue-100 dark:border-sky-500/40 dark:bg-sky-500/15 dark:text-sky-300'
              }`}
            >
              {notifPermission === 'granted' ? 'Notificaciones Activas' : 'Activar Push'}
            </button>
          )}
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
              Indicador
            </label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value as AlertRule['metric'])}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#0067b8] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <option value="brecha_pct">Brecha P2P vs BCV (%)</option>
              <option value="binance_buy">Binance P2P Compra (Bs)</option>
              <option value="bybit_buy">Bybit P2P Compra (Bs)</option>
              <option value="bcv_usd">Tasa Oficial BCV USD (Bs)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Condición
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as AlertRule['condition'])}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-900 outline-none focus:border-[#0067b8] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <option value="gte">Mayor o igual (≥)</option>
                <option value="lte">Menor o igual (≤)</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-400">
                Umbral
              </label>
              <input
                type="number"
                step="0.01"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-xs font-semibold text-slate-900 outline-none focus:border-[#0067b8] dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-[#0067b8] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#00569c]"
          >
            <Plus className="h-4 w-4" />
            Crear Alerta
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-7 dark:border-slate-800/90 dark:bg-slate-900/75">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold tracking-wider text-slate-500 uppercase dark:text-slate-300">
            Monitor de Umbrales ({alerts.length})
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Brecha actual:{' '}
            <strong className="font-mono text-[#0067b8] dark:text-sky-300">
              {fmtPct(snapshot.brechaPct)}
            </strong>
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50/50 py-10 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-slate-950/40">
            No tienes reglas activas. Crea una alerta para monitorear oportunidades de arbitraje.
          </div>
        ) : (
          <div className="space-y-2.5">
            {alerts.map((rule) => {
              const triggered = isTriggered(rule);
              const current = getCurrentValue(rule.metric);
              return (
                <div
                  key={rule.id}
                  className={`flex items-center justify-between rounded-lg border px-4 py-3 transition ${
                    triggered
                      ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/10'
                      : 'border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {triggered ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                    )}
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                        {rule.label}
                      </div>
                      <div className="mt-0.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        Actual:{' '}
                        {rule.metric === 'brecha_pct' ? fmtPct(current) : `${fmtBs(current)} Bs`} ·{' '}
                        {triggered ? (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                            Umbral alcanzado
                          </span>
                        ) : (
                          'En espera'
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onToggleAlert(rule.id)}
                      className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold ${
                        rule.enabled
                          ? 'border-blue-200 bg-blue-50 text-[#0067b8] dark:border-sky-500/40 dark:bg-sky-500/10 dark:text-sky-300'
                          : 'border-slate-200 bg-slate-100 text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400'
                      }`}
                    >
                      {rule.enabled ? 'Activa' : 'Pausada'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteAlert(rule.id)}
                      className="rounded p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-slate-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
