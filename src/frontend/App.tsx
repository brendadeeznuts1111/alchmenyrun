import React, { useState, useEffect } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
import Users from "./components/Users";
import FileUpload from "./components/FileUpload";
import WorkflowTrigger from "./components/WorkflowTrigger";
import CacheDemo from "./components/CacheDemo";

// Feature icons using Lucide-style SVG components
const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const FilesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const WorkflowIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const CacheIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V2" />
  </svg>
);

const CloudflareIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 11.19c-.02-.11-.04-.23-.07-.34-.03-.11-.07-.23-.12-.34-.05-.11-.1-.21-.16-.31-.06-.1-.13-.19-.2-.28-.07-.09-.15-.17-.23-.25-.08-.08-.17-.15-.26-.22-.09-.07-.19-.13-.29-.18-.1-.05-.21-.09-.32-.12-.11-.03-.22-.05-.34-.06-.12-.01-.23-.01-.35 0-.12.01-.23.03-.34.06-.11.03-.22.07-.32.12-.1.05-.2.11-.29.18-.09.07-.18.14-.26.22-.08.08-.16.16-.23.25-.07.09-.14.18-.2.28-.06.1-.11.2-.16.31-.05.11-.09.22-.12.34-.03.11-.05.23-.07.34-.02.12-.02.23-.02.35 0 .12 0 .23.02.35.02.11.04.23.07.34.03.11.07.23.12.34.05.11.1.21.16.31.06.1.13.19.2.28.07.09.15.17.23.25.08.08.17.15.26.22.09.07.19.13.29.18.1.05.21.09.32.12.11.03.22.05.34.06.12.01.23.01.35 0 .12-.01.23-.03.34-.06.11-.03.22-.07.32-.12.1-.05.2-.11.29-.18.09-.07.18-.14.26-.22.08-.08.16-.16.23-.25.07-.09.14-.18.2-.28.06-.1.11-.2.16-.31.05-.11.09-.22.12-.34.03-.11.05-.23.07-.34.02-.12.02-.23.02-.35 0-.12 0-.23-.02-.35z"/>
  </svg>
);

function App() {
  const [activeTab, setActiveTab] = useState("users");
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Check for system dark mode preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setIsDarkMode(true);
    }
  }, []);

  const tabs = [
    { 
      id: "users", 
      label: "Users", 
      icon: <UsersIcon />,
      description: "Manage user accounts with D1 database",
      color: "blue"
    },
    { 
      id: "files", 
      label: "Files", 
      icon: <FilesIcon />,
      description: "Upload and store files in R2 storage",
      color: "green"
    },
    { 
      id: "workflow", 
      label: "Workflow", 
      icon: <WorkflowIcon />,
      description: "Trigger Cloudflare workflow automation",
      color: "purple"
    },
    { 
      id: "cache", 
      label: "Cache", 
      icon: <CacheIcon />,
      description: "KV namespace for global data caching",
      color: "orange"
    },
  ];

  const activeTabData = tabs.find(tab => tab.id === activeTab);

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <CloudflareIcon />
                </div>
                <div>
                  <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    ⚡ Alchemy Cloudflare Demo
                  </h1>
                  <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mt-1`}>
                    Infrastructure as TypeScript - Full-stack Cloudflare application
                  </p>
                </div>
              </div>
            </div>
            
            {/* Dark mode toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700 text-yellow-400 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'} transition-colors`}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Feature Tabs */}
      <nav className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex space-x-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-3 border-b-2 font-medium text-sm transition-all ${
                  activeTab === tab.id
                    ? `border-${tab.color}-500 text-${tab.color}-600 bg-${tab.color}-50 ${isDarkMode ? `bg-gray-700 text-${tab.color}-400` : ''}`
                    : `border-transparent ${isDarkMode ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Active Tab Description */}
      <div className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg bg-${activeTabData?.color}-100 ${isDarkMode ? `bg-${activeTabData?.color}-900` : ''}`}>
              {activeTabData?.icon}
            </div>
            <div>
              <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {activeTabData?.label} Management
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {activeTabData?.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          {activeTab === "users" && <Users isDarkMode={isDarkMode} />}
          {activeTab === "files" && <FileUpload isDarkMode={isDarkMode} />}
          {activeTab === "workflow" && <WorkflowTrigger isDarkMode={isDarkMode} />}
          {activeTab === "cache" && <CacheDemo isDarkMode={isDarkMode} />}
        </div>
      </main>

      {/* Footer */}
      <footer className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'} border-t mt-12`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                🚀 Powered By
              </h3>
              <div className="space-y-2">
                <a
                  href="https://alchemy.run"
                  className={`block ${isDarkMode ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'} transition-colors`}
                >
                  Alchemy Framework
                </a>
                <a
                  href="https://cloudflare.com"
                  className={`block ${isDarkMode ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'} transition-colors`}
                >
                  Cloudflare Workers
                </a>
                <a
                  href="https://bun.sh"
                  className={`block ${isDarkMode ? 'text-gray-400 hover:text-orange-400' : 'text-gray-600 hover:text-orange-600'} transition-colors`}
                >
                  Bun Runtime
                </a>
              </div>
            </div>
            
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                🛠️ Technologies
              </h3>
              <div className="space-y-2">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • D1 Database (SQLite)
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • R2 Object Storage
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • KV Namespace
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • Cloudflare Workflows
                </div>
              </div>
            </div>
            
            <div>
              <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-3`}>
                📊 Features
              </h3>
              <div className="space-y-2">
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • User Management
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • File Upload/Storage
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • Workflow Automation
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  • Global Caching
                </div>
              </div>
            </div>
          </div>
          
          <div className={`mt-8 pt-6 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-center`}>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Built with ❤️ using modern web technologies on Cloudflare's global network
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
