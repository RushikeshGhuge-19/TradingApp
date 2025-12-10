"""
CandleBuilder: Converts price ticks into OHLC candles for a given timeframe.
Minimal, reusable, and with no external dependencies beyond stdlib.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Optional


@dataclass
class Candle:
    """Represents a closed OHLC candle."""
    start_time: datetime
    open: float
    high: float
    low: float
    close: float

    def to_dict(self) -> dict:
        """Convert candle to dictionary for JSON serialization."""
        return {
            "start_time": self.start_time.isoformat(),
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "time": self.start_time.isoformat(),  # Alias for compatibility
        }


class CandleBuilder:
    """
    Builds candles from price ticks.
    
    Receives ticks (price + timestamp), accumulates them into candles,
    and emits a closed candle when the timeframe rolls over.
    """

    def __init__(self, timeframe_minutes: int):
        """
        Initialize CandleBuilder.

        Args:
            timeframe_minutes: The timeframe for candle generation (e.g., 15, 30, 60)
        """
        self.timeframe_minutes = timeframe_minutes
        
        # State for the current (building) candle
        self.current_start_time: Optional[datetime] = None
        self.current_open: Optional[float] = None
        self.current_high: Optional[float] = None
        self.current_low: Optional[float] = None
        self.current_close: Optional[float] = None

    def _compute_bucket_start(self, ts: datetime) -> datetime:
        """
        Compute the candle bucket start time for a given timestamp.

        Example: timeframe_minutes = 15
            09:07 → 09:00
            09:14 → 09:00
            09:15 → 09:15

        Args:
            ts: The timestamp to bucket

        Returns:
            The start datetime of the candle bucket
        """
        bucket_minute = (ts.minute // self.timeframe_minutes) * self.timeframe_minutes
        return ts.replace(minute=bucket_minute, second=0, microsecond=0)

    def update_with_tick(self, price: float, ts: datetime) -> Optional[Candle]:
        """
        Update the builder with a new tick (price + timestamp).

        Returns a closed candle if the timeframe has rolled over, None otherwise.

        Args:
            price: The price tick
            ts: The timestamp of the tick

        Returns:
            A closed Candle if one has completed, None otherwise
        """
        bucket_start = self._compute_bucket_start(ts)

        # No current candle yet
        if self.current_start_time is None:
            self.current_start_time = bucket_start
            self.current_open = price
            self.current_high = price
            self.current_low = price
            self.current_close = price
            return None

        # Still in the same candle bucket
        if bucket_start == self.current_start_time:
            self.current_high = max(self.current_high, price)
            self.current_low = min(self.current_low, price)
            self.current_close = price
            return None

        # Bucket has rolled over; close the previous candle and start a new one
        if bucket_start > self.current_start_time:
            closed_candle = Candle(
                start_time=self.current_start_time,
                open=self.current_open,
                high=self.current_high,
                low=self.current_low,
                close=self.current_close,
            )

            # Start new candle
            self.current_start_time = bucket_start
            self.current_open = price
            self.current_high = price
            self.current_low = price
            self.current_close = price

            return closed_candle

        # Should not happen if ticks are in chronological order
        # But handle it gracefully
        return None

    def get_current_candle(self) -> Optional[Candle]:
        """
        Get the in-progress (open) candle.

        Returns:
            The current candle being built, or None if no ticks have been processed yet
        """
        if self.current_start_time is None:
            return None
        
        return Candle(
            start_time=self.current_start_time,
            open=self.current_open,
            high=self.current_high,
            low=self.current_low,
            close=self.current_close,
        )
