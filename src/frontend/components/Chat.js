import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useRef } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
export default function Chat() {
  const [connected, setConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [userId] = useState(`user-${Math.random().toString(36).substr(2, 9)}`);
  const wsRef = useRef(null);
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
  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim() && wsRef.current) {
      wsRef.current.send(JSON.stringify({ type: "message", text: input }));
      setInput("");
    }
  };
  return _jsxs("div", {
    className: "bg-white rounded-lg shadow p-6 h-[600px] flex flex-col",
    children: [
      _jsxs("div", {
        className: "flex items-center justify-between mb-4",
        children: [
          _jsx("h2", {
            className: "text-xl font-semibold",
            children: "Real-time Chat (Durable Object)",
          }),
          _jsxs("div", {
            className: "flex items-center space-x-2",
            children: [
              _jsx("div", {
                className: `w-3 h-3 rounded-full ${
                  connected ? "bg-green-500" : "bg-red-500"
                }`,
              }),
              _jsx("span", {
                className: "text-sm text-gray-600",
                children: connected ? "Connected" : "Disconnected",
              }),
            ],
          }),
        ],
      }),
      _jsx("div", {
        className:
          "flex-1 overflow-y-auto border border-gray-200 rounded-md p-4 mb-4 bg-gray-50",
        children:
          messages.length === 0
            ? _jsx("div", {
                className: "text-center text-gray-500 py-8",
                children: "No messages yet. Start chatting!",
              })
            : _jsx("div", {
                className: "space-y-2",
                children: messages.map((msg, i) =>
                  _jsxs(
                    "div",
                    {
                      className: "p-2 bg-white rounded shadow-sm",
                      children: [
                        _jsxs("div", {
                          className: "text-xs text-gray-500 mb-1",
                          children: [
                            msg.userId,
                            " \u2022 ",
                            new Date(msg.timestamp).toLocaleTimeString(),
                          ],
                        }),
                        _jsxs("div", {
                          className: "text-sm",
                          children: [
                            msg.type === "message" && msg.text,
                            msg.type === "user_joined" && "👋 joined the chat",
                            msg.type === "user_left" && "👋 left the chat",
                          ],
                        }),
                      ],
                    },
                    i,
                  ),
                ),
              }),
      }),
      _jsxs("form", {
        onSubmit: sendMessage,
        className: "flex space-x-2",
        children: [
          _jsx("input", {
            type: "text",
            value: input,
            onChange: (e) => setInput(e.target.value),
            placeholder: "Type a message...",
            className: "flex-1 px-3 py-2 border border-gray-300 rounded-md",
            disabled: !connected,
          }),
          _jsx("button", {
            type: "submit",
            disabled: !connected || !input.trim(),
            className:
              "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50",
            children: "Send",
          }),
        ],
      }),
    ],
  });
}
