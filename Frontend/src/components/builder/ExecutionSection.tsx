/**
 * ExecutionSection.tsx - Configure execution settings
 */

import React from 'react';
import { StrategyDSL, ExecutionConfig } from '../../types/rule-dsl';

interface ExecutionSectionProps {
  strategy: StrategyDSL;
  onStrategyChange: (updates: Partial<StrategyDSL>) => void;
}

export default function ExecutionSection({
  strategy,
  onStrategyChange,
}: ExecutionSectionProps) {
  const exec = strategy.execution || {
    entryFill: 'CLOSE',
    slippagePoints: 0,
    charges: { mode: 'fixed', fixedCharge: 50, components: {} },
    contractMultiplier: 1,
    lotSize: 1,
    allowPartialFill: false,
  };

  const handleExecChange = (updates: Partial<ExecutionConfig>) => {
    onStrategyChange({
      execution: { ...exec, ...updates } as ExecutionConfig,
    });
  };

  return (
    <div className="space-y-6">
      {/* Entry Fill */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Entry Fill</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">Entry Fill Method</label>
          <select
            value={exec.entryFill || 'CLOSE'}
            onChange={(e) => handleExecChange({ entryFill: e.target.value as any })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
          >
            <option value="CLOSE">Close Price (end of bar)</option>
            <option value="NEXT_OPEN">Next Open (next bar)</option>
            <option value="MARKET">Market Price (immediate)</option>
          </select>
          <p className="text-xs text-slate-600 mt-2">
            How the entry order is filled when signal is triggered
          </p>
        </div>
      </div>

      {/* Slippage */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Slippage</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Slippage (points)
          </label>
          <input
            type="number"
            min="0"
            step="0.5"
            value={exec.slippagePoints ?? 0}
            onChange={(e) => handleExecChange({ slippagePoints: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
          />
          <p className="text-xs text-slate-600 mt-2">
            Additional points added to prices for realism
          </p>
        </div>
      </div>

      {/* Charges */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Charges & Fees</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-slate-700 mb-2">Charge Mode</label>
          <select
            value={exec.charges?.mode || 'fixed'}
            onChange={(e) =>
              handleExecChange({
                charges: { ...exec.charges, mode: e.target.value as any },
              })
            }
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
          >
            <option value="fixed">Fixed per trade</option>
            <option value="components">Component breakdown</option>
          </select>
        </div>

        {exec.charges?.mode === 'fixed' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Fixed Charge (₹)
            </label>
            <input
              type="number"
              step="0.01"
              value={exec.charges?.fixedCharge ?? 50}
              onChange={(e) =>
                handleExecChange({
                  charges: { ...exec.charges, fixedCharge: parseFloat(e.target.value) || 50 },
                })
              }
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
            />
            <p className="text-xs text-slate-600 mt-2">Charge per entry + exit</p>
          </div>
        )}

        {exec.charges?.mode === 'components' && (
          <div className="space-y-3">
            {[
              { key: 'brokerage', label: 'Brokerage (₹)' },
              { key: 'exchange', label: 'Exchange Fees (₹)' },
              { key: 'stt', label: 'STT (₹)' },
              { key: 'gst', label: 'GST (₹)' },
            ].map((comp) => (
              <div key={comp.key}>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {comp.label}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={exec.charges?.components?.[comp.key as any] ?? 0}
                  onChange={(e) =>
                    handleExecChange({
                      charges: {
                        ...exec.charges,
                        components: {
                          ...exec.charges?.components,
                          [comp.key]: parseFloat(e.target.value) || 0,
                        },
                      },
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Contract Multiplier */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Contract Details</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Contract Multiplier
          </label>
          <input
            type="number"
            min="1"
            step="0.1"
            value={exec.contractMultiplier ?? 1}
            onChange={(e) =>
              handleExecChange({ contractMultiplier: parseFloat(e.target.value) || 1 })
            }
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
          />
          <p className="text-xs text-slate-600 mt-2">
            For index/derivative contracts. E.g., NIFTY lot = 50 points
          </p>
        </div>
      </div>

      {/* Lot Size */}
      <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">Lot Size</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Standard Lot Size
          </label>
          <input
            type="number"
            min="1"
            value={exec.lotSize ?? 1}
            onChange={(e) => handleExecChange({ lotSize: parseInt(e.target.value) || 1 })}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD] focus:border-[#7300BD]"
          />
          <p className="text-xs text-slate-600 mt-2">
            Used for position sizing calculations (e.g., NIFTYBANK lot = 1)
          </p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-[#7300BD]/10 border border-[#7300BD]/20 rounded-lg p-4">
        <h4 className="font-semibold text-[#7300BD] mb-2">Execution Settings</h4>
        <p className="text-sm text-[#7300BD]">
          These settings affect how trades are executed and costed during backtests. Realistic
          values ensure accurate P&L calculation.
        </p>
      </div>
    </div>
  );
}
