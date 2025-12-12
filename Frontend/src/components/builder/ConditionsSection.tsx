/**
 * ConditionsSection.tsx - Define entry and exit conditions
 */

import React, { useState } from 'react';
import { StrategyDSL, LogicNode } from '../../types/rule-dsl';

interface ConditionsSectionProps {
  strategy: StrategyDSL;
  onStrategyChange: (updates: Partial<StrategyDSL>) => void;
}

const conditionTypes = [
  { value: 'condition', label: 'Simple Condition (A > B)' },
  { value: 'and', label: 'AND - All conditions true' },
  { value: 'or', label: 'OR - Any condition true' },
  { value: 'not', label: 'NOT - Negate condition' },
  { value: 'cross', label: 'Crossover (A crosses above B)' },
  { value: 'crossdown', label: 'Crossunder (A crosses below B)' },
  { value: 'timefilter', label: 'Time Filter (during trading hours)' },
];

const operators = ['>', '<', '>=', '<=', '==', '!='];

export default function ConditionsSection({
  strategy,
  onStrategyChange,
}: ConditionsSectionProps) {
  const [activeRule, setActiveRule] = useState<'entry' | 'exit' | 'entryShort'>('entry');
  const [showJsonEditor, setShowJsonEditor] = useState(false);

  const currentRule = strategy.rules?.[activeRule];

  const handleRuleChange = (rule: LogicNode | undefined) => {
    onStrategyChange({
      rules: {
        ...strategy.rules,
        [activeRule]: rule,
      },
    });
  };

  const handleJsonChange = (json: string) => {
    try {
      const parsed = JSON.parse(json);
      handleRuleChange(parsed);
    } catch (err) {
      console.error('Invalid JSON:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Rule Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {['entry', 'entryShort', 'exit'].map((rule) => (
          <button
            key={rule}
            onClick={() => setActiveRule(rule as any)}
            className={`px-4 py-2 font-medium border-b-2 transition-colors ${
              activeRule === rule
                ? 'border-[#7300BD] text-[#7300BD]'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            {rule === 'entryShort' ? 'Entry Short' : rule.charAt(0).toUpperCase() + rule.slice(1)}
          </button>
        ))}
      </div>

      {/* Rule Editor Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowJsonEditor(false)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            !showJsonEditor
              ? 'bg-[#7300BD]/5 text-[#7300BD]'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          Visual Editor
        </button>
        <button
          onClick={() => setShowJsonEditor(true)}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            showJsonEditor
              ? 'bg-[#7300BD]/10 text-[#7300BD]'
              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
          }`}
        >
          JSON Editor
        </button>
      </div>

      {/* JSON Editor */}
      {showJsonEditor && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-4">
          <label className="block text-sm font-medium text-slate-200 mb-2">
            {activeRule.toUpperCase()} Condition (JSON)
          </label>
          <textarea
            value={JSON.stringify(currentRule, null, 2)}
            onChange={(e) => handleJsonChange(e.target.value)}
            className="w-full h-64 px-3 py-2 font-mono text-sm bg-slate-800 border border-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7300BD]"
          />
          <p className="text-xs text-slate-600 mt-2">
            Edit the JSON directly. Syntax errors will be caught when you switch tabs.
          </p>
        </div>
      )}

      {/* Visual Editor */}
      {!showJsonEditor && (
        <div className="bg-slate-900 border border-slate-700 rounded-lg p-6">
          {currentRule ? (
            <div>
              <h3 className="font-semibold mb-4">Condition Structure</h3>
              <pre className="bg-slate-800 p-4 rounded-lg overflow-x-auto text-sm font-mono text-slate-200">
                {JSON.stringify(currentRule, null, 2)}
              </pre>
              <p className="text-sm text-slate-600 mt-4">
                Use JSON Editor tab for full control over condition logic.
              </p>
              <button
                onClick={() => {
                  setShowJsonEditor(true);
                }}
                className="mt-4 px-4 py-2 bg-[#7300BD] hover:bg-[#5b008f] text-white rounded-lg font-medium transition-colors"
              >
                Edit in JSON Mode
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-600 mb-4">No condition defined yet</p>
              <button
                onClick={() => {
                  setShowJsonEditor(true);
                }}
                className="px-4 py-2 bg-[#7300BD] hover:bg-[#5b008f] text-white rounded-lg font-medium transition-colors"
              >
                Create in JSON Mode
              </button>
            </div>
          )}
        </div>
      )}

      {/* Help */}
      <div className="bg-[#7300BD]/10 border border-[#7300BD]/20 rounded-lg p-4 space-y-2">
        <h4 className="font-semibold text-[#7300BD]">Condition Syntax Guide</h4>
        <div className="text-sm text-[#7300BD] space-y-1">
          <p>
            <span className="font-medium">Condition:</span>{' '}
            <code className="bg-white px-1 rounded">
              {'{type: "condition", left: {...}, op: ">", right: {...}}'}
            </code>
          </p>
          <p>
            <span className="font-medium">AND/OR:</span>{' '}
            <code className="bg-white px-1 rounded">
              {'{type: "and", nodes: [condition1, condition2, ...]}'}
            </code>
          </p>
          <p>
            <span className="font-medium">Crossover:</span>{' '}
            <code className="bg-white px-1 rounded">
              {'{type: "cross", a: operand, b: operand}'}
            </code>
          </p>
          <p>
            <span className="font-medium">Operands:</span> {'{kind: "indicator", id: "rsi14"}'} or{' '}
            {'{kind: "bar", field: "close"}'} or {'{kind: "number", value: 50}'}
          </p>
        </div>
      </div>
    </div>
  );
}
