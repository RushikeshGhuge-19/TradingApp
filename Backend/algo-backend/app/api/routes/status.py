from fastapi import APIRouter, Depends
from app.schemas.status import StatusResponse
from sqlalchemy.orm import Session
from app.api.deps import get_db_dep
from app.models.position import PositionState
from app.models.trade import Trade
from datetime import datetime
import asyncio
import logging

# Market data
from app.services.market_data import get_last_price, DEFAULT_SYMBOL

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=StatusResponse)
async def get_status(db: Session = Depends(get_db_dep)):
    # Run blocking yfinance call in thread to avoid blocking event loop
    last_price, last_time = await asyncio.to_thread(get_last_price, DEFAULT_SYMBOL)

    # Try to fetch a position state from DB
    pos = db.query(PositionState).first()

    # If no position state, return mocked/clean default with real price
    if not pos:
        return {
            "symbol": DEFAULT_SYMBOL,
            "timeframe": "15m",
            "position": "FLAT",
            "lots": 0,
            "entry_time": None,
            "entry_price": None,
            "current_price": last_price if last_price is not None else 0.0,
            "last_price_time": last_time,
            "pnl_points": 0.0,
            "pnl_money": 0.0,
            "today_pnl_money": 0.0,
            "winrate": 0.0,
            "max_drawdown_pct": 0.0,
            "tp_reached": False,
            "current_stop": None,
        }

    # Compute simple metrics from DB (scaffolded)
    today = datetime.utcnow().date()
    trades_today = db.query(Trade).filter(Trade.entry_time >= datetime(today.year, today.month, today.day)).all()
    today_pnl = sum([t.pnl_money for t in trades_today]) if trades_today else 0.0
    wins = db.query(Trade).filter(Trade.pnl_points > 0).count()
    total = db.query(Trade).count()
    winrate = (wins / total * 100) if total > 0 else 0.0

    return {
        "symbol": pos.symbol,
        "timeframe": pos.timeframe,
        "position": pos.position,
        "lots": float(pos.lots),
        "entry_time": pos.entry_time,
        "entry_price": pos.entry_price,
        "current_price": last_price if last_price is not None else pos.current_price,
        "last_price_time": last_time,
        "pnl_points": 0.0,
        "pnl_money": 0.0,
        "today_pnl_money": float(today_pnl),
        "winrate": round(winrate, 1),
        "max_drawdown_pct": 12.5,
        "tp_reached": bool(pos.tp_reached),
        "current_stop": pos.current_stop,
    }
