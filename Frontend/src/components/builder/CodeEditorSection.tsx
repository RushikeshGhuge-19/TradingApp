/**
 * CodeEditorSection.tsx - JSON DSL code editor mode
 */

import React, { useState, useEffect } from 'react';
import { StrategyDSL } from '../../types/rule-dsl';

interface CodeEditorSectionProps {
  strategy: StrategyDSL;
  onStrategyChange: (updates: Partial<StrategyDSL>) => void;
}

export default function CodeEditorSection({
  strategy,
  onStrategyChange,
}: CodeEditorSectionProps) {
  const [code, setCode] = useState<string>(JSON.stringify(strategy, null, 2));
  const [error, setError] = useState<string>('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setCode(JSON.stringify(strategy, null, 2));
    setIsDirty(false);
  }, [strategy]);

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setIsDirty(true);

    try {
      JSON.parse(newCode);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  const handleApply = () => {
    try {
      const parsed = JSON.parse(code) as StrategyDSL;
      onStrategyChange(parsed);
      setIsDirty(false);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON');
    }
  };

  const handleReset = () => {
    setCode(JSON.stringify(strategy, null, 2));
    setIsDirty(false);
    setError('');
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(code);
      setCode(JSON.stringify(parsed, null, 2));
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex gap-2 items-center justify-between bg-slate-100 p-3 rounded-lg">
        <div className="flex gap-2">
          <button
            onClick={handleFormat}
            className="px-3 py-1 text-sm bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded transition-colors"
          >
            Format
          </button>
          <button
            onClick={handleReset}
            disabled={!isDirty}
            className={`px-3 py-1 text-sm rounded transition-colors ${
              isDirty
                ? 'bg-slate-900 hover:bg-slate-800 border border-slate-700'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            disabled={!isDirty || error !== ''}
            className={`px-3 py-1 text-sm rounded font-medium transition-colors ${
              isDirty && error === ''
                ? 'bg-[#7300BD] hover:bg-[#5b00a0] text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            Apply Changes
          </button>
        </div>

        {isDirty && (
          <span className="text-sm text-orange-600 font-medium">● Unsaved Changes</span>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-700 font-medium">JSON Error:</p>
          <p className="text-xs text-red-600 font-mono mt-1">{error}</p>
        </div>
      )}

      {/* Code Editor */}
      <div className="bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
        <textarea
          value={code}
          onChange={(e) => handleCodeChange(e.target.value)}
          className="w-full h-96 p-4 bg-slate-900 text-slate-100 font-mono text-sm resize-none focus:outline-none"
          spellCheck="false"
        />
      </div>

      {/* Info */}
      <div className="bg-[#7300BD]/10 border border-[#7300BD]/20 rounded-lg p-4 space-y-2">
          <h4 className="font-semibold text-[#7300BD]">Advanced Code Mode</h4>
          <p className="text-sm text-[#7300BD]">
           Edit the complete strategy definition in JSON format. Changes are validated in real-time.
           Click "Apply Changes" to update the form.
        </p>
        <ul className="text-sm text-[#7300BD] space-y-1 ml-4 list-disc">
           <li>Use Format button to auto-format JSON</li>
           <li>JSON must be valid before applying</li>
           <li>Changes sync back to form tabs</li>
           <li>Save to persist to storage</li>
        </ul>
      </div>
    </div>
  );
}
