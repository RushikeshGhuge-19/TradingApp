from typing import Optional
from datetime import datetime
from pydantic import BaseModel


class Status(BaseModel):
    status: str


class StatusResponse(BaseModel):
    symbol: str
    timeframe: str
    position: str
    lots: float
    entry_time: Optional[datetime]
    entry_price: Optional[float]
    current_price: Optional[float]
    last_price_time: Optional[str]
    pnl_points: float
    pnl_money: float
    today_pnl_money: float
    winrate: float
    max_drawdown_pct: float
    tp_reached: bool
    current_stop: Optional[float]

    class Config:
        from_attributes = True
