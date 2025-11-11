import React, { useState } from 'react';
import { ArrowLeftIcon } from '../components/icons';

interface LogoManagementPageProps {
  token: string | null;
  currentLogo: string | null;
  onLogoUpdate: () => void;
  onBack: () => void;
}

const LogoManagementPage: React.FC<LogoManagementPageProps> = ({ token, currentLogo, onLogoUpdate, onBack }) => {
  const [newLogo, setNewLogo] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(currentLogo);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
          setError("File size should not exceed 2MB.");
          return;
      }
      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setNewLogo(base64String);
        setPreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLogo = async () => {
    if (!newLogo || !token) return;
    setIsUploading(true);
    setError(null);
    try {
      const response = await fetch('/api/assets/logo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ logo: newLogo })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to upload logo.');
      }
      
      alert('Logo updated successfully!');
      onLogoUpdate(); // Refetch logo in parent component
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <div className="mb-6 flex items-center">
        <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <ArrowLeftIcon />
          <span className="ml-2">Back to Settings</span>
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md max-w-2xl mx-auto p-6 sm:p-8">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Manage Application Logo</h3>

        <div className="space-y-6">
          <div>
            <h4 className="text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Logo</h4>
            <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex justify-center items-center h-32 bg-gray-50 dark:bg-gray-700/50">
              {preview ? (
                <img src={preview} alt="Current Logo" className="max-h-full max-w-full object-contain" />
              ) : (
                <span className="text-gray-500 dark:text-gray-400">No logo uploaded</span>
              )}
            </div>
          </div>
          
          <div>
            <label htmlFor="logo-upload" className="block text-md font-semibold text-gray-700 dark:text-gray-300 mb-2">Upload New Logo</label>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Recommended format: PNG with transparent background. Max size: 2MB.</p>
            <input 
              id="logo-upload"
              type="file" 
              accept="image/png, image/jpeg, image/svg+xml, image/webp"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 dark:text-gray-400
                         file:mr-4 file:py-2 file:px-4
                         file:rounded-full file:border-0
                         file:text-sm file:font-semibold
                         file:bg-sky-50 file:text-sky-700
                         dark:file:bg-sky-900/50 dark:file:text-sky-300
                         hover:file:bg-sky-100 dark:hover:file:bg-sky-800"
            />
          </div>

          {error && <p className="text-sm text-red-500 text-center">{error}</p>}

          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleSaveLogo}
              disabled={!newLogo || isUploading}
              className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isUploading ? 'Saving...' : 'Save New Logo'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default LogoManagementPage;