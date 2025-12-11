/**
 * BacktestPage v3: Real-time market data integration
 * Fetches live candle data from /api/market/candles and backtests on it
 * Date: 2025-12-11
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Navbar from '../../components/Navbar';
import { runBacktest, saveBacktestTrades, fetchMarketCandles, BacktestResult, BacktestTrade } from '../../services/api';

interface Symbol {
  symbol: string;
  name: string;
  market: string;
  description: string;
}

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

function BacktestPage() {
  const navigate = useNavigate();
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [backtesting, setBacktesting] = useState(false);
  const [loadingCandles, setLoadingCandles] = useState(false);
  const [error, setError] = useState('');

  // Data State
  const [symbols, setSymbols] = useState<Symbol[]>([]);
  const [result, setResult] = useState<BacktestResult | null>(null);
  const [liveCandles, setLiveCandles] = useState<Candle[]>([]);

  // Form State - Initialize with defaults, then load from localStorage
  const [formData, setFormData] = useState({
    symbol: '^NSEI',
    timeframe: '1h',
    start_date: '2024-11-01',
    end_date: '2024-11-30',
    capital: 100000,
    quantity: 1,
  });

  // Load symbols on mount
  useEffect(() => {
    // Load form data from localStorage
    const savedFormData = localStorage.getItem('backtest_formData');
    if (savedFormData) {
      try {
        const parsedData = JSON.parse(savedFormData);
        setFormData(parsedData);
        console.log('✓ Loaded form data from localStorage:', parsedData);
      } catch (e) {
        console.warn('Could not parse saved form data:', e);
      }
    }

    const loadSymbols = async () => {
      setLoading(true);
      try {
        const symbolsResponse = await fetch('http://127.0.0.1:8001/api/symbols/available');
        if (symbolsResponse.ok) {
          const symbolsData = await symbolsResponse.json();
          setSymbols(symbolsData);
          console.log('✓ Loaded symbols:', symbolsData.length);
        }
      } catch (err) {
        console.error('Failed to load symbols:', err);
        setError('Failed to load symbols. Backend may not be running.');
      } finally {
        setLoading(false);
      }
    };

    loadSymbols();
  }, []);

  // Fetch live candles when symbol or timeframe changes
  useEffect(() => {
    const fetchCandles = async () => {
      setLoadingCandles(true);
      try {
        console.log(`📊 Fetching live candles for ${formData.symbol} (${formData.timeframe})...`);
        
        const candles = await fetchMarketCandles(formData.timeframe, 30, formData.symbol);
        
        if (candles && candles.length > 0) {
          setLiveCandles(candles);
          console.log(`✓ Loaded ${candles.length} live candles`);
        } else {
          console.warn('No candles returned from API');
          setLiveCandles([]);
        }
      } catch (err) {
        console.error('Failed to fetch candles:', err);
        // Don't set error here, just warn
      } finally {
        setLoadingCandles(false);
      }
    };

    fetchCandles();
  }, [formData.symbol, formData.timeframe]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newFormData = {
      ...formData,
      [name]: ['capital', 'quantity'].includes(name) ? parseInt(value) || 0 : value,
    };
    setFormData(newFormData);
    // Save to localStorage
    localStorage.setItem('backtest_formData', JSON.stringify(newFormData));
    // Clear previous results when changing inputs
    setResult(null);
    setError('');
  };

  const handleRunBacktest = async () => {
    setBacktesting(true);
    setError('');
    setResult(null);

    try {
      // Validate dates
      if (!formData.start_date || !formData.end_date) {
        throw new Error('Please select both start and end dates');
      }

      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      if (startDate > endDate) {
        throw new Error('Start date must be before end date');
      }

      const backTestRequest = {
        symbol: formData.symbol,
        timeframe: formData.timeframe,
        start_date: formData.start_date,
        end_date: formData.end_date,
        capital: formData.capital,
        quantity: formData.quantity,
      };

      console.log('🔄 Running backtest:', backTestRequest);

      const backTestResult = await runBacktest(backTestRequest);
      console.log('✅ Backtest result:', backTestResult);

      if (!backTestResult || !backTestResult.summary) {
        throw new Error('Invalid backtest response');
      }

      setResult(backTestResult);

      // Save trades
      if (backTestResult.trades && backTestResult.trades.length > 0) {
        try {
          await saveBacktestTrades(backTestResult.trades);
          console.log(`✅ Saved ${backTestResult.trades.length} trades`);
        } catch (saveErr) {
          console.warn('Could not save trades:', saveErr);
        }
      }

      // Store result in localStorage for strategy dashboard
      localStorage.setItem('lastBacktestResult', JSON.stringify(backTestResult));
      console.log('💾 Stored backtest result in localStorage');

      // Redirect to strategy dashboard after 1 second
      setTimeout(() => {
        navigate('/strategy-dashboard');
      }, 1000);
    } catch (err: any) {
      console.error('❌ Backtest failed:', err);
      setError(err.message || 'Backtest failed. Try again.');
    } finally {
      setBacktesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-200 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 mx-auto mb-4 border-4 border-[#7300BD] border-t-transparent rounded-full"></div>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans">
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Backtest Strategy</h1>
          <p className="text-slate-400">Run historical backtests on NSE indices and stocks</p>
        </div>

        {/* Simple Controls */}
        <div className="bg-slate-900 rounded-lg border border-slate-700 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
            {/* Symbol Dropdown */}
            <div>
              <label className="block text-sm font-semibold mb-2">Select Symbol</label>
              <select
                name="symbol"
                value={formData.symbol}
                onChange={handleInputChange}
                disabled={backtesting}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-slate-500 transition"
              >
                <option value="">Select Symbol</option>
                {symbols.map(sym => (
                  <option key={sym.symbol} value={sym.symbol}>
                    {sym.symbol} - {sym.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Timeframe Selector */}
            <div>
              <label className="block text-sm font-semibold mb-2">Timeframe</label>
              <select
                name="timeframe"
                value={formData.timeframe}
                onChange={handleInputChange}
                disabled={backtesting}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-slate-500 transition"
              >
                <option value="5m">5 Minutes</option>
                <option value="15m">15 Minutes</option>
                <option value="30m">30 Minutes</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
              </select>
            </div>

            {/* From Date */}
            <div>
              <label className="block text-sm font-semibold mb-2">From</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                disabled={backtesting}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-slate-500 transition"
              />
            </div>

            {/* To Date */}
            <div>
              <label className="block text-sm font-semibold mb-2">To</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                disabled={backtesting}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-slate-500 transition"
              />
            </div>

            {/* Capital */}
            <div>
              <label className="block text-sm font-semibold mb-2">Capital (₹)</label>
              <input
                type="number"
                name="capital"
                value={formData.capital}
                onChange={handleInputChange}
                disabled={backtesting}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-slate-500 transition"
              />
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-semibold mb-2">Quantity</label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                disabled={backtesting}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded text-sm hover:border-slate-500 transition"
              />
            </div>
          </div>

          {/* Run Button */}
          <button
            onClick={handleRunBacktest}
            disabled={backtesting || !formData.symbol}
            className="w-full py-3 bg-[#7300BD] hover:bg-[#8f00ff] disabled:bg-slate-700 rounded font-semibold transition text-white"
          >
            {backtesting ? '🔄 Running Backtest...' : '▶ Run Backtest'}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-900/30 border border-red-600 text-red-300 p-4 rounded mb-6">
            {error}
          </div>
        )}

        {/* Results Section - Redirect to Dashboard */}
        {result && (
          <div className="bg-slate-900 p-6 rounded border border-slate-700 text-center">
            <p className="text-green-400 font-semibold text-lg">✅ Backtest Completed!</p>
            <p className="text-slate-300 mt-2">View detailed results and trades on the <a href="/dashboard" className="text-purple-400 hover:text-purple-300 underline">Strategy Dashboard</a></p>
          </div>
        )}

        {/* Empty State */}
        {!result && !error && (
          <div className="text-center py-12 text-slate-400">
            <p>Select a symbol and date range, then click "Run Backtest" to see results</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default BacktestPage;
