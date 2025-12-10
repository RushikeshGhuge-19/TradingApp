"""
Test script to debug backtest functionality.
Run this to see what the backtest engine returns.
"""

import sys
sys.path.insert(0, r'c:\Users\Acme\OneDrive\Desktop\Ghuge Rushikesh\TradingApp\Backend\algo-backend')

from datetime import datetime, date, timedelta
from app.services.backtest_engine import BacktestEngine
import json

# Test parameters
symbol = "^NSEBANK"
timeframe = "15m"
rsi_period = 14
ema_fast = 3
ema_slow = 7
trend_ema = 20
tp_points = 100.0
trail_offset = 50.0
lot_size = 1

# Date range: last 10 days
end_date = date.today()
start_date = end_date - timedelta(days=10)

print(f"Testing backtest for {symbol} from {start_date} to {end_date}")
print(f"Timeframe: {timeframe}")
print(f"Strategy params: RSI={rsi_period}, EMA_fast={ema_fast}, EMA_slow={ema_slow}, Trend_EMA={trend_ema}")
print(f"TP={tp_points}, Trail={trail_offset}, Lot={lot_size}")
print()

# Create engine
engine = BacktestEngine(
    symbol=symbol,
    timeframe=timeframe,
    rsi_period=rsi_period,
    ema_fast=ema_fast,
    ema_slow=ema_slow,
    trend_ema=trend_ema,
    tp_points=tp_points,
    trail_offset=trail_offset,
    lot_size=lot_size,
    initial_equity=1000000.0,
)

# Run backtest
print("Running backtest...")
result = engine.run(start_date, end_date)

# Display results
print()
print("=" * 60)
print("BACKTEST RESULTS")
print("=" * 60)
print()
print("SUMMARY:")
print(f"  Total Trades: {result.summary.total_trades}")
print(f"  Win Trades: {result.summary.win_trades}")
print(f"  Loss Trades: {result.summary.loss_trades}")
print(f"  Winrate: {result.summary.winrate:.2f}%")
print(f"  Net PnL (Money): ₹{result.summary.net_pnl_money:,.2f}")
print(f"  Net PnL (Points): {result.summary.net_pnl_points:.2f}")
print(f"  Max Drawdown: {result.summary.max_drawdown_pct:.2f}%")
if result.summary.best_trade:
    print(f"  Best Trade: ₹{result.summary.best_trade.pnl_money:,.2f}")
if result.summary.worst_trade:
    print(f"  Worst Trade: ₹{result.summary.worst_trade.pnl_money:,.2f}")

print()
print("EQUITY CURVE:")
if result.equity_curve:
    print(f"  Total points: {len(result.equity_curve)}")
    print(f"  Start equity: ₹{result.equity_curve[0].equity:,.2f}")
    print(f"  End equity: ₹{result.equity_curve[-1].equity:,.2f}")
else:
    print("  No equity curve data")

print()
print("TRADES:")
if result.trades:
    for i, trade in enumerate(result.trades[:5], 1):  # Show first 5 trades
        print(f"  Trade {i}: {trade.direction}")
        print(f"    Entry: {trade.entry_time} @ {trade.entry_price}")
        print(f"    Exit: {trade.exit_time} @ {trade.exit_price}")
        print(f"    PnL: ₹{trade.pnl_money:,.2f} ({trade.pnl_points:.2f} pts)")
        print(f"    Reason: {trade.reason}")
        print()
else:
    print("  No trades found!")

print("=" * 60)

# Export to JSON for debugging
output = {
    "summary": {
        "total_trades": result.summary.total_trades,
        "win_trades": result.summary.win_trades,
        "loss_trades": result.summary.loss_trades,
        "winrate": result.summary.winrate,
        "net_pnl_money": result.summary.net_pnl_money,
        "net_pnl_points": result.summary.net_pnl_points,
        "max_drawdown_pct": result.summary.max_drawdown_pct,
    },
    "trades_count": len(result.trades),
    "equity_curve_count": len(result.equity_curve),
}

with open(r"c:\Users\Acme\OneDrive\Desktop\Ghuge Rushikesh\TradingApp\backtest_debug.json", "w") as f:
    json.dump(output, f, indent=2)
    
print("Debug output saved to backtest_debug.json")
