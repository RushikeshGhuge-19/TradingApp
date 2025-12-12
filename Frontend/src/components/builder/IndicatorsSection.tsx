/**
 * IndicatorsSection.tsx - Add and manage indicators
 */

import React, { useState } from 'react';
import { StrategyDSL, IndicatorDef } from '../../types/rule-dsl';

interface IndicatorsSectionProps {
  strategy: StrategyDSL;
  onStrategyChange: (updates: Partial<StrategyDSL>) => void;
}

const indicatorTypes = [
  { value: 'rsi', label: 'RSI - Relative Strength Index' },
  { value: 'ema', label: 'EMA - Exponential Moving Average' },
  { value: 'sma', label: 'SMA - Simple Moving Average' },
  { value: 'atr', label: 'ATR - Average True Range' },
  { value: 'bb', label: 'Bollinger Bands' },
  { value: 'macd', label: 'MACD - Moving Average Convergence' },
  { value: 'stoch', label: 'Stochastic Oscillator' },
  { value: 'adx', label: 'ADX - Average Directional Index' },
];

const indicatorParams: Record<string, Array<{ name: string; label: string; default: number }>> = {
  rsi: [{ name: 'period', label: 'Period', default: 14 }],
  ema: [
    { name: 'period', label: 'Period', default: 12 },
    { name: 'source', label: 'Source (indicator:id for chaining)', default: 0 },
  ],
  sma: [
    { name: 'period', label: 'Period', default: 20 },
    { name: 'source', label: 'Source', default: 0 },
  ],
  atr: [{ name: 'period', label: 'Period', default: 14 }],
  bb: [
    { name: 'period', label: 'Period', default: 20 },
    { name: 'stdDev', label: 'Std Deviation', default: 2 },
  ],
  macd: [
    { name: 'fastPeriod', label: 'Fast Period', default: 12 },
    { name: 'slowPeriod', label: 'Slow Period', default: 26 },
    { name: 'signalPeriod', label: 'Signal Period', default: 9 },
  ],
  stoch: [
    { name: 'kPeriod', label: 'K Period', default: 14 },
    { name: 'dPeriod', label: 'D Period', default: 3 },
    { name: 'smoothK', label: 'Smooth K', default: 3 },
  ],
  adx: [{ name: 'period', label: 'Period', default: 14 }],
};

export default function IndicatorsSection({
  strategy,
  onStrategyChange,
}: IndicatorsSectionProps) {
  const [newIndicatorType, setNewIndicatorType] = useState<string>('rsi');
  const [newIndicatorId, setNewIndicatorId] = useState<string>('');

  const handleAddIndicator = () => {
    if (!newIndicatorId.trim()) {
      alert('Please provide an indicator ID');
      return;
    }

    // Check for duplicate IDs
    if (strategy.indicators?.some((ind) => ind.id === newIndicatorId)) {
      alert('Indicator ID already exists');
      return;
    }

    const newIndicator: IndicatorDef = {
      id: newIndicatorId,
      type: newIndicatorType as any,
      params: {},
    };

    // Set default params
    const params = indicatorParams[newIndicatorType] || [];
    params.forEach((param) => {
      if (param.name === 'source') {
        newIndicator.params[param.name] = 'close'; // Default source
      } else {
        newIndicator.params[param.name] = param.default;
      }
    });

    onStrategyChange({
      indicators: [...(strategy.indicators || []), newIndicator],
    });

    setNewIndicatorId('');
  };

  const handleRemoveIndicator = (id: string) => {
    onStrategyChange({
      indicators: strategy.indicators?.filter((ind) => ind.id !== id) || [],
    });
  };

  const handleUpdateIndicatorParam = (
    indicatorId: string,
    paramName: string,
    value: any
  ) => {
    onStrategyChange({
      indicators: strategy.indicators?.map((ind) =>
        ind.id === indicatorId
          ? {
              ...ind,
              params: {
                ...ind.params,
                [paramName]: paramName === 'period' || paramName.includes('Period') || paramName === 'stdDev' ? parseInt(value) || 0 : value,
              },
            }
          : ind
      ) || [],
    });
  };

  return (
    <div className="space-y-6">
      {/* Add New Indicator */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
        <h3 className="font-semibold mb-4 text-slate-200">Add New Indicator</h3>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Indicator Type
            </label>
            <select
              value={newIndicatorType}
              onChange={(e) => setNewIndicatorType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
            >
              {indicatorTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Indicator ID
            </label>
            <input
              type="text"
              value={newIndicatorId}
              onChange={(e) => setNewIndicatorId(e.target.value)}
              placeholder="e.g., rsi14, ema12"
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={handleAddIndicator}
              className="w-full px-4 py-2 bg-[#7300BD] hover:bg-[#5a007f] text-white rounded-lg font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>

          <p className="text-xs text-slate-400">
          ID must be unique. Use format like: rsi14, ema_fast, bb20, etc.
        </p>
      </div>

      {/* Indicators List */}
      <div>
        <h3 className="font-semibold mb-4">
          Indicators ({strategy.indicators?.length || 0})
        </h3>

        {(!strategy.indicators || strategy.indicators.length === 0) ? (
            <div className="text-center py-8 bg-slate-800 rounded-lg border border-slate-700">
            <p className="text-slate-600">No indicators added yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {strategy.indicators.map((indicator) => (
              <div
                key={indicator.id}
                className="bg-slate-900 border border-slate-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-900">{indicator.id}</h4>
                    <p className="text-sm text-slate-600">
                      {indicatorTypes.find((t) => t.value === indicator.type)?.label}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveIndicator(indicator.id)}
                    className="text-red-600 hover:text-red-700 font-medium text-sm"
                  >
                    Remove
                  </button>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(indicatorParams[indicator.type] || []).map((param) => (
                    <div key={param.name}>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        {param.label}
                      </label>
                      <input
                        type={param.name === 'source' || param.name === 'source' ? 'text' : 'number'}
                        value={indicator.params[param.name] ?? param.default}
                        onChange={(e) =>
                          handleUpdateIndicatorParam(indicator.id, param.name, e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm bg-slate-800 border border-slate-700 text-white rounded focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
                      />
                      {param.name === 'source' && (
                        <p className="text-xs text-slate-500 mt-1">
                          Use 'close' or 'indicator:id' for chaining
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Help */}
      <div className="bg-[#7300BD]/10 border border-[#7300BD]/20 rounded-lg p-4">
        <h4 className="font-semibold text-[#7300BD] mb-2">Indicator Chaining</h4>
        <p className="text-sm text-[#7300BD]">
          For indicators like EMA and SMA, you can chain them on other indicators. For example, set
          source to <code className="bg-white px-1 rounded">indicator:rsi14</code> to calculate
          EMA of RSI.
        </p>
      </div>
    </div>
  );
}
