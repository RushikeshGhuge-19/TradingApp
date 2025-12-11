/**
 * LiveSimulatorPage: real-time strategy replay with play/pause/speed controls.
 * Date: 2025-12-11
 */

import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../store/tradingStore';
import { createSimulator } from '../engine/liveSimulator';
import ChartWithMarkers from '../components/ChartWithMarkers';

export const LiveSimulatorPage: React.FC = () => {
  const store = useTradingStore();
  const { bars, currentStrategy, isSimulating, simulationProgress, openPositions, trades, markers } = store;
  const [simulator, setSimulator] = useState<any>(null);
  const [speed, setSpeed] = useState(1);
  const [currentPrice, setCurrentPrice] = useState(0);

  useEffect(() => {
    if (!bars.length || !currentStrategy) return;

    // Create simulator instance
    const sim = createSimulator({
      bars,
      params: currentStrategy.params,
      speed,
      tickify: true,
    });

    sim.onTick((tick: any) => {
      setCurrentPrice(tick.price);
    });

    setSimulator(sim);

    return () => {
      sim.stop();
    };
  }, [bars, currentStrategy, speed]);

  const handleStart = () => {
    if (simulator) {
      simulator.start();
      store.startLiveSimulation();
    }
  };

  const handlePause = () => {
    if (simulator) {
      simulator.pause();
      store.pauseLiveSimulation();
    }
  };

  const handleResume = () => {
    if (simulator) {
      simulator.resume();
      store.startLiveSimulation();
    }
  };

  const handleStop = () => {
    if (simulator) {
      simulator.stop();
      store.stopLiveSimulation();
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (simulator) {
      simulator.setSpeed(newSpeed);
    }
  };

  if (!bars.length) {
    return (
      <div className="min-h-screen bg-black text-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400 mb-4">No data loaded. Upload CSV from Backtest page first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Live Simulator</h1>
          <p className="text-slate-400">Paper trade replay</p>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-8 flex items-center gap-4 flex-wrap">
          <button
            onClick={handleStart}
            disabled={isSimulating}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 rounded font-semibold"
          >
            Start
          </button>

          {isSimulating ? (
            <>
              <button
                onClick={handlePause}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded font-semibold"
              >
                Pause
              </button>
              <button
                onClick={handleResume}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded font-semibold"
              >
                Resume
              </button>
            </>
          ) : null}

          <button
            onClick={handleStop}
            disabled={!isSimulating && simulationProgress === 0}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-700 rounded font-semibold"
          >
            Stop
          </button>

          {/* Speed Slider */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm text-slate-400">Speed:</label>
            <input
              type="range"
              min="1"
              max="100"
              value={speed}
              onChange={e => handleSpeedChange(parseInt(e.target.value))}
              className="w-32"
            />
            <span className="text-sm font-semibold">{speed}x</span>
          </div>

          {/* Progress */}
          <div className="w-full">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Progress</span>
              <span>{Math.round(simulationProgress * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#7300BD]"
                style={{ width: `${simulationProgress * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Info Panel */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-900 p-4 rounded border border-slate-700">
            <p className="text-slate-400 text-sm">Current Price</p>
            <p className="text-2xl font-bold text-slate-100">{currentPrice.toFixed(2)}</p>
          </div>
          <div className="bg-slate-900 p-4 rounded border border-slate-700">
            <p className="text-slate-400 text-sm">Open Positions</p>
            <p className="text-2xl font-bold text-slate-100">{openPositions.length}</p>
          </div>
          <div className="bg-slate-900 p-4 rounded border border-slate-700">
            <p className="text-slate-400 text-sm">Closed Trades</p>
            <p className="text-2xl font-bold text-slate-100">{trades.length}</p>
          </div>
        </div>

        {/* Chart */}
        <ChartWithMarkers bars={bars} markers={markers} title="Live Chart" />

        {/* Open Positions */}
        {openPositions.length > 0 && (
          <div className="mt-6 bg-slate-900 p-4 rounded border border-slate-700">
            <h3 className="text-slate-100 font-semibold mb-4">Open Positions</h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-2 px-2 text-slate-400">Symbol</th>
                  <th className="text-left py-2 px-2 text-slate-400">Dir</th>
                  <th className="text-left py-2 px-2 text-slate-400">Qty</th>
                  <th className="text-left py-2 px-2 text-slate-400">Entry Price</th>
                  <th className="text-left py-2 px-2 text-slate-400">Current Price</th>
                  <th className="text-left py-2 px-2 text-slate-400">P&L</th>
                </tr>
              </thead>
              <tbody>
                {openPositions.map(p => {
                  const pnl = p.dir === 'LONG' ? (currentPrice - p.entryPrice) * p.qty : (p.entryPrice - currentPrice) * p.qty;
                  return (
                    <tr key={p.id} className="border-b border-slate-800">
                      <td className="py-2 px-2">{p.symbol}</td>
                      <td className="py-2 px-2">{p.dir}</td>
                      <td className="py-2 px-2">{p.qty}</td>
                      <td className="py-2 px-2">{p.entryPrice.toFixed(2)}</td>
                      <td className="py-2 px-2">{currentPrice.toFixed(2)}</td>
                      <td className={`py-2 px-2 ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pnl.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveSimulatorPage;
