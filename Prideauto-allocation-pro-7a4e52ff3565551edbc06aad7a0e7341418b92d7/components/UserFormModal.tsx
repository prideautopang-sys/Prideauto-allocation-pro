import React, { useState, useEffect } from 'react';
import { AppUser, UserRole } from '../types';
import { XIcon } from './icons';

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: AppUser) => void;
  userToEdit?: AppUser | null;
}

const UserFormModal: React.FC<UserFormModalProps> = ({ isOpen, onClose, onSave, userToEdit }) => {
  const getInitialState = (): AppUser => {
    return userToEdit || {
      id: '', // Will be ignored on create
      username: '',
      password: '',
      role: 'user',
    };
  };

  const [user, setUser] = useState<AppUser>(getInitialState());

  useEffect(() => {
    setUser(getInitialState());
  }, [userToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUser(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.username || (!userToEdit && !user.password)) {
        alert("Username and password are required for new users.");
        return;
    }
    onSave(user);
  };

  const isEditing = !!userToEdit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{isEditing ? 'Edit User' : 'Add New User'}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XIcon />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input type="text" name="username" id="username" value={user.username} onChange={handleChange} required disabled={isEditing}
                       className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-200 dark:disabled:bg-gray-600" />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <input type="password" name="password" id="password" value={user.password || ''} onChange={handleChange} required={!isEditing}
                       placeholder={isEditing ? 'Leave blank to keep unchanged' : ''}
                       className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select name="role" id="role" value={user.role} onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  {(['executive', 'admin', 'user'] as UserRole[]).map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm">
              Save
            </button>
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserFormModal;