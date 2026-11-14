export type CardFeeMode = 'fija' | 'ninguna' | 'selector';

export interface BankConfig {
  id: string;
  name: string;
  shortName: string;
  accentColor: string;
  /** Bank mesa de cambio / intervención purchase commission (e.g. 0.005 = 0.5%) */
  comisionCompra: number;
  cardMode: CardFeeMode;
  /** Fixed international card usage fee (e.g. 0.025 = 2.5%) */
  pctFija: number;
  /** Additional card recharge fee (e.g. Banco Activo 1.5%) */
  pctRecarga?: number;
  /** Deferred Bs fee on international spend (e.g. Banesco 1.5% in Bs) */
  pctBsDiferido?: number;
  /** Whether the fee structure is unconfirmed / community-reported */
  sinConfirmar?: boolean;
  note?: string;
}

export const VENEZUELAN_BANKS: BankConfig[] = [
  {
    id: 'bnc',
    name: 'Banco Nacional de Crédito (BNC)',
    shortName: 'BNC',
    accentColor: '#f37021',
    comisionCompra: 0.003,
    cardMode: 'fija',
    pctFija: 0.015,
    note: 'Comisión de compra más baja (0,3%) y tarjeta internacional al 1,5%.',
  },
  {
    id: 'bbva',
    name: 'BBVA Provincial',
    shortName: 'BBVA',
    accentColor: '#5fb4ef',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.015,
    note: 'Master Debit cobra 1,5% por uso internacional.',
  },
  {
    id: 'bdv',
    name: 'Banco de Venezuela (BDV)',
    shortName: 'BDV',
    accentColor: '#dc2f3d',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.025,
    note: 'Master Debit física y virtual cobran 2,5% por uso internacional.',
  },
  {
    id: 'banesco',
    name: 'Banesco',
    shortName: 'Banesco',
    accentColor: '#6cc24a',
    comisionCompra: 0.005,
    cardMode: 'ninguna',
    pctFija: 0,
    pctBsDiferido: 0.015,
    note: 'Sin % en USD en tarjeta; aplica 1,5% diferido en Bs.',
  },
  {
    id: 'mercantil',
    name: 'Banco Mercantil',
    shortName: 'Mercantil',
    accentColor: '#f7a600',
    comisionCompra: 0.005,
    cardMode: 'ninguna',
    pctFija: 0,
    note: 'Requiere puente vía Zinli o Mercantil Panamá (Mony).',
  },
  {
    id: 'tesoro',
    name: 'Banco del Tesoro',
    shortName: 'Tesoro',
    accentColor: '#7c4dff',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.025,
  },
  {
    id: 'bdt',
    name: 'Banco Digital de los Trabajadores (BDT)',
    shortName: 'BDT',
    accentColor: '#e91e8c',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.025,
  },
  {
    id: 'banco_activo',
    name: 'Banco Activo',
    shortName: 'Activo',
    accentColor: '#e53935',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.015,
    pctRecarga: 0.015,
    note: '1,5% recarga de tarjeta + 1,5% uso internacional.',
  },
  {
    id: 'bancamiga',
    name: 'Bancamiga',
    shortName: 'Bancamiga',
    accentColor: '#00a99d',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.048,
    note: 'Comisión internacional elevada (4,8%).',
  },
  {
    id: 'bfc',
    name: 'Banco Fondo Común (BFC)',
    shortName: 'BFC',
    accentColor: '#ffc107',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.025,
    sinConfirmar: true,
  },
  {
    id: 'banco_100',
    name: '100% Banco',
    shortName: '100% Banco',
    accentColor: '#009688',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.025,
    sinConfirmar: true,
  },
  {
    id: 'banplus',
    name: 'Banplus',
    shortName: 'Banplus',
    accentColor: '#ffca28',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.025,
    sinConfirmar: true,
  },
  {
    id: 'banco_plaza',
    name: 'Banco Plaza',
    shortName: 'Plaza',
    accentColor: '#1e88e5',
    comisionCompra: 0.005,
    cardMode: 'fija',
    pctFija: 0.025,
    sinConfirmar: true,
  },
  {
    id: 'banco_exterior',
    name: 'Banco Exterior',
    shortName: 'Exterior',
    accentColor: '#f5821f',
    comisionCompra: 0.005,
    cardMode: 'selector',
    pctFija: 0.02,
    sinConfirmar: true,
    note: 'Comisión de tarjeta configurable según tipo de producto.',
  },
];

export const BANK_BY_ID: Record<string, BankConfig> = Object.fromEntries(
  VENEZUELAN_BANKS.map((bank) => [bank.id, bank]),
);
