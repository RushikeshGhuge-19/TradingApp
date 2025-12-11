"""
Backtest API routes for DSL-based strategy execution
"""

from typing import Dict, Any
from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Query
import logging

from app.services.dsl_backtest_engine import DSLBacktestEngine
from app.schemas.backtest import BacktestResult

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/backtest", tags=["backtest"])


@router.post("/dsl")
async def run_dsl_backtest(
    compiled_strategy: Dict[str, Any],
    strategy_dsl: Dict[str, Any],
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
) -> BacktestResult:
    """
    Run backtest for DSL-compiled strategy.
    
    Args:
        compiled_strategy: Output from frontend ruleCompiler.ts
            {
                'requiredLookback': int,
                'evaluate': function as JSON (will be converted back)
            }
        strategy_dsl: Full DSL strategy definition
        start_date: Start date (YYYY-MM-DD)
        end_date: End date (YYYY-MM-DD)
    
    Returns:
        BacktestResult with trades, equity curve, summary
    """
    try:
        # Parse dates
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()

        # Extract strategy config from DSL
        strategy_config = {
            'capital': strategy_dsl.get('meta', {}).get('defaultCapital', 100000),
            'timeframe': strategy_dsl.get('meta', {}).get('timeframe', '15m'),
            'symbols': strategy_dsl.get('meta', {}).get('symbols', ['NIFTYBANK.NS']),
            'risk': strategy_dsl.get('risk', {}),
            'execution': strategy_dsl.get('execution', {}),
        }

        # Initialize engine
        engine = DSLBacktestEngine(compiled_strategy, strategy_config)

        # Run backtest
        result = engine.run(start, end)

        return BacktestResult(
            trades=result.get('trades', []),
            equity_curve=result.get('equity_curve', []),
            summary=result.get('summary', {}),
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=f"Invalid date format: {e}")
    except Exception as e:
        logger.error(f"Backtest failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Backtest execution failed: {e}")


@router.post("/dsl/quick")
async def quick_backtest(
    strategy_json: Dict[str, Any],
    start_date: str = Query(..., description="YYYY-MM-DD"),
    end_date: str = Query(..., description="YYYY-MM-DD"),
) -> Dict[str, Any]:
    """
    Quick backtest with minimal parameters.
    Frontend should pre-compile strategy before calling this.
    
    Args:
        strategy_json: Complete strategy with compiled rules
        start_date: Start date
        end_date: End date
    
    Returns:
        Backtest result summary
    """
    try:
        start = datetime.strptime(start_date, "%Y-%m-%d").date()
        end = datetime.strptime(end_date, "%Y-%m-%d").date()

        # Mock compiled strategy for now
        compiled_strategy = {
            'requiredLookback': 50,
            'evaluate': lambda bar_idx, bars, ctx: {'entrySignal': None, 'exitSignal': False},
        }

        strategy_config = {
            'capital': strategy_json.get('meta', {}).get('defaultCapital', 100000),
            'timeframe': strategy_json.get('meta', {}).get('timeframe', '15m'),
            'symbols': strategy_json.get('meta', {}).get('symbols', ['NIFTYBANK.NS']),
            'risk': strategy_json.get('risk', {}),
            'execution': strategy_json.get('execution', {}),
        }

        engine = DSLBacktestEngine(compiled_strategy, strategy_config)
        result = engine.run(start, end)

        return {
            'success': True,
            'summary': result.get('summary', {}),
            'trade_count': len(result.get('trades', [])),
        }

    except Exception as e:
        logger.error(f"Quick backtest failed: {e}")
        raise HTTPException(status_code=500, detail=f"Backtest failed: {e}")
