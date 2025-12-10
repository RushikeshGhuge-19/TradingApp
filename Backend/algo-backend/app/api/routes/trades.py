from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from app.schemas.trade import TradeRead
from app.api.deps import get_db_dep
from app.models.trade import Trade

router = APIRouter()


@router.get("/", response_model=List[TradeRead])
def list_trades(db: Session = Depends(get_db_dep)):
    # Return last 100 trades ordered by entry_time desc
    return db.query(Trade).order_by(Trade.entry_time.desc()).limit(100).all()
