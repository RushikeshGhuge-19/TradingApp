/**
 * StrategyHeader.tsx - Header with title, save, and new buttons
 */

import React from 'react';
import { StrategyDSL } from '../../types/rule-dsl';

interface StrategyHeaderProps {
  strategy: StrategyDSL;
  onStrategyChange: (updates: Partial<StrategyDSL>) => void;
  onSave: () => void;
  onNew: () => void;
  hasChanges: boolean;
  isSaving: boolean;
  canSave: boolean;
}

export default function StrategyHeader({
  strategy,
  onStrategyChange,
  onSave,
  onNew,
  hasChanges,
  isSaving,
  canSave,
}: StrategyHeaderProps) {
  return (
    <div className="bg-[#0a0a0a] border-b border-slate-700 px-6 py-4 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Title & Name */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">Strategy Builder</h1>
            {hasChanges && <span className="text-orange-600 font-medium">●</span>}
          </div>
          <input
            type="text"
            value={strategy.name}
            onChange={(e) => onStrategyChange({ name: e.target.value })}
            className="mt-2 px-3 py-1 text-lg font-semibold bg-slate-900 border border-slate-700 rounded hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
            placeholder="Strategy name..."
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 ml-6">
          <button
            onClick={onNew}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            New
          </button>
          <button
            onClick={onSave}
            disabled={!canSave || isSaving}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              canSave && !isSaving
                ? 'bg-[#7300BD] hover:bg-[#5b008f] text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
