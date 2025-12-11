/**
 * Strategy Store: Persistence Layer
 * Handles save, load, version management, and JSON import/export
 * Uses localStorage as backend with optional file system support
 */

import { StrategyDSL } from '../types/rule-dsl';
import { validateStrategy, isValidStrategy } from './strategyValidator';
import { compileStrategy } from './ruleCompiler';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface StrategyMetadata {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  lastBacktestedAt?: string;
  backtest?: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
  };
  tags?: string[];
  description?: string;
  isTemplate?: boolean;
}

export interface StrategyChangeLog {
  timestamp: string;
  version: number;
  author?: string;
  description?: string;
  changes?: {
    field: string;
    oldValue?: unknown;
    newValue?: unknown;
  }[];
}

export interface StoredStrategy {
  metadata: StrategyMetadata;
  dsl: StrategyDSL;
  changelog: StrategyChangeLog[];
}

export interface StrategyStoreEvent {
  type: 'created' | 'updated' | 'deleted' | 'imported' | 'exported';
  strategyId: string;
  timestamp: string;
  data?: unknown;
}

export interface StoreOptions {
  autoValidate?: boolean;
  trackChanges?: boolean;
  maxVersions?: number;
}

// ============================================================================
// StrategyStore Class
// ============================================================================

export class StrategyStore {
  private readonly STORAGE_KEY_PREFIX = 'trading_strategy_';
  private readonly METADATA_KEY = 'trading_strategies_metadata';
  private options: Required<StoreOptions>;
  private listeners: ((event: StrategyStoreEvent) => void)[] = [];

  constructor(options: StoreOptions = {}) {
    this.options = {
      autoValidate: options.autoValidate ?? true,
      trackChanges: options.trackChanges ?? true,
      maxVersions: options.maxVersions ?? 10,
    };
  }

  // ========================================================================
  // Save / Create / Update
  // ========================================================================

  /**
   * Save a strategy (create if new, update if exists)
   */
  public saveStrategy(dsl: StrategyDSL, metadata?: Partial<StrategyMetadata>): StrategyMetadata {
    // Validate if auto-validation enabled
    if (this.options.autoValidate) {
      const errors = validateStrategy(dsl);
      const blockingErrors = errors.filter((e) => e.severity === 'error');
      if (blockingErrors.length > 0) {
        throw new Error(
          `Strategy validation failed:\n${blockingErrors.map((e) => `${e.field}: ${e.message}`).join('\n')}`
        );
      }
    }

    // Generate or reuse ID
    const id = metadata?.id || this.generateId();
    const now = new Date().toISOString();

    // Load existing or create new
    let stored = this.loadStoredStrategy(id);
    const isNew = !stored;

    if (isNew) {
      stored = {
        metadata: {
          id,
          name: dsl.name || `Strategy ${id.slice(0, 8)}`,
          version: 1,
          createdAt: now,
          updatedAt: now,
          ...metadata,
        },
        dsl,
        changelog: [
          {
            timestamp: now,
            version: 1,
            author: metadata?.description || 'system',
            description: 'Strategy created',
          },
        ],
      };
    } else {
      // Update existing
      const newVersion = stored.metadata.version + 1;

      if (this.options.trackChanges) {
        stored.changelog.push({
          timestamp: now,
          version: newVersion,
          author: 'user',
          description: metadata?.description || 'Strategy updated',
        });

        // Prune old versions if exceeds limit
        if (stored.changelog.length > this.options.maxVersions) {
          stored.changelog = stored.changelog.slice(-this.options.maxVersions);
        }
      }

      stored.metadata.version = newVersion;
      stored.metadata.updatedAt = now;
      if (metadata?.name) stored.metadata.name = metadata.name;
      if (metadata?.tags) stored.metadata.tags = metadata.tags;
      stored.dsl = dsl;
    }

    // Persist to localStorage
    this.saveStoredStrategy(stored);

    // Emit event
    this.emit({
      type: isNew ? 'created' : 'updated',
      strategyId: id,
      timestamp: now,
    });

    return stored.metadata;
  }

  /**
   * Create a new strategy from template
   */
  public createFromTemplate(template: StrategyDSL, name: string): StrategyMetadata {
    const dsl: StrategyDSL = {
      ...template,
      name,
    };
    return this.saveStrategy(dsl, { description: `Created from template: ${template.name}` });
  }

  // ========================================================================
  // Load / Retrieve
  // ========================================================================

