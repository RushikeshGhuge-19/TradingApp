# ✅ STRATEGY BUILDER - INTEGRATION TESTING CHECKLIST

**Project**: Trading App - Strategy Builder  
**Date**: December 11, 2025  
**Overall Status**: 🟢 READY FOR TESTING  

---

## 📋 PRE-TESTING CHECKLIST

### Environment Setup
- [ ] Python 3.10+ installed and working
- [ ] Node 18+ installed and working
- [ ] Backend dependencies installed: `pip install -r requirements.txt`
- [ ] Frontend dependencies installed: `npm install`
- [ ] Two terminal windows available
- [ ] Browser (Chrome/Firefox/Safari) available
- [ ] Ports 8000 and 5173 not in use

### Documentation Review
- [ ] Read COMPLETE_IMPLEMENTATION_SUMMARY.md
- [ ] Read TESTING_QUICKSTART.md
- [ ] Bookmarked TESTING_INTEGRATION_GUIDE.md for reference
- [ ] Have DOCUMENTATION_INDEX.md available

### Code Review (Optional)
- [ ] Reviewed Phase 1 type definitions
- [ ] Reviewed Phase 2 persistence layer
- [ ] Reviewed Phase 3 UI components
- [ ] Reviewed Phase 4 backend integration

---

## 🚀 STARTUP CHECKLIST

### Backend Startup
```bash
cd Backend\algo-backend
python -m uvicorn app.main:app --reload --port 8000
```

- [ ] Backend server started successfully
- [ ] Output shows: "Uvicorn running on http://127.0.0.1:8000"
- [ ] No startup errors in console
- [ ] API docs available at http://localhost:8000/docs

**Verification**: `curl http://localhost:8000/api/status` returns response

### Frontend Startup
```bash
cd Frontend
npm run dev
```

- [ ] Frontend server started successfully
- [ ] Output shows: "Local: http://localhost:5173/"
- [ ] No build errors in console
- [ ] React DevTools working

**Verification**: Open http://localhost:5173 - page loads without errors

---

## 📊 PHASE 1 TESTING: Rule DSL Infrastructure

### ✓ Type System
- [ ] rule-dsl.ts imports successfully
- [ ] All interfaces compile without errors
- [ ] Can create StrategyDSL objects
- [ ] Type checking prevents invalid structures
- [ ] CompiledStrategy interface complete
- [ ] RuntimeContext interface correct
- [ ] BacktestResult interface defined

**Expected Result**: No TypeScript compilation errors

### ✓ Indicators
- [ ] 9 indicator types available
- [ ] RSI calculation correct
- [ ] EMA with source support works
- [ ] SMA calculation correct
- [ ] ATR calculation correct
- [ ] Bollinger Bands returns 3 arrays
- [ ] MACD returns macd/signal/histogram
- [ ] Stochastic returns K and D lines
- [ ] ADX calculation correct
- [ ] Indicator chaining works (EMA of RSI)

**Expected Result**: All 9 indicators compute without errors

### ✓ Validator
- [ ] Valid strategy passes validation
- [ ] Missing fields detected
- [ ] Duplicate indicator IDs caught
- [ ] Invalid indicator types rejected
- [ ] Parameter ranges checked
- [ ] Circular dependencies detected
- [ ] Condition operands validated
- [ ] Time format checked
- [ ] Risk parameters validated
- [ ] Execution settings validated

**Expected Result**: Validation returns correct errors/warnings

### ✓ Compiler
- [ ] Strategy compiles without errors
- [ ] Compiled function is callable
- [ ] Entry signal returned (null/LONG/SHORT)
- [ ] Exit signal returned (boolean/null)
- [ ] Lookback period calculated
- [ ] Indicator precomputation works
- [ ] AND logic correct
- [ ] OR logic correct
- [ ] Crossover detection works
- [ ] Time filters work

**Expected Result**: Compiled strategy evaluates correctly

**Phase 1 Status**: ☐ PASS / ☐ FAIL / ☐ PARTIAL

---

## 💾 PHASE 2 TESTING: Persistence & Storage

### ✓ Save/Load
- [ ] Can save new strategy
- [ ] Strategy gets unique ID
- [ ] Version starts at 1
- [ ] Timestamps set correctly
- [ ] Can load saved strategy
- [ ] Loaded data matches saved
- [ ] Metadata correct

