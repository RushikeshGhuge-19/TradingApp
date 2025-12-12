#!/bin/bash
# Quick verification script for TradingView Backtester implementation
# Run this after deploying the feature branch

echo "🧪 TradingView-Like Backtesting System - Verification Script"
echo "==========================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Backend API availability
echo "Test 1: Backend API Status..."
if curl -s http://localhost:8001/api/status > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend API is running${NC}"
else
    echo -e "${RED}✗ Backend API is NOT running${NC}"
    echo "  Start backend: cd Backend/algo-backend && python -m uvicorn app.main:app --reload"
    exit 1
fi

# Test 2: Frontend development server
echo ""
echo "Test 2: Frontend Server Status..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend dev server is running${NC}"
else
    echo -e "${YELLOW}⚠ Frontend dev server not detected at localhost:3000${NC}"
    echo "  Start frontend: cd Frontend && npm run dev"
fi

# Test 3: Backtest endpoint functionality
echo ""
echo "Test 3: Backtest API Endpoint..."
BACKTEST_RESPONSE=$(curl -s -X POST http://localhost:8001/api/backtest \
  -H "Content-Type: application/json" \
  -d '{
    "symbol": "^NSEBANK",
    "timeframe": "15m",
    "start_date": "2024-12-01",
    "end_date": "2024-12-05",
    "capital": 100000,
    "quantity": 1
  }')

if echo "$BACKTEST_RESPONSE" | grep -q "summary"; then
    TRADES=$(echo "$BACKTEST_RESPONSE" | grep -o '"total_trades":[0-9]*' | grep -o '[0-9]*')
    PNL=$(echo "$BACKTEST_RESPONSE" | grep -o '"net_pnl_money":[^,}]*' | grep -o '\-*[0-9]*\.[0-9]*')
    echo -e "${GREEN}✓ Backtest API working${NC}"
    echo "  Response: $TRADES trades executed, Net PnL: ₹$PNL"
else
    echo -e "${RED}✗ Backtest API returned invalid response${NC}"
    echo "  Response: $BACKTEST_RESPONSE"
fi

# Test 4: Files verification
echo ""
echo "Test 4: Required Files..."

FILES=(
    "Backend/algo-backend/app/services/backtest_engine.py"
    "Backend/algo-backend/app/api/routes/backtest.py"
    "Backend/algo-backend/app/schemas/backtest.py"
    "Frontend/src/pages/StrategyDashboard.tsx"
    "Frontend/src/pages/BacktestPage.tsx"
    "Frontend/src/components/TradeMarkerChart.tsx"
    "Frontend/src/services/api.ts"
    "Frontend/services/api.ts"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (MISSING)"
    fi
done

echo ""
echo "==========================================================="
echo "✅ All checks complete!"
echo ""
echo "📝 Next steps:"
echo "1. Open http://localhost:3000 in your browser"
echo "2. Navigate to BacktestPage"
echo "3. Run a backtest with date range 2024-12-01 to 2024-12-05"
echo "4. Verify on StrategyDashboard:"
echo "   - Summary cards display correctly"
echo "   - Equity curve renders"
echo "   - Trade marker chart shows entry/exit points"
echo "   - Trades table displays all trades"
echo "   - Replay controls work (play, pause, step, speed)"
echo "5. Test replay mode:"
echo "   - Click Play to animate through trades"
echo "   - Adjust speed sliders"
echo "   - Use Back/Next to navigate trades"
echo "   - Verify trade highlighting during replay"
