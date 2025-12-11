/**
 * Zustand trading store for centralized state management.
 * Handles bars, strategy, backtest results, live simulation, and persistence.
 * Date: 2025-12-11
 */

import { create } from 'zustand';
// TODO: Migrate to new rule-dsl types when consolidating engines
// Temporary local stubs to avoid missing-engine imports during front-end build
type Bar = any;
type StrategyParams = any;
type TradeRecord = any;
type Summary = any;
type Marker = any;
type OpenPosition = any;
type BacktestResult = any;

// runBacktest engine reference removed; frontend uses `backtestAPI` service instead

interface Strategy {
  id: string;
  name: string;
  params: StrategyParams;
  code?: string; // for code mode
  created_at: string;
  updated_at: string;
}

interface TradingStore {
  // Data
  bars: Bar[];
  currentStrategy: Strategy | null;
  openPositions: OpenPosition[];
  trades: TradeRecord[];
  summary: Summary;
  markers: Marker[];
  equity: number[];
  strategies: Strategy[];

  // Simulation state
  isSimulating: boolean;
  simulationProgress: number; // 0..1

  // Actions: Data loading
  loadBars: (bars: Bar[]) => void;
  clearBars: () => void;

  // Actions: Strategy management
  saveStrategy: (strategy: Strategy) => Promise<void>;
  loadStrategy: (id: string) => void;
  listStrategies: () => Strategy[];
  setCurrentStrategy: (strategy: Strategy) => void;

  // Actions: Backtest
  runBacktest: () => Promise<void>;
  clearBacktestResults: () => void;

  // Actions: Live simulation
  startLiveSimulation: () => void;
  pauseLiveSimulation: () => void;
  stopLiveSimulation: () => void;
  updateOpenPositions: (positions: OpenPosition[]) => void;
  addTrade: (trade: TradeRecord) => void;

  // Actions: Global
  clearAll: () => void;
}

const DEFAULT_STRATEGY_PARAMS: StrategyParams = {
  rsiPeriod: 14,
  emaRsiShort: 5,
  emaRsiLong: 25,
  normLookback: 100,
  sl_points: 50,
  enableSL: true,
  lot_size: 1,
  contract_multiplier: 1,
  charge_mode_fixed: true,
  fixed_charge_per_trade: 50,
  charges_components: {
    c_brokerage: 20,
    c_exchange_txn: 5,
    c_dp: 5,
    c_stt: 0,
    c_sebi: 2,
    c_ipft: 2,
    c_stamp: 0,
    c_gst: 13,
  },
};

const STRATEGIES_STORAGE_KEY = 'trading.strategies';
const CURRENT_STRATEGY_KEY = 'trading.currentStrategy';

/**
 * Helper: Load strategies from localStorage.
 */
const loadStrategiesFromStorage = (): Strategy[] => {
  try {
    const stored = localStorage.getItem(STRATEGIES_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    console.warn('Failed to load strategies from localStorage');
    return [];
  }
};

/**
 * Helper: Save strategies to localStorage.
 */
const saveStrategiesToStorage = (strategies: Strategy[]): void => {
  try {
    localStorage.setItem(STRATEGIES_STORAGE_KEY, JSON.stringify(strategies));
  } catch {
    console.error('Failed to save strategies to localStorage');
  }
};

/**
 * Helper: Load current strategy from localStorage.
 */
const loadCurrentStrategyFromStorage = (): Strategy | null => {
  try {
    const stored = localStorage.getItem(CURRENT_STRATEGY_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    console.warn('Failed to load current strategy from localStorage');
    return null;
  }
};

/**
 * Helper: Save current strategy to localStorage.
 */
const saveCurrentStrategyToStorage = (strategy: Strategy | null): void => {
  try {
    if (strategy) {
      localStorage.setItem(CURRENT_STRATEGY_KEY, JSON.stringify(strategy));
    } else {
      localStorage.removeItem(CURRENT_STRATEGY_KEY);
    }
  } catch {
    console.error('Failed to save current strategy to localStorage');
  }
};

export const useTradingStore = create<TradingStore>((set, get) => ({
  // Initial state
  bars: [],
  currentStrategy: loadCurrentStrategyFromStorage() || {
    id: 'default',
    name: 'Default Strategy',
    params: DEFAULT_STRATEGY_PARAMS,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  openPositions: [],
  trades: [],
  summary: { trades: 0, gross: 0, charges: 0, net: 0 },
  markers: [],
  equity: [],
  strategies: loadStrategiesFromStorage(),
  isSimulating: false,
  simulationProgress: 0,

  // Actions: Data loading
  loadBars: (bars: Bar[]) => {
    set({ bars });
  },

  clearBars: () => {
    set({ bars: [] });
  },

  // Actions: Strategy management
  saveStrategy: async (strategy: Strategy) => {
    const strategies = get().strategies.filter(s => s.id !== strategy.id);
    strategies.push(strategy);
    saveStrategiesToStorage(strategies);
    set({ strategies });
  },

  loadStrategy: (id: string) => {
    const strategies = get().strategies;
    const found = strategies.find(s => s.id === id);
    if (found) {
      saveCurrentStrategyToStorage(found);
      set({ currentStrategy: found });
    }
  },

  listStrategies: () => {
    return get().strategies;
  },

  setCurrentStrategy: (strategy: Strategy) => {
    saveCurrentStrategyToStorage(strategy);
    set({ currentStrategy: strategy });
  },

  // Actions: Backtest
  runBacktest: async () => {
    const { bars, currentStrategy } = get();
    if (!bars.length || !currentStrategy) {
      console.error('Cannot run backtest: no bars or strategy');
      return;
    }

    try {
      const result = runBacktestEngine(bars, currentStrategy.params);
      set({
        trades: result.trades,
        summary: result.summary,
        markers: result.markers,
        equity: result.equity || [],
      });
    } catch (err) {
      console.error('Backtest failed:', err);
    }
  },

  clearBacktestResults: () => {
    set({
      trades: [],
      summary: { trades: 0, gross: 0, charges: 0, net: 0 },
      markers: [],
      equity: [],
    });
  },

  // Actions: Live simulation
  startLiveSimulation: () => {
    set({ isSimulating: true, simulationProgress: 0 });
  },

  pauseLiveSimulation: () => {
    set({ isSimulating: false });
  },

  stopLiveSimulation: () => {
    set({ isSimulating: false, simulationProgress: 0, openPositions: [] });
  },

  updateOpenPositions: (positions: OpenPosition[]) => {
    set({ openPositions: positions });
  },

  addTrade: (trade: TradeRecord) => {
    const trades = [...get().trades, trade];
    set({ trades });
  },

  // Actions: Global
  clearAll: () => {
    set({
      bars: [],
      trades: [],
      summary: { trades: 0, gross: 0, charges: 0, net: 0 },
      markers: [],
      equity: [],
      openPositions: [],
      isSimulating: false,
      simulationProgress: 0,
    });
  },
}));
