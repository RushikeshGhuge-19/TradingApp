"""
Strategy engine for algorithmic trading.
Processes candles and executes trading logic.
"""

from typing import Optional, Dict, Any
from app.services.candles import Candle


class StrategyEngine:
    """
    Executes trading strategy logic.
    Processes OHLC candles and generates trading decisions.
    """

    def __init__(self):
        """Initialize the strategy engine."""
        self.last_candle: Optional[Candle] = None
        self.trade_count = 0

    def on_new_candle(self, candle: Candle) -> Dict[str, Any]:
        """
        Process a newly closed candle.

        Args:
            candle: The closed Candle object

        Returns:
            A dict with strategy signals/actions
        """
        self.last_candle = candle
        self.trade_count += 1
        
        # Placeholder: log the candle
        # In a real strategy, you would:
        # - Calculate indicators (SMA, RSI, etc.)
        # - Check trading conditions
        # - Generate buy/sell signals
        
        return {
            "status": "candle_processed",
            "candle": candle.to_dict(),
            "trade_count": self.trade_count,
        }

    def run_strategy(self, payload: dict) -> dict:
        """Legacy strategy execution for backwards compatibility."""
        return {"status": "strategy executed", "payload": payload}

    def get_last_candle(self) -> Optional[Dict[str, Any]]:
        """
        Get the last processed candle.

        Returns:
            A dict representation of the last candle, or None
        """
        return self.last_candle.to_dict() if self.last_candle else None

