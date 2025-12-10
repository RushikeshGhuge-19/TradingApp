from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean
from app.db.base import Base


class PositionState(Base):
    __tablename__ = "position_states"

    id = Column(Integer, primary_key=True, index=True)
    symbol = Column(String, index=True, nullable=False)
    timeframe = Column(String, nullable=False)
    position = Column(String, nullable=False)  # FLAT, LONG, SHORT
    lots = Column(Float, nullable=False, default=0)
    entry_time = Column(DateTime, nullable=True)
    entry_price = Column(Float, nullable=True)
    current_price = Column(Float, nullable=True)
    current_stop = Column(Float, nullable=True)
    tp_reached = Column(Boolean, default=False)