  /**
   * Load a strategy by ID
   */
  public loadStrategy(id: string): StrategyDSL | null {
    const stored = this.loadStoredStrategy(id);
    return stored?.dsl ?? null;
  }

  /**
   * Load strategy with full metadata and changelog
   */
  public loadStrategyFull(id: string): StoredStrategy | null {
    return this.loadStoredStrategy(id);
  }

  /**
   * List all strategies metadata
   */
  public listStrategies(): StrategyMetadata[] {
    const ids = this.getAllStrategyIds();
    return ids
      .map((id) => this.loadStoredStrategy(id)?.metadata)
      .filter((m): m is StrategyMetadata => m !== undefined);
  }

  /**
   * Search strategies by name or tags
   */
  public searchStrategies(query: string, byTags = false): StrategyMetadata[] {
    const strategies = this.listStrategies();
    const lowerQuery = query.toLowerCase();

    if (byTags) {
      return strategies.filter((s) => s.tags?.some((tag) => tag.toLowerCase().includes(lowerQuery)));
    }

    return strategies.filter((s) => s.name.toLowerCase().includes(lowerQuery));
  }

  /**
   * Get strategy changelog
   */
  public getChangelog(id: string): StrategyChangeLog[] {
    return this.loadStoredStrategy(id)?.changelog ?? [];
  }

  /**
   * Get specific version of strategy
   */
  public loadVersion(id: string, version: number): StrategyDSL | null {
    const stored = this.loadStoredStrategy(id);
    if (!stored || stored.metadata.version < version) return null;

    // In current implementation, we only store latest version in DSL
    // Full version history would require additional storage
    // For now, return latest if version matches
    return stored.metadata.version === version ? stored.dsl : null;
  }

  // ========================================================================
  // Delete / Archive
  // ========================================================================

  /**
   * Delete a strategy permanently
   */
  public deleteStrategy(id: string): boolean {
    const key = this.getStorageKey(id);
    const exists = localStorage.getItem(key) !== null;

    if (exists) {
      localStorage.removeItem(key);
      this.removeFromMetadataIndex(id);

      this.emit({
        type: 'deleted',
        strategyId: id,
        timestamp: new Date().toISOString(),
      });
    }

    return exists;
  }

  /**
   * Clear all strategies
   */
  public clearAll(): void {
    const ids = this.getAllStrategyIds();
    ids.forEach((id) => this.deleteStrategy(id));
  }

  // ========================================================================
  // Import / Export
  // ========================================================================

  /**
   * Export strategy as JSON string
   */
  public exportStrategy(id: string): string | null {
    const stored = this.loadStoredStrategy(id);
    if (!stored) return null;

    return JSON.stringify(stored, null, 2);
  }

  /**
   * Export multiple strategies as JSON
   */
  public exportStrategies(ids: string[]): string {
    const strategies = ids
      .map((id) => this.loadStoredStrategy(id))
      .filter((s): s is StoredStrategy => s !== undefined);

    return JSON.stringify(strategies, null, 2);
  }

  /**
   * Export all strategies
   */
  public exportAll(): string {
    const ids = this.getAllStrategyIds();
    return this.exportStrategies(ids);
  }

