// Test helpers: provide minimal globals and module stubs so TypeScript doesn't report test-only errors
declare var describe: any;
declare var it: any;
declare var test: any;
declare var expect: any;

declare module '../src/engine/backtest' {
  export function runBacktest(...args: any[]): any;
}

declare module '../src/types/engine' {
  export type Bar = any;
  export type StrategyParams = any;
  export type TradeRecord = any;
  export type Summary = any;
  export type Marker = any;
  export type BacktestResult = any;
}