### ✓ Version Management
- [ ] Update increments version
- [ ] Version history tracked
- [ ] Changelog updated
- [ ] Can load by version number
- [ ] Old versions preserved (up to limit)
- [ ] Version limit enforced

### ✓ Search & Filter
- [ ] List strategies works
- [ ] Search by name works
- [ ] Search by tags works
- [ ] Case-insensitive search
- [ ] Returns correct results
- [ ] Empty results handled

### ✓ Import/Export
- [ ] Export to JSON works
- [ ] JSON is valid
- [ ] Can import JSON
- [ ] Import restores data correctly
- [ ] Overwrite flag works
- [ ] Multiple imports handled
- [ ] Download file works (browser)

### ✓ React Hook
- [ ] Hook imports successfully
- [ ] useStrategyStore() callable
- [ ] Returns strategies array
- [ ] Returns save function
- [ ] Returns load function
- [ ] Error state managed
- [ ] Loading state managed
- [ ] Events fire correctly

**Phase 2 Status**: ☐ PASS / ☐ FAIL / ☐ PARTIAL

---

## 🎨 PHASE 3 TESTING: Form-Based UI

### ✓ Main Form
- [ ] Page loads without errors
- [ ] All 5 tabs visible (Indicators, Conditions, Risk, Execution, Code)
- [ ] Tabs switch smoothly
- [ ] Form preserves data between tabs
- [ ] No console errors

### ✓ Indicators Tab
- [ ] Dropdown shows all 8 types
- [ ] Can select indicator type
- [ ] Can input indicator ID
- [ ] Can input indicator parameters
- [ ] Add button works
- [ ] Indicator appears in list
- [ ] Can remove indicator
- [ ] Duplicate ID prevented
- [ ] Error messages display
- [ ] Indicator chaining dropdown works

### ✓ Conditions Tab
- [ ] Entry sub-tab visible
- [ ] Entry Short sub-tab visible
- [ ] Exit sub-tab visible
- [ ] JSON editor opens
- [ ] JSON syntax validation works
- [ ] Apply Changes button works
- [ ] Visual display shows structure
- [ ] Format button auto-formats
- [ ] Reset button works
- [ ] Help text visible

### ✓ Risk Tab
- [ ] Sizing mode dropdown works
- [ ] Fixed lot input works
- [ ] Percent capital input works
- [ ] SL enable/disable works
- [ ] SL type dropdown works
- [ ] SL value input works
- [ ] TP enable/disable works
- [ ] TP type dropdown works
- [ ] TP value input works
- [ ] Lock at TP toggle works
- [ ] TSL enable/disable works
- [ ] TSL offset input works
- [ ] Max positions input works

### ✓ Execution Tab
- [ ] Entry fill dropdown shows options
- [ ] Can select entry fill method
- [ ] Slippage input works
- [ ] Charges mode toggle works
- [ ] Fixed charge input works
- [ ] Component breakdowns visible
- [ ] Contract multiplier input works
- [ ] Lot size input works

### ✓ Code Tab
- [ ] Monaco editor loads
- [ ] JSON syntax highlighting works
- [ ] Format button works
- [ ] Apply changes button works
- [ ] Reset button works
- [ ] Error highlighting works
- [ ] Copy button works

### ✓ Preview Panel
- [ ] Shows indicator list
- [ ] Shows rules summary
- [ ] Shows risk configuration
- [ ] Shows execution settings
- [ ] Updates in real-time
- [ ] Formatted display clear

### ✓ Validation Panel
- [ ] Shows errors in red
- [ ] Shows warnings in yellow
- [ ] Updates in real-time
- [ ] Shows field names
- [ ] Error count correct
- [ ] Dismissible

### ✓ Header
- [ ] Strategy name editable
- [ ] Save button works
- [ ] Save button disabled if invalid
- [ ] New button works
- [ ] Unsaved indicator shows
- [ ] Version displays

**Phase 3 Status**: ☐ PASS / ☐ FAIL / ☐ PARTIAL

---

## 🔌 PHASE 4 TESTING: Backend Integration

