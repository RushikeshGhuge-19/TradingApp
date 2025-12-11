/**
 * useStrategyStore Hook: React Integration
 * Simplifies strategy store access in React components
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { StrategyDSL } from '../types/rule-dsl';
import {
  strategyStore,
  StrategyMetadata,
  StoredStrategy,
  StrategyChangeLog,
  StrategyStoreEvent,
} from '../services/strategyStore';

export interface UseStrategyStoreReturn {
  // State
  strategies: StrategyMetadata[];
  currentStrategy: StrategyDSL | null;
  currentId: string | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  loadStrategy: (id: string) => Promise<void>;
  saveStrategy: (dsl: StrategyDSL, description?: string) => Promise<string>;
  createNew: (dsl: StrategyDSL, name: string) => Promise<string>;
  deleteStrategy: (id: string) => Promise<boolean>;
  listAll: () => StrategyMetadata[];
  search: (query: string, byTags?: boolean) => StrategyMetadata[];

  // Import/Export
  exportJson: (id?: string) => string | null;
  importJson: (json: string, overwrite?: boolean) => Promise<string[]>;
  downloadFile: (id: string) => void;

  // Metadata
  getMetadata: (id: string) => StrategyMetadata | undefined;
  getChangelog: (id: string) => StrategyChangeLog[];
  updateBacktest: (id: string, results: any) => boolean;

  // Validation
  validate: (dsl: StrategyDSL) => any;
  isValid: (dsl: StrategyDSL) => boolean;

  // Compilation
  compile: (dsl: StrategyDSL) => any;

  // Utilities
  clearError: () => void;
  createFromTemplate: (template: StrategyDSL, name: string) => Promise<string>;
}

export function useStrategyStore(): UseStrategyStoreReturn {
  const [strategies, setStrategies] = useState<StrategyMetadata[]>([]);
  const [currentStrategy, setCurrentStrategy] = useState<StrategyDSL | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialize and subscribe to events
  useEffect(() => {
    refreshStrategies();

    // Subscribe to store events
    unsubscribeRef.current = strategyStore.subscribe((event: StrategyStoreEvent) => {
      if (event.type === 'created' || event.type === 'updated' || event.type === 'deleted') {
        refreshStrategies();
      }
    });

    return () => {
      unsubscribeRef.current?.();
    };
  }, []);

  const refreshStrategies = useCallback(() => {
    try {
      const list = strategyStore.listStrategies();
      setStrategies(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh strategies');
    }
  }, []);

  const loadStrategy = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const dsl = strategyStore.loadStrategy(id);
      if (!dsl) {
        throw new Error(`Strategy ${id} not found`);
      }

      setCurrentStrategy(dsl);
      setCurrentId(id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load strategy';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveStrategy = useCallback(
    async (dsl: StrategyDSL, description?: string): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const metadata = strategyStore.saveStrategy(dsl, { description });
        setCurrentStrategy(dsl);
        setCurrentId(metadata.id);
        refreshStrategies();
        return metadata.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to save strategy';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshStrategies]
  );

  const createNew = useCallback(
    async (dsl: StrategyDSL, name: string): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const dslWithName = { ...dsl, name };
        const metadata = strategyStore.saveStrategy(dslWithName);
        setCurrentStrategy(dslWithName);
        setCurrentId(metadata.id);
        refreshStrategies();
        return metadata.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create strategy';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshStrategies]
  );

  const deleteStrategy = useCallback(
    async (id: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        const deleted = strategyStore.deleteStrategy(id);

        if (deleted && currentId === id) {
          setCurrentStrategy(null);
          setCurrentId(null);
        }

        refreshStrategies();
        return deleted;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to delete strategy';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [currentId, refreshStrategies]
  );

  const listAll = useCallback((): StrategyMetadata[] => {
    return strategyStore.listStrategies();
  }, []);

  const search = useCallback((query: string, byTags = false): StrategyMetadata[] => {
    return strategyStore.searchStrategies(query, byTags);
  }, []);

  const exportJson = useCallback((id?: string): string | null => {
    const exportId = id || currentId;
    if (!exportId) return null;

    try {
      return strategyStore.exportStrategy(exportId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export');
      return null;
    }
  }, [currentId]);

  const importJson = useCallback(
    async (json: string, overwrite = false): Promise<string[]> => {
      setIsLoading(true);
      setError(null);

      try {
        const metadata = strategyStore.importStrategies(json, overwrite);
        refreshStrategies();
        return metadata.map((m) => m.id);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to import';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshStrategies]
  );

  const downloadFile = useCallback((id: string): void => {
    try {
      strategyStore.downloadStrategy(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download');
    }
  }, []);

  const getMetadata = useCallback(
    (id: string): StrategyMetadata | undefined => {
      return strategies.find((s) => s.id === id);
    },
    [strategies]
  );

  const getChangelog = useCallback((id: string): StrategyChangeLog[] => {
    return strategyStore.getChangelog(id);
  }, []);

  const updateBacktest = useCallback(
    (id: string, results: any): boolean => {
      try {
        return strategyStore.updateBacktestResults(id, results);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to update backtest results');
        return false;
      }
    },
    []
  );

  const validate = useCallback((dsl: StrategyDSL) => {
    return strategyStore.validate(dsl);
  }, []);

  const isValid = useCallback((dsl: StrategyDSL): boolean => {
    return strategyStore.isValid(dsl);
  }, []);

  const compile = useCallback((dsl: StrategyDSL) => {
    return strategyStore.compile(dsl);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const createFromTemplate = useCallback(
    async (template: StrategyDSL, name: string): Promise<string> => {
      setIsLoading(true);
      setError(null);

      try {
        const metadata = strategyStore.createFromTemplate(template, name);
        refreshStrategies();
        return metadata.id;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to create from template';
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [refreshStrategies]
  );

  return {
    // State
    strategies,
    currentStrategy,
    currentId,
    isLoading,
    error,

    // Actions
    loadStrategy,
    saveStrategy,
    createNew,
    deleteStrategy,
    listAll,
    search,

    // Import/Export
    exportJson,
    importJson,
    downloadFile,

    // Metadata
    getMetadata,
    getChangelog,
    updateBacktest,

    // Validation
    validate,
    isValid,

    // Compilation
    compile,

    // Utilities
    clearError,
    createFromTemplate,
  };
}

// ============================================================================
// Export Hook
// ============================================================================

export default useStrategyStore;
