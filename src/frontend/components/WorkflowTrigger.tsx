import React, { useState } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

export default function WorkflowTrigger() {
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Trigger Cloudflare Workflow
        </h2>
        <p className="text-gray-600 mb-4">
          Start a multi-step user onboarding workflow that demonstrates Cloudflare Workflows (Oct 2025 feature).
        </p>
        <form onSubmit={triggerWorkflow} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Starting Workflow..." : "Start Onboarding Workflow"}
          </button>
        </form>
      </div>

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h3 className="font-semibold text-green-800 mb-2">
            Workflow Started Successfully!
          </h3>
          <div className="text-sm text-green-700">
            <div>Workflow ID: {result.workflowId}</div>
            <div className="mt-2">
              The workflow will execute these steps:
              <ul className="list-disc list-inside mt-1">
                <li>Validate user data</li>
                <li>Create user profile</li>
                <li>Send welcome email</li>
                <li>Initialize user settings</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

