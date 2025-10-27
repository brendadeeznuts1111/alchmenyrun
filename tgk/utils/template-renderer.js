/**
 * Template Renderer - Jinja2-style template rendering for tgk
 * Uses Nunjucks for JavaScript template rendering
 */

const nunjucks = require('nunjucks');
const path = require('path');

class TemplateRenderer {
  constructor() {
    // Configure Nunjucks environment
    this.env = nunjucks.configure([
      path.join(__dirname, '../templates'),
      path.join(__dirname, '../templates/telegram-card')
    ], {
      autoescape: false,
      trimBlocks: true,
      lstripBlocks: true
    });
    
    // Add custom filters
    this.addCustomFilters();
  }
  
  addCustomFilters() {
    // Date formatting filter
    this.env.addFilter('date_format', function(dateStr, format = '%Y-%m-%d') {
      if (!dateStr) return '';
      
      try {
        const date = new Date(dateStr);
        return date.toISOString().split('T')[0]; // Simple YYYY-MM-DD format
      } catch (error) {
        return dateStr;
      }
    });
    
    // Truncate filter
    this.env.addFilter('truncate', function(str, length = 200) {
      if (!str) return '';
      if (str.length <= length) return str;
      return str.substring(0, length - 3) + '...';
    });
    
    // Upper case filter
    this.env.addFilter('upper', function(str) {
      return str ? str.toUpperCase() : '';
    });
  }
  
  async renderTemplate(templateName, variables) {
    try {
      return this.env.render(templateName, variables);
    } catch (error) {
      throw new Error(`Template rendering failed: ${error.message}`);
    }
  }
}

// Singleton instance
const renderer = new TemplateRenderer();

/**
 * Render a template with the given variables
 * @param {string} templateName - Name of the template file
 * @param {object} variables - Variables to pass to the template
 * @returns {Promise<string>} Rendered template content
 */
async function renderTemplate(templateName, variables) {
  return await renderer.renderTemplate(templateName, variables);
}

module.exports = { TemplateRenderer, renderTemplate };
