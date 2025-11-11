import React, { useState, useEffect, useCallback } from 'react';
import { AppUser } from '../types';
import { PlusIcon, ArrowLeftIcon } from '../components/icons';
import UserTable from '../components/UserTable';
import UserFormModal from '../components/UserFormModal';
import ConfirmUserDeleteModal from '../components/ConfirmUserDeleteModal';

interface UserManagementPageProps {
  token: string | null;
  currentUser: { id: string; role: string };
  onBack: () => void;
}

const UserManagementPage: React.FC<UserManagementPageProps> = ({ token, currentUser, onBack }) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [userToDelete, setUserToDelete] = useState<AppUser | null>(null);

  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenAddUserModal = () => {
    setEditingUser(null);
    setIsFormModalOpen(true);
  };

  const handleOpenEditUserModal = (user: AppUser) => {
    setEditingUser(user);
    setIsFormModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setEditingUser(null);
    setUserToDelete(null);
  };

  const handleSaveUser = async (user: AppUser) => {
    const isEditing = !!editingUser;
    const url = isEditing ? `/api/users/${user.id}` : '/api/users';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(user)
        });

        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to save user');
        }
        await fetchUsers();
        handleCloseModals();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteRequest = (user: AppUser) => {
    if (user.id === currentUser.id) {
        alert("You cannot delete your own account.");
        return;
    }
    setUserToDelete(user);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    try {
        const response = await fetch(`/api/users/${userToDelete.id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!response.ok) {
             throw new Error('Failed to delete user');
        }
        await fetchUsers();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    } finally {
        setUserToDelete(null);
    }
  };

  if (isLoading) return <div className="text-center">Loading users...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
         <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            <ArrowLeftIcon />
            <span className="ml-2">Back to Settings</span>
        </button>
        <button
          onClick={handleOpenAddUserModal}
          className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
        >
          <PlusIcon /> <span className="ml-2 hidden sm:block">Add New User</span>
        </button>
      </div>
      <UserTable 
        users={users} 
        onEdit={handleOpenEditUserModal} 
        onDelete={handleDeleteRequest} 
      />
      <UserFormModal 
        isOpen={isFormModalOpen}
        onClose={handleCloseModals}
        onSave={handleSaveUser}
        userToEdit={editingUser}
      />
      <ConfirmUserDeleteModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleConfirmDelete}
        user={userToDelete}
      />
    </>
  );
};

export default UserManagementPage;