# v1.0.0 – Core Infrastructure

**Full-featured Cloudflare infrastructure demo built with Alchemy.**

## ✨ Features

### Infrastructure
✅ **Multi-environment profiles** - Local, staging, production with secure credential management  
✅ **CI/CD pipelines** - Automated deployment and PR preview environments  
✅ **Durable Objects** - WebSocket chat with real-time messaging  
✅ **Workflows** - Multi-step orchestration with automatic retries  
✅ **D1 Database** - SQLite-based user and file storage  
✅ **R2 Storage** - Object storage for file uploads  
✅ **KV Cache** - Fast key-value caching  
✅ **Queues** - Async job processing  

### Documentation
📚 **Complete guides** in `/docs`:
- Profile configuration and authentication
- WebSocket chat implementation
- Workflow orchestration patterns
- Cloudflare deployment best practices

## 🚀 Quick Start

### Deploy to Production

```bash
git checkout v1.0.0
bun install
bun alchemy login
bun alchemy deploy --profile prod
```

### Local Development

```bash
bun install
bun run dev
```

## 🔗 Links

- **Live Demo**: https://cloudflare-demo-website-prod.utahj4754.workers.dev
- **Documentation**: [/docs](./docs)
- **Repository**: https://github.com/brendadeeznuts1111/alchmenyrun

## 📦 Dependencies

- **Alchemy**: 0.77.0
- **Bun**: 1.3.1+
- **Cloudflare Workers**: Latest runtime

## 🎯 What's Next

See our [roadmap](./docs/ROADMAP.md) for upcoming features:
- Enhanced MCP server integration
- Additional workflow templates
- Performance monitoring dashboard
- Multi-region deployment

## 🙏 Acknowledgments

Built with [Alchemy](https://alchemy.run) - TypeScript-native Infrastructure as Code.

---

**Full Changelog**: https://github.com/brendadeeznuts1111/alchmenyrun/compare/v0.1.0...v1.0.0
