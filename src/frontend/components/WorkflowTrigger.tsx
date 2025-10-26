import React, { useState } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

interface WorkflowTriggerProps {
  isDarkMode: boolean;
}

export default function WorkflowTrigger({ isDarkMode }: WorkflowTriggerProps) {
  const [formData, setFormData] = useState({ email: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const apiUrl = getBackendUrl();

  const triggerWorkflow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/api/workflow/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: crypto.randomUUID(),
          ...formData,
        }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error triggering workflow:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-purple-50 to-pink-50'} rounded-xl border p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-purple-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Trigger Cloudflare Workflow</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Start a multi-step user onboarding workflow automation</p>
          </div>
        </div>
        
        <form onSubmit={triggerWorkflow} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                  </svg>
                </div>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className={`w-full pl-10 pr-3 py-2 border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  placeholder="user@example.com"
                  required
                />
              </div>
            </div>
            <div>
              <label className={`block text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full pl-10 pr-3 py-2 border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all`}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Starting Workflow...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span>Start Onboarding Workflow</span>
              </span>
            )}
          </button>
        </form>
      </div>

      {result && (
        <div className={`${isDarkMode ? 'bg-gray-700 border-purple-600' : 'bg-purple-50 border-purple-200'} rounded-xl border p-6`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-purple-800'}`}>Workflow Started Successfully!</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-purple-600'}`}>Multi-step automation is now running</p>
            </div>
          </div>
          
          <div className={`space-y-3 ${isDarkMode ? 'text-gray-300' : 'text-purple-700'}`}>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-purple-600'}`}>
              <span className="font-medium">Workflow ID:</span> {result.workflowId}
            </div>
            
            <div>
              <p className="font-medium mb-2">Execution Steps:</p>
              <div className="space-y-2">
                {[
                  { step: 1, name: "Validate user data", status: "completed" },
                  { step: 2, name: "Create user profile", status: "in-progress" },
                  { step: 3, name: "Send welcome email", status: "pending" },
                  { step: 4, name: "Initialize user settings", status: "pending" }
                ].map((item) => (
                  <div key={item.step} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      item.status === 'completed' ? 'bg-green-500 text-white' :
                      item.status === 'in-progress' ? 'bg-yellow-500 text-white' :
                      'bg-gray-300 text-gray-600'
                    }`}>
                      {item.step}
                    </div>
                    <span className={`text-sm ${item.status === 'completed' ? 'line-through' : ''}`}>
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
