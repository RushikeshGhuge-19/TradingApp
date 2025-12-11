/**
 * BacktestPage: CSV upload, strategy selection, run backtest, display results.
 * Date: 2025-12-11
 */

import React, { useState } from 'react';
import { useTradingStore } from '../store/tradingStore';
import { Bar } from '../types/engine';
import ChartWithMarkers from '../components/ChartWithMarkers';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export const BacktestPage: React.FC = () => {
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const store = useTradingStore();
  const { bars, trades, summary, markers, equity, currentStrategy, runBacktest } = store;

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError('');

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(l => l.trim());

      // Parse CSV: expected format: dt,open,high,low,close,volume
      const parsedBars: Bar[] = [];
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim());
        if (parts.length >= 5) {
          parsedBars.push({
            dt: parts[0],
            open: parseFloat(parts[1]),
            high: parseFloat(parts[2]),
            low: parseFloat(parts[3]),
            close: parseFloat(parts[4]),
            volume: parts[5] ? parseFloat(parts[5]) : undefined,
          });
        }
      }

      if (parsedBars.length === 0) {
        throw new Error('No valid data in CSV');
      }

      store.loadBars(parsedBars);
      setCsvFile(file);
    } catch (err) {
      setError(`Failed to parse CSV: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunBacktest = async () => {
    if (!bars.length) {
      setError('Please upload CSV data first');
      return;
    }
    if (!currentStrategy) {
      setError('Please select a strategy');
      return;
    }

    setLoading(true);
    try {
      await runBacktest();
    } catch (err) {
      setError(`Backtest failed: ${err}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Backtest</h1>
          <p className="text-slate-400">Upload data and run backtest</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* CSV Upload */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <label className="block text-sm font-semibold mb-2">Upload CSV</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleCsvUpload}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm"
              disabled={loading}
            />
            {csvFile && <p className="text-xs text-green-400 mt-2">✓ {csvFile.name}</p>}
          </div>

          {/* Strategy Selection */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
            <label className="block text-sm font-semibold mb-2">Strategy</label>
            <select
              value={currentStrategy?.id || ''}
              onChange={e => {
                const s = store.listStrategies().find(x => x.id === e.target.value);
                if (s) store.setCurrentStrategy(s);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm"
            >
              <option value="">Select strategy</option>
              {store.listStrategies().map(s => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Run Button */}
          <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex items-end">
            <button
              onClick={handleRunBacktest}
              disabled={loading || !bars.length || !currentStrategy}
              className="w-full py-2 bg-[#7300BD] hover:bg-[#8f00ff] disabled:bg-slate-700 rounded font-semibold transition"
            >
              {loading ? 'Running...' : 'Run Backtest'}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Results */}
        {trades.length > 0 && (
          <div className="space-y-6">
            {/* Summary KPIs */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900 p-4 rounded border border-slate-700">
                <p className="text-slate-400 text-sm">Total Trades</p>
                <p className="text-2xl font-bold text-slate-100">{summary.trades}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded border border-slate-700">
                <p className="text-slate-400 text-sm">Gross P&L</p>
                <p className={`text-2xl font-bold ${summary.gross >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.gross.toFixed(2)}
                </p>
              </div>
              <div className="bg-slate-900 p-4 rounded border border-slate-700">
                <p className="text-slate-400 text-sm">Total Charges</p>
                <p className="text-2xl font-bold text-slate-100">{summary.charges.toFixed(2)}</p>
              </div>
              <div className="bg-slate-900 p-4 rounded border border-slate-700">
                <p className="text-slate-400 text-sm">Net P&L</p>
                <p className={`text-2xl font-bold ${summary.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {summary.net.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Chart */}
            <ChartWithMarkers bars={bars} markers={markers} title="Price & Signals" />

            {/* Equity Curve */}
            {equity.length > 0 && (
              <div className="bg-slate-900 p-4 rounded border border-slate-700">
                <h3 className="text-slate-100 font-semibold mb-4">Equity Curve</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={equity.map((e, i) => ({ time: i, equity: e }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="time" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                    <Line type="monotone" dataKey="equity" stroke="#7300BD" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Trades Table */}
            <div className="bg-slate-900 p-4 rounded border border-slate-700 overflow-x-auto">
              <h3 className="text-slate-100 font-semibold mb-4">Trades</h3>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-2 px-2 text-slate-400">#</th>
                    <th className="text-left py-2 px-2 text-slate-400">Dir</th>
                    <th className="text-left py-2 px-2 text-slate-400">Entry Price</th>
                    <th className="text-left py-2 px-2 text-slate-400">Exit Price</th>
                    <th className="text-left py-2 px-2 text-slate-400">Gross</th>
                    <th className="text-left py-2 px-2 text-slate-400">Charges</th>
                    <th className="text-left py-2 px-2 text-slate-400">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map(t => (
                    <tr key={t.tradeNo} className="border-b border-slate-800 hover:bg-slate-800">
                      <td className="py-2 px-2">{t.tradeNo}</td>
                      <td className="py-2 px-2">{t.dir}</td>
                      <td className="py-2 px-2">{t.entryPrice.toFixed(2)}</td>
                      <td className="py-2 px-2">{t.exitPrice.toFixed(2)}</td>
                      <td className={`py-2 px-2 ${t.gross >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.gross.toFixed(2)}
                      </td>
                      <td className="py-2 px-2">{t.charges.toFixed(2)}</td>
                      <td className={`py-2 px-2 ${t.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {t.net.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!trades.length && !error && bars.length > 0 && (
          <div className="text-center text-slate-400">Click "Run Backtest" to see results</div>
        )}
      </div>
    </div>
  );
};

export default BacktestPage;
