from fastapi import APIRouter, Query
from typing import List, Optional
from app.services import market_data
from app.services.heikin_ashi import convert_to_heikin_ashi
import logging
import asyncio

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/candles", response_model=List[dict])
async def get_candles(symbol: Optional[str] = Query(None), interval: str = Query("15m"), lookback_days: int = Query(1), candle_type: str = Query("heikin_ashi")):
    """Return recent OHLC candles for the requested symbol and interval.

    Supports candle_type: 'ohlc' (regular) or 'heikin_ashi' (default).

    Example: /api/market/candles?interval=15m&lookback_days=1&candle_type=heikin_ashi
    """
    s = symbol or market_data.DEFAULT_SYMBOL
    logger.info("/api/market/candles called - symbol=%s interval=%s lookback_days=%s candle_type=%s", s, interval, lookback_days, candle_type)

    # Run blocking yfinance download in thread to avoid blocking event loop
    data = await asyncio.to_thread(market_data.get_recent_candles, s, interval, lookback_days)

    if candle_type.lower() == "heikin_ashi":
        data = convert_to_heikin_ashi(data)

    logger.info("/api/market/candles returning %s candles for %s %s (%s)", len(data), s, interval, candle_type)
    return data
