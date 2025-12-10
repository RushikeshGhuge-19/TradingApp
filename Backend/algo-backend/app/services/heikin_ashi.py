"""
Heikin Ashi candle converter.
Transforms regular OHLC candles into Heikin Ashi (HA) format.

Heikin Ashi uses:
- HA Close = (Open + High + Low + Close) / 4
- HA Open = (Previous HA Open + Previous HA Close) / 2
- HA High = max(High, HA Open, HA Close)
- HA Low = min(Low, HA Open, HA Close)
"""

from typing import List, Dict, Optional


def convert_to_heikin_ashi(candles: List[Dict]) -> List[Dict]:
    """
    Convert a list of OHLC candles to Heikin Ashi format.

    Args:
        candles: List of candle dicts with keys: time, open, high, low, close

    Returns:
        List of Heikin Ashi candle dicts with keys: time, open, high, low, close
    """
    if not candles:
        return []

    ha_candles = []
    prev_ha_open = None
    prev_ha_close = None

    for candle in candles:
        time = candle["time"]
        open_val = float(candle["open"])
        high_val = float(candle["high"])
        low_val = float(candle["low"])
        close_val = float(candle["close"])

        # HA Close = average of OHLC
        ha_close = (open_val + high_val + low_val + close_val) / 4.0

        # HA Open = average of previous HA Open and Close (or use current open for first candle)
        if prev_ha_open is None:
            ha_open = (open_val + close_val) / 2.0
        else:
            ha_open = (prev_ha_open + prev_ha_close) / 2.0

        # HA High = max of High, HA Open, HA Close
        ha_high = max(high_val, ha_open, ha_close)

        # HA Low = min of Low, HA Open, HA Close
        ha_low = min(low_val, ha_open, ha_close)

        ha_candles.append({
            "time": time,
            "open": ha_open,
            "high": ha_high,
            "low": ha_low,
            "close": ha_close,
        })

        # Store for next iteration
        prev_ha_open = ha_open
        prev_ha_close = ha_close

    return ha_candles
