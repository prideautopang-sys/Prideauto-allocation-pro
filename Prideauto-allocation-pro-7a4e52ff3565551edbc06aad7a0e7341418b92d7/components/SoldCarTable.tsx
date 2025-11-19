
import React from 'react';
import { Match, Car, MatchStatus } from '../types';
import { EditIcon, EyeIcon } from './icons';

type UserRole = 'executive' | 'admin' | 'user';

interface SoldCarData {
  car: Car;
  match?: Match;
}

interface SoldCarTableProps {
  soldData: SoldCarData[];
  onEditMatch: (match: Match) => void;
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

const SoldCarTable: React.FC<SoldCarTableProps> = ({ soldData, onEditMatch, userRole }) => {
  const thClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider";
  const tdClasses = "px-4 py-2 text-sm text-gray-500 dark:text-gray-400 align-top";

  return (
    <div className="shadow-lg overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className={thClasses}>Allocation Date</th>
            <th scope="col" className={thClasses}>Vehicle Info</th>
            <th scope="col" className={thClasses}>Stock Info</th>
            <th scope="col" className={thClasses}>ลูกค้า / เซลล์</th>
            <th scope="col" className={thClasses}>Sale Details</th>
            <th scope="col" className={thClasses}>Price</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {soldData.map(({ car, match }) => {
            if (!match) return null; // Should not happen with the filter in App.tsx
            return (
              <tr key={car.id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 hover:bg-sky-100 dark:hover:bg-sky-800/50">
                <td className={`${tdClasses} whitespace-nowrap`}>
                  {formatDate(car.allocationDate)}
                </td>
                <td className={`${tdClasses} max-w-xs`}>
                  <div className="font-medium text-gray-900 dark:text-white">{car.model}</div>
                  <div className="text-xs">{car.color}</div>
                  <div className="text-xs font-mono mt-1 break-all">{car.vin}</div>
                </td>
                 <td className={`${tdClasses} max-w-xs`}>
                    {car.stockInDate ? (
                        <>
                            <div className="font-medium text-gray-900 dark:text-white">{car.stockLocation}</div>
                            <div className="text-xs">
                                {formatDate(car.stockInDate)}
                            </div>
                        </>
                    ) : (
                        <span className="text-gray-400 italic">N/A</span>
                    )}
                </td>
                <td className={`${tdClasses} max-w-xs`}>
                  <div className="font-medium text-gray-900 dark:text-white">ลูกค้า : {match.customerName}</div>
                  <div className="text-xs">เซลล์ : {match.salesperson}</div>
                </td>
                <td className={tdClasses}>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {match.saleDate
                            ? `ตัดขาย: ${formatDate(match.saleDate)}`
                            : <span className="text-gray-400">ยังไม่ระบุวันตัดขาย</span>
                        }
                    </div>
                    <div className="mt-1">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                            {match.status}
                        </span>
                    </div>
                </td>
                <td className={`${tdClasses} font-semibold text-gray-900 dark:text-white whitespace-nowrap`}>
                  {car.price.toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium align-top">
                    <div className="flex items-center justify-end">
                      {userRole !== 'user' ? (
                        <button onClick={() => onEditMatch(match)} title="Edit Sale Info" className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
                            <EditIcon />
                        </button>
                      ) : (
                        <button onClick={() => onEditMatch(match)} title="View Details" className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
                            <EyeIcon />
                        </button>
                      )}
                    </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {soldData.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-b-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">ไม่พบข้อมูลรถที่ขายแล้ว</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">เมื่อรถถูกขายแล้วจะแสดงที่นี่</p>
        </div>
      )}
    </div>
  );
};

export default SoldCarTable;