
import React from 'react';
import { CarStatus } from '../types';

interface StatusBadgeProps {
  status: CarStatus;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const colorClasses = {
    [CarStatus.WAITING_FOR_TRAILER]: 'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800',
    [CarStatus.ON_TRAILER]: 'bg-orange-50 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
    [CarStatus.UNLOADED]: 'bg-cyan-50 text-cyan-700 border border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300 dark:border-cyan-800',
    [CarStatus.IN_STOCK]: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800',
    [CarStatus.RESERVED]: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800',
    [CarStatus.SOLD]: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  };

  return (
    <span className={`px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-md ${colorClasses[status]}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
