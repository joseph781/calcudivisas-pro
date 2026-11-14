export function fmtBs(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0,00';
  return value.toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function fmtUsd(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '$0.00';
  const sign = value < 0 ? '-' : '';
  return `${sign}$${Math.abs(value).toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function fmtPct(value: number, decimals = 2, withSign = false): string {
  if (!Number.isFinite(value)) return '0,00%';
  const prefix = withSign && value > 0 ? '+' : '';
  return `${prefix}${value.toLocaleString('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

export function fmtTimeAgo(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return 'Reciente';
  const diffSec = Math.max(0, Math.floor((Date.now() - ts) / 1000));
  if (diffSec < 60) return `hace ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `hace ${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  return `hace ${diffHr}h`;
}
