from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class StrategyConfigBase(BaseModel):
    """Base schema for strategy config (common fields)."""
    symbol: str = "BANKNIFTY"
    timeframe: str = "15m"
    rsi_period: int = 14
    ema_fast: int = 3
    ema_slow: int = 7
    trend_ema: int = 20
    tp_points: float = 100.0
    trail_offset: float = 50.0
    lot_size: int = 1


class StrategyConfigRead(StrategyConfigBase):
    """Schema for reading strategy config (includes id and timestamps)."""
    id: int
    updated_at: datetime

    class Config:
        from_attributes = True


class StrategyConfigUpdate(BaseModel):
    """Schema for updating strategy config (all fields optional)."""
    symbol: Optional[str] = None
    timeframe: Optional[str] = None
    rsi_period: Optional[int] = None
    ema_fast: Optional[int] = None
    ema_slow: Optional[int] = None
    trend_ema: Optional[int] = None
    tp_points: Optional[float] = None
    trail_offset: Optional[float] = None
    lot_size: Optional[int] = None
