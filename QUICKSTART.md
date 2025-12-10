# Quick Start Guide

## Prerequisites
- Python 3.12+
- Node.js 18+ with npm
- Git (for version control)

## One-Minute Setup

### 1. Start Backend (Terminal 1)
```bash
cd "C:\Users\Acme\OneDrive\Desktop\Ghuge Rushikesh\TradingApp\Backend\algo-backend"
python -m uvicorn app.main:app --port 8001 --host 0.0.0.0
```

**Expected Output:**
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8001 (Press CTRL+C to quit)
```

### 2. Start Frontend (Terminal 2)
```bash
cd "C:\Users\Acme\OneDrive\Desktop\Ghuge Rushikesh\TradingApp\Frontend"
npm run dev
```

**Expected Output:**
```
  VITE v5.x.x  ready in XXX ms

  ➜  Local:   http://localhost:3000/
  ➜  press h to show help
```

### 3. Open Browser
Navigate to: **http://localhost:3000**

✅ You should see the trading dashboard with live data from the backend!

---

## What You'll See

### Dashboard Components

1. **Summary Cards** (Top Row)
   - Position status (FLAT/LONG/SHORT)
   - Live PnL (₹)
   - Today's PnL (₹)
   - Winrate (%)
   - Max Drawdown (%)

2. **Open Position Panel** (If active)
   - Entry Price
   - Current Price
   - Trailing Stop Level
   - Distance to Stop

3. **Charts Section** (Middle)
   - Equity Curve (area chart)
   - PnL Distribution (bar chart)

4. **Trade History Table** (Bottom)
   - Last 100 trades
   - Direction, Entry/Exit prices
   - PnL points and amount
   - Exit reason

---

## Troubleshooting

### Issue: "Connection Refused" on http://127.0.0.1:8001
**Solution**: Make sure backend is running in Terminal 1

### Issue: Frontend shows "Mock Data" warning
**Solution**: Backend URL might be wrong. Check in `Frontend/services/api.ts`
- Default: `http://127.0.0.1:8001/api`

### Issue: "Port 8001 already in use"
**Solution**: Change port number
```bash
python -m uvicorn app.main:app --port 8002
# Then update Frontend/services/api.ts:
# const BACKEND_URL = 'http://127.0.0.1:8002/api';
```

### Issue: "Module not found" errors in backend
**Solution**: Install dependencies
```bash
cd TradingApp/Backend/algo-backend
pip install -r requirements.txt
```

### Issue: npm packages not installed
**Solution**: Install Node dependencies
```bash
cd TradingApp/Frontend
npm install
```

---

## Configuration

### Change Backend URL
Edit: `Frontend/services/api.ts`
```typescript
const BACKEND_URL = 'http://YOUR_BACKEND_URL/api';
```

### Use Mock Data Only (for development)
Edit: `Frontend/services/api.ts`
```typescript
const USE_MOCK = true;
```

### Change Polling Interval
Edit: `Frontend/App.tsx` (line ~38)
```typescript
const intervalId = setInterval(loadData, 2000);  // milliseconds
```

### Change Backend Port
```bash
python -m uvicorn app.main:app --port YOUR_PORT
```

---

## Available Backend Endpoints

All endpoints return JSON and accept GET requests.

| Endpoint | Purpose | Response |
|----------|---------|----------|
| `GET /api/status` | Current trading metrics | StatusResponse object |
| `GET /api/trades` | Trade history | Array of Trade objects |
| `GET /api/equity_curve` | Equity progression | Array of EquityPoint objects |
| `GET /docs` | API documentation | Swagger UI |
| `GET /redoc` | Alternative API docs | ReDoc UI |

### Test Endpoints with curl

```bash
# Status
curl http://localhost:8001/api/status

# Trades (last 100)
curl http://localhost:8001/api/trades

# Equity curve
curl http://localhost:8001/api/equity_curve

# API documentation
open http://localhost:8001/docs
```

---

## Project Structure

```
TradingApp/
├── Backend/
│   ├── algo-backend/
│   │   ├── app/
│   │   │   ├── main.py          ← FastAPI app setup
│   │   │   ├── core/config.py    ← Configuration
│   │   │   ├── models/           ← SQLAlchemy ORM models
│   │   │   ├── schemas/          ← Pydantic response models
│   │   │   ├── api/routes/       ← API endpoints
│   │   │   ├── db/               ← Database setup
│   │   │   └── services/         ← Business logic
│   │   ├── requirements.txt
│   │   └── strategy.db           ← SQLite database (auto-created)
│   └── FIXES_APPLIED.md
│
└── Frontend/
    ├── src/
    │   ├── App.tsx               ← Main component
    │   ├── types.ts              ← TypeScript types
    │   ├── services/
    │   │   └── api.ts            ← Backend integration
    │   └── components/
    │       ├── SummaryCards.tsx
    │       ├── OpenPositionPanel.tsx
    │       ├── ChartsSection.tsx
    │       └── TradeHistoryTable.tsx
    ├── package.json
    ├── vite.config.ts
    └── INTEGRATION_GUIDE.md
```

---

## Development Workflow

### Making Changes

#### Backend Changes
1. Edit file in `Backend/algo-backend/app/`
2. Server auto-reloads (watch enabled)
3. Test with curl or frontend

#### Frontend Changes
1. Edit file in `Frontend/`
2. Vite hot-reloads automatically
3. Changes visible in browser instantly

### Building for Production

#### Backend
```bash
cd Backend/algo-backend
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

#### Frontend
```bash
cd Frontend
npm run build
# Creates 'dist' folder - ready to deploy
```

---

## Next Steps

1. ✅ Start backend & frontend (see above)
2. ✅ Open http://localhost:3000
3. ✅ See live trading data on dashboard
4. 📝 Read `ARCHITECTURE.md` for system overview
5. 📖 Read `INTEGRATION_GUIDE.md` for API details
6. 🚀 Extend with new features!

---

## Support

For issues or questions:
1. Check terminal output for error messages
2. Open browser console (F12) for JavaScript errors
3. Check backend logs in Terminal 1
4. Review `INTEGRATION_GUIDE.md` for configuration

---

**Status**: ✅ Ready to use!

Your trading app is fully functional and ready for development.
