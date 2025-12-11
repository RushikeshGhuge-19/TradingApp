#!/usr/bin/env python3
import requests

# Test NSE symbols with different timeframes
test_cases = [
    {
        'symbol': '^NSEBANK',
        'timeframe': '15m',
        'start_date': '2024-11-01',
        'end_date': '2024-11-30',
    },
    {
        'symbol': 'SBIN.NS',
        'timeframe': '15m',
        'start_date': '2024-11-01',
        'end_date': '2024-11-30',
    },
    {
        'symbol': 'INFY.NS',
        'timeframe': '30m',
        'start_date': '2024-11-01',
        'end_date': '2024-11-30',
    },
    {
        'symbol': '^NSEI',
        'timeframe': '1h',
        'start_date': '2024-11-01',
        'end_date': '2024-11-30',
    },
]

print("Testing NSE symbols with different timeframes:\n")

for req in test_cases:
    print(f"Testing: {req['symbol']} ({req['timeframe']}) - {req['start_date']} to {req['end_date']}")
    
    try:
        r = requests.post('http://127.0.0.1:8001/api/backtest', json=req)
        
        if r.status_code == 200:
            data = r.json()
            summary = data.get('summary', {})
            trades = data.get('trades', [])
            
            print(f"  ✓ Trades: {summary.get('total_trades', 0)}, Winrate: {summary.get('winrate', 0):.1f}%, Net P&L: {summary.get('net_pnl_money', 0):.2f}")
        else:
            print(f"  ✗ Error {r.status_code}: {r.json()}")
            
    except Exception as e:
        print(f"  ✗ Exception: {str(e)}")
    
    print()
