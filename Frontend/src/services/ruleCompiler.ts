/**
 * Rule Compiler
 * Converts Strategy DSL into executable functions
 * Handles indicator precomputation, logic evaluation, safe guards
 */

import {
  StrategyDSL,
  CompiledStrategy,
  RuntimeContext,
  LogicNode,
  Operand,
  IndicatorDef,
} from '../types/rule-dsl';
import { precomputeIndicators, getIndicatorValue, PrecomputedIndicators } from './indicatorRegistry';
import { validateStrategy, isValidStrategy } from './strategyValidator';

// ============================================================================
// Compiled Logic Node: recursive evaluator
// ============================================================================

type LogicEvaluator = (
  barIndex: number,
  bars: any[],
  context: RuntimeContext
) => boolean | null;

function compileLogicNode(
  node: LogicNode,
  precomputed: PrecomputedIndicators,
  variables?: Record<string, any>
): LogicEvaluator {
  if (!node) {
    return () => false;
  }

  switch (node.type) {
    case "and": {
      const evaluators = node.nodes.map((n) => compileLogicNode(n, precomputed, variables));
      return (barIndex, bars, context) => {
        for (const evaluator of evaluators) {
          const result = evaluator(barIndex, bars, context);
          if (result === false) return false;
        }
        return true;
      };
    }

    case "or": {
      const evaluators = node.nodes.map((n) => compileLogicNode(n, precomputed, variables));
      return (barIndex, bars, context) => {
        for (const evaluator of evaluators) {
          const result = evaluator(barIndex, bars, context);
          if (result === true) return true;
        }
        return false;
      };
    }

    case "not": {
      const evaluator = compileLogicNode(node.node, precomputed, variables);
      return (barIndex, bars, context) => {
        const result = evaluator(barIndex, bars, context);
        if (result === null) return null;
        return !result;
      };
    }

    case "condition": {
      const leftEval = compileOperand(node.left, precomputed, variables);
      const rightEval = compileOperand(node.right, precomputed, variables);
      const op = node.op;

      return (barIndex, bars, context) => {
        const leftVal = leftEval(barIndex, bars, context);
        const rightVal = rightEval(barIndex, bars, context);

        if (leftVal === null || rightVal === null) return null;

        switch (op) {
          case ">":
            return leftVal > rightVal;
          case "<":
            return leftVal < rightVal;
          case ">=":
            return leftVal >= rightVal;
          case "<=":
            return leftVal <= rightVal;
          case "==":
            return Math.abs(leftVal - rightVal) < 1e-9;
          case "!=":
            return Math.abs(leftVal - rightVal) >= 1e-9;
          default:
            return false;
        }
      };
    }

    case "cross": {
      const aEval = compileOperand(node.a, precomputed, variables);
      const bEval = compileOperand(node.b, precomputed, variables);

      return (barIndex, bars, context) => {
        if (barIndex === 0) return false; // need previous bar

        const aPrev = aEval(barIndex - 1, bars, context);
        const aCurr = aEval(barIndex, bars, context);
        const bPrev = bEval(barIndex - 1, bars, context);
        const bCurr = bEval(barIndex, bars, context);

        if (aPrev === null || aCurr === null || bPrev === null || bCurr === null) return null;

        return aPrev <= bPrev && aCurr > bCurr;
      };
    }

    case "crossdown": {
      const aEval = compileOperand(node.a, precomputed, variables);
      const bEval = compileOperand(node.b, precomputed, variables);

      return (barIndex, bars, context) => {
        if (barIndex === 0) return false;

        const aPrev = aEval(barIndex - 1, bars, context);
        const aCurr = aEval(barIndex, bars, context);
        const bPrev = bEval(barIndex - 1, bars, context);
        const bCurr = bEval(barIndex, bars, context);

        if (aPrev === null || aCurr === null || bPrev === null || bCurr === null) return null;

        return aPrev >= bPrev && aCurr < bCurr;
      };
    }

    case "timefilter": {
      return (barIndex, bars, context) => {
        const bar = bars[barIndex];
        if (!bar.time && !bar.datetime) return true; // no time info, skip filter

        const time = new Date(bar.time || bar.datetime);
        const hhmm = `${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;

        if (node.start && hhmm < node.start) return false;
        if (node.end && hhmm > node.end) return false;

        if (node.days && node.days.length > 0) {
          const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
          const dayName = dayNames[time.getDay()];
          if (!node.days.includes(dayName)) return false;
        }

        return true;
      };
    }

    default:
      return () => false;
  }
}

// ============================================================================
// Compiled Operand: evaluates to a number
// ============================================================================

type OperandEvaluator = (
  barIndex: number,
  bars: any[],
  context: RuntimeContext
) => number | null;

function compileOperand(
  operand: Operand,
  precomputed: PrecomputedIndicators,
  variables?: Record<string, any>
): OperandEvaluator {
  switch (operand.kind) {
    case "indicator": {
      return (barIndex, bars, context) => {
        const value = getIndicatorValue(operand.id, operand.field, barIndex, precomputed);
        return value;
      };
    }

    case "bar": {
      return (barIndex, bars, context) => {
        const bar = bars[barIndex];
        if (!bar) return null;
        const value = bar[operand.field];
        return typeof value === "number" ? value : null;
      };
    }

    case "number": {
      return (barIndex, bars, context) => operand.value;
    }

    case "time": {
      // Time operands don't return numbers; used in special contexts
      return (barIndex, bars, context) => null;
    }

    case "variable": {
      return (barIndex, bars, context) => {
        if (context.variables && operand.name in context.variables) {
          const value = context.variables[operand.name];
          return typeof value === "number" ? value : null;
        }
        return null;
      };
    }

    default:
      return () => null;
  }
}

// ============================================================================
// Compute Required Lookback
// ============================================================================

function computeRequiredLookback(indicators: IndicatorDef[]): number {
  let maxLookback = 0;

  for (const ind of indicators) {
    let lookback = 1;

    switch (ind.type) {
      case "rsi":
      case "atr":
      case "adx":
        lookback = (ind.params.period || 14) + 1;
        break;

      case "ema":
      case "sma":
        lookback = (ind.params.period || 12) + 1;
        break;

      case "bb":
        lookback = (ind.params.period || 20) + 1;
        break;

      case "macd":
        lookback = (ind.params.slowPeriod || 26) + (ind.params.signalPeriod || 9) + 2;
        break;

      case "stoch":
        lookback = (ind.params.kPeriod || 14) + (ind.params.dPeriod || 3) + (ind.params.smoothK || 3) + 2;
        break;
    }

    maxLookback = Math.max(maxLookback, lookback);
  }

  return maxLookback;
}

// ============================================================================
// Main Compiler
// ============================================================================

export class RuleCompiler {
  compile(strategy: StrategyDSL): CompiledStrategy {
    // Validate
    const errors = validateStrategy(strategy);
    const criticalErrors = errors.filter((e) => e.severity === "error");
    if (criticalErrors.length > 0) {
      const messages = criticalErrors.map((e) => `${e.field}: ${e.message}`).join("; ");
      throw new Error(`Strategy validation failed: ${messages}`);
    }

    // Precompute all indicators
    let precomputed: PrecomputedIndicators = {};
    const requiredLookback = computeRequiredLookback(strategy.indicators);

    // Compile logic nodes
    const entryEvaluator = strategy.rules.entry
      ? compileLogicNode(strategy.rules.entry, precomputed)
      : () => false;

    const entryShortEvaluator = strategy.rules.entryShort
      ? compileLogicNode(strategy.rules.entryShort, precomputed)
      : null;

    const exitEvaluator = strategy.rules.exit
      ? compileLogicNode(strategy.rules.exit, precomputed)
      : () => false;

    // Return compiled strategy
    return {
      evaluate: (barIndex, bars, context) => {
        // Lazy-load precomputed indicators (first bar evaluation)
        if (Object.keys(precomputed).length === 0) {
          precomputed = precomputeIndicators(strategy.indicators, bars);
          context.indicatorValues = precomputed;
        }

        let entrySignal: "LONG" | "SHORT" | null = null;
        let exitSignal: boolean | null = null;

        const debug: { nodeResults?: any; variables?: any } = {};

        // Evaluate entry
        if (context.position.direction === null) {
          const longEntry = entryEvaluator(barIndex, bars, context);
          if (longEntry) {
            entrySignal = "LONG";
          } else if (entryShortEvaluator) {
            const shortEntry = entryShortEvaluator(barIndex, bars, context);
            if (shortEntry) {
              entrySignal = "SHORT";
            }
          }
        }

        // Evaluate exit
        if (context.position.direction !== null) {
          exitSignal = exitEvaluator(barIndex, bars, context) ? true : false;
        }

        return {
          entrySignal: entrySignal || null,
          exitSignal: exitSignal || null,
          debug,
        };
      },

      meta: {
        indicatorsCompiled: precomputed,
        requiredLookback,
        indicatorIds: strategy.indicators.map((i) => i.id),
      },
    };
  }
}

// ============================================================================
// Helper
// ============================================================================

export function compileStrategy(strategy: StrategyDSL): CompiledStrategy {
  const compiler = new RuleCompiler();
  return compiler.compile(strategy);
}
