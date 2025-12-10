from datetime import datetime, timedelta
from app.db.session import SessionLocal
from app.models.trade import Trade
from app.models.equity import EquityPoint
from app.models.position import PositionState
import yfinance as yf
import pandas as pd
import logging
import pytz

LOT_SIZE = 15
logger = logging.getLogger(__name__)


def seed_if_needed():
    """Seed database with real Bank Nifty (^NSEBANK) market data from yfinance."""
    db = SessionLocal()
    try:
        trade_count = db.query(Trade).count()
        if trade_count > 0:
            logger.info("Database already seeded, skipping seed_if_needed")
            return

        logger.info("Seeding database with real Bank Nifty (^NSEBANK) data...")
        
        try:
            # Download Bank Nifty (NSE Bank Nifty Index) data
            # Use ^NSEBANK which is available on Yahoo Finance
            banknifty = yf.Ticker("^NSEBANK")
            
            # Get today's 30-minute intraday data
            df = banknifty.history(period="1d", interval="30m")
            
            if df is None or df.empty:
                logger.warning("No BANKNIFTY data from yfinance, using fallback")
                seed_fallback(db)
                return
            
            logger.info(f"Downloaded {len(df)} candles from yfinance")
            logger.info(f"Data columns: {df.columns.tolist()}")
            logger.info(f"First row:\n{df.iloc[0] if len(df) > 0 else 'No data'}")
            
            # IST timezone for filtering current time
            ist = pytz.timezone('Asia/Kolkata')
            now_ist = datetime.now(ist)
            
            # Filter to only data up to current time
            df_filtered = df.copy()
            df_filtered.index = pd.to_datetime(df_filtered.index)
            
            # Convert index to IST if it's in UTC
            if df_filtered.index.tz is None:
                df_filtered.index = df_filtered.index.tz_localize('UTC').tz_convert(ist)
            elif df_filtered.index.tz != ist:
                df_filtered.index = df_filtered.index.tz_convert(ist)
            
            # Only include data up to now
            df_filtered = df_filtered[df_filtered.index <= now_ist]
            
            if len(df_filtered) < 2:
                logger.warning("Not enough real data, using fallback")
                seed_fallback(db)
                return
            
            logger.info(f"After filtering: {len(df_filtered)} candles")
            
            # Build equity curve from actual OHLC data
            equity = 100000.0  # Starting capital
            prev_close = df_filtered['Close'].iloc[0] if len(df_filtered) > 0 else 0
            
            for idx, (time, row) in enumerate(df_filtered.iterrows()):
                open_price = float(row['Open'])
                high_price = float(row['High'])
                low_price = float(row['Low'])
                close_price = float(row['Close'])
                
                logger.debug(f"Candle {idx}: Open={open_price}, High={high_price}, Low={low_price}, Close={close_price}")
                
                if idx > 0:
                    # Calculate PnL based on actual price movement
                    price_change = close_price - prev_close
                    pnl_money = price_change * LOT_SIZE
                    equity += pnl_money
                    
                    # Create trade record for every candle
                    if idx % 1 == 0:  # Log every candle
                        entry_price = prev_close
                        exit_price = close_price
                        direction = "LONG" if price_change >= 0 else "SHORT"
                        pnl_pts = price_change
                        
                        trade = Trade(
                            symbol="BANKNIFTY",
                            timeframe="30m",
                            direction=direction,
                            entry_time=time - timedelta(minutes=30),  # Entry was 30m ago
                            entry_price=entry_price,
                            exit_time=time,
                            exit_price=exit_price,
                            pnl_points=pnl_pts,
                            pnl_money=pnl_money,
                            reason="Real_BANKNIFTY_Data",
                        )
                        db.add(trade)
                
                # Add equity point at each candle close
                eq = EquityPoint(time=time, equity=equity)
                db.add(eq)
                
                prev_close = close_price
            
            db.commit()
            logger.info(f"✓ Successfully seeded {len(df_filtered)} real Bank Nifty (^NSEBANK) candles")
            logger.info(f"Final equity: ₹{equity:,.2f}")
            
        except Exception as e:
            logger.error(f"Error fetching BANKNIFTY data: {e}")
            import traceback
            traceback.print_exc()
            seed_fallback(db)
            
    finally:
        db.close()


def seed_fallback(db):
    """Fallback seed with realistic BANKNIFTY data when yfinance unavailable."""
    
    logger.info("Using fallback BANKNIFTY seed data")
    
    # BANKNIFTY realistic price range (around 43000-45000)
    base_time = datetime.utcnow().replace(hour=9, minute=15, second=0, microsecond=0)
    base_price = 43500.0  # Realistic BANKNIFTY price
    equity = 100000.0
    
    for i in range(10):  # 10 x 30min = 5 hours (full trading session)
        time = base_time + timedelta(minutes=30 * i)
        
        # Generate realistic OHLC data
        open_price = base_price + (i * 15 - 50)
        close_price = base_price + (i * 15 - 30)
        high_price = max(open_price, close_price) + 30
        low_price = min(open_price, close_price) - 20
        
        if i > 0:
            prev_price = base_price + ((i-1) * 15 - 30)
            price_change = close_price - prev_price
            pnl_money = price_change * LOT_SIZE
            equity += pnl_money
            
            direction = "LONG" if price_change >= 0 else "SHORT"
            pnl_pts = price_change
            
            trade = Trade(
                symbol="BANKNIFTY",
                timeframe="30m",
                direction=direction,
                entry_time=time - timedelta(minutes=30),
                entry_price=prev_price,
                exit_time=time,
                exit_price=close_price,
                pnl_points=pnl_pts,
                pnl_money=pnl_money,
                reason="Fallback_BANKNIFTY",
            )
            db.add(trade)
        
        eq = EquityPoint(time=time, equity=equity)
        db.add(eq)
    
    # Add default position state
    pos = PositionState(
        symbol="BANKNIFTY",
        timeframe="30m",
        position="FLAT",
        lots=0,
        entry_time=None,
        entry_price=None,
        current_price=base_price,
        current_stop=None,
        tp_reached=False,
    )
    db.add(pos)
    db.commit()
    logger.info("✓ Fallback BANKNIFTY seed completed")

