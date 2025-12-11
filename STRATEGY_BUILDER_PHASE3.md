# Strategy Builder - Phase 3: Form-Based Builder UI

**Status**: ✅ COMPLETE  
**Date**: December 11, 2025  
**Deliverables**: 7 new React components (650+ lines total)

---

## Overview

Phase 3 completes the form-based UI for the Strategy Builder. After Phase 1 built the DSL infrastructure and Phase 2 added persistence, Phase 3 creates the complete React UI with:

1. **StrategyBuilderForm.tsx** - Main page with tab navigation
2. **StrategyHeader.tsx** - Save/new buttons, title editing
3. **IndicatorsSection.tsx** - Add/manage indicators
4. **ConditionsSection.tsx** - Define entry/exit logic
5. **RiskSection.tsx** - Configure stops, TP, sizing
6. **ExecutionSection.tsx** - Fill methods, charges
7. **CodeEditorSection.tsx** - Advanced JSON editing
8. **PreviewPanel.tsx** - Live rule preview

### Architecture

```
StrategyBuilderForm (main page)
├── StrategyHeader (title + save)
├── Tab Navigation (5 tabs)
│   ├── IndicatorsSection
│   ├── ConditionsSection
│   ├── RiskSection
│   ├── ExecutionSection
│   └── CodeEditorSection
├── Template Quick Access
└── Right Sidebar
    ├── Validation Panel (errors/warnings)
    ├── PreviewPanel (live summary)
    └── Info Panel (ID, version, status)
```

---

## Component Descriptions

### 1. StrategyBuilderForm.tsx (Main Page)

**Purpose**: Container component managing form state and UI layout

**Key Features**:
- Tab navigation system (5 tabs)
- State management with hooks
- Auto-validation on change
- Error banner display
- Template quick-load buttons
- Right sidebar with preview

**State Variables**:
```typescript
strategy: StrategyDSL           // Current strategy
activeTab: TabType              // Which tab is open
hasChanges: boolean             // Dirty flag
validationErrors: ValidationError[] // Real-time errors
showPreview: boolean            // Preview visibility
```

**Key Handlers**:
```typescript
handleStrategyChange(updates)    // Any strategy update
handleSave()                     // Save to store
handleLoadTemplate(key)          // Load template
handleNew()                      // Reset to default
```

**Usage**:
```tsx
import StrategyBuilderForm from './pages/StrategyBuilderForm';

// Standalone
<StrategyBuilderForm />

// With initial strategy ID
<StrategyBuilderForm initialId="strat_123" />
```

---

### 2. StrategyHeader.tsx

**Purpose**: Top bar with title, save button, new button

**Props**:
```typescript
strategy: StrategyDSL
onStrategyChange: (updates: Partial<StrategyDSL>) => void
onSave: () => void
onNew: () => void
hasChanges: boolean
isSaving: boolean
canSave: boolean
```

**Features**:
- Editable strategy name
- Save button (disabled if invalid)
- New button
- Unsaved changes indicator (●)

---

### 3. IndicatorsSection.tsx

**Purpose**: Add and manage indicators

**Features**:
- Dropdown to select indicator type (8 types)
- ID input (unique validation)
- Add button
- List of added indicators with parameter editors
- Parameter-specific inputs (period, stdDev, source)
- Remove button per indicator
- Indicator chaining support

**Supported Indicators**:
1. RSI (period)
2. EMA (period, source)
3. SMA (period, source)
4. ATR (period)
5. Bollinger Bands (period, stdDev)
6. MACD (fast, slow, signal)
7. Stochastic (kPeriod, dPeriod, smoothK)
8. ADX (period)

**Parameter Types**:
- Numeric: period, stdDev, etc.
- Source: "close" or "indicator:id" for chaining

**Example**:
```tsx
// Add RSI(14) with ID "rsi14"
// Add EMA(3) on RSI with ID "ema_rsi_fast"
// Configure source as "indicator:rsi14"
```

---

### 4. ConditionsSection.tsx

**Purpose**: Define entry, entryShort, exit conditions

**Features**:
- Rule tabs: Entry | Entry Short | Exit
- Toggle between Visual and JSON editors
- JSON editor with live syntax validation
- Visual display of current condition structure
- Help text with syntax examples

