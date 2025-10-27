/**
 * UI Utilities for tgk CLI
 * Provides consistent formatting, colors, and user experience enhancements
 */

class UI {
  constructor() {
    this.colors = {
      reset: '\x1b[0m',
      bright: '\x1b[1m',
      dim: '\x1b[2m',

      // Foreground colors
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      magenta: '\x1b[35m',
      cyan: '\x1b[36m',
      white: '\x1b[37m',
      gray: '\x1b[90m',

      // Background colors
      bgRed: '\x1b[41m',
      bgGreen: '\x1b[42m',
      bgYellow: '\x1b[43m',
      bgBlue: '\x1b[44m',
      bgMagenta: '\x1b[45m',
      bgCyan: '\x1b[46m'
    };

    this.symbols = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      loading: '⏳',
      rocket: '🚀',
      gear: '⚙️',
      brain: '🤖',
      target: '🎯',
      check: '✓',
      cross: '✗',
      arrow: '→',
      bullet: '•',
      star: '⭐',
      fire: '🔥',
      lock: '🔒',
      unlock: '🔓',
      key: '🔑',
      bug: '🐛',
      feature: '✨',
      docs: '📚',
      test: '🧪',
      deploy: '🚀',
      monitor: '📊',
      alert: '🚨',
      chart: '📈',
      calendar: '📅',
      clock: '🕐',
      mail: '📧',
      phone: '📱',
      computer: '💻',
      cloud: '☁️',
      database: '🗄️',
      shield: '🛡️',
      wrench: '🔧'
    };
  }

  // Color methods
  color(text, color) {
    return `${this.colors[color]}${text}${this.colors.reset}`;
  }

  // Text styling
  bold(text) {
    return this.color(text, 'bright');
  }

  dim(text) {
    return this.color(text, 'dim');
  }

  // Status messages
  success(message) {
    console.log(`${this.symbols.success} ${this.color(message, 'green')}`);
  }

  error(message) {
    console.log(`${this.symbols.error} ${this.color(message, 'red')}`);
  }

  warning(message) {
    console.log(`${this.symbols.warning} ${this.color(message, 'yellow')}`);
  }

  info(message) {
    console.log(`${this.symbols.info} ${this.color(message, 'blue')}`);
  }

  loading(message) {
    console.log(`${this.symbols.loading} ${this.color(message, 'cyan')}`);
  }

  // Progress indicators
  progress(current, total, message = '') {
    const percentage = Math.round((current / total) * 100);
    const progressBar = this.createProgressBar(current, total);
    const status = `${current}/${total} (${percentage}%)`;
    console.log(`${this.symbols.chart} ${message} ${this.color(status, 'cyan')} ${progressBar}`);
  }

  createProgressBar(current, total, width = 20) {
    const filled = Math.round((current / total) * width);
    const empty = width - filled;
    const filledBar = '█'.repeat(filled);
    const emptyBar = '░'.repeat(empty);
    return `[${this.color(filledBar, 'green')}${emptyBar}]`;
  }

  // Headers and sections
  header(title, icon = '') {
    const separator = '='.repeat(50);
    console.log(`\n${this.color(separator, 'blue')}`);
    console.log(`${icon} ${this.bold(this.color(title, 'cyan'))}`);
    console.log(`${this.color(separator, 'blue')}\n`);
  }

  section(title, icon = '') {
    console.log(`\n${icon} ${this.bold(title)}`);
    console.log(`${this.color('─'.repeat(title.length + (icon ? 2 : 0)), 'gray')}`);
  }

  // Tables
  table(headers, rows) {
    const colWidths = headers.map((header, i) =>
      Math.max(header.length, ...rows.map(row => String(row[i] || '').length))
    );

    // Header row
    const headerRow = headers.map((header, i) =>
      this.bold(header.padEnd(colWidths[i]))
    ).join(' │ ');
    console.log(headerRow);

    // Separator
    const separator = colWidths.map(width => '─'.repeat(width)).join('─┼─');
    console.log(this.color(separator, 'gray'));

    // Data rows
    rows.forEach(row => {
      const dataRow = row.map((cell, i) =>
        String(cell || '').padEnd(colWidths[i])
      ).join(' │ ');
      console.log(dataRow);
    });
  }

  // Key-value pairs
  keyValue(key, value, keyColor = 'cyan', valueColor = 'white') {
    const formattedKey = `${key}:`.padEnd(20);
    console.log(`${this.color(formattedKey, keyColor)} ${this.color(value, valueColor)}`);
  }

  // Status badges
  badge(text, type = 'default') {
    const colors = {
      success: 'green',
      error: 'red',
      warning: 'yellow',
      info: 'blue',
      default: 'gray'
    };
    return this.color(` ${text} `, colors[type]);
  }

  // Priority indicators
  priority(level) {
    const priorities = {
      critical: { symbol: '🔴', color: 'red', text: 'CRITICAL' },
      high: { symbol: '🟠', color: 'yellow', text: 'HIGH' },
      medium: { symbol: '🟡', color: 'yellow', text: 'MEDIUM' },
      low: { symbol: '🟢', color: 'green', text: 'LOW' }
    };

    const p = priorities[level] || priorities.medium;
    return `${p.symbol} ${this.color(p.text, p.color)}`;
  }

  // Confidence indicators
  confidence(score) {
    const percentage = Math.round(score * 100);
    let color = 'red';
    if (percentage >= 80) color = 'green';
    else if (percentage >= 60) color = 'yellow';

    return `${this.symbols.chart} ${this.color(`${percentage}%`, color)}`;
  }

  // Time formatting
  timeAgo(date) {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  // Summary boxes
  summaryBox(title, items, icon = '') {
    const width = 50;
    const topBorder = '┌' + '─'.repeat(width - 2) + '┐';
    const bottomBorder = '└' + '─'.repeat(width - 2) + '┘';

    console.log(`\n${this.color(topBorder, 'blue')}`);
    console.log(`${this.color('│', 'blue')} ${icon} ${this.bold(title.padEnd(width - 5))} ${this.color('│', 'blue')}`);
    console.log(`${this.color('├' + '─'.repeat(width - 2) + '┤', 'blue')}`);

    items.forEach(item => {
      const line = ` ${item}`.padEnd(width - 3);
      console.log(`${this.color('│', 'blue')} ${line} ${this.color('│', 'blue')}`);
    });

    console.log(`${this.color(bottomBorder, 'blue')}`);
  }

  // Command help
  commandHelp(command, description, examples = []) {
    console.log(`\n${this.bold(this.color(command, 'cyan'))}`);
    console.log(`${description}\n`);

    if (examples.length > 0) {
      console.log(`${this.bold('Examples:')}`);
      examples.forEach(example => {
        console.log(`  ${this.color('$', 'gray')} ${this.color(example, 'white')}`);
      });
      console.log('');
    }
  }

  // Interactive prompts (simple version)
  async confirm(message) {
    const readline = (await import('readline')).default;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise(resolve => {
      rl.question(`${this.symbols.arrow} ${message} (y/N): `, (answer) => {
        rl.close();
        resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
      });
    });
  }

  // Spinners for long operations
  async withSpinner(message, operation) {
    const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let frameIndex = 0;

    const spinner = setInterval(() => {
      process.stdout.write(`\r${frames[frameIndex]} ${message}`);
      frameIndex = (frameIndex + 1) % frames.length;
    }, 100);

    try {
      const result = await operation();
      clearInterval(spinner);
      process.stdout.write(`\r${this.symbols.success} ${message}\n`);
      return result;
    } catch (error) {
      clearInterval(spinner);
      process.stdout.write(`\r${this.symbols.error} ${message}\n`);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = { UI, ui: new UI() };
