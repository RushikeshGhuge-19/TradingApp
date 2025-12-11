/**
 * backtestAPI.ts - Frontend API client for backtest endpoints
 * Handles communication with backend DSL backtest engine
 */

import { StrategyDSL, BacktestResult } from '../types/rule-dsl';
import { CompiledStrategy } from '../types/rule-dsl';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:8000/api/v1';

export interface BacktestRequest {
  strategy_dsl: StrategyDSL;
  compiled_strategy: CompiledStrategy;
  start_date: string; // YYYY-MM-DD
  end_date: string; // YYYY-MM-DD
}

export interface BacktestResponse {
  trades: Array<{
    entry_time: string;
    entry_price: number;
    direction: 'LONG' | 'SHORT';
    quantity: number;
    exit_time?: string;
    exit_price?: number;
    exit_reason?: string;
    profit_loss: number;
    charges: number;
  }>;
  equity_curve: Array<{
    time: string;
    equity: number;
  }>;
  summary: {
    total_trades: number;
    winning_trades: number;
    losing_trades: number;
    win_rate: number;
    profit_factor: number;
    total_pnl: number;
    total_charges: number;
    max_drawdown: number;
    final_equity: number;
    roi: number;
  };
}

/**
 * Run backtest for compiled strategy
 */
export async function runBacktest(request: BacktestRequest): Promise<BacktestResponse> {
  try {
    // Serialize CompiledStrategy (remove function)
    const compiledForTransport = {
      requiredLookback: request.compiled_strategy.meta.requiredLookback,
      // Note: evaluate function cannot be serialized, backend needs to recompile
    };

    const response = await fetch(`${API_BASE}/backtest/dsl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        compiled_strategy: compiledForTransport,
        strategy_dsl: request.strategy_dsl,
        start_date: request.start_date,
        end_date: request.end_date,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Backtest failed');
    }

    const result: BacktestResponse = await response.json();
    return result;
  } catch (error) {
    throw new Error(
      `Backtest API error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Quick backtest (simpler parameters)
 */
export async function quickBacktest(
  strategy: StrategyDSL,
  startDate: string,
  endDate: string
): Promise<{
  success: boolean;
  summary: BacktestResponse['summary'];
  trade_count: number;
}> {
  try {
    const response = await fetch(`${API_BASE}/backtest/dsl/quick`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        strategy_json: strategy,
        start_date: startDate,
        end_date: endDate,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Quick backtest failed');
    }

    return await response.json();
  } catch (error) {
    throw new Error(
      `Quick backtest error: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Format backtest summary for display
 */
export function formatBacktestSummary(summary: BacktestResponse['summary']) {
  return {
    trades: `${summary.total_trades} (${summary.winning_trades}W / ${summary.losing_trades}L)`,
    winRate: `${(summary.win_rate * 100).toFixed(2)}%`,
    profitFactor: summary.profit_factor.toFixed(2),
    roi: `${summary.roi.toFixed(2)}%`,
    maxDrawdown: `${(summary.max_drawdown * 100).toFixed(2)}%`,
    pnl: `₹${summary.total_pnl.toFixed(2)}`,
    charges: `₹${summary.total_charges.toFixed(2)}`,
    finalEquity: `₹${summary.final_equity.toFixed(0)}`,
  };
}

/**
 * Export trade data to CSV
 */
export function exportTradesToCSV(trades: BacktestResponse['trades'], filename = 'trades.csv') {
  const headers = [
    'Entry Time',
    'Entry Price',
    'Direction',
    'Quantity',
    'Exit Time',
    'Exit Price',
    'Exit Reason',
    'P&L',
    'Charges',
  ];

  const rows = trades.map((t) => [
    new Date(t.entry_time).toLocaleString(),
    t.entry_price.toFixed(2),
    t.direction,
    t.quantity,
    t.exit_time ? new Date(t.exit_time).toLocaleString() : '-',
    t.exit_price?.toFixed(2) || '-',
    t.exit_reason || '-',
    t.profit_loss.toFixed(2),
    t.charges.toFixed(2),
  ]);

  const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
