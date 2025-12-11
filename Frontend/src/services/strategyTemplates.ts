/**
 * Strategy Templates: Example DSL Strategies
 * Ready-to-use templates for common trading approaches
 */

import { StrategyDSL } from '../types/rule-dsl';

// ============================================================================
// Template 1: Simple RSI Momentum
// ============================================================================

export const rsiMomentum: StrategyDSL = {
  name: "RSI Momentum",
  version: 1,
  meta: {
    defaultCapital: 100000,
    timeframe: "15m",
    symbols: ["NIFTYBANK.NS"],
  },
  indicators: [
    { id: "rsi14", type: "rsi", params: { period: 14 } },
  ],
  rules: {
    entry: {
      type: "and",
      nodes: [
        {
          type: "condition",
          left: { kind: "indicator", id: "rsi14" },
          op: ">",
          right: { kind: "number", value: 70 },
        },
      ],
    },
    exit: {
      type: "condition",
      left: { kind: "indicator", id: "rsi14" },
      op: "<",
      right: { kind: "number", value: 50 },
    },
  },
  risk: {
    sizing: { type: "fixed_lot", lots: 1 },
    sl: { enabled: true, type: "points", value: 20 },
    tp: { enabled: true, type: "points", value: 50 },
  },
  execution: {
    entryFill: "CLOSE",
    charges: { mode: "fixed", fixedCharge: 50 },
    contractMultiplier: 1,
    lotSize: 1,
  },
};

// ============================================================================
// Template 2: Dual EMA on RSI (Your Scaled Strategy)
// ============================================================================

export const dualEmaRsi: StrategyDSL = {
  name: "Dual EMA RSI Strategy",
  version: 1,
  meta: {
    defaultCapital: 100000,
    timeframe: "15m",
    symbols: ["NIFTYBANK.NS"],
    description: "RSI(56) with EMA smoothing. Entry when fast EMA > slow EMA.",
  },
  indicators: [
    { id: "rsi56", type: "rsi", params: { period: 56 } },
    {
      id: "ema_rsi_fast",
      type: "ema",
      params: { period: 3, source: "indicator:rsi56" },
    },
    {
      id: "ema_rsi_slow",
      type: "ema",
      params: { period: 7, source: "indicator:rsi56" },
    },
  ],
  rules: {
    entry: {
      type: "and",
      nodes: [
        {
          type: "condition",
          left: { kind: "indicator", id: "ema_rsi_fast" },
          op: ">",
          right: { kind: "indicator", id: "ema_rsi_slow" },
        },
        {
          type: "condition",
          left: { kind: "indicator", id: "rsi56" },
          op: ">",
          right: { kind: "number", value: 40 },
        },
      ],
    },
    exit: {
      type: "condition",
      left: { kind: "indicator", id: "ema_rsi_fast" },
      op: "<",
      right: { kind: "indicator", id: "ema_rsi_slow" },
    },
  },
  risk: {
    sizing: { type: "fixed_lot", lots: 30 },
    sl: { enabled: true, type: "points", value: 10 },
    tp: { enabled: true, type: "points", value: 100, lockAtTp: true, lockOffset: 0 },
    tsl: { enabled: true, offset: 50, afterTpLock: true },
  },
  execution: {
    entryFill: "CLOSE",
    charges: { mode: "fixed", fixedCharge: 81.47 },
    contractMultiplier: 1,
    lotSize: 30,
  },
};

// ============================================================================
// Template 3: Mean Reversion (Bollinger Bands)
// ============================================================================

export const meanReversion: StrategyDSL = {
  name: "Mean Reversion - Bollinger Bands",
  version: 1,
  meta: {
    defaultCapital: 100000,
    timeframe: "1h",
    symbols: ["NIFTYBANK.NS"],
    description: "Entry at Bollinger Band edges, exit at mid-band.",
  },
  indicators: [
    { id: "bb20", type: "bb", params: { period: 20, stdDev: 2 } },
  ],
  rules: {
    entry: {
      type: "or",
      nodes: [
        {
          type: "condition",
          left: { kind: "bar", field: "close" },
          op: "<",
          right: { kind: "indicator", id: "bb20", field: "lower" },
        },
        {
          type: "condition",
          left: { kind: "bar", field: "close" },
          op: ">",
          right: { kind: "indicator", id: "bb20", field: "upper" },
        },
      ],
    },
    entryShort: {
      type: "condition",
      left: { kind: "bar", field: "close" },
      op: ">",
      right: { kind: "indicator", id: "bb20", field: "upper" },
    },
    exit: {
      type: "condition",
      left: { kind: "bar", field: "close" },
      op: "==",
      right: { kind: "indicator", id: "bb20", field: "middle" },
    },
  },
  risk: {
    sizing: { type: "fixed_lot", lots: 5 },
    sl: { enabled: true, type: "percent", value: 2 },
    tp: { enabled: true, type: "points", value: 30 },
  },
  execution: {
    entryFill: "NEXT_OPEN",
    charges: { mode: "fixed", fixedCharge: 50 },
    contractMultiplier: 1,
    lotSize: 5,
  },
};

// ============================================================================
// Template 4: Breakout Strategy (SMA + ATR)
// ============================================================================

