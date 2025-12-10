# Trading App Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER BROWSER                             │
│                    http://localhost:3000                         │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                    React + Vite (Frontend)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      FRONTEND COMPONENTS                         │
├─────────────────────────────────────────────────────────────────┤
│                          App.tsx                                 │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │ - Polls backend every 2 seconds                         │  │
│   │ - Manages global state (status, trades, equity)        │  │
│   │ - Passes data to child components                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │            SummaryCards (5 key metrics)                 │  │
│   │  Position | Live PnL | Today PnL | Winrate | Drawdown  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │       OpenPositionPanel (if position != FLAT)           │  │
│   │  Entry Price | Current Price | Trailing Stop | Distance │  │
│   └─────────────────────────────────────────────────────────┘  │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │      ChartsSection (Equity Curve + PnL Distribution)    │  │
│   │  Uses Recharts for data visualization                  │  │
│   └─────────────────────────────────────────────────────────┘  │
│                          ▼                                       │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │        TradeHistoryTable (Last 100 trades)              │  │
│   │  Direction | Entry/Exit | PnL | Reason                 │  │
│   └─────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                   services/api.ts Layer
        (Transform + Fallback to mock data)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND - FastAPI                             │
│              http://127.0.0.1:8001                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  GET /api/status          │  GET /api/trades   │ GET /api/equity│
│  ─────────────────────────────────────────────────────────────  │
│  ┌──────────────────┐    ┌──────────────────┐  ┌─────────────┐  │
│  │  StatusResponse  │    │   Trade[] (last  │  │ EquityPoint │  │
│  │                  │    │    100 trades)   │  │   []        │  │
│  │ - symbol         │    │                  │  │             │  │
│  │ - position       │    │ - direction      │  │ - time      │  │
│  │ - lots           │    │ - entry_time     │  │ - equity    │  │
│  │ - entry_price    │    │ - entry_price    │  │             │  │
│  │ - current_price  │    │ - exit_price     │  │ - (20 pts)  │  │
│  │ - pnl_points     │    │ - pnl_points     │  │             │  │
│  │ - pnl_money      │    │ - pnl_money      │  └─────────────┘  │
│  │ - today_pnl_money│    │ - reason         │                   │
│  │ - winrate        │    │ - (20 trades)    │                   │
│  │ - max_drawdown   │    │                  │                   │
│  │ - tp_reached     │    └──────────────────┘                   │
│  │ - current_stop   │                                            │
│  └──────────────────┘                                            │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                   FastAPI Routes
        status.py | trades.py | equity.py
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                │
│              SQLAlchemy + SQLite                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐   │
│  │   trades table   │  │ equity_points    │  │  position_   │   │
│  │                  │  │    table         │  │  states      │   │
│  │ id (PK)          │  │                  │  │   table      │   │
│  │ symbol           │  │ id (PK)          │  │              │   │
│  │ timeframe        │  │ time             │  │ id (PK)      │   │
│  │ direction        │  │ equity           │  │ symbol       │   │
│  │ entry_time       │  │                  │  │ timeframe    │   │
│  │ entry_price      │  │ (20 records)     │  │ position     │   │
│  │ exit_time        │  │                  │  │ lots         │   │
│  │ exit_price       │  │                  │  │ entry_time   │   │
│  │ pnl_points       │  │                  │  │ entry_price  │   │
│  │ pnl_money        │  │                  │  │ current_price│   │
│  │ reason           │  │                  │  │ current_stop │   │
│  │ created_at       │  │                  │  │ tp_reached   │   │
│  │                  │  │                  │  │              │   │
│  │ (20 records)     │  │                  │  │ (1 record)   │   │
│  └──────────────────┘  └──────────────────┘  └──────────────┘   │
│                                                                  │
│  File: strategy.db                                              │
│  Location: algo-backend/strategy.db                             │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Sequence

```
1. User opens browser
   └─> http://localhost:5173

2. React App mounts (App.tsx)
   └─> Initial data fetch

3. Services API calls backend
   ├─> GET http://127.0.0.1:8001/api/status
   ├─> GET http://127.0.0.1:8001/api/trades
   └─> GET http://127.0.0.1:8001/api/equity_curve

4. Backend routes process requests
   ├─> Query SQLAlchemy ORM
   └─> Return JSON responses

5. API layer transforms data
   └─> Maps backend schema to frontend types

6. React state updates
   ├─> setStatus()
   ├─> setTrades()
   └─> setEquity()

7. Components re-render with data
   ├─> SummaryCards displays metrics
   ├─> OpenPositionPanel shows position
   ├─> ChartsSection plots data
   └─> TradeHistoryTable lists trades

8. Polling loop repeats every 2 seconds
   └─> Back to step 3
```

## Error Handling Flow

```
API Call Fails
    ↓
Log warning to console
    ↓
Check USE_MOCK flag
    ├─ if true: Use mock data
    └─ if false: Check if backend was reached before
        ├─ if yes: Return cached data
        └─ if no: Return mock data with warning

UI continues to display
  (either real or mock data)
    ↓
User sees continuous updates
  (no blank screens)
```

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool & dev server
- **Recharts** - Data visualization
- **Tailwind CSS** - Styling

### Backend
- **FastAPI** - Web framework
- **Uvicorn** - ASGI server
- **SQLAlchemy** - ORM
- **Pydantic** - Data validation (v2)
- **SQLite** - Database

### Communication
- **HTTP REST** - Frontend ↔ Backend
- **JSON** - Data format
- **CORS** - Cross-origin enabled

## Deployment Ready

### Backend Production Deployment
```bash
gunicorn -w 4 -b 0.0.0.0:8000 app.main:app
```

### Frontend Production Build
```bash
npm run build  # Creates dist/ folder
# Deploy dist/ to static hosting (Vercel, Netlify, etc.)
```

---

This architecture provides:
✅ Separation of concerns
✅ Type safety across full stack
✅ Real-time data updates
✅ Graceful degradation
✅ Easy to extend and maintain
