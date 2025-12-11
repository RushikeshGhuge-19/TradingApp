# Strategy Builder - Integration Testing Guide

**Status**: 🚀 TESTING STARTED  
**Date**: December 11, 2025  
**Scope**: End-to-End Integration Across All 4 Phases

---

## Test Environment Setup

### Backend (Python/FastAPI)

#### 1. Install Dependencies
```bash
cd Backend\algo-backend
pip install -r requirements.txt
```

#### 2. Start Backend Server
```bash
python -m uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Verify Backend Ready:**
```bash
curl http://localhost:8000/api/v1/status
# Should return: {"status":"ok"}
```

---

### Frontend (React/Vite)

#### 1. Install Dependencies
```bash
cd Frontend
npm install
```

#### 2. Set Environment Variables
Create `.env.local`:
```bash
REACT_APP_API_URL=http://localhost:8000/api/v1
VITE_API_BASE=http://localhost:8000/api/v1
```

#### 3. Start Development Server
```bash
npm run dev
```

**Expected Output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

**Verify Frontend Ready:**
- Open http://localhost:5173 in browser
- Check browser console for errors

---

## Phase 1 Testing: DSL Infrastructure

### Test 1.1: Rule DSL Type System
**File**: `src/types/rule-dsl.ts`

```typescript
// ✓ Can import all types
import { StrategyDSL, LogicNode, Operand, RiskConfig } from '@/types/rule-dsl';

// ✓ Strategy object is valid JSON-serializable
const strategy: StrategyDSL = { /* ... */ };
const json = JSON.stringify(strategy);
const parsed = JSON.parse(json);
console.assert(parsed.name === strategy.name);
```

**Manual Check:**
- [ ] Type definitions compile without errors
- [ ] All interfaces properly defined
- [ ] Can create valid strategy objects

---

### Test 1.2: Indicator Registry
**File**: `src/services/indicatorRegistry.ts`

```typescript
import { precomputeIndicators } from '@/services/indicatorRegistry';

const bars = [
  { open: 100, high: 105, low: 95, close: 102, volume: 1000 },
  { open: 102, high: 108, low: 100, close: 105, volume: 1200 },
  // ... more bars
];

const indicators = [
  { id: "rsi14", type: "rsi", params: { period: 14 } }
];

const precomputed = precomputeIndicators(indicators, bars);
console.assert(precomputed.rsi14?.value?.length > 0);
```

**Test Cases:**
- [ ] RSI calculation correct
- [ ] EMA with indicator chaining works
- [ ] ATR calculation matches standard
- [ ] Bollinger Bands return upper/middle/lower
- [ ] MACD returns macd/signal/histogram
- [ ] Handles NaN in early bars

---

### Test 1.3: Strategy Validator
**File**: `src/services/strategyValidator.ts`

```typescript
import { validateStrategy } from '@/services/strategyValidator';

// Valid strategy - no errors
const valid = { /* complete strategy */ };
const errors1 = validateStrategy(valid);
console.assert(errors1.filter(e => e.severity === 'error').length === 0);

// Missing name - should error
const invalid = { indicators: [] };
const errors2 = validateStrategy(invalid);
console.assert(errors2.some(e => e.field === 'name'));

// Duplicate indicator ID - should error
const dup = { 
  indicators: [
    { id: "rsi", type: "rsi", params: { period: 14 } },
    { id: "rsi", type: "sma", params: { period: 20 } }
  ]
};
const errors3 = validateStrategy(dup);
console.assert(errors3.some(e => e.message.includes('Duplicate')));
```

**Test Cases:**
- [ ] Valid strategy passes validation
- [ ] Missing required fields caught
- [ ] Duplicate indicator IDs detected
- [ ] Parameter ranges validated
- [ ] Indicator references exist
- [ ] Time format validated (HH:mm)
- [ ] Risk configuration validated
- [ ] Execution configuration validated

---

### Test 1.4: Rule Compiler
**File**: `src/services/ruleCompiler.ts`

```typescript
import { RuleCompiler } from '@/services/ruleCompiler';

const strategy: StrategyDSL = { /* ... */ };
const compiler = new RuleCompiler();
const compiled = compiler.compile(strategy);

console.assert(typeof compiled.evaluate === 'function');
console.assert(compiled.meta.requiredLookback >= 0);
console.assert(Array.isArray(compiled.meta.indicatorIds));
```

**Evaluate Test:**
```typescript
const bars = [ /* historical data */ ];
const context = {
  barIndex: 50,
  bars,
  position: { direction: null },
  equity: 100000,
  indicatorValues: {}
};

