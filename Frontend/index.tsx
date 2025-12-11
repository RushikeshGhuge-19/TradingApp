import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App';
import ChartPage from './ChartPage';
import StrategyBuilder from './src/pages/StrategyBuilder';
import StrategyBuilderForm from './src/pages/StrategyBuilderForm';
import StrategyDashboard from './src/pages/StrategyDashboard';
import BacktestPage from './src/pages/BacktestPage';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/dashboard" element={<App />} />
        <Route path="/charts" element={<ChartPage />} />
        <Route path="/builder" element={<StrategyBuilderForm />} />
        <Route path="/backtest" element={<BacktestPage />} />
        <Route path="/strategy" element={<StrategyBuilder />} />
        <Route path="/strategy-dashboard" element={<StrategyDashboard />} />
      </Routes>
    </Router>
  </React.StrictMode>
);