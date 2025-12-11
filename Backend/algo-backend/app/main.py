from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from app.api.routes import status as status_router
from app.api.routes import trades as trades_router
from app.api.routes import equity as equity_router
from app.api.routes import market as market_router
from app.api.routes import strategy as strategy_router
from app.api.routes import backtest as backtest_router
from app.services import seed_data
from app.db import base as db_base
from app.db import session as db_session

logger = logging.getLogger(__name__)

app = FastAPI(title="Algo Backend")

# CORS - allow all origins for the scaffold
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(status_router.router, prefix="/api/status", tags=["status"])
app.include_router(trades_router.router, prefix="/api/trades", tags=["trades"])
app.include_router(equity_router.router, prefix="/api/equity_curve", tags=["equity"])
app.include_router(market_router.router, prefix="/api/market", tags=["market"])
app.include_router(strategy_router.router, prefix="/api/strategy", tags=["strategy"])
app.include_router(backtest_router.router, prefix="/api/backtest", tags=["backtest"])

# Module-level flag to ensure background tasks start only once
_background_tasks_started = False
_background_task_handles = []


@app.on_event("startup")
def on_startup():
    """
    FastAPI startup event: idempotent initialization.
    
    Creates database tables and seeds data. Ensures this runs only once
    even under --reload, using a module-level flag guard.
    """
    global _background_tasks_started
    
    if _background_tasks_started:
        logger.info("Startup: background tasks already started, skipping")
        return
    
    logger.info("Startup: initializing database and background tasks")
    
    # Create tables
    db_base.Base.metadata.create_all(bind=db_session.engine)
    
    # Seed data if needed (with error handling)
    try:
        seed_data.seed_if_needed()
        logger.info("Startup: seed data initialized successfully")
    except Exception as e:
        logger.warning(f"Startup: seed data failed (continuing anyway): {e}")
    
    # Mark as started to prevent double-spawn on reload
    _background_tasks_started = True
    logger.info("Startup: initialization complete")


@app.on_event("shutdown")
def on_shutdown():
    """
    FastAPI shutdown event: cleanup background tasks.
    """
    global _background_tasks_started, _background_task_handles
    
    logger.info("Shutdown: cancelling background tasks")
    
    for task_handle in _background_task_handles:
        if task_handle and not task_handle.done():
            task_handle.cancel()
    
    _background_task_handles.clear()
    _background_tasks_started = False
    logger.info("Shutdown: cleanup complete")


@app.get("/")
def root():
    return {"message": "Algo Backend running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
