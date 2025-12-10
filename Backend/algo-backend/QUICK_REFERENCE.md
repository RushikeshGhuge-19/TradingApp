"""
CANDLEBUILDER QUICK REFERENCE
==============================

Import the components:
    from app.services import Candle, CandleBuilder, MockFeed, StrategyEngine


1. BASIC USAGE - Feed ticks, get candles
──────────────────────────────────────────

    from app.services import CandleBuilder
    from datetime import datetime, timedelta
    
    builder = CandleBuilder(timeframe_minutes=15)
    
    # Feed a price tick
    closed = builder.update_with_tick(price=100.5, ts=datetime.now())
    
    if closed:
        print(f"Candle closed: {closed.open}/{closed.high}/{closed.low}/{closed.close}")
    
    # Get current in-progress candle
    current = builder.get_current_candle()


2. WITH MOCK FEED - Realistic simulation
─────────────────────────────────────────

    from app.services import MockFeed
    
    feed = MockFeed(timeframe_minutes=15, start_price=100.0)
    
    # Define callback for closed candles
    def on_candle(candle):
        print(f"📊 {candle.start_time}: {candle.close:.2f}")
    
    feed.set_on_candle_closed(on_candle)
    
    # Generate 1000 ticks (~16.67 minutes)
    for _ in range(1000):
        tick = feed.generate_tick()
        # Candles auto-close and trigger callback


3. WITH STRATEGY ENGINE - Process signals
──────────────────────────────────────────

    from app.services import MockFeed, StrategyEngine
    
    feed = MockFeed(timeframe_minutes=15)
    engine = StrategyEngine()
    
    def process_candle(candle):
        result = engine.on_new_candle(candle)
        # Your strategy logic here
        if result['status'] == 'candle_processed':
            last = engine.get_last_candle()
            print(f"Processed candle: {last}")
    
    feed.set_on_candle_closed(process_candle)
    
    # Run
    for _ in range(2700):  # 45 minutes
        feed.generate_tick()


4. WITH REAL MARKET DATA
─────────────────────────

    from app.services import CandleBuilder
    import yfinance as yf
    from datetime import datetime
    
    builder = CandleBuilder(timeframe_minutes=15)
    
    # Get real data (example)
    data = yf.download('BANKNIFTY=F', interval='1m')
    
    for idx, row in data.iterrows():
        closed = builder.update_with_tick(
            price=row['Close'],
            ts=pd.to_datetime(idx)
        )
        if closed:
            # Process closed candle
            pass


5. CANDLE DATA STRUCTURE
─────────────────────────

    Candle object has:
        .start_time (datetime)  - When candle started
        .open (float)           - Opening price
        .high (float)           - Highest price
        .low (float)            - Lowest price
        .close (float)          - Closing price
        .to_dict()              - Convert to dict for JSON


6. KEY METHODS
───────────────

    CandleBuilder:
        update_with_tick(price, ts) -> Candle | None
        get_current_candle() -> Candle | None
    
    MockFeed:
        generate_tick() -> dict
        set_on_candle_closed(callback) -> None
        get_current_candle() -> dict | None
    
    StrategyEngine:
        on_new_candle(candle) -> dict
        get_last_candle() -> dict | None


7. TIMEFRAME EXAMPLES
──────────────────────

    # Create builders for different timeframes
    builder_1m = CandleBuilder(timeframe_minutes=1)
    builder_5m = CandleBuilder(timeframe_minutes=5)
    builder_15m = CandleBuilder(timeframe_minutes=15)
    builder_30m = CandleBuilder(timeframe_minutes=30)
    builder_1h = CandleBuilder(timeframe_minutes=60)


8. TESTING
──────────

    # Run tests
    cd TradingApp/Backend/algo-backend
    .\.venv\Scripts\python test_candles.py
    .\.venv\Scripts\python test_integration.py


9. COMMON PATTERNS
───────────────────

    # Pattern 1: Count closed candles
    count = 0
    def count_candles(candle):
        global count
        count += 1
    feed.set_on_candle_closed(count_candles)
    
    # Pattern 2: Store candles in list
    candles = []
    def store_candle(candle):
        candles.append(candle.to_dict())
    feed.set_on_candle_closed(store_candle)
    
    # Pattern 3: Alert on big moves
    def check_volatility(candle):
        move = ((candle.high - candle.low) / candle.open) * 100
        if move > 5:  # > 5% range
            print(f"⚠️  High volatility: {move:.2f}%")
    feed.set_on_candle_closed(check_volatility)


10. INTEGRATION WITH BACKEND
──────────────────────────────

    The backend is ready to use this system:
    
    - MockFeed simulates market data
    - CandleBuilder converts ticks to candles
    - StrategyEngine processes signals
    - Can be connected to routes for live data
    - Supports multiple concurrent timeframes


✅ Everything is tested and ready to use!
"""
