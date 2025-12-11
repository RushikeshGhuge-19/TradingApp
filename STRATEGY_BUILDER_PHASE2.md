# Strategy Builder - Phase 2: Persistence & Storage

**Status**: ✅ COMPLETE  
**Date**: December 11, 2025  
**Deliverables**: 2 new modules (strategyStore.ts, useStrategyStore.ts)

---

## Overview

Phase 2 completes the backend persistence layer for the Strategy Builder. After Phase 1 built the DSL type system, indicators, validator, and compiler, Phase 2 adds:

1. **strategyStore.ts** - Backend storage abstraction (600+ lines)
2. **useStrategyStore.ts** - React hook for easy component integration (500+ lines)

### What This Enables

- ✅ Save strategies to localStorage with versioning
- ✅ Load/list/search strategies
- ✅ Import/export JSON (save to files, load from files)
- ✅ Version history with changelog tracking
- ✅ Backtest result persistence
- ✅ Tag-based organization
- ✅ Event-based reactive updates

---

## Architecture

### Storage Model

```
StoredStrategy {
  metadata: {
    id: string                    // Unique identifier
    name: string                  // Strategy name
    version: number               // Auto-incrementing version
    createdAt: ISO8601            // Creation timestamp
    updatedAt: ISO8601            // Last update timestamp
    lastBacktestedAt?: ISO8601
    backtest?: {
      totalTrades: number
      winRate: number
      profitFactor: number
      maxDrawdown: number
    }
    tags?: string[]               // For organization
    description?: string
    isTemplate?: boolean
  }
  dsl: StrategyDSL                // Complete strategy (from Phase 1)
  changelog: StrategyChangeLog[]  // Version history
}
```

### Storage Backend

- **Primary**: `localStorage` (browser storage, no server needed)
- **Key Format**: `trading_strategy_{id}` + metadata index
- **Persistence**: Survives page reload, lost on browser clear
- **Capacity**: ~5-10MB (varies by browser)

### Singleton Pattern

```typescript
import { strategyStore } from './services/strategyStore';

// Use directly or create custom instances
const store = strategyStore;
const store2 = new StrategyStore({ autoValidate: true });
```

---

## Module 1: strategyStore.ts (600+ lines)

### Core Class: `StrategyStore`

#### Constructor Options

```typescript
interface StoreOptions {
  autoValidate?: boolean;      // Validate on save (default: true)
  trackChanges?: boolean;      // Track changelog (default: true)
  maxVersions?: number;        // Keep last N versions (default: 10)
}
```

#### Primary Methods

**Save/Create/Update:**

```typescript
// Save strategy (create if new, update if exists)
const metadata = strategyStore.saveStrategy(dsl, {
  description: "Updated entry condition"
});
// Returns: StrategyMetadata with id, version, timestamps

// Create from template
const metadata = strategyStore.createFromTemplate(template, "My Strategy");
```

**Load/Retrieve:**

```typescript
// Load DSL only
const dsl = strategyStore.loadStrategy(id);

// Load full metadata + changelog
const full = strategyStore.loadStrategyFull(id);

// List all strategies
const all = strategyStore.listStrategies();

// Search by name
const results = strategyStore.searchStrategies("RSI");

// Search by tags
const byTag = strategyStore.searchStrategies("momentum", true);

// Get changelog
const log = strategyStore.getChangelog(id);

// Load specific version (returns latest if available)
const v5 = strategyStore.loadVersion(id, 5);
```

**Delete/Archive:**

```typescript
// Delete strategy
const deleted = strategyStore.deleteStrategy(id);

// Clear all strategies
strategyStore.clearAll();
```

**Import/Export:**

```typescript
// Export to JSON string
const json = strategyStore.exportStrategy(id);
const allJson = strategyStore.exportAll();

// Import from JSON string
const metadata = strategyStore.importStrategy(json, overwrite = false);

// Import multiple
const imported = strategyStore.importStrategies(json, overwrite = false);

// Download as browser file (browser only)
strategyStore.downloadStrategy(id, "my-strategy.json");
```

**Validation & Compilation:**

```typescript
// Validate DSL (returns ValidationError[] or [])
const errors = strategyStore.validate(dsl);

// Check if valid (returns boolean)
const valid = strategyStore.isValid(dsl);

// Compile to executable (returns CompiledStrategy)
const compiled = strategyStore.compile(dsl);
```

**Backtest Results:**

