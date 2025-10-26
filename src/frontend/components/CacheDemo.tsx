import React, { useState } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

interface CacheDemoProps {
  isDarkMode: boolean;
}

export default function CacheDemo({ isDarkMode }: CacheDemoProps) {
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
    <div className="space-y-8">
      <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-orange-50 to-amber-50'} rounded-xl border p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-orange-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>KV Cache Demo</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Test Cloudflare KV Namespace for global data caching</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Set Cache Section */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-white'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1 bg-blue-500 rounded">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Set Cache</h3>
            </div>
            <form onSubmit={setCache} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Cache Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter cache key"
                    className={`w-full pl-10 pr-3 py-2 border ${isDarkMode ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    required
                  />
                </div>
              </div>
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Cache Value
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="Enter cache value"
                    className={`w-full pl-10 pr-3 py-2 border ${isDarkMode ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Setting...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Set Cache</span>
                  </span>
                )}
              </button>
            </form>
          </div>

          {/* Get Cache Section */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-white'} border ${isDarkMode ? 'border-gray-500' : 'border-gray-200'}`}>
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-1 bg-green-500 rounded">
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                </svg>
              </div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Get Cache</h3>
            </div>
            <form onSubmit={getCache} className="space-y-4">
              <div>
                <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                  Cache Key
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => setKey(e.target.value)}
                    placeholder="Enter cache key"
                    className={`w-full pl-10 pr-3 py-2 border ${isDarkMode ? 'bg-gray-700 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all`}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Retrieving...</span>
                  </span>
                ) : (
                  <span className="flex items-center justify-center space-x-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
                    </svg>
                    <span>Get Cache</span>
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>

      {cachedValue && (
        <div className={`${isDarkMode ? 'bg-gray-700 border-orange-600' : 'bg-orange-50 border-orange-200'} rounded-xl border p-6`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-orange-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-orange-800'}`}>Cache Result</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-orange-600'}`}>KV namespace query completed</p>
            </div>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-orange-700'}`}>
            <div>
              <span className="font-medium">Key:</span>
              <div className={`mt-1 p-2 rounded ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-white text-orange-600'} font-mono`}>
                {cachedValue.key}
              </div>
            </div>
            <div>
              <span className="font-medium">Status:</span>
              <div className="mt-1">
                {cachedValue.found ? (
                  <span className="inline-flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Found</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>Not Found</span>
                  </span>
                )}
              </div>
            </div>
            {cachedValue.value && (
              <div className="md:col-span-2">
                <span className="font-medium">Value:</span>
                <div className={`mt-1 p-3 rounded ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-white text-orange-600'} font-mono text-sm`}>
                  {cachedValue.value}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
