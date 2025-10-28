import { WorkflowCondition } from '../types/workflow';

export class ConditionalEngine {
  /**
   * Evaluates a set of conditions against a context object
   * All conditions must be true for the overall result to be true (AND logic)
   */
  evaluateConditions(conditions: WorkflowCondition[], context: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) {
      return true; // No conditions means always true
    }

    return conditions.every(condition => this.evaluateSingleCondition(condition, context));
  }

  /**
   * Evaluates a single condition
   */
  evaluateSingleCondition(condition: WorkflowCondition, context: Record<string, any>): boolean {
    try {
      const actualValue = this.getNestedValue(context, condition.field);

      switch (condition.operator) {
        case 'eq':
          return this.equals(actualValue, condition.value);
        case 'neq':
          return !this.equals(actualValue, condition.value);
        case 'gt':
          return this.greaterThan(actualValue, condition.value);
        case 'lt':
          return this.lessThan(actualValue, condition.value);
        case 'gte':
          return this.greaterThanOrEqual(actualValue, condition.value);
        case 'lte':
          return this.lessThanOrEqual(actualValue, condition.value);
        case 'contains':
          return this.contains(actualValue, condition.value);
        case 'not_contains':
          return !this.contains(actualValue, condition.value);
        case 'matches':
          return this.matches(actualValue, condition.value);
        case 'not_matches':
          return !this.matches(actualValue, condition.value);
        case 'in':
          return this.inArray(actualValue, condition.value);
        case 'not_in':
          return !this.inArray(actualValue, condition.value);
        case 'exists':
          return this.exists(actualValue);
        case 'not_exists':
          return !this.exists(actualValue);
        case 'empty':
          return this.isEmpty(actualValue);
        case 'not_empty':
          return !this.isEmpty(actualValue);
        case 'starts_with':
          return this.startsWith(actualValue, condition.value);
        case 'ends_with':
          return this.endsWith(actualValue, condition.value);
        case 'length_eq':
          return this.lengthEquals(actualValue, condition.value);
        case 'length_gt':
          return this.lengthGreaterThan(actualValue, condition.value);
        case 'length_lt':
          return this.lengthLessThan(actualValue, condition.value);
        case 'between':
          return this.between(actualValue, condition.value);
        case 'before':
          return this.before(actualValue, condition.value);
        case 'after':
          return this.after(actualValue, condition.value);
        default:
          console.warn(`Unknown operator: ${condition.operator}`);
          return false;
      }
    } catch (error) {
      console.error(`Error evaluating condition ${condition.field} ${condition.operator}:`, error);
      return false;
    }
  }

  /**
   * Evaluates conditions with OR logic (at least one condition must be true)
   */
  evaluateConditionsOr(conditions: WorkflowCondition[], context: Record<string, any>): boolean {
    if (!conditions || conditions.length === 0) {
      return true;
    }

    return conditions.some(condition => this.evaluateSingleCondition(condition, context));
  }

  /**
   * Gets a nested value from an object using dot notation
   * Supports: field.subfield.array[0].property
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;

    const keys = path.split('.');
    let current = obj;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];

      // Handle array indexing: array[0]
      const arrayMatch = key.match(/^(.+)\[(\d+)\]$/);
      if (arrayMatch) {
        const arrayKey = arrayMatch[1];
        const index = parseInt(arrayMatch[2], 10);

        current = current?.[arrayKey];
        if (Array.isArray(current) && index >= 0 && index < current.length) {
          current = current[index];
        } else {
          return undefined;
        }
      } else {
        current = current?.[key];
      }

      if (current === undefined) {
        return undefined;
      }
    }

    return current;
  }

  // Condition evaluation methods
  private equals(actual: any, expected: any): boolean {
    // Handle type coercion for common cases
    if (typeof actual === 'number' && typeof expected === 'string') {
      return actual === parseFloat(expected);
    }
    if (typeof actual === 'string' && typeof expected === 'number') {
      return parseFloat(actual) === expected;
    }
    return actual === expected;
  }

  private greaterThan(actual: any, expected: any): boolean {
    const numActual = Number(actual);
    const numExpected = Number(expected);
    return !isNaN(numActual) && !isNaN(numExpected) && numActual > numExpected;
  }

  private lessThan(actual: any, expected: any): boolean {
    const numActual = Number(actual);
    const numExpected = Number(expected);
    return !isNaN(numActual) && !isNaN(numExpected) && numActual < numExpected;
  }

  private greaterThanOrEqual(actual: any, expected: any): boolean {
    return this.equals(actual, expected) || this.greaterThan(actual, expected);
  }

  private lessThanOrEqual(actual: any, expected: any): boolean {
    return this.equals(actual, expected) || this.lessThan(actual, expected);
  }

  private contains(value: any, searchValue: any): boolean {
    if (typeof value === 'string' && typeof searchValue === 'string') {
      return value.toLowerCase().includes(searchValue.toLowerCase());
    }
    if (Array.isArray(value)) {
      return value.some(item => this.contains(item, searchValue));
    }
    return false;
  }

  private matches(value: any, pattern: any): boolean {
    if (typeof value !== 'string' || typeof pattern !== 'string') {
      return false;
    }
    try {
      return new RegExp(pattern, 'i').test(value);
    } catch (error) {
      console.warn(`Invalid regex pattern: ${pattern}`);
      return false;
    }
  }

  private inArray(value: any, array: any): boolean {
    if (!Array.isArray(array)) {
      return false;
    }
    return array.some(item => this.equals(value, item));
  }

  private exists(value: any): boolean {
    return value !== undefined && value !== null;
  }

  private isEmpty(value: any): boolean {
    if (value === undefined || value === null) return true;
    if (typeof value === 'string') return value.trim().length === 0;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'object') return Object.keys(value).length === 0;
    return false;
  }

  private startsWith(value: any, prefix: any): boolean {
    if (typeof value !== 'string' || typeof prefix !== 'string') {
      return false;
    }
    return value.toLowerCase().startsWith(prefix.toLowerCase());
  }

  private endsWith(value: any, suffix: any): boolean {
    if (typeof value !== 'string' || typeof suffix !== 'string') {
      return false;
    }
    return value.toLowerCase().endsWith(suffix.toLowerCase());
  }

  private lengthEquals(value: any, expectedLength: any): boolean {
    const length = this.getLength(value);
    const expected = Number(expectedLength);
    return length !== null && length === expected;
  }

  private lengthGreaterThan(value: any, minLength: any): boolean {
    const length = this.getLength(value);
    const min = Number(minLength);
    return length !== null && length > min;
  }

  private lengthLessThan(value: any, maxLength: any): boolean {
    const length = this.getLength(value);
    const max = Number(maxLength);
    return length !== null && length < max;
  }

  private getLength(value: any): number | null {
    if (typeof value === 'string') return value.length;
    if (Array.isArray(value)) return value.length;
    if (typeof value === 'object' && value !== null) return Object.keys(value).length;
    return null;
  }

  private between(value: any, range: any): boolean {
    // Expected format: [min, max] or "min,max"
    let min: number, max: number;

    if (Array.isArray(range) && range.length === 2) {
      min = Number(range[0]);
      max = Number(range[1]);
    } else if (typeof range === 'string') {
      const parts = range.split(',');
      if (parts.length === 2) {
        min = Number(parts[0].trim());
        max = Number(parts[1].trim());
      } else {
        return false;
      }
    } else {
      return false;
    }

    const numValue = Number(value);
    return !isNaN(numValue) && numValue >= min && numValue <= max;
  }

  private before(value: any, reference: any): boolean {
    const dateValue = this.parseDate(value);
    const referenceDate = this.parseDate(reference);
    return dateValue !== null && referenceDate !== null && dateValue < referenceDate;
  }

  private after(value: any, reference: any): boolean {
    const dateValue = this.parseDate(value);
    const referenceDate = this.parseDate(reference);
    return dateValue !== null && referenceDate !== null && dateValue > referenceDate;
  }

  private parseDate(value: any): Date | null {
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      return isNaN(date.getTime()) ? null : date;
    }
    return null;
  }

  /**
   * Validates condition syntax and provides helpful error messages
   */
  validateCondition(condition: WorkflowCondition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!condition.field || typeof condition.field !== 'string') {
      errors.push('Field must be a non-empty string');
    }

    const validOperators = [
      'eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'contains', 'not_contains',
      'matches', 'not_matches', 'in', 'not_in', 'exists', 'not_exists',
      'empty', 'not_empty', 'starts_with', 'ends_with', 'length_eq',
      'length_gt', 'length_lt', 'between', 'before', 'after'
    ];

    if (!condition.operator || !validOperators.includes(condition.operator)) {
      errors.push(`Operator must be one of: ${validOperators.join(', ')}`);
    }

    // Add operator-specific validation
    if (['matches', 'not_matches'].includes(condition.operator)) {
      if (typeof condition.value !== 'string') {
        errors.push(`${condition.operator} requires a string pattern`);
      } else {
        try {
          new RegExp(condition.value);
        } catch (error) {
          errors.push(`Invalid regex pattern: ${condition.value}`);
        }
      }
    }

    if (['in', 'not_in'].includes(condition.operator)) {
      if (!Array.isArray(condition.value)) {
        errors.push(`${condition.operator} requires an array value`);
      }
    }

    if (condition.operator === 'between') {
      if (!Array.isArray(condition.value) || condition.value.length !== 2) {
        errors.push('between requires a [min, max] array');
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Converts natural language conditions to structured conditions
   * Example: "priority is critical" -> { field: "priority", operator: "eq", value: "critical" }
   */
  parseNaturalLanguage(conditionText: string): WorkflowCondition | null {
    // Simple natural language parsing - can be extended with NLP libraries
    const patterns = [
      { regex: /(\w+)\s+is\s+(.+)/i, operator: 'eq' },
      { regex: /(\w+)\s+equals?\s+(.+)/i, operator: 'eq' },
      { regex: /(\w+)\s+is\s+not\s+(.+)/i, operator: 'neq' },
      { regex: /(\w+)\s+contains?\s+(.+)/i, operator: 'contains' },
      { regex: /(\w+)\s+greater\s+than\s+(.+)/i, operator: 'gt' },
      { regex: /(\w+)\s+less\s+than\s+(.+)/i, operator: 'lt' },
      { regex: /(\w+)\s+exists/i, operator: 'exists' },
      { regex: /(\w+)\s+is\s+empty/i, operator: 'empty' }
    ];

    for (const pattern of patterns) {
      const match = conditionText.match(pattern.regex);
      if (match) {
        const [, field, value] = match;
        return {
          field: field.trim(),
          operator: pattern.operator as any,
          value: this.parseValue(value.trim())
        };
      }
    }

    return null;
  }

  private parseValue(value: string): any {
    // Try to parse as number
    const numValue = Number(value);
    if (!isNaN(numValue)) return numValue;

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true;
    if (value.toLowerCase() === 'false') return false;

    // Return as string
    return value;
  }
}
