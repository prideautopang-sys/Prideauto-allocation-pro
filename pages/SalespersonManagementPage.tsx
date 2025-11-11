import React, { useState } from 'react';
import { Salesperson } from '../types';
import { PlusIcon } from '../components/icons';
import SalespersonTable from '../components/SalespersonTable';
import SalespersonFormModal from '../components/SalespersonFormModal';

interface SalespersonManagementPageProps {
  token: string | null;
  salespersons: Salesperson[];
  onDataChange: () => void;
}

const SalespersonManagementPage: React.FC<SalespersonManagementPageProps> = ({ token, salespersons, onDataChange }) => {
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<Salesperson | null>(null);

  const handleOpenAddModal = () => {
    setEditingSalesperson(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (sp: Salesperson) => {
    setEditingSalesperson(sp);
    setIsFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setEditingSalesperson(null);
  };

  const handleSave = async (sp: Salesperson) => {
    const isEditing = !!editingSalesperson;
    const url = isEditing ? `/api/salespersons/${sp.id}` : '/api/salespersons';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(sp)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to save salesperson');
        }
        onDataChange(); // Trigger data refetch in parent
        handleCloseModal();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
          Salesperson Management ({salespersons.length})
        </h2>
        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          <PlusIcon /> <span className="ml-2 hidden sm:block">Add New Salesperson</span>
        </button>
      </div>
      <SalespersonTable 
        salespersons={salespersons} 
        onEdit={handleOpenEditModal} 
      />
      <SalespersonFormModal 
        isOpen={isFormModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        salespersonToEdit={editingSalesperson}
      />
    </>
  );
};

export default SalespersonManagementPage;