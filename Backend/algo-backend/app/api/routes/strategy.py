from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.session import SessionLocal
from app.models.strategy_config import StrategyConfig
from app.schemas.strategy_config import StrategyConfigRead, StrategyConfigUpdate
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


def get_db():
    """Dependency: get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/", response_model=StrategyConfigRead)
def get_strategy(db: Session = Depends(get_db)):
    """
    Get the current strategy configuration.
    If no config exists, create one with default values.
    """
    logger.info("GET /api/strategy called")
    
    config = db.query(StrategyConfig).first()
    
    if not config:
        logger.info("No strategy config found, creating with defaults")
        config = StrategyConfig()
        db.add(config)
        db.commit()
        db.refresh(config)
    
    return config


@router.put("/", response_model=StrategyConfigRead)
def update_strategy(payload: StrategyConfigUpdate, db: Session = Depends(get_db)):
    """
    Update the current strategy configuration.
    Only one config row exists; this updates it.
    """
    logger.info("PUT /api/strategy called with payload: %s", payload.dict(exclude_unset=True))
    
    config = db.query(StrategyConfig).first()
    
    if not config:
        logger.info("No strategy config found, creating with update values")
        config = StrategyConfig()
    
    # Update only provided fields
    update_data = payload.dict(exclude_unset=True)
    for key, value in update_data.items():
        if value is not None:
            setattr(config, key, value)
    
    db.add(config)
    db.commit()
    db.refresh(config)
    
    logger.info("Strategy config updated: id=%s", config.id)
    return config
