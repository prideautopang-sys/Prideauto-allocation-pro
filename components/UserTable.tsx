import React from 'react';
import { AppUser } from '../types';
import { EditIcon, TrashIcon } from './icons';

interface UserTableProps {
  users: AppUser[];
  onEdit: (user: AppUser) => void;
  onDelete: (user: AppUser) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
  const thClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider";
  const tdClasses = "px-4 py-2 text-sm text-gray-500 dark:text-gray-400 align-top";

  return (
    <div className="shadow-lg overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className={thClasses}>Username</th>
            <th scope="col" className={thClasses}>Role</th>
            <th scope="col" className={thClasses}>Created At</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {users.map((user) => (
            <tr key={user.id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 hover:bg-sky-100 dark:hover:bg-sky-800/50">
              <td className={`${tdClasses} font-medium text-gray-900 dark:text-white`}>{user.username}</td>
              <td className={tdClasses}>
                <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 capitalize">
                    {user.role}
                </span>
              </td>
              <td className={tdClasses}>
                {user.createdAt ? new Date(user.createdAt).toLocaleString('th-TH') : 'N/A'}
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium align-top">
                <div className="flex items-center justify-end space-x-1">
                  <button onClick={() => onEdit(user)} title="Edit User" className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
                    <EditIcon />
                  </button>
                  <button onClick={() => onDelete(user)} title="Delete User" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-800/50">
                    <TrashIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {users.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-b-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Users Found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click "Add New User" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default UserTable;