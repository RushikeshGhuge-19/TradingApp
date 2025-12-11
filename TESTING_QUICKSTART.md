# 🚀 Strategy Builder Integration Testing - Step by Step Guide

## Quick Start (5 minutes)

### Terminal 1: Start Backend
```bash
cd Backend\algo-backend
python -m uvicorn app.main:app --reload --port 8000
```

**Expected Output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

**Test Backend is Running:**
```bash
curl http://localhost:8000/api/status
# Should return: {"status":"ok"} or similar
```

---

### Terminal 2: Start Frontend
```bash
cd Frontend
npm run dev
```

**Expected Output:**
```
VITE v5.x.x ready in XXX ms

➜  Local:   http://localhost:5173/
```

**Open in Browser:**
- http://localhost:5173

---

## Testing Phases

### ✅ Phase 1 Test: Core DSL Infrastructure

Open browser console (F12) and run:

```javascript
// Test 1.1: Import types
import { StrategyDSL } from './src/types/rule-dsl.js';
console.log('✓ DSL types imported');

// Test 1.2: Validate a strategy
import { validateStrategy } from './src/services/strategyValidator.js';
const testStrategy = {
  name: "Test",
  indicators: [],
  rules: {},
  risk: { sizing: { type: "fixed_lot", lots: 1 } },
  execution: { entryFill: "CLOSE", charges: { mode: "fixed", fixedCharge: 0 } }
};
const errors = validateStrategy(testStrategy);
console.log('✓ Validation works, errors:', errors.length);

// Test 1.3: Compile strategy
import { compileStrategy } from './src/services/ruleCompiler.js';
try {
  const compiled = compileStrategy(testStrategy);
  console.log('✓ Strategy compiled');
} catch (e) {
  console.error('✗ Compilation failed:', e.message);
}
```

**Expected Results:**
- ✓ DSL types imported
- ✓ Validation works
- ✓ Strategy compiled

---

### ✅ Phase 2 Test: Persistence & Storage

```javascript
// Test 2.1: Save strategy
import { strategyStore } from './src/services/strategyStore.js';

const metadata = strategyStore.saveStrategy({
  name: "Phase2TestStrategy",
  indicators: [],
  rules: {},
  risk: { sizing: { type: "fixed_lot", lots: 1 } },
  execution: { entryFill: "CLOSE", charges: { mode: "fixed", fixedCharge: 50 } }
});

console.log('✓ Strategy saved with ID:', metadata.id);
console.log('✓ Version:', metadata.version);

// Test 2.2: Load strategy
const loaded = strategyStore.loadStrategy(metadata.id);
console.log('✓ Strategy loaded:', loaded.name);

// Test 2.3: List strategies
const all = strategyStore.listStrategies();
console.log('✓ Listed', all.length, 'strategies');

// Test 2.4: Verify localStorage
console.log('✓ localStorage size:', JSON.stringify(localStorage).length, 'bytes');
```

**Expected Results:**
- ✓ Strategy saved with ID
- ✓ Version shows 1
- ✓ Strategy loaded correctly
- ✓ At least 1 strategy in list

---

### ✅ Phase 3 Test: UI Form Builder

1. **Navigate to Strategy Builder**
   - Look for "Strategy Builder" in navigation
   - Should see 5 tabs: Indicators | Conditions | Risk | Execution | Code

2. **Add an Indicator**
   - Go to Indicators tab
   - Select "RSI" from dropdown
   - Enter ID: "rsi14"
   - Enter period: 14
   - Click Add button
   - Should see "rsi14 (RSI)" in list

3. **Set Entry Condition**
   - Go to Conditions tab
   - Click "Entry" sub-tab
   - Paste JSON:
   ```json
   {
     "type": "condition",
     "left": { "kind": "indicator", "id": "rsi14" },
     "op": ">",
     "right": { "kind": "number", "value": 40 }
   }
   ```
   - Click "Apply Changes"

4. **Configure Risk**
   - Go to Risk tab
   - Sizing: Fixed Lot, 30 lots
   - SL: Enabled, Points, 50 points
   - TP: Enabled, Points, 100 points

5. **Save Strategy**
   - Click Save button in header
   - Should see strategy ID appear
   - Check "Saved successfully" notification

**Expected Results:**
- ✓ All 5 tabs render without errors
- ✓ Can add indicators
- ✓ Can set conditions
- ✓ Can configure risk
- ✓ Can save strategy

---

### ✅ Phase 4 Test: Backend Integration & Backtest

#### Test 4.1: Backend Endpoint

**Terminal 3: Test API**
```bash
# Make API request
curl -X GET http://localhost:8000/api/status

# Should return something like:
# {"status":"ok"}
```

#### Test 4.2: Frontend Backtest Modal

1. **Create a Simple Strategy**
   - Indicator: RSI(14)
   - Entry: RSI > 40
   - Exit: RSI < 50
   - SL: 50 points, TP: 100 points
   - Save strategy

2. **Click "Quick Backtest" Button**
   - Should see button in right sidebar
   - Click to open modal
   - Modal shows:
     - Start date input (default: 30 days ago)
     - End date input (default: today)
     - Capital input (default: 100,000)
     - Run Backtest button

