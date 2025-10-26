import React, { useState, useEffect } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

interface UsersProps {
  isDarkMode: boolean;
}

export default function Users({ isDarkMode }: UsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUserExperience] = useState({ email: "", name: "" });

  const apiUrl = getBackendUrl();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/users`);
      const data = (await response.json()) as { users?: any[] };
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = (await response.json()) as { user: any };
      setUsers([...users, data.user]);
      setNewUserExperience({ email: "", name: "" });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className={isDarkMode ? "text-gray-300" : "text-gray-600"}>Loading users...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Create User Section */}
      <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-blue-50 to-indigo-50'} rounded-xl border p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Create New User</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Add a new user to the D1 database</p>
          </div>
        </div>
        
        <form onSubmit={createUser} className="space-y-4">
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
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUserExperience({ ...newUser, email: e.target.value })
                  }
                  className={`w-full pl-10 pr-3 py-2 border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
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
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUserExperience({ ...newUser, name: e.target.value })
                  }
                  className={`w-full pl-10 pr-3 py-2 border ${isDarkMode ? 'bg-gray-600 border-gray-500 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all`}
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>
          </div>
          <button
            type="submit"
            className="w-full md:w-auto px-6 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all transform hover:scale-105"
          >
            <span className="flex items-center justify-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Create User</span>
            </span>
          </button>
        </form>
      </div>

      {/* Users List Section */}
      <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white'} rounded-xl border shadow-sm`}>
        <div className="p-6 border-b ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-500 rounded-lg">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Users Directory</h2>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{users.length} users in database</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-gray-600 text-gray-300' : 'bg-blue-100 text-blue-800'}`}>
              D1 Database
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {users.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className={`mt-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>No users yet. Create your first user above!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`group relative p-4 rounded-lg border ${isDarkMode ? 'bg-gray-600 border-gray-500 hover:bg-gray-500' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'} transition-all cursor-pointer`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'} truncate`}>
                        {user.name}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                        {user.email}
                      </p>
                      <div className="flex items-center mt-2 space-x-2">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-green-100 text-green-800'}`}>
                          Active
                        </span>
                        <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
