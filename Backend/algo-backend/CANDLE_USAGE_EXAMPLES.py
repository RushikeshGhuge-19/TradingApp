"""
CANDLE BUILDER - PRACTICAL USAGE EXAMPLES
==========================================

Example 1: Basic CandleBuilder Usage
─────────────────────────────────────
"""

from app.services.candles import CandleBuilder
from datetime import datetime, timedelta

# Create a 15-minute candle builder
builder = CandleBuilder(timeframe_minutes=15)

# Simulate ticks at 09:00 through 09:07
base_time = datetime(2024, 12, 10, 9, 0, 0)
prices = [100.0, 100.5, 100.3, 100.8, 101.0, 100.9, 101.2, 100.7]

for i, price in enumerate(prices):
    ts = base_time + timedelta(seconds=i*30)
    closed = builder.update_with_tick(price, ts)
    print(f"Tick {i+1}: price={price}, time={ts.strftime('%H:%M:%S')}, closed_candle={closed}")

# Output:
# Tick 1: price=100.0, time=09:00:00, closed_candle=None
# Tick 2: price=100.5, time=09:00:30, closed_candle=None
# ... (all return None because still in 09:00 bucket)
# Current candle: open=100.0, high=101.2, low=100.0, close=100.7

current = builder.get_current_candle()
print(f"Current candle: {current}")


# ─────────────────────────────────────────────────────────────────
# Example 2: MockFeed with Callback
# ─────────────────────────────────────────────────────────────────

from app.services.mock_feed import MockFeed

feed = MockFeed(timeframe_minutes=15, start_price=100.0)
closed_candles = []

def on_candle_closed(candle):
    print(f"📈 Candle closed: {candle.start_time} | O:{candle.open:.2f} H:{candle.high:.2f} L:{candle.low:.2f} C:{candle.close:.2f}")
    closed_candles.append(candle)

feed.set_on_candle_closed(on_candle_closed)

# Generate 100 ticks (will close ~1-2 candles)
for _ in range(100):
    tick = feed.generate_tick()
    # Closed candle auto-reported via callback above

print(f"Total candles closed: {len(closed_candles)}")
print(f"Current candle: {feed.get_current_candle()}")


# ─────────────────────────────────────────────────────────────────
# Example 3: StrategyEngine Processing
# ─────────────────────────────────────────────────────────────────

from app.services.strategy_engine import StrategyEngine

feed = MockFeed(timeframe_minutes=15, start_price=100.0)
engine = StrategyEngine()

def process_candle(candle):
    # Pass closed candle to strategy
    result = engine.on_new_candle(candle)
    print(f"Strategy processed candle: {result['status']}")
    print(f"  Trade count: {result['trade_count']}")
    # In a real strategy, you would:
    # - Calculate indicators (SMA, RSI, MACD, etc.)
    # - Check entry/exit conditions
    # - Generate buy/sell signals
    # - Execute trades

feed.set_on_candle_closed(process_candle)

# Simulate market data flow
for i in range(300):
    tick = feed.generate_tick()
    # Candles auto-close and trigger strategy via callback
    if i % 100 == 0 and i > 0:
        print(f"  ... processed {i} ticks")

print(f"\nTotal candles processed: {engine.trade_count}")


# ─────────────────────────────────────────────────────────────────
# Example 4: Real Tick Stream Integration
# ─────────────────────────────────────────────────────────────────

# In a real app, you'd connect to a data provider:

# from app.services.candles import CandleBuilder
# import websocket
# import json
# from datetime import datetime

# builder = CandleBuilder(timeframe_minutes=15)

# def on_tick(msg):
#     data = json.loads(msg)
#     price = float(data['price'])
#     ts = datetime.fromisoformat(data['timestamp'])
#     
#     closed_candle = builder.update_with_tick(price, ts)
#     if closed_candle:
#         print(f"Candle closed: {closed_candle.to_dict()}")
#         # Pass to strategy engine, database, etc.

# ws = websocket.WebSocketApp(
#     "wss://real-data-provider/stream",
#     on_message=on_tick
# )
# ws.run_forever()


# ─────────────────────────────────────────────────────────────────
# Example 5: Persisting Candles to Database
# ─────────────────────────────────────────────────────────────────

# from app.services.mock_feed import MockFeed
# from app.db.session import SessionLocal
# from app.models.equity import EquityPoint
# from datetime import datetime

# feed = MockFeed(timeframe_minutes=15, start_price=100.0)
# db = SessionLocal()

# def save_candle(candle):
#     # Create a database record
#     equity_point = EquityPoint(
#         time=candle.start_time.isoformat(),
#         equity=candle.close,  # Could calculate actual equity from candle
#     )
#     db.add(equity_point)
#     db.commit()

# feed.set_on_candle_closed(save_candle)

# for _ in range(1000):
#     feed.generate_tick()


print("\n✓ Examples complete!")
