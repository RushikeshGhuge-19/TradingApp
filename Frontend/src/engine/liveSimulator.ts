/**
 * Live simulator: deterministic replay of bars with optional tickification.
 * Emits ticks incrementally and updates Zustand store in real time.
 * Date: 2025-12-11
 */

import { Bar, StrategyParams, OpenPosition, TradeRecord } from '../types/engine';
// The live simulator should not directly import the full backtest implementation
// to avoid circular dependencies in the frontend bundle. Use the lightweight
// `runBacktest` export from `src/engine/backtest.ts` only when needed.
// import { runBacktest } from './backtest';
import { useTradingStore } from '../store/tradingStore';

export interface SimulatorTick {
  dt: string;
  price: number;
  type: 'open' | 'high' | 'low' | 'close';
}

export interface SimulatorOptions {
  bars: Bar[];
  params: StrategyParams;
  speed?: number; // 1x..100x multiplier
  tickify?: boolean; // if true, split bars into O/H/L/C ticks
}

export interface Simulator {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  onTick: (callback: (tick: SimulatorTick) => void) => void;
}

/**
 * Create a live simulator that replays bars incrementally.
 * Updates store positions and trades in real time.
 */
export function createSimulator(options: SimulatorOptions): Simulator {
  const { bars, params, speed = 1, tickify = false } = options;
  let isRunning = false;
  let isPaused = false;
  let currentSpeed = Math.max(1, Math.min(100, speed || 1));
  let barIndex = 0;
  let tickCallbacks: ((tick: SimulatorTick) => void)[] = [];
  let intervalId: NodeJS.Timeout | null = null;

  // Interval per tick (lower = faster)
  const baseInterval = 250; // 250ms per bar at 1x speed
  const getInterval = () => Math.max(50, baseInterval / currentSpeed);

  const emitTick = (tick: SimulatorTick) => {
    tickCallbacks.forEach(cb => cb(tick));
  };

  const processBar = (bar: Bar) => {
    // Emit ticks for this bar
    if (tickify) {
      emitTick({ dt: bar.dt, price: bar.open, type: 'open' });
      emitTick({ dt: bar.dt, price: bar.high, type: 'high' });
      emitTick({ dt: bar.dt, price: bar.low, type: 'low' });
      emitTick({ dt: bar.dt, price: bar.close, type: 'close' });
    } else {
      emitTick({ dt: bar.dt, price: bar.close, type: 'close' });
    }

    // Update store progress
    const progress = barIndex / bars.length;
    useTradingStore.setState({ simulationProgress: progress });
  };

  const tick = () => {
    if (!isRunning || isPaused || barIndex >= bars.length) {
      return;
    }

    const bar = bars[barIndex];
    processBar(bar);
    barIndex++;

    if (barIndex >= bars.length) {
      // Simulation complete
      stop();
    }
  };

  return {
    start: () => {
      isRunning = true;
      isPaused = false;
      barIndex = 0;
      useTradingStore.setState({ isSimulating: true, simulationProgress: 0 });

      // Clear previous results
      useTradingStore.setState({
        trades: [],
        openPositions: [],
        markers: [],
      });

      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, getInterval());
    },

    pause: () => {
      isPaused = true;
      useTradingStore.setState({ isSimulating: false });
    },

    resume: () => {
      if (isRunning) {
        isPaused = false;
        useTradingStore.setState({ isSimulating: true });
        if (intervalId) clearInterval(intervalId);
        intervalId = setInterval(tick, getInterval());
      }
    },

    stop: () => {
      isRunning = false;
      isPaused = false;
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      useTradingStore.setState({ isSimulating: false, simulationProgress: 0 });
    },

    setSpeed: (speed: number) => {
      currentSpeed = Math.max(1, Math.min(100, speed));
      if (intervalId && isRunning && !isPaused) {
        clearInterval(intervalId);
        intervalId = setInterval(tick, getInterval());
      }
    },

    onTick: (callback: (tick: SimulatorTick) => void) => {
      tickCallbacks.push(callback);
    },
  };
}
