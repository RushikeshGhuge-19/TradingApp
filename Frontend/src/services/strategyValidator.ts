/**
 * Strategy DSL Validator
 * Comprehensive validation with helpful error messages
 */

import { StrategyDSL, ValidationError, IndicatorDef, LogicNode, Operand } from '../types/rule-dsl';

// ============================================================================
// Validator Class
// ============================================================================

export class StrategyValidator {
  errors: ValidationError[] = [];
  warnings: ValidationError[] = [];

  validate(strategy: StrategyDSL): ValidationError[] {
    this.errors = [];
    this.warnings = [];

    this.validateBasics(strategy);
    this.validateIndicators(strategy);
    this.validateRules(strategy);
    this.validateRisk(strategy);
    this.validateExecution(strategy);

    return [...this.errors, ...this.warnings];
  }

  // ========================================================================
  // Basics
  // ========================================================================

  private validateBasics(strategy: StrategyDSL) {
    if (!strategy.name || strategy.name.trim() === "") {
      this.addError("name", "Strategy name is required");
    }

    if (!strategy.meta) {
      this.addError("meta", "Strategy metadata is required");
    }

    if (!strategy.indicators) {
      this.addError("indicators", "Indicators array is required");
    }

    if (!strategy.rules) {
      this.addError("rules", "Rules object is required");
    }

    if (!strategy.risk) {
      this.addError("risk", "Risk configuration is required");
    }

    if (!strategy.execution) {
      this.addError("execution", "Execution configuration is required");
    }
  }

  // ========================================================================
  // Indicators
  // ========================================================================

  private validateIndicators(strategy: StrategyDSL) {
    if (!Array.isArray(strategy.indicators)) {
      this.addError("indicators", "Indicators must be an array");
      return;
    }

    const indicatorIds = new Set<string>();

    for (let i = 0; i < strategy.indicators.length; i++) {
      const ind = strategy.indicators[i];
      const path = `indicators[${i}]`;

      // Check ID uniqueness
      if (!ind.id || ind.id.trim() === "") {
        this.addError(`${path}.id`, "Indicator ID is required");
      } else if (indicatorIds.has(ind.id)) {
        this.addError(`${path}.id`, `Duplicate indicator ID: "${ind.id}"`);
      } else {
        indicatorIds.add(ind.id);
      }

      // Check type
      const validTypes = ["rsi", "ema", "sma", "atr", "bb", "macd", "stoch", "adx", "custom"];
      if (!ind.type || !validTypes.includes(ind.type)) {
        this.addError(`${path}.type`, `Invalid indicator type. Must be one of: ${validTypes.join(", ")}`);
      }

      // Check params
      if (!ind.params || typeof ind.params !== "object") {
        this.addError(`${path}.params`, "Indicator params must be an object");
      } else {
        this.validateIndicatorParams(ind, path);
      }
    }

    // Check for circular dependencies
    this.checkCircularDependencies(strategy.indicators);
  }

  private validateIndicatorParams(ind: IndicatorDef, path: string) {
    const params = ind.params;

    // Type-specific validation
    switch (ind.type) {
      case "rsi":
        if (params.period && (params.period < 2 || params.period > 100)) {
          this.addError(`${path}.params.period`, "RSI period must be between 2 and 100");
        }
        break;

      case "ema":
      case "sma":
        if (params.period && (params.period < 1 || params.period > 500)) {
          this.addError(`${path}.params.period`, "EMA/SMA period must be between 1 and 500");
        }
        if (params.source && params.source.startsWith("indicator:")) {
          // Will check later if indicator exists
        }
        break;

      case "atr":
      case "adx":
        if (params.period && (params.period < 1 || params.period > 100)) {
          this.addError(`${path}.params.period`, "Period must be between 1 and 100");
        }
        break;

      case "bb":
        if (params.period && (params.period < 2 || params.period > 500)) {
          this.addError(`${path}.params.period`, "Bollinger Bands period must be between 2 and 500");
        }
        if (params.stdDev && (params.stdDev < 0.1 || params.stdDev > 10)) {
          this.addError(`${path}.params.stdDev`, "stdDev must be between 0.1 and 10");
        }
        break;

      case "macd":
        if (params.fastPeriod && params.fastPeriod < 1) {
          this.addError(`${path}.params.fastPeriod`, "fastPeriod must be >= 1");
        }
        if (params.slowPeriod && params.slowPeriod < 1) {
          this.addError(`${path}.params.slowPeriod`, "slowPeriod must be >= 1");
        }
        if (
          params.fastPeriod &&
          params.slowPeriod &&
          params.fastPeriod >= params.slowPeriod
        ) {
          this.addWarning(
            `${path}.params`,
            "fastPeriod should be less than slowPeriod"
          );
        }
        break;

      case "stoch":
        if (params.kPeriod && params.kPeriod < 2) {
          this.addError(`${path}.params.kPeriod`, "kPeriod must be >= 2");
        }
        break;
    }
  }

