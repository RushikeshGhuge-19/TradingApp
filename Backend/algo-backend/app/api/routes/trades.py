from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from app.schemas.trade import TradeRead
from app.api.deps import get_db_dep
from app.models.trade import Trade
from app.schemas.backtest import BacktestTrade
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[TradeRead])
def list_trades(db: Session = Depends(get_db_dep)):
    # Return last 100 trades ordered by entry_time desc
    return db.query(Trade).order_by(Trade.entry_time.desc()).limit(100).all()


@router.post("/save_backtest_trades")
def save_backtest_trades(trades: List[BacktestTrade], db: Session = Depends(get_db_dep)):
    """
    Save backtest trades to the database so they appear on the dashboard.
    
    Args:
        trades: List of BacktestTrade objects from backtest result
        db: Database session
    
    Returns:
        Status message with count of saved trades
    """
    if not trades:
        return {"status": "no trades to save", "saved_count": 0}
    
    # Clear existing trades to avoid duplicates
    db.query(Trade).delete()
    db.commit()
    
    # Add new trades
    for trade in trades:
        db_trade = Trade(
            symbol="BANKNIFTY",  # Default symbol
            timeframe="1h",  # Default timeframe
            direction=trade.direction,
            entry_time=trade.entry_time,
            entry_price=trade.entry_price,
            exit_time=trade.exit_time,
            exit_price=trade.exit_price,
            pnl_points=trade.pnl_points,
            pnl_money=trade.pnl_money,
            reason=trade.reason,
        )
        db.add(db_trade)
    
    db.commit()
    logger.info(f"Saved {len(trades)} backtest trades to database")
    
    return {"status": "trades saved", "saved_count": len(trades)}