const result = compiled.evaluate(50, bars, context);
console.assert(result.entrySignal === null || result.entrySignal === 'LONG' || result.entrySignal === 'SHORT');
```

**Test Cases:**
- [ ] Compiler accepts valid strategy
- [ ] Compiled function is callable
- [ ] Entry signal correct (null/LONG/SHORT)
- [ ] Exit signal boolean or null
- [ ] Handles edge cases (first bar, NaN values)
- [ ] AND logic works (all true = true)
- [ ] OR logic works (any true = true)
- [ ] Crossover detection works
- [ ] Time filter works

---

## Phase 2 Testing: Persistence & Storage

### Test 2.1: Strategy Store Save/Load
**File**: `src/services/strategyStore.ts`

```typescript
import { strategyStore } from '@/services/strategyStore';

// Save strategy
const dsl: StrategyDSL = { name: "Test Strategy", /* ... */ };
const metadata = strategyStore.saveStrategy(dsl);

console.assert(metadata.id !== undefined);
console.assert(metadata.version === 1);

// Load strategy
const loaded = strategyStore.loadStrategy(metadata.id);
console.assert(loaded?.name === dsl.name);
```

**Test Cases:**
- [ ] Save creates new strategy with ID
- [ ] Load retrieves saved strategy
- [ ] Version increments on save
- [ ] Timestamps set correctly
- [ ] Can load full metadata + changelog
- [ ] List strategies returns all
- [ ] Delete removes strategy

---

### Test 2.2: Strategy Store Search/Filter
```typescript
// Add multiple strategies with tags
strategyStore.saveStrategy(rsiStrategy, { tags: ["momentum"] });
strategyStore.saveStrategy(bbStrategy, { tags: ["mean-reversion"] });

// Search by name
const results = strategyStore.searchStrategies("RSI");
console.assert(results.length === 1);

// Search by tag
const byTag = strategyStore.searchStrategies("momentum", true);
console.assert(byTag.length >= 1);
```

**Test Cases:**
- [ ] Search by name works
- [ ] Search by tags works
- [ ] Case-insensitive search
- [ ] Returns correct results

---

### Test 2.3: Import/Export
```typescript
const id = strategyStore.saveStrategy(dsl);

// Export to JSON string
const json = strategyStore.exportStrategy(id);
console.assert(typeof json === 'string');

// Parse and verify
const exported = JSON.parse(json);
console.assert(exported.dsl.name === dsl.name);

// Import from JSON
strategyStore.clearAll();
const imported = strategyStore.importStrategy(json);
console.assert(imported.id === id);

// Verify loaded
const reloaded = strategyStore.loadStrategy(id);
console.assert(reloaded?.name === dsl.name);
```

**Test Cases:**
- [ ] Export creates valid JSON
- [ ] Import restores strategy
- [ ] Overwrite flag works
- [ ] Multiple imports handled
- [ ] Download file works (browser)

---

### Test 2.4: React Hook Integration
**File**: `src/hooks/useStrategyStore.ts`

```tsx
import { useStrategyStore } from '@/hooks/useStrategyStore';

