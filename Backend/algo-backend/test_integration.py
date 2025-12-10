"""
End-to-end integration test: MockFeed → CandleBuilder → StrategyEngine
Verifies the complete candle pipeline works correctly.
"""

from app.services.candles import CandleBuilder, Candle
from app.services.mock_feed import MockFeed
from app.services.strategy_engine import StrategyEngine
from datetime import datetime

print("=" * 70)
print("CANDLE BUILDER INTEGRATION TEST")
print("=" * 70)

# Initialize components
print("\n1. Initializing components...")
feed = MockFeed(timeframe_minutes=15, start_price=100.0)
engine = StrategyEngine()
metrics = {
    "ticks_generated": 0,
    "candles_closed": 0,
    "candles_processed": 0,
    "max_price": 100.0,
    "min_price": 100.0,
}

print("   ✓ MockFeed created (15-min timeframe, start price 100.0)")
print("   ✓ StrategyEngine created")

# Setup callbacks
def on_candle_closed(candle: Candle):
    """Called when a candle closes."""
    metrics["candles_closed"] += 1
    
    # Process with strategy engine
    result = engine.on_new_candle(candle)
    metrics["candles_processed"] += 1
    
    # Print candle info
    print(f"\n   📊 Candle #{metrics['candles_closed']} CLOSED:")
    print(f"      Time: {candle.start_time.strftime('%H:%M:%S')}")
    print(f"      OHLC: {candle.open:.2f} → {candle.close:.2f} "
          f"(H:{candle.high:.2f}, L:{candle.low:.2f})")
    print(f"      ↓ Strategy result: {result['status']}")

feed.set_on_candle_closed(on_candle_closed)
print("   ✓ Callbacks registered")

# Generate ticks
print("\n2. Generating 2700 ticks (~45 minutes = 3 candles of 15 minutes each)...")
print("   (Running in silent mode...)")

for i in range(2700):
    tick = feed.generate_tick()
    metrics["ticks_generated"] += 1
    metrics["max_price"] = max(metrics["max_price"], tick["price"])
    metrics["min_price"] = min(metrics["min_price"], tick["price"])
    
    # Progress indicator every 450 ticks
    if (i + 1) % 450 == 0:
        print(f"      ... {i + 1} ticks processed")

# Get final state
current = feed.get_current_candle()
last_processed = engine.get_last_candle()

print("\n3. Final State:")
print(f"   Total ticks generated: {metrics['ticks_generated']}")
print(f"   Total candles closed: {metrics['candles_closed']}")
print(f"   Total candles processed by strategy: {metrics['candles_processed']}")
print(f"   Price range: {metrics['min_price']:.2f} - {metrics['max_price']:.2f}")

print("\n4. In-Progress Candle:")
if current:
    print(f"   Time: {current['start_time']}")
    print(f"   OHLC: {current['open']:.2f} / {current['high']:.2f} / "
          f"{current['low']:.2f} / {current['close']:.2f}")
else:
    print("   None")

print("\n5. Last Processed Candle (by StrategyEngine):")
if last_processed:
    print(f"   Time: {last_processed['start_time']}")
    print(f"   OHLC: {last_processed['open']:.2f} / {last_processed['high']:.2f} / "
          f"{last_processed['low']:.2f} / {last_processed['close']:.2f}")
else:
    print("   None")

# Verification
print("\n6. Verification:")
checks_passed = 0
checks_total = 4

if metrics['ticks_generated'] == 2700:
    print("   ✓ All 2700 ticks were generated")
    checks_passed += 1
else:
    print(f"   ✗ Expected 2700 ticks, got {metrics['ticks_generated']}")

if metrics['candles_closed'] >= 2:  # At least 2 candles should close in 45 minutes
    print(f"   ✓ {metrics['candles_closed']} candles closed (expected ≥2)")
    checks_passed += 1
else:
    print(f"   ✗ Only {metrics['candles_closed']} candles closed")

if metrics['candles_processed'] == metrics['candles_closed']:
    print(f"   ✓ All closed candles were processed by StrategyEngine")
    checks_passed += 1
else:
    print(f"   ✗ Candles closed ({metrics['candles_closed']}) != "
          f"processed ({metrics['candles_processed']})")

if metrics['max_price'] > 100.0 and metrics['min_price'] < 100.0:
    print(f"   ✓ Price variation detected (range: {metrics['min_price']:.2f}-{metrics['max_price']:.2f})")
    checks_passed += 1
else:
    print(f"   ✗ Insufficient price variation")

print(f"\n   Result: {checks_passed}/{checks_total} checks passed")

if checks_passed == checks_total:
    print("\n" + "=" * 70)
    print("✓ ALL INTEGRATION TESTS PASSED!")
    print("=" * 70)
    exit(0)
else:
    print("\n" + "=" * 70)
    print("✗ SOME TESTS FAILED")
    print("=" * 70)
    exit(1)
