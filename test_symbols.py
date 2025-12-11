#!/usr/bin/env python3
import requests
import json

# Test symbols endpoint
r = requests.get('http://127.0.0.1:8001/api/symbols/available')
print('Status:', r.status_code)

if r.status_code == 200:
    data = r.json()
    print('Symbols loaded:', len(data))
    print('\nFirst 3:')
    for s in data[:3]:
        print(f"  - {s['symbol']}: {s['name']} ({s['market']})")
else:
    print('Error:', r.json())

# Test backtest endpoint
print('\n--- Testing Backtest ---')
backtest_req = {
    'symbol': 'AAPL',
    'timeframe': '1h',
    'start_date': '2024-12-01',
    'end_date': '2024-12-10'
}
r = requests.post('http://127.0.0.1:8001/api/backtest', json=backtest_req)
print('Status:', r.status_code)
if r.status_code == 200:
    data = r.json()
    if 'summary' in data:
        print('Trades:', data['summary'].get('total_trades', 'N/A'))
        print('Winrate:', f"{data['summary'].get('winrate', 'N/A')}%")
else:
    print('Error:', r.json())
