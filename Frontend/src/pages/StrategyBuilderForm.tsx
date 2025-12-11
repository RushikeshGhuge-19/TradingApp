/**
 * StrategyBuilderForm.tsx - Main Strategy Builder Page (Phase 3)
 * Form-based builder with tabs: Indicators | Conditions | Risk | Execution | Code Mode
 */

import React, { useState, useEffect } from 'react';
import useStrategyStore from '../hooks/useStrategyStore';
import Navbar from '../../components/Navbar';
import { StrategyDSL } from '../types/rule-dsl';
import { strategyTemplates } from '../services/strategyTemplates';
import IndicatorsSection from '../components/builder/IndicatorsSection';
import ConditionsSection from '../components/builder/ConditionsSection';
import RiskSection from '../components/builder/RiskSection';
import ExecutionSection from '../components/builder/ExecutionSection';
import CodeEditorSection from '../components/builder/CodeEditorSection';
import PreviewPanel from '../components/builder/PreviewPanel';
import StrategyHeader from '../components/builder/StrategyHeader';
import QuickBacktestModal from '../components/QuickBacktestModal';

type TabType = 'indicators' | 'conditions' | 'risk' | 'execution' | 'code';

interface StrategyBuilderFormProps {
  initialId?: string;
}

const defaultStrategy: StrategyDSL = {
  name: 'New Strategy',
  version: 1,
  meta: {
    defaultCapital: 100000,
    timeframe: '15m',
    symbols: ['NIFTYBANK.NS'],
  },
  indicators: [],
  rules: {
    entry: { type: 'and', nodes: [] },
  },
  risk: {
    sizing: { type: 'fixed_lot', lots: 1 },
  },
  execution: {
    entryFill: 'CLOSE',
    charges: { mode: 'fixed', fixedCharge: 50 },
    contractMultiplier: 1,
    lotSize: 1,
  },
};

