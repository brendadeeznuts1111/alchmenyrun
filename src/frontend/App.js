import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import Users from "./components/Users";
import FileUpload from "./components/FileUpload";
// import Chat from "./components/Chat"; // Temporarily disabled
import WorkflowTrigger from "./components/WorkflowTrigger";
import CacheDemo from "./components/CacheDemo";
function App() {
  const [activeTab, setActiveTab] = useState("users");
  return _jsxs("div", {
    className: "min-h-screen bg-gray-100",
    children: [
      _jsx("header", {
        className: "bg-white shadow",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-4 py-6",
          children: [
            _jsx("h1", {
              className: "text-3xl font-bold text-gray-900",
              children: "\u26A1 Alchemy Cloudflare Demo",
            }),
            _jsx("p", {
              className: "text-gray-600 mt-2",
              children:
                "Infrastructure as TypeScript - Full-stack Cloudflare application",
            }),
          ],
        }),
      }),
      _jsx("nav", {
        className: "bg-white border-b",
        children: _jsx("div", {
          className: "max-w-7xl mx-auto px-4",
          children: _jsx("div", {
            className: "flex space-x-4",
            children: [
              { id: "users", label: "👥 Users" },
              { id: "files", label: "📁 Files" },
              // { id: "chat", label: "💬 Chat" }, // Temporarily disabled
              { id: "workflow", label: "⚙️ Workflow" },
              { id: "cache", label: "💾 Cache" },
            ].map((tab) =>
              _jsx(
                "button",
                {
                  onClick: () => setActiveTab(tab.id),
                  className: `px-4 py-2 border-b-2 font-medium ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700"
                  }`,
                  children: tab.label,
                },
                tab.id,
              ),
            ),
          }),
        }),
      }),
      _jsxs("main", {
        className: "max-w-7xl mx-auto px-4 py-8",
        children: [
          activeTab === "users" && _jsx(Users, {}),
          activeTab === "files" && _jsx(FileUpload, {}),
          " ",
          activeTab === "workflow" && _jsx(WorkflowTrigger, {}),
          activeTab === "cache" && _jsx(CacheDemo, {}),
        ],
      }),
      _jsx("footer", {
        className: "bg-white border-t mt-12",
        children: _jsxs("div", {
          className: "max-w-7xl mx-auto px-4 py-6 text-center text-gray-600",
          children: [
            "Built with",
            " ",
            _jsx("a", {
              href: "https://alchemy.run",
              className: "text-blue-600 hover:underline",
              children: "Alchemy",
            }),
            " ",
            "and",
            " ",
            _jsx("a", {
              href: "https://cloudflare.com",
              className: "text-blue-600 hover:underline",
              children: "Cloudflare",
            }),
          ],
        }),
      }),
    ],
  });
}
export default App;