```typescript
// Update backtest metrics
strategyStore.updateBacktestResults(id, {
  totalTrades: 45,
  winRate: 0.64,
  profitFactor: 2.1,
  maxDrawdown: 0.12
});
```

**Event Subscription:**

```typescript
// Subscribe to events
const unsubscribe = strategyStore.subscribe((event) => {
  console.log(event.type, event.strategyId);
  // Types: 'created', 'updated', 'deleted', 'imported', 'exported'
});

// Unsubscribe
unsubscribe();
```

#### Helper Functions (Quick Access)

```typescript
import {
  quickSaveStrategy,
  quickLoadStrategy,
  exportStrategyFile,
  createStrategyFromTemplate,
} from './services/strategyStore';

// Save and get ID
const id = quickSaveStrategy(dsl);

// Load from ID
const dsl = quickLoadStrategy(id);

// Export to browser download
exportStrategyFile(id);

// Create from template
const id = createStrategyFromTemplate(templateDsl, "My Variant");
```

---

## Module 2: useStrategyStore.ts (500+ lines)

### React Hook: `useStrategyStore()`

Provides reactive state management for strategy store operations in React components.

#### Hook Return Type

```typescript
interface UseStrategyStoreReturn {
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

  // Validation & Compilation
  validate: (dsl: StrategyDSL) => any;
  isValid: (dsl: StrategyDSL) => boolean;
  compile: (dsl: StrategyDSL) => any;

  // Utilities
  clearError: () => void;
  createFromTemplate: (template: StrategyDSL, name: string) => Promise<string>;
}
```

#### Usage Examples

**Basic Usage:**

```typescript
import { useStrategyStore } from './hooks/useStrategyStore';

export function StrategyManager() {
  const { strategies, currentStrategy, isLoading, error } = useStrategyStore();

  return (
    <div>
      <h2>Strategies ({strategies.length})</h2>
      {error && <div className="error">{error}</div>}
      {isLoading && <div>Loading...</div>}
      <ul>
        {strategies.map((s) => (
          <li key={s.id}>{s.name} (v{s.version})</li>
        ))}
      </ul>
    </div>
  );
}
```

**Load Strategy:**

```typescript
export function StrategySelector() {
  const { strategies, currentId, loadStrategy } = useStrategyStore();

  return (
    <select value={currentId || ''} onChange={(e) => loadStrategy(e.target.value)}>
      <option value="">Select strategy...</option>
      {strategies.map((s) => (
        <option key={s.id} value={s.id}>
          {s.name}
        </option>
      ))}
    </select>
  );
}
```

**Save Strategy:**

```typescript
export function StrategyForm() {
  const { currentStrategy, saveStrategy, error } = useStrategyStore();
  const [dsl, setDsl] = useState<StrategyDSL>(currentStrategy || defaultDsl);

  const handleSave = async () => {
    try {
      const id = await saveStrategy(dsl, "Updated conditions");
      console.log(`Saved as ${id}`);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleSave} disabled={!isValid(dsl)}>
        Save Strategy
      </button>
    </div>
  );
}
```

**Import/Export:**

```typescript
export function ImportExport() {
  const { exportJson, importJson, downloadFile } = useStrategyStore();

  const handleExport = async () => {
    const json = exportJson();
    if (json) console.log(json);
  };

  const handleImport = async (file: File) => {
    const json = await file.text();
    const ids = await importJson(json);
    console.log(`Imported: ${ids}`);
  };

  const handleDownload = (id: string) => {
    downloadFile(id);
  };

  return (
    <div>
      <button onClick={handleExport}>Export as JSON</button>
      <button onClick={() => handleDownload(id)}>Download File</button>
      <input
        type="file"
        accept=".json"
        onChange={(e) => e.target.files?.[0] && handleImport(e.target.files[0])}
      />
    </div>
  );
}
```

**Search & Filter:**

```typescript
export function StrategySearch() {
  const { search, getMetadata } = useStrategyStore();
  const [query, setQuery] = useState('');

  const results = search(query);

  return (
    <div>
      <input
        type="text"
        placeholder="Search strategies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <ul>
        {results.map((m) => (
          <li key={m.id}>
            {m.name} - {m.version > 1 ? `v${m.version}` : 'v1'}
            {m.backtest && ` (WinRate: ${(m.backtest.winRate * 100).toFixed(0)}%)`}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

**Changelog:**

```typescript
export function StrategyHistory() {
  const { currentId, getChangelog } = useStrategyStore();

  const changelog = currentId ? getChangelog(currentId) : [];

  return (
    <div>
      <h3>Version History</h3>
      {changelog.map((log) => (
        <div key={log.timestamp}>
          <strong>v{log.version}</strong> - {new Date(log.timestamp).toLocaleDateString()}
          <p>{log.description}</p>
        </div>
      ))}
    </div>
  );
}
```

---

## Data Flow

```
Component
    ↓