function TestComponent() {
  const { strategies, saveStrategy, loadStrategy } = useStrategyStore();
  
  // Verify hook returns required functions
  console.assert(typeof saveStrategy === 'function');
  console.assert(typeof loadStrategy === 'function');
  console.assert(Array.isArray(strategies));
}
```

**Test Cases:**
- [ ] Hook returns all required methods
- [ ] Strategies list updates on save
- [ ] Error state handled
- [ ] Loading state managed
- [ ] Subscribe/unsubscribe works

---

## Phase 3 Testing: Form-Based Builder UI

### Test 3.1: Strategy Builder Form
**File**: `src/pages/StrategyBuilderForm.tsx`

**Manual UI Test:**
1. [ ] Navigate to builder page
2. [ ] All tabs visible (Indicators, Conditions, Risk, Execution, Code)
3. [ ] Add indicator works
4. [ ] Enter condition works
5. [ ] Set risk parameters works
6. [ ] Configure execution works
7. [ ] Save button works
8. [ ] Load strategy from dropdown works
9. [ ] New strategy button works
10. [ ] Validation errors display

---

### Test 3.2: Indicators Section
**File**: `src/components/IndicatorsSection.tsx`

```
Manual Test:
1. [ ] Dropdown shows all 8 indicator types
2. [ ] RSI parameters: period input
3. [ ] EMA parameters: period + source dropdown
4. [ ] Add button creates indicator
5. [ ] Remove button deletes indicator
6. [ ] Duplicate ID prevented
7. [ ] Indicator list updates in real-time
```

---

### Test 3.3: Conditions Section
**File**: `src/components/ConditionsSection.tsx`

```
Manual Test:
1. [ ] Three tabs: Entry, Entry Short, Exit
2. [ ] JSON editor opens
3. [ ] JSON validation works (red underline for invalid)
4. [ ] Apply Changes button syncs to form
5. [ ] Format button auto-formats JSON
6. [ ] Visual display shows rule structure
7. [ ] Examples help text visible
```

---

### Test 3.4: Risk Section
**File**: `src/components/RiskSection.tsx`

```
Manual Test:
1. [ ] Sizing mode selector works (4 modes)
2. [ ] Fixed lot input
3. [ ] Stop loss enable/disable
4. [ ] SL type dropdown (Points, Percent, ATR)
5. [ ] Take profit config
6. [ ] Trailing stop offset
7. [ ] Lock at TP toggle
8. [ ] Max positions limit
```

---

### Test 3.5: Execution Section
**File**: `src/components/ExecutionSection.tsx`

```
Manual Test:
1. [ ] Entry fill dropdown (CLOSE, NEXT_OPEN, MARKET)
2. [ ] Slippage points input
3. [ ] Charges mode toggle (Fixed, Components)
4. [ ] Fixed charge input
5. [ ] Component breakdowns (brokerage, exchange, STT, GST)
6. [ ] Contract multiplier input
7. [ ] Lot size input
```

---

### Test 3.6: Validation Panel
**File**: Component in sidebar

```
Manual Test:
1. [ ] Errors display in red
2. [ ] Warnings display in yellow
3. [ ] Updates in real-time
4. [ ] Shows field names
5. [ ] Error counts correct
```

---

## Phase 4 Testing: Backend Integration

### Test 4.1: Backend DSL Backtest Endpoint
**Endpoint**: `POST /api/v1/backtest/dsl`

```bash
# Test request
curl -X POST http://localhost:8000/api/v1/backtest/dsl \
  -H "Content-Type: application/json" \
  -d '{
    "strategy_dsl": {...},
    "compiled_strategy": {"requiredLookback": 50},
    "start_date": "2024-01-01",
    "end_date": "2024-12-31"
  }'
```

**Expected Response:**
```json
{
  "trades": [...],
  "equity_curve": [...],
  "summary": {
    "total_trades": 45,
    "winning_trades": 29,
    "losing_trades": 16,
    "win_rate": 0.6444,
    "profit_factor": 2.12,
    "total_pnl": 25000,
    "roi": 25.0
  }
}
```

**Test Cases:**
- [ ] Valid request returns 200
- [ ] Trades array populated
- [ ] Summary metrics correct
- [ ] Equity curve has entries
- [ ] Invalid dates handled (400)
- [ ] Missing strategy handled (400)

---

### Test 4.2: Frontend API Client
**File**: `src/services/backtestAPI.ts`

```typescript
import { runBacktest, formatBacktestSummary } from '@/services/backtestAPI';
import { RuleCompiler } from '@/services/ruleCompiler';

// Prepare strategy
const strategy = { /* valid DSL */ };
const compiler = new RuleCompiler();
const compiled = compiler.compile(strategy);

// Call API
const result = await runBacktest({
  strategy_dsl: strategy,
  compiled_strategy: compiled,
  start_date: '2024-01-01',
  end_date: '2024-12-31'
});

// Verify response
console.assert(result.trades?.length > 0);
console.assert(result.summary?.win_rate >= 0);

// Format for display
const formatted = formatBacktestSummary(result.summary);
console.assert(formatted.winRate.includes('%'));
```

**Test Cases:**
- [ ] API call succeeds
- [ ] Response structure correct
- [ ] Formatting works
- [ ] Error handling works
- [ ] CSV export works

---

### Test 4.3: Quick Backtest Modal
**File**: `src/components/QuickBacktestModal.tsx`

**Manual UI Test:**
1. [ ] Modal opens when button clicked
2. [ ] Date pickers work (default last 30 days)
3. [ ] Capital input editable
4. [ ] Run Backtest button fires API call
5. [ ] Loading spinner shows
6. [ ] Results display (3 tabs)
7. [ ] Summary tab shows metrics grid
8. [ ] Trades tab shows table
9. [ ] Equity tab placeholder visible
10. [ ] Export CSV button works
11. [ ] Close button works
12. [ ] Error messages display

---

### Test 4.4: Integration with Strategy Builder
**File**: `src/pages/StrategyBuilderForm.tsx`

**Manual Test:**
1. [ ] Quick Backtest button visible in sidebar
2. [ ] Button disabled if strategy invalid
3. [ ] Button enabled if strategy valid
4. [ ] Click opens modal
5. [ ] Modal closes properly
6. [ ] Results persist while modal open

---

## End-to-End Workflow Test

### Complete Flow: Create → Validate → Save → Backtest

```
Step 1: Create Strategy
├─ [ ] Navigate to builder
├─ [ ] Add RSI(14) indicator
├─ [ ] Add EMA(3) on RSI
├─ [ ] Set entry: RSI > 40
├─ [ ] Set exit: RSI < 50
├─ [ ] Configure SL: 50 points
├─ [ ] Configure TP: 100 points
├─ [ ] Set sizing: 30 lots
└─ [ ] All errors cleared

