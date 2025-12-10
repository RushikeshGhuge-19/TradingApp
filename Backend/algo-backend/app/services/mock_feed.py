"""
Mock market data feed that generates synthetic ticks and builds candles.
Integrates with CandleBuilder to produce OHLC candles from price ticks.
"""

import random
from datetime import datetime, timedelta
from typing import Optional, Callable
from app.services.candles import CandleBuilder, Candle


class MockFeed:
    """
    Generates synthetic market data ticks and builds candles.
    
    Simulates a price stream that can be consumed to build OHLC candles
    via CandleBuilder. Can notify a callback when new candles close.
    """

    def __init__(self, timeframe_minutes: int = 15, start_price: float = 100.0):
        """
        Initialize the mock feed.

        Args:
            timeframe_minutes: Candle timeframe in minutes (e.g., 15, 30)
            start_price: Starting price for the simulation
        """
        self.timeframe_minutes = timeframe_minutes
        self.current_price = start_price
        self.current_time = datetime.utcnow().replace(second=0, microsecond=0)
        self.candle_builder = CandleBuilder(timeframe_minutes=timeframe_minutes)
        self.on_candle_closed: Optional[Callable[[Candle], None]] = None

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

        Returns:
            A dict with price, timestamp, and any closed candle info
        """
        # Simulate small random price movement
        price_change = random.uniform(-0.5, 0.5)
        self.current_price = max(self.current_price + price_change, 1.0)  # Prevent negative prices
        
        # Advance time by a small increment (e.g., 1 second)
        self.current_time += timedelta(seconds=1)
        
        # Feed the tick into the candle builder
        closed_candle = self.candle_builder.update_with_tick(self.current_price, self.current_time)
        
        result = {
            "price": self.current_price,
            "timestamp": self.current_time.isoformat(),
            "closed_candle": None,
        }

        # If a candle closed, notify the callback and include it in the result
        if closed_candle is not None:
            result["closed_candle"] = closed_candle.to_dict()
            if self.on_candle_closed:
                self.on_candle_closed(closed_candle)

        return result

    def get_current_candle(self) -> Optional[dict]:
        """
        Get the current in-progress candle.

        Returns:
            A dict representation of the current candle, or None
        """
        candle = self.candle_builder.get_current_candle()
        return candle.to_dict() if candle else None

    def get_price(self, symbol: str) -> dict:
        """Legacy function for backwards compatibility."""
        tick = self.generate_tick()
        return {"symbol": symbol, "price": tick["price"], "timestamp": tick["timestamp"]}

