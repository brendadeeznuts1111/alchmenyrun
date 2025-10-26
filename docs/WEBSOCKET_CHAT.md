# WebSocket Chat

Real-time messaging powered by Cloudflare Durable Objects.

## Endpoint

```
wss://<your-worker>.workers.dev/api/chat
```

The endpoint creates a single shared chat room using a Durable Object instance.

## Quick Test

```bash
# Using wscat (install: npm i -g wscat)
wscat -c wss://cloudflare-demo-website-prod.utahj4754.workers.dev/api/chat

# Send a message
> {"type":"message","text":"Hello, world!","userId":"user123"}

# Join the room
> {"type":"join","userId":"user123"}
```

## Message Format

### Client → Server

**Join Room**
```json
{
  "type": "join",
  "userId": "your-user-id"
}
```

**Send Message**
```json
{
  "type": "message",
  "text": "Your message here"
}
```

**Ping (Keep-Alive)**
```json
{
  "type": "ping"
}
```

### Server → Client

**User Joined**
```json
{
  "type": "user_joined",
  "userId": "user123",
  "timestamp": "2025-10-26T05:20:00.000Z"
}
```

**Message Broadcast**
```json
{
  "type": "message",
  "userId": "user123",
  "text": "Hello, world!",
  "timestamp": "2025-10-26T05:20:00.000Z"
}
```

**User Left**
```json
{
  "type": "user_left",
  "userId": "user123",
  "timestamp": "2025-10-26T05:20:00.000Z"
}
```

**Pong (Response to Ping)**
```json
{
  "type": "pong"
}
```

## How It Works

1. **HTTP Upgrade**: Worker's `fetch()` handler upgrades the HTTP request to WebSocket
2. **Durable Object**: Request is forwarded to the `ChatRoom` Durable Object
3. **Session Management**: DO stores each WebSocket connection in a `Map`
4. **Broadcasting**: Messages are broadcast to all connected clients
5. **Cleanup**: Connections are removed on close/error

## Implementation

See `src/backend/durable-object.ts` for the full `ChatRoom` implementation.

Key features:
- **Stateful connections**: Each DO instance maintains active WebSocket connections
- **Broadcast messaging**: Messages sent to all connected clients
- **User presence**: Join/leave events notify other users
- **Error handling**: Automatic cleanup on connection errors

## Cloudflare Limits

- **Message size**: 1 MB max per message
- **Connections**: 10,000+ concurrent connections per DO instance
- **Hibernation**: Connections can hibernate to save resources
- **Timeout**: 10-minute inactivity timeout (configurable)

## Frontend Integration

The demo includes a React component at `src/frontend/components/Chat.tsx` that demonstrates:
- WebSocket connection management
- Message sending/receiving
- User presence tracking
- Reconnection logic

## Production Considerations

1. **Authentication**: Add user authentication before production use
2. **Rate Limiting**: Implement message rate limits per user
3. **Moderation**: Add content filtering and moderation
4. **Persistence**: Store message history in D1 database
5. **Scaling**: Use multiple room IDs to distribute load across DO instances
