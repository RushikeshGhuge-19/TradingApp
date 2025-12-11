import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: '📊 Dashboard', icon: '📊' },
    { path: '/strategy', label: '⚙️ Strategy', icon: '⚙️' },
    { path: '/backtest', label: '🔬 Backtest', icon: '🔬' },
    { path: '/strategy-dashboard', label: '📈 Results', icon: '📈' },
    { path: '/charts', label: '📉 Charts', icon: '📉' },
  ];

  return (
    <header className="bg-black border-b border-white/10 sticky top-0 z-50 backdrop-blur-md bg-opacity-80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo & Brand */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div 
            className="w-8 h-8 rounded flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(115,0,189,0.5)]"
            style={{ backgroundColor: '#7300BD' }}
          >
            A
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            AlgoStrategy <span style={{ color: '#7300BD' }}>Pro</span>
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex items-center gap-6 border-l border-white/10 pl-6 ml-6">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`text-xs font-medium transition py-1 px-2 rounded ${
                isActive(item.path)
                  ? 'text-[#7300BD] bg-[#7300BD]/10 border border-[#7300BD]/50'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title={item.label}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Status Indicator */}
        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full animate-pulse bg-green-500"></span>
            <span className="text-green-500 font-medium tracking-wide hidden sm:inline">ONLINE</span>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
