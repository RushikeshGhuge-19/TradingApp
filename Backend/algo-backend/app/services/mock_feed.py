"""
Mock market data feed that generates synthetic ticks and builds candles.
Integrates with CandleBuilder to produce OHLC candles from price ticks.

Safety features:
  - Configurable tick rate (default 1s) with sleep between ticks
  - Bounded memory: only keeps current and last closed candle in memory
  - Async-safe: uses asyncio.sleep in async context
  - Non-blocking callback handling for external systems
"""

import asyncio
import random
import logging
from datetime import datetime, timedelta
from typing import Optional, Callable, Any
from app.services.candles import CandleBuilder, Candle

logger = logging.getLogger(__name__)


class MockFeed:
    """
    Generates synthetic market data ticks and builds candles.
    
    Simulates a price stream that can be consumed to build OHLC candles
    via CandleBuilder. Can notify a callback when new candles close.
    
    Memory-bounded:
      - Only stores current_price and current_time
      - CandleBuilder stores only current and last closed candle
      - No unbounded list accumulation
    
    Async-safe:
      - generate_tick_async() supports async context with configurable sleep rate
      - Tick rate default: 1 second (set via tick_rate_seconds)
    """

    def __init__(
        self,
        timeframe_minutes: int = 15,
        start_price: float = 100.0,
        tick_rate_seconds: float = 1.0,
    ):
        """
        Initialize the mock feed.

        Args:
            timeframe_minutes: Candle timeframe in minutes (e.g., 15, 30)
            start_price: Starting price for the simulation
            tick_rate_seconds: Time between synthetic ticks in seconds (default 1.0s)
        """
        self.timeframe_minutes = timeframe_minutes
        self.start_price = start_price
        self.current_price = start_price
        self.current_time = datetime.utcnow().replace(second=0, microsecond=0)
        self.candle_builder = CandleBuilder(timeframe_minutes=timeframe_minutes)
        self.on_candle_closed: Optional[Callable[[Candle], None]] = None
        self.tick_rate_seconds = max(0.5, tick_rate_seconds)  # Enforce minimum 0.5s
        self.tick_count = 0
        
        logger.info(
            f"MockFeed initialized: timeframe={timeframe_minutes}m, "
            f"start_price={start_price}, tick_rate={self.tick_rate_seconds}s"
        )

    def set_on_candle_closed(self, callback: Callable[[Candle], None]):
        """
        Set a callback to be called when a candle closes.

        Args:
            callback: A function that accepts a Candle object
        """
        self.on_candle_closed = callback

    def generate_tick(self) -> dict:
        """
        Generate the next synthetic price tick and process it through the candle builder.
        
        Synchronous version for backwards compatibility.
        For async contexts, use generate_tick_async().

        Returns:
            A dict with price, timestamp, and any closed candle info
        """
        # Simulate small random price movement
        price_change = random.uniform(-0.5, 0.5)
        self.current_price = max(self.current_price + price_change, 1.0)
        
        # Advance time by tick_rate increment
        self.current_time += timedelta(seconds=self.tick_rate_seconds)
        
        # Feed the tick into the candle builder (memory-bounded: only stores current state)
        closed_candle = self.candle_builder.update_with_tick(self.current_price, self.current_time)
        
        self.tick_count += 1
        
        result = {
            "price": self.current_price,
            "timestamp": self.current_time.isoformat(),
            "closed_candle": None,
            "tick_count": self.tick_count,
        }

        # If a candle closed, notify the callback and include it in the result
        if closed_candle is not None:
            result["closed_candle"] = closed_candle.to_dict()
            logger.debug(
                f"Candle closed: {closed_candle.start_time} OHLC={closed_candle.open:.2f}/"
                f"{closed_candle.high:.2f}/{closed_candle.low:.2f}/{closed_candle.close:.2f}"
            )
            if self.on_candle_closed:
                try:
                    self.on_candle_closed(closed_candle)
                except Exception as e:
                    logger.warning(f"Error in on_candle_closed callback: {e}")

        return result

    async def generate_tick_async(self) -> dict:
        """
        Generate the next synthetic price tick asynchronously with sleep.
        
        This is the recommended method for long-running mock feed loops.
        Includes configurable sleep to prevent tight loops and OOM issues.

        Returns:
            A dict with price, timestamp, and any closed candle info
        """
        tick_result = self.generate_tick()
        await asyncio.sleep(self.tick_rate_seconds)
        return tick_result

    def get_current_candle(self) -> Optional[dict]:
        """
        Get the current in-progress candle.

        Returns:
            A dict representation of the current candle, or None
        """
        candle = self.candle_builder.get_current_candle()
        return candle.to_dict() if candle else None

    def reset(self, start_price: Optional[float] = None):
        """
        Reset the feed to initial state (useful for testing).
        
        Args:
            start_price: New starting price (default: original start_price)
        """
        self.current_price = start_price or self.start_price
        self.current_time = datetime.utcnow().replace(second=0, microsecond=0)
        self.candle_builder = CandleBuilder(timeframe_minutes=self.timeframe_minutes)
        self.tick_count = 0
        logger.info(f"MockFeed reset: price={self.current_price}, time={self.current_time}")

    def get_price(self, symbol: str) -> dict:
        """Legacy function for backwards compatibility."""
        tick = self.generate_tick()
        return {"symbol": symbol, "price": tick["price"], "timestamp": tick["timestamp"]}