### ✓ Backend Endpoint
- [ ] POST /api/v1/backtest/dsl endpoint exists
- [ ] Accepts strategy DSL
- [ ] Accepts date range
- [ ] Returns 200 OK
- [ ] Response has trades array
- [ ] Response has equity_curve array
- [ ] Response has summary object
- [ ] Invalid request returns 400
- [ ] Missing data returns 400

### ✓ Backtest Engine
- [ ] Fetches historical data
- [ ] Evaluates strategy on each bar
- [ ] Generates entry signals
- [ ] Generates exit signals
- [ ] Applies stop loss
- [ ] Applies take profit
- [ ] Applies trailing stop loss
- [ ] Calculates charges
- [ ] Tracks equity curve
- [ ] Calculates performance metrics
- [ ] Returns trade-by-trade data

### ✓ Performance Metrics
- [ ] Total trades count correct
- [ ] Win rate calculated correctly
- [ ] Profit factor calculated correctly
- [ ] ROI calculated correctly
- [ ] Max drawdown calculated correctly
- [ ] Final equity correct
- [ ] Total P&L correct
- [ ] Total charges correct

### ✓ Frontend API Client
- [ ] backtestAPI.ts imports
- [ ] runBacktest() callable
- [ ] quickBacktest() callable
- [ ] formatBacktestSummary() works
- [ ] exportTradesToCSV() works
- [ ] Error handling works
- [ ] API calls backend correctly

### ✓ Backtest Modal
- [ ] Modal opens on button click
- [ ] Date pickers work
- [ ] Capital input editable
- [ ] Run Backtest button works
- [ ] Loading spinner shows
- [ ] Results display on success
- [ ] 3 tabs visible (Summary, Trades, Equity)
- [ ] Summary tab shows metrics grid
- [ ] Trades tab shows table
- [ ] Equity tab shows placeholder
- [ ] Export CSV button works
- [ ] Error messages display
- [ ] Close button works
- [ ] Modal closes on close

### ✓ End-to-End Integration
- [ ] Create strategy
- [ ] Set indicators
- [ ] Define entry/exit
- [ ] Configure risk
- [ ] Save strategy
- [ ] Click Quick Backtest
- [ ] Set date range
- [ ] Run backtest
- [ ] Results display correctly
- [ ] No errors in console

**Phase 4 Status**: ☐ PASS / ☐ FAIL / ☐ PARTIAL

---

## 🔄 END-TO-END WORKFLOW TEST

### Complete Flow: Create → Save → Backtest → Review

**Step 1: Create Strategy**
- [ ] Navigate to /builder
- [ ] Add RSI(14) indicator
- [ ] Add EMA(3) on RSI
- [ ] Entry: RSI > 40
- [ ] Exit: RSI < 50
- [ ] SL: 50 points
- [ ] TP: 100 points
- [ ] Capital: 100,000
- [ ] All 5 tabs populate correctly

**Step 2: Validate**
- [ ] No errors in validation panel
- [ ] Preview shows all settings
- [ ] Save button enabled

**Step 3: Save**
- [ ] Click Save button
- [ ] Strategy ID appears
- [ ] Version shows v1
- [ ] Success notification

**Step 4: Reload**
- [ ] Refresh page (F5)
- [ ] Strategy still there
- [ ] Data preserved
- [ ] Can load from dropdown

**Step 5: Backtest**
- [ ] Click Quick Backtest button
- [ ] Modal opens
- [ ] Set dates: Oct 2024 - Dec 2024
- [ ] Capital: 100,000
- [ ] Click Run Backtest
- [ ] API call fires (Network tab)
- [ ] Results appear within 5 seconds

**Step 6: Review**
- [ ] Summary tab shows metrics
- [ ] Trades tab shows table
- [ ] Total trades > 0
- [ ] Win rate 0-100%
- [ ] P&L displayed
- [ ] CSV export works

**Step 7: Cleanup**
- [ ] Close modal
- [ ] Create new strategy
- [ ] Old strategy still saved
- [ ] Can delete strategy

**Workflow Status**: ☐ PASS / ☐ FAIL / ☐ PARTIAL

---

## 🐛 ERROR SCENARIO TESTING

