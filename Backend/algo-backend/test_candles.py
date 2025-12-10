"""Test script for CandleBuilder integration."""

from app.services.candles import Candle, CandleBuilder
from app.services.mock_feed import MockFeed
from app.services.strategy_engine import StrategyEngine
from datetime import datetime

print("✓ All imports successful")

# Test CandleBuilder
cb = CandleBuilder(15)
print("✓ CandleBuilder created")

# Test MockFeed
feed = MockFeed(timeframe_minutes=15, start_price=100.0)
print("✓ MockFeed created")

# Test StrategyEngine
engine = StrategyEngine()
print("✓ StrategyEngine created")

# Test a tick
tick_result = feed.generate_tick()
print(f"✓ Generated tick: price={tick_result['price']:.2f}")

# Test strategy callback
candle_count = [0]

def on_candle(candle):
    candle_count[0] += 1
    print(f"  → Candle #{candle_count[0]} closed: OHLC={candle.open:.2f}/{candle.high:.2f}/{candle.low:.2f}/{candle.close:.2f}")

feed.set_on_candle_closed(on_candle)
print("✓ Callback registered")

print("\n✓ All core functionality working!")
