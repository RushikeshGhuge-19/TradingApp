/**
 * Backtest engine: runs complete backtest with RSI/EMA entry, SL exit, and accounting.
 * Mirrors PineScript semantics exactly.
 * Date: 2025-12-11
 *
 * PSEUDO (implementation guide):
 * - compute rsi_raw = rsi(closes, rsiPeriod)
 * - ema_rsi_s = ema(rsi_raw, emaRsiShort)
 * - ema_rsi_l = ema(rsi_raw, emaRsiLong)
 * - for i from 0..N-1:
 *     pmin = min(low[i-normLookback+1..i])
 *     pmax = max(high[i-normLookback+1..i])
 *     if pmax==pmin: sR/sB/sG = NaN; continue to next iteration for entries
 *     sR = pmin + (rsi_raw[i]/100)*(pmax-pmin)
 *     sB = pmin + (ema_rsi_s[i]/100)*(pmax-pmin)
 *     sG = pmin + (ema_rsi_l[i]/100)*(pmax-pmin)
 *
 *     // SL check if in position
 *     if position != 0 and enableSL:
 *        if position > 0 and low[i] <= entryPrice - sl_points:
 *           exit at entryPrice - sl_points
 *        if position < 0 and high[i] >= entryPrice + sl_points:
 *           exit at entryPrice + sl_points
 *
 *     // Entry logic only if flat
 *     if position == 0 and sR,sB,sG valid:
 *        if sR > sG and sB > sG: enter long at close
 *        if sR < sG and sB < sG: enter short at close
 *
 *     // record trades, markers, accumulate gross/charges/net when closed.
 */

import { Bar, StrategyParams, TradeRecord, Summary, Marker, BacktestResult } from '../types/engine';
import { rsi, ema, highest, lowest } from './indicators';

/**
 * Run full backtest on bars with given strategy params.
 * Returns trades, summary, markers, and equity curve.
 */
export function runBacktest(bars: Bar[], params: StrategyParams): BacktestResult {
  if (!bars || bars.length < params.rsiPeriod) {
    return {
      trades: [],
      summary: { trades: 0, gross: 0, charges: 0, net: 0 },
      markers: [],
      equity: [],
    };
  }

  // Extract OHLC arrays
  const closes = bars.map(b => b.close);
  const highs = bars.map(b => b.high);
  const lows = bars.map(b => b.low);

  // Compute indicators
  const rsi_raw = rsi(closes, params.rsiPeriod);
  const ema_rsi_s = ema(rsi_raw, params.emaRsiShort);
  const ema_rsi_l = ema(rsi_raw, params.emaRsiLong);

  // Compute normalization levels
  const p_min = lowest(lows, params.normLookback);
  const p_max = highest(highs, params.normLookback);

  // State
  let position: number = 0; // 0=flat, 1=long, -1=short
  let entryPrice: number = 0;
  let entryIndex: number = -1;
  let tradeNo: number = 0;

  const trades: TradeRecord[] = [];
  const markers: Marker[] = [];
  let cum_gross: number = 0;
  let cum_charges: number = 0;
  let cum_net: number = 0;
  const equity: number[] = [100000]; // starting equity

  // Main backtest loop
  for (let i = 0; i < bars.length; i++) {
    const bar = bars[i];
    const isValid = !isNaN(rsi_raw[i]) && !isNaN(ema_rsi_s[i]) && !isNaN(ema_rsi_l[i]);

    // Map price-scaled values
    const pmin = p_min[i];
    const pmax = p_max[i];
    const sR = pmin + (rsi_raw[i] / 100) * (pmax - pmin);
    const sB = pmin + (ema_rsi_s[i] / 100) * (pmax - pmin);
    const sG = pmin + (ema_rsi_l[i] / 100) * (pmax - pmin);

    // === SL CHECK (only if enableSL and in position) ===
    if (params.enableSL && position !== 0) {
      const sl_price = position > 0 ? entryPrice - params.sl_points : entryPrice + params.sl_points;
      let shouldExit = false;

      if (position > 0 && lows[i] <= sl_price) {
        // LONG SL hit
        shouldExit = true;
        const exitPrice = sl_price;
        tradeNo++;

        // Compute accounting
        const points = exitPrice - entryPrice;
        const gross = points * params.lot_size * params.contract_multiplier;
        const charge = computeCharge(params);
        const net = gross - charge;

        trades.push({
          tradeNo,
          entryIndex,
          exitIndex: i,
          entryDt: bars[entryIndex].dt,
          exitDt: bar.dt,
          entryPrice,
          exitPrice,
          dir: 'LONG',
          gross,
          charges: charge,
          net,
        });

        markers.push({ time: bars[entryIndex].dt, price: entryPrice, text: `E#${tradeNo}`, color: 'green', shape: 'arrowUp' });
        markers.push({ time: bar.dt, price: exitPrice, text: `X#${tradeNo}`, color: 'red', shape: 'arrowDown' });

        cum_gross += gross;
        cum_charges += charge;
        cum_net += net;
        equity.push(100000 + cum_net);

        position = 0;
        entryPrice = 0;
        entryIndex = -1;
      } else if (position < 0 && highs[i] >= sl_price) {
        // SHORT SL hit
        shouldExit = true;
        const exitPrice = sl_price;
        tradeNo++;

        // Compute accounting
        const points = entryPrice - exitPrice;
        const gross = points * params.lot_size * params.contract_multiplier;
        const charge = computeCharge(params);
        const net = gross - charge;

        trades.push({
          tradeNo,
          entryIndex,
          exitIndex: i,
          entryDt: bars[entryIndex].dt,
          exitDt: bar.dt,
          entryPrice,
          exitPrice,
          dir: 'SHORT',
          gross,
          charges: charge,
          net,
        });

        markers.push({ time: bars[entryIndex].dt, price: entryPrice, text: `E#${tradeNo}`, color: 'red', shape: 'arrowDown' });
        markers.push({ time: bar.dt, price: exitPrice, text: `X#${tradeNo}`, color: 'green', shape: 'arrowUp' });

        cum_gross += gross;
        cum_charges += charge;
        cum_net += net;
        equity.push(100000 + cum_net);

        position = 0;
        entryPrice = 0;
        entryIndex = -1;
      }
    }

    // === ENTRY LOGIC (only if flat and valid normalization) ===
    if (position === 0 && isValid && pmax !== pmin) {
      if (sR > sG && sB > sG) {
        // LONG entry
        position = 1;
        entryPrice = bar.close;
        entryIndex = i;
      } else if (sR < sG && sB < sG) {
        // SHORT entry
        position = -1;
        entryPrice = bar.close;
        entryIndex = i;
      }
    }

    // Append current equity if no trade closed this bar
    if (equity.length === i + 1) {
      // already appended, skip
    } else if (equity.length === i) {
      equity.push(100000 + cum_net);
    }
  }

  const summary: Summary = {
    trades: trades.length,
    gross: cum_gross,
    charges: cum_charges,
    net: cum_net,
  };

  return {
    trades,
    summary,
    markers,
    equity,
  };
}

/**
 * Compute total charges per trade.
 */
function computeCharge(params: StrategyParams): number {
  if (params.charge_mode_fixed) {
    return params.fixed_charge_per_trade;
  }

  const components = params.charges_components || {};
  return (
    (components.c_brokerage || 0) +
    (components.c_exchange_txn || 0) +
    (components.c_dp || 0) +
    (components.c_stt || 0) +
    (components.c_sebi || 0) +
    (components.c_ipft || 0) +
    (components.c_stamp || 0) +
    (components.c_gst || 0)
  );
}
