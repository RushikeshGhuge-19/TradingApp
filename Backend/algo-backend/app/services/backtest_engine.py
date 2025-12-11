"""
Backtest engine for running historical strategy simulations.
Implements RSI-EMA trading strategy with TP and trailing stop logic.
"""

from typing import List, Dict, Optional, Tuple
from datetime import datetime, date, timedelta
import logging
import yfinance as yf
import pandas as pd
from app.schemas.backtest import BacktestTrade, EquityPoint, BacktestSummary, BacktestResult

logger = logging.getLogger(__name__)


class BacktestEngine:
    """
    Runs historical backtests of the RSI-EMA strategy.
    Simulates trading on historical candles and tracks equity, trades, and performance.
    """
    
    def __init__(
        self,
        symbol: str = "^NSEBANK",
        timeframe: str = "15m",
        rsi_period: int = 14,
        ema_fast: int = 3,
        ema_slow: int = 7,
        trend_ema: int = 20,
        tp_points: float = 100.0,
        trail_offset: float = 50.0,
        lot_size: int = 1,
        initial_equity: float = 1000000.0,
    ):
        """
        Initialize the backtest engine with strategy parameters.
        
        Args:
            symbol: Stock symbol (e.g., "^NSEBANK")
            timeframe: Candle interval (e.g., "15m", "30m", "1h")
            rsi_period: RSI period
            ema_fast: Fast EMA period on RSI
            ema_slow: Slow EMA period on RSI
            trend_ema: Trend EMA period on close price
            tp_points: Take profit in points
            trail_offset: Trailing stop offset in points
            lot_size: Position size in lots
            initial_equity: Starting capital
        """
        self.symbol = symbol
        self.timeframe = timeframe
        self.rsi_period = rsi_period
        self.ema_fast = ema_fast
        self.ema_slow = ema_slow
        self.trend_ema = trend_ema
        self.tp_points = tp_points
        self.trail_offset = trail_offset
        self.lot_size = lot_size
        self.initial_equity = initial_equity
        
        # Runtime state
        self.trades: List[BacktestTrade] = []
        self.equity_curve: List[EquityPoint] = []
        self.current_equity = initial_equity
        self.position: Optional[Dict] = None  # {'direction': 'LONG'|'SHORT', 'entry_price': float, 'entry_time': datetime, 'highest_price': float, 'lowest_price': float}
        self.highest_equity = initial_equity
        self.lowest_equity = initial_equity
    
    def fetch_candles(self, start_date: date, end_date: date) -> pd.DataFrame:
        """
        Fetch historical candles from Yahoo Finance.
        
        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
        
        Returns:
            DataFrame with columns: Open, High, Low, Close
        """
        try:
            # Add 1 day to end_date to ensure inclusive end
            end_fetch = end_date + timedelta(days=1)
            df = yf.download(
                tickers=self.symbol,
                start=start_date,
                end=end_fetch,
                interval=self.timeframe,
                progress=False,
                threads=False
            )
            
            if df is None or df.empty:
                logger.warning(f"No candles fetched for {self.symbol} from {start_date} to {end_date}")
                return pd.DataFrame()
            
            # Handle multi-index columns from yfinance
            if isinstance(df.columns, pd.MultiIndex):
                df = df.droplevel(1, axis=1)
            
            return df
        except Exception as exc:
            logger.error(f"Error fetching candles: {exc}")
            return pd.DataFrame()
    
    def calculate_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Calculate RSI, EMA, and trend indicators on the OHLC data.
        
        Args:
            df: DataFrame with Open, High, Low, Close columns
        
        Returns:
            DataFrame with additional indicator columns
        """
        df = df.copy()
        
        # Calculate RSI
        df['RSI'] = self._calculate_rsi(df['Close'], self.rsi_period)
        
        # Calculate EMA on RSI
        df['EMA_RSI_Fast'] = df['RSI'].ewm(span=self.ema_fast, adjust=False).mean()
        df['EMA_RSI_Slow'] = df['RSI'].ewm(span=self.ema_slow, adjust=False).mean()
        
        # Calculate trend EMA on close
        df['EMA_Trend'] = df['Close'].ewm(span=self.trend_ema, adjust=False).mean()
        
        return df
    
    @staticmethod
    def _calculate_rsi(prices: pd.Series, period: int = 14) -> pd.Series:
        """
        Calculate RSI (Relative Strength Index).
        
        Args:
            prices: Series of closing prices
            period: RSI period
        
        Returns:
            Series of RSI values
        """
        delta = prices.diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=period).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=period).mean()
        
        rs = gain / loss
        rsi = 100 - (100 / (1 + rs))
        return rsi
    
    def check_buy_signal(self, idx: int, row: pd.Series, prev_row: Optional[pd.Series]) -> bool:
        """
        Check if there's a buy signal (LONG entry condition).
        
        Simplified: RSI crosses above 40
        """
        if self.position:
            return False  # Already in position
        
        if pd.isna(row['RSI']):
            return False
        
        if prev_row is None or pd.isna(prev_row['RSI']):
            return False
        
        # RSI crosses above 40
        return prev_row['RSI'] <= 40 and row['RSI'] > 40
    
    def check_sell_signal(self, idx: int, row: pd.Series, prev_row: Optional[pd.Series]) -> bool:
        """
        Check if there's a sell signal (SHORT entry condition).
        
        Simplified: RSI crosses below 60
        """
        if self.position:
            return False  # Already in position
        
        if pd.isna(row['RSI']):
            return False
        
        if prev_row is None or pd.isna(prev_row['RSI']):
            return False
        
        # RSI crosses below 60
        return prev_row['RSI'] >= 60 and row['RSI'] < 60
    
    def check_exit_conditions(self, row: pd.Series, current_time: datetime) -> Optional[str]:
        """
        Check if we should exit the current position.
        
        Returns:
            Exit reason ("TP", "TRAIL", "EMA_EXIT") or None
        """
        if not self.position:
            return None
        
        direction = self.position['direction']
        entry_price = self.position['entry_price']
        current_price = row['Close']
        
        if pd.isna(row['EMA_Trend']):
            return None
        
        if direction == 'LONG':
            # Update highest price for trailing stop
            self.position['highest_price'] = max(self.position['highest_price'], current_price)
            
            # Check TP
            if current_price >= entry_price + self.tp_points:
                return "TP"
            
            # Check trailing stop
            if current_price <= self.position['highest_price'] - self.trail_offset:
                return "TRAIL"
            
            # Check EMA exit (close below trend EMA)
            if current_price < row['EMA_Trend']:
                return "EMA_EXIT"
        
        elif direction == 'SHORT':
            # Update lowest price for trailing stop
            self.position['lowest_price'] = min(self.position['lowest_price'], current_price)
            
            # Check TP
            if current_price <= entry_price - self.tp_points:
                return "TP"
            
            # Check trailing stop
            if current_price >= self.position['lowest_price'] + self.trail_offset:
                return "TRAIL"
            
            # Check EMA exit (close above trend EMA)
            if current_price > row['EMA_Trend']:
                return "EMA_EXIT"
        
        return None
    
    def run(self, start_date: date, end_date: date) -> BacktestResult:
        """
        Run the backtest for the given date range.
        
        Args:
            start_date: Start date (inclusive)
            end_date: End date (inclusive)
        
        Returns:
            BacktestResult with trades, equity curve, and summary
        """
        logger.info(f"Starting backtest for {self.symbol} from {start_date} to {end_date}")
        
        # Fetch and prepare candles
        df = self.fetch_candles(start_date, end_date)
        if df.empty:
            logger.warning("No candles to backtest")
            return self._empty_result()
        
        df = self.calculate_indicators(df)
        
        # Reset runtime state
        self.trades = []
        self.equity_curve = []
        self.current_equity = self.initial_equity
        self.position = None
        self.highest_equity = self.initial_equity
        self.lowest_equity = self.initial_equity
        
        # Record initial equity (convert pandas Timestamp to datetime)
        first_time = pd.Timestamp(df.index[0]).to_pydatetime()
        self.equity_curve.append(EquityPoint(time=first_time, equity=self.current_equity))
        
        prev_row = None
        
        # Iterate through candles
        for idx, (time, row) in enumerate(df.iterrows()):
            # Convert pandas Timestamp to datetime
            candle_time = pd.Timestamp(time).to_pydatetime() if isinstance(time, pd.Timestamp) else time
            
            # Check exit conditions for existing position
            if self.position:
                exit_reason = self.check_exit_conditions(row, candle_time)
                if exit_reason:
                    self._close_position(row['Close'], candle_time, exit_reason)
            
            # Check entry signals for new position
            if not self.position:
                if self.check_buy_signal(idx, row, prev_row):
                    self._open_position('LONG', row['Close'], candle_time)
                elif self.check_sell_signal(idx, row, prev_row):
                    self._open_position('SHORT', row['Close'], candle_time)
            
            # Record equity after this candle
            self.equity_curve.append(EquityPoint(time=candle_time, equity=self.current_equity))
            prev_row = row
        
        # Close any open position at the end
        if self.position:
            last_close = df.iloc[-1]['Close']
            last_time_raw = df.index[-1]
            last_time = pd.Timestamp(last_time_raw).to_pydatetime() if isinstance(last_time_raw, pd.Timestamp) else last_time_raw
            self._close_position(last_close, last_time, "END_OF_BACKTEST")
        
        logger.info(f"Backtest completed: {len(self.trades)} trades, PnL: {self.current_equity - self.initial_equity:.2f}")
        
        return self._build_result()
    
    def _open_position(self, direction: str, price: float, time: datetime):
        """Open a new position."""
        self.position = {
            'direction': direction,
            'entry_price': price,
            'entry_time': time,
            'highest_price': price,
            'lowest_price': price,
        }
        logger.info(f"Opening {direction} at {price} at {time}")
    
    def _close_position(self, exit_price: float, exit_time: datetime, reason: str):
        """Close the current position and record the trade."""
        if not self.position:
            return
        
        direction = self.position['direction']
        entry_price = self.position['entry_price']
        entry_time = self.position['entry_time']
        
        # Calculate PnL
        if direction == 'LONG':
            pnl_points = exit_price - entry_price
        else:  # SHORT
            pnl_points = entry_price - exit_price
        
        pnl_money = pnl_points * self.lot_size
        
        # Update equity
        self.current_equity += pnl_money
        self.highest_equity = max(self.highest_equity, self.current_equity)
        self.lowest_equity = min(self.lowest_equity, self.current_equity)
        
        # Record trade
        trade = BacktestTrade(
            direction=direction,
            entry_time=entry_time,
            entry_price=entry_price,
            exit_time=exit_time,
            exit_price=exit_price,
            pnl_points=pnl_points,
            pnl_money=pnl_money,
            reason=reason,
        )
        self.trades.append(trade)
        
        logger.info(f"Closed {direction} at {exit_price}, PnL: {pnl_money:.2f}, Reason: {reason}")
        
        self.position = None
    
    def _build_result(self) -> BacktestResult:
        """Build the BacktestResult from current state."""
        win_trades = sum(1 for t in self.trades if t.pnl_money > 0)
        loss_trades = sum(1 for t in self.trades if t.pnl_money < 0)
        total_trades = len(self.trades)
        
        winrate = (win_trades / total_trades * 100) if total_trades > 0 else 0.0
        net_pnl_money = self.current_equity - self.initial_equity
        
        # Calculate net PnL points
        net_pnl_points = sum(t.pnl_points for t in self.trades)
        
        # Calculate max drawdown
        max_drawdown_pct = self._calculate_max_drawdown()
        
        # Find best and worst trades
        best_trade = max(self.trades, key=lambda t: t.pnl_money, default=None) if self.trades else None
        worst_trade = min(self.trades, key=lambda t: t.pnl_money, default=None) if self.trades else None
        
        summary = BacktestSummary(
            total_trades=total_trades,
            win_trades=win_trades,
            loss_trades=loss_trades,
            winrate=winrate,
            net_pnl_money=net_pnl_money,
            net_pnl_points=net_pnl_points,
            max_drawdown_pct=max_drawdown_pct,
            best_trade=best_trade,
            worst_trade=worst_trade,
        )
        
        return BacktestResult(
            summary=summary,
            equity_curve=self.equity_curve,
            trades=self.trades,
        )
    
    def _calculate_max_drawdown(self) -> float:
        """Calculate maximum drawdown percentage."""
        if not self.equity_curve or self.highest_equity <= 0:
            return 0.0
        
        max_drawdown = (self.lowest_equity - self.highest_equity) / self.highest_equity * 100
        return abs(max_drawdown)
    
    def _empty_result(self) -> BacktestResult:
        """Return an empty backtest result."""
        summary = BacktestSummary(
            total_trades=0,
            win_trades=0,
            loss_trades=0,
            winrate=0.0,
            net_pnl_money=0.0,
            net_pnl_points=0.0,
            max_drawdown_pct=0.0,
            best_trade=None,
            worst_trade=None,
        )
        return BacktestResult(summary=summary, equity_curve=[], trades=[])