  /**
   * Import strategy from JSON string
   */
  public importStrategy(jsonString: string, overwrite = false): StrategyMetadata {
    try {
      const imported = JSON.parse(jsonString) as StoredStrategy;

      // Validate structure
      if (!imported.metadata || !imported.dsl) {
        throw new Error('Invalid strategy format: missing metadata or dsl');
      }

      const { id } = imported.metadata;

      // Check if exists
      if (!overwrite && this.getAllStrategyIds().includes(id)) {
        throw new Error(`Strategy with ID ${id} already exists. Use overwrite=true to replace.`);
      }

      // Save with new timestamp
      const now = new Date().toISOString();
      imported.metadata.updatedAt = now;
      if (!imported.metadata.createdAt) {
        imported.metadata.createdAt = now;
      }

      this.saveStoredStrategy(imported);

      this.emit({
        type: 'imported',
        strategyId: id,
        timestamp: now,
      });

      return imported.metadata;
    } catch (error) {
      throw new Error(`Failed to import strategy: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Import multiple strategies from JSON
   */
  public importStrategies(jsonString: string, overwrite = false): StrategyMetadata[] {
    try {
      const imported = JSON.parse(jsonString) as StoredStrategy[];

      if (!Array.isArray(imported)) {
        throw new Error('Expected array of strategies');
      }

      return imported.map((strategy) => {
        const json = JSON.stringify(strategy);
        return this.importStrategy(json, overwrite);
      });
    } catch (error) {
      throw new Error(
        `Failed to import strategies: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Export strategy as downloadable file (browser only)
   */
  public downloadStrategy(id: string, filename?: string): boolean {
    const json = this.exportStrategy(id);
    if (!json) return false;

    const stored = this.loadStoredStrategy(id);
    const name = filename || `${stored?.metadata.name || 'strategy'}_v${stored?.metadata.version}.json`;

    try {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      this.emit({
        type: 'exported',
        strategyId: id,
        timestamp: new Date().toISOString(),
      });

      return true;
    } catch {
      return false;
    }
  }

  // ========================================================================
  // Validation & Compilation
  // ========================================================================

  /**
   * Validate a strategy
   */
  public validate(dsl: StrategyDSL) {
    return validateStrategy(dsl);
  }

  /**
   * Check if strategy is valid
   */
  public isValid(dsl: StrategyDSL): boolean {
    return isValidStrategy(dsl);
  }

  /**
   * Compile strategy to executable form
   */
  public compile(dsl: StrategyDSL) {
    return compileStrategy(dsl);
  }

  // ========================================================================
  // Backtest Result Tracking
  // ========================================================================

  /**
   * Update backtest results for a strategy
   */
  public updateBacktestResults(id: string, results: {
    totalTrades: number;
    winRate: number;
    profitFactor: number;
    maxDrawdown: number;
  }): boolean {
    const stored = this.loadStoredStrategy(id);
    if (!stored) return false;

    stored.metadata.lastBacktestedAt = new Date().toISOString();
    stored.metadata.backtest = results;

    this.saveStoredStrategy(stored);
    return true;
  }

  // ========================================================================
  // Event Listeners
  // ========================================================================

  /**
   * Subscribe to store events
   */
  public subscribe(listener: (event: StrategyStoreEvent) => void): () => void {
    this.listeners.push(listener);

    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private emit(event: StrategyStoreEvent): void {
    this.listeners.forEach((listener) => listener(event));
  }

  // ========================================================================
  // Private Helpers
  // ========================================================================

  private getStorageKey(id: string): string {
    return `${this.STORAGE_KEY_PREFIX}${id}`;
  }

  private generateId(): string {
    return `strat_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  }

  private loadStoredStrategy(id: string): StoredStrategy | null {
    const key = this.getStorageKey(id);
    const json = localStorage.getItem(key);
    if (!json) return null;

    try {
      return JSON.parse(json) as StoredStrategy;
    } catch {
      console.error(`Failed to parse strategy ${id}`);
      return null;
    }
  }

  private saveStoredStrategy(stored: StoredStrategy): void {
    const key = this.getStorageKey(stored.metadata.id);
    localStorage.setItem(key, JSON.stringify(stored));
    this.addToMetadataIndex(stored.metadata.id);
  }

  private getAllStrategyIds(): string[] {
    const json = localStorage.getItem(this.METADATA_KEY);
    if (!json) return [];

    try {
      return JSON.parse(json) as string[];
    } catch {
      return [];
    }
  }

  private addToMetadataIndex(id: string): void {
    const ids = this.getAllStrategyIds();
    if (!ids.includes(id)) {
      ids.push(id);
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(ids));
    }
  }

  private removeFromMetadataIndex(id: string): void {
    const ids = this.getAllStrategyIds();
    const filtered = ids.filter((i) => i !== id);
    if (filtered.length === 0) {
      localStorage.removeItem(this.METADATA_KEY);
    } else {
      localStorage.setItem(this.METADATA_KEY, JSON.stringify(filtered));
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const strategyStore = new StrategyStore({
  autoValidate: true,
  trackChanges: true,
  maxVersions: 10,
});

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Quick save helper
 */
export function quickSaveStrategy(dsl: StrategyDSL): StrategyMetadata {
  return strategyStore.saveStrategy(dsl);
}

/**
 * Quick load helper
 */
export function quickLoadStrategy(id: string): StrategyDSL | null {
  return strategyStore.loadStrategy(id);
}

/**
 * Export to file
 */
export function exportStrategyFile(id: string): void {
  strategyStore.downloadStrategy(id);
}

/**
 * Create from template
 */
export function createStrategyFromTemplate(template: StrategyDSL, name: string): StrategyMetadata {
  return strategyStore.createFromTemplate(template, name);
}
