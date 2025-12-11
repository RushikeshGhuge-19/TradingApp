/**
 * Core engine types matching PineScript semantics.
 * These types are used throughout the backtest engine, store, and UI.
 * Date: 2025-12-11
 */

/**
 * Single OHLCV bar.
 */
export type Bar = {
  dt: string; // ISO datetime string (e.g., "2025-12-11T10:30:00Z")
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
};

/**
 * Strategy parameters controlling indicator, entry, exit, and fees.
 * Maps to form inputs in StrategyBuilder.
 */
export type StrategyParams = {
  // Indicator params
  rsiPeriod: number;
  emaRsiShort: number;
  emaRsiLong: number;
  normLookback: number;

  // Execution params
  sl_points: number;
  enableSL: boolean;
  lot_size: number;
  contract_multiplier: number;

  // Charges
  charge_mode_fixed: boolean;
  fixed_charge_per_trade: number;
  charges_components?: {
    c_brokerage?: number;
    c_exchange_txn?: number;
    c_dp?: number;
    c_stt?: number;
    c_sebi?: number;
    c_ipft?: number;
    c_stamp?: number;
    c_gst?: number;
  };
};

/**
 * A single closed trade with entry, exit, and accounting.
 */
export type TradeRecord = {
  tradeNo: number; // 1-based trade counter
  entryIndex: number; // bar index at entry
  exitIndex: number; // bar index at exit
  entryDt: string; // ISO datetime
  exitDt: string; // ISO datetime
  entryPrice: number;
  exitPrice: number;
  dir: 'LONG' | 'SHORT';
  gross: number; // points * lot_size * contract_multiplier
  charges: number; // fixed or component sum
  net: number; // gross - charges
};

/**
 * Cumulative summary after all trades.
 */
export type Summary = {
  trades: number; // count of closed trades
  gross: number; // cumulative gross P&L
  charges: number; // cumulative charges
  net: number; // cumulative net P&L
};

/**
 * Chart marker for entry/exit visualization.
 */
export type Marker = {
  time: string; // dt in ISO string (or unix timestamp if chart lib expects)
  price: number;
  text: string; // e.g., "E#1", "X#1", "Entry", "Exit"
  color?: string; // chart-specific color
  shape?: 'arrowUp' | 'arrowDown' | 'circle'; // hint for charting
};

/**
 * Backtest result: trades, summary, markers, and optional equity series.
 */
export type BacktestResult = {
  trades: TradeRecord[];
  summary: Summary;
  markers: Marker[];
  equity?: number[]; // cumulative equity curve (optional)
};

/**
 * Live simulator state: current position and open trades.
 */
export type OpenPosition = {
  id: string; // unique identifier
  symbol: string;
  qty: number;
  entryPrice: number;
  entryIndex: number;
  dir: 'LONG' | 'SHORT';
};
