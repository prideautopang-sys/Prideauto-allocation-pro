import React from 'react';
import { Car, CarStatus } from '../types';
import { EditIcon, TrashIcon } from './icons';
import StatusBadge from './StatusBadge';

type UserRole = 'executive' | 'admin' | 'user';

interface CarTableProps {
  cars: Car[];
  onEdit: (car: Car) => void;
  onDelete: (car: Car) => void;
  view: 'allocation' | 'stock';
  userRole: UserRole;
}

const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    // e.g., "30 Jan 2025"
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

const CarTable: React.FC<CarTableProps> = ({ cars, onEdit, onDelete, view, userRole }) => {
  const canEdit = userRole !== 'user';
  const canDeleteAllocation = userRole === 'executive';

  const IdentifierRow: React.FC<{label: string; value?: string | null}> = ({ label, value }) => {
    if (!value || value === 'N/A' || value.trim() === '') return null;
    return (
        <div className="flex items-start text-xs">
            <span className="font-semibold w-16 shrink-0 text-gray-500 dark:text-gray-400">{label}:</span>
            <span className="font-mono text-gray-600 dark:text-gray-300 break-all">{value}</span>
        </div>
    );
  };

  return (
    <div className="flow-root">
       <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table className="min-w-full border-separate" style={{ borderSpacing: '0 0.75rem' }}>
            <thead className="hidden lg:table-header-group">
              <tr>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Date</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Dealer / Model</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Vehicle Identifiers</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Type</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Price</th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white">Status</th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-800 lg:divide-none">
              {cars.map((car, index) => {
                const isSold = car.status === CarStatus.SOLD;
                const showDelete = view === 'allocation' ? canDeleteAllocation : canEdit;
                return (
                <tr key={car.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg">
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6 align-top">
                    <div className="flex items-center">
                      <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-lg">{index + 1}</div>
                      <div className="ml-4">
                        <div className="font-medium text-gray-900 dark:text-white">{formatDate(car.allocationDate)}</div>
                        {car.stockInDate && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                Stock: {formatDate(car.stockInDate)}
                            </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 align-top">
                     <div className="font-bold text-gray-800 dark:text-white">{car.dealerName}</div>
                     <div className="text-xs text-gray-400 dark:text-gray-500">{car.dealerCode} | Mahasarakham ({car.dealerCode})</div>
                     <div className="font-semibold text-gray-700 dark:text-gray-300 mt-1">{car.model}</div>
                     <div className="text-xs">{car.color}</div>
                  </td>
                  <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 align-top">
                    <div className="space-y-1">
                        <IdentifierRow label="VIN" value={car.vin} />
                        <IdentifierRow label="Engine" value={car.engineNo} />
                        <IdentifierRow label="F.Motor" value={car.frontMotorNo} />
                        <IdentifierRow label="Battery" value={car.batteryNo} />
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 align-top">
                    <div className="font-medium text-gray-900 dark:text-white">{car.carType || 'Normal'}</div>
                    <div className="text-xs">{car.poType || 'Allocation'}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400 font-bold align-top">
                    {car.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                   <td className="px-3 py-4 text-sm text-gray-500 dark:text-gray-400 align-top">
                     <div className="flex flex-col items-start space-y-1">
                        <StatusBadge status={car.status} />
                        {car.stockLocation && (
                            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                                สาขา: {car.stockLocation}
                            </div>
                        )}
                      </div>
                  </td>
                  {canEdit && 
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6 align-top">
                      {!isSold && (
                          <div className="flex items-center justify-end space-x-1">
                              <button onClick={() => onEdit(car)} title="Edit Car" className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
                                  <EditIcon />
                              </button>
                              {showDelete && 
                                <button onClick={() => onDelete(car)} title={view === 'stock' ? 'Remove from Stock' : 'Delete Car'} className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-800/50">
                                    <TrashIcon />
                                </button>
                              }
                          </div>
                        )}
                    </td>
                  }
                </tr>
              )})}
            </tbody>
          </table>
          {cars.length === 0 && (
            <div className="text-center py-10 bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">ไม่พบข้อมูลรถยนต์</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ลองปรับเปลี่ยนการค้นหาหรือล้างตัวกรอง</p>
            </div>
          )}
        </div>
       </div>
    </div>
  );
};

export default CarTable;