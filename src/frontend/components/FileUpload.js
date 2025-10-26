import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";
export default function FileUpload() {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState(null);
  const apiUrl = getBackendUrl();
  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("userId", "demo-user");
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      setUploadedFile(data.file);
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };
  return _jsxs("div", {
    className: "space-y-6",
    children: [
      _jsxs("div", {
        className: "bg-white rounded-lg shadow p-6",
        children: [
          _jsx("h2", {
            className: "text-xl font-semibold mb-4",
            children: "Upload File to R2",
          }),
          _jsxs("form", {
            onSubmit: handleUpload,
            className: "space-y-4",
            children: [
              _jsxs("div", {
                children: [
                  _jsx("label", {
                    className: "block text-sm font-medium text-gray-700 mb-1",
                    children: "Select File",
                  }),
                  _jsx("input", {
                    type: "file",
                    onChange: handleFileChange,
                    className:
                      "w-full px-3 py-2 border border-gray-300 rounded-md",
                  }),
                ],
              }),
              file &&
                _jsxs("div", {
                  className: "text-sm text-gray-600",
                  children: [
                    "Selected: ",
                    file.name,
                    " (",
                    (file.size / 1024).toFixed(2),
                    " KB)",
                  ],
                }),
              _jsx("button", {
                type: "submit",
                disabled: !file || uploading,
                className:
                  "px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50",
                children: uploading ? "Uploading..." : "Upload to R2",
              }),
            ],
          }),
        ],
      }),
      uploadedFile &&
        _jsxs("div", {
          className: "bg-green-50 border border-green-200 rounded-lg p-4",
          children: [
            _jsx("h3", {
              className: "font-semibold text-green-800 mb-2",
              children: "Upload Successful!",
            }),
            _jsxs("div", {
              className: "text-sm text-green-700 space-y-1",
              children: [
                _jsxs("div", { children: ["File ID: ", uploadedFile.id] }),
                _jsxs("div", { children: ["Key: ", uploadedFile.key] }),
                _jsxs("div", {
                  children: [
                    "Size: ",
                    (uploadedFile.size / 1024).toFixed(2),
                    " KB",
                  ],
                }),
                _jsx("div", {
                  children: _jsx("a", {
                    href: `${apiUrl}/api/files/${uploadedFile.id}`,
                    className: "text-blue-600 hover:underline",
                    target: "_blank",
                    rel: "noopener noreferrer",
                    children: "View File \u2192",
                  }),
                }),
              ],
            }),
          ],
        }),
    ],
  });
}
