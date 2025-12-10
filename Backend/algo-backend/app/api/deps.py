from app.db.session import get_db
from fastapi import Depends


def get_db_dep(db=Depends(get_db)):
    return db
