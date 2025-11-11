
import React from 'react';
import { CarStatus } from '../types';

interface StatusBadgeProps {
  status: CarStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorClasses = {
    [CarStatus.WAITING_FOR_TRAILER]: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    [CarStatus.ON_TRAILER]: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
    [CarStatus.UNLOADED]: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
    [CarStatus.IN_STOCK]: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    [CarStatus.RESERVED]: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    [CarStatus.SOLD]: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  };

  return (
    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses[status]}`}>
      {status}
    </span>
  );
};

export default StatusBadge;