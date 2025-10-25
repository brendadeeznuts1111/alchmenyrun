import React, { useState, useEffect } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
import Users from "./components/Users";
import FileUpload from "./components/FileUpload";
import Chat from "./components/Chat";
import WorkflowTrigger from "./components/WorkflowTrigger";
import CacheDemo from "./components/CacheDemo";

function App() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ⚡ Alchemy Cloudflare Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Infrastructure as TypeScript - Full-stack Cloudflare application
          </p>
        </div>
      </header>

      <nav className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-4">
            {[
              { id: "users", label: "👥 Users" },
              { id: "files", label: "📁 Files" },
              { id: "chat", label: "💬 Chat" },
              { id: "workflow", label: "⚙️ Workflow" },
              { id: "cache", label: "💾 Cache" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 border-b-2 font-medium ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === "users" && <Users />}
        {activeTab === "files" && <FileUpload />}
        {activeTab === "chat" && <Chat />}
        {activeTab === "workflow" && <WorkflowTrigger />}
        {activeTab === "cache" && <CacheDemo />}
      </main>

      <footer className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-600">
          Built with{" "}
          <a
            href="https://alchemy.run"
            className="text-blue-600 hover:underline"
          >
            Alchemy
          </a>{" "}
          and{" "}
          <a
            href="https://cloudflare.com"
            className="text-blue-600 hover:underline"
          >
            Cloudflare
          </a>
        </div>
      </footer>
    </div>
  );
}

export default App;
