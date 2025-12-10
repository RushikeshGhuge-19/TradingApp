from sqlalchemy import Column, Integer, String, Float, DateTime
from sqlalchemy.sql import func
from app.db.base import Base


class StrategyConfig(Base):
    """
    Stores the current strategy configuration.
    There should be exactly ONE row representing the active strategy.
    """
    __tablename__ = "strategy_config"

    id = Column(Integer, primary_key=True, index=True)
    
    # Symbol and timeframe
    symbol = Column(String, default="^NSEBANK", nullable=False)
    timeframe = Column(String, default="1h", nullable=False)
    
    # RSI parameters
    rsi_period = Column(Integer, default=14, nullable=False)
    
    # EMA on RSI (fast and slow)
    ema_fast = Column(Integer, default=3, nullable=False)
    ema_slow = Column(Integer, default=7, nullable=False)
    
    # EMA on close (trend filter)
    trend_ema = Column(Integer, default=20, nullable=False)
    
    # Risk / exit parameters
    tp_points = Column(Float, default=100.0, nullable=False)
    trail_offset = Column(Float, default=50.0, nullable=False)
    
    # Position sizing
    lot_size = Column(Integer, default=1, nullable=False)
    
    # Metadata
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
