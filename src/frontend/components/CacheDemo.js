import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
export default function CacheDemo() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [cachedValue, setCachedValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const apiUrl = getBackendUrl();
  const setCache = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch(`${apiUrl}/api/cache/${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      });
      setKey("");
      setValue("");
    } catch (error) {
      console.error("Error setting cache:", error);
    } finally {
      setLoading(false);
    }
  };
  const getCache = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/cache/${key}`);
      const data = await response.json();
      setCachedValue(data);
    } catch (error) {
      console.error("Error getting cache:", error);
    } finally {
      setLoading(false);
    }
  };
  return _jsxs("div", {
    className: "space-y-6",
    children: [
      _jsxs("div", {
        className: "bg-white rounded-lg shadow p-6",
        children: [
          _jsx("h2", {
            className: "text-xl font-semibold mb-4",
            children: "KV Cache Demo",
          }),
          _jsx("p", {
            className: "text-gray-600 mb-4",
            children:
              "Test Cloudflare KV Namespace for caching key-value data.",
          }),
          _jsxs("div", {
            className: "grid grid-cols-2 gap-6",
            children: [
              _jsxs("div", {
                children: [
                  _jsx("h3", {
                    className: "font-medium mb-3",
                    children: "Set Cache",
                  }),
                  _jsxs("form", {
                    onSubmit: setCache,
                    className: "space-y-3",
                    children: [
                      _jsx("input", {
                        type: "text",
                        value: key,
                        onChange: (e) => setKey(e.target.value),
                        placeholder: "Cache key",
                        className:
                          "w-full px-3 py-2 border border-gray-300 rounded-md",
                        required: true,
                      }),
                      _jsx("input", {
                        type: "text",
                        value: value,
                        onChange: (e) => setValue(e.target.value),
                        placeholder: "Cache value",
                        className:
                          "w-full px-3 py-2 border border-gray-300 rounded-md",
                        required: true,
                      }),
                      _jsx("button", {
                        type: "submit",
                        disabled: loading,
                        className:
                          "w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50",
                        children: "Set Cache",
                      }),
                    ],
                  }),
                ],
              }),
              _jsxs("div", {
                children: [
                  _jsx("h3", {
                    className: "font-medium mb-3",
                    children: "Get Cache",
                  }),
                  _jsxs("form", {
                    onSubmit: getCache,
                    className: "space-y-3",
                    children: [
                      _jsx("input", {
                        type: "text",
                        value: key,
                        onChange: (e) => setKey(e.target.value),
                        placeholder: "Cache key",
                        className:
                          "w-full px-3 py-2 border border-gray-300 rounded-md",
                        required: true,
                      }),
                      _jsx("button", {
                        type: "submit",
                        disabled: loading,
                        className:
                          "w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50",
                        children: "Get Cache",
                      }),
                    ],
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
      cachedValue &&
        _jsxs("div", {
          className: "bg-blue-50 border border-blue-200 rounded-lg p-4",
          children: [
            _jsx("h3", {
              className: "font-semibold text-blue-800 mb-2",
              children: "Cache Result",
            }),
            _jsxs("div", {
              className: "text-sm text-blue-700",
              children: [
                _jsxs("div", { children: ["Key: ", cachedValue.key] }),
                _jsxs("div", {
                  children: ["Found: ", cachedValue.found ? "✅ Yes" : "❌ No"],
                }),
                cachedValue.value &&
                  _jsxs("div", {
                    className:
                      "mt-2 p-2 bg-white rounded border border-blue-200",
                    children: ["Value: ", cachedValue.value],
                  }),
              ],
            }),
          ],
        }),
    ],
  });
}
