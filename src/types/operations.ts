export interface OperationRecord {
  id: string;
  createdAt: string;
  bankId: string;
  bankName: string;
  usdAmount: number;
  tasaBanco: number;
  tasaP2P: number;
  totalInvertidoBs: number;
  netoUsdt: number;
  gananciaBs: number;
  gananciaUsdt: number;
  roiPct: number;
  note?: string;
}

export interface AlertRule {
  id: string;
  metric: 'brecha_pct' | 'binance_buy' | 'bybit_buy' | 'bcv_usd';
  condition: 'gte' | 'lte';
  threshold: number;
  enabled: boolean;
  label: string;
  lastTriggeredAt?: string;
}
