import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserIcon, LockClosedIcon } from '../components/icons';

interface LoginPageProps {
  logo: string | null;
}

const LoginPage: React.FC<LoginPageProps> = ({ logo }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md mx-auto">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg w-full">
          <div className="flex justify-center mb-6">
             {logo ? (
                <img src={logo} alt="Company Logo" className="max-h-20 object-contain" />
              ) : (
                <div className="p-1 bg-white rounded-md shadow-md">
                  <div className="w-40 h-16 border-2 border-gray-300 dark:border-gray-600 flex flex-row items-center justify-center bg-white dark:bg-gray-800 space-x-2">
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xl">PRIDE</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200 text-xl">AUTO</span>
                  </div>
                </div>
              )}
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Car Allocation Pro</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to manage your vehicle allocations</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username-address" className="text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-gray-400 sm:text-sm">
                        <UserIcon />
                     </span>
                 </div>
                 <input
                    id="username-address"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="your.username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
              </div>
            </div>

            <div>
              <label htmlFor="password-input" className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                 <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                     <span className="text-gray-400 sm:text-sm">
                        <LockClosedIcon />
                     </span>
                 </div>
                 <input
                    id="password-input"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="appearance-none block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
              </div>
            </div>
            
            {error && <p className="text-xs text-center text-red-500">{error}</p>}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-2.5 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <footer className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
        <p>© 2024 PRIDE AUTO. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LoginPage;