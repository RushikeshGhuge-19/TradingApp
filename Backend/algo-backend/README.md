# Algo Backend

Minimal FastAPI-based backend for the trading app. Structure:

- `app/` - application package
  - `core` - config
  - `db` - SQLAlchemy base & session
  - `models` - SQLAlchemy models
  - `schemas` - Pydantic schemas
  - `api` - FastAPI routers
  - `services` - business logic helpers

Run locally:

```bash
python -m pip install -r requirements.txt
uvicorn app.main:app --reload
```
