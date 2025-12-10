# Frontend-Backend Integration Guide

## Integration Overview

The frontend now properly connects to the FastAPI backend with automatic fallback to mock data if the backend is unavailable.

## Configuration

### Backend URL
- **File**: `Frontend/services/api.ts`
- **URL**: `http://127.0.0.1:8001/api`
- **Fallback**: Automatic mock data if backend is unreachable

### API Endpoints Used
1. `GET /api/status` → Trading status and metrics
2. `GET /api/trades` → List of recent trades
3. `GET /api/equity_curve` → Equity progression points

## Data Transformation

The API layer automatically transforms backend responses to frontend format:

### Status Response Transformation
```
Backend StatusResponse → FrontendStatus
- position → position_status (alias)
- pnl_points → live_pnl_points (alias)
- pnl_money → live_pnl_money (alias)
- today_pnl_money → today_pnl (alias)
- max_drawdown_pct → max_drawdown (alias)
- current_stop → current_trailing_stop (alias)
```

### Equity Point Transformation
```
Backend: { id, time, equity }
Frontend: { id?, time, equity }
```

### Trade Transformation
```
Backend Trade → Frontend Trade
- All fields maintained
- id field is optional (generated if missing)
```

## Component Updates

### Updated Components:
1. **ChartsSection.tsx** - Fixed `timestamp` → `time` field reference
2. **SummaryCards.tsx** - Uses FrontendStatus aliases (no changes needed)
3. **OpenPositionPanel.tsx** - Already compatible (no changes needed)
4. **TradeHistoryTable.tsx** - Already compatible (no changes needed)
5. **App.tsx** - Updated polling interval from 1s to 2s

## How to Run

### Start Backend
```bash
cd TradingApp/Backend/algo-backend
python -m uvicorn app.main:app --port 8001 --host 0.0.0.0
```

### Start Frontend (Development)
```bash
cd TradingApp/Frontend
npm install
npm run dev
```

### Switch Between Backend & Mock Data

Edit `Frontend/services/api.ts`:
```typescript
const USE_MOCK = false;  // Set to true for mock data
```

## API Response Examples

### Status Endpoint
```json
{
  "symbol": "BANKNIFTY",
  "timeframe": "15m",
  "position": "FLAT",
  "lots": 0.0,
  "entry_time": null,
  "entry_price": null,
  "current_price": 44500.0,
  "pnl_points": 0.0,
  "pnl_money": 0.0,
  "today_pnl_money": 0.0,
  "winrate": 65.0,
  "max_drawdown_pct": 12.5,
  "tp_reached": false,
  "current_stop": null
}
```

### Trades Endpoint
```json
[
  {
    "id": 1,
    "symbol": "BANKNIFTY",
    "timeframe": "15m",
    "direction": "LONG",
    "entry_time": "2025-12-09T10:30:00",
    "entry_price": 44250.0,
    "exit_time": "2025-12-09T10:45:00",
    "exit_price": 44300.0,
    "pnl_points": 50.0,
    "pnl_money": 750.0,
    "reason": "TSL_after_TP"
  }
]
```

### Equity Curve Endpoint
```json
[
  {
    "id": 1,
    "time": "2025-12-09T10:30:00",
    "equity": 100750.0
  }
]
```

## Error Handling

- If backend is unreachable, frontend automatically falls back to mock data
- Console will log warnings for failed backend requests
- UI updates normally with mock data, providing seamless user experience

## Testing the Integration

1. **With Backend Running**:
   ```bash
   # Check network tab in browser dev tools
   # Requests should go to http://127.0.0.1:8001/api/*
   ```

2. **Without Backend**:
   ```bash
   # Frontend will use mock data automatically
   # Console shows fallback messages
   ```

3. **Real-time Updates**:
   - Frontend polls backend every 2 seconds
   - Data updates automatically on screen
   - No manual refresh needed

## Polling Strategy

- **Interval**: 2 seconds (configurable in `App.tsx`)
- **Timeout**: 5 seconds per request
- **Fallback**: Mock data if any request fails
- **No buffering**: Each poll fetches latest data

## Future Improvements

1. WebSocket integration for real-time updates
2. Request caching to reduce server load
3. Error recovery strategies
4. Analytics dashboard
5. Historical data pagination