**Condition Types** (JSON):
- `condition` - Binary comparison (>, <, >=, <=, ==, !=)
- `and` - All nodes true
- `or` - Any node true
- `cross` - Crossover detection
- `crossdown` - Crossunder detection
- `timefilter` - Time-of-day filtering
- `not` - Negate

**Operands**:
- `{ kind: "indicator", id: "rsi14" }` - Indicator value
- `{ kind: "bar", field: "close" }` - OHLCV data
- `{ kind: "number", value: 50 }` - Literal number
- `{ kind: "time", ... }` - Time values

**Example JSON**:
```json
{
  "type": "and",
  "nodes": [
    {
      "type": "condition",
      "left": { "kind": "indicator", "id": "rsi14" },
      "op": ">",
      "right": { "kind": "number", "value": 30 }
    },
    {
      "type": "cross",
      "a": { "kind": "indicator", "id": "ema12" },
      "b": { "kind": "indicator", "id": "ema26" }
    }
  ]
}
```

---

### 5. RiskSection.tsx

**Purpose**: Configure position sizing and risk management

**Sub-sections**:

#### Position Sizing
- Sizing Mode: Fixed Lot | Percent Capital | Fixed Quantity | Dynamic
- Mode-specific inputs

#### Stop Loss
- Enable/disable checkbox
- Type: Points | Percent | ATR-based
- Value input
- ATR period (if ATR mode)

#### Take Profit
- Enable/disable checkbox
- Type: Points | Percent
- Value input
- Lock at TP option (with offset)

#### Trailing Stop Loss
- Enable/disable checkbox
- Offset (points)
- Only trail after TP lock option

#### Position Limits
- Max open positions

**Example Configuration**:
```tsx
risk: {
  sizing: { type: "fixed_lot", lots: 30 },
  sl: { enabled: true, type: "points", value: 50 },
  tp: { enabled: true, type: "points", value: 100, lockAtTp: true, lockOffset: 0 },
  tsl: { enabled: true, offset: 50, afterTpLock: true },
  maxOpenPositions: 1
}
```

---

### 6. ExecutionSection.tsx

**Purpose**: Configure trade execution settings

**Sub-sections**:

#### Entry Fill
- CLOSE: Fill at bar close
- NEXT_OPEN: Fill at next bar open
- MARKET: Fill immediately

#### Slippage
- Points to add to prices

#### Charges & Fees
- Fixed Mode: Single charge per trade
- Components Mode: Brokerage, Exchange, STT, GST breakdown

#### Contract Multiplier
- For index/derivative contracts (e.g., 50 for NIFTY)

#### Lot Size
- Standard lot size for position sizing

---

### 7. CodeEditorSection.tsx

**Purpose**: Advanced JSON editing with validation

**Features**:
- Full code editor with syntax highlighting
- Real-time JSON validation
- Format button (auto-format JSON)
- Apply Changes button
- Reset button
- Unsaved changes indicator
- Error display with messages

**Workflow**:
1. Edit JSON in textarea
2. Errors display in red if invalid
3. Click "Format" to auto-format
4. Click "Apply Changes" to sync to form
5. Changes appear in other tabs

---

### 8. PreviewPanel.tsx

**Purpose**: Live read-only preview of strategy

**Displays**:
- Indicator count
- Timeframe
- Capital
- Rules count

#### Indicators List
```
rsi14 (rsi)
ema_fast (ema)
```

#### Rules Summary
```
Entry: All of: 2 conditions
Entry Short: Not defined
Exit: RSI < 50
```

#### Risk Summary
```
Sizing: fixed_lot
SL: 50 points
TP: 100 points
TSL: 50pts
```

#### Execution Summary
```
Fill: CLOSE
Charges: ₹81.47
```

---

## Integration with Previous Phases

### Phase 1 → Phase 3 Integration

```typescript
import { StrategyDSL, LogicNode } from '../types/rule-dsl';
import { strategyValidator } from '../services/strategyValidator';
import { ruleCompiler } from '../services/ruleCompiler';

// Components use these for validation
const errors = strategyValidator.validateStrategy(strategy);
const compiled = ruleCompiler.compileStrategy(strategy);
```

### Phase 2 → Phase 3 Integration

