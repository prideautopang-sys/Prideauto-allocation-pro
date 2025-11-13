
import React from 'react';
import { Car, CarStatus, Match } from '../types';
import { EditIcon, TrashIcon, UnlinkIcon, ArchiveOutIcon, ArchiveInIcon, LinkIcon, EyeIcon } from './icons';
import StatusBadge from './StatusBadge';

type UserRole = 'executive' | 'admin' | 'user';

interface CarTableProps {
  cars: Car[];
  matches: Match[];
  view: 'allocation' | 'stock' | 'matching' | 'sold';
  userRole: UserRole;
  onEdit?: (car: Car) => void;
  onAddToStock?: (car: Car) => void;
  onDelete?: (car: Car) => void;
  onEditMatch?: (match: Match) => void;
  onDeleteMatch?: (match: Match) => void;
  onDeleteStockRequest?: (car: Car) => void;
  onMatchCar?: (car: Car) => void;
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

const CarTable: React.FC<CarTableProps> = ({ cars, matches, onEdit, onAddToStock, onDelete, onEditMatch, onDeleteMatch, onDeleteStockRequest, onMatchCar, view, userRole }) => {
  const canEdit = userRole !== 'user';
  
  // FIX: Explicitly type the Map to fix type inference issues with `match` being `unknown`.
  const matchesByCarId = new Map<string, Match>(matches.map(m => [m.carId, m]));

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
          <div className="space-y-4">
              {cars.map((car, index) => {
                const match = matchesByCarId.get(car.id!);
                const isSold = car.status === CarStatus.SOLD;

                const handleEdit = () => {
                    if ((view === 'matching' || view === 'sold') && match && onEditMatch) {
                        onEditMatch(match);
                    } else if (onEdit) { // Simplified edit for allocation/stock
                        onEdit(car);
                    }
                };
                
                const handleDelete = () => {
                     if (view === 'matching' && match && onDeleteMatch) {
                        onDeleteMatch(match);
                    } else if ((view === 'allocation' || view === 'stock') && onDelete) {
                        onDelete(car);
                    }
                };

                const handleUnlink = () => {
                    if (match && onDeleteMatch) {
                        onDeleteMatch(match);
                    }
                };

                const handleUnstock = () => {
                    if (car && onDeleteStockRequest) {
                        onDeleteStockRequest(car);
                    }
                }
                
                const handleMatchCar = () => {
                    if (onMatchCar) {
                        onMatchCar(car);
                    }
                }

                const handleAddToStock = () => {
                    if (onAddToStock) {
                        onAddToStock(car);
                    }
                }

                const editTitle = (view === 'matching' || view === 'sold') ? 'Edit Match Info' : 'Edit Car';
                
                const showCarDeleteButton = (view === 'allocation' && userRole === 'executive') || (view === 'stock' && canEdit);
                const showMatchDeleteButton = view === 'matching' && canEdit;
                
                const canBeUnstocked = !!car.stockInDate && car.status !== CarStatus.RESERVED && car.status !== CarStatus.SOLD;
                const canBeStocked = !car.stockInDate && car.status !== CarStatus.RESERVED && car.status !== CarStatus.SOLD;
                
                // Define the main action button's properties based on the view
                let MainActionIcon = TrashIcon;
                let mainActionTitle = 'Delete Car';
                let mainActionClassName = 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-800/50';

                if (view === 'matching') {
                    MainActionIcon = UnlinkIcon;
                    mainActionTitle = 'Unlink Match';
                    mainActionClassName = 'text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-200 hover:bg-orange-50 dark:hover:bg-orange-800/50';
                } else if (view === 'stock') {
                    MainActionIcon = ArchiveOutIcon;
                    mainActionTitle = 'Remove from Stock';
                    mainActionClassName = 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-800/50';
                }

                return (
                <div key={car.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row gap-4">
                  {/* Left Side: Number and Dates */}
                  <div className="flex sm:flex-col sm:items-center sm:border-r sm:pr-6 dark:border-gray-700 w-full sm:w-40 shrink-0">
                      <div className="flex items-center space-x-4 sm:space-x-0 sm:flex-col sm:w-full">
                         <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-gray-500 dark:text-gray-400 text-lg border-2 border-gray-200 dark:border-gray-600 rounded-full">{index + 1}</div>
                         <div className="sm:mt-4 sm:text-center">
                            <div className="font-medium text-gray-900 dark:text-white">{formatDate(car.allocationDate)}</div>
                            <div className="text-xs text-gray-400 dark:text-gray-500">Allocation</div>
                            {car.stockInDate && (
                                <div className="mt-2">
                                    <div className="font-medium text-gray-900 dark:text-white">{formatDate(car.stockInDate)}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">In Stock</div>
                                </div>
                            )}
                             {match?.saleDate && (
                                <div className="mt-2">
                                    <div className="font-medium text-green-600 dark:text-green-400">{formatDate(match.saleDate)}</div>
                                    <div className="text-xs text-gray-400 dark:text-gray-500">Sale Date</div>
                                </div>
                            )}
                         </div>
                      </div>
                  </div>

                  {/* Center: Main Info */}
                  <div className="flex-grow grid grid-cols-2 md:grid-cols-7 gap-x-6 gap-y-4">
                      {/* Dealer / Model */}
                      <div className="col-span-2 md:col-span-2">
                          <div className="font-bold text-gray-800 dark:text-white">{car.dealerName}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">{car.dealerCode} | Mahasarakham</div>
                          <div className="font-semibold text-gray-700 dark:text-gray-300 mt-2">{car.model}</div>
                          <div className="text-sm">{car.color}</div>
                          {match && (
                              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                  <h4 className="text-xs font-semibold text-gray-500 dark:text-gray-400">ข้อมูลการจอง</h4>
                                  <div className="text-sm font-medium text-gray-800 dark:text-white">ลูกค้า: {match.customerName}</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">เซลล์: {match.salesperson}</div>
                              </div>
                          )}
                      </div>

                      {/* Vehicle Identifiers */}
                      <div className="col-span-2 md:col-span-2">
                          <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-1">Identifiers</h4>
                          <div className="space-y-1">
                              <IdentifierRow label="VIN" value={car.vin} />
                              <IdentifierRow label="Engine" value={car.engineNo} />
                              <IdentifierRow label="F.Motor" value={car.frontMotorNo} />
                              <IdentifierRow label="R.Motor" value={car.rearMotorNo} />
                              <IdentifierRow label="Battery" value={car.batteryNo} />
                          </div>
                      </div>
                      
                      {/* Type */}
                      <div className="col-span-1">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Type</h4>
                        <div className="font-medium text-gray-900 dark:text-white text-sm">{car.carType || 'Normal'}</div>
                        <div className="text-xs">{car.poType || 'Allocation'}</div>
                      </div>

                      {/* Price */}
                      <div className="col-span-1">
                        <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Price</h4>
                        <div className="font-bold text-gray-800 dark:text-white">
                            {Number(car.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      
                      {/* Status */}
                       <div className="col-span-1">
                         <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Status</h4>
                         <div className="flex flex-col items-start space-y-1">
                            <StatusBadge status={car.status} />
                            {car.status === CarStatus.RESERVED && match && (
                              <div className="text-xs font-medium text-purple-600 dark:text-purple-400 px-1">
                                  ({match.status})
                              </div>
                            )}
                            {car.stockLocation && (
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                                    สาขา: {car.stockLocation}
                                </div>
                            )}
                            {car.stockNo && (
                                <div className="text-xs font-mono text-gray-500 dark:text-gray-400 px-1 pt-1">
                                    S/N: {car.stockNo}
                                </div>
                            )}
                            {match?.licensePlate && (
                                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 px-1">
                                    ทะเบียนรถ: {match.licensePlate}
                                </div>
                            )}
                            {match?.notes && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 px-1 whitespace-pre-wrap">
                                    หมายเหตุ: {match.notes}
                                </div>
                            )}
                          </div>
                      </div>
                  </div>

                  {/* Right Side: Actions */}
                    <div className="sm:pl-4 sm:border-l dark:border-gray-700 flex items-start justify-end shrink-0">
                        {userRole !== 'user' ? (
                            <>
                                {view === 'allocation' ? (
                                    <div className="grid grid-cols-2 grid-rows-3 gap-1">
                                        {/* Row 1 */}
                                        <button onClick={handleEdit} title="Edit Car" className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 p-2 rounded-full hover:bg-green-50 dark:hover:bg-green-800/50">
                                            <EditIcon />
                                        </button>
                                        {showCarDeleteButton ? (
                                            <button
                                                onClick={handleDelete}
                                                disabled={isSold}
                                                title={isSold ? "Cannot delete a sold car" : "Delete Car"}
                                                className={`p-2 rounded-full transition-colors ${
                                                    isSold
                                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                    : 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-800/50'
                                                }`}
                                            >
                                                <TrashIcon />
                                            </button>
                                        ) : ( <div className="w-9 h-9" /> )}
                                        
                                        {/* Row 2 */}
                                        <button 
                                            onClick={handleAddToStock} 
                                            disabled={!canBeStocked}
                                            title={canBeStocked ? "นำรถเข้า Stock" : "This car cannot be added to stock"} 
                                            className={`p-2 rounded-full transition-colors ${
                                                canBeStocked 
                                                ? 'text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200 hover:bg-green-50 dark:hover:bg-green-800/50'
                                                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                            }`}
                                        >
                                            <ArchiveInIcon />
                                        </button>
                                        <button 
                                            onClick={handleUnstock} 
                                            disabled={!canBeUnstocked}
                                            title={canBeUnstocked ? "นำรถออกจาก Stock" : "Cannot remove from stock"} 
                                            className={`p-2 rounded-full transition-colors ${
                                                canBeUnstocked 
                                                ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-800/50'
                                                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                            }`}
                                        >
                                            <ArchiveOutIcon />
                                        </button>

                                        {/* Row 3 */}
                                        <button 
                                            onClick={handleMatchCar} 
                                            disabled={car.status !== CarStatus.IN_STOCK}
                                            title={car.status === CarStatus.IN_STOCK ? "จับคู่รถ" : "Car must be 'In Stock' to be matched"}
                                            className={`p-2 rounded-full transition-colors ${
                                                car.status === CarStatus.IN_STOCK
                                                ? 'text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 hover:bg-sky-50 dark:hover:bg-sky-800/50'
                                                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                            }`}>
                                            <LinkIcon />
                                        </button>
                                        <button 
                                            onClick={handleUnlink} 
                                            disabled={!match}
                                            title={match ? "ยกเลิกการจับคู่" : "No match to unlink"} 
                                            className={`p-2 rounded-full transition-colors ${
                                                match
                                                ? 'text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-200 hover:bg-red-50 dark:hover:bg-red-800/50'
                                                : 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                            }`}
                                        >
                                            <UnlinkIcon />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="flex items-center space-x-1">
                                        <button onClick={handleEdit} title={editTitle} className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
                                            <EditIcon />
                                        </button>
                                        {(showCarDeleteButton || showMatchDeleteButton) && (
                                            <button
                                                onClick={handleDelete}
                                                disabled={isSold && view !== 'matching'}
                                                title={isSold && view !== 'matching' ? "Cannot delete a sold car" : mainActionTitle}
                                                className={`p-2 rounded-full transition-colors ${
                                                    isSold && view !== 'matching'
                                                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                                                    : mainActionClassName
                                                }`}
                                            >
                                                <MainActionIcon />
                                            </button>
                                        )}
                                    </div>
                                )}
                            </>
                        ) : (
                            <div className="flex items-center">
                                <button onClick={handleEdit} title="View Details" className="text-sky-600 hover:text-sky-900 dark:text-sky-400 dark:hover:text-sky-200 p-2 rounded-full hover:bg-sky-50 dark:hover:bg-sky-800/50">
                                    <EyeIcon />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
              )})}
            </div>
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