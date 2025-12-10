import React from 'react';
import { StatusResponse } from '../types';

interface SummaryCardsProps {
  status: StatusResponse | null;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ status }) => {
  if (!status) return <div className="animate-pulse h-24 bg-[#0a0a0a] rounded-lg border border-white/5"></div>;

  const getPnlColor = (val: number) => {
    if (val > 0) return 'text-green-500';
    if (val < 0) return 'text-red-500';
    return 'text-slate-200';
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
      {/* Position Status */}
      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Position</div>
        <div className={`text-2xl font-bold ${
          status.position_status === 'LONG' ? 'text-green-500' : 
          status.position_status === 'SHORT' ? 'text-red-500' : 'text-slate-200'
        }`}>
          {status.position_status}
        </div>
        <div className="text-slate-600 text-xs mt-1">{status.symbol} | {status.timeframe}</div>
      </div>

      {/* Live PnL */}
      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg relative overflow-hidden">
        {/* Glow effect based on PnL */}
        <div className={`absolute top-0 right-0 w-16 h-16 blur-2xl opacity-10 rounded-full pointer-events-none -mr-4 -mt-4
            ${status.live_pnl_money > 0 ? 'bg-green-500' : status.live_pnl_money < 0 ? 'bg-red-500' : ''}`}>
        </div>
        
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Live PnL</div>
        <div className={`text-2xl font-bold ${getPnlColor(status.live_pnl_money)}`}>
          {status.live_pnl_money.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
        </div>
        <div className={`text-xs ${getPnlColor(status.live_pnl_points)}`}>
          {status.live_pnl_points > 0 ? '+' : ''}{status.live_pnl_points} pts
        </div>
      </div>

      {/* Today's PnL */}
      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Today's PnL</div>
        <div className={`text-2xl font-bold ${getPnlColor(status.today_pnl)}`}>
          {status.today_pnl.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
        </div>
        <div className="text-slate-600 text-xs mt-1">Realized</div>
      </div>

      {/* Winrate */}
      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Winrate</div>
        <div className="text-2xl font-bold text-slate-200">
          {status.winrate}%
        </div>
        <div className="text-slate-600 text-xs mt-1">Last 20 Trades</div>
      </div>

      {/* Drawdown */}
      <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10 shadow-lg">
        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Max Drawdown</div>
        <div className="text-2xl font-bold text-red-500">
          -{status.max_drawdown}%
        </div>
        <div className="text-slate-600 text-xs mt-1">All Time</div>
      </div>
    </div>
  );
};

export default SummaryCards;