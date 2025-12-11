/**
 * Strategy DSL Type Definitions
 * Canonical schema for rule-based strategy composition
 * Supports form-based and code-based editing with perfect fidelity
 */

// ============================================================================
// Primitive Types
// ============================================================================

export type Comparator = ">" | "<" | ">=" | "<=" | "==" | "!=";

export type IndicatorType =
  | "rsi"
  | "ema"
  | "sma"
  | "atr"
  | "bb"
  | "macd"
  | "stoch"
  | "adx"
  | "custom";

export type BarField = "open" | "high" | "low" | "close" | "volume";

// ============================================================================
// Indicators
// ============================================================================

export interface IndicatorDef {
  id: string; // e.g., "rsi56", "ema_rsi3", must be unique within strategy
  type: IndicatorType;
  params: Record<string, any>; // e.g., { period: 56 }, { period: 3, source: "indicator:rsi56" }
  outputs?: string[]; // names of output fields this indicator provides (auto-detected if omitted)
  description?: string; // user note
}

// ============================================================================
// Operands: what conditions can reference
// ============================================================================

export type Operand =
  | { kind: "indicator"; id: string; field?: string } // e.g., {kind: "indicator", id: "rsi56", field: "value"}
  | { kind: "bar"; field: BarField } // e.g., {kind: "bar", field: "close"}
  | { kind: "number"; value: number } // e.g., {kind: "number", value: 50}
  | { kind: "time"; spec?: string } // e.g., {kind: "time", spec: "09:30"} for time-based filtering
  | { kind: "variable"; name: string }; // from advanced code block

// ============================================================================
// Logic Nodes: composite boolean expressions
// ============================================================================

export type LogicNode =
  | { type: "and"; nodes: LogicNode[] } // all conditions must be true
  | { type: "or"; nodes: LogicNode[] } // any condition must be true
  | { type: "not"; node: LogicNode } // negation
  | { type: "condition"; left: Operand; op: Comparator; right: Operand } // binary comparison
  | { type: "cross"; a: Operand; b: Operand } // a crosses above b (a[i-1] <= b[i-1] && a[i] > b[i])
  | { type: "crossdown"; a: Operand; b: Operand } // a crosses below b (a[i-1] >= b[i-1] && a[i] < b[i])
  | {
      type: "timefilter";
      start?: string; // HH:mm format, e.g., "09:15"
      end?: string; // HH:mm format, e.g., "15:30"
      days?: string[]; // ["MON", "TUE", "WED", "THU", "FRI"]
    };

// ============================================================================
// Position Sizing
// ============================================================================

export type SizingType = "fixed_lot" | "percent_capital" | "fixed_quantity" | "dynamic";

export interface Sizing {
  type: SizingType;
  lots?: number; // for fixed_lot
  quantity?: number; // for fixed_quantity
  percent?: number; // for percent_capital (e.g., 5 = 5% of equity)
  dynamic?: {
    // for dynamic mode (advanced)
    volatilityMultiplier?: number;
    baseQuantity?: number;
  };
}

// ============================================================================
// Risk Management
// ============================================================================

export interface StopLoss {
  enabled: boolean;
  type: "points" | "percent" | "atr";
  value: number; // for points/percent; for atr: multiplier
  atrPeriod?: number; // if type === "atr"
}

export interface TakeProfit {
  enabled: boolean;
  type: "points" | "percent";
  value: number;
  lockAtTp?: boolean; // if true, once TP price reached, lock stop at entry + (TP - lockOffset)
  lockOffset?: number; // lock offset in points (default = 0, meaning lock at breakeven)
}

export interface TrailingStopLoss {
  enabled: boolean;
  offset: number; // points to trail behind extreme
  afterTpLock?: boolean; // if true, trailing only active after TP is hit (or in first leg if TP locked)
}

export interface RiskConfig {
  sizing: Sizing;
  sl?: StopLoss;
  tp?: TakeProfit;
  tsl?: TrailingStopLoss;
  maxPositionSize?: number; // in lots
  maxOpenPositions?: number; // allow N concurrent positions
  allowPyramiding?: boolean; // default false
}

// ============================================================================
// Execution Settings
// ============================================================================

export type EntryFill = "CLOSE" | "NEXT_OPEN" | "MARKET";

export type ChargesMode = "fixed" | "components";

export interface ChargesConfig {
  mode: ChargesMode;
  fixedCharge?: number; // flat rupees per trade
  components?: {
    // component-based: sum these to get total charge
    brokerage?: number;
    exchange?: number;
    stt?: number;
    stamp?: number;
    gst?: number;
    [key: string]: number | undefined;
  };
}

