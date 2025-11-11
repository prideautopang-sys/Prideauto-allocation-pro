import React from 'react';
import { UserGroupIcon, UserIcon, PhotographIcon } from '../components/icons';

interface SettingsPageProps {
  onNavigate: (view: 'users' | 'salespersons' | 'logo') => void;
}

const SettingsPage: React.FC<SettingsPageProps> = ({ onNavigate }) => {
  const settingsItems = [
    {
      title: 'Manage Salespersons',
      description: 'Add, edit, and manage salesperson statuses.',
      icon: <UserGroupIcon />,
      view: 'salespersons' as const,
    },
    {
      title: 'Manage Users',
      description: 'Manage user accounts and their roles.',
      icon: <UserIcon />,
      view: 'users' as const,
    },
    {
      title: 'Manage Logo',
      description: 'Upload and update the application logo.',
      icon: <PhotographIcon />,
      view: 'logo' as const,
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Settings</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settingsItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onNavigate(item.view)}
            className="group text-left p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all duration-200 flex items-start space-x-4"
          >
            <div className="flex-shrink-0 text-sky-500 bg-sky-100 dark:bg-sky-900/50 p-3 rounded-lg">
                {item.icon}
            </div>
            <div>
                <h3 className="text-lg font-semibold text-gray-800 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400">{item.title}</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;