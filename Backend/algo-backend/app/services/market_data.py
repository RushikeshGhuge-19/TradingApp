from typing import Optional, List, Dict
import logging
from datetime import datetime, timezone

import yfinance as yf
import pandas as pd

# Default symbol: Bank Nifty Index on Yahoo Finance (^NSEBANK works, BANKNIFTY=NS does not)
DEFAULT_SYMBOL = "^NSEBANK"


def get_last_price(symbol: Optional[str] = None) -> tuple[Optional[float], Optional[str]]:
    """Return (last_price, last_time_iso) for the given symbol using yfinance.

    Returns (None, None) on error.
    """
    s = symbol or DEFAULT_SYMBOL
    try:
        # download intraday 1-minute candles for today
        df = yf.download(tickers=s, period="1d", interval="1m", progress=False, threads=False)
        if df is None or df.empty:
            return (None, None)

        # Handle multi-index columns (when single ticker is returned, columns are (price_type, ticker))
        if isinstance(df.columns, pd.MultiIndex):
            # Multi-index: select the 'Close' level for the symbol
            if ("Close", s) in df.columns:
                close_col = ("Close", s)
            else:
                close_col = df["Close"].columns[0] if "Close" in df.columns.get_level_values(0) else None
            if close_col is None:
                return (None, None)
            valid = df[[close_col]].dropna()
        else:
            # Single-index columns
            valid = df.dropna(subset=["Close"])
        
        if valid.empty:
            return (None, None)

        last_idx = valid.index[-1]
        if isinstance(df.columns, pd.MultiIndex):
            last_price = float(valid.iloc[-1, 0])
        else:
            last_price = float(valid.iloc[-1]["Close"])

        # Ensure ISO timestamp (include timezone if present)
        if hasattr(last_idx, "tzinfo") and last_idx.tzinfo:
            last_time_iso = last_idx.isoformat()
        else:
            last_time_iso = last_idx.replace(tzinfo=timezone.utc).isoformat()

        return (last_price, last_time_iso)
    except Exception as exc:
        logging.warning("market_data.get_last_price failed for %s: %s", s, exc)
        return (None, None)


def get_recent_candles(symbol: Optional[str] = None, interval: str = "15m", lookback_days: int = 5) -> List[Dict]:
    """Return recent candles as a list of dicts with time/open/high/low/close.

    This uses yfinance.download with the provided interval and lookback days.
    """
    s = symbol or DEFAULT_SYMBOL
    try:
        period = f"{lookback_days}d"
        df = yf.download(tickers=s, period=period, interval=interval, progress=False, threads=False)
        if df is None or df.empty:
            return []

        # Handle multi-index columns
        if isinstance(df.columns, pd.MultiIndex):
            # Extract Close, Open, High, Low from multi-index
            def get_col(col_name):
                if (col_name, s) in df.columns:
                    return df[(col_name, s)]
                for c in df.columns.get_level_values(0):
                    if c == col_name:
                        return df[c].iloc[:, 0]
                return None
            
            close_series = get_col("Close")
            open_series = get_col("Open")
            high_series = get_col("High")
            low_series = get_col("Low")
            
            if close_series is None:
                return []
            
            valid = close_series.dropna()
        else:
            valid = df.dropna(subset=["Close"])
            open_series = df["Open"]
            high_series = df["High"]
            low_series = df["Low"]
            close_series = df["Close"]

        candles = []
        for idx, close_val in valid.items():
            time_iso = idx.isoformat() if hasattr(idx, "isoformat") else str(idx)
            
            # Safely extract OHLC values
            open_val = float(open_series.loc[idx]) if idx in open_series.index else close_val
            high_val = float(high_series.loc[idx]) if idx in high_series.index else close_val
            low_val = float(low_series.loc[idx]) if idx in low_series.index else close_val
            
            candles.append({
                "time": time_iso,
                "open": open_val,
                "high": high_val,
                "low": low_val,
                "close": float(close_val),
            })

        return candles
    except Exception as exc:
        logging.warning("market_data.get_recent_candles failed for %s: %s", s, exc)
        return []
