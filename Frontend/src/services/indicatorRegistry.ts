/**
 * Indicator Registry & Calculator
 * Provides precomputed indicators for compiled strategies
 */

import { IndicatorDef } from '../types/rule-dsl';

export interface IndicatorOutput {
  [key: string]: number | number[];
}

export interface IndicatorCalculator {
  (bars: any[], params: Record<string, any>): IndicatorOutput;
}

// ============================================================================
// RSI: Relative Strength Index
// ============================================================================

function calculateRSI(prices: number[], period: number): number[] {
  const rsi: number[] = new Array(prices.length).fill(NaN);

  if (prices.length < period + 1) return rsi;

  let gains = 0,
    losses = 0;

  // Calculate initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const delta = prices[i] - prices[i - 1];
    if (delta > 0) gains += delta;
    else losses += Math.abs(delta);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  rsi[period] = 100 - 100 / (1 + avgGain / avgLoss);

  // Exponential moving average
  for (let i = period + 1; i < prices.length; i++) {
    const delta = prices[i] - prices[i - 1];
    const gain = delta > 0 ? delta : 0;
    const loss = delta < 0 ? Math.abs(delta) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    rsi[i] = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
  }

  return rsi;
}

// ============================================================================
// EMA: Exponential Moving Average
// ============================================================================

function calculateEMA(values: number[], period: number, startIndex: number = 0): number[] {
  const ema: number[] = new Array(values.length).fill(NaN);

  if (values.length < period) return ema;

  // Initial SMA
  let sum = 0;
  for (let i = startIndex; i < startIndex + period; i++) {
    sum += values[i];
  }
  ema[startIndex + period - 1] = sum / period;

  const multiplier = 2 / (period + 1);

  for (let i = startIndex + period; i < values.length; i++) {
    ema[i] = values[i] * multiplier + ema[i - 1] * (1 - multiplier);
  }

  return ema;
}

// ============================================================================
// SMA: Simple Moving Average
// ============================================================================

function calculateSMA(values: number[], period: number): number[] {
  const sma: number[] = new Array(values.length).fill(NaN);

  if (values.length < period) return sma;

  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  sma[period - 1] = sum / period;

  for (let i = period; i < values.length; i++) {
    sum += values[i] - values[i - period];
    sma[i] = sum / period;
  }

  return sma;
}

// ============================================================================
// ATR: Average True Range
// ============================================================================

function calculateATR(bars: any[], period: number): number[] {
  const tr: number[] = [];
  const atr: number[] = new Array(bars.length).fill(NaN);

  if (bars.length < period) return atr;

  // Calculate True Range
  for (let i = 0; i < bars.length; i++) {
    let trValue: number;

    if (i === 0) {
      trValue = bars[i].high - bars[i].low;
    } else {
      const prevClose = bars[i - 1].close;
      const highLow = bars[i].high - bars[i].low;
      const highClose = Math.abs(bars[i].high - prevClose);
      const lowClose = Math.abs(bars[i].low - prevClose);

      trValue = Math.max(highLow, highClose, lowClose);
    }

    tr.push(trValue);
  }

  // Calculate ATR as EMA of TR
  const atrValues = calculateEMA(tr, period);
  return atrValues;
}

// ============================================================================
// Bollinger Bands
// ============================================================================

function calculateBollingerBands(
  values: number[],
  period: number,
  stdDev: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const middle = calculateSMA(values, period);
  const upper: number[] = new Array(values.length).fill(NaN);
  const lower: number[] = new Array(values.length).fill(NaN);

  for (let i = period - 1; i < values.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += Math.pow(values[j] - middle[i], 2);
    }
    const std = Math.sqrt(sum / period);
    upper[i] = middle[i] + stdDev * std;
    lower[i] = middle[i] - stdDev * std;
  }

  return { upper, middle, lower };
}

// ============================================================================
// MACD: Moving Average Convergence Divergence
// ============================================================================