  private checkCircularDependencies(indicators: IndicatorDef[]) {
    const graph: Record<string, Set<string>> = {};
    const indicatorMap = new Map(indicators.map((i) => [i.id, i]));

    // Build dependency graph
    for (const ind of indicators) {
      graph[ind.id] = new Set();
      if (ind.params.source && ind.params.source.startsWith("indicator:")) {
        const depId = ind.params.source.replace("indicator:", "");
        if (indicatorMap.has(depId)) {
          graph[ind.id].add(depId);
        }
      }
    }

    // DFS to detect cycles
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycle = (id: string): boolean => {
      visited.add(id);
      recStack.add(id);

      for (const dep of graph[id] || []) {
        if (!visited.has(dep)) {
          if (hasCycle(dep)) return true;
        } else if (recStack.has(dep)) {
          return true;
        }
      }

      recStack.delete(id);
      return false;
    };

    for (const id of Object.keys(graph)) {
      if (!visited.has(id) && hasCycle(id)) {
        this.addError("indicators", `Circular dependency detected involving indicator: ${id}`);
      }
    }
  }

  // ========================================================================
  // Rules
  // ========================================================================

  private validateRules(strategy: StrategyDSL) {
    const rules = strategy.rules;

    if (!rules.entry && !rules.entryShort) {
      this.addWarning("rules", "No entry rule defined (entry and entryShort both missing)");
    }

    if (rules.entry) {
      this.validateLogicNode(rules.entry, "rules.entry", strategy.indicators);
    }

    if (rules.entryShort) {
      this.validateLogicNode(rules.entryShort, "rules.entryShort", strategy.indicators);
    }

    if (rules.exit) {
      this.validateLogicNode(rules.exit, "rules.exit", strategy.indicators);
    }
  }

