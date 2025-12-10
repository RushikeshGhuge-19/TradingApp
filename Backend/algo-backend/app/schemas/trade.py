from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class TradeBase(BaseModel):
    symbol: str
    timeframe: str
    direction: str
    entry_time: datetime
    entry_price: float
    exit_time: datetime
    exit_price: float
    pnl_points: float
    pnl_money: float
    reason: str


class TradeCreate(TradeBase):
    pass


class TradeRead(TradeBase):
    id: int

    class Config:
        from_attributes = True