function calculateMACD(
  values: number[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const emaFast = calculateEMA(values, fastPeriod);
  const emaSlow = calculateEMA(values, slowPeriod);

  const macd: number[] = new Array(values.length).fill(NaN);
  for (let i = 0; i < values.length; i++) {
    if (!isNaN(emaFast[i]) && !isNaN(emaSlow[i])) {
      macd[i] = emaFast[i] - emaSlow[i];
    }
  }

  const signal = calculateEMA(macd, signalPeriod);

  const histogram: number[] = new Array(values.length).fill(NaN);
  for (let i = 0; i < values.length; i++) {
    if (!isNaN(macd[i]) && !isNaN(signal[i])) {
      histogram[i] = macd[i] - signal[i];
    }
  }

  return { macd, signal, histogram };
}

// ============================================================================
// Stochastic Oscillator
// ============================================================================

function calculateStochastic(
  bars: any[],
  kPeriod: number = 14,
  dPeriod: number = 3,
  smoothK: number = 3
): { k: number[]; d: number[] } {
  const k: number[] = new Array(bars.length).fill(NaN);
  const d: number[] = new Array(bars.length).fill(NaN);

  if (bars.length < kPeriod) return { k, d };

  // Calculate raw K
  const rawK: number[] = new Array(bars.length).fill(NaN);
  for (let i = kPeriod - 1; i < bars.length; i++) {
    let lowest = bars[i].low;
    let highest = bars[i].high;

    for (let j = i - kPeriod + 1; j <= i; j++) {
      lowest = Math.min(lowest, bars[j].low);
      highest = Math.max(highest, bars[j].high);
    }

    const range = highest - lowest;
    rawK[i] = range === 0 ? 50 : ((bars[i].close - lowest) / range) * 100;
  }

  // Smooth K
  const smoothedK = calculateSMA(rawK, smoothK);
  for (let i = 0; i < smoothedK.length; i++) {
    k[i] = smoothedK[i];
  }

  // Calculate D as SMA of K
  const dValues = calculateSMA(k, dPeriod);
  for (let i = 0; i < dValues.length; i++) {
    d[i] = dValues[i];
  }

  return { k, d };
}

// ============================================================================
// ADX: Average Directional Index (simplified)
// ============================================================================

function calculateADX(bars: any[], period: number = 14): number[] {
  const adx: number[] = new Array(bars.length).fill(NaN);

  if (bars.length < period + 1) return adx;

  // Calculate +DM and -DM
  const plusDM: number[] = [0];
  const minusDM: number[] = [0];

  for (let i = 1; i < bars.length; i++) {
    const upMove = bars[i].high - bars[i - 1].high;
    const downMove = bars[i - 1].low - bars[i].low;

    let pd = 0,
      md = 0;

    if (upMove > downMove && upMove > 0) pd = upMove;
    if (downMove > upMove && downMove > 0) md = downMove;

    plusDM.push(pd);
    minusDM.push(md);
  }

  // Calculate true range and ATR
  const tr: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    if (i === 0) {
      tr.push(bars[i].high - bars[i].low);
    } else {
      const range = Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close)
      );
      tr.push(range);
    }
  }

  const atr = calculateEMA(tr, period);

  // Calculate DI+ and DI-
  const plusDI: number[] = [];
  const minusDI: number[] = [];

  for (let i = 0; i < bars.length; i++) {
    if (isNaN(atr[i]) || atr[i] === 0) {
      plusDI.push(0);
      minusDI.push(0);
    } else {
      plusDI.push((plusDM[i] / atr[i]) * 100);
      minusDI.push((minusDM[i] / atr[i]) * 100);
    }
  }

  // Calculate DX
  const dx: number[] = [];
  for (let i = 0; i < bars.length; i++) {
    const diSum = plusDI[i] + minusDI[i];
    if (diSum === 0) {
      dx.push(0);
    } else {
      dx.push((Math.abs(plusDI[i] - minusDI[i]) / diSum) * 100);
    }
  }

  // Calculate ADX as EMA of DX
  const adxValues = calculateEMA(dx, period);
  return adxValues;
}

// ============================================================================
// Indicator Registry: Maps indicator types to calculators
// ============================================================================