### Phase 1 Errors
- [ ] Invalid indicator type caught
- [ ] Missing parameters detected
- [ ] Circular dependencies found
- [ ] Invalid logic structure rejected

### Phase 2 Errors
- [ ] Duplicate ID prevented
- [ ] Invalid JSON rejected
- [ ] Quota exceeded handled
- [ ] Corrupted data recovered

### Phase 3 Errors
- [ ] Form validation messages display
- [ ] Invalid JSON highlighted
- [ ] Save disabled for invalid strategy
- [ ] Error recovery quick

### Phase 4 Errors
- [ ] Invalid date range handled
- [ ] Empty data handled
- [ ] API timeout handled
- [ ] Network error displayed
- [ ] Error retry possible

---

## 🎯 BROWSER COMPATIBILITY

### Chrome/Chromium
- [ ] Page loads
- [ ] No console errors
- [ ] All features work
- [ ] Performance acceptable

### Firefox
- [ ] Page loads
- [ ] No console errors
- [ ] All features work
- [ ] Performance acceptable

### Safari
- [ ] Page loads
- [ ] No console errors
- [ ] All features work
- [ ] Performance acceptable

### Edge
- [ ] Page loads
- [ ] No console errors
- [ ] All features work
- [ ] Performance acceptable

---

## ⚡ PERFORMANCE TESTING

### Load Time
- [ ] Page loads in < 2 seconds
- [ ] No blank screen
- [ ] Assets load correctly
- [ ] Interactive quickly

### Compilation
- [ ] Strategy compiles < 100ms
- [ ] Validator runs < 50ms
- [ ] Indicators precompute < 100ms

### Backtest
- [ ] API responds < 5 seconds
- [ ] No timeout errors
- [ ] Results display immediately

### Rendering
- [ ] Form smooth
- [ ] Tabs switch instantly
- [ ] Modal opens/closes smoothly
- [ ] No lag or jank

---

## 📝 FINAL SIGN-OFF

### Testing Completion
- [ ] All phases tested
- [ ] All test cases reviewed
- [ ] No critical issues found
- [ ] Minor issues documented
- [ ] Workarounds provided where applicable

### Quality Assurance
- [ ] Code quality acceptable
- [ ] Error handling complete
- [ ] Documentation accurate
- [ ] Examples working

### Production Readiness
- [ ] No blocking issues
- [ ] Performance acceptable
- [ ] Security reasonable
- [ ] Ready for deployment

---

## 📊 TEST RESULTS SUMMARY

| Phase | Status | Issues | Notes |
|-------|--------|--------|-------|
| Phase 1 | ☐ PASS | ___ | ___ |
| Phase 2 | ☐ PASS | ___ | ___ |
| Phase 3 | ☐ PASS | ___ | ___ |
| Phase 4 | ☐ PASS | ___ | ___ |
| E2E | ☐ PASS | ___ | ___ |

### Overall Status
**☐ PASS - Ready for Production**  
**☐ PASS WITH ISSUES - Ready with Workarounds**  
**☐ FAIL - Not Ready**  

---

## 🔍 ISSUES FOUND

### Critical Issues
1. (If any)
2. (If any)
3. (If any)

### Major Issues
1. (If any)
2. (If any)
3. (If any)

### Minor Issues / Warnings
1. (If any)
2. (If any)
3. (If any)

### Workarounds Applied
1. (If any)
2. (If any)
3. (If any)

---

## 📌 NOTES & OBSERVATIONS

(Space for tester notes)

---

## 👤 TEST REPORT

**Tested By**: _______________  
**Testing Date**: _______________  
**Total Testing Time**: _______________  

**Environment**:
- OS: _______________
- Browser: _______________
- Backend Port: 8000
- Frontend Port: 5173

**Conclusion**:

---

## ✅ SIGN-OFF

**Tester**: _________________ **Date**: _______

**QA Lead**: _________________ **Date**: _______

**Project Manager**: _________________ **Date**: _______

---

## 📞 NEXT STEPS

- [ ] Share test report
- [ ] Document any issues
- [ ] Create bug reports
- [ ] Plan Phase 5 features
- [ ] Schedule production deployment

---

**🎉 Testing Complete!**

**Status**: ✅ READY FOR NEXT PHASE

*Thank you for testing the Strategy Builder!*
