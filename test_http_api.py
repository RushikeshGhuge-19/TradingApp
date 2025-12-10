"""
Test the actual API endpoint via HTTP
"""
import requests
from datetime import date, timedelta
import json

# API endpoint
url = "http://127.0.0.1:8000/api/backtest"

# Request data
end_date = date.today()
start_date = end_date - timedelta(days=10)

payload = {
    "symbol": "^NSEBANK",
    "timeframe": "15m",
    "start_date": start_date.isoformat(),
    "end_date": end_date.isoformat(),
}

print("Testing /api/backtest endpoint")
print(f"URL: {url}")
print(f"Payload: {json.dumps(payload, indent=2)}")
print()

try:
    response = requests.post(url, json=payload, timeout=60)
    print(f"Status Code: {response.status_code}")
    
    if response.status_code == 200:
        data = response.json()
        print()
        print("✓ SUCCESS! Response data:")
        print(f"  Total trades: {data['summary']['total_trades']}")
        print(f"  Win trades: {data['summary']['win_trades']}")
        print(f"  Loss trades: {data['summary']['loss_trades']}")
        print(f"  Winrate: {data['summary']['winrate']:.2f}%")
        print(f"  Net PnL: ₹{data['summary']['net_pnl_money']:,.2f}")
        print(f"  Max Drawdown: {data['summary']['max_drawdown_pct']:.2f}%")
        print(f"  Equity curve points: {len(data['equity_curve'])}")
        print(f"  Trades in list: {len(data['trades'])}")
        
        # Save full response
        with open(r"c:\Users\Acme\OneDrive\Desktop\Ghuge Rushikesh\TradingApp\backtest_api_full_response.json", "w") as f:
            json.dump(data, f, indent=2)
        print()
        print("Full response saved to backtest_api_full_response.json")
    else:
        print(f"✗ ERROR {response.status_code}")
        print(response.text)
        
except Exception as e:
    print(f"✗ Failed to connect: {e}")
    print()
    print("Make sure the backend is running:")
    print("  cd TradingApp/Backend/algo-backend")
    print("  python -m uvicorn app.main:app --host 127.0.0.1 --port 8000")
