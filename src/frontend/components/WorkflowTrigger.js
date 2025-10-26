import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
export default function WorkflowTrigger() {
    const [formData, setFormData] = useState({ email: "", name: "" });
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const apiUrl = getBackendUrl();
    const triggerWorkflow = async (e) => {
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
        }
        catch (error) {
            console.error("Error triggering workflow:", error);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "bg-white rounded-lg shadow p-6", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: "Trigger Cloudflare Workflow" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Start a multi-step user onboarding workflow that demonstrates Cloudflare Workflows (Oct 2025 feature)." }), _jsxs("form", { onSubmit: triggerWorkflow, className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Email" }), _jsx("input", { type: "email", value: formData.email, onChange: (e) => setFormData({ ...formData, email: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md", required: true })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Name" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-3 py-2 border border-gray-300 rounded-md", required: true })] }), _jsx("button", { type: "submit", disabled: loading, className: "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50", children: loading ? "Starting Workflow..." : "Start Onboarding Workflow" })] })] }), result && (_jsxs("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4", children: [_jsx("h3", { className: "font-semibold text-green-800 mb-2", children: "Workflow Started Successfully!" }), _jsxs("div", { className: "text-sm text-green-700", children: [_jsxs("div", { children: ["Workflow ID: ", result.workflowId] }), _jsxs("div", { className: "mt-2", children: ["The workflow will execute these steps:", _jsxs("ul", { className: "list-disc list-inside mt-1", children: [_jsx("li", { children: "Validate user data" }), _jsx("li", { children: "Create user profile" }), _jsx("li", { children: "Send welcome email" }), _jsx("li", { children: "Initialize user settings" })] })] })] })] }))] }));
}
