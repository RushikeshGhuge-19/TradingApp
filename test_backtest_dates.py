#!/usr/bin/env python3
import requests
import json
from datetime import datetime, timedelta

# Test different date ranges
test_cases = [
    {
        'symbol': 'AAPL',
        'timeframe': '1h',
        'start_date': '2024-11-01',
        'end_date': '2024-11-30',
    },
    {
        'symbol': 'MSFT',
        'timeframe': '1h',
        'start_date': '2024-10-01',
        'end_date': '2024-10-31',
    },
    {
        'symbol': 'TSLA',
        'timeframe': '15m',
        'start_date': '2024-11-15',
        'end_date': '2024-11-25',
    },
]

for req in test_cases:
    print(f"\n{'='*60}")
    print(f"Testing: {req['symbol']} ({req['timeframe']}) - {req['start_date']} to {req['end_date']}")
    print('='*60)
    
    try:
        r = requests.post('http://127.0.0.1:8001/api/backtest', json=req)
        
        if r.status_code == 200:
            data = r.json()
            summary = data.get('summary', {})
            trades = data.get('trades', [])
            
            print(f"✓ Status: {r.status_code}")
            print(f"  Trades: {summary.get('total_trades', 0)}")
            print(f"  Winrate: {summary.get('winrate', 0):.1f}%")
            print(f"  Net P&L: {summary.get('net_pnl_money', 0):.2f}")
            print(f"  Max Drawdown: {summary.get('max_drawdown_pct', 0):.2f}%")
            
            if trades:
                print(f"\n  First trade:")
                t = trades[0]
                print(f"    Entry: {t.get('entry_price', 0):.2f} → Exit: {t.get('exit_price', 0):.2f}")
                print(f"    P&L: {t.get('pnl_money', 0):.2f}")
        else:
            print(f"✗ Error {r.status_code}: {r.json()}")
            
    except Exception as e:
        print(f"✗ Exception: {str(e)}")
