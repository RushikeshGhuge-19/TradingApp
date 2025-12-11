/**
 * Indicator calculations: RSI and EMA.
 * Date: 2025-12-11
 */

/**
 * Wilder's RSI (Relative Strength Index) using EMA smoothing.
 * Standard 14-period RSI.
 *
 * @param closes Array of close prices
 * @param period RSI period (default 14)
 * @returns Array of RSI values (0..100), same length as closes
 */
export function rsi(closes: number[], period: number = 14): number[] {
  if (closes.length < period + 1) return new Array(closes.length).fill(NaN);

  const deltas: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    deltas.push(closes[i] - closes[i - 1]);
  }

  // Gains and losses
  const gains: number[] = deltas.map(d => (d > 0 ? d : 0));
  const losses: number[] = deltas.map(d => (d < 0 ? -d : 0));

  // Initialize averages using SMA for first period
  let avgGain = gains.slice(0, period).reduce((a, b) => a + b, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Start RSI array
  const rsiValues: number[] = new Array(closes.length).fill(NaN);
  rsiValues[period] = avgGain === 0 && avgLoss === 0 ? 50 : 100 - 100 / (1 + avgGain / (avgLoss || 0.0001));

  // Wilder's smoothing for subsequent values
  for (let i = period + 1; i < closes.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i - 1]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i - 1]) / period;
    const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    rsiValues[i] = 100 - 100 / (1 + rs);
  }

  return rsiValues;
}

/**
 * Exponential Moving Average.
 *
 * @param values Array of values
 * @param period EMA period
 * @returns Array of EMA values, same length as input
 */
export function ema(values: number[], period: number): number[] {
  if (values.length < period) return new Array(values.length).fill(NaN);

  const k = 2 / (period + 1); // smoothing factor
  const result: number[] = new Array(values.length).fill(NaN);

  // Initialize with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += values[i];
  }
  result[period - 1] = sum / period;

  // Apply EMA formula
  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * k + result[i - 1] * (1 - k);
  }

  return result;
}

/**
 * Highest (maximum) value over a rolling window.
 *
 * @param values Array of values
 * @param period Window size
 * @returns Array of rolling highs, same length as input
 */
export function highest(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - period + 1);
    const window = values.slice(start, i + 1);
    result.push(Math.max(...window));
  }
  return result;
}

/**
 * Lowest (minimum) value over a rolling window.
 *
 * @param values Array of values
 * @param period Window size
 * @returns Array of rolling lows, same length as input
 */
export function lowest(values: number[], period: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < values.length; i++) {
    const start = Math.max(0, i - period + 1);
    const window = values.slice(start, i + 1);
    result.push(Math.min(...window));
  }
  return result;
}