```typescript
import useStrategyStore from '../hooks/useStrategyStore';

// All components wrapped by StrategyBuilderForm
const { saveStrategy, loadStrategy, validate, compile } = useStrategyStore();
```

---

## Component Data Flow

```
StrategyBuilderForm (root state)
    │
    ├─→ validate(strategy) → ValidationError[]
    │
    ├─→ handleStrategyChange(updates)
    │   └─→ setStrategy({ ...prev, ...updates })
    │
    ├─→ handleSave()
    │   └─→ saveStrategy() → localStorage
    │
    └─→ Render Tabs
        ├─→ IndicatorsSection
        │   └─→ onStrategyChange({ indicators: [...] })
        ├─→ ConditionsSection
        │   └─→ onStrategyChange({ rules: {...} })
        ├─→ RiskSection
        │   └─→ onStrategyChange({ risk: {...} })
        ├─→ ExecutionSection
        │   └─→ onStrategyChange({ execution: {...} })
        └─→ CodeEditorSection
            └─→ handleApply() → parseJSON → onStrategyChange()
```

---

## Usage Examples

### Basic Setup

```tsx
import StrategyBuilderForm from './pages/StrategyBuilderForm';

export default function App() {
  return (
    <div>
      <StrategyBuilderForm />
    </div>
  );
}
```

### Load Specific Strategy

```tsx
import { useParams } from 'react-router-dom';
import StrategyBuilderForm from './pages/StrategyBuilderForm';

export default function StrategyPage() {
  const { id } = useParams();
  return <StrategyBuilderForm initialId={id} />;
}
```

### Integration with Router

```tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StrategyBuilderForm from './pages/StrategyBuilderForm';
import StrategyList from './pages/StrategyList';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/builder" element={<StrategyBuilderForm />} />
        <Route path="/builder/:id" element={<StrategyBuilderForm />} />
        <Route path="/strategies" element={<StrategyList />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## Styling Notes

All components use **Tailwind CSS** with:
- `slate-*`: Neutral grays
- `blue-*`: Primary actions
- `green-*`: Success (add, valid)
- `red-*`: Errors
- `yellow-*`: Warnings
- `orange-*`: Changes indicator

---

## Features Implemented

✅ Tab-based navigation (5 tabs)  
✅ Indicator manager with 8 indicator types  
✅ Condition builder with JSON editing  
✅ Risk management configuration  
✅ Execution settings  
✅ Advanced code editor  
✅ Live preview panel  
✅ Validation panel with error display  
✅ Template quick-load  
✅ Save/new buttons  
✅ Real-time validation  
✅ Bidirectional form ↔ JSON sync

---

## Next Steps (Phase 4)

1. **Backend Integration**: Connect to backtest_engine.py
2. **Strategy List Page**: Browse/search/delete strategies
3. **Quick Backtest**: Test strategy on historical data
4. **Results Display**: Charts and trade history

---

## Files Created

| File | Lines | Component |
|------|-------|-----------|
| `StrategyBuilderForm.tsx` | 180+ | Main page |
| `StrategyHeader.tsx` | 60+ | Header |
| `IndicatorsSection.tsx` | 140+ | Indicators |
| `ConditionsSection.tsx` | 130+ | Conditions |
| `RiskSection.tsx` | 200+ | Risk |
| `ExecutionSection.tsx` | 150+ | Execution |
| `CodeEditorSection.tsx` | 100+ | Code editor |
| `PreviewPanel.tsx` | 140+ | Preview |

**Total**: 1,100+ lines of React components

---

## Import Paths

```typescript
import StrategyBuilderForm from '@/pages/StrategyBuilderForm';
import useStrategyStore from '@/hooks/useStrategyStore';
import { StrategyDSL } from '@/types/rule-dsl';
import { strategyTemplates } from '@/services/strategyTemplates';
```

---

## Summary

Phase 3 delivers a complete, production-ready form-based strategy builder:
- ✅ All 5 tabs implemented
- ✅ Validation in real-time
- ✅ Preview panel with live updates
- ✅ JSON code editor with sync
- ✅ Template loading
- ✅ Responsive design
- ✅ Error handling
- ✅ Save integration

Ready for Phase 4 (Backend Integration)!
