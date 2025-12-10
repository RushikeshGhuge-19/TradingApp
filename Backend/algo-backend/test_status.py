#!/usr/bin/env python
"""Test the status endpoint."""
from app.api.routes import status as status_router
from app.db.session import SessionLocal

db = SessionLocal()
try:
    result = status_router.get_status(db=db)
    print("✓ Status endpoint works:")
    import json
    print(json.dumps(result, indent=2, default=str))
except Exception as e:
    print(f"✗ Error in status endpoint: {e}")
    import traceback
    traceback.print_exc()
finally:
    db.close()
