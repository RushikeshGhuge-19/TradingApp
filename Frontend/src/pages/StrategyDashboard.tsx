import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../../components/Navbar';
import { getStrategyConfig, runBacktest, saveBacktestTrades, BacktestResult, BacktestTrade } from '../../services/api';

function StrategyDashboard() {
  const navigate = useNavigate();
  const [strategyConfig, setStrategyConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [backtesting, setBacktesting] = useState(false);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState<{
    symbol: string;
    timeframe: string;
    start_date: string;
    end_date: string;
  }>({
    symbol: '^NSEBANK',
    timeframe: '1h',
    start_date: '2024-12-01',
    end_date: '2024-12-10',
  });

  // Load strategy config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getStrategyConfig();
        setStrategyConfig(config);
        setFormData(prev => ({
          ...prev,
          symbol: config.symbol,
          timeframe: config.timeframe,
        }));
        
        // Set default date range (last 10 days)
        const endDate = new Date(2024, 11, 10); // Dec 10, 2024 (real historical data)
        const startDate = new Date(2024, 11, 1); // Dec 1, 2024
        
        setFormData(prev => ({
          ...prev,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        }));
      } catch (err) {
        console.error('Failed to load strategy config', err);
        setError('Failed to load strategy configuration');
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRunBacktest = async () => {
    setBacktesting(true);
    setError('');
    setResult(null);  // Clear previous results
    
    try {
      // Validate dates
      if (!formData.start_date || !formData.end_date) {
        throw new Error('Please select both start and end dates');
      }

      if (new Date(formData.start_date) > new Date(formData.end_date)) {
        throw new Error('Start date must be before end date');
      }
      
      const backTestRequest = {
        symbol: formData.symbol,
        timeframe: formData.timeframe,
        start_date: formData.start_date,
        end_date: formData.end_date,
      };
      
      console.log('Running backtest with:', backTestRequest);
      const backTestResult = await runBacktest(backTestRequest);
      console.log('Backtest result:', backTestResult);
      
      if (!backTestResult || !backTestResult.summary) {
        throw new Error('Invalid backtest response');
      }
      
      setResult(backTestResult);
      
      // Save trades to database so they appear on dashboard
      if (backTestResult.trades && backTestResult.trades.length > 0) {
        try {
          const saveResult = await saveBacktestTrades(backTestResult.trades);
          console.log('Trades saved to database:', saveResult);
        } catch (saveErr) {
          console.error('Warning: Could not save trades to database', saveErr);
          // Don't fail the backtest if saving fails
        }
      }
    } catch (err: any) {
      console.error('Backtest failed', err);
      setError(err.message || 'Backtest failed. Check date range and try again.');
    } finally {
      setBacktesting(false);
    }
  };

  const getPnlColor = (val: number) => {
    if (val > 0) return 'text-green-500';
    if (val < 0) return 'text-red-500';
    return 'text-slate-200';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-[#7300BD] border-t-transparent rounded-full"></div>
          Loading strategy dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Controls Section */}
        <div className="bg-[#0a0a0a] p-6 rounded-lg border border-white/10 shadow-lg mb-6">
          <h2 className="text-xl font-bold text-white mb-6">Backtest Configuration</h2>
          
          {error && (
            <div className="mb-6 p-4 rounded text-sm bg-red-500/20 text-red-400 border border-red-500/50">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
            {/* Symbol */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Symbol</label>
              <input
                type="text"
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-[#7300BD] transition"
              />
            </div>

            {/* Timeframe */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Timeframe</label>
              <select
                name="timeframe"
                value={formData.timeframe}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-[#7300BD] transition"
              >
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="30m">30m</option>
                <option value="1h">1h</option>
              </select>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">Start Date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-[#7300BD] transition"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase mb-2 tracking-wider">End Date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded text-white text-sm focus:outline-none focus:border-[#7300BD] transition"
              />
            </div>

            {/* Run Button */}
            <div className="flex items-end">
              <button
                onClick={handleRunBacktest}
                disabled={backtesting}
                className="w-full px-4 py-2 bg-[#7300BD] hover:bg-[#6100a0] disabled:opacity-50 text-white font-bold rounded text-sm transition"
              >
                {backtesting ? 'Running...' : 'Run Backtest'}
              </button>
            </div>
          </div>

          {/* Current Strategy Params (Read-only) */}
          {strategyConfig && (
            <div className="border-t border-slate-700 pt-6">
              <p className="text-xs font-bold text-slate-400 uppercase mb-4 tracking-wider">Active Strategy Parameters</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">RSI Period</div>
                  <div className="text-white font-bold text-lg">{strategyConfig.rsi_period}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">EMA Fast</div>
                  <div className="text-white font-bold text-lg">{strategyConfig.ema_fast}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">EMA Slow</div>
                  <div className="text-white font-bold text-lg">{strategyConfig.ema_slow}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">TP Points</div>
                  <div className="text-white font-bold text-lg">{strategyConfig.tp_points.toFixed(0)}</div>
                </div>
                <div className="bg-slate-900/50 p-3 rounded border border-slate-700">
                  <div className="text-slate-400">Trail Offset</div>
                  <div className="text-white font-bold text-lg">{strategyConfig.trail_offset.toFixed(0)}</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Trades</div>
                <div className="text-2xl font-bold text-slate-200">{result.summary.total_trades}</div>
              </div>

              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Winrate</div>
                <div className={`text-2xl font-bold ${result.summary.winrate > 50 ? 'text-green-500' : 'text-red-500'}`}>
                  {result.summary.winrate.toFixed(1)}%
                </div>
                <div className="text-slate-600 text-xs mt-1">{result.summary.win_trades}W/{result.summary.loss_trades}L</div>
              </div>

              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Net PnL</div>
                <div className={`text-2xl font-bold ${result.summary.net_pnl_money > 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ₹{result.summary.net_pnl_money.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </div>
              </div>

              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Max Drawdown</div>
                <div className="text-2xl font-bold text-red-500">{result.summary.max_drawdown_pct.toFixed(2)}%</div>
              </div>

              {result.summary.best_trade && (
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Best Trade</div>
                  <div className="text-2xl font-bold text-green-500">
                    ₹{result.summary.best_trade.pnl_money.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              )}

              {result.summary.worst_trade && (
                <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
                  <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Worst Trade</div>
                  <div className="text-2xl font-bold text-red-500">
                    ₹{result.summary.worst_trade.pnl_money.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
              )}
            </div>

            {/* Equity Curve Chart */}
            {result.equity_curve.length > 0 && (
              <div className="bg-[#0a0a0a] p-6 rounded-lg border border-white/10 shadow-lg mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Equity Curve</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={result.equity_curve.map(point => ({
                    time: new Date(point.time).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit' }),
                    equity: point.equity,
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                      labelStyle={{ color: '#94a3b8' }}
                      formatter={(value) => `₹${(value as number).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`}
                    />
                    <Line type="monotone" dataKey="equity" stroke="#7300BD" dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Trades Table */}
            {result.trades.length > 0 && (
              <div className="bg-[#0a0a0a] p-6 rounded-lg border border-white/10 shadow-lg">
                <h3 className="text-lg font-bold text-white mb-4">Backtest Trades</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="text-left py-2 px-4 font-bold text-slate-400">Direction</th>
                        <th className="text-left py-2 px-4 font-bold text-slate-400">Entry Time</th>
                        <th className="text-right py-2 px-4 font-bold text-slate-400">Entry Price</th>
                        <th className="text-left py-2 px-4 font-bold text-slate-400">Exit Time</th>
                        <th className="text-right py-2 px-4 font-bold text-slate-400">Exit Price</th>
                        <th className="text-right py-2 px-4 font-bold text-slate-400">PnL (pts)</th>
                        <th className="text-right py-2 px-4 font-bold text-slate-400">PnL (₹)</th>
                        <th className="text-left py-2 px-4 font-bold text-slate-400">Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.trades.map((trade, idx) => (
                        <tr key={idx} className="border-b border-slate-800 hover:bg-slate-900/30 transition">
                          <td className="py-2 px-4">
                            <span className={`font-bold ${trade.direction === 'LONG' ? 'text-green-500' : 'text-red-500'}`}>
                              {trade.direction}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-slate-400">
                            {new Date(trade.entry_time).toLocaleString('en-IN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-4 text-right text-slate-300">
                            {trade.entry_price.toFixed(2)}
                          </td>
                          <td className="py-2 px-4 text-slate-400">
                            {new Date(trade.exit_time).toLocaleString('en-IN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2 px-4 text-right text-slate-300">
                            {trade.exit_price.toFixed(2)}
                          </td>
                          <td className={`py-2 px-4 text-right font-bold ${trade.pnl_points > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.pnl_points > 0 ? '+' : ''}{trade.pnl_points.toFixed(1)}
                          </td>
                          <td className={`py-2 px-4 text-right font-bold ${trade.pnl_money > 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.pnl_money > 0 ? '+' : ''}₹{trade.pnl_money.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                          </td>
                          <td className="py-2 px-4 text-slate-400">
                            {trade.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Empty State */}
        {!result && !backtesting && (
          <div className="bg-[#0a0a0a] p-12 rounded-lg border border-white/10 border-dashed text-center">
            <div className="text-slate-500 text-lg">📈 Configure and run a backtest to see results here</div>
          </div>
        )}
      </main>
    </div>
  );
}

export default StrategyDashboard;
