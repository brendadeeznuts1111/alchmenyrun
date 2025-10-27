// src/utils/ansi-colors.ts - ANSI Color utility functions for the integrated system
export const ANSIColors = {
  // Basic colors
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  // Bright colors
  brightRed: '\x1b[91m',
  brightGreen: '\x1b[92m',
  brightYellow: '\x1b[93m',
  brightBlue: '\x1b[94m',
  brightMagenta: '\x1b[95m',
  brightCyan: '\x1b[96m',
  brightWhite: '\x1b[97m',
  
  // Reset
  reset: '\x1b[0m'
} as const;

export type ColorType = keyof typeof ANSIColors;

export class ColorFormatter {
  static colorize(text: string, color: ColorType): string {
    return `${ANSIColors[color]}${text}${ANSIColors.reset}`;
  }

  static createBanner(title: string, subtitle: string, color: ColorType = 'cyan'): string {
    const border = '='.repeat(60);
    const coloredTitle = this.colorize(title, color);
    const coloredSubtitle = this.colorize(subtitle, 'brightWhite');
    
    return [
      border,
      coloredTitle,
      coloredSubtitle,
      border
    ].join('\n');
  }

  static createRainbowBanner(title: string, subtitle: string): string {
    const colors: ColorType[] = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];
    const border = '='.repeat(60);
    
    const rainbowTitle = title.split('').map((char, i) => 
      this.colorize(char, colors[i % colors.length])
    ).join('');
    
    return [
      border,
      rainbowTitle,
      this.colorize(subtitle, 'brightWhite'),
      border
    ].join('\n');
  }

  static formatStatus(status: 'operational' | 'degraded' | 'outage' | 'maintenance', text: string): string {
    const colorMap = {
      operational: 'green',
      degraded: 'yellow', 
      outage: 'brightRed',
      maintenance: 'blue'
    };
    
    const emojiMap = {
      operational: '🟢',
      degraded: '🟡',
      outage: '🔴',
      maintenance: '🔵'
    };
    
    return `${emojiMap[status]} ${this.colorize(text, colorMap[status])}`;
  }

  static formatPriority(priority: 'low' | 'medium' | 'high' | 'critical' | 'vip', text: string): string {
    const colorMap = {
      low: 'green',
      medium: 'yellow',
      high: 'red',
      critical: 'brightRed',
      vip: 'brightMagenta'
    };
    
    const emojiMap = {
      low: '🟢',
      medium: '🟡',
      high: '🔴',
      critical: '🚨',
      vip: '👑'
    };
    
    return `${emojiMap[priority]} ${this.colorize(text, colorMap[priority])}`;
  }

  static stripAnsi(text: string): string {
    return text.replace(/\x1B\[[0-9;]*m/g, '');
  }
}

// Export for backward compatibility
export const createBanner = ColorFormatter.createBanner.bind(ColorFormatter);
export const createRainbowBanner = ColorFormatter.createRainbowBanner.bind(ColorFormatter);