export default function StrategyBuilderForm({ initialId }: StrategyBuilderFormProps) {
  const {
    currentStrategy,
    currentId,
    isLoading,
    error,
    loadStrategy,
    saveStrategy,
    validate,
    isValid,
  } = useStrategyStore();

  const [strategy, setStrategy] = useState<StrategyDSL>(defaultStrategy);
  const [activeTab, setActiveTab] = useState<TabType>('indicators');
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(true);
  const [showBacktestModal, setShowBacktestModal] = useState(false);

  // Load strategy if initialId provided
  useEffect(() => {
    if (initialId && !currentStrategy) {
      loadStrategy(initialId).catch(console.error);
    }
  }, [initialId, currentStrategy, loadStrategy]);

  // Set strategy when loaded
  useEffect(() => {
    if (currentStrategy) {
      setStrategy(currentStrategy);
      setHasChanges(false);
    }
  }, [currentStrategy]);

  // Validate on strategy change
  useEffect(() => {
    const errors = validate(strategy);
    setValidationErrors(errors);
  }, [strategy, validate]);

  const handleStrategyChange = (updates: Partial<StrategyDSL>) => {
    setStrategy((prev) => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!isValid(strategy)) {
      alert('Cannot save: strategy has validation errors');
      return;
    }

    try {
      const id = await saveStrategy(strategy, 'Updated via form builder');
      setHasChanges(false);
      alert(`Strategy saved! ID: ${id}`);
    } catch (err) {
      alert(`Save failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleLoadTemplate = (templateKey: keyof typeof strategyTemplates) => {
    const template = strategyTemplates[templateKey];
    setStrategy(template);
    setHasChanges(true);
  };

  const handleNew = () => {
    setStrategy(defaultStrategy);
    setHasChanges(false);
  };

  const blockingErrors = validationErrors.filter((e) => e.severity === 'error');

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans pb-10">
      {/* Navbar */}
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <StrategyHeader
        strategy={strategy}
        onStrategyChange={handleStrategyChange}
        onSave={handleSave}
        onNew={handleNew}
        hasChanges={hasChanges}
        isSaving={isLoading}
        canSave={isValid(strategy)}
      />

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 px-4 py-3 mx-4 mt-4 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-4 p-4 max-w-7xl mx-auto">
        {/* Main Editor */}
        <div className="flex-1">
          {/* Tab Navigation */}
          <div className="bg-[#0a0a0a] border-b border-slate-700 mb-4 rounded-t-lg">
            <div className="flex gap-2 p-2">
              {['indicators', 'conditions', 'risk', 'execution', 'code'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as TabType)}
                  className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                    activeTab === tab
                      ? 'bg-[#7300BD]/10 text-[#7300BD] border-b-2 border-[#7300BD]'
                        : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="bg-[#0a0a0a] p-6 rounded-b-lg shadow-sm">
            {activeTab === 'indicators' && (
              <IndicatorsSection
                strategy={strategy}
                onStrategyChange={handleStrategyChange}
              />
            )}

            {activeTab === 'conditions' && (
              <ConditionsSection
                strategy={strategy}
                onStrategyChange={handleStrategyChange}
              />
            )}

            {activeTab === 'risk' && (
              <RiskSection
                strategy={strategy}
                onStrategyChange={handleStrategyChange}
              />
            )}

            {activeTab === 'execution' && (
              <ExecutionSection
                strategy={strategy}
                onStrategyChange={handleStrategyChange}
              />
            )}

            {activeTab === 'code' && (
              <CodeEditorSection
                strategy={strategy}
                onStrategyChange={handleStrategyChange}
              />
            )}
          </div>

          {/* Template Quick Access */}
          <div className="mt-4 bg-[#0a0a0a] p-4 rounded-lg shadow-sm">
            <h3 className="font-semibold mb-3">Quick Load Template</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {(Object.keys(strategyTemplates) as Array<keyof typeof strategyTemplates>).map(
                (key) => (
                  <button
                    key={key}
                    onClick={() => handleLoadTemplate(key)}
                    className="px-3 py-2 text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors"
                  >
                    {strategyTemplates[key].name}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Validation & Preview */}
        <div className="w-80">
          {/* Validation Panel */}
          <div className="bg-[#0a0a0a] rounded-lg shadow-sm mb-4 overflow-hidden">
            <div className="bg-slate-800 px-4 py-3 font-semibold border-b border-slate-700 text-slate-200">
              Validation ({validationErrors.length})
            </div>

            {validationErrors.length === 0 ? (
              <div className="p-4 text-[#7300BD] bg-[#7300BD]/10">✓ Strategy is valid</div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {validationErrors.map((error, idx) => (
                  <div
                    key={idx}
                    className={`border-b border-slate-200 p-3 last:border-b-0 ${
                      error.severity === 'error' ? 'bg-red-50' : 'bg-yellow-50'
                    }`}
                  >
                    <div
                      className={`text-xs font-semibold mb-1 ${
                        error.severity === 'error' ? 'text-red-700' : 'text-yellow-700'
                      }`}
                    >
                      {error.severity.toUpperCase()}: {error.field}
                    </div>
                    <p className="text-sm text-slate-700">{error.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Preview Toggle */}
          <div className="mb-4">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="w-full px-4 py-2 bg-[#7300BD]/10 text-[#7300BD] hover:bg-[#7300BD]/5 rounded-lg font-semibold transition-colors"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </button>
          </div>

          {/* Preview Panel */}
          {showPreview && <PreviewPanel strategy={strategy} />}

          {/* Info Panel */}
          <div className="bg-[#0a0a0a] rounded-lg shadow-sm p-4">
            <h3 className="font-semibold mb-2">Info</h3>
            <div className="text-sm space-y-1 text-slate-400">
              <div>
                <span className="font-medium">ID:</span>{' '}
                <code className="bg-slate-100 px-2 py-1 rounded text-xs">
                  {currentId ? currentId.slice(0, 12) : 'Not saved'}
                </code>
              </div>
              <div>
                <span className="font-medium">Version:</span> {strategy.version}
              </div>
              <div>
                <span className="font-medium">Indicators:</span> {strategy.indicators?.length || 0}
              </div>
              <div>
                <span className="font-medium">Status:</span>{' '}
                {blockingErrors.length > 0 ? (
                  <span className="text-red-600">Invalid</span>
                ) : (
                  <span className="text-[#7300BD]">Valid</span>
                )}
              </div>
            </div>
          </div>

          {/* Backtest Button */}
          <button
            onClick={() => setShowBacktestModal(true)}
            disabled={!isValid(strategy)}
            className={`w-full mt-4 py-2 rounded-lg font-semibold transition-colors ${
              isValid(strategy)
                ? 'bg-purple-500 hover:bg-purple-600 text-white'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            📊 Quick Backtest
          </button>
        </div>
      </div>

        {/* Backtest Modal */}
        <QuickBacktestModal
          isOpen={showBacktestModal}
          onClose={() => setShowBacktestModal(false)}
          strategy={strategy}
        />
      </main>
    </div>
  );
}
