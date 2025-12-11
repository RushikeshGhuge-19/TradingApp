"""
Backtest API route.
Exposes POST /api/backtest endpoint for running strategy backtests.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import logging
import asyncio

from app.db.session import SessionLocal
from app.models.strategy_config import StrategyConfig
from app.schemas.backtest import BacktestRequest, BacktestResult
from app.services.backtest_engine import BacktestEngine

logger = logging.getLogger(__name__)

router = APIRouter()


def get_db():
    """Dependency: get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=BacktestResult)
async def run_backtest(request: BacktestRequest, db: Session = Depends(get_db)):
    """
    Run a backtest on historical data using the RSI-EMA strategy.
    
    Args:
        request: BacktestRequest with symbol, dates, timeframe, and optional param overrides
        db: Database session
    
    Returns:
        BacktestResult with summary, equity curve, and trades list
    """
    logger.info(f"POST /api/backtest called: {request.symbol} from {request.start_date} to {request.end_date}")
    
    try:
        # Load defaults from StrategyConfig if params not provided
        strategy_config = db.query(StrategyConfig).first()
        
        if not strategy_config:
            # Create default config if none exists
            strategy_config = StrategyConfig()
            db.add(strategy_config)
            db.commit()
            db.refresh(strategy_config)
        
        # Use provided values or fallback to config defaults
        symbol = request.symbol or strategy_config.symbol
        timeframe = request.timeframe or strategy_config.timeframe
        rsi_period = request.rsi_period or strategy_config.rsi_period
        ema_fast = request.ema_fast or strategy_config.ema_fast
        ema_slow = request.ema_slow or strategy_config.ema_slow
        trend_ema = request.trend_ema or strategy_config.trend_ema
        tp_points = request.tp_points or strategy_config.tp_points
        trail_offset = request.trail_offset or strategy_config.trail_offset
        lot_size = request.lot_size or strategy_config.lot_size
        
        logger.info(
            f"Backtest params: symbol={symbol}, timeframe={timeframe}, "
            f"RSI={rsi_period}, EMA_fast={ema_fast}, EMA_slow={ema_slow}, "
            f"Trend_EMA={trend_ema}, TP={tp_points}, Trail={trail_offset}, Lot={lot_size}"
        )
        
        # Create backtest engine
        engine = BacktestEngine(
            symbol=symbol,
            timeframe=timeframe,
            rsi_period=rsi_period,
            ema_fast=ema_fast,
            ema_slow=ema_slow,
            trend_ema=trend_ema,
            tp_points=tp_points,
            trail_offset=trail_offset,
            lot_size=lot_size,
            initial_equity=100000.0,
        )
        
        # Run backtest in thread pool to avoid blocking
        result = await asyncio.to_thread(
            engine.run,
            request.start_date,
            request.end_date
        )
        
        # If no trades from main strategy, try simple strategy
        if result.summary.total_trades == 0:
            logger.info("Main strategy returned no trades, trying simple strategy...")
            result = await asyncio.to_thread(
                engine.run_simple_strategy,
                request.start_date,
                request.end_date
            )
        
        logger.info(f"Backtest completed: {result.summary.total_trades} trades, PnL: {result.summary.net_pnl_money:.2f}")
        
        return result
    
    except Exception as exc:
        logger.error(f"Backtest error: {exc}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Backtest failed: {str(exc)}")