useStrategyStore Hook (React state management)
    ↓
StrategyStore Instance (localStorage abstraction)
    ↓
localStorage API (browser persistence)
    ↓
DSL ← → Validator, Compiler (from Phase 1)
```

### Event Flow

```
saveStrategy()
    ↓
✓ Validate DSL (if autoValidate enabled)
    ↓
✓ Create StoredStrategy with metadata
    ↓
✓ Update changelog
    ↓
✓ Save to localStorage
    ↓
✓ Emit 'updated' event
    ↓
Hook re-renders with new list
```

---

## Implementation Checklist for Phase 3

When building the form-based UI (Phase 3), integrate using:

```typescript
// 1. Import hook
import useStrategyStore from './hooks/useStrategyStore';

// 2. Use in component
const { 
  strategies, 
  currentStrategy, 
  saveStrategy, 
  loadStrategy 
} = useStrategyStore();

// 3. Bind to forms
<button onClick={() => saveStrategy(formData)}>Save</button>
<select onChange={(e) => loadStrategy(e.target.value)}>
  {strategies.map(s => <option>{s.name}</option>)}
</select>

// 4. Watch for errors
{error && <ErrorAlert message={error} />}

// 5. Track loading
{isLoading && <Spinner />}
```

---

## Migration from Phase 1

### From Direct Store Usage

**Before (Phase 1):**
```typescript
// No persistence, DSL only in memory
const compiled = compileStrategy(dsl);
```

**After (Phase 2):**
```typescript
// With persistence
import { strategyStore } from './services/strategyStore';

const metadata = strategyStore.saveStrategy(dsl);
const loaded = strategyStore.loadStrategy(metadata.id);
```

### From localStorage Direct Access

**Before:**
```typescript
// Manual localStorage handling
localStorage.setItem('strategy', JSON.stringify(dsl));
```

**After (Better):**
```typescript
// Automatic versioning + validation
strategyStore.saveStrategy(dsl, { description: "Updated" });
```

---

## Storage Quotas

- **Chrome**: ~10MB per origin
- **Firefox**: ~10MB per origin  
- **Safari**: ~5MB per origin

**Estimate**: ~100KB per strategy (depends on indicator complexity)  
**Practical Limit**: 50-100 strategies per browser

**Future**: Add server-side persistence (Phase 4+)

---

## Error Handling

All methods handle errors gracefully:

```typescript
try {
  await saveStrategy(dsl);
} catch (error) {
  // ValidationError if DSL invalid
  // Error if localStorage quota exceeded
  // Error if JSON parse fails on load
}
```

Hook provides `error` state:

```typescript
const { error, clearError } = useStrategyStore();

{error && <div className="error">{error}</div>}
<button onClick={clearError}>Dismiss</button>
```

---

## Performance Notes

- **List strategies**: O(n) where n = total strategies
- **Save strategy**: O(1) localStorage write
- **Search**: O(n) in-memory filter
- **Import large JSON**: Handles multiple strategies efficiently

---

## Next Steps (Phase 3)

1. Create React components:
   - `StrategyBuilderForm.tsx` - Form UI with collapsible sections
   - `StrategyList.tsx` - List with search/delete
   - `StrategySelector.tsx` - Dropdown/modal to load

2. Connect form ↔ DSL bidirectional binding

3. Add visual builders for conditions (LogicNode UI)

4. Live preview of rule descriptions

---

## Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `src/services/strategyStore.ts` | 600+ | Main storage abstraction |
| `src/hooks/useStrategyStore.ts` | 500+ | React integration hook |

**Import Paths:**
```typescript
import { strategyStore, StrategyStore } from '@/services/strategyStore';
import useStrategyStore from '@/hooks/useStrategyStore';
```

**Dependencies:**
- React (for hook)
- localStorage (browser API)
- Phase 1 modules: rule-dsl, validator, compiler

---

## Summary

Phase 2 adds a complete persistence layer:
- ✅ Save strategies with auto-versioning
- ✅ Load/search strategies
- ✅ Import/export JSON
- ✅ Event-based reactivity
- ✅ React hook integration
- ✅ Backtest result tracking
- ✅ Tag-based organization

Ready for Phase 3 UI implementation!