Step 2: Validate
├─ [ ] Validation panel shows 0 errors
├─ [ ] Preview panel updates
├─ [ ] Save button enabled
└─ [ ] All indicators visible in preview

Step 3: Save Strategy
├─ [ ] Click Save button
├─ [ ] Strategy ID appears in header
├─ [ ] Version shows as v1
├─ [ ] Can reload from dropdown
└─ [ ] localStorage contains strategy

Step 4: Run Backtest
├─ [ ] Click Quick Backtest button
├─ [ ] Modal opens
├─ [ ] Set date range (Jan 2024 - Dec 2024)
├─ [ ] Click Run Backtest
├─ [ ] API call fires (check network tab)
├─ [ ] Loading spinner shows
├─ [ ] Results appear in Summary tab
├─ [ ] Summary shows trades count, win rate, P&L
├─ [ ] Can view individual trades
└─ [ ] Can export CSV

Step 5: Verify Results
├─ [ ] Metrics make sense (positive/negative P&L)
├─ [ ] Trade count > 0
├─ [ ] Win rate 0-100%
├─ [ ] Profit factor > 0
├─ [ ] Charges deducted correctly
└─ [ ] Final equity updated
```

---

## Performance & Load Testing

### Backend Performance
```bash
# Test 1000 bars backtest
time curl -X POST http://localhost:8000/api/v1/backtest/dsl \
  -d '{"strategy_dsl":{...},"start_date":"2024-01-01","end_date":"2024-12-31"}'

# Expected: < 5 seconds
```

### Frontend Performance
```javascript
// Test compilation time
console.time('compile');
const compiled = ruleCompiler.compile(strategy);
console.timeEnd('compile');
// Expected: < 100ms

// Test rendering time
console.time('render');
ReactDOM.render(<StrategyBuilderForm />, container);
console.timeEnd('render');
// Expected: < 500ms
```

---

## Error Scenarios

### Backend Error Handling
- [ ] Invalid date format → 400 Bad Request
- [ ] Missing strategy DSL → 400 Bad Request
- [ ] Empty candle data → 400 Bad Request
- [ ] Network timeout → Error with retry
- [ ] Server error → 500 with message

### Frontend Error Handling
- [ ] Strategy validation fails → Error displayed
- [ ] API unreachable → Error with offline message
- [ ] Invalid JSON in code editor → Red underline
- [ ] Missing required fields → Cannot save
- [ ] Duplicate indicator IDs → Cannot save

---

## Browser Compatibility

Test on:
- [ ] Chrome 120+
- [ ] Firefox 121+
- [ ] Safari 17+
- [ ] Edge 120+

---

## Regression Testing Checklist

After each change, verify:
- [ ] Phase 1: All types compile, validator works, compiler runs
- [ ] Phase 2: Save/load/search/import/export work
- [ ] Phase 3: Form renders, all tabs work, validation displays
- [ ] Phase 4: Backtest API responds, results display correctly

---

## Test Automation (Future)

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e
```

---

## Known Issues & Workarounds

### Issue 1: CORS Errors
**Symptom**: "No 'Access-Control-Allow-Origin' header"  
**Fix**: Ensure backend CORS middleware enabled
```python
# Backend FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 2: localStorage Quota
**Symptom**: "QuotaExceededError"  
**Fix**: Clear browser storage or reduce strategy count

### Issue 3: stale data in modal
**Symptom**: Modal shows old results  
**Fix**: Click "Run Backtest" again to refresh

---

## Test Report Template

**Date**: ___________  
**Tester**: ___________  
**Environment**: Backend ✓ / Frontend ✓  

**Phase 1**: ✓ Pass / ✗ Fail  
**Phase 2**: ✓ Pass / ✗ Fail  
**Phase 3**: ✓ Pass / ✗ Fail  
**Phase 4**: ✓ Pass / ✗ Fail  

**Issues Found**:
1. 
2. 
3. 

**Notes**:

---

## Next Steps

1. Run all tests from this guide
2. Document any failures
3. Fix issues
4. Re-run regression tests
5. Mark Phase as Production-Ready

**Goal**: All 4 Phases passing by end of testing session ✅
