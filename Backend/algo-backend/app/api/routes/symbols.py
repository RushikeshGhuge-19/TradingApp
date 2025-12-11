"""
Endpoints for managing trading symbols and market data.
"""

from typing import List
from fastapi import APIRouter, Query
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/symbols", tags=["symbols"])

# List of commonly traded symbols with their descriptions
# These are symbols supported by yfinance
AVAILABLE_SYMBOLS = {
    "AAPL": {"name": "Apple Inc.", "market": "US", "description": "Technology"},
    "MSFT": {"name": "Microsoft Corporation", "market": "US", "description": "Technology"},
    "GOOGL": {"name": "Alphabet Inc.", "market": "US", "description": "Technology"},
    "AMZN": {"name": "Amazon.com Inc.", "market": "US", "description": "E-commerce"},
    "TSLA": {"name": "Tesla Inc.", "market": "US", "description": "Electric Vehicles"},
    "META": {"name": "Meta Platforms Inc.", "market": "US", "description": "Social Media"},
    "NVDA": {"name": "NVIDIA Corporation", "market": "US", "description": "Semiconductors"},
    "JPM": {"name": "JPMorgan Chase", "market": "US", "description": "Banking"},
    "V": {"name": "Visa Inc.", "market": "US", "description": "Financial Services"},
    "WMT": {"name": "Walmart Inc.", "market": "US", "description": "Retail"},
    "^NSEBANK": {"name": "Nifty Bank Index", "market": "India", "description": "Banking Sector"},
    "^NSEI": {"name": "Nifty 50 Index", "market": "India", "description": "Large Cap Index"},
    "SBIN.NS": {"name": "State Bank of India", "market": "India", "description": "Banking"},
    "INFY.NS": {"name": "Infosys Limited", "market": "India", "description": "IT Services"},
    "TCS.NS": {"name": "Tata Consultancy Services", "market": "India", "description": "IT Services"},
    "RELIANCE.NS": {"name": "Reliance Industries", "market": "India", "description": "Energy"},
    "HDFC.NS": {"name": "HDFC Bank", "market": "India", "description": "Banking"},
    "ICICIBANK.NS": {"name": "ICICI Bank", "market": "India", "description": "Banking"},
}


@router.get("/available")
async def get_available_symbols(market: str = Query(None, description="Filter by market: 'US', 'India', or None for all")) -> List[dict]:
    """
    Get list of all available trading symbols.
    
    Args:
        market: Optional filter - "US", "India", or None for all
    
    Returns:
        List of symbol objects with name, market, and description
    """
    symbols = []
    for symbol, details in AVAILABLE_SYMBOLS.items():
        if market is None or details["market"].lower() == market.lower():
            symbols.append({
                "symbol": symbol,
                "name": details["name"],
                "market": details["market"],
                "description": details["description"],
            })
    
    logger.info(f"Returned {len(symbols)} symbols (market filter: {market})")
    return symbols


@router.get("/popular")
async def get_popular_symbols() -> List[dict]:
    """
    Get the most commonly used symbols for quick access.
    
    Returns:
        List of popular symbol objects
    """
    popular = ["AAPL", "MSFT", "GOOGL", "AMZN", "^NSEBANK", "^NSEI", "SBIN.NS", "INFY.NS"]
    
    result = []
    for symbol in popular:
        if symbol in AVAILABLE_SYMBOLS:
            details = AVAILABLE_SYMBOLS[symbol]
            result.append({
                "symbol": symbol,
                "name": details["name"],
                "market": details["market"],
                "description": details["description"],
            })
    
    return result


@router.get("/{symbol}")
async def get_symbol_info(symbol: str) -> dict:
    """
    Get detailed information about a specific symbol.
    
    Args:
        symbol: The trading symbol (e.g., "AAPL", "^NSEBANK")
    
    Returns:
        Symbol details including name, market, and description
    """
    if symbol not in AVAILABLE_SYMBOLS:
        return {
            "symbol": symbol,
            "name": "Unknown Symbol",
            "market": "Unknown",
            "description": "Symbol not in predefined list (but may be valid)",
            "supported": False
        }
    
    details = AVAILABLE_SYMBOLS[symbol]
    return {
        "symbol": symbol,
        "name": details["name"],
        "market": details["market"],
        "description": details["description"],
        "supported": True
    }
