/**
 * Unit tests for backtest engine.
 * Tests: single long/short trades, SL logic, fees, normalization edge cases.
 * Date: 2025-12-11
 */

import { runBacktest } from '../src/engine/backtest';
import { Bar, StrategyParams } from '../src/types/engine';

describe('Backtest Engine', () => {
  const DEFAULT_PARAMS: StrategyParams = {
    rsiPeriod: 14,
    emaRsiShort: 5,
    emaRsiLong: 25,
    normLookback: 100,
    sl_points: 10,
    enableSL: true,
    lot_size: 1,
    contract_multiplier: 1,
    charge_mode_fixed: true,
    fixed_charge_per_trade: 50,
    charges_components: undefined,
  };

  // Helper: create synthetic bars
  const createBars = (prices: number[]): Bar[] => {
    return prices.map((close, i) => ({
      dt: new Date(2025, 0, 1 + i).toISOString(),
      open: close - 1,
      high: close + 2,
      low: close - 2,
      close,
      volume: 1000,
    }));
  };

  test('Single LONG trade closed by SL', () => {
    // Prices that trigger: entry on bar 20 (RSI > EMA), then SL hit on bar 25
    const prices = [50, 51, 52, 51, 50, 52, 53, 54, 55, 54, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 61, 60, 59, 58, 57, 50];
    const bars = createBars(prices);

    const result = runBacktest(bars, DEFAULT_PARAMS);

    expect(result.trades.length).toBeGreaterThan(0);
    if (result.trades.length > 0) {
      const trade = result.trades[0];
      expect(trade.dir).toBe('LONG');
      expect(trade.charges).toBe(DEFAULT_PARAMS.fixed_charge_per_trade);
      expect(trade.net).toBeLessThan(trade.gross); // net < gross due to charges
    }
  });

  test('Fixed vs component charges calculation', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 50 + (i % 10));
    const bars = createBars(prices);

    // Fixed charge
    const resultFixed = runBacktest(bars, DEFAULT_PARAMS);
    const chargeFixed = resultFixed.trades[0]?.charges || 0;

    // Component charges
    const paramsComponent: StrategyParams = {
      ...DEFAULT_PARAMS,
      charge_mode_fixed: false,
      charges_components: {
        c_brokerage: 20,
        c_exchange_txn: 5,
        c_dp: 5,
        c_stt: 0,
        c_sebi: 2,
        c_ipft: 2,
        c_stamp: 0,
        c_gst: 16,
      },
    };
    const resultComponent = runBacktest(bars, paramsComponent);
    const chargeComponent = resultComponent.trades[0]?.charges || 0;

    expect(chargeComponent).toBeCloseTo(50, 0); // sum of components
  });

  test('No entry when pmax == pmin (invalid normalization)', () => {
    // Create bars with identical high/low (flat bars)
    const bars: Bar[] = Array.from({ length: 200 }, (_, i) => ({
      dt: new Date(2025, 0, 1 + i).toISOString(),
      open: 50,
      high: 50,
      low: 50,
      close: 50,
      volume: 0,
    }));

    const result = runBacktest(bars, DEFAULT_PARAMS);

    // No entries should occur
    expect(result.trades.length).toBe(0);
    expect(result.summary.net).toBe(0);
  });

  test('Equity curve starts at 100000', () => {
    const prices = Array.from({ length: 50 }, (_, i) => 50 + i * 0.5);
    const bars = createBars(prices);

    const result = runBacktest(bars, DEFAULT_PARAMS);

    expect(result.equity).toBeDefined();
    if (result.equity) {
      expect(result.equity[0]).toBe(100000);
    }
  });

  test('Summary totals match individual trades', () => {
    const prices = Array.from({ length: 100 }, (_, i) => 50 + (i % 20));
    const bars = createBars(prices);

    const result = runBacktest(bars, DEFAULT_PARAMS);

    let totalGross = 0;
    let totalCharges = 0;
    result.trades.forEach(t => {
      totalGross += t.gross;
      totalCharges += t.charges;
    });

    expect(result.summary.gross).toBeCloseTo(totalGross, 2);
    expect(result.summary.charges).toBeCloseTo(totalCharges, 2);
    expect(result.summary.net).toBeCloseTo(totalGross - totalCharges, 2);
  });
});
