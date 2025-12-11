/**
 * PreviewPanel.tsx - Live preview of strategy rules and descriptions
 */

import React, { useMemo } from 'react';
import { StrategyDSL } from '../../types/rule-dsl';

interface PreviewPanelProps {
  strategy: StrategyDSL;
}

export default function PreviewPanel({ strategy }: PreviewPanelProps) {
  const summary = useMemo(() => {
    return {
      indicators: strategy.indicators?.length || 0,
      hasEntry: !!strategy.rules?.entry,
      hasEntryShort: !!strategy.rules?.entryShort,
      hasExit: !!strategy.rules?.exit,
      hasSL: strategy.risk?.sl?.enabled,
      hasTP: strategy.risk?.tp?.enabled,
      hasTSL: strategy.risk?.tsl?.enabled,
      capital: strategy.meta?.defaultCapital || 100000,
      timeframe: strategy.meta?.timeframe || '15m',
    };
  }, [strategy]);

  const ruleDescription = (node: any): string => {
    if (!node) return 'Not defined';

    if (node.type === 'and') {
      return `All of: ${node.nodes?.length || 0} conditions`;
    }
    if (node.type === 'or') {
      return `Any of: ${node.nodes?.length || 0} conditions`;
    }
    if (node.type === 'condition') {
      const leftStr = node.left?.kind === 'indicator' ? `${node.left.id}` : `${node.left?.kind}`;
      const rightStr = node.right?.kind === 'indicator' ? `${node.right.id}` : `${node.right?.value}`;
      return `${leftStr} ${node.op} ${rightStr}`;
    }
    if (node.type === 'cross') {
      return `${node.a?.id || 'A'} crosses above ${node.b?.id || 'B'}`;
    }
    if (node.type === 'crossdown') {
      return `${node.a?.id || 'A'} crosses below ${node.b?.id || 'B'}`;
    }
    if (node.type === 'timefilter') {
      return `${node.start}-${node.end} ${node.days?.join(', ') || ''}`;
    }

    return 'Complex condition';
  };

  return (
    <div className="bg-[#0a0a0a] rounded-lg shadow-sm p-4 space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-800 rounded p-2">
          <div className="text-xs text-slate-400">Indicators</div>
          <div className="text-lg font-semibold text-slate-200">{summary.indicators}</div>
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="text-xs text-slate-400">Timeframe</div>
          <div className="text-lg font-semibold text-slate-200">{summary.timeframe}</div>
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="text-xs text-slate-400">Capital</div>
          <div className="text-sm font-semibold text-slate-200">
            ₹{(summary.capital / 100000).toFixed(1)}L
          </div>
        </div>
        <div className="bg-slate-800 rounded p-2">
          <div className="text-xs text-slate-400">Rules</div>
          <div className="text-sm font-semibold text-slate-200">
            {[summary.hasEntry, summary.hasEntryShort, summary.hasExit].filter(Boolean).length}/3
          </div>
        </div>
      </div>

      {/* Indicators List */}
      {strategy.indicators && strategy.indicators.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Indicators</h4>
          <div className="space-y-1">
            {strategy.indicators.map((ind) => (
              <div key={ind.id} className="text-xs bg-slate-800 px-2 py-1 rounded text-slate-200">
                <span className="font-medium">{ind.id}</span>{' '}
                <span className="text-slate-600">({ind.type})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules Summary */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Rules</h4>
        <div className="space-y-1">
          {strategy.rules?.entry && (
            <div className="text-xs bg-[#7300BD]/10 px-2 py-1 rounded border border-[#7300BD]/20">
              <span className="font-medium text-[#7300BD]">Entry:</span>{' '}
              <span className="text-[#7300BD]">{ruleDescription(strategy.rules.entry)}</span>
            </div>
          )}
          {strategy.rules?.entryShort && (
            <div className="text-xs bg-[#7300BD]/10 px-2 py-1 rounded border border-[#7300BD]/20">
              <span className="font-medium text-[#7300BD]">Entry Short:</span>{' '}
              <span className="text-[#7300BD]">{ruleDescription(strategy.rules.entryShort)}</span>
            </div>
          )}
          {strategy.rules?.exit && (
            <div className="text-xs bg-red-900/20 px-2 py-1 rounded border border-red-700/50 text-red-400">
              <span className="font-medium text-red-800">Exit:</span>{' '}
              <span className="text-red-700">{ruleDescription(strategy.rules.exit)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Risk Summary */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Risk Management</h4>
        <div className="space-y-1 text-xs text-slate-700">
          <div>
            Sizing: <span className="font-medium">{strategy.risk?.sizing?.type || 'fixed_lot'}</span>
          </div>
          {strategy.risk?.sl?.enabled && (
            <div>
              SL: <span className="font-medium">{strategy.risk.sl.value} {strategy.risk.sl.type}</span>
            </div>
          )}
          {strategy.risk?.tp?.enabled && (
            <div>
              TP: <span className="font-medium">{strategy.risk.tp.value} {strategy.risk.tp.type}</span>
            </div>
          )}
          {strategy.risk?.tsl?.enabled && (
            <div>
              TSL: <span className="font-medium">{strategy.risk.tsl.offset}pts</span>
            </div>
          )}
        </div>
      </div>

      {/* Execution Summary */}
      <div>
        <h4 className="text-xs font-semibold text-slate-400 uppercase mb-2">Execution</h4>
        <div className="space-y-1 text-xs text-slate-700">
          <div>
            Fill: <span className="font-medium">{strategy.execution?.entryFill || 'CLOSE'}</span>
          </div>
          <div>
            Charges:{' '}
            <span className="font-medium">
              {strategy.execution?.charges?.mode === 'fixed'
                ? `₹${strategy.execution.charges.fixedCharge}`
                : 'Components'}
            </span>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
        <p className="text-xs text-slate-400">
          📊 This is a read-only preview. Edit settings in the tabs above.
        </p>
      </div>
    </div>
  );
}
