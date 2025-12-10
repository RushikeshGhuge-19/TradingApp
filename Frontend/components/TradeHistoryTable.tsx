import React from 'react';
import { Trade } from '../types';

interface TradeHistoryTableProps {
  trades: Trade[];
}

const TradeHistoryTable: React.FC<TradeHistoryTableProps> = ({ trades }) => {
  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-white/10 overflow-hidden shadow-lg">
      <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-[#0d0d0d]">
        <h3 className="font-bold text-slate-200">Trade History</h3>
        <span className="text-xs text-slate-600">{trades.length} records</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-400">
          <thead className="text-[10px] uppercase bg-black text-slate-500 tracking-wider">
            <tr>
              <th className="px-6 py-3 font-semibold">Trade ID</th>
              <th className="px-6 py-3 font-semibold">Direction</th>
              <th className="px-6 py-3 font-semibold">Entry Time</th>
              <th className="px-6 py-3 font-semibold text-right">Entry Price</th>
              <th className="px-6 py-3 font-semibold text-right">Exit Price</th>
              <th className="px-6 py-3 font-semibold text-right">PnL (pts)</th>
              <th className="px-6 py-3 font-semibold text-right">PnL (₹)</th>
              <th className="px-6 py-3 font-semibold">Exit Reason</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {trades.map((trade) => {
                const isProfit = (trade.pnl_money || 0) > 0;
                return (
                    <tr key={trade.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{trade.id}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase border ${
                                trade.direction === 'LONG' 
                                ? 'bg-green-900/10 text-green-500 border-green-500/20' 
                                : 'bg-red-900/10 text-red-500 border-red-500/20'
                            }`}>
                                {trade.direction}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-slate-400 text-xs">
                            {new Date(trade.entry_time).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-300">
                            {trade.entry_price.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-slate-300">
                            {trade.exit_price?.toFixed(2) || '-'}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold font-mono ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.pnl_points ? (trade.pnl_points > 0 ? '+' : '') + trade.pnl_points.toFixed(2) : '-'}
                        </td>
                        <td className={`px-6 py-4 text-right font-bold font-mono ${isProfit ? 'text-green-500' : 'text-red-500'}`}>
                            {trade.pnl_money ? trade.pnl_money.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                        </td>
                        <td className="px-6 py-4">
                            <span className="text-[10px] uppercase tracking-wider text-slate-500">
                                {trade.reason?.replace(/_/g, ' ')}
                            </span>
                        </td>
                    </tr>
                );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TradeHistoryTable;