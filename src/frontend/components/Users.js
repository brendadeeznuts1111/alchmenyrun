import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newUser, setNewUserExperience] = useState({ email: "", name: "" });
  const apiUrl = getBackendUrl();
  useEffect(() => {
    loadUsers();
  }, []);
  const loadUsers = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/users`);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };
  const createUser = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${apiUrl}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const data = await response.json();
      setUsers([...users, data.user]);
      setNewUserExperience({ email: "", name: "" });
    } catch (error) {
      console.error("Error creating user:", error);
    }
  };
  if (loading) {
    return _jsx("div", {
      className: "text-center py-8",
      children: "Loading users...",
    });
  }
  return _jsxs("div", {
    className: "space-y-6",
    children: [
      _jsxs("div", {
        className: "bg-white rounded-lg shadow p-6",
        children: [
          _jsx("h2", {
            className: "text-xl font-semibold mb-4",
            children: "Create New User",
          }),
          _jsxs("form", {
            onSubmit: createUser,
            className: "space-y-4",
            children: [
              _jsxs("div", {
                children: [
                  _jsx("label", {
                    className: "block text-sm font-medium text-gray-700 mb-1",
                    children: "Email",
                  }),
                  _jsx("input", {
                    type: "email",
                    value: newUser.email,
                    onChange: (e) =>
                      setNewUserExperience({
                        ...newUser,
                        email: e.target.value,
                      }),
                    className:
                      "w-full px-3 py-2 border border-gray-300 rounded-md",
                    required: true,
                  }),
                ],
              }),
              _jsxs("div", {
                children: [
                  _jsx("label", {
                    className: "block text-sm font-medium text-gray-700 mb-1",
                    children: "Name",
                  }),
                  _jsx("input", {
                    type: "text",
                    value: newUser.name,
                    onChange: (e) =>
                      setNewUserExperience({
                        ...newUser,
                        name: e.target.value,
                      }),
                    className:
                      "w-full px-3 py-2 border border-gray-300 rounded-md",
                    required: true,
                  }),
                ],
              }),
              _jsx("button", {
                type: "submit",
                className:
                  "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700",
                children: "Create User",
              }),
            ],
          }),
        ],
      }),
      _jsxs("div", {
        className: "bg-white rounded-lg shadow p-6",
        children: [
          _jsxs("h2", {
            className: "text-xl font-semibold mb-4",
            children: ["Users (", users.length, ")"],
          }),
          _jsx("div", {
            className: "space-y-2",
            children: users.map((user) =>
              _jsxs(
                "div",
                {
                  className:
                    "flex items-center space-x-3 p-3 border border-gray-200 rounded-md",
                  children: [
                    _jsx("div", {
                      className:
                        "w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold",
                      children: user.name.charAt(0).toUpperCase(),
                    }),
                    _jsxs("div", {
                      className: "flex-1",
                      children: [
                        _jsx("div", {
                          className: "font-medium",
                          children: user.name,
                        }),
                        _jsx("div", {
                          className: "text-sm text-gray-500",
                          children: user.email,
                        }),
                      ],
                    }),
                    _jsx("div", {
                      className: "text-xs text-gray-400",
                      children: new Date(user.createdAt).toLocaleDateString(),
                    }),
                  ],
                },
                user.id,
              ),
            ),
          }),
        ],
      }),
    ],
  });
}
