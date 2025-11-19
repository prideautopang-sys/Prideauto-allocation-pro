import React, { useRef, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface LogoUploaderProps {
  logo: string | null;
  userRole: 'executive' | 'admin' | 'user';
  onLogoUpdate: () => void;
}

const LogoUploader: React.FC<LogoUploaderProps> = ({ logo, userRole, onLogoUpdate }) => {
  const { token } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isExecutive = userRole === 'executive';

  const handleLogoClick = () => {
    if (isExecutive && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      alert("File size should not exceed 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsUploading(true);
      setError(null);
      try {
        const response = await fetch('/api/assets/logo', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ logo: base64String })
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.message || 'Failed to upload logo.');
        }
        onLogoUpdate();
      } catch (err: any) {
        setError(err.message);
        alert(`Error: ${err.message}`);
      } finally {
        setIsUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const UploaderIcon = () => (
      <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
      </div>
  );

  return (
    <div 
      className={`relative group flex items-center space-x-3 ${isExecutive ? 'cursor-pointer' : ''}`}
      onClick={handleLogoClick}
      title={isExecutive ? 'Click to upload new logo' : ''}
    >
      {logo ? (
        <img src={logo} alt="Company Logo" className="h-10 object-contain" />
      ) : (
        <div className="flex flex-row items-baseline justify-center space-x-1.5">
          <span className="font-bold text-gray-800 dark:text-gray-200 text-2xl">PRIDE</span>
          <span className="font-bold text-gray-800 dark:text-gray-200 text-2xl">AUTO</span>
        </div>
      )}
      {isExecutive && !isUploading && <UploaderIcon />}
      {isUploading && (
          <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-md">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
      )}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        className="hidden"
        disabled={isUploading}
      />
    </div>
  );
};

export default LogoUploader;
