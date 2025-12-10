import React from 'react';
import { StatusResponse } from '../types';

interface OpenPositionPanelProps {
  status: StatusResponse | null;
}

const OpenPositionPanel: React.FC<OpenPositionPanelProps> = ({ status }) => {
  if (!status || status.position_status === 'FLAT') return null;

  const isLong = status.position_status === 'LONG';
  const entry = status.entry_price || 0;
  const current = status.current_price || 0;
  const tsl = status.current_trailing_stop || 0;

  // Calculate distance to TSL
  const distToTSL = isLong ? (current - tsl) : (tsl - current);
  const distToTSLColor = distToTSL < 10 ? 'text-red-500' : 'text-slate-400';

  return (
    <div className="bg-[#0a0a0a] rounded-lg border border-white/10 overflow-hidden shadow-xl relative group">
      {/* Accent line using brand color */}
      <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: '#7300BD' }}></div>
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-[#7300BD] to-transparent opacity-5 pointer-events-none"></div>
      
      <div className="p-4 md:p-6 relative z-10">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h3 className="text-lg font-bold flex items-center gap-2" style={{ color: '#7300BD' }}>
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#7300BD' }}></span>
                    ACTIVE {status.position_status}
                </h3>
                <p className="text-slate-500 text-sm mt-1">Entered at {new Date(status.entry_time || '').toLocaleTimeString()} • {status.lot_size} Qty</p>
            </div>
            
            <div className={`px-4 py-2 rounded text-xs font-bold border ${status.tp_reached 
                ? 'bg-green-900/20 text-green-400 border-green-500/30' 
                : 'bg-amber-900/20 text-amber-400 border-amber-500/30'}`}>
                {status.tp_reached ? 'TP REACHED - TRAILING PROFIT' : 'TP NOT REACHED'}
            </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
                <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-1">Entry Price</div>
                <div className="text-xl font-mono text-slate-300">{entry.toFixed(2)}</div>
            </div>
            <div>
                <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-1">Current Price</div>
                <div className="text-xl font-mono text-white">{current.toFixed(2)}</div>
            </div>
            <div>
                <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-1">Trailing Stop</div>
                <div className="text-xl font-mono text-red-400">{tsl.toFixed(2)}</div>
            </div>
             <div>
                <div className="text-slate-600 text-[10px] font-bold uppercase tracking-widest mb-1">Distance to Stop</div>
                <div className={`text-xl font-mono ${distToTSLColor}`}>{distToTSL.toFixed(2)} pts</div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default OpenPositionPanel;