from pydantic import BaseModel
from datetime import datetime


class EquityPointRead(BaseModel):
    id: int
    time: datetime
    equity: float

    class Config:
        from_attributes = True
