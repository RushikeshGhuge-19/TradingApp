export type PositionType = 'FLAT' | 'LONG' | 'SHORT';

export interface Trade {
  id?: string; // Optional for new trades from backend
  symbol: string;
  timeframe: string;
  direction: 'LONG' | 'SHORT';
  entry_time: string;
  entry_price: number;
  exit_time: string;
  exit_price: number;
  pnl_points: number;
  pnl_money: number;
  reason: string;
  created_at?: string;
}

export interface EquityPoint {
  id?: number;
  time: string;
  equity: number;
}

export interface StatusResponse {
  symbol: string;
  timeframe: string;
  position: string; // 'FLAT' | 'LONG' | 'SHORT'
  lots: number;
  entry_time: string | null;
  entry_price: number | null;
  current_price: number;
  last_price_time: string | null; // ISO timestamp of the last price from yfinance
  pnl_points: number;
  pnl_money: number;
  today_pnl_money: number;
  winrate: number;
  max_drawdown_pct: number;
  tp_reached: boolean;
  current_stop: number | null;
}

// Transform backend response to frontend types
export interface FrontendStatus extends StatusResponse {
  position_status: PositionType; // Alias for display
  live_pnl_points: number; // Alias
  live_pnl_money: number; // Alias
  today_pnl: number; // Alias
  max_drawdown: number; // Alias
  current_trailing_stop: number | null; // Alias
  lot_size: number; // Alias
}
