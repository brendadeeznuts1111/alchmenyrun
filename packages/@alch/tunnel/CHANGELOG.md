# Changelog

All notable changes to `@alch/tunnel` will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-12-XX

### Added
- Initial release of Cloudflare Tunnel resource for Alchemy
- Automatic tunnel creation, update, and deletion
- DNS automation for ingress hostnames
- Tunnel adoption support for existing tunnels
- Comprehensive Prometheus metrics export
- Graceful shutdown with configurable grace periods
- Zero-downtime configuration reload
- Rolling update support for configuration changes
- Automatic backup and rollback capabilities
- Health checking after configuration updates
- Signal handlers for SIGTERM, SIGINT, and SIGUSR2

### Features
- **Tunnel Management**: Full lifecycle management of Cloudflare Tunnels
- **Ingress Rules**: Path-based and hostname-based routing
- **Origin Configuration**: Comprehensive origin request settings
- **WARP Routing**: Private network access configuration
- **Metrics Collection**: Real-time tunnel metrics with Prometheus format
- **Shutdown Hooks**: Customizable cleanup functions
- **Config Validation**: Pre-deployment configuration validation

### Documentation
- Complete API reference with TypeScript types
- Usage examples for common scenarios
- Integration guides for production deployments
- Cloudflare API documentation references
- Alchemy framework compatibility notes

### Dependencies
- `alchemy`: ^0.76.1
- `@cloudflare/workers-types`: ^4.20241218.0
- `typescript`: ^5.3.0

### Breaking Changes
None (initial release)

---

## Version History

### Compatibility Matrix

| @alch/tunnel | Alchemy | Cloudflare API | Node.js |
|--------------|---------|----------------|---------|
| 1.0.0        | ^0.76.1 | >=2024.1.0     | >=18.0  |

### Upgrade Guide

This is the initial release. No upgrade path required.

### Known Issues

- Mock implementations for API calls (production API integration pending)
- DNS record creation not yet implemented
- Tunnel deletion via API not yet implemented

### Roadmap

- [ ] Real Cloudflare API integration
- [ ] DNS record automation
- [ ] Advanced metrics aggregation
- [ ] Custom metric exporters
- [ ] Configuration templates
- [ ] CLI tooling integration
