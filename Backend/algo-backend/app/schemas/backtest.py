from pydantic import BaseModel
from typing import Optional, List
from datetime import date, datetime


class BacktestRequest(BaseModel):
    """Request schema for running a backtest."""
    
    symbol: str = "^NSEBANK"
    timeframe: str = "15m"
    start_date: date
    end_date: date
    
    # Position sizing
    capital: Optional[float] = 100000.0  # Initial capital in rupees
    quantity: Optional[int] = 1  # Number of units/lots
    
    # Optional overrides (if not provided, will use StrategyConfig defaults)
    rsi_period: Optional[int] = None
    ema_fast: Optional[int] = None
    ema_slow: Optional[int] = None
    trend_ema: Optional[int] = None
    tp_points: Optional[float] = None
    trail_offset: Optional[float] = None
    lot_size: Optional[int] = None


class BacktestTrade(BaseModel):
    """A single trade from backtest results."""
    
    direction: str  # "LONG" or "SHORT"
    entry_time: datetime
    entry_price: float
    exit_time: datetime
    exit_price: float
    pnl_points: float
    pnl_money: float
    reason: str  # "TP", "TRAIL", "EMA_EXIT", etc.


class EquityPoint(BaseModel):
    """A single point in the equity curve."""
    
    time: datetime
    equity: float


class BacktestSummary(BaseModel):
    """Summary statistics from backtest."""
    
    total_trades: int
    win_trades: int
    loss_trades: int
    winrate: float
    net_pnl_money: float
    net_pnl_points: float
    max_drawdown_pct: float
    best_trade: Optional[BacktestTrade] = None
    worst_trade: Optional[BacktestTrade] = None


class BacktestResult(BaseModel):
    """Full backtest result with summary, equity curve, and trades."""
    
    summary: BacktestSummary
    equity_curve: List[EquityPoint]
    trades: List[BacktestTrade]
