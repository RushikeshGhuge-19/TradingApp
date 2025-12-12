/**
 * RiskSection.tsx - Configure risk management
 */

import React, { useState } from 'react';
import { StrategyDSL, RiskConfig, Sizing, StopLoss, TakeProfit, TrailingStopLoss } from '../../types/rule-dsl';

interface RiskSectionProps {
  strategy: StrategyDSL;
  onStrategyChange: (updates: Partial<StrategyDSL>) => void;
}

export default function RiskSection({
  strategy,
  onStrategyChange,
}: RiskSectionProps) {
  const risk = strategy.risk || {
    sizing: { type: 'fixed_lot', lots: 1 },
    sl: { enabled: false, type: 'points', value: 20 },
    tp: { enabled: false, type: 'points', value: 50 },
    tsl: { enabled: false, offset: 0 },
    maxOpenPositions: 1
  };

  const handleSizingChange = (updates: Partial<Sizing>) => {
    onStrategyChange({
      risk: {
        ...risk,
        sizing: { ...risk.sizing, ...updates },
      },
    });
  };

  const handleSlChange = (updates: Partial<StopLoss>) => {
    onStrategyChange({
      risk: {
        ...risk,
        sl: { ...risk.sl, ...updates },
      },
    });
  };

  const handleTpChange = (updates: Partial<TakeProfit>) => {
    onStrategyChange({
      risk: {
        ...risk,
        tp: { ...risk.tp, ...updates },
      },
    });
  };

  const handleTslChange = (updates: Partial<TrailingStopLoss>) => {
    onStrategyChange({
      risk: {
        ...risk,
        tsl: { ...risk.tsl, ...updates },
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Position Sizing */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Position Sizing</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Sizing Mode</label>
          <select
            value={risk.sizing?.type || 'fixed_lot'}
            onChange={(e) =>
              handleSizingChange({
                type: e.target.value as any,
              })
            }
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
          >
            <option value="fixed_lot">Fixed Lot Size</option>
            <option value="percent_capital">Percent of Capital</option>
            <option value="fixed_quantity">Fixed Quantity</option>
            <option value="dynamic">Dynamic (ATR-based)</option>
          </select>
        </div>

        {/* Based on sizing type */}
        {risk.sizing?.type === 'fixed_lot' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Lots</label>
            <input
              type="number"
              min="1"
              value={risk.sizing?.lots ?? 1}
              onChange={(e) => handleSizingChange({ lots: parseInt(e.target.value) || 1 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
            />
          </div>
        )}

        {risk.sizing?.type === 'percent_capital' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Percent of Capital (%)
            </label>
            <input
              type="number"
              min="0.1"
              max="100"
              step="0.1"
              value={risk.sizing?.percent ?? 2}
              onChange={(e) => handleSizingChange({ percent: parseFloat(e.target.value) || 2 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
            />
          </div>
        )}

        {risk.sizing?.type === 'fixed_quantity' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Quantity</label>
            <input
              type="number"
              min="1"
              value={risk.sizing?.quantity ?? 100}
              onChange={(e) => handleSizingChange({ quantity: parseInt(e.target.value) || 100 })}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]/50"
            />
          </div>
        )}
      </div>

      {/* Stop Loss */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Stop Loss</h3>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={risk.sl?.enabled ?? false}
            onChange={(e) => handleSlChange({ enabled: e.target.checked })}
            className="w-4 h-4 text-[#7300BD] rounded focus:ring-2 focus:ring-[#7300BD]"
            />
          <label className="text-sm font-medium text-slate-700">Enable Stop Loss</label>
        </div>

        {risk.sl?.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">SL Type</label>
              <select
                value={risk.sl?.type || 'points'}
                onChange={(e) => handleSlChange({ type: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
              >
                <option value="points">Points</option>
                <option value="percent">Percent</option>
                <option value="atr">ATR-based</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {risk.sl?.type === 'percent' ? 'SL %' : 'SL Value'}
              </label>
              <input
                type="number"
                step={risk.sl?.type === 'percent' ? '0.1' : '1'}
                value={risk.sl?.value ?? 20}
                onChange={(e) => handleSlChange({ value: parseFloat(e.target.value) || 20 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
              />
            </div>

            {risk.sl?.type === 'atr' && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  ATR Period
                </label>
                <input
                  type="number"
                  min="1"
                  value={risk.sl?.atrPeriod ?? 14}
                  onChange={(e) => handleSlChange({ atrPeriod: parseInt(e.target.value) || 14 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Take Profit */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Take Profit</h3>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={risk.tp?.enabled ?? false}
            onChange={(e) => handleTpChange({ enabled: e.target.checked })}
            className="w-4 h-4 text-[#7300BD] rounded focus:ring-2 focus:ring-[#7300BD]"
            />
          <label className="text-sm font-medium text-slate-700">Enable Take Profit</label>
        </div>

        {risk.tp?.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">TP Type</label>
              <select
                value={risk.tp?.type || 'points'}
                onChange={(e) => handleTpChange({ type: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
              >
                <option value="points">Points</option>
                <option value="percent">Percent</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">TP Value</label>
              <input
                type="number"
                step={risk.tp?.type === 'percent' ? '0.1' : '1'}
                value={risk.tp?.value ?? 50}
                onChange={(e) => handleTpChange({ value: parseFloat(e.target.value) || 50 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={risk.tp?.lockAtTp ?? false}
                onChange={(e) => handleTpChange({ lockAtTp: e.target.checked })}
                className="w-4 h-4 text-[#7300BD] rounded focus:ring-2 focus:ring-[#7300BD]"
                />
              <label className="text-sm font-medium text-slate-700">
                Lock at TP (breakeven + offset)
              </label>
            </div>

            {risk.tp?.lockAtTp && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lock Offset (points)
                </label>
                <input
                  type="number"
                  value={risk.tp?.lockOffset ?? 0}
                  onChange={(e) => handleTpChange({ lockOffset: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Trailing Stop Loss */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Trailing Stop Loss</h3>

        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            checked={risk.tsl?.enabled ?? false}
            onChange={(e) => handleTslChange({ enabled: e.target.checked })}
            className="w-4 h-4 text-[#7300BD] rounded focus:ring-2 focus:ring-[#7300BD]/50"
          />
          <label className="text-sm font-medium text-slate-700">Enable Trailing Stop Loss</label>
        </div>

        {risk.tsl?.enabled && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Offset (points)
              </label>
              <input
                type="number"
                min="1"
                value={risk.tsl?.offset ?? 50}
                onChange={(e) => handleTslChange({ offset: parseInt(e.target.value) || 50 })}
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={risk.tsl?.afterTpLock ?? false}
                onChange={(e) => handleTslChange({ afterTpLock: e.target.checked })}
                className="w-4 h-4 text-[#7300BD] rounded focus:ring-2 focus:ring-[#7300BD]"
                />
              <label className="text-sm font-medium text-slate-700">
                Only trail after TP lock
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Max Open Positions */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Position Limits</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Max Open Positions
          </label>
          <input
            type="number"
            min="1"
            value={risk.maxOpenPositions ?? 1}
            onChange={(e) =>
              onStrategyChange({
                risk: { ...risk, maxOpenPositions: parseInt(e.target.value) || 1 },
              })
            }
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
          />
        </div>
      </div>
    </div>
  );
}
