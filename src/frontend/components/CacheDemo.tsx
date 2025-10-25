import React, { useState } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

export default function CacheDemo() {
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [cachedValue, setCachedValue] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const apiUrl = getBackendUrl();

  const setCache = async (e: React.FormEvent) => {
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

  const getCache = async (e: React.FormEvent) => {
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">KV Cache Demo</h2>
        <p className="text-gray-600 mb-4">
          Test Cloudflare KV Namespace for caching key-value data.
        </p>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-3">Set Cache</h3>
            <form onSubmit={setCache} className="space-y-3">
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Cache key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Cache value"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Set Cache
              </button>
            </form>
          </div>

          <div>
            <h3 className="font-medium mb-3">Get Cache</h3>
            <form onSubmit={getCache} className="space-y-3">
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Cache key"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                required
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Get Cache
              </button>
            </form>
          </div>
        </div>
      </div>

      {cachedValue && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-800 mb-2">Cache Result</h3>
          <div className="text-sm text-blue-700">
            <div>Key: {cachedValue.key}</div>
            <div>Found: {cachedValue.found ? "✅ Yes" : "❌ No"}</div>
            {cachedValue.value && (
              <div className="mt-2 p-2 bg-white rounded border border-blue-200">
                Value: {cachedValue.value}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
