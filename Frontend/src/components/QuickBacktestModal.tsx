/**
 * QuickBacktestModal.tsx - Modal to run backtest and view results
 */

import React, { useState } from 'react';
import { StrategyDSL, BacktestResult } from '../types/rule-dsl';
import { runBacktest, formatBacktestSummary, exportTradesToCSV } from '../services/backtestAPI';
import { compileStrategy } from '../services/ruleCompiler';

interface QuickBacktestModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategy: StrategyDSL;
}

export default function QuickBacktestModal({
  isOpen,
  onClose,
  strategy,
}: QuickBacktestModalProps) {
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [capital, setCapital] = useState(100000);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'trades' | 'equity'>('summary');

  const handleRunBacktest = async () => {
    setIsRunning(true);
    setError('');

    try {
      // Compile strategy
      const compiled = compileStrategy(strategy);

      // Update capital
      const strategyWithCapital = {
        ...strategy,
        meta: {
          ...strategy.meta,
          defaultCapital: capital,
        },
      };

      // Run backtest
      const backtest = await runBacktest({
        strategy_dsl: strategyWithCapital,
        compiled_strategy: compiled,
        start_date: startDate,
        end_date: endDate,
      });

      setResult(backtest);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Backtest failed');
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#0a0a0a] rounded-lg shadow-2xl max-w-4xl w-full max-h-screen overflow-y-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7300BD] to-[#5b008f] text-white px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Quick Backtest</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-[#5b008f] px-3 py-1 rounded transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Parameters */}
          <div className="bg-slate-900 rounded-lg p-4 space-y-4">
            <h3 className="font-semibold text-lg text-slate-900">Backtest Parameters</h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] disabled:bg-slate-700 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isRunning}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] disabled:bg-slate-700 disabled:text-slate-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Capital (₹)
                </label>
                <input
                  type="number"
                  value={capital}
                  onChange={(e) => setCapital(parseInt(e.target.value) || 100000)}
                  disabled={isRunning}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] disabled:bg-slate-700 disabled:text-slate-400"
                />
              </div>
            </div>

            <button
              onClick={handleRunBacktest}
              disabled={isRunning}
              className={`w-full py-2 rounded-lg font-semibold transition-colors ${
                isRunning
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : 'bg-[#7300BD] hover:bg-[#5b008f] text-white'
              }`}
            >
              {isRunning ? 'Running Backtest...' : 'Run Backtest'}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-900/20 border border-red-700/50 rounded-lg p-4">
              <p className="text-red-400 font-medium">Error</p>
              <p className="text-red-400 text-sm mt-1">{error}</p>
            </div>
          )}

          {/* Results */}
          {result && (
            <div className="space-y-4">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200">
                {['summary', 'trades', 'equity'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab as any)}
                    className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                      activeTab === tab
                        ? 'border-[#7300BD] text-[#7300BD]'
                        : 'border-transparent text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Summary Tab */}
              {activeTab === 'summary' && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(formatBacktestSummary(result.summary)).map(([key, value]) => (
                    <div key={key} className="bg-slate-800 rounded-lg p-4">
                      <div className="text-sm text-slate-600 capitalize">{key}</div>
                      <div className="text-xl font-bold text-slate-900 mt-1">{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Trades Tab */}
              {activeTab === 'trades' && (
                <div>
                  <button
                    onClick={() => exportTradesToCSV(result.trades)}
                    className="mb-4 px-4 py-2 bg-[#7300BD] hover:bg-[#5a007f] text-white rounded-lg font-medium transition-colors"
                  >
                    Export as CSV
                  </button>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-100 border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-2 text-left">Entry Time</th>
                          <th className="px-4 py-2 text-right">Entry Price</th>
                          <th className="px-4 py-2 text-center">Dir</th>
                          <th className="px-4 py-2 text-right">Exit Price</th>
                          <th className="px-4 py-2 text-center">Reason</th>
                          <th className="px-4 py-2 text-right">P&L</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {result.trades.map((trade: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-800">
                            <td className="px-4 py-2 text-xs">
                              {new Date(trade.entry_time).toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right">{trade.entry_price.toFixed(2)}</td>
                            <td className="px-4 py-2 text-center">
                              <span
                                className={`font-semibold ${
                                  trade.direction === 'LONG' ? 'text-[#7300BD]' : 'text-red-600'
                                }`}
                              >
                                {trade.direction === 'LONG' ? 'L' : 'S'}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-right">
                              {trade.exit_price?.toFixed(2) || '-'}
                            </td>
                            <td className="px-4 py-2 text-center text-xs">{trade.exit_reason}</td>
                            <td
                              className={`px-4 py-2 text-right font-semibold ${
                                trade.profit_loss > 0 ? 'text-green-500' : 'text-red-500'
                              }`}
                            >
                              {trade.profit_loss > 0 ? '+' : ''}
                              {trade.profit_loss.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Equity Curve Tab */}
              {activeTab === 'equity' && (
                <div className="bg-slate-900 rounded-lg p-4 text-center text-slate-400">
                  <p>Equity curve visualization (requires chart library)</p>
                  <p className="text-sm mt-2">
                    Points: {result.equity_curve.length} | Initial: ₹{result.equity_curve[0].equity.toFixed(0)} | Final: ₹{result.equity_curve[result.equity_curve.length - 1].equity.toFixed(0)}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