3. **Run Backtest**
   - Adjust date range to recent months (e.g., Oct 2024 - Dec 2024)
   - Click "Run Backtest"
   - Loading spinner should appear
   - After 3-5 seconds, results appear

4. **Review Results**
   - Summary tab shows:
     - Total Trades: (number)
     - Win Rate: (percentage)
     - Profit Factor: (number)
     - ROI: (percentage)
     - Max Drawdown: (percentage)
     - Total P&L: (₹amount)
   - Trades tab shows table with individual trades
   - Export CSV button works

**Expected Results:**
- ✓ Backtest button appears
- ✓ Modal opens without errors
- ✓ Date pickers work
- ✓ Run Backtest calls API (check Network tab in DevTools)
- ✓ Results display correctly
- ✓ No console errors

---

## Troubleshooting

### Backend Won't Start
**Problem:** `ModuleNotFoundError: No module named 'app'`

**Solution:**
```bash
cd Backend\algo-backend
# Make sure you're in the right directory
pwd  # Should show: .../algo-backend

# Try again
python -m uvicorn app.main:app --reload --port 8000
```

---

### Frontend Build Errors
**Problem:** Missing dependencies or build errors

**Solution:**
```bash
cd Frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

---

### API Not Reachable
**Problem:** `GET http://localhost:8000/api/status - Network Error`

**Solution:**
1. Check if backend server is running
2. Verify port 8000 is not in use: `netstat -ano | findstr :8000`
3. Kill process if needed: `taskkill /PID <pid> /F`
4. Restart backend

---

### CORS Errors
**Problem:** "Access to XMLHttpRequest blocked by CORS policy"

**Solution:**
Backend should have CORS enabled. Check `app/main.py` has:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Network Debugging

### Check Backend is Responding
**Browser Console:**
```javascript
fetch('http://localhost:8000/api/status')
  .then(r => r.json())
  .then(d => console.log(d))
  .catch(e => console.error(e))
```

### Check Frontend Assets Load
**Browser DevTools > Network tab:**
- Should see index.html loaded
- Should see main-*.js loaded
- Check for 404 errors

---

## Running Full Test Suite

Once both servers are up, run all tests manually:

1. **Phase 1 Tests** (DSL Infrastructure)
   - [ ] Type system imports
   - [ ] Indicators compute correctly
   - [ ] Validator catches errors
   - [ ] Compiler generates functions

2. **Phase 2 Tests** (Persistence)
   - [ ] Save/load strategies
   - [ ] Search and filter
   - [ ] Import/export
   - [ ] Version tracking

3. **Phase 3 Tests** (UI Form)
   - [ ] All tabs render
   - [ ] Form inputs work
   - [ ] Validation displays
   - [ ] Save works

4. **Phase 4 Tests** (Backend Integration)
   - [ ] API endpoint responds
   - [ ] Backtest runs
   - [ ] Results display
   - [ ] CSV export works

---

## Test Completion

Once all tests pass:

✅ Mark each phase complete  
✅ Document any issues found  
✅ Create bug report if needed  
✅ Update testing checklist  

**Next Steps:**
- Production deployment
- Performance optimization
- Advanced features (optimization, multi-symbol, etc.)

---

## Live Testing URLs

- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Frontend App:** http://localhost:5173
- **Strategy Builder:** http://localhost:5173/builder

---

## Quick Commands Cheat Sheet

```bash
# Terminal 1 - Backend
cd Backend\algo-backend && python -m uvicorn app.main:app --reload --port 8000

# Terminal 2 - Frontend  
cd Frontend && npm run dev

# Terminal 3 - Tests
cd . && curl http://localhost:8000/api/status

# Clean & restart
rm -rf node_modules && npm install

# Kill port 8000
netstat -ano | findstr :8000
taskkill /PID <pid> /F
```

---

## Success Indicators

### ✅ Green Flag Checklist
- [ ] Backend server running without errors
- [ ] Frontend app loads in browser
- [ ] No console errors in DevTools
- [ ] Can navigate through UI
- [ ] Can create and save strategy
- [ ] Can run backtest
- [ ] Results display correctly

### 🚩 Red Flag Checklist
- [ ] Backend crashes on startup
- [ ] Frontend build fails
- [ ] CORS errors in console
- [ ] API endpoints return 500
- [ ] UI buttons don't respond
- [ ] Backtest fails silently
- [ ] Data not persisting

---

## Document Your Results

**Testing Session Report**

Date: _______________  
Tester: ______________  
Backend Status: ✓ OK / ✗ Failed  
Frontend Status: ✓ OK / ✗ Failed  

**Phase Results:**
- Phase 1 (DSL): ✓ / ✗
- Phase 2 (Storage): ✓ / ✗
- Phase 3 (UI): ✓ / ✗
- Phase 4 (Backend): ✓ / ✗

**Issues Found:**
1. 
2. 
3. 

**Next Actions:**

---

🎉 Good luck with integration testing!
