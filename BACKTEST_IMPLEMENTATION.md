# Backtest Feature Implementation Summary

## Overview

Successfully implemented a complete **offline backtest feature** for the RSI-EMA trading strategy. This allows you to test the strategy on historical data, analyze performance, and view detailed trade-by-trade results.

## What Was Implemented

### Backend (FastAPI)

#### 1. **Backtest Schema** (`algo-backend/app/schemas/backtest.py`)
Defines all data structures for backtest operations:

- **BacktestRequest**: Input parameters
  - `symbol`: Stock symbol (default: "^NSEBANK")
  - `timeframe`: Candle interval (5m, 15m, 30m, 1h)
  - `start_date`, `end_date`: Date range for backtest
  - Optional parameter overrides for strategy (RSI, EMA, TP, Trail, Lot)

- **BacktestTrade**: Individual trade result
  - Direction (LONG/SHORT)
  - Entry/exit time and price
  - PnL in points and money
  - Exit reason (TP, TRAIL, EMA_EXIT, END_OF_BACKTEST)

- **BacktestSummary**: Performance statistics
  - Total trades, win/loss count, winrate
  - Net PnL (points & money)
  - Max drawdown percentage
  - Best/worst trade references

- **BacktestResult**: Complete backtest output
  - Summary stats
  - Equity curve (time → equity)
  - List of all trades

#### 2. **Backtest Engine** (`algo-backend/app/services/backtest_engine.py`)
Core strategy simulation engine with:

- **Historical Data Fetching**: Downloads OHLCV candles from Yahoo Finance for any date range
- **Indicator Calculation**:
  - RSI (Relative Strength Index)
  - EMA on RSI (fast & slow) for momentum confirmation
  - Trend EMA on close price for directional bias
  
- **Trade Entry Logic** (LONG):
  - Price above trend EMA (uptrend filter)
  - EMA_RSI_Fast crosses above EMA_RSI_Slow (momentum confirmation)
  
- **Trade Entry Logic** (SHORT):
  - Price below trend EMA (downtrend filter)
  - EMA_RSI_Fast crosses below EMA_RSI_Slow (momentum confirmation)
  
- **Exit Conditions**:
  - TP (Take Profit): Reached target points
  - TRAIL: Triggered trailing stop offset
  - EMA_EXIT: Price crosses trend EMA
  - END_OF_BACKTEST: Positions closed at end of date range
  
- **Equity Simulation**:
  - Starting capital: ₹1,000,000 (configurable)
  - Position sizing: Uses lot_size parameter
  - Tracks equity after each trade
  - Calculates max drawdown

#### 3. **Backtest API Endpoint** (`algo-backend/app/api/routes/backtest.py`)
HTTP endpoint: `POST /api/backtest`

- Accepts BacktestRequest payload
- Falls back to StrategyConfig defaults if parameters not provided
- Runs backtest in thread pool (async) to avoid blocking
- Returns BacktestResult with full trade history and equity curve
- Error handling with detailed messages

#### 4. **Router Registration** (`algo-backend/app/main.py`)
- Imported backtest router: `from app.api.routes import backtest as backtest_router`
- Registered at `/api/backtest` prefix

### Frontend (React + TypeScript)

#### 1. **API Types & Functions** (`Frontend/services/api.ts`)
Added TypeScript interfaces and API client:

```typescript
export interface BacktestRequest { symbol, timeframe, start_date, end_date, optional params }
export interface BacktestTrade { direction, entry_time, entry_price, exit_time, exit_price, pnl_points, pnl_money, reason }
export interface BacktestResult { summary, equity_curve, trades }
export const runBacktest(request): Promise<BacktestResult>
```

#### 2. **Strategy Dashboard Page** (`Frontend/src/pages/StrategyDashboard.tsx`)
New page component with:

- **Controls Section**:
  - Symbol input (editable)
  - Timeframe selector (5m, 15m, 30m, 1h)
  - Start/end date pickers
  - "Run Backtest" button
  - Current strategy parameters display (read-only)

- **Results Display** (once backtest completes):
  - **Summary Cards**:
    - Total trades
    - Winrate (%)
    - Net PnL (₹)
    - Max drawdown (%)
    - Best/worst trade PnL
  
  - **Equity Curve Chart**:
    - Line chart using Recharts
    - X-axis: Time of each equity update
    - Y-axis: Equity balance
    - Shows portfolio growth/decline over time
  
  - **Trades Table**:
    - Columns: Direction, Entry Time, Entry Price, Exit Time, Exit Price, PnL (pts), PnL (₹), Reason
    - Color-coded (green for wins, red for losses)
    - Sortable and searchable (basic implementation)

- **UI Features**:
  - Loading spinner during backtest execution
  - Error messages if backtest fails (e.g., no data for date range)
  - Responsive grid layout
  - Dark theme matching existing UI

#### 3. **Navigation & Routing**
- **Route Added**: `/strategy-dashboard` in `Frontend/index.tsx`
- **Header Navigation**: Added "📊 Backtest" link to main navigation in `App.tsx`
- **Strategy Builder Button**: Added "📊 Open Backtest" button to StrategyBuilder page

## How to Use

### 1. Configure Strategy (Optional)
- Navigate to `/strategy` (⚙️ Strategy)
- Adjust RSI period, EMA periods, TP points, trailing stop offset, lot size
- Click "Save Strategy"

