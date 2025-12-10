from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import status as status_router
from app.api.routes import trades as trades_router
from app.api.routes import equity as equity_router
from app.api.routes import market as market_router
from app.api.routes import strategy as strategy_router
from app.api.routes import backtest as backtest_router
from app.services import seed_data
from app.db import base as db_base
from app.db import session as db_session

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


@app.on_event("startup")
def on_startup():
    # Create tables
    db_base.Base.metadata.create_all(bind=db_session.engine)
    # Seed data if needed
    seed_data.seed_if_needed()


@app.get("/")
def root():
    return {"message": "Algo Backend running"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
