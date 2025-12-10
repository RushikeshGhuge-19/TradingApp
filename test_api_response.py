"""
Test the backtest API endpoint directly
"""
import sys
sys.path.insert(0, r'c:\Users\Acme\OneDrive\Desktop\Ghuge Rushikesh\TradingApp\Backend\algo-backend')

from datetime import datetime, date, timedelta
from app.schemas.backtest import BacktestRequest
from app.services.backtest_engine import BacktestEngine
from app.db.session import SessionLocal
from app.models.strategy_config import StrategyConfig
import json

# Simulate the API endpoint logic
db = SessionLocal()

# Get strategy config
strategy_config = db.query(StrategyConfig).first()
if not strategy_config:
    strategy_config = StrategyConfig()
    db.add(strategy_config)
    db.commit()
    db.refresh(strategy_config)

# Create request
end_date = date.today()
start_date = end_date - timedelta(days=10)

request = BacktestRequest(
    symbol="^NSEBANK",
    timeframe="15m",
    start_date=start_date,
    end_date=end_date,
)

# Use config defaults
symbol = request.symbol or strategy_config.symbol
timeframe = request.timeframe or strategy_config.timeframe
rsi_period = request.rsi_period or strategy_config.rsi_period
ema_fast = request.ema_fast or strategy_config.ema_fast
ema_slow = request.ema_slow or strategy_config.ema_slow
trend_ema = request.trend_ema or strategy_config.trend_ema
tp_points = request.tp_points or strategy_config.tp_points
trail_offset = request.trail_offset or strategy_config.trail_offset
lot_size = request.lot_size or strategy_config.lot_size

print("Request parameters:")
print(f"  Symbol: {symbol}")
print(f"  Timeframe: {timeframe}")
print(f"  Date range: {start_date} to {end_date}")
print()

# Run backtest
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

result = engine.run(start_date, end_date)

# Convert to JSON format (what the API returns)
def serialize_trade(trade):
    if not trade:
        return None
    return {
        "direction": trade.direction,
        "entry_time": trade.entry_time.isoformat() if isinstance(trade.entry_time, datetime) else str(trade.entry_time),
        "entry_price": float(trade.entry_price),
        "exit_time": trade.exit_time.isoformat() if isinstance(trade.exit_time, datetime) else str(trade.exit_time),
        "exit_price": float(trade.exit_price),
        "pnl_points": float(trade.pnl_points),
        "pnl_money": float(trade.pnl_money),
        "reason": trade.reason,
    }

result_dict = {
    "summary": {
        "total_trades": result.summary.total_trades,
        "win_trades": result.summary.win_trades,
        "loss_trades": result.summary.loss_trades,
        "winrate": result.summary.winrate,
        "net_pnl_money": result.summary.net_pnl_money,
        "net_pnl_points": result.summary.net_pnl_points,
        "max_drawdown_pct": result.summary.max_drawdown_pct,
        "best_trade": serialize_trade(result.summary.best_trade),
        "worst_trade": serialize_trade(result.summary.worst_trade),
    },
    "equity_curve": [
        {
            "time": ep.time.isoformat() if isinstance(ep.time, datetime) else str(ep.time),
            "equity": ep.equity
        }
        for ep in result.equity_curve
    ],
    "trades": [serialize_trade(t) for t in result.trades],
}

print("API Response JSON:")
print(json.dumps(result_dict, indent=2))

# Save for inspection
with open(r"c:\Users\Acme\OneDrive\Desktop\Ghuge Rushikesh\TradingApp\backtest_api_response.json", "w") as f:
    json.dump(result_dict, f, indent=2)

print("\n\nResponse saved to backtest_api_response.json")
print(f"Total trades: {result_dict['summary']['total_trades']}")
print(f"Equity curve points: {len(result_dict['equity_curve'])}")

db.close()
