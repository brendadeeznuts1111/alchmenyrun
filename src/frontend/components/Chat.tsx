import React, { useState, useEffect, useRef } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

interface Message {
  type: string;
  userId?: string;
  text?: string;
  timestamp: string;
}

export default function Chat() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [userId] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
  const wsRef = useRef<WebSocket | null>(null);
  const apiUrl = getBackendUrl();

  useEffect(() => {
    connect();
    return () => {
      wsRef.current?.close();
    };
  }, []);

  const connect = () => {
    const url = String(apiUrl);
    const wsUrl = url.replace("http://", "ws://").replace("https://", "wss://");
    const ws = new WebSocket(`${wsUrl}/api/chat`);

    ws.onopen = () => {
      setConnected(true);
      ws.send(JSON.stringify({ type: "join", userId }));
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      setMessages((prev) => [...prev, message]);
    };

    ws.onclose = () => {
      setConnected(false);
      setTimeout(connect, 3000);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    wsRef.current = ws;
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "message", text: input }));
      setInput("");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 h-[600px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">
          Real-time Chat (Durable Object)
        </h2>
        <div className="flex items-center space-x-2">
          <div
            className={`w-3 h-3 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span className="text-sm text-gray-600">
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            No messages yet. Start chatting!
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <div key={i} className="p-2 bg-white rounded shadow-sm">
                <div className="text-xs text-gray-500 mb-1">
                  {msg.userId} • {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
                <div className="text-sm">
                  {msg.type === "message" && msg.text}
                  {msg.type === "user_joined" && "👋 joined the chat"}
                  {msg.type === "user_left" && "👋 left the chat"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={sendMessage} className="flex space-x-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          disabled={!connected}
        />
        <button
          type="submit"
          disabled={!connected || !input.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
