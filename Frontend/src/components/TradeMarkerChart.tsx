import React from 'react';
import {
  ComposedChart,
  Line,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { BacktestTrade } from '../services/backtestAPI';

interface TradeMarkerChartProps {
  trades: BacktestTrade[];
  equityCurve: Array<{ time: string; equity: number }>;
}

/**
 * TradeMarkerChart displays trade entry/exit points on a price chart
 * Shows:
 * - Entry prices as green upward triangles
 * - Exit prices as red downward triangles
 * - Price movement line connecting entries and exits
 * - Profit/loss zones highlighted
 */
export const TradeMarkerChart: React.FC<TradeMarkerChartProps> = ({ trades, equityCurve }) => {
  if (!trades || trades.length === 0) {
    return (
      <div className="w-full h-80 bg-slate-900/50 rounded-lg border border-slate-700 flex items-center justify-center">
        <p className="text-slate-400">No trades to display</p>
      </div>
    );
  }

  // Prepare data: combine trades with pricing information
  const chartData = trades.map((trade, idx) => ({
    idx: idx + 1,
    time: new Date(trade.entry_time).toLocaleString('en-IN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }),
    entryPrice: trade.entry_price,
    exitPrice: trade.exit_price,
    avgPrice: (trade.entry_price + trade.exit_price) / 2,
    pnl: trade.pnl_money,
    direction: trade.direction,
    reason: trade.reason,
  }));

  // Calculate min/max for domain
  const prices = chartData.flatMap(d => [d.entryPrice, d.exitPrice]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="w-full bg-[#0a0a0a] p-6 rounded-lg border border-white/10 shadow-lg">
      <h3 className="text-lg font-bold text-white mb-4">Trade Entry/Exit Points</h3>
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={true} />
          
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          
          <YAxis
            yAxisId="left"
            stroke="#94a3b8"
            style={{ fontSize: '12px' }}
            domain={[minPrice - padding, maxPrice + padding]}
            label={{ value: 'Price (₹)', angle: -90, position: 'insideLeft', offset: 10 }}
          />
          
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '8px',
              padding: '10px',
            }}
            labelStyle={{ color: '#94a3b8' }}
            formatter={(value: any) => {
              if (typeof value === 'number') {
                return `₹${value.toFixed(2)}`;
              }
              return value;
            }}
            cursor={{ stroke: '#7300BD', strokeWidth: 2 }}
          />
          
          {/* Price line showing entry to exit */}
          <Line
            yAxisId="left"
            type="linear"
            dataKey="entryPrice"
            stroke="#7300BD"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
            name="Price Path"
            connectNulls={true}
          />
          
          {/* Entry markers (green upward triangles) */}
          <Scatter
            yAxisId="left"
            dataKey="entryPrice"
            fill="#22c55e"
            shape="triangle"
            name="Entry"
            isAnimationActive={false}
          />
          
          {/* Exit markers (red downward triangles) */}
          <Scatter
            yAxisId="left"
            dataKey="exitPrice"
            fill="#ef4444"
            shape="triangle"
            name="Exit"
            isAnimationActive={false}
          />
          
          {/* Profit/Loss zones */}
          {chartData.map((trade, idx) => {
            if (trade.pnl > 0) {
              return (
                <ReferenceLine
                  key={`profit-${idx}`}
                  yAxisId="left"
                  y={trade.avgPrice}
                  stroke="#22c55e"
                  strokeDasharray="5 5"
                  opacity={0.1}
                  label={{
                    value: `+₹${trade.pnl.toFixed(0)}`,
                    position: 'right',
                    fill: '#22c55e',
                    fontSize: 10,
                  }}
                />
              );
            } else if (trade.pnl < 0) {
              return (
                <ReferenceLine
                  key={`loss-${idx}`}
                  yAxisId="left"
                  y={trade.avgPrice}
                  stroke="#ef4444"
                  strokeDasharray="5 5"
                  opacity={0.1}
                  label={{
                    value: `-₹${Math.abs(trade.pnl).toFixed(0)}`,
                    position: 'right',
                    fill: '#ef4444',
                    fontSize: 10,
                  }}
                />
              );
            }
            return null;
          })}
          
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="line"
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #475569',
              borderRadius: '6px',
              padding: '8px',
            }}
            labelStyle={{ color: '#94a3b8', fontSize: '12px' }}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Legend explanation */}
      <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-slate-400">Entry (Green Triangle)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-slate-400">Exit (Red Triangle)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-[#7300BD] rounded-full"></div>
          <span className="text-slate-400">Price Path (Purple Line)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-1 bg-slate-600"></div>
          <span className="text-slate-400">Dashed lines = PnL zones</span>
        </div>
      </div>
    </div>
  );
};

export default TradeMarkerChart;