export const breakoutStrategy: StrategyDSL = {
  name: "Breakout with ATR Stop",
  version: 1,
  meta: {
    defaultCapital: 100000,
    timeframe: "1h",
    symbols: ["NIFTYBANK.NS"],
    description: "Entry on close above SMA, stop loss = 2x ATR.",
  },
  indicators: [
    { id: "sma20", type: "sma", params: { period: 20 } },
    { id: "atr14", type: "atr", params: { period: 14 } },
  ],
  rules: {
    entry: {
      type: "and",
      nodes: [
        {
          type: "cross",
          a: { kind: "bar", field: "close" },
          b: { kind: "indicator", id: "sma20" },
        },
      ],
    },
    exit: {
      type: "condition",
      left: { kind: "bar", field: "close" },
      op: "<",
      right: { kind: "indicator", id: "sma20" },
    },
  },
  risk: {
    sizing: { type: "percent_capital", percent: 2 },
    sl: { enabled: true, type: "atr", value: 2, atrPeriod: 14 },
    tsl: { enabled: true, offset: 50 },
  },
  execution: {
    entryFill: "CLOSE",
    slippagePoints: 2,
    charges: { mode: "components", components: { brokerage: 20, gst: 3.6 } },
    contractMultiplier: 1,
    lotSize: 30,
  },
};

// ============================================================================
// Template 5: Multi-Condition Complex Strategy
// ============================================================================

export const complexStrategy: StrategyDSL = {
  name: "Complex Multi-Indicator Strategy",
  version: 1,
  meta: {
    defaultCapital: 100000,
    timeframe: "15m",
    symbols: ["NIFTYBANK.NS"],
    description: "EMA crossover + RSI confirmation + Time filter (9:30-15:30)",
  },
  indicators: [
    { id: "ema12", type: "ema", params: { period: 12 } },
    { id: "ema26", type: "ema", params: { period: 26 } },
    { id: "rsi14", type: "rsi", params: { period: 14 } },
    { id: "macd", type: "macd", params: { fastPeriod: 12, slowPeriod: 26, signalPeriod: 9 } },
  ],
  rules: {
    entry: {
      type: "and",
      nodes: [
        {
          type: "cross",
          a: { kind: "indicator", id: "ema12" },
          b: { kind: "indicator", id: "ema26" },
        },
        {
          type: "condition",
          left: { kind: "indicator", id: "rsi14" },
          op: ">",
          right: { kind: "number", value: 40 },
        },
        {
          type: "condition",
          left: { kind: "indicator", id: "rsi14" },
          op: "<",
          right: { kind: "number", value: 80 },
        },
        {
          type: "timefilter",
          start: "09:30",
          end: "15:30",
          days: ["MON", "TUE", "WED", "THU", "FRI"],
        },
      ],
    },
    exit: {
      type: "or",
      nodes: [
        {
          type: "crossdown",
          a: { kind: "indicator", id: "ema12" },
          b: { kind: "indicator", id: "ema26" },
        },
        {
          type: "condition",
          left: { kind: "indicator", id: "macd", field: "histogram" },
          op: "<",
          right: { kind: "number", value: 0 },
        },
      ],
    },
  },
  risk: {
    sizing: { type: "fixed_lot", lots: 10 },
    sl: { enabled: true, type: "points", value: 25 },
    tp: { enabled: true, type: "points", value: 75, lockAtTp: true, lockOffset: 10 },
    tsl: { enabled: true, offset: 30, afterTpLock: false },
    maxOpenPositions: 2,
  },
  execution: {
    entryFill: "NEXT_OPEN",
    slippagePoints: 3,
    charges: {
      mode: "components",
      components: {
        brokerage: 30,
        exchange: 5,
        stt: 10,
        gst: 7.2,
      },
    },
    contractMultiplier: 1,
    lotSize: 10,
  },
};

// ============================================================================
// Template 6: Stochastic + ADX Trend Following
// ============================================================================

export const stochasticTrend: StrategyDSL = {
  name: "Stochastic Trend Following",
  version: 1,
  meta: {
    defaultCapital: 100000,
    timeframe: "1h",
    symbols: ["NIFTYBANK.NS"],
    description: "Stochastic oversold entry + ADX trend confirmation.",
  },
  indicators: [
    { id: "stoch14", type: "stoch", params: { kPeriod: 14, dPeriod: 3, smoothK: 3 } },
    { id: "adx14", type: "adx", params: { period: 14 } },
  ],
  rules: {
    entry: {
      type: "and",
      nodes: [
        {
          type: "condition",
          left: { kind: "indicator", id: "stoch14", field: "k" },
          op: "<",
          right: { kind: "number", value: 20 },
        },
        {
          type: "condition",
          left: { kind: "indicator", id: "adx14" },
          op: ">",
          right: { kind: "number", value: 25 },
        },
      ],
    },
    exit: {
      type: "condition",
      left: { kind: "indicator", id: "stoch14", field: "k" },
      op: ">",
      right: { kind: "number", value: 80 },
    },
  },
  risk: {
    sizing: { type: "fixed_lot", lots: 15 },
    sl: { enabled: true, type: "points", value: 40 },
    tp: { enabled: true, type: "points", value: 120 },
    tsl: { enabled: false, offset: 0 },
  },
  execution: {
    entryFill: "CLOSE",
    charges: { mode: "fixed", fixedCharge: 75 },
    contractMultiplier: 1,
    lotSize: 15,
  },
};

// ============================================================================
// Template Export List
// ============================================================================

export const strategyTemplates: Record<string, StrategyDSL> = {
  rsiMomentum,
  dualEmaRsi,
  meanReversion,
  breakoutStrategy,
  complexStrategy,
  stochasticTrend,
};

export const templateDescriptions: Record<string, string> = {
  rsiMomentum: "Simple RSI overbought/oversold trading",
  dualEmaRsi: "Your scaled-RSI strategy with EMA smoothing",
  meanReversion: "Bollinger Bands mean reversion with edges",
  breakoutStrategy: "SMA breakout with ATR-based stops",
  complexStrategy: "EMA crossover + RSI + MACD + time filter",
  stochasticTrend: "Stochastic oversold entry with ADX confirmation",
};
