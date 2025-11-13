
import React from 'react';
import { Match, Car } from '../types';
import { EditIcon, UnlinkIcon, EyeIcon } from './icons';

type UserRole = 'executive' | 'admin' | 'user';

interface MatchingTableProps {
  matches: Match[];
  cars: Car[];
  onEdit: (match: Match) => void;
  onDelete: (match: Match) => void;
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

const MatchingTable: React.FC<MatchingTableProps> = ({ matches, cars, onEdit, onDelete, userRole }) => {
  const carsById: Map<string, Car> = new Map(cars.map(car => [car.id, car]));

  const thClasses = "px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider";
  const tdClasses = "px-4 py-2 text-sm text-gray-500 dark:text-gray-400 align-top";

  return (
    <div className="shadow-lg overflow-hidden border-b border-gray-200 dark:border-gray-700 sm:rounded-lg">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            <th scope="col" className={thClasses}>ลูกค้า / เซลล์</th>
            <th scope="col" className={thClasses}>รถยนต์</th>
            <th scope="col" className={thClasses}>รายละเอียดการขาย</th>
            <th scope="col" className={thClasses}>สถานะ</th>
            <th scope="col" className={thClasses}>หมายเหตุ</th>
            <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {matches.map((match) => {
            const car = carsById.get(match.carId);
            return (
              <tr key={match.id} className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 hover:bg-sky-100 dark:hover:bg-sky-800/50">
                <td className={`${tdClasses} max-w-xs`}>
                  <div className="font-medium text-gray-900 dark:text-white">ลูกค้า : {match.customerName}</div>
                  <div className="text-xs">เซลล์ : {match.salesperson}</div>
                </td>
                <td className={`${tdClasses} max-w-xs`}>
                  {car ? (
                    <>
                      <div className="font-medium text-gray-900 dark:text-white">{car.model}</div>
                      <div className="text-xs font-mono">{car.vin}</div>
                      <div className="text-xs">{car.color}</div>
                    </>
                  ) : (
                    <span className="text-red-500">Car not found</span>
                  )}
                </td>
                <td className={tdClasses}>
                    <div className="font-medium text-gray-900 dark:text-white">
                        {match.saleDate
                            ? `ตัดขาย: ${formatDate(match.saleDate)}`
                            : <span className="text-gray-400">ยังไม่ระบุวันตัดขาย</span>
                        }
                    </div>
                  {match.licensePlate && <div className="text-xs">ทะเบียน: {match.licensePlate}</div>}
                </td>
                 <td className={tdClasses}>
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300">
                        {match.status}
                    </span>
                </td>
                <td className={`${tdClasses} max-w-sm whitespace-pre-wrap`}>{match.notes}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium align-top">
                    <div className="flex items-center justify-end">
                        {userRole !== 'user' ? (
                            <div className="flex items-center justify-end space-x-1">
                                <button onClick={() => onEdit(match)} title="Edit Match" className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
                                <EditIcon />
                                </button>
                                <button onClick={() => onDelete(match)} title="Unlink Match" className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-800/50">
                                <UnlinkIcon />
                                </button>
                            </div>
                        ) : (
                            <button onClick={() => onEdit(match)} title="View Details" className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
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
      {matches.length === 0 && (
        <div className="text-center py-10 bg-white dark:bg-gray-900 rounded-b-lg">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">ไม่พบข้อมูลการจับคู่</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">กดปุ่ม "เพิ่มรายการจับคู่" เพื่อเริ่มต้น</p>
        </div>
      )}
    </div>
  );
};

export default MatchingTable;