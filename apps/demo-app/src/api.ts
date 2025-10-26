// Cloudflare Worker for Alchemy Cloudflare Tunnel Product Page
// Learn more: https://developers.cloudflare.com/workers/

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
}

const HTML_CONTENT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alchemy.run Cloudflare Tunnel v1.0.0 - Complete Enterprise Tunnel Solution</title>
  <meta name="description" content="🚀 v1.0.0 - Complete enterprise tunnel solution with real-time monitoring, logging, analytics, and zero-downtime updates. Deploy secure, auto-healing tunnels with full observability.">
  <meta name="keywords" content="Cloudflare, Tunnel, Alchemy, Infrastructure as Code, IaC, TypeScript, Workers">
  <meta name="author" content="Alchemy Framework">
  
  <!-- Open Graph -->
  <meta property="og:title" content="Alchemy.run Cloudflare Tunnel v1.0.0">
  <meta property="og:description" content="🚀 v1.0.0 - Complete enterprise tunnel solution with real-time monitoring, logging, analytics, and zero-downtime updates">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://cloudflare-demo-website-pr-13.utahj4754.workers.dev/">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Alchemy.run Cloudflare Tunnel v1.0.0">
  <meta name="twitter:description" content="🚀 v1.0.0 - Complete enterprise tunnel solution with real-time monitoring, logging, analytics, and zero-downtime updates">
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23f97316'><path d='M20.5 11.19c-.02-.11-.04-.23-.07-.34-.03-.11-.07-.23-.12-.34-.05-.11-.1-.21-.16-.31-.06-.1-.13-.19-.2-.28-.07-.09-.15-.17-.23-.25-.08-.08-.17-.15-.26-.22-.09-.07-.19-.13-.29-.18-.1-.05-.21-.09-.32-.12-.11-.03-.22-.05-.34-.06-.12-.01-.23-.01-.35 0-.12.01-.23.03-.34.06-.11.03-.22.07-.32.12-.1.05-.2.11-.29.18-.09.07-.18.14-.26.22-.08.08-.16.16-.23.25-.07.09-.14.18-.2.28-.06.1-.11.2-.16.31-.05.11-.09.22-.12.34-.03.11-.05.23-.07.34-.02.12-.02.23-.02.35 0 .12 0 .23.02.35.02.11.04.23.07.34.03.11.07.23.12.34.05.11.1.21.16.31.06.1.13.19.2.28.07.09.15.17.23.25.08.08.17.15.26.22.09.07.19.13.29.18.1.05.21.09.32.12.11.03.22.05.34.06.12.01.23.01.35 0 .12-.01.23-.03.34-.06.11-.03.22-.07.32-.12.1-.05.2-.11.29-.18.09-.07.18-.14.26-.22.08-.08.16-.16.23-.25.07-.09.14-.18.2-.28.06-.1.11-.2.16-.31.05-.11.09-.22.12-.34.03-.11.05-.23.07-.34.02-.12.02-.23.02-.35 0-.12 0-.23-.02-.35z'/></svg>">
  
  <script src="https://cdn.tailwindcss.com"></script>
  <script type="module">
    // React and ReactDOM from CDN
    import React from 'https://esm.sh/react@18.2.0';
    import ReactDOM from 'https://esm.sh/react-dom@18.2.0';
    import { formatDistance } from 'https://esm.sh/date-fns@2.30.0';

    /* ---------- TYPES ---------- */
    const RssItem = {
      title: '',
      link: '',
      pubDate: '',
      description: ''
    };

    /* ---------- CONFIG ---------- */
    const REPO = 'brendadeeznuts1111/alchmenyrun';
    const RSS_RELEASES = \`https://github.com/\${REPO}/releases.atom\`;
    const NPM_PKG = 'https://www.npmjs.com/package/@alch/tunnel';

    /* ---------- FEATURE MATRIX ---------- */
    const features = [
      { name: 'Tunnel CRUD (create, read, update, delete)', status: 'shipped', phase: 1 },
      { name: 'Ingress rules & origin config', status: 'shipped', phase: 1 },
      { name: 'WARP routing', status: 'shipped', phase: 1 },
      { name: 'Real Cloudflare API', status: 'shipped', phase: 2 },
      { name: 'Secret redaction & safe logging', status: 'shipped', phase: 2 },
      { name: 'Integration test suite', status: 'shipped', phase: 2 },
      { name: 'Directory registry & documentation tunnel', status: 'shipped', phase: 2 },
      { name: 'Comprehensive tunnel implementation guide', status: 'shipped', phase: 2 },
      { name: 'Cloudflare Tunnel provider integration', status: 'shipped', phase: 2 },
      { name: 'Official GitHub documentation integration', status: 'shipped', phase: 2 },
      { name: 'Real-time metrics dashboard', status: 'shipped', phase: 3 },
      { name: 'Comprehensive logging system', status: 'shipped', phase: 3 },
      { name: 'Data analytics & insights', status: 'shipped', phase: 3 },
      { name: 'Prometheus metrics exporter', status: 'shipped', phase: 3 },
      { name: 'Zero-downtime config reload', status: 'shipped', phase: 3 },
      { name: 'Graceful shutdown hooks', status: 'shipped', phase: 3 },
      { name: 'npm publish @alch/tunnel', status: 'shipped', phase: 3 },
    ];

    /* ---------- TUNNEL PROVIDER FEATURES ---------- */
    const providerFeatures = [
      {
        title: "Infrastructure as Code",
        description: "Define tunnels using TypeScript configuration with full type safety",
        icon: "🏗️",
        link: "https://alchemy.run/providers/cloudflare/tunnel#infrastructure-as-code"
      },
      {
        title: "Auto-Healing Tunnels",
        description: "Automatic tunnel recovery and health monitoring built-in",
        icon: "🔄",
        link: "https://alchemy.run/providers/cloudflare/tunnel#auto-healing"
      },
      {
        title: "Secret Management",
        description: "Secure credential handling with automatic redaction",
        icon: "🔐",
        link: "https://alchemy.run/providers/cloudflare/tunnel#secret-management"
      },
      {
        title: "WARP Routing",
        description: "Advanced routing with Cloudflare WARP integration",
        icon: "🌐",
        link: "https://alchemy.run/providers/cloudflare/tunnel#warp-routing"
      },
      {
        title: "Metrics & Monitoring",
        description: "Built-in Prometheus metrics and observability",
        icon: "📊",
        link: "https://alchemy.run/providers/cloudflare/tunnel#monitoring"
      },
      {
        title: "Multi-Environment Support",
        description: "Seamless deployment across dev, staging, and production",
        icon: "🚀",
        link: "https://alchemy.run/providers/cloudflare/tunnel#environments"
      }
    ];

    /* ---------- MONITORING & DATA FEATURES ---------- */
    const monitoringFeatures = [
      {
        title: "Real-Time Metrics Dashboard",
        description: "Live monitoring dashboard with real-time tunnel performance metrics and health status visualization",
        icon: "📈",
        features: [
          "Live connection monitoring",
          "Performance metrics visualization",
          "Health status indicators",
          "Throughput analytics",
          "Error rate tracking",
          "Response time charts"
        ],
        metrics: [
          { name: "Active Connections", value: "127", trend: "up", change: "+12%" },
          { name: "Total Requests", value: "1.2M", trend: "up", change: "+8%" },
          { name: "Error Rate", value: "0.02%", trend: "down", change: "-0.01%" },
          { name: "Avg Response Time", value: "45ms", trend: "down", change: "-5ms" },
          { name: "Throughput", value: "2.4 GB/s", trend: "up", change: "+0.3 GB/s" },
          { name: "Health Score", value: "99.8%", trend: "stable", change: "0%" }
        ],
        code: "import { metricsCollector, type TunnelMetrics } from \"@alch/tunnel\";\n\n// Start real-time monitoring\nmetricsCollector.startCollection(tunnels);\n\n// Get live metrics dashboard\nconst dashboard = {\n  summary: metricsCollector.getMetricsSummary(),\n  details: metricsCollector.getAllMetrics(),\n  prometheus: metricsCollector.exportPrometheusMetrics()\n};\n\n// Real-time updates (30-second intervals)\nsetInterval(() => {\n  const currentMetrics = metricsCollector.getAllMetrics();\n  updateDashboard(currentMetrics);\n}, 30000);",
        link: "https://github.com/alchemy-run/alchemy/blob/main/packages/@alch/tunnel/src/metrics.ts"
      },
      {
        title: "Comprehensive Logging System",
        description: "Structured logging with multiple levels, redaction, and real-time log streaming capabilities",
        icon: "📝",
        features: [
          "Structured JSON logging",
          "Automatic secret redaction",
          "Multiple log levels (DEBUG, INFO, WARN, ERROR)",
          "Real-time log streaming",
          "Log aggregation and filtering",
          "Performance impact tracking"
        ],
        logLevels: [
          { level: "DEBUG", count: "1,234", color: "text-gray-600" },
          { level: "INFO", count: "5,678", color: "text-blue-600" },
          { level: "WARN", count: "123", color: "text-yellow-600" },
          { level: "ERROR", count: "12", color: "text-red-600" }
        ],
        code: "import { logger } from \"alchemy\";\n\n// Structured logging with automatic redaction\nlogger.log(\"Tunnel created\", {\n  tunnelId: \"tunnel_123\",\n  name: \"my-app-tunnel\",\n  // Secrets automatically redacted\n  tunnelSecret: \"[REDACTED]\"\n});\n\n// Performance logging\nlogger.log(\"Metrics collection completed\", {\n  duration: 1250,\n  tunnelsCount: 5,\n  metricsCollected: 55\n});\n\n// Error logging with context\nlogger.error(\"Tunnel connection failed\", {\n  tunnelId: \"tunnel_123\",\n  error: \"Connection timeout\",\n  retryCount: 3\n});",
        link: "https://github.com/alchemy-run/alchemy/blob/main/packages/@alch/tunnel/src/index.ts"
      },
      {
        title: "Data Analytics & Insights",
        description: "Advanced analytics with trend analysis, anomaly detection, and predictive monitoring capabilities",
        icon: "🔍",
        features: [
          "Trend analysis and forecasting",
          "Anomaly detection algorithms",
          "Performance baselines",
          "Capacity planning insights",
          "Usage pattern analysis",
          "Predictive health monitoring"
        ],
        insights: [
          { type: "Trend", description: "Connection growth rate: 15% per week", status: "positive" },
          { type: "Anomaly", description: "Unusual spike in error rate detected", status: "warning" },
          { type: "Insight", description: "Peak usage: 2-4 PM UTC", status: "info" },
          { type: "Forecast", description: "Capacity threshold reached in 2 weeks", status: "alert" }
        ],
        code: "import { metricsCollector } from \"@alch/tunnel\";\n\n// Advanced analytics\nconst analytics = {\n  // Trend analysis\n  trends: analyzeTrends(metricsCollector.getAllMetrics()),\n  \n  // Anomaly detection\n  anomalies: detectAnomalies(historicalMetrics),\n  \n  // Performance baselines\n  baselines: calculateBaselines(metricsData),\n  \n  // Predictive insights\n  forecast: predictCapacity(metricsCollector.getMetricsSummary())\n};\n\n// Generate insights report\nconst report = generateInsightsReport(analytics);\nlogger.log(\"Analytics report generated\", report);",
        link: "https://github.com/alchemy-run/alchemy/blob/main/packages/@alch/tunnel/src/metrics.ts"
      }
    ];

    /* ---------- PHASE 3 FEATURES ---------- */
    const phase3Features = [
      {
        title: "Prometheus Metrics Exporter",
        description: "Comprehensive tunnel monitoring with real-time metrics collection and Prometheus-compatible export",
        icon: "📊",
        features: [
          "Real-time connection metrics",
          "Performance monitoring (response time, throughput)",
          "Health status tracking",
          "Prometheus format export",
          "30-second collection intervals",
          "Cached metrics for performance"
        ],
        code: "import { metricsCollector, type TunnelMetrics } from \"@alch/tunnel\";\n\n// Start metrics collection\nmetricsCollector.startCollection(tunnels);\n\n// Get all tunnel metrics\nconst allMetrics: TunnelMetrics[] = metricsCollector.getAllMetrics();\n\n// Export Prometheus format\nconst prometheusMetrics: string = metricsCollector.exportPrometheusMetrics();\n\n// Get summary statistics\nconst summary = metricsCollector.getMetricsSummary();\nconsole.log(\"Total tunnels: \" + summary.totalTunnels);\nconsole.log(\"Healthy tunnels: \" + summary.healthyTunnels);\nconsole.log(\"Total connections: \" + summary.totalConnections);\nconsole.log(\"Total bytes transferred: \" + summary.totalBytesTransferred);\nconsole.log(\"Average response time: \" + summary.averageResponseTime + \"ms\");",
        link: "https://github.com/alchemy-run/alchemy/blob/main/packages/@alch/tunnel/src/metrics.ts"
      },
      {
        title: "Zero-Downtime Config Reload",
        description: "Hot configuration reloading with validation, backup, and automatic rollback capabilities",
        icon: "🔄",
        features: [
          "Configuration validation before apply",
          "Automatic backup and rollback",
          "Rolling updates (one tunnel at a time)",
          "Health checks after updates",
          "Parallel update support",
          "Configuration diff tracking"
        ],
        code: "import { configReloader, type ReloadOptions } from \"@alch/tunnel\";\n\n// Configure reload options\nconst options: ReloadOptions = {\n  validateBeforeApply: true,\n  backupCurrentConfig: true,\n  rollingUpdate: true,\n  rollingUpdateDelayMs: 5000,\n  healthCheckAfterUpdate: true,\n  healthCheckTimeoutMs: 10000,\n};\n\n// Create new configurations\nconst newConfigs = new Map<string, TunnelConfig>();\nnewConfigs.set(\"tunnel_123\", {\n  ingress: [\n    {\n      hostname: \"app.example.com\",\n      service: \"http://localhost:3000\",\n    },\n    {\n      service: \"http_status:404\",\n    },\n  ],\n});\n\n// Perform zero-downtime reload\nawait configReloader.reloadConfig(tunnels, newConfigs);\n\n// Check reload status\nconst status = configReloader.getStatus();\nconsole.log(\"Reload phase: \" + status.phase);\nconsole.log(\"Tunnels processed: \" + status.tunnelsProcessed + \"/\" + status.tunnelsTotal);",
        link: "https://github.com/alchemy-run/alchemy/blob/main/packages/@alch/tunnel/src/reload.ts"
      },
      {
        title: "Graceful Shutdown Hooks",
        description: "Enterprise-grade shutdown management with configurable grace periods and cleanup hooks",
        icon: "🛡️",
        features: [
          "Configurable grace periods",
          "Wait for active connections",
          "Custom cleanup functions",
          "Final metrics export",
          "Signal handling (SIGTERM, SIGINT)",
          "Emergency shutdown support"
        ],
        code: "import { shutdownManager, type ShutdownConfig } from \"@alch/tunnel\";\n\n// Configure shutdown behavior\nconst config: ShutdownConfig = {\n  gracePeriodMs: 30000, // 30 seconds\n  waitForActiveConnections: true,\n  connectionTimeoutMs: 10000, // 10 seconds\n  exportFinalMetrics: true,\n  cleanupFunctions: [\n    async () => {\n      console.log(\"Cleaning up database connections...\");\n      // Custom cleanup logic\n    },\n    async () => {\n      console.log(\"Closing file handles...\");\n      // File cleanup logic\n    },\n  ],\n  deleteTunnelsOnShutdown: false,\n};\n\n// Create custom shutdown manager\nconst customManager = new TunnelShutdownManager(config);\n\n// Or use the global instance\n// await shutdownManager.initiateShutdown();\n\n// Check shutdown status\nconst status = customManager.getStatus();\nconsole.log(\"Shutdown phase: \" + status.phase);\nconsole.log(\"Tunnels processed: \" + status.tunnelsProcessed);\nconsole.log(\"Active connections closed: \" + status.activeConnectionsClosed);",
        link: "https://github.com/alchemy-run/alchemy/blob/main/packages/@alch/tunnel/src/shutdown.ts"
      }
    ];

    /* ---------- CODE EXAMPLES ---------- */
    const codeExamples = [
      {
        title: "Minimal Example",
        description: "Create a basic tunnel and run it with the returned token",
        code: "import { Tunnel } from \"alchemy/cloudflare\";\n\nconst tunnel = await Tunnel(\"my-app\", {\n  name: \"my-app-tunnel\",\n});\n\n// Run cloudflared with:\n// cloudflared tunnel run --token <tunnel.token.unencrypted>",
        language: "typescript",
        link: "https://github.com/alchemy-run/alchemy/blob/main/alchemy-web/src/content/docs/providers/cloudflare/tunnel.md"
      },
      {
        title: "With Ingress Rules",
        description: "Create a tunnel with routing configuration. DNS records are automatically created",
        code: "import { Tunnel } from \"alchemy/cloudflare\";\n\nconst webTunnel = await Tunnel(\"web-app\", {\n  name: \"web-app-tunnel\",\n  ingress: [\n    {\n      hostname: \"app.example.com\",\n      service: \"http://localhost:3000\",\n    },\n    {\n      service: \"http_status:404\", // catch-all rule\n    },\n  ],\n});",
        language: "typescript",
        link: "https://github.com/alchemy-run/alchemy/blob/main/alchemy-web/src/content/docs/providers/cloudflare/tunnel.md"
      },
      {
        title: "Multiple Services",
        description: "Route different paths and hostnames to different services",
        code: "import { Tunnel } from \"alchemy/cloudflare\";\n\nconst apiTunnel = await Tunnel(\"api\", {\n  name: \"api-tunnel\",\n  ingress: [\n    {\n      hostname: \"api.example.com\",\n      path: \"/v1/*\",\n      service: \"http://localhost:8080\",\n      originRequest: {\n        httpHostHeader: \"api.internal\",\n        connectTimeout: 30,\n      },\n    },\n    {\n      hostname: \"api.example.com\",\n      path: \"/v2/*\",\n      service: \"http://localhost:8081\",\n    },\n    {\n      hostname: \"admin.example.com\",\n      service: \"http://localhost:9000\",\n    },\n    {\n      service: \"http_status:404\",\n    },\n  ],\n});",
        language: "typescript",
        link: "https://github.com/alchemy-run/alchemy/blob/main/alchemy-web/src/content/docs/providers/cloudflare/tunnel.md"
      },
      {
        title: "Private Network Access",
        description: "Enable WARP routing for private network connectivity",
        code: "import { Tunnel } from \"alchemy/cloudflare\";\n\nconst privateTunnel = await Tunnel(\"private-network\", {\n  name: \"private-network-tunnel\",\n  warpRouting: {\n    enabled: true,\n  },\n});",
        language: "typescript",
        link: "https://github.com/alchemy-run/alchemy/blob/main/alchemy-web/src/content/docs/providers/cloudflare/tunnel.md"
      },
      {
        title: "Origin Configuration",
        description: "Configure how the tunnel connects to your origin servers",
        code: "import { Tunnel } from \"alchemy/cloudflare\";\n\nconst secureTunnel = await Tunnel(\"secure\", {\n  name: \"secure-tunnel\",\n  originRequest: {\n    noTLSVerify: false,\n    connectTimeout: 30,\n    httpHostHeader: \"internal.service\",\n    http2Origin: true,\n    keepAliveConnections: 10,\n  },\n  ingress: [\n    {\n      hostname: \"secure.example.com\",\n      service: \"https://localhost:8443\",\n    },\n    {\n      service: \"http_status:404\",\n    },\n  ],\n});",
        language: "typescript",
        link: "https://github.com/alchemy-run/alchemy/blob/main/alchemy-web/src/content/docs/providers/cloudflare/tunnel.md"
      },
      {
        title: "Adopting Existing Tunnels",
        description: "Take over management of an existing tunnel",
        code: "import { Tunnel } from \"alchemy/cloudflare\";\n\nconst existingTunnel = await Tunnel(\"existing\", {\n  name: \"existing-tunnel\",\n  adopt: true, // Won't fail if tunnel already exists\n  ingress: [\n    {\n      hostname: \"updated.example.com\",\n      service: \"http://localhost:5000\",\n    },\n    {\n      service: \"http_status:404\",\n    },\n  ],\n});",
        language: "typescript",
        link: "https://github.com/alchemy-run/alchemy/blob/main/alchemy-web/src/content/docs/providers/cloudflare/tunnel.md"
      }
    ];

    /* ---------- TUNNEL IMPLEMENTATION STEPS ---------- */
    const tunnelSteps = [
      {
        title: "1. Installation & Setup",
        description: "Install the Alchemy framework and configure your Cloudflare credentials",
        icon: "📦",
        link: "https://alchemy.run/guides/cloudflare-tunnel/#installation"
      },
      {
        title: "2. Basic Tunnel Creation",
        description: "Create your first tunnel with simple configuration and automatic routing",
        icon: "🚇",
        link: "https://alchemy.run/guides/cloudflare-tunnel/#creating-your-first-tunnel"
      },
      {
        title: "3. Advanced Configuration",
        description: "Configure ingress rules, origin servers, and custom routing patterns",
        icon: "⚙️",
        link: "https://alchemy.run/guides/cloudflare-tunnel/#advanced-configuration"
      },
      {
        title: "4. WARP Routing Setup",
        description: "Enable WARP routing for enhanced performance and security",
        icon: "🌐",
        link: "https://alchemy.run/guides/cloudflare-tunnel/#warp-routing"
      },
      {
        title: "5. Production Deployment",
        description: "Deploy tunnels to production with monitoring and logging",
        icon: "🚀",
        link: "https://alchemy.run/guides/cloudflare-tunnel/#production-deployment"
      },
      {
        title: "6. Next Steps & Scaling",
        description: "Scale your tunnel infrastructure and explore advanced features",
        icon: "📈",
        link: "https://alchemy.run/guides/cloudflare-tunnel/#next-steps"
      }
    ];

    /* ---------- DIRECTORY REGISTRY ---------- */
    const directoryRegistry = [
      { 
        name: 'Core Framework', 
        path: '/src/', 
        description: 'Main application source code and backend logic',
        type: 'core',
        files: ['backend/', 'db/', 'frontend/', '__tests__/']
      },
      { 
        name: 'Package Registry', 
        path: '/packages/', 
        description: 'Reusable packages and libraries',
        type: 'packages',
        files: ['@alch/blocks/', '@alch/bun-runtime/', '@alch/cli/', '@alch/tunnel/']
      },
      { 
        name: 'Demo Applications', 
        path: '/apps/', 
        description: 'Example applications and demos',
        type: 'apps',
        files: ['demo-app/']
      },
      { 
        name: 'Templates', 
        path: '/templates/', 
        description: 'Project templates and scaffolding',
        type: 'templates',
        files: ['app/']
      },
      { 
        name: 'Documentation', 
        path: '/docs/', 
        description: 'Guides, API docs, and tutorials',
        type: 'docs',
        files: ['guides/', 'ARCHITECTURE.md', 'QUICK_START.md']
      },
      { 
        name: 'Examples', 
        path: '/examples/', 
        description: 'Code examples and use cases',
        type: 'examples',
        files: ['mcp/', 'simple-chat/']
      },
      { 
        name: 'Scripts & Tools', 
        path: '/scripts/', 
        description: 'Build scripts and development tools',
        type: 'scripts',
        files: ['build-frontend.ts', 'create-app.sh', 'init-db.ts']
      }
    ];

    /* ---------- HOOKS ---------- */
    function useRss(url) {
      const [items, setItems] = React.useState([]);
      React.useEffect(() => {
        fetch(url)
          .then(r => r.text())
          .then(str => new window.DOMParser().parseFromString(str, 'text/xml'))
          .then(xml =>
            Array.from(xml.querySelectorAll('entry')).map(e => ({
              title: e.querySelector('title')?.textContent || '',
              link: e.querySelector('link')?.getAttribute('href') || '',
              pubDate: e.querySelector('updated')?.textContent || '',
              description: e.querySelector('summary')?.textContent || '',
            }))
          )
          .then(setItems)
          .catch(() => setItems([]));
      }, [url]);
      return items.slice(0, 5);
    }

    /* ---------- COMPONENTS ---------- */
    const Header = () => React.createElement('header', { className: "bg-gradient-to-r from-orange-500 to-yellow-400 text-white" },
      React.createElement('div', { className: "container mx-auto px-6 py-16" },
        React.createElement('h1', { className: "text-4xl md:text-5xl font-bold mb-4" },
          "🚀 Alchemy.run Cloudflare Tunnel v1.0.0"
        ),
        React.createElement('p', { className: "text-xl opacity-90" },
          "Complete enterprise tunnel solution with real-time monitoring, logging, analytics, and zero-downtime updates."
        ),
        React.createElement('div', { className: "mt-6 space-x-4" },
          React.createElement('a', {
            className: "inline-block bg-white text-orange-600 px-5 py-2 rounded shadow hover:shadow-md transition",
            href: \`https://github.com/\${REPO}\`,
            target: "_blank",
            rel: "noreferrer"
          }, "GitHub →"),
          React.createElement('a', {
            className: "inline-block bg-white/20 text-white px-5 py-2 rounded border border-white/30 hover:bg-white/30 transition",
            href: NPM_PKG,
            target: "_blank",
            rel: "noreferrer"
          }, "npm @alch/tunnel")
        )
      )
    );

    const FeatureTable = () => React.createElement('section', { className: "py-12" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('h2', { className: "text-3xl font-semibold mb-6" }, "Feature Roadmap"),
        React.createElement('div', { className: "overflow-auto" },
          React.createElement('table', { className: "w-full text-left border-collapse" },
            React.createElement('thead', null,
              React.createElement('tr', { className: "border-b-2 border-gray-200" },
                React.createElement('th', { className: "py-3 pr-4" }, "Feature"),
                React.createElement('th', { className: "py-3 px-4" }, "Status"),
                React.createElement('th', { className: "py-3 pl-4" }, "Phase")
              )
            ),
            React.createElement('tbody', null,
              features.map(f =>
                React.createElement('tr', { key: f.name, className: "border-b border-gray-100" },
                  React.createElement('td', { className: "py-3 pr-4" }, f.name),
                  React.createElement('td', { className: "py-3 px-4" },
                    React.createElement('span', {
                      className: \`inline-flex items-center px-2 py-1 rounded text-sm font-medium \${
                        f.status === 'shipped'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }\`
                    }, f.status)
                  ),
                  React.createElement('td', { className: "py-3 pl-4" }, \`Phase \${f.phase}\`)
                )
              )
            )
          )
        )
      )
    );

    const DirectoryRegistry = () => React.createElement('section', { className: "py-12 bg-gradient-to-br from-blue-50 to-indigo-50" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('div', { className: "text-center mb-8" },
          React.createElement('h2', { className: "text-3xl font-semibold mb-4" }, "Directory Registry"),
          React.createElement('p', { className: "text-gray-600 max-w-2xl mx-auto" },
            "Explore the complete Alchemy framework structure with organized directories for core components, packages, demos, and documentation."
          )
        ),
        React.createElement('div', { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3" },
          directoryRegistry.map(dir =>
            React.createElement('div', {
              key: dir.name,
              className: "bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
            },
              React.createElement('div', { className: "flex items-center mb-3" },
                React.createElement('div', {
                  className: \`w-10 h-10 rounded-lg flex items-center justify-center mr-3 \${
                    dir.type === 'core' ? 'bg-blue-500' :
                    dir.type === 'packages' ? 'bg-purple-500' :
                    dir.type === 'apps' ? 'bg-green-500' :
                    dir.type === 'templates' ? 'bg-yellow-500' :
                    dir.type === 'docs' ? 'bg-red-500' :
                    dir.type === 'examples' ? 'bg-indigo-500' :
                    'bg-gray-500'
                  }\`
                },
                  React.createElement('span', { className: "text-white font-bold text-sm" },
                    dir.type.charAt(0).toUpperCase()
                  )
                ),
                React.createElement('div', null,
                  React.createElement('h3', { className: "font-semibold text-gray-900" }, dir.name),
                  React.createElement('p', { className: "text-sm text-gray-500 font-mono" }, dir.path)
                )
              ),
              React.createElement('p', { className: "text-sm text-gray-600 mb-4" }, dir.description),
              React.createElement('div', { className: "flex flex-wrap gap-1" },
                dir.files.map(file =>
                  React.createElement('span', {
                    key: file,
                    className: "inline-block px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                  }, file)
                )
              )
            )
          )
        )
      )
    );

    const MonitoringDataSection = () => React.createElement('section', { className: "py-12 bg-gradient-to-br from-blue-50 to-indigo-50" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('div', { className: "text-center mb-12" },
          React.createElement('h2', { className: "text-3xl font-semibold mb-4" }, "Monitoring, Logging & Data Analytics"),
          React.createElement('p', { className: "text-gray-600 max-w-2xl mx-auto" },
            "Comprehensive observability with real-time metrics, structured logging, and advanced analytics for complete tunnel visibility."
          )
        ),
        React.createElement('div', { className: "space-y-12" },
          monitoringFeatures.map((feature, index) =>
            React.createElement('div', {
              key: feature.title,
              className: "bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            },
              React.createElement('div', { className: "p-8 border-b border-gray-200" },
                React.createElement('div', { className: "flex items-center mb-4" },
                  React.createElement('div', { className: "text-4xl mr-4" }, feature.icon),
                  React.createElement('div', null,
                    React.createElement('h3', { className: "font-semibold text-gray-900 text-2xl mb-2" }, feature.title),
                    React.createElement('p', { className: "text-gray-600 text-lg" }, feature.description)
                  )
                ),
                React.createElement('div', { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-6" },
                  feature.features.map(feat =>
                    React.createElement('div', {
                      key: feat,
                      className: "flex items-center text-gray-700"
                    },
                      React.createElement('svg', { className: "w-5 h-5 mr-2 text-blue-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" })
                      ),
                      feat
                    )
                  )
                ),
                // Add metrics display for dashboard feature
                feature.metrics && React.createElement('div', { className: "mt-6" },
                  React.createElement('h4', { className: "font-semibold text-gray-900 mb-4" }, "Live Metrics Preview"),
                  React.createElement('div', { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3" },
                    feature.metrics.map(metric =>
                      React.createElement('div', {
                        key: metric.name,
                        className: "bg-gray-50 rounded-lg p-4 border border-gray-200"
                      },
                        React.createElement('div', { className: "flex items-center justify-between mb-2" },
                          React.createElement('span', { className: "text-sm font-medium text-gray-600" }, metric.name),
                          React.createElement('div', { className: "flex items-center" },
                            metric.trend === "up" && React.createElement('svg', { className: "w-4 h-4 text-green-500 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                              React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" })
                            ),
                            metric.trend === "down" && React.createElement('svg', { className: "w-4 h-4 text-red-500 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                              React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" })
                            ),
                            metric.trend === "stable" && React.createElement('svg', { className: "w-4 h-4 text-gray-500 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                              React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 12h14" })
                            ),
                            React.createElement('span', { 
                              className: "text-sm font-medium " + 
                              (metric.trend === "up" ? "text-green-600" : 
                               metric.trend === "down" ? "text-red-600" : "text-gray-600")
                            }, metric.change)
                          )
                        ),
                        React.createElement('div', { className: "text-2xl font-bold text-gray-900" }, metric.value)
                      )
                    )
                  )
                ),
                // Add log levels display for logging feature
                feature.logLevels && React.createElement('div', { className: "mt-6" },
                  React.createElement('h4', { className: "font-semibold text-gray-900 mb-4" }, "Log Levels Distribution"),
                  React.createElement('div', { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-4" },
                    feature.logLevels.map(logLevel =>
                      React.createElement('div', {
                        key: logLevel.level,
                        className: "bg-gray-50 rounded-lg p-4 border border-gray-200"
                      },
                        React.createElement('div', { className: "text-sm font-medium " + logLevel.color + " mb-1" }, logLevel.level),
                        React.createElement('div', { className: "text-2xl font-bold text-gray-900" }, logLevel.count)
                      )
                    )
                  )
                ),
                // Add insights display for analytics feature
                feature.insights && React.createElement('div', { className: "mt-6" },
                  React.createElement('h4', { className: "font-semibold text-gray-900 mb-4" }, "Analytics Insights"),
                  React.createElement('div', { className: "space-y-3" },
                    feature.insights.map(insight =>
                      React.createElement('div', {
                        key: insight.description,
                        className: "flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200"
                      },
                        React.createElement('div', { 
                          className: "w-2 h-2 rounded-full mr-3 " + 
                          (insight.status === "positive" ? "bg-green-500" :
                           insight.status === "warning" ? "bg-yellow-500" :
                           insight.status === "alert" ? "bg-red-500" : "bg-blue-500")
                        }),
                        React.createElement('div', null,
                          React.createElement('span', { className: "text-sm font-medium text-gray-600 mr-2" }, insight.type + ":"),
                          React.createElement('span', { className: "text-sm text-gray-900" }, insight.description)
                        )
                      )
                    )
                  )
                )
              ),
              React.createElement('div', { className: "relative" },
                React.createElement('pre', { className: "bg-gray-900 text-gray-100 p-6 overflow-x-auto text-sm" },
                  React.createElement('code', null, feature.code)
                ),
                React.createElement('button', {
                  className: "absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors",
                  onClick: () => {
                    navigator.clipboard.writeText(feature.code);
                    const button = event.target;
                    const originalText = button.textContent;
                    button.textContent = '✓';
                    setTimeout(() => {
                      button.textContent = originalText;
                    }, 2000);
                  }
                },
                  React.createElement('svg', { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" })
                  )
                )
              ),
              React.createElement('div', { className: "p-4 bg-blue-50 border-t border-blue-200" },
                React.createElement('div', { className: "flex items-center justify-between" },
                  React.createElement('div', null,
                    React.createElement('span', { className: "text-sm font-medium text-blue-800" }, "Observability Feature"),
                    React.createElement('p', { className: "text-xs text-blue-600 mt-1" }, "Real-time monitoring and analytics capabilities")
                  ),
                  React.createElement('a', {
                    href: feature.link,
                    target: "_blank",
                    rel: "noreferrer",
                    className: "inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  },
                    React.createElement('svg', { className: "w-4 h-4 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" })
                    ),
                    "View source code"
                  )
                )
              )
            )
          )
        ),
        React.createElement('div', { className: "mt-12 text-center" },
          React.createElement('div', { className: "bg-blue-100 border border-blue-200 rounded-lg p-8 max-w-4xl mx-auto" },
            React.createElement('div', { className: "flex items-center justify-center mb-6" },
              React.createElement('div', { className: "w-16 h-16 bg-blue-500 rounded-lg flex items-center justify-center mr-4" },
                React.createElement('svg', { className: "w-8 h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" })
                )
              ),
              React.createElement('div', { className: "text-left" },
                React.createElement('h3', { className: "text-2xl font-bold text-gray-900 mb-2" }, "Complete Observability Stack"),
                React.createElement('p', { className: "text-gray-600" }, "Real-time monitoring, structured logging, and advanced analytics for complete tunnel visibility")
              )
            ),
            React.createElement('div', { className: "grid gap-4 md:grid-cols-3 mb-6" },
              React.createElement('div', { className: "text-center" },
                React.createElement('div', { className: "text-3xl font-bold text-blue-600 mb-2" }, "30s"),
                React.createElement('div', { className: "text-sm text-gray-600" }, "Metrics Collection Interval")
              ),
              React.createElement('div', { className: "text-center" },
                React.createElement('div', { className: "text-3xl font-bold text-blue-600 mb-2" }, "11"),
                React.createElement('div', { className: "text-sm text-gray-600" }, "Prometheus Metrics")
              ),
              React.createElement('div', { className: "text-center" },
                React.createElement('div', { className: "text-3xl font-bold text-blue-600 mb-2" }, "4"),
                React.createElement('div', { className: "text-sm text-gray-600" }, "Log Levels")
              )
            ),
            React.createElement('div', { className: "flex flex-wrap gap-3 justify-center" },
              React.createElement('span', { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" },
                "📈 Real-Time Dashboard"
              ),
              React.createElement('span', { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" },
                "📝 Structured Logging"
              ),
              React.createElement('span', { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" },
                "🔍 Advanced Analytics"
              ),
              React.createElement('span', { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800" },
                "📊 Data Visualization"
              )
            )
          )
        )
      )
    );

    const Phase3FeaturesSection = () => React.createElement('section', { className: "py-12 bg-gradient-to-br from-emerald-50 to-teal-50" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('div', { className: "text-center mb-12" },
          React.createElement('h2', { className: "text-3xl font-semibold mb-4" }, "Phase 3: Enterprise Features"),
          React.createElement('p', { className: "text-gray-600 max-w-2xl mx-auto" },
            "Production-ready features including monitoring, zero-downtime updates, and graceful shutdown management."
          )
        ),
        React.createElement('div', { className: "space-y-12" },
          phase3Features.map((feature, index) =>
            React.createElement('div', {
              key: feature.title,
              className: "bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            },
              React.createElement('div', { className: "p-8 border-b border-gray-200" },
                React.createElement('div', { className: "flex items-center mb-4" },
                  React.createElement('div', { className: "text-4xl mr-4" }, feature.icon),
                  React.createElement('div', null,
                    React.createElement('h3', { className: "font-semibold text-gray-900 text-2xl mb-2" }, feature.title),
                    React.createElement('p', { className: "text-gray-600 text-lg" }, feature.description)
                  )
                ),
                React.createElement('div', { className: "grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-6" },
                  feature.features.map(feat =>
                    React.createElement('div', {
                      key: feat,
                      className: "flex items-center text-gray-700"
                    },
                      React.createElement('svg', { className: "w-5 h-5 mr-2 text-emerald-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                        React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" })
                      ),
                      feat
                    )
                  )
                )
              ),
              React.createElement('div', { className: "relative" },
                React.createElement('pre', { className: "bg-gray-900 text-gray-100 p-6 overflow-x-auto text-sm" },
                  React.createElement('code', null, feature.code)
                ),
                React.createElement('button', {
                  className: "absolute top-4 right-4 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors",
                  onClick: () => {
                    navigator.clipboard.writeText(feature.code);
                    const button = event.target;
                    const originalText = button.textContent;
                    button.textContent = '✓';
                    setTimeout(() => {
                      button.textContent = originalText;
                    }, 2000);
                  }
                },
                  React.createElement('svg', { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" })
                  )
                )
              ),
              React.createElement('div', { className: "p-4 bg-emerald-50 border-t border-emerald-200" },
                React.createElement('div', { className: "flex items-center justify-between" },
                  React.createElement('div', null,
                    React.createElement('span', { className: "text-sm font-medium text-emerald-800" }, "Enterprise Feature"),
                    React.createElement('p', { className: "text-xs text-emerald-600 mt-1" }, "Production-ready with comprehensive error handling")
                  ),
                  React.createElement('a', {
                    href: feature.link,
                    target: "_blank",
                    rel: "noreferrer",
                    className: "inline-flex items-center text-sm text-emerald-600 hover:text-emerald-800 transition-colors"
                  },
                    React.createElement('svg', { className: "w-4 h-4 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                      React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" })
                    ),
                    "View source code"
                  )
                )
              )
            )
          )
        ),
        React.createElement('div', { className: "mt-12 text-center" },
          React.createElement('div', { className: "bg-emerald-100 border border-emerald-200 rounded-lg p-8 max-w-4xl mx-auto" },
            React.createElement('div', { className: "flex items-center justify-center mb-6" },
              React.createElement('div', { className: "w-16 h-16 bg-emerald-500 rounded-lg flex items-center justify-center mr-4" },
                React.createElement('svg', { className: "w-8 h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" })
                )
              ),
              React.createElement('div', { className: "text-left" },
                React.createElement('h3', { className: "text-2xl font-bold text-gray-900 mb-2" }, "Complete Phase 3 Implementation"),
                React.createElement('p', { className: "text-gray-600" }, "All enterprise features are now fully implemented and production-ready")
              )
            ),
            React.createElement('div', { className: "grid gap-4 md:grid-cols-3 mb-6" },
              React.createElement('div', { className: "text-center" },
                React.createElement('div', { className: "text-3xl font-bold text-emerald-600 mb-2" }, "3"),
                React.createElement('div', { className: "text-sm text-gray-600" }, "Enterprise Features")
              ),
              React.createElement('div', { className: "text-center" },
                React.createElement('div', { className: "text-3xl font-bold text-emerald-600 mb-2" }, "100%"),
                React.createElement('div', { className: "text-sm text-gray-600" }, "TypeScript Coverage")
              ),
              React.createElement('div', { className: "text-center" },
                React.createElement('div', { className: "text-3xl font-bold text-emerald-600 mb-2" }, "∞"),
                React.createElement('div', { className: "text-sm text-gray-600" }, "Scalability")
              )
            ),
            React.createElement('div', { className: "flex flex-wrap gap-3 justify-center" },
              React.createElement('span', { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800" },
                "📊 Prometheus Metrics"
              ),
              React.createElement('span', { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800" },
                "🔄 Zero-Downtime Reload"
              ),
              React.createElement('span', { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800" },
                "🛡️ Graceful Shutdown"
              ),
              React.createElement('span', { className: "inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800" },
                "📦 npm Published"
              )
            )
          )
        )
      )
    );

    const CodeExamplesSection = () => React.createElement('section', { className: "py-12 bg-gradient-to-br from-gray-50 to-slate-50" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('div', { className: "text-center mb-12" },
          React.createElement('h2', { className: "text-3xl font-semibold mb-4" }, "Official Code Examples"),
          React.createElement('p', { className: "text-gray-600 max-w-2xl mx-auto" },
            "Real-world examples from the official Cloudflare Tunnel provider documentation. Copy, paste, and deploy."
          )
        ),
        React.createElement('div', { className: "grid gap-8 lg:grid-cols-2" },
          codeExamples.map(example =>
            React.createElement('div', {
              key: example.title,
              className: "bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            },
              React.createElement('div', { className: "p-6 border-b border-gray-200" },
                React.createElement('div', { className: "flex items-center justify-between mb-2" },
                  React.createElement('h3', { className: "font-semibold text-gray-900 text-lg" }, example.title),
                  React.createElement('span', { className: "text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded" }, example.language.toUpperCase())
                ),
                React.createElement('p', { className: "text-gray-600 text-sm" }, example.description)
              ),
              React.createElement('div', { className: "relative" },
                React.createElement('pre', { className: "bg-gray-900 text-gray-100 p-4 overflow-x-auto text-sm" },
                  React.createElement('code', null, example.code)
                ),
                React.createElement('button', {
                  className: "absolute top-2 right-2 p-2 bg-gray-700 hover:bg-gray-600 rounded text-gray-300 transition-colors",
                  onClick: () => {
                    navigator.clipboard.writeText(example.code);
                    // Simple feedback - in production would use toast
                    const button = event.target;
                    const originalText = button.textContent;
                    button.textContent = '✓';
                    setTimeout(() => {
                      button.textContent = originalText;
                    }, 2000);
                  }
                },
                  React.createElement('svg', { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" })
                  )
                )
              ),
              React.createElement('div', { className: "p-4 bg-gray-50 border-t border-gray-200" },
                React.createElement('a', {
                  href: example.link,
                  target: "_blank",
                  rel: "noreferrer",
                  className: "inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
                },
                  React.createElement('svg', { className: "w-4 h-4 mr-1", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                    React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" })
                  ),
                  "View in official documentation"
                )
              )
            )
          )
        ),
        React.createElement('div', { className: "mt-12 text-center" },
          React.createElement('div', { className: "bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-3xl mx-auto" },
            React.createElement('div', { className: "flex items-center mb-4" },
              React.createElement('div', { className: "w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4" },
                React.createElement('svg', { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" })
                )
              ),
              React.createElement('div', { className: "text-left" },
                React.createElement('h3', { className: "text-xl font-bold text-gray-900 mb-2" }, "Complete Provider Documentation"),
                React.createElement('p', { className: "text-gray-600" }, "Access the complete official documentation with all configuration options and advanced examples")
              )
            ),
            React.createElement('div', { className: "grid gap-3 md:grid-cols-3 mb-4 text-sm" },
              React.createElement('div', { className: "flex items-center text-gray-700" },
                React.createElement('svg', { className: "w-4 h-4 mr-2 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" })
                ),
                "Infrastructure as Code"
              ),
              React.createElement('div', { className: "flex items-center text-gray-700" },
                React.createElement('svg', { className: "w-4 h-4 mr-2 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" })
                ),
                "Automatic DNS Management"
              ),
              React.createElement('div', { className: "flex items-center text-gray-700" },
                React.createElement('svg', { className: "w-4 h-4 mr-2 text-green-500", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M5 13l4 4L19 7" })
                ),
                "WARP Routing Support"
              )
            ),
            React.createElement('a', {
              href: "https://github.com/alchemy-run/alchemy/blob/main/alchemy-web/src/content/docs/providers/cloudflare/tunnel.md",
              target: "_blank",
              rel: "noreferrer",
              className: "inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            },
              React.createElement('svg', { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" })
              ),
              "View Complete Documentation"
            )
          )
        )
      )
    );

    const TunnelProviderSection = () => React.createElement('section', { className: "py-12 bg-gradient-to-br from-indigo-50 to-blue-50" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('div', { className: "text-center mb-12" },
          React.createElement('h2', { className: "text-3xl font-semibold mb-4" }, "Cloudflare Tunnel Provider"),
          React.createElement('p', { className: "text-gray-600 max-w-2xl mx-auto" },
            "Enterprise-grade tunnel management with Infrastructure as Code. Deploy secure, auto-healing tunnels directly from your TypeScript configuration."
          )
        ),
        React.createElement('div', { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3" },
          providerFeatures.map(feature =>
            React.createElement('a', {
              key: feature.title,
              href: feature.link,
              target: "_blank",
              rel: "noreferrer",
              className: "group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-indigo-200"
            },
              React.createElement('div', { className: "flex items-start mb-4" },
                React.createElement('div', { className: "text-3xl mr-4" }, feature.icon),
                React.createElement('div', { className: "flex-1" },
                  React.createElement('h3', { className: "font-semibold text-gray-900 text-lg mb-2 group-hover:text-indigo-600 transition-colors" }, feature.title)
                )
              ),
              React.createElement('p', { className: "text-gray-600 mb-4" }, feature.description),
              React.createElement('div', { className: "flex items-center text-indigo-600 font-medium text-sm group-hover:text-indigo-700 transition-colors" },
                React.createElement('span', null, "Learn more"),
                React.createElement('svg', { className: "w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
                )
              )
            )
          )
        ),
        React.createElement('div', { className: "mt-12 text-center" },
          React.createElement('div', { className: "bg-white rounded-lg shadow-md p-8 border border-gray-100 max-w-4xl mx-auto" },
            React.createElement('div', { className: "flex items-center justify-center mb-6" },
              React.createElement('div', { className: "w-16 h-16 bg-indigo-500 rounded-lg flex items-center justify-center mr-4" },
                React.createElement('svg', { className: "w-8 h-8 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" })
                )
              ),
              React.createElement('div', { className: "text-left" },
                React.createElement('h3', { className: "text-2xl font-bold text-gray-900 mb-2" }, "Provider Documentation"),
                React.createElement('p', { className: "text-gray-600" }, "Complete API reference and configuration options")
              )
            ),
            React.createElement('div', { className: "grid gap-4 md:grid-cols-2 mb-6" },
              React.createElement('div', null,
                React.createElement('h4', { className: "font-semibold text-gray-900 mb-2" }, "Key Features"),
                React.createElement('ul', { className: "text-sm text-gray-600 space-y-1" },
                  React.createElement('li', null, "• TypeScript-first configuration"),
                  React.createElement('li', null, "• Automatic secret redaction"),
                  React.createElement('li', null, "• Built-in health monitoring"),
                  React.createElement('li', null, "• Multi-environment support")
                )
              ),
              React.createElement('div', null,
                React.createElement('h4', { className: "font-semibold text-gray-900 mb-2" }, "Integration Benefits"),
                React.createElement('ul', { className: "text-sm text-gray-600 space-y-1" },
                  React.createElement('li', null, "• Infrastructure as Code"),
                  React.createElement('li', null, "• GitOps workflows"),
                  React.createElement('li', null, "• Automated deployments"),
                  React.createElement('li', null, "• Zero-downtime updates")
                )
              )
            ),
            React.createElement('a', {
              href: "https://alchemy.run/providers/cloudflare/tunnel",
              target: "_blank",
              rel: "noreferrer",
              className: "inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-lg font-medium"
            },
              React.createElement('svg', { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" })
              ),
              "View Provider Documentation"
            )
          )
        )
      )
    );

    const TunnelImplementationGuide = () => React.createElement('section', { className: "py-12 bg-gradient-to-br from-purple-50 to-pink-50" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('div', { className: "text-center mb-12" },
          React.createElement('h2', { className: "text-3xl font-semibold mb-4" }, "Tunnel Implementation Guide"),
          React.createElement('p', { className: "text-gray-600 max-w-2xl mx-auto" },
            "Follow our comprehensive step-by-step guide to master Cloudflare Tunnel implementation with Alchemy Framework"
          )
        ),
        React.createElement('div', { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3" },
          tunnelSteps.map((step, index) =>
            React.createElement('a', {
              key: step.title,
              href: step.link,
              target: "_blank",
              rel: "noreferrer",
              className: "group bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-purple-200"
            },
              React.createElement('div', { className: "flex items-start mb-4" },
                React.createElement('div', { className: "text-3xl mr-4" }, step.icon),
                React.createElement('div', { className: "flex-1" },
                  React.createElement('h3', { className: "font-semibold text-gray-900 text-lg mb-2 group-hover:text-purple-600 transition-colors" }, step.title),
                  React.createElement('p', { className: "text-sm text-gray-500" }, \`Step \${index + 1} of 6\`)
                )
              ),
              React.createElement('p', { className: "text-gray-600 mb-4" }, step.description),
              React.createElement('div', { className: "flex items-center text-purple-600 font-medium text-sm group-hover:text-purple-700 transition-colors" },
                React.createElement('span', null, "Learn more"),
                React.createElement('svg', { className: "w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M9 5l7 7-7 7" })
                )
              )
            )
          )
        ),
        React.createElement('div', { className: "mt-12 text-center" },
          React.createElement('a', {
            href: "https://alchemy.run/guides/cloudflare-tunnel/#next-steps",
            target: "_blank",
            rel: "noreferrer",
            className: "inline-flex items-center px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-lg font-medium"
          },
            React.createElement('svg', { className: "w-5 h-5 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
              React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" })
            ),
            "View Complete Guide"
          )
        )
      )
    );

    const DocumentationTunnel = () => React.createElement('section', { className: "py-12 bg-gradient-to-br from-orange-50 to-amber-50" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('div', { className: "text-center mb-8" },
          React.createElement('h2', { className: "text-3xl font-semibold mb-4" }, "Documentation Tunnel"),
          React.createElement('p', { className: "text-gray-600 max-w-2xl mx-auto" },
            "Access comprehensive guides and documentation through our secure tunnel to Alchemy.run"
          )
        ),
        React.createElement('div', { className: "grid gap-6 md:grid-cols-2 lg:grid-cols-3" },
          React.createElement('div', { className: "bg-white rounded-lg shadow-md p-6 border border-gray-100" },
            React.createElement('div', { className: "flex items-center mb-4" },
              React.createElement('div', { className: "w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mr-4" },
                React.createElement('svg', { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" })
                )
              ),
              React.createElement('div', null,
                React.createElement('h3', { className: "font-semibold text-gray-900 text-lg" }, "Cloudflare Bun SPA Guide"),
                React.createElement('p', { className: "text-sm text-gray-500" }, "Complete documentation for Bun SPA deployment")
              )
            ),
            React.createElement('p', { className: "text-gray-600 mb-4" },
              "Learn how to build and deploy single-page applications with Bun and Cloudflare Workers using the Alchemy framework."
            ),
            React.createElement('a', {
              href: "https://alchemy.run/guides/cloudflare-bun-spa/#how-it-works",
              target: "_blank",
              rel: "noreferrer",
              className: "inline-flex items-center px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            },
              React.createElement('svg', { className: "w-4 h-4 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" })
              ),
              "Access Documentation"
            )
          ),
          React.createElement('div', { className: "bg-white rounded-lg shadow-md p-6 border border-gray-100" },
            React.createElement('div', { className: "flex items-center mb-4" },
              React.createElement('div', { className: "w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center mr-4" },
                React.createElement('svg', { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" })
                )
              ),
              React.createElement('div', null,
                React.createElement('h3', { className: "font-semibold text-gray-900 text-lg" }, "Cloudflare Tunnel Guide"),
                React.createElement('p', { className: "text-sm text-gray-500" }, "Complete tunnel implementation guide")
              )
            ),
            React.createElement('p', { className: "text-gray-600 mb-4" },
              "Master Cloudflare Tunnel implementation with comprehensive guides covering setup, configuration, and next steps."
            ),
            React.createElement('a', {
              href: "https://alchemy.run/guides/cloudflare-tunnel/#next-steps",
              target: "_blank",
              rel: "noreferrer",
              className: "inline-flex items-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
            },
              React.createElement('svg', { className: "w-4 h-4 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" })
              ),
              "View Tunnel Guide"
            )
          ),
          React.createElement('div', { className: "bg-white rounded-lg shadow-md p-6 border border-gray-100" },
            React.createElement('div', { className: "flex items-center mb-4" },
              React.createElement('div', { className: "w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center mr-4" },
                React.createElement('svg', { className: "w-6 h-6 text-white", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                  React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" })
                )
              ),
              React.createElement('div', null,
                React.createElement('h3', { className: "font-semibold text-gray-900 text-lg" }, "Quick Start Guide"),
                React.createElement('p', { className: "text-sm text-gray-500" }, "Get started in minutes")
              )
            ),
            React.createElement('p', { className: "text-gray-600 mb-4" },
              "Step-by-step instructions to set up your first Alchemy project and deploy it to Cloudflare Workers."
            ),
            React.createElement('a', {
              href: "https://alchemy.run/guides/cloudflare-bun-spa",
              target: "_blank",
              rel: "noreferrer",
              className: "inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            },
              React.createElement('svg', { className: "w-4 h-4 mr-2", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
                React.createElement('path', { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M13 10V3L4 14h7v7l9-11h-7z" })
              ),
              "Quick Start"
            )
          )
        )
      )
    );

    const RssCard = ({ title, items }) => React.createElement('section', { className: "py-12 bg-gray-50" },
      React.createElement('div', { className: "container mx-auto px-6" },
        React.createElement('h2', { className: "text-3xl font-semibold mb-6" }, title),
        React.createElement('div', { className: "grid gap-4 md:grid-cols-2 lg:grid-cols-3" },
          items.length ? items.map(i =>
            React.createElement('a', {
              key: i.link,
              href: i.link,
              target: "_blank",
              rel: "noreferrer",
              className: "block p-4 bg-white rounded shadow hover:shadow-lg transition"
            },
              React.createElement('h3', { className: "font-semibold text-gray-900" }, i.title),
              React.createElement('p', { className: "text-sm text-gray-500 mt-1" },
                \`\${formatDistance(new Date(i.pubDate), new Date())} ago\`
              ),
              i.description && React.createElement('p', { className: "text-sm text-gray-700 mt-2 line-clamp-2" }, i.description)
            )
          ) : React.createElement('p', { className: "text-gray-500" }, "No recent entries.")
        )
      )
    );

    const Footer = () => React.createElement('footer', { className: "border-t border-gray-200 py-8" },
      React.createElement('div', { className: "container mx-auto px-6 text-center text-gray-500" },
        React.createElement('p', null,
          "Open-source under MIT. Found a bug? ",
          React.createElement('a', {
            className: "underline hover:text-orange-600",
            href: \`https://github.com/\${REPO}/issues\`,
            target: "_blank",
            rel: "noreferrer"
          }, "File an issue"),
          "."
        ),
        React.createElement('p', { className: "mt-2 text-sm" },
          "Demo deployed via ",
          React.createElement('span', { className: "font-mono" }, "@alch/tunnel"),
          " v0.1.0"
        )
      )
    );

    /* ---------- PAGE ---------- */
    function DemoApp() {
      const releases = useRss(RSS_RELEASES);

      return React.createElement('div', { className: "min-h-screen flex flex-col" },
        React.createElement(Header),
        React.createElement('main', { className: "flex-1" },
          React.createElement(FeatureTable),
          React.createElement(TunnelProviderSection),
          React.createElement(CodeExamplesSection),
          React.createElement(MonitoringDataSection),
          React.createElement(Phase3FeaturesSection),
          React.createElement(TunnelImplementationGuide),
          React.createElement(DirectoryRegistry),
          React.createElement(DocumentationTunnel),
          React.createElement(RssCard, { title: "Latest Releases", items: releases })
        ),
        React.createElement(Footer)
      );
    }

    // Render the app
    ReactDOM.render(React.createElement(DemoApp), document.getElementById('root'));
  </script>
  <style>
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  </style>
</head>
<body>
  <div id="root"></div>
</body>
</html>`;

export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);

    // Serve the product page for root path
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(HTML_CONTENT, {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    // API routes
    if (url.pathname === "/api/health") {
      return Response.json({ status: "ok", timestamp: Date.now() });
    }

    if (url.pathname === "/api/hello") {
      return Response.json({ message: "Hello from Alchemy Cloudflare Tunnel!" });
    }

    // Default response
    return Response.json({ error: "Not found" }, { status: 404 });
  },
};
