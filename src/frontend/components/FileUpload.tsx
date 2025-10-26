import React, { useState } from "react";
import { getBackendUrl } from "alchemy/cloudflare/bun-spa";

interface FileUploadProps {
  isDarkMode: boolean;
}

export default function FileUpload({ isDarkMode }: FileUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<any>(null);

  const apiUrl = getBackendUrl();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
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

      const data = (await response.json()) as { file: string };
      setUploadedFile(data.file);
      setFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className={`${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gradient-to-r from-green-50 to-emerald-50'} rounded-xl border p-6`}>
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-green-500 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <div>
            <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Upload File to R2</h2>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Store files in Cloudflare R2 object storage</p>
          </div>
        </div>
        
        <form onSubmit={handleUpload} className="space-y-4">
          <div className={`border-2 border-dashed ${isDarkMode ? 'border-gray-500 bg-gray-600' : 'border-gray-300 bg-gray-50'} rounded-lg p-6 text-center`}>
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <div className="mt-4">
              <label htmlFor="file-upload" className={`cursor-pointer ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <span className="mt-2 block text-sm font-medium">
                  Click to upload or drag and drop
                </span>
                <span className={`mt-1 block text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  PNG, JPG, PDF up to 10MB
                </span>
              </label>
              <input
                id="file-upload"
                type="file"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
          </div>
          
          {file && (
            <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-blue-50'}`}>
              <div className="flex items-center space-x-3">
                <svg className="h-8 w-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="flex-1">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{file.name}</p>
                  <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{(file.size / 1024).toFixed(2)} KB</p>
                </div>
              </div>
            </div>
          )}
          
          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full px-6 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {uploading ? (
              <span className="flex items-center justify-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Uploading...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span>Upload to R2</span>
              </span>
            )}
          </button>
        </form>
      </div>

      {uploadedFile && (
        <div className={`${isDarkMode ? 'bg-gray-700 border-green-600' : 'bg-green-50 border-green-200'} rounded-xl border p-6`}>
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-green-500 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-green-800'}`}>Upload Successful!</h3>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-green-600'}`}>File stored in R2 object storage</p>
            </div>
          </div>
          
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 text-sm ${isDarkMode ? 'text-gray-300' : 'text-green-700'}`}>
            <div>
              <span className="font-medium">File ID:</span>
              <div className={isDarkMode ? 'text-gray-400' : 'text-green-600'}>{uploadedFile.id}</div>
            </div>
            <div>
              <span className="font-medium">Key:</span>
              <div className={isDarkMode ? 'text-gray-400' : 'text-green-600'}>{uploadedFile.key}</div>
            </div>
            <div>
              <span className="font-medium">Size:</span>
              <div className={isDarkMode ? 'text-gray-400' : 'text-green-600'}>{(uploadedFile.size / 1024).toFixed(2)} KB</div>
            </div>
          </div>
          
          <div className="mt-4">
            <a
              href={`${apiUrl}/api/files/${uploadedFile.id}`}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <span>View File</span>
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
