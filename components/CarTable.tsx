
import React from 'react';
import { Car, CarStatus } from '../types';
import { EditIcon, ArrowUpIcon, ArrowDownIcon, TrashIcon } from './icons';
import StatusBadge from './StatusBadge';

type SortableKeys = keyof Car;
type UserRole = 'executive' | 'admin' | 'user';

interface CarTableProps {
  cars: Car[];
  onEdit: (car: Car) => void;
  onDelete: (car: Car) => void;
  onSort: (key: SortableKeys) => void;
  sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' };
  view: 'allocation' | 'stock';
  selectedCarIds?: string[];
  onSelectCar?: (carId: string) => void;
  onSelectAll?: () => void;
  userRole: UserRole;
}

const formatDate = (dateString?: string | null): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

const SortableHeader: React.FC<{
    columnKey: SortableKeys,
    title: string,
    onSort: (key: SortableKeys) => void,
    sortConfig: { key: SortableKeys; direction: 'ascending' | 'descending' },
    className?: string,
}> = ({ columnKey, title, onSort, sortConfig, className }) => {
    const isSorted = sortConfig.key === columnKey;
    const isAscending = sortConfig.direction === 'ascending';

    return (
        <th scope="col" className={className}>
            <button onClick={() => onSort(columnKey)} className={`flex items-center space-x-1 group ${isSorted ? 'text-gray-900 dark:text-white' : ''}`}>
                <span className={`group-hover:text-gray-800 dark:group-hover:text-gray-100 ${isSorted ? 'font-semibold' : ''}`}>{title}</span>
                {isSorted ? (
                    isAscending ? <ArrowUpIcon /> : <ArrowDownIcon />
                ) : (
                    <ArrowUpIcon className="text-transparent group-hover:text-gray-400"/>
                )}
            </button>
        </th>
    );
};


const CarTable: React.FC<CarTableProps> = ({ cars, onEdit, onDelete, onSort, sortConfig, view, selectedCarIds = [], onSelectCar, onSelectAll, userRole }) => {
  const thClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider";
  const tdClasses = "px-4 py-2 text-sm text-gray-500 dark:text-gray-400 align-top";
  
  const baseHeaders: { key: SortableKeys, title: string }[] = [
      { key: 'allocationDate', title: 'No. / Date'},
      { key: 'dealerName', title: 'Dealer Info'},
      { key: 'model', title: 'Model / Color'},
      { key: 'vin', title: 'Vehicle Identifiers'},
  ];
  
  const stockHeaders: { key: SortableKeys, title: string }[] = [
      { key: 'stockLocation', title: 'Stock Info'}
  ];

  const commonHeaders: { key: SortableKeys, title: string }[] = [
      { key: 'carType', title: 'Type Info'},
      { key: 'price', title: 'Price'},
      { key: 'status', title: 'Status'},
  ];
  
  const headers = view === 'stock' ? [...baseHeaders, ...stockHeaders, ...commonHeaders] : [...baseHeaders, ...commonHeaders];

  const IdentifierRow: React.FC<{label: string; value?: string | null}> = ({ label, value }) => {
    if (!value || value === 'N/A') return null;
    return (
        <div className="flex items-start">
            <span className="font-semibold w-16 shrink-0 text-gray-600 dark:text-gray-400">{label}:</span>
            <span className="break-all">{value}</span>
        </div>
    );
  };

  const canEdit = userRole !== 'user';
  const canDeleteAllocation = userRole === 'executive';


  return (
    <div className="flex flex-col">
      <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
          <div className="shadow-lg overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {view === 'allocation' && onSelectAll && (
                    <th scope="col" className="px-4 py-3">
                        <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                            checked={cars.length > 0 && cars.every(c => selectedCarIds.includes(c.id))}
                            onChange={onSelectAll}
                            aria-label="Select all cars on this page"
                        />
                    </th>
                  )}
                  {headers.map(header => (
                      <SortableHeader
                        key={header.key}
                        columnKey={header.key}
                        title={header.title}
                        onSort={onSort}
                        sortConfig={sortConfig}
                        className={thClasses}
                      />
                  ))}
                  {canEdit && 
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  }
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {cars.map((car, index) => {
                  const isSelected = selectedCarIds.includes(car.id);
                  const isSold = car.status === CarStatus.SOLD;
                  const showDelete = view === 'allocation' ? canDeleteAllocation : canEdit;
                  
                  return (
                  <tr key={car.id} className={`${isSelected ? 'bg-sky-50 dark:bg-sky-900/50' : 'odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800'} hover:bg-sky-100 dark:hover:bg-sky-800/50`}>
                    {view === 'allocation' && onSelectCar && (
                        <td className="px-4 py-2 align-middle">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                checked={isSelected}
                                onChange={() => onSelectCar(car.id)}
                                aria-labelledby={`car-model-${car.id}`}
                            />
                        </td>
                    )}
                    {/* No. / Date */}
                    <td className={`${tdClasses} whitespace-nowrap`}>
                      <div className="font-semibold text-gray-700 dark:text-gray-300">{index + 1}</div>
                      <div className="text-xs">{formatDate(car.allocationDate)}</div>
                    </td>
                    <td className={`${tdClasses} max-w-xs`}>
                        <div className="font-medium text-gray-900 dark:text-white break-words">{car.dealerName}</div>
                        <div className="text-xs">{car.dealerCode}</div>
                    </td>
                     <td className={`${tdClasses} max-w-xs`}>
                        <div id={`car-model-${car.id}`} className="font-medium text-gray-900 dark:text-white break-words">{car.model}</div>
                        <div className="text-xs">{car.color}</div>
                    </td>
                    <td className={`${tdClasses} text-xs font-mono`}>
                      <IdentifierRow label="VIN" value={car.vin} />
                      <IdentifierRow label="Engine" value={car.engineNo} />
                      <IdentifierRow label="F.Motor" value={car.frontMotorNo} />
                      <IdentifierRow label="R.Motor" value={car.rearMotorNo} />
                      <IdentifierRow label="Battery" value={car.batteryNo} />
                    </td>
                    {view === 'stock' && (
                       <td className={`${tdClasses} max-w-xs`}>
                          <div className="font-medium text-gray-900 dark:text-white">{car.stockLocation}</div>
                          {car.stockInDate && <div className="text-xs">
                            {formatDate(car.stockInDate)}
                          </div>}
                      </td>
                    )}
                    <td className={`${tdClasses} max-w-xs`}>
                      <div className="font-medium text-gray-900 dark:text-white break-words">{car.carType}</div>
                      <div className="text-xs">{car.poType}</div>
                    </td>
                    <td className={`${tdClasses} font-semibold text-gray-900 dark:text-white whitespace-nowrap`}>
                      {car.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className={`${tdClasses} whitespace-nowrap`}>
                      <StatusBadge status={car.status} />
                    </td>
                    
                    {canEdit && 
                      <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium align-top">
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
          </div>
           {cars.length === 0 && (
                <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-b-lg">
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
