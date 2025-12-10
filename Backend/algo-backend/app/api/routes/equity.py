from fastapi import APIRouter, Depends
from typing import List
from sqlalchemy.orm import Session
from app.schemas.equity import EquityPointRead
from app.api.deps import get_db_dep
from app.models.equity import EquityPoint

router = APIRouter()


@router.get("/", response_model=List[EquityPointRead])
def equity_curve(db: Session = Depends(get_db_dep)):
    return db.query(EquityPoint).order_by(EquityPoint.time.asc()).all()
