import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../../components/Navbar';
import { getStrategyConfig, BacktestResult, BacktestTrade } from '../../services/api';

function StrategyDashboard() {
  const navigate = useNavigate();
  const [strategyConfig, setStrategyConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [error, setError] = useState('');

  // Load strategy config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const config = await getStrategyConfig();
        setStrategyConfig(config);

        // Load last backtest result from localStorage
        const savedResult = localStorage.getItem('lastBacktestResult');
        if (savedResult) {
          try {
            const parsedResult = JSON.parse(savedResult);
            setResult(parsedResult);
            console.log('✅ Loaded backtest result from localStorage');
          } catch (e) {
            console.warn('Could not parse saved result:', e);
          }
        }
      } catch (err) {
        console.error('Failed to load strategy config', err);
        setError('Failed to load strategy configuration');
      } finally {
        setLoading(false);
      }
    };
    
    loadConfig();
  }, []);

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
        {/* Run Backtest Button - Redirects to Backtest Page */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/backtest')}
            className="px-6 py-3 bg-[#7300BD] hover:bg-[#8f00ff] text-white font-bold rounded-lg transition text-lg"
          >
            ▶ Run New Backtest
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <>
            {/* Strategy Logic Info Box */}
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700 mb-6">
              <h3 className="text-sm font-semibold text-slate-300 mb-2 flex items-center gap-2">
                <span>📋</span> Entry & Exit Conditions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
                <div>
                  <span className="text-green-400 font-bold">Entry:</span> LONG on RSI &gt; 40, SHORT on RSI &lt; 60
                </div>
                <div>
                  <span className="text-red-400 font-bold">Exit:</span> Take Profit ({strategyConfig?.tp_points || 100} pts), Trailing Stop ({strategyConfig?.trail_offset || 50} pts), EMA ({strategyConfig?.trend_ema || 20}-period)
                </div>
                <div>
                  <span className="text-[#7300BD] font-bold">Position:</span> Lot Size: {strategyConfig?.lot_size || 1}, Capital: ₹{(result.summary.initial_equity || 100000).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

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
