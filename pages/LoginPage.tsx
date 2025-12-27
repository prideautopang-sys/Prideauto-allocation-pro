
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
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-200 dark:from-slate-900 dark:to-slate-800 px-4 overflow-hidden font-sans">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-sky-200/30 dark:bg-sky-900/20 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/30 dark:bg-indigo-900/20 blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md mx-auto z-10">
        <div className="bg-white/70 dark:bg-gray-800/60 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl w-full border border-white/50 dark:border-gray-700/50">
          <div className="flex justify-center mb-8">
             {logo ? (
                <img src={logo} alt="Company Logo" className="max-h-24 object-contain transition-transform hover:scale-105 duration-300" />
              ) : (
                <div className="p-2">
                  <div className="w-48 h-20 flex flex-row items-center justify-center space-x-2 rounded-xl">
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-100 dark:to-gray-300 text-2xl tracking-tight">PRIDE</span>
                    <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-500 text-2xl tracking-tight">AUTO</span>
                  </div>
                </div>
              )}
          </div>

          <div className="text-center mb-10">
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Car Allocation Pro</h1>
            <p className="text-gray-500 dark:text-gray-300 mt-2 text-sm font-medium">Manage your vehicle allocations</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-1">
              <label htmlFor="username-address" className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Username</label>
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-sky-600">
                     <span className="text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors">
                        <UserIcon />
                     </span>
                 </div>
                 <input
                    id="username-address"
                    name="username"
                    type="text"
                    autoComplete="username"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200 sm:text-sm shadow-sm"
                    placeholder="your.username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="password-input" className="text-sm font-semibold text-gray-700 dark:text-gray-300 ml-1">Password</label>
              <div className="relative group">
                 <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none transition-colors group-focus-within:text-sky-600">
                     <span className="text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400 transition-colors">
                        <LockClosedIcon />
                     </span>
                 </div>
                 <input
                    id="password-input"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    className="block w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-xl text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200 sm:text-sm shadow-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
              </div>
            </div>
            
            {error && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-800/50 animate-pulse">
                    <p className="text-xs text-center text-red-600 dark:text-red-300 font-medium">{error}</p>
                </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 shadow-lg shadow-red-500/30 hover:shadow-red-500/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:bg-gray-400 disabled:from-gray-400 disabled:to-gray-500 disabled:shadow-none transform transition-all duration-200 hover:-translate-y-0.5"
              >
                {isLoading ? (
                    <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Logging in...
                    </span>
                ) : 'Login'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <footer className="relative z-10 text-center mt-12 text-sm text-gray-500 dark:text-gray-400">
        <p>© 2025 PRIDE AUTO Car Allocation Pro. All rights reserved.</p>
        <p className="mt-1 font-medium opacity-70">Version 1.1.4</p>
      </footer>
    </div>
  );
};

export default LoginPage;