  private validateLogicNode(node: LogicNode, path: string, indicators: IndicatorDef[]) {
    if (!node) {
      this.addError(path, "Logic node is required");
      return;
    }

    const indicatorIds = new Set(indicators.map((i) => i.id));

    switch (node.type) {
      case "and":
      case "or":
        if (!Array.isArray(node.nodes) || node.nodes.length === 0) {
          this.addError(`${path}.nodes`, `${node.type.toUpperCase()} node must have at least one child`);
        } else {
          node.nodes.forEach((n, i) =>
            this.validateLogicNode(n, `${path}.nodes[${i}]`, indicators)
          );
        }
        break;

      case "not":
        if (!node.node) {
          this.addError(`${path}.node`, "NOT node must have a child");
        } else {
          this.validateLogicNode(node.node, `${path}.node`, indicators);
        }
        break;

      case "condition":
        this.validateOperand(node.left, `${path}.left`, indicatorIds);
        this.validateOperand(node.right, `${path}.right`, indicatorIds);
        break;

      case "cross":
      case "crossdown":
        this.validateOperand(node.a, `${path}.a`, indicatorIds);
        this.validateOperand(node.b, `${path}.b`, indicatorIds);
        break;

      case "timefilter":
        if (node.start && !this.isValidTime(node.start)) {
          this.addError(`${path}.start`, `Invalid time format. Use HH:mm (e.g., "09:30")`);
        }
        if (node.end && !this.isValidTime(node.end)) {
          this.addError(`${path}.end`, `Invalid time format. Use HH:mm (e.g., "15:30")`);
        }
        if (node.days) {
          const validDays = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];
          for (const day of node.days) {
            if (!validDays.includes(day)) {
              this.addError(`${path}.days`, `Invalid day: ${day}. Must be one of: ${validDays.join(", ")}`);
            }
          }
        }
        break;
    }
  }

  private validateOperand(operand: Operand, path: string, indicatorIds: Set<string>) {
    if (!operand) {
      this.addError(path, "Operand is required");
      return;
    }

    switch (operand.kind) {
      case "indicator":
        if (!operand.id) {
          this.addError(`${path}.id`, "Indicator ID is required");
        } else if (!indicatorIds.has(operand.id)) {
          this.addError(`${path}.id`, `Indicator not found: ${operand.id}`);
        }
        break;

      case "bar":
        const validFields = ["open", "high", "low", "close", "volume"];
        if (!validFields.includes(operand.field)) {
          this.addError(`${path}.field`, `Invalid bar field. Must be one of: ${validFields.join(", ")}`);
        }
        break;

      case "number":
        if (typeof operand.value !== "number") {
          this.addError(`${path}.value`, "Number operand value must be a number");
        }
        break;

      case "time":
        if (operand.spec && !this.isValidTime(operand.spec)) {
          this.addError(`${path}.spec`, `Invalid time format. Use HH:mm (e.g., "09:30")`);
        }
        break;

      case "variable":
        if (!operand.name) {
          this.addError(`${path}.name`, "Variable name is required");
        }
        break;
    }
  }

  // ========================================================================
  // Risk
  // ========================================================================

  private validateRisk(strategy: StrategyDSL) {
    const risk = strategy.risk;

    if (!risk.sizing) {
      this.addError("risk.sizing", "Position sizing is required");
    } else {
      const sizing = risk.sizing;
      switch (sizing.type) {
        case "fixed_lot":
          if (!sizing.lots || sizing.lots < 1) {
            this.addError("risk.sizing.lots", "Lot size must be >= 1");
          }
          break;
        case "percent_capital":
          if (!sizing.percent || sizing.percent <= 0 || sizing.percent > 100) {
            this.addError("risk.sizing.percent", "Percent must be between 0 and 100");
          }
          break;
        case "fixed_quantity":
          if (!sizing.quantity || sizing.quantity < 1) {
            this.addError("risk.sizing.quantity", "Quantity must be >= 1");
          }
          break;
      }
    }

    if (risk.sl && risk.sl.enabled) {
      if (risk.sl.type === "points" || risk.sl.type === "percent") {
        if (!risk.sl.value || risk.sl.value <= 0) {
          this.addError("risk.sl.value", "Stop loss value must be > 0");
        }
      } else if (risk.sl.type === "atr") {
        if (!risk.sl.atrPeriod || risk.sl.atrPeriod < 1) {
          this.addError("risk.sl.atrPeriod", "ATR period must be >= 1");
        }
      }
    }

    if (risk.tp && risk.tp.enabled) {
      if (!risk.tp.value || risk.tp.value <= 0) {
        this.addError("risk.tp.value", "Take profit value must be > 0");
      }
    }

    if (risk.tsl && risk.tsl.enabled) {
      if (!risk.tsl.offset || risk.tsl.offset <= 0) {
        this.addError("risk.tsl.offset", "Trailing stop offset must be > 0");
      }
    }

    if (risk.maxPositionSize && risk.maxPositionSize < 1) {
      this.addError("risk.maxPositionSize", "Max position size must be >= 1");
    }

    if (risk.maxOpenPositions && risk.maxOpenPositions < 1) {
      this.addError("risk.maxOpenPositions", "Max open positions must be >= 1");
    }
  }

  // ========================================================================
  // Execution
  // ========================================================================

  private validateExecution(strategy: StrategyDSL) {
    const exec = strategy.execution;

    if (!exec.entryFill || !["CLOSE", "NEXT_OPEN", "MARKET"].includes(exec.entryFill)) {
      this.addError("execution.entryFill", 'Entry fill must be one of: "CLOSE", "NEXT_OPEN", "MARKET"');
    }

    if (exec.slippagePoints && exec.slippagePoints < 0) {
      this.addError("execution.slippagePoints", "Slippage must be >= 0");
    }

    if (!exec.charges) {
      this.addError("execution.charges", "Charges configuration is required");
    } else {
      if (!["fixed", "components"].includes(exec.charges.mode)) {
        this.addError("execution.charges.mode", 'Charges mode must be "fixed" or "components"');
      }

      if (exec.charges.mode === "fixed" && exec.charges.fixedCharge && exec.charges.fixedCharge < 0) {
        this.addError("execution.charges.fixedCharge", "Fixed charge must be >= 0");
      }

      if (exec.charges.mode === "components" && exec.charges.components) {
        for (const [key, value] of Object.entries(exec.charges.components)) {
          if (typeof value === "number" && value < 0) {
            this.addError(`execution.charges.components.${key}`, "Component charge must be >= 0");
          }
        }
      }
    }

    if (exec.contractMultiplier && exec.contractMultiplier < 1) {
      this.addError("execution.contractMultiplier", "Contract multiplier must be >= 1");
    }

    if (exec.lotSize && exec.lotSize < 1) {
      this.addError("execution.lotSize", "Lot size must be >= 1");
    }
  }

  // ========================================================================
  // Helpers
  // ========================================================================

  private isValidTime(time: string): boolean {
    const regex = /^([0-1][0-9]|2[0-3]):([0-5][0-9])$/;
    return regex.test(time);
  }

  private addError(field: string, message: string) {
    this.errors.push({ field, message, severity: "error" });
  }

  private addWarning(field: string, message: string) {
    this.warnings.push({ field, message, severity: "warning" });
  }
}

// ============================================================================
// Helper Function
// ============================================================================

export function validateStrategy(strategy: StrategyDSL): ValidationError[] {
  const validator = new StrategyValidator();
  return validator.validate(strategy);
}

export function isValidStrategy(strategy: StrategyDSL): boolean {
  const errors = validateStrategy(strategy);
  return errors.filter((e) => e.severity === "error").length === 0;
}
