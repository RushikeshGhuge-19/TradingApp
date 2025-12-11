import { StatusResponse, Trade, EquityPoint, FrontendStatus } from '../types';

export interface StrategyConfig {
  id: number;
  symbol: string;
  timeframe: string;
  rsi_period: number;
  ema_fast: number;
  ema_slow: number;
  trend_ema: number;
  tp_points: number;
  trail_offset: number;
  lot_size: number;
  updated_at: string;
}

export interface StrategyConfigUpdate {
  symbol?: string;
  timeframe?: string;
  rsi_period?: number;
  ema_fast?: number;
  ema_slow?: number;
  trend_ema?: number;
  tp_points?: number;
  trail_offset?: number;
  lot_size?: number;
}

export interface BacktestTrade {
  direction: "LONG" | "SHORT";
  entry_time: string | Date;
  entry_price: number;
  exit_time: string | Date;
  exit_price: number;
  pnl_points: number;
  pnl_money: number;
  reason: string;
}

// EquityPoint is already imported from '../types' above

export interface BacktestSummary {
  total_trades: number;
  win_trades: number;
  loss_trades: number;
  winrate: number;
  net_pnl_money: number;
  net_pnl_points: number;
  max_drawdown_pct: number;
  best_trade: BacktestTrade | null;
  worst_trade: BacktestTrade | null;
}

export interface BacktestResult {
  summary: BacktestSummary;
  equity_curve: EquityPoint[];
  trades: BacktestTrade[];
}

export interface BacktestRequest {
  symbol: string;
  timeframe: string;
  start_date: Date | string;
  end_date: Date | string;
  rsi_period?: number;
  ema_fast?: number;
  ema_slow?: number;
  trend_ema?: number;
  tp_points?: number;
  trail_offset?: number;
  lot_size?: number;
}

// Default backend URL. Update to 8001 if you run the backend on port 8001.
const BACKEND_URL = 'http://127.0.0.1:8001/api';
const USE_MOCK = false; // Set to true to use mock data

// Transform backend StatusResponse to FrontendStatus
const transformStatusResponse = (data: StatusResponse): FrontendStatus => {
  return {
    ...data,
    position_status: data.position as any,
    live_pnl_points: data.pnl_points,
    live_pnl_money: data.pnl_money,
    today_pnl: data.today_pnl_money,
    max_drawdown: data.max_drawdown_pct,
    current_trailing_stop: data.current_stop,
    lot_size: 30, // Default lot size for BANKNIFTY
  };
};

// Transform backend EquityPoint to frontend format
const transformEquityPoint = (data: any): EquityPoint => {
  return {
    id: data.id,
    time: data.time,
    equity: data.equity,
  };
};

// Transform backend Trade to frontend format (add id if missing)
const transformTrade = (data: Trade, index?: number): Trade => {
  return {
    ...data,
    id: data.id || `TRD-${index || Date.now()}`,
  };
};

