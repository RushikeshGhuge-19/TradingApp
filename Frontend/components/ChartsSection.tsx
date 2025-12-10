import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { EquityPoint, Trade } from '../types';

interface ChartsSectionProps {
  equityData: EquityPoint[];
  tradeData: Trade[];
}

const ChartsSection: React.FC<ChartsSectionProps> = ({ equityData, tradeData }) => {
  const [activeTab, setActiveTab] = useState<'EQUITY' | 'PNL'>('EQUITY');

  // Format equity data for chart
  const formattedEquity = equityData.map(d => ({
    time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: d.equity
  }));

  // Format trades for PnL chart (reverse to show oldest to newest)
  const formattedTrades = [...tradeData].reverse().map((t, idx) => ({
    id: idx + 1,
    pnl: t.pnl_money
  }));

  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-white/10 overflow-hidden mb-6 h-96 flex flex-col shadow-lg">
      <div className="flex border-b border-white/10">
        <button 
          onClick={() => setActiveTab('EQUITY')}
          className={`px-6 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${
            activeTab === 'EQUITY' 
            ? 'bg-[#111] text-white border-b-2' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-[#111]'
          }`}
          style={{ borderColor: activeTab === 'EQUITY' ? '#7300BD' : 'transparent' }}
        >
          Equity Curve
        </button>
        <button 
          onClick={() => setActiveTab('PNL')}
          className={`px-6 py-3 text-xs font-bold tracking-widest uppercase transition-colors ${
            activeTab === 'PNL' 
            ? 'bg-[#111] text-white border-b-2' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-[#111]'
          }`}
          style={{ borderColor: activeTab === 'PNL' ? '#7300BD' : 'transparent' }}
        >
          PnL Distribution
        </button>
      </div>

      <div className="flex-1 p-4 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {activeTab === 'EQUITY' ? (
             <AreaChart data={formattedEquity}>
             <defs>
                <linearGradient id="colorEquity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7300BD" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#7300BD" stopOpacity={0}/>
                </linearGradient>
             </defs>
             <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
             <XAxis 
                dataKey="time" 
                stroke="#555" 
                tick={{fontSize: 10, fill: '#666'}}
                minTickGap={30}
                axisLine={false}
                tickLine={false}
             />
             <YAxis 
                stroke="#555" 
                tick={{fontSize: 10, fill: '#666'}}
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
             />
             <Tooltip 
                contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px' }}
                itemStyle={{ color: '#a78bfa' }}
             />
             <Area 
                type="monotone" 
                dataKey="value" 
                stroke="#7300BD" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorEquity)" 
             />
           </AreaChart>
          ) : (
            <BarChart data={formattedTrades}>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis 
                  dataKey="id" 
                  stroke="#555" 
                  tick={{fontSize: 10, fill: '#666'}}
                  axisLine={false}
                  tickLine={false}
               />
               <YAxis 
                  stroke="#555" 
                  tick={{fontSize: 10, fill: '#666'}}
                  axisLine={false}
                  tickLine={false}
               />
               <Tooltip 
                  cursor={{fill: '#222', opacity: 0.5}}
                  contentStyle={{ backgroundColor: '#000', borderColor: '#333', color: '#fff', fontSize: '12px' }}
               />
               <Bar dataKey="pnl">
                {formattedTrades.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={(entry.pnl || 0) > 0 ? '#22c55e' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ChartsSection;