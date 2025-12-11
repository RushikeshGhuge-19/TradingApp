#!/usr/bin/env python3
"""
Smoke check script: validates critical API endpoints after changes.

Usage:
    python scripts/smoke_check.py [--base-url http://localhost:8001]

This script:
  1. Calls GET /api/status and asserts HTTP 200
  2. Calls GET /api/trades and asserts HTTP 200
  3. Prints JSON snippet of /api/status
  4. Validates response structure and safe defaults
"""

import sys
import time
import logging
import requests
import json
from typing import Optional
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger(__name__)


def smoke_check(base_url: str = "http://localhost:8001", timeout: int = 5) -> bool:
    """
    Run smoke check on API endpoints.
    
    Args:
        base_url: Base URL of the API (default: http://localhost:8001)
        timeout: Request timeout in seconds
    
    Returns:
        True if all checks pass, False otherwise
    """
    all_passed = True
    
    logger.info(f"Starting smoke check against {base_url}")
    
    # Check 1: GET /api/status
    logger.info("Check 1: GET /api/status")
    try:
        resp = requests.get(f"{base_url}/api/status", timeout=timeout)
        if resp.status_code != 200:
            logger.error(f"  FAIL: Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            logger.info(f"  PASS: HTTP 200")
            
            # Validate required fields
            required_fields = ["symbol", "timeframe", "position", "lots", "current_price", "last_price_time"]
            missing = [f for f in required_fields if f not in data]
            if missing:
                logger.warning(f"  WARNING: Missing fields in /api/status: {missing}")
            else:
                logger.info(f"  PASS: All required fields present")
            
            # Print snippet
            logger.info(f"  Response snapshot:")
            logger.info(f"    symbol: {data.get('symbol')}")
            logger.info(f"    position: {data.get('position')}")
            logger.info(f"    current_price: {data.get('current_price')}")
            logger.info(f"    last_price_time: {data.get('last_price_time')}")
            logger.info(f"    winrate: {data.get('winrate')}%")
            logger.info(f"    max_drawdown_pct: {data.get('max_drawdown_pct')}%")
    except requests.exceptions.ConnectionError:
        logger.error(f"  FAIL: Could not connect to {base_url}")
        all_passed = False
    except requests.exceptions.Timeout:
        logger.error(f"  FAIL: Request timeout ({timeout}s)")
        all_passed = False
    except Exception as e:
        logger.error(f"  FAIL: {type(e).__name__}: {e}")
        all_passed = False
    
    # Check 2: GET /api/trades
    logger.info("Check 2: GET /api/trades")
    try:
        resp = requests.get(f"{base_url}/api/trades", timeout=timeout)
        if resp.status_code != 200:
            logger.error(f"  FAIL: Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            logger.info(f"  PASS: HTTP 200")
            
            # Validate response is a list
            if isinstance(data, list):
                logger.info(f"  PASS: Response is a list ({len(data)} trades)")
            else:
                logger.warning(f"  WARNING: Expected list, got {type(data).__name__}")
    except requests.exceptions.ConnectionError:
        logger.error(f"  FAIL: Could not connect to {base_url}")
        all_passed = False
    except requests.exceptions.Timeout:
        logger.error(f"  FAIL: Request timeout ({timeout}s)")
        all_passed = False
    except Exception as e:
        logger.error(f"  FAIL: {type(e).__name__}: {e}")
        all_passed = False
    
    # Check 3: GET /api/equity_curve
    logger.info("Check 3: GET /api/equity_curve")
    try:
        resp = requests.get(f"{base_url}/api/equity_curve", timeout=timeout)
        if resp.status_code != 200:
            logger.error(f"  FAIL: Expected 200, got {resp.status_code}")
            all_passed = False
        else:
            data = resp.json()
            logger.info(f"  PASS: HTTP 200")
            
            if isinstance(data, list):
                logger.info(f"  PASS: Response is a list ({len(data)} points)")
            else:
                logger.warning(f"  WARNING: Expected list, got {type(data).__name__}")
    except requests.exceptions.ConnectionError:
        logger.error(f"  FAIL: Could not connect to {base_url}")
        all_passed = False
    except requests.exceptions.Timeout:
        logger.error(f"  FAIL: Request timeout ({timeout}s)")
        all_passed = False
    except Exception as e:
        logger.error(f"  FAIL: {type(e).__name__}: {e}")
        all_passed = False
    
    # Summary
    logger.info("")
    if all_passed:
        logger.info("✓ All smoke checks PASSED")
        return True
    else:
        logger.info("✗ Some smoke checks FAILED")
        return False


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Smoke check for Algo Backend API endpoints"
    )
    parser.add_argument(
        "--base-url",
        type=str,
        default="http://localhost:8001",
        help="Base URL of the API (default: http://localhost:8001)"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=5,
        help="Request timeout in seconds (default: 5)"
    )
    
    args = parser.parse_args()
    
    success = smoke_check(base_url=args.base_url, timeout=args.timeout)
    sys.exit(0 if success else 1)
