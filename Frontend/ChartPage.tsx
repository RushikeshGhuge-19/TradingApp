import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import { fetchEquityCurve, fetchMarketCandles } from './services/api';
import { EquityPoint } from './types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Bar } from 'recharts';

interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  isUp: boolean;
}

function ChartPage() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    // We'll fetch raw market OHLC candles from backend and map them to the renderer's Candle shape.

  // Polling Effect
  useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch equity curve for lower chart
        const equityData = await fetchEquityCurve();
        const now = new Date();
        const filteredEquity = equityData.filter(point => new Date(point.time) <= now);
        setEquity(filteredEquity);

        // Fetch raw market OHLC candles (15m default)
        const rawCandles = await fetchMarketCandles('15m', 1);
        const mapped = rawCandles
          .map((c: any) => ({
            time: new Date(c.time),
            open: Number(c.open),
            high: Number(c.high),
            low: Number(c.low),
            close: Number(c.close),
          }))
          .map((c: any) => ({
            time: c.time.toLocaleTimeString(),
            open: c.open,
            high: c.high,
            low: c.low,
            close: c.close,
            isUp: c.close > c.open,
          }));

        setCandles(mapped as Candle[]);
        setLastUpdated(new Date());
      } catch (error) {
        console.error('Failed to fetch market or equity data', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadData();

    // Poll every 2 seconds
    const intervalId = setInterval(loadData, 2000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans pb-10">
      {/* Navbar */}
      <Navbar />

      {/* Status Bar */}
      <header className="bg-black border-b border-white/10 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-end">
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse bg-green-500"></span>
              <span className="text-green-500 font-medium tracking-wide">LIVE</span>
            </div>
            <div>Last Update: {lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-96 text-slate-500">
            Loading charts...
          </div>
        ) : (
          <div className="space-y-8">
            {/* Candlestick Chart */}
            <div className="bg-[#0a0a0a] p-6 rounded-lg border border-white/10 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">Equity Candles</h2>
              {candles.length > 0 ? (
                <div className="w-full h-96 overflow-x-auto">
                  <svg width={Math.max(600, candles.length * 80)} height={400} className="mx-auto">
                    {/* Grid */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1e293b" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width={Math.max(600, candles.length * 80)} height={400} fill="url(#grid)" opacity="0.1"/>
                    
                    {/* Calculate price range */}
                    {(() => {
                      const allPrices = candles.flatMap(c => [c.open, c.high, c.low, c.close]);
                      const minPrice = Math.min(...allPrices);
                      const maxPrice = Math.max(...allPrices);
                      const priceRange = maxPrice - minPrice || 1;
                      const padding = 40;
                      const chartHeight = 400 - 2 * padding;
                      
                      return (
                        <>
                          {/* Y-axis labels */}
                          <text x="10" y="30" fill="#64748b" fontSize="12">{maxPrice.toFixed(0)}</text>
                          <text x="10" y={padding + chartHeight / 2} fill="#64748b" fontSize="12">{((maxPrice + minPrice) / 2).toFixed(0)}</text>
                          <text x="10" y={padding + chartHeight + 15} fill="#64748b" fontSize="12">{minPrice.toFixed(0)}</text>
                          
                          {/* Candles */}
                          {candles.map((candle, idx) => {
                            const x = 60 + idx * 70;
                            const scale = chartHeight / priceRange;
                            const yHigh = padding + (maxPrice - candle.high) * scale;
                            const yLow = padding + (maxPrice - candle.low) * scale;
                            const yOpen = padding + (maxPrice - candle.open) * scale;
                            const yClose = padding + (maxPrice - candle.close) * scale;
                            const bodyTop = Math.min(yOpen, yClose);
                            const bodyBottom = Math.max(yOpen, yClose);
                            const bodyHeight = Math.max(bodyBottom - bodyTop, 2);
                            const color = candle.isUp ? '#10b981' : '#ef4444';
                            
                            return (
                              <g key={idx}>
                                {/* Wick */}
                                <line x1={x} y1={yHigh} x2={x} y2={yLow} stroke={color} strokeWidth="1" opacity="0.6"/>
                                {/* Body */}
                                <rect
                                  x={x - 20}
                                  y={bodyTop}
                                  width={40}
                                  height={bodyHeight}
                                  fill={color}
                                  opacity="0.8"
                                  stroke={color}
                                  strokeWidth="1"
                                />
                                {/* Time label */}
                                <text
                                  x={x}
                                  y={padding + chartHeight + 20}
                                  textAnchor="middle"
                                  fill="#64748b"
                                  fontSize="11"
                                  transform={`rotate(45, ${x}, ${padding + chartHeight + 20})`}
                                >
                                  {candle.time.split(':').slice(0, 2).join(':')}
                                </text>
                              </g>
                            );
                          })}
                          
                          {/* Axes */}
                          <line x1="40" y1={padding} x2="40" y2={padding + chartHeight} stroke="#475569" strokeWidth="1"/>
                          <line x1="40" y1={padding + chartHeight} x2={Math.max(600, candles.length * 80)} y2={padding + chartHeight} stroke="#475569" strokeWidth="1"/>
                        </>
                      );
                    })()}
                  </svg>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-slate-500">
                  No candle data available
                </div>
              )}
            </div>

            {/* Equity Curve Chart (below candles) */}
            <div className="bg-[#0a0a0a] p-6 rounded-lg border border-white/10 shadow-lg">
              <h2 className="text-lg font-bold text-white mb-4">Equity Curve</h2>
              {equity.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={equity} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis 
                      dataKey="time" 
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      tickFormatter={(time) => {
                        try {
                          return new Date(time).toLocaleTimeString();
                        } catch {
                          return time;
                        }
                      }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Equity (₹)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #7300BD',
                        borderRadius: '6px'
                      }}
                      labelStyle={{ color: '#fff' }}
                      formatter={(value: any) => {
                        if (typeof value === 'number') {
                          return value.toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
                        }
                        return value;
                      }}
                      labelFormatter={(label) => {
                        try {
                          return new Date(label).toLocaleString();
                        } catch {
                          return label;
                        }
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="equity" 
                      stroke="#7300BD" 
                      dot={false}
                      strokeWidth={2}
                      isAnimationActive={true}
                      name="Equity Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-96 flex items-center justify-center text-slate-500">
                  No data available
                </div>
              )}
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Total Candles</div>
                <div className="text-2xl font-bold text-slate-200">{candles.length}</div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Current Equity</div>
                <div className="text-2xl font-bold text-green-500">
                  {equity.length > 0 ? equity[equity.length - 1].equity.toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Highest Equity</div>
                <div className="text-2xl font-bold text-green-500">
                  {equity.length > 0 ? Math.max(...equity.map(e => e.equity)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                </div>
              </div>
              <div className="bg-[#0a0a0a] p-4 rounded-lg border border-white/10">
                <div className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">Lowest Equity</div>
                <div className="text-2xl font-bold text-red-500">
                  {equity.length > 0 ? Math.min(...equity.map(e => e.equity)).toLocaleString('en-IN', { style: 'currency', currency: 'INR' }) : '-'}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ChartPage;