// Real API calls
const fetchFromBackend = async <T>(endpoint: string): Promise<T> => {
  try {
    const response = await fetch(`${BACKEND_URL}${endpoint}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.warn(`Failed to fetch from backend ${endpoint}:`, error);
    throw error;
  }
};

export const fetchStatus = async (): Promise<FrontendStatus> => {
  if (USE_MOCK) {
    return mockFetchStatus();
  }
  
  try {
    const data = await fetchFromBackend<StatusResponse>('/status');
    return transformStatusResponse(data);
  } catch (error) {
    console.log('Falling back to mock data for status');
    return mockFetchStatus();
  }
};

export const fetchTrades = async (): Promise<Trade[]> => {
  if (USE_MOCK) {
    return mockFetchTrades();
  }
  
  try {
    const data = await fetchFromBackend<Trade[]>('/trades');
    return data.map(transformTrade);
  } catch (error) {
    console.log('Falling back to mock data for trades');
    return mockFetchTrades();
  }
};

export const fetchEquityCurve = async (): Promise<EquityPoint[]> => {
  if (USE_MOCK) {
    return mockFetchEquityCurve();
  }
  
  try {
    const data = await fetchFromBackend<any[]>('/equity_curve');
    return data.map(transformEquityPoint);
  } catch (error) {
    console.log('Falling back to mock data for equity curve');
    return mockFetchEquityCurve();
  }
};

export const fetchMarketCandles = async (interval = '30m', lookback_days = 1, symbol?: string): Promise<any[]> => {
  if (USE_MOCK) {
    return [];
  }

  try {
    const params = new URLSearchParams();
    if (symbol) params.set('symbol', symbol);
    params.set('interval', interval);
    params.set('lookback_days', String(lookback_days));

    const data = await fetchFromBackend<any[]>(`/market/candles?${params.toString()}`);
    return data;
  } catch (error) {
    console.log('Falling back to empty market candles');
    return [];
  }
};

export const getStrategyConfig = async (): Promise<StrategyConfig> => {
  try {
    const data = await fetchFromBackend<StrategyConfig>('/strategy');
    return data;
  } catch (error) {
    console.error('Failed to fetch strategy config', error);
    throw error;
  }
};

export const updateStrategyConfig = async (payload: StrategyConfigUpdate): Promise<StrategyConfig> => {
  try {
    const response = await fetch(`${BACKEND_URL}/strategy`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to update strategy config', error);
    throw error;
  }
};

export const runBacktest = async (request: BacktestRequest): Promise<BacktestResult> => {
  try {
    // Ensure dates are strings in YYYY-MM-DD format
    const formatDate = (date: Date | string): string => {
      if (typeof date === 'string') {
        // If already a string, ensure it's in YYYY-MM-DD format
        if (date.includes('T')) {
          return date.split('T')[0]; // ISO format to date-only
        }
        return date;
      }
      // Convert Date object to YYYY-MM-DD
      return date.toISOString().split('T')[0];
    };

    const payload = {
      symbol: request.symbol,
      timeframe: request.timeframe,
      start_date: formatDate(request.start_date),
      end_date: formatDate(request.end_date),
      ...(request.rsi_period !== undefined && { rsi_period: request.rsi_period }),
      ...(request.ema_fast !== undefined && { ema_fast: request.ema_fast }),
      ...(request.ema_slow !== undefined && { ema_slow: request.ema_slow }),
      ...(request.trend_ema !== undefined && { trend_ema: request.trend_ema }),
      ...(request.tp_points !== undefined && { tp_points: request.tp_points }),
      ...(request.trail_offset !== undefined && { trail_offset: request.trail_offset }),
      ...(request.lot_size !== undefined && { lot_size: request.lot_size }),
    };

    console.log('Sending backtest payload:', payload);
    const response = await fetch(`${BACKEND_URL}/backtest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Backtest request failed', error);
    throw error;
  }
};

export const saveBacktestTrades = async (trades: BacktestTrade[]): Promise<{ status: string; saved_count: number }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/trades/save_backtest_trades`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(trades),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to save backtest trades', error);
    throw error;
  }
};

// --- MOCK DATA FALLBACK ---

const mockFetchStatus = async (): Promise<FrontendStatus> => {
  await new Promise(r => setTimeout(r, 100));
  return {
    symbol: 'BANKNIFTY',
    timeframe: '15m',
    position: 'FLAT',
    lots: 0,
    entry_time: null,
    entry_price: null,
    current_price: 44500.0,
    last_price_time: new Date().toISOString(),
    pnl_points: 0.0,
    pnl_money: 0.0,
    today_pnl_money: 0.0,
    winrate: 65.0,
    max_drawdown_pct: 12.5,
    tp_reached: false,
    current_stop: null,
    position_status: 'FLAT',
    live_pnl_points: 0.0,
    live_pnl_money: 0.0,
    today_pnl: 0.0,
    max_drawdown: 12.5,
    current_trailing_stop: null,
    lot_size: 15,
  };
};

const mockFetchTrades = async (): Promise<Trade[]> => {
  await new Promise(r => setTimeout(r, 100));
  const mockTrades: Trade[] = [];
  for (let i = 20; i > 0; i--) {
    const entryTime = new Date(Date.now() - i * 3600 * 1000);
    const exitTime = new Date(entryTime.getTime() + 15 * 60000);
    mockTrades.push({
      id: `TRD-${1000 + i}`,
      symbol: 'BANKNIFTY',
      timeframe: '15m',
      direction: Math.random() > 0.5 ? 'LONG' : 'SHORT',
      entry_time: entryTime.toISOString(),
      entry_price: 44000 + Math.random() * 1000,
      exit_time: exitTime.toISOString(),
      exit_price: 44000 + Math.random() * 1000,
      pnl_points: Math.random() > 0.35 ? 50 : -30,
      pnl_money: Math.random() > 0.35 ? 750 : -450,
      reason: 'TSL',
    });
  }
  return mockTrades;
};

const mockFetchEquityCurve = async (): Promise<EquityPoint[]> => {
  await new Promise(r => setTimeout(r, 100));
  const curve: EquityPoint[] = [];
  let equity = 100000;
  for (let i = 0; i < 20; i++) {
    equity += Math.random() > 0.35 ? 750 : -450;
    curve.push({
      time: new Date(Date.now() - (20 - i) * 3600 * 1000).toISOString(),
      equity: equity,
    });
  }
  return curve;
};
