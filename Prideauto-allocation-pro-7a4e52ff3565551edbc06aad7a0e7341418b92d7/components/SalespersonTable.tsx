import React from 'react';
import { Salesperson } from '../types';
import { EditIcon } from './icons';

interface SalespersonTableProps {
  salespersons: Salesperson[];
  onEdit: (sp: Salesperson) => void;
}

const SalespersonTable: React.FC<SalespersonTableProps> = ({ salespersons, onEdit }) => {
  const thClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider";
  const tdClasses = "px-4 py-2 text-sm text-gray-500 dark:text-gray-400 align-top";

  return (
    <div className="shadow-lg overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className={thClasses}>Name</th>
            <th scope="col" className={thClasses}>Status</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {salespersons.map((sp) => (
            <tr key={sp.id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 hover:bg-sky-100 dark:hover:bg-sky-800/50">
              <td className={`${tdClasses} font-medium text-gray-900 dark:text-white`}>{sp.name}</td>
              <td className={tdClasses}>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${sp.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'} capitalize`}>
                    {sp.status}
                </span>
              </td>
              <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium align-top">
                <div className="flex items-center justify-end space-x-1">
                  <button onClick={() => onEdit(sp)} title="Edit Salesperson" className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
                    <EditIcon />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {salespersons.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-b-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Salespersons Found</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Click "Add New Salesperson" to get started.</p>
        </div>
      )}
    </div>
  );
};

export default SalespersonTable;