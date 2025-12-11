/**
 * ChartWithMarkers: lightweight-charts integration with entry/exit markers.
 * Displays candles and strategy markers (E#n, X#n).
 * Date: 2025-12-11
 */

import React, { useEffect, useRef } from 'react';
import { createChart, ColorType, IChartApi, ISeriesApi } from 'lightweight-charts';
import { Bar, Marker } from '../types/engine';

interface ChartWithMarkersProps {
  bars: Bar[];
  markers: Marker[];
  title?: string;
}

export const ChartWithMarkers: React.FC<ChartWithMarkersProps> = ({
  bars,
  markers,
  title = 'Price Chart',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);

  useEffect(() => {
    if (!containerRef.current || !bars.length) return;

    // Create chart
    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: '#1a1a1a' },
        textColor: '#d1d5db',
      },
      width: containerRef.current.clientWidth,
      height: 400,
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
      },
    });

    // Create candle series
    const candleSeries = chart.addCandlestickSeries({
      upColor: '#10b981',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#10b981',
      wickDownColor: '#ef4444',
      wickUpColor: '#10b981',
    });

    // Convert bars to chart format
    const chartData = bars.map(bar => {
      // Parse ISO datetime to unix timestamp
      const time = Math.floor(new Date(bar.dt).getTime() / 1000);
      return {
        time,
        open: bar.open,
        high: bar.high,
        low: bar.low,
        close: bar.close,
      };
    });

    candleSeries.setData(chartData);

    // Convert markers to chart format
    const chartMarkers = markers.map(marker => {
      const time = Math.floor(new Date(marker.dt).getTime() / 1000);
      return {
        time,
        position: marker.shape === 'arrowUp' ? 'belowBar' : 'aboveBar',
        color: marker.color || (marker.shape === 'arrowUp' ? '#10b981' : '#ef4444'),
        shape: marker.shape === 'arrowUp' ? 'arrowUp' : 'arrowDown',
        text: marker.text,
      };
    });

    if (chartMarkers.length > 0) {
      candleSeries.setMarkers(chartMarkers);
    }

    // Fit content
    chart.timeScale().fitContent();

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;

    // Handle resize
    const handleResize = () => {
      if (containerRef.current && chart) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (chart) chart.remove();
    };
  }, [bars, markers]);

  return (
    <div className="w-full bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-800">
        <h3 className="text-slate-100 font-semibold">{title}</h3>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
};

export default ChartWithMarkers;