const indicatorRegistry: Record<string, IndicatorCalculator> = {
  rsi: (bars, params) => {
    const period = params.period || 14;
    const source = params.source || "close";
    const prices = bars.map((b: any) =>
      source === "close"
        ? b.close
        : source.startsWith("indicator:")
          ? null
          : b[source]
    );

    const rsi = calculateRSI(prices, period);
    return { value: rsi };
  },

  ema: (bars, params) => {
    const period = params.period || 12;
    const source = params.source || "close";

    const values = bars.map((b: any) =>
      source === "close"
        ? b.close
        : source === "open"
          ? b.open
          : source === "high"
            ? b.high
            : source === "low"
              ? b.low
              : b[source]
    );

    const ema = calculateEMA(values, period);
    return { value: ema };
  },

  sma: (bars, params) => {
    const period = params.period || 20;
    const source = params.source || "close";

    const values = bars.map((b: any) => b[source] || b.close);
    const sma = calculateSMA(values, period);
    return { value: sma };
  },

  atr: (bars, params) => {
    const period = params.period || 14;
    const atr = calculateATR(bars, period);
    return { value: atr };
  },

  bb: (bars, params) => {
    const period = params.period || 20;
    const stdDev = params.stdDev || 2;
    const source = params.source || "close";

    const values = bars.map((b: any) => b[source] || b.close);
    const { upper, middle, lower } = calculateBollingerBands(values, period, stdDev);

    return { upper, middle, lower };
  },

  macd: (bars, params) => {
    const fastPeriod = params.fastPeriod || 12;
    const slowPeriod = params.slowPeriod || 26;
    const signalPeriod = params.signalPeriod || 9;
    const source = params.source || "close";

    const values = bars.map((b: any) => b[source] || b.close);
    const { macd, signal, histogram } = calculateMACD(values, fastPeriod, slowPeriod, signalPeriod);

    return { macd, signal, histogram };
  },

  stoch: (bars, params) => {
    const kPeriod = params.kPeriod || 14;
    const dPeriod = params.dPeriod || 3;
    const smoothK = params.smoothK || 3;

    const { k, d } = calculateStochastic(bars, kPeriod, dPeriod, smoothK);
    return { k, d };
  },

  adx: (bars, params) => {
    const period = params.period || 14;
    const adx = calculateADX(bars, period);
    return { value: adx };
  },
};

// ============================================================================
// Precompute Indicators
// ============================================================================

export interface PrecomputedIndicators {
  [indicatorId: string]: IndicatorOutput;
}

/**
 * Given a list of indicator definitions and bars, precompute all indicators.
 * Handles indicator dependencies (e.g., EMA of RSI).
 */
export function precomputeIndicators(
  indicators: IndicatorDef[],
  bars: any[]
): PrecomputedIndicators {
  const result: PrecomputedIndicators = {};

  // Build dependency graph
  const processed = new Set<string>();

  function processIndicator(ind: IndicatorDef) {
    if (processed.has(ind.id)) return;

    // Check if source depends on another indicator
    const params = { ...ind.params };
    if (params.source && params.source.startsWith("indicator:")) {
      const sourceId = params.source.replace("indicator:", "");
      const sourceDef = indicators.find((i) => i.id === sourceId);
      if (sourceDef) {
        processIndicator(sourceDef);
        // Update source to use precomputed values
        params._sourceValues = result[sourceId];
      }
    }

    const calculator = indicatorRegistry[ind.type];
    if (calculator) {
      result[ind.id] = calculator(bars, params);
    }

    processed.add(ind.id);
  }

  for (const ind of indicators) {
    processIndicator(ind);
  }

  return result;
}

/**
 * Get indicator field value at a specific bar index
 */
export function getIndicatorValue(
  indicatorId: string,
  field: string | undefined,
  barIndex: number,
  precomputed: PrecomputedIndicators
): number | null {
  const indicator = precomputed[indicatorId];
  if (!indicator) return null;

  const fieldName = field || "value";
  const data = indicator[fieldName];

  if (Array.isArray(data)) {
    const val = data[barIndex];
    return isNaN(val) ? null : val;
  }

  return data;
}

export default indicatorRegistry;
