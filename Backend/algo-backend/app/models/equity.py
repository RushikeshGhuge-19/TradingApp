from sqlalchemy import Column, Integer, DateTime, Float
from app.db.base import Base
from datetime import datetime


class EquityPoint(Base):
    __tablename__ = "equity_points"

    id = Column(Integer, primary_key=True, index=True)
    time = Column(DateTime, default=datetime.utcnow, nullable=False)
    equity = Column(Float, nullable=False)
