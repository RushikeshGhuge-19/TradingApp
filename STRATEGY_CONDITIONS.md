# Strategy Entry & Exit Conditions

## Overview
Your RSI-EMA strategy now displays clear entry and exit conditions across the application. The conditions are defined in the backend backtest engine and are visually displayed on both the **Strategy Builder** and **Strategy Dashboard** pages.

---

## Entry Conditions

### LONG Entry
**Trigger:** RSI crosses **above 40**
- Condition: `prev_candle.RSI ≤ 40 AND current_candle.RSI > 40`
- Use Case: Oversold bounce, potential uptrend start
- Only enters when NOT already in a position

### SHORT Entry
**Trigger:** RSI crosses **below 60**
- Condition: `prev_candle.RSI ≥ 60 AND current_candle.RSI < 60`
- Use Case: Overbought reversal, potential downtrend start
- Only enters when NOT already in a position

---

## Exit Conditions

Once a position is open, the strategy monitors **three exit conditions** and exits on the **first one triggered**:

### 1. Take Profit (TP)
**Default:** 100 points

**LONG:** Exit when `Close ≥ Entry_Price + TP_Points`
- Example: Buy at 1000, exit at 1100 (if TP = 100)

**SHORT:** Exit when `Close ≤ Entry_Price - TP_Points`
- Example: Sell at 1000, exit at 900 (if TP = 100)

---

### 2. Trailing Stop Loss
**Default:** 50 points offset

**LONG:** Exit if `Current_Price ≤ Highest_Price_Since_Entry - Trail_Offset`
- Tracks highest price reached during position
- Exits if price drops Trail_Offset points from the peak
- Example: Buy at 1000, price goes to 1150, exit at 1100 (if offset = 50)

**SHORT:** Exit if `Current_Price ≥ Lowest_Price_Since_Entry + Trail_Offset`
- Tracks lowest price reached during position
- Exits if price rises Trail_Offset points from the bottom
- Example: Sell at 1000, price goes down to 900, exit at 950 (if offset = 50)

---

### 3. EMA Trend Reversal
**Default:** 20-period EMA on Close price

**LONG:** Exit when `Close < EMA_Trend`
- Exits if price closes below the trend EMA
- Indicates uptrend weakness

**SHORT:** Exit when `Close > EMA_Trend`
- Exits if price closes above the trend EMA
- Indicates downtrend weakness

---

## Exit Priority
The strategy exits on **whichever condition triggers first**:
1. Take Profit (most profitable)
2. Trailing Stop (preserves gains / limits losses)
3. EMA Exit (trend-based, safest exit)

---

## Key Indicators Used

| Indicator | Period | Application | Input |
|-----------|--------|-------------|-------|
| RSI | 14 (default, configurable) | Entry signals | Close price |
| EMA (Fast) | 3 (RSI) | RSI smoothing | RSI values |
| EMA (Slow) | 7 (RSI) | RSI smoothing | RSI values |
| EMA (Trend) | 20 (default, configurable) | Exit signal & trend | Close price |

---

## Position Sizing

- **Lot Size:** Default 1 (configurable in Strategy Builder)
- **Capital:** Default ₹100,000 (configurable during backtest)
- **P&L Calculation:** `pnl_money = (exit_price - entry_price) × lot_size`

---

## Example Trade Scenario

### Scenario 1: Take Profit Exit
```
Entry:
- LONG entry triggered: RSI crosses above 40
- Entry price: ₹1000
- Entry time: 14:00

Management:
- TP_Points = 100
- Trail_Offset = 50
- EMA_Trend = 20-period

Exit:
- Price rises to ₹1100
- Take Profit triggered: Close ≥ 1000 + 100 ✓
- Exit reason: TP
- P&L: ₹100 × lot_size
```

### Scenario 2: Trailing Stop Exit
```
Entry:
- SHORT entry triggered: RSI crosses below 60
- Entry price: ₹1000
- Entry time: 10:30

Management:
- Highest = 1000 (entry)
- Current = 950 (price drops)
- Highest = 1000 (stays same)
- Current = 920 (price drops more)
- Trail_Offset = 50

Exit:
- Current (920) ≤ Highest (1000) - Offset (50) = 950 ✓
- Trailing stop triggered
- Exit reason: TRAIL
- P&L: (1000 - 920) × lot_size = ₹80 × lot_size
```

### Scenario 3: EMA Trend Exit
```
Entry:
- LONG entry triggered: RSI > 40
- Entry price: ₹1000

Management:
- EMA_Trend = 20-period = ₹1020 (calculated)
- Price = ₹1015 > EMA_Trend ✓

Next candle:
- Close = ₹1010
- EMA_Trend = ₹1012 (updated)
- Close (1010) < EMA_Trend (1012) ✓
- EMA exit triggered
- Exit reason: EMA_EXIT
- P&L: (1010 - 1000) × lot_size = ₹10 × lot_size
```

---

## Where to See This

1. **Strategy Builder** (`/strategy`) - Full detailed view with:
   - Entry conditions with explanations
   - All three exit conditions with thresholds
   - How parameters affect the conditions
   - Interactive parameter updates

2. **Strategy Dashboard** (`/strategy-dashboard`) - Quick reference showing:
   - Current strategy parameters
   - Entry triggers
   - Exit thresholds from last backtest
   - Applied on backtest results

3. **Backtest Results** - Trade-by-trade details showing:
   - Actual entry/exit reasons
   - Exit reason per trade (TP, TRAIL, EMA_EXIT, etc.)
   - Calculated P&L based on position sizing

---

## Customization

All parameters can be modified in the **Strategy Builder**:
- RSI Period
- EMA Fast (RSI)
- EMA Slow (RSI)
- Trend EMA Period
- Take Profit Points
- Trailing Stop Offset
- Lot Size

**Changes apply to new backtests after saving.**

---

## Backend Implementation

**File:** `d:\TradingApp\Backend\algo-backend\app\services\backtest_engine.py`

- `check_buy_signal()` - Line ~154: LONG entry condition
- `check_sell_signal()` - Line ~168: SHORT entry condition
- `check_exit_conditions()` - Line ~182: All three exit conditions
- `run()` - Line ~247: Main backtest loop using these conditions

All conditions are **live and active** during backtests.
