import React, { useState, useEffect } from 'react';
import { Salesperson } from '../types';
import { XIcon } from './icons';

interface SalespersonFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sp: Salesperson) => void;
  salespersonToEdit?: Salesperson | null;
}

const SalespersonFormModal: React.FC<SalespersonFormModalProps> = ({ isOpen, onClose, onSave, salespersonToEdit }) => {
  const getInitialState = (): Salesperson => {
    return salespersonToEdit || {
      id: '', // Will be ignored on create
      name: '',
      status: 'active',
    };
  };

  const [salesperson, setSalesperson] = useState<Salesperson>(getInitialState());

  useEffect(() => {
    setSalesperson(getInitialState());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salespersonToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSalesperson(prev => ({ ...prev, [name]: value } as Salesperson));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!salesperson.name) {
        alert("Salesperson name is required.");
        return;
    }
    onSave(salesperson);
  };

  const isEditing = !!salespersonToEdit;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{isEditing ? 'Edit Salesperson' : 'Add New Salesperson'}</h2>
              <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XIcon />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                <input type="text" name="name" id="name" value={salesperson.name} onChange={handleChange} required
                       className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
              </div>
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                <select name="status" id="status" value={salesperson.status} onChange={handleChange}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
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

export default SalespersonFormModal;