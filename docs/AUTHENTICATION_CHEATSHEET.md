# Cloudflare Auth Cheat Sheet

A quick reference guide for picking the right Cloudflare authentication pattern in Alchemy.

---

## 1. Pick the Method (in order of preference)

| Method | Set-once command | Re-auth command | Env var fallback | Notes |
|---|---|---|---|---|
| **OAuth (recommended)** | `alchemy configure` → choose OAuth | `alchemy login` | – | Tokens auto-refresh; works with Profiles |
| **API Token** | `alchemy configure` → paste token | – | `CLOUDFLARE_API_TOKEN` | Least-privilege, no e-mail needed |
| **Global API Key** (legacy) | `alchemy configure` → paste key + e-mail | – | `CLOUDFLARE_API_KEY` + `CLOUDFLARE_EMAIL` | Full account access; avoid if possible |

---

## 2. One-liners for CI / ad-hoc deploy

### OAuth (profile already configured)
```bash
npx alchemy deploy --profile prod
```

### API Token
```bash
CLOUDFLARE_API_TOKEN=<token> npx alchemy deploy
```

### Global Key
```bash
CLOUDFLARE_EMAIL=me@example.com CLOUDFLARE_API_KEY=<key> npx alchemy deploy
```

### Multi-account? Pin the ID:
```bash
CLOUDFLARE_ACCOUNT_ID=<id> npx alchemy deploy
```

---

## 3. Programmatic (TypeScript) override

```typescript
await Worker("my-worker", {
  apiToken: alchemy.secret(process.env.MY_TOKEN),   // or apiKey + email
  accountId: "explicit-account-id",                // optional
});
```

**Remember:** `alchemy.secret` requires you to initialize Alchemy with a password.

---

## 4. Quick profile check

```bash
alchemy config list
```

Shows which profile (and therefore which token/key) will be used by default.

---

**That's it**—pick the row that matches your security comfort level, copy the one-liner, and deploy.

For detailed authentication guide, see [AUTHENTICATION.md](./AUTHENTICATION.md).

