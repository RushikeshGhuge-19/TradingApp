# Backtest Feature - Quick Start Guide

## 🚀 Getting Started

### Step 1: Start the Backend
```bash
cd TradingApp/Backend/algo-backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### Step 2: Start the Frontend (in a new terminal)
```bash
cd TradingApp/Frontend
npm run dev
```

### Step 3: Access the Application
- Open http://localhost:5173
- Navigate to **📊 Backtest** from the header

## 📊 Backtest Features

### Available Options
| Option | Default | Options |
|--------|---------|---------|
| Symbol | ^NSEBANK | Any Yahoo Finance ticker |
| Timeframe | 15m | 5m, 15m, 30m, 1h |
| Start Date | -5 days | Any date with market data |
| End Date | Today | Any date with market data |

### Strategy Parameters (from StrategyConfig)
| Parameter | Default | Purpose |
|-----------|---------|---------|
| RSI Period | 14 | RSI calculation period |
| EMA Fast | 3 | Fast EMA on RSI for momentum |
| EMA Slow | 7 | Slow EMA on RSI for trend |
| Trend EMA | 20 | EMA on close for direction |
| TP Points | 100 | Take profit distance |
| Trail Offset | 50 | Trailing stop distance |
| Lot Size | 1 | Position size multiplier |

## 📈 Results Interpretation

### Summary Statistics
- **Total Trades**: Number of completed round-trip trades
- **Winrate**: Percentage of profitable trades
- **Net PnL**: Total profit/loss in rupees
- **Max Drawdown**: Largest peak-to-trough decline in equity
- **Best/Worst Trade**: Single best and worst performing trades

### Equity Curve
- Shows your portfolio value over time
- Green slope = increasing equity
- Dips indicate losses
- Use to spot periods of volatility or drawdown

### Trades Table
- Review each trade with entry/exit details
- Exit reasons:
  - **TP**: Take profit target reached
  - **TRAIL**: Trailing stop triggered
  - **EMA_EXIT**: Trend EMA reversal exit
  - **END_OF_BACKTEST**: Position closed at end of date range

## 🎯 Workflow Examples

### Example 1: Quick Test (Last Week)
1. Click "Run Backtest" (uses defaults)
2. Wait 5-10 seconds
3. Review results

### Example 2: Optimize Parameters
1. Go to ⚙️ Strategy page
2. Adjust RSI period, EMA periods, TP, Trail values
3. Click "Save Strategy"
4. Go back to 📊 Backtest
5. Run test again with new parameters
6. Compare results

### Example 3: Test Different Symbol
1. In backtest controls, change symbol to "^NIFTY50"
2. Adjust date range (e.g., last 3 months)
3. Click "Run Backtest"
4. Analyze performance on different index

## 💡 Tips & Tricks

### Best Practices
- Start with **recent data** (last 1-3 months) for faster backtests
- Test on **multiple date ranges** to verify consistency
- Compare **different timeframes** (15m vs 30m) on same dates
- Review **best trades** to identify patterns
- Check **max drawdown** to understand risk tolerance

### Finding Good Parameters
1. Test current settings on 1-month history
2. If winrate < 50%, adjust trend EMA (higher = more selective)
3. If taking losses too quickly, increase TP or Trail offset
4. If missing trades, lower RSI period or EMA periods
5. Test each change isolated, not multiple at once

### Interpreting Results
- **Winrate > 60%**: Strong strategy on tested period
- **Winrate 40-60%**: Marginal strategy, needs filtering
- **Max Drawdown < 5%**: Low risk
- **Max Drawdown > 20%**: High risk, consider tighter stops
- **Best/Worst trade ratio**: If best is 10x worst, strategy is consistent

## ⚠️ Important Notes

### What Backtest DOES
✅ Test strategy logic on historical data
✅ Count number of trades and win/loss ratio
✅ Calculate PnL assuming perfect execution
✅ Show equity growth/decline
✅ Display all trade details

### What Backtest DOES NOT
❌ Account for slippage or commission costs
❌ Include gaps between candles (no overnight gaps)
❌ Use real order fills (simulated at close price)
❌ Handle liquidity constraints
❌ Include trading hours exclusions (weekends, holidays filtered by yfinance)

## 🐛 Troubleshooting

### Issue: "No trades found"
- Try expanding date range (1-3 months minimum)
- Check that market was open on those dates
- Verify symbol exists on Yahoo Finance

### Issue: "Backtest failed: HTTP 500"
- Check backend logs for detailed error
- Verify date range is valid
- Try shorter date range (1-2 weeks)

### Issue: Results show 0 equity (shouldn't happen)
- This indicates backend error
- Check backend console for exceptions
- Restart backend server

### Issue: UI is slow or freezing
- Don't run backtest on > 6 months data without waiting
- Close other browser tabs to free memory
- Refresh page if stuck

## 📱 API Usage (Direct)

### POST /api/backtest
```bash
curl -X POST http://127.0.0.1:8000/api/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "^NSEBANK",
    "timeframe": "15m",
    "start_date": "2024-12-01",
    "end_date": "2024-12-10"
  }'
```

Response includes:
- summary (stats)
- equity_curve (time-series)
- trades (list of completed trades)

## 🔗 Related Pages
- ⚙️ **Strategy Builder** (`/strategy`): Configure strategy parameters
- 📊 **Dashboard** (`/`): View live trading status
- 📈 **Charts** (`/charts`): View market candles

---

**Happy backtesting! 📊✨**
