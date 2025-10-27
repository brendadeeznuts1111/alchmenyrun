export class JinjaEngine {
  private templates: Map<string, string> = new Map();
  private filters: Map<string, Function> = new Map();

  constructor() {
    this.registerDefaultFilters();
  }

  private registerDefaultFilters(): void {
    this.filters.set('upper', (str: string) => str.toUpperCase());
    this.filters.set('lower', (str: string) => str.toLowerCase());
    this.filters.set('capitalize', (str: string) =>
      str.charAt(0).toUpperCase() + str.slice(1));
    this.filters.set('format_date', (date: Date, format: string = 'YYYY-MM-DD') => {
      return this.formatDate(date, format);
    });
    this.filters.set('emoji_status', (status: string) => {
      switch (status) {
        case 'approved': return '✅';
        case 'rejected': return '❌';
        case 'pending': return '⏳';
        case 'in_progress': return '🔄';
        default: return '⚪';
      }
    });
    this.filters.set('priority_emoji', (priority: string) => {
      switch (priority) {
        case 'critical': return '🔴';
        case 'high': return '🟠';
        case 'medium': return '🟡';
        case 'low': return '🟢';
        default: return '⚪';
      }
    });
  }

  registerTemplate(name: string, template: string): void {
    this.templates.set(name, template);
  }

  registerFilter(name: string, filterFn: Function): void {
    this.filters.set(name, filterFn);
  }

  render(templateName: string, context: Record<string, any>): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return this.compile(template, context);
  }

  private compile(template: string, context: Record<string, any>): string {
    // Simple Jinja-like template compilation
    return template.replace(/\{\{([^}]+)\}\}/g, (match, expression) => {
      return this.evaluateExpression(expression.trim(), context);
    }).replace(/\{%\s*if\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endif\s*%\}/g,
      (match, condition, content) => {
        return this.evaluateCondition(condition, content, context);
    }).replace(/\{%\s*for\s+(\w+)\s+in\s+([^%]+)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
      (match, itemVar, arrayExpr, content) => {
        return this.evaluateLoop(itemVar, arrayExpr, content, context);
    });
  }

  private evaluateExpression(expression: string, context: Record<string, any>): string {
    // Handle filters: {{ variable|filter }}
    const parts = expression.split('|').map(part => part.trim());
    let value = this.getContextValue(parts[0], context);

    // Apply filters
    for (let i = 1; i < parts.length; i++) {
      const filterPart = parts[i];
      const filterMatch = filterPart.match(/^(\w+)(?:\(([^)]*)\))?$/);
      if (filterMatch) {
        const filterName = filterMatch[1];
        const filterArgs = filterMatch[2] ? filterMatch[2].split(',').map(arg =>
          this.parseValue(arg.trim())
        ) : [];

        const filterFn = this.filters.get(filterName);
        if (filterFn) {
          value = filterFn(value, ...filterArgs);
        }
      }
    }

    return value != null ? String(value) : '';
  }

  private evaluateCondition(condition: string, content: string, context: Record<string, any>): string {
    const [left, operator, right] = this.parseCondition(condition);
    const leftValue = this.getContextValue(left, context);
    const rightValue = this.parseValue(right);

    let result = false;
    switch (operator) {
      case '==': result = leftValue == rightValue; break;
      case '!=': result = leftValue != rightValue; break;
      case '>': result = leftValue > rightValue; break;
      case '<': result = leftValue < rightValue; break;
      case '>=': result = leftValue >= rightValue; break;
      case '<=': result = leftValue <= rightValue; break;
      case 'in': result = Array.isArray(rightValue) ? rightValue.includes(leftValue) : false; break;
      case 'not in': result = Array.isArray(rightValue) ? !rightValue.includes(leftValue) : false; break;
      default: result = Boolean(leftValue);
    }

    return result ? content : '';
  }

  private evaluateLoop(itemVar: string, arrayExpr: string, content: string, context: Record<string, any>): string {
    const array = this.getContextValue(arrayExpr, context);
    if (!Array.isArray(array)) return '';

    return array.map(item => {
      const loopContext = { ...context, [itemVar]: item };
      return this.compile(content, loopContext);
    }).join('');
  }

  private getContextValue(path: string, context: Record<string, any>): any {
    return path.split('.').reduce((obj, key) => obj?.[key], context);
  }

  private parseCondition(condition: string): [string, string, string] {
    const operators = ['==', '!=', '>=', '<=', '>', '<', 'in', 'not in'];
    for (const op of operators) {
      const parts = condition.split(op).map(part => part.trim());
      if (parts.length === 2) {
        return [parts[0], op, parts[1]];
      }
    }
    return [condition, '==', 'true']; // Default to truthy check
  }

  private parseValue(value: string): any {
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value === 'null') return null;
    if (!isNaN(Number(value))) return Number(value);
    if (value.startsWith('"') && value.endsWith('"')) return value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) return value.slice(1, -1);
    return value;
  }

  private formatDate(date: Date, format: string): string {
    const d = new Date(date);
    const replacements: Record<string, string> = {
      'YYYY': d.getFullYear().toString(),
      'MM': (d.getMonth() + 1).toString().padStart(2, '0'),
      'DD': d.getDate().toString().padStart(2, '0'),
      'HH': d.getHours().toString().padStart(2, '0'),
      'mm': d.getMinutes().toString().padStart(2, '0'),
      'ss': d.getSeconds().toString().padStart(2, '0')
    };

    return format.replace(/YYYY|MM|DD|HH|mm|ss/g, match => replacements[match]);
  }
}