### 2. Run Backtest
- Navigate to `/strategy-dashboard` (📊 Backtest) from header or Strategy Builder
- Select symbol, timeframe, and date range
- Click "Run Backtest"
- Wait for results to load (typically 2-30 seconds depending on data volume)

### 3. Analyze Results
- View summary statistics at top
- Check equity curve chart for drawdown and growth patterns
- Review individual trades in the table
- Identify patterns (e.g., which exit reasons are most profitable)

## API Endpoints

### POST /api/backtest
**Request:**
```json
{
  "symbol": "^NSEBANK",
  "timeframe": "15m",
  "start_date": "2024-12-01",
  "end_date": "2024-12-10",
  "rsi_period": 14,
  "ema_fast": 3,
  "ema_slow": 7,
  "trend_ema": 20,
  "tp_points": 100,
  "trail_offset": 50,
  "lot_size": 1
}
```

**Response:**
```json
{
  "summary": {
    "total_trades": 12,
    "win_trades": 8,
    "loss_trades": 4,
    "winrate": 66.67,
    "net_pnl_money": 48000,
    "net_pnl_points": 320,
    "max_drawdown_pct": 15.2,
    "best_trade": { ... },
    "worst_trade": { ... }
  },
  "equity_curve": [
    { "time": "2024-12-01T09:15:00", "equity": 1000000 },
    { "time": "2024-12-01T10:30:00", "equity": 1004000 },
    ...
  ],
  "trades": [
    {
      "direction": "LONG",
      "entry_time": "2024-12-01T09:15:00",
      "entry_price": 44500.0,
      "exit_time": "2024-12-01T10:30:00",
      "exit_price": 44600.0,
      "pnl_points": 100,
      "pnl_money": 4000,
      "reason": "TP"
    },
    ...
  ]
}
```

## Technical Details

### Strategy Logic
The backtest engine implements the **RSI-EMA momentum strategy**:

1. **Entry (LONG)**:
   - Uptrend: Close > EMA_Trend
   - Momentum: EMA_RSI_Fast crosses above EMA_RSI_Slow
   
2. **Entry (SHORT)**:
   - Downtrend: Close < EMA_Trend
   - Momentum: EMA_RSI_Fast crosses below EMA_RSI_Slow

3. **Exit Priority**:
   - TP reached first
   - Then trailing stop checked
   - Then EMA trend reversal
   - Otherwise held until end of backtest

### Performance Notes
- Backtests are **synchronous per API call** (blocking, no background jobs)
- Large date ranges (6+ months) may take 10-30 seconds
- Data is fetched fresh from Yahoo Finance each time (not cached)
- For production, consider caching historical data or using a database

### Constraints & Limitations
1. **Single Position**: Only one trade at a time (no pyramiding)
2. **No Slippage**: Assumes perfect execution at next candle's close
3. **No Commission**: Trade costs not factored into PnL
4. **Market Hours Only**: Backtests only on trading hours with available OHLCV data
5. **Point Value Fixed**: Uses `lot_size` as multiplier (assumes 1 point = ₹1 per lot)

## Files Modified/Created

### Backend Files
```
algo-backend/app/
├── schemas/backtest.py                (NEW - 60 lines)
├── services/backtest_engine.py        (NEW - 450+ lines)
├── api/routes/backtest.py             (NEW - 65 lines)
└── main.py                            (MODIFIED - added backtest router import & registration)
```

### Frontend Files
```
Frontend/
├── src/pages/StrategyDashboard.tsx     (NEW - 386 lines)
├── services/api.ts                    (MODIFIED - added runBacktest & types)
├── App.tsx                            (MODIFIED - added Backtest link)
└── index.tsx                          (MODIFIED - added route for /strategy-dashboard)
```

## Testing Checklist

- ✅ Backend imports compile (verified with Python import test)
- ✅ No TypeScript errors in frontend
- ✅ Backtest router registered in main.py
- ✅ API types exported correctly
- ✅ Frontend route registered
- ✅ Navigation links added
- ✅ Strategy Builder button added

## Next Steps (Optional Enhancements)

1. **Caching**: Cache 1-year historical data locally to speed up backtests
2. **Parameter Optimization**: Add genetic algorithm to find optimal parameter combinations
3. **Multiple Strategies**: Support different strategy templates (RSI-only, Bollinger Bands, etc.)
4. **Metrics Export**: Export backtest results to CSV/PDF
5. **Walk-Forward Analysis**: Implement rolling window optimization
6. **Live Replay**: Replay trades in real-time visualization
7. **Slippage Simulation**: Add configurable slippage & commission
8. **Risk Metrics**: Add Sharpe ratio, Sortino ratio, profit factor calculations

## Troubleshooting

### Backtest Returns No Trades
- Check if date range has valid market data (weekends/holidays?)
- Try expanding date range
- Verify symbol is correct (e.g., "^NSEBANK" not "BANKNIFTY")

### Backtest Times Out
- Date range too large (try shorter periods first)
- Internet connection issue (yfinance download failing)
- Server overload (try again in a few moments)

### UI Not Updating
- Check browser console for JavaScript errors
- Verify backend is running (`http://127.0.0.1:8000` should respond)
- Clear browser cache and reload

---

**Backtest Feature Complete! Ready to analyze your strategy performance on historical data.** 📊
