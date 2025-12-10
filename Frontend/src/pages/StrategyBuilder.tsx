import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getStrategyConfig, updateStrategyConfig, StrategyConfig, StrategyConfigUpdate } from '../../services/api';

function StrategyBuilder() {
  const navigate = useNavigate();
  const [config, setConfig] = useState<StrategyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState<StrategyConfigUpdate>({});

  // Load strategy config on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const data = await getStrategyConfig();
        setConfig(data);
        setFormData({
          symbol: data.symbol,
          timeframe: data.timeframe,
          rsi_period: data.rsi_period,
          ema_fast: data.ema_fast,
          ema_slow: data.ema_slow,
          trend_ema: data.trend_ema,
          tp_points: data.tp_points,
          trail_offset: data.trail_offset,
          lot_size: data.lot_size,
        });
      } catch (error) {
        console.error('Failed to load strategy config', error);
        setMessage('Error loading strategy configuration');
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const numFields = ['rsi_period', 'ema_fast', 'ema_slow', 'trend_ema', 'lot_size', 'tp_points', 'trail_offset'];
    
    setFormData(prev => ({
      ...prev,
      [name]: numFields.includes(name) ? (value ? Number(value) : undefined) : value,
    }));
  };

  // Save strategy
  const handleSave = async (goToDashboard = false) => {
    setSaving(true);
    setMessage('');
    try {
      await updateStrategyConfig(formData);
      setMessage('Strategy saved successfully!');
      if (goToDashboard) {
        setTimeout(() => navigate('/dashboard'), 500);
      } else {
        setTimeout(() => setMessage(''), 2000);
      }
    } catch (error) {
      console.error('Failed to save strategy', error);
      setMessage('Error saving strategy');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-slate-200 flex items-center justify-center">
        Loading strategy configuration...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-[#0a0a0a] p-8 rounded-lg border border-white/10 shadow-lg">
          <h2 className="text-2xl font-bold text-white mb-8">Configure RSI-EMA Strategy</h2>

          {message && (
            <div className={`mb-6 p-4 rounded text-sm ${message.includes('successfully') ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50'}`}>
              {message}
            </div>
          )}

          <form className="space-y-6">
            {/* Symbol & Timeframe Row */}
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Symbol</label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white placeholder-slate-500 focus:outline-none focus:border-[#7300BD] transition"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Timeframe</label>
                <select
                  name="timeframe"
                  value={formData.timeframe || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-[#7300BD] transition"
                >
                  <option value="5m">5m</option>
                  <option value="15m">15m</option>
                  <option value="30m">30m</option>
                  <option value="1h">1h</option>
                </select>
              </div>
            </div>

            {/* RSI Parameters */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-4">RSI Settings</h3>
              <div className="grid grid-cols-1 gap-4 pl-4 border-l border-slate-700">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">RSI Period</label>
                  <input
                    type="number"
                    name="rsi_period"
                    value={formData.rsi_period || ''}
                    onChange={handleChange}
                    min="5"
                    max="50"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-[#7300BD] transition"
                  />
                </div>
              </div>
            </div>

            {/* EMA Parameters */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-4">EMA Settings</h3>
              <div className="grid grid-cols-3 gap-4 pl-4 border-l border-slate-700">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">EMA Fast (RSI)</label>
                  <input
                    type="number"
                    name="ema_fast"
                    value={formData.ema_fast || ''}
                    onChange={handleChange}
                    min="1"
                    max="20"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-[#7300BD] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">EMA Slow (RSI)</label>
                  <input
                    type="number"
                    name="ema_slow"
                    value={formData.ema_slow || ''}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-[#7300BD] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Trend EMA (Close)</label>
                  <input
                    type="number"
                    name="trend_ema"
                    value={formData.trend_ema || ''}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-[#7300BD] transition"
                  />
                </div>
              </div>
            </div>

            {/* Risk & Exit Parameters */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Risk & Exit</h3>
              <div className="grid grid-cols-2 gap-4 pl-4 border-l border-slate-700">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Take Profit Points</label>
                  <input
                    type="number"
                    name="tp_points"
                    value={formData.tp_points || ''}
                    onChange={handleChange}
                    min="10"
                    step="10"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-[#7300BD] transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Trailing Stop Offset</label>
                  <input
                    type="number"
                    name="trail_offset"
                    value={formData.trail_offset || ''}
                    onChange={handleChange}
                    min="10"
                    step="10"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-[#7300BD] transition"
                  />
                </div>
              </div>
            </div>

            {/* Position Sizing */}
            <div>
              <h3 className="text-lg font-semibold text-slate-200 mb-4">Position Sizing</h3>
              <div className="grid grid-cols-1 gap-4 pl-4 border-l border-slate-700">
                <div>
                  <label className="block text-sm font-bold text-slate-300 mb-2">Lot Size</label>
                  <input
                    type="number"
                    name="lot_size"
                    value={formData.lot_size || ''}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded text-white focus:outline-none focus:border-[#7300BD] transition"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-8 border-t border-slate-700">
              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-[#7300BD] hover:bg-[#6100a0] disabled:opacity-50 text-white font-bold rounded transition"
              >
                {saving ? 'Saving...' : 'Save Strategy'}
              </button>
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={saving}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white font-bold rounded transition"
              >
                {saving ? 'Saving...' : 'Save & Go to Dashboard'}
              </button>
              <button
                type="button"
                onClick={() => navigate('/strategy-dashboard')}
                className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded transition"
              >
                📊 Open Backtest
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default StrategyBuilder;