export interface ExecutionConfig {
  entryFill: EntryFill; // fill rule for entry
  slippagePoints?: number; // points added to entry/exit price (simulated cost)
  charges: ChargesConfig;
  contractMultiplier?: number; // e.g., 1 for stocks, 100 for bank nifty
  lotSize?: number; // qty per lot
  allowPartialFill?: boolean; // default false (all or nothing)
}

// ============================================================================
// Advanced Code Block
// ============================================================================

export interface AdvancedConfig {
  language: "js" | "py";
  code?: string; // user-provided code snippet
  warning?: string; // stores "sandbox" or similar if not sandboxed
}

// ============================================================================
// Strategy Metadata
// ============================================================================

export interface StrategyMeta {
  defaultCapital?: number; // for backtest convenience
  timeframe?: string; // "5m", "15m", "1h", "4h", "1d"
  symbols?: string[]; // ["NIFTYBANK.NS"] or multi-leg ["A", "B"]
  allowMultiplePositions?: boolean; // for multi-leg
  description?: string;
  tags?: string[];
}

// ============================================================================
// Rules Definition
// ============================================================================

export interface RuleSet {
  entry?: LogicNode; // condition that triggers entry (LONG)
  entryShort?: LogicNode; // optional separate condition for SHORT (if omitted, SHORT disabled)
  exit?: LogicNode; // condition that triggers exit (regardless of direction)
  exitOnOpposite?: boolean; // if true, opposite entry signal closes current position
}

// ============================================================================
// Top-Level Strategy DSL
// ============================================================================

export interface StrategyDSL {
  id?: string; // uuid assigned on save
  name: string;
  version: number; // bump on each save
  createdAt?: string; // ISO
  updatedAt?: string; // ISO
  meta: StrategyMeta;
  indicators: IndicatorDef[];
  rules: RuleSet;
  risk: RiskConfig;
  execution: ExecutionConfig;
  advanced?: AdvancedConfig;
}

// ============================================================================
// Validation Errors
// ============================================================================

export interface ValidationError {
  field: string; // e.g., "indicators[0].params.period"
  message: string;
  severity: "error" | "warning";
}

// ============================================================================
// Compiler Output
// ============================================================================

export interface CompiledStrategy {
  evaluate: (
    barIndex: number,
    bars: any[],
    context: RuntimeContext
  ) => {
    entrySignal?: "LONG" | "SHORT" | null;
    exitSignal?: boolean | null;
    debug?: {
      nodeResults?: Record<string, boolean>;
      variables?: Record<string, any>;
    };
  };
  meta: {
    indicatorsCompiled: Record<string, any>;
    requiredLookback: number;
    indicatorIds: string[];
  };
}

// ============================================================================
// Runtime Context
// ============================================================================

export interface RuntimeContext {
  bar: any; // current bar
  barIndex: number;
  bars: any[];
  indicatorValues: Record<string, any>; // precomputed indicator outputs
  position: {
    direction: "LONG" | "SHORT" | null;
    entryPrice?: number;
    entryIndex?: number;
    highestPrice?: number;
    lowestPrice?: number;
  };
  equity: number;
  variables?: Record<string, any>; // from advanced code
}

// ============================================================================
// Backtest / Live Simulator Types
// ============================================================================

export interface BacktestTrade {
  tradeNo: number;
  direction: "LONG" | "SHORT";
  entryTime: string; // ISO datetime
  entryPrice: number;
  exitTime: string;
  exitPrice: number;
  entryReason?: string;
  exitReason: string;
  pnlPoints: number;
  pnlPercent: number;
  quantity: number;
  contractMultiplier: number;
  gross: number; // pnlPoints * quantity * contractMultiplier
  charges: number;
  net: number;
  equity: number;
  equityPercent: number;
}

export interface BacktestSummary {
  totalTrades: number;
  winTrades: number;
  lossTrades: number;
  winRate: number;
  grossPnl: number;
  totalCharges: number;
  netPnl: number;
  maxDrawdown: number;
  maxDrawdownPercent: number;
  profitFactor: number;
  expectancy: number;
  avgWin: number;
  avgLoss: number;
  largestWin: number;
  largestLoss: number;
  totalVolume: number;
  initialEquity: number;
  finalEquity: number;
  returnPercent: number;
}

export interface BacktestResult {
  strategy: StrategyDSL;
  trades: BacktestTrade[];
  summary: BacktestSummary;
  equitySeries: Array<{ timestamp: string; equity: number }>;
  markers?: Array<{
    timestamp: string;
    type: "entry" | "exit";
    price: number;
    direction: "LONG" | "SHORT";
  }>;
}

// ============================================================================
// Strategy Store
// ============================================================================

export interface StrategyStoreSummary {
  id: string;
  name: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}

export interface StrategyStoreChangeLog {
  version: number;
  timestamp: string;
  summary: string; // e.g., "Updated entry condition"
  diff?: any; // optional detailed diff
}
