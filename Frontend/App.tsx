import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './components/Navbar';
import SummaryCards from './components/SummaryCards';
import OpenPositionPanel from './components/OpenPositionPanel';
import ChartsSection from './components/ChartsSection';
import TradeHistoryTable from './components/TradeHistoryTable';
import { fetchStatus, fetchTrades, fetchEquityCurve } from './services/api';
import { StatusResponse, Trade, EquityPoint } from './types';

function App() {
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [equity, setEquity] = useState<EquityPoint[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(true);

  // Polling Effect
  useEffect(() => {
    const loadData = async () => {
      try {
        const [statusData, tradesData, equityData] = await Promise.all([
          fetchStatus(),
          fetchTrades(),
          fetchEquityCurve()
        ]);
        
        setStatus(statusData);
        setTrades(tradesData);
        setEquity(equityData);
        setLastUpdated(new Date());
      } catch (error) {
        console.error("Failed to fetch data", error);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial load
    loadData();

    // Poll every 1 second to simulate real-time socket behavior
    const intervalId = setInterval(loadData, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="min-h-screen bg-black text-slate-200 font-sans pb-10">
      {/* Navbar */}
      <Navbar />

      {/* Header with Status - Only on Dashboard */}
      <header className="bg-black border-b border-white/10 backdrop-blur-md bg-opacity-80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-end">
          <div className="flex items-center gap-4 text-xs text-slate-500">
             <div>Last Update: {lastUpdated.toLocaleTimeString()}</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading ? (
          <div className="flex justify-center items-center h-64 text-slate-500">
             Loading Strategy Engine...
          </div>
        ) : (
          <>
            <SummaryCards status={status} />
            <OpenPositionPanel status={status} />
            
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6 mb-6">
               <ChartsSection equityData={equity} tradeData={trades} />
            </div>

            <TradeHistoryTable trades={trades} />
          </>
        )}
      </main>
    </div>
  );
}

export default App;