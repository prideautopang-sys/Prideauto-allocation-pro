

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
        <div className="flex items-center text-xs group">
            <span className="font-semibold w-16 shrink-0 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-400 transition-colors">{label}:</span>
            <span className="font-mono text-gray-600 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">{value}</span>
        </div>
    );
  };

  return (
    <div className="flex flex-col space-y-4">
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
        let mainActionClassName = 'text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400';

        if (view === 'matching') {
            MainActionIcon = UnlinkIcon;
            mainActionTitle = 'Unlink Match';
            mainActionClassName = 'text-orange-500 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 dark:bg-orange-900/20 dark:hover:bg-orange-900/40 dark:text-orange-400';
        } else if (view === 'stock') {
            MainActionIcon = ArchiveOutIcon;
            mainActionTitle = 'Remove from Stock';
            mainActionClassName = 'text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400';
        }

        return (
        <div key={car.id} className="group bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm shadow-sm hover:shadow-lg rounded-2xl p-5 border border-white/50 dark:border-gray-700 transition-all duration-300 animate-slide-up" style={{ animationDelay: `${index * 50}ms` }}>
          <div className="flex flex-col lg:flex-row gap-6">
            
            {/* Left Side: Number and Dates */}
            <div className="flex lg:flex-col items-center lg:items-start lg:w-48 shrink-0 lg:border-r border-gray-100 dark:border-gray-700 lg:pr-6 gap-4 lg:gap-0">
                <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center font-bold text-gray-400 dark:text-gray-500 text-sm bg-gray-50 dark:bg-gray-700 rounded-xl shadow-inner">{index + 1}</div>
                <div className="lg:mt-4 space-y-3 w-full">
                    <div>
                        <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">Allocation</div>
                        <div className="font-semibold text-gray-800 dark:text-white">{formatDate(car.allocationDate)}</div>
                    </div>
                    {car.stockInDate && (
                        <div>
                            <div className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider font-semibold mb-0.5">In Stock</div>
                            <div className="font-semibold text-gray-800 dark:text-white">{formatDate(car.stockInDate)}</div>
                        </div>
                    )}
                      {match?.saleDate && (
                        <div>
                            <div className="text-xs text-green-500/80 dark:text-green-400/80 uppercase tracking-wider font-semibold mb-0.5">Sold Date</div>
                            <div className="font-bold text-green-600 dark:text-green-400">{formatDate(match.saleDate)}</div>
                        </div>
                    )}
                </div>
            </div>

            {/* Center: Main Info */}
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-6">
                {/* Dealer / Model */}
                <div className="col-span-1 md:col-span-1">
                    <div className="mb-4">
                        <div className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{car.model}</div>
                        <div className="text-sm font-medium text-slate-500 dark:text-gray-400 mt-1">{car.color}</div>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                        <div className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase">Dealer</div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 font-medium">{car.dealerName}</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{car.dealerCode} | Mahasarakham</div>
                    </div>
                </div>

                {/* Match Info (if exists) or Empty */}
                <div className="col-span-1 md:col-span-1">
                     {match ? (
                         <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-3 border border-sky-100 dark:border-sky-800/30">
                            <h4 className="text-xs font-bold text-sky-600 dark:text-sky-400 uppercase mb-2">ข้อมูลการจอง</h4>
                            <div className="text-sm font-semibold text-gray-800 dark:text-white">{match.customerName}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Sale: {match.salesperson}</div>
                            {match.licensePlate && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">ทะเบียน: {match.licensePlate}</div>}
                         </div>
                     ) : (
                        <div className="h-full border border-dashed border-gray-200 dark:border-gray-700 rounded-xl flex items-center justify-center text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-800/50">
                            No Match
                        </div>
                     )}
                </div>

                {/* Vehicle Identifiers */}
                <div className="col-span-1 md:col-span-1">
                    <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Identifiers</h4>
                    <div className="space-y-1.5">
                        <IdentifierRow label="VIN" value={car.vin} />
                        <IdentifierRow label="Engine" value={car.engineNo} />
                        <IdentifierRow label="F.Motor" value={car.frontMotorNo} />
                        <IdentifierRow label="R.Motor" value={car.rearMotorNo} />
                        <IdentifierRow label="Battery" value={car.batteryNo} />
                    </div>
                </div>
                
                {/* Status & Price */}
                  <div className="col-span-1 md:col-span-1 flex flex-col justify-between">
                    <div>
                         <h4 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase mb-2">Details</h4>
                         <div className="text-sm text-gray-600 dark:text-gray-300"><span className="text-gray-400 text-xs">Type:</span> {car.carType || 'Normal'}</div>
                         <div className="text-sm text-gray-600 dark:text-gray-300"><span className="text-gray-400 text-xs">PO:</span> {car.poType || 'Allocation'}</div>
                         <div className="text-lg font-bold text-slate-800 dark:text-white mt-2">
                             {Number(car.price).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                         </div>
                    </div>
                    
                    <div className="mt-4 flex flex-col items-start gap-2">
                        <StatusBadge status={car.status} />
                         {car.stockLocation && (
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                 {car.stockLocation}
                             </span>
                         )}
                         {car.stockNo && (
                             <span className="font-mono text-xs text-gray-400">S/N: {car.stockNo}</span>
                         )}
                         {match?.notes && (
                            <div className="text-xs text-gray-500 italic mt-1 max-w-[150px] truncate" title={match.notes}>"{match.notes}"</div>
                         )}
                    </div>
                </div>
            </div>

            {/* Right Side: Actions */}
            <div className="lg:pl-6 lg:border-l border-gray-100 dark:border-gray-700 flex flex-row lg:flex-col items-center justify-end lg:justify-center gap-2 mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0">
                {userRole !== 'user' ? (
                    <>
                        {view === 'allocation' ? (
                            <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                                <button onClick={handleEdit} title="Edit Car" className="flex items-center justify-center w-8 h-8 rounded-lg text-sky-600 bg-sky-50 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/40 transition-colors">
                                    <EditIcon />
                                </button>
                                
                                <button 
                                    onClick={handleAddToStock} 
                                    disabled={!canBeStocked}
                                    title={canBeStocked ? "นำรถเข้า Stock" : "This car cannot be added to stock"} 
                                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                        canBeStocked 
                                        ? 'text-teal-600 bg-teal-50 hover:bg-teal-100 hover:text-teal-700 dark:bg-teal-900/20 dark:text-teal-400'
                                        : 'text-gray-300 bg-gray-50 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                    }`}
                                >
                                    <ArchiveInIcon />
                                </button>

                                <button 
                                    onClick={handleMatchCar} 
                                    disabled={car.status !== CarStatus.IN_STOCK}
                                    title={car.status === CarStatus.IN_STOCK ? "จับคู่รถ" : "Car must be 'In Stock' to be matched"}
                                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                        car.status === CarStatus.IN_STOCK
                                        ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400'
                                        : 'text-gray-300 bg-gray-50 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                    }`}>
                                    <LinkIcon />
                                </button>

                                 <button 
                                    onClick={handleUnstock} 
                                    disabled={!canBeUnstocked}
                                    title={canBeUnstocked ? "นำรถออกจาก Stock" : "Cannot remove from stock"} 
                                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                        canBeUnstocked 
                                        ? 'text-orange-600 bg-orange-50 hover:bg-orange-100 hover:text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                        : 'text-gray-300 bg-gray-50 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                    }`}
                                >
                                    <ArchiveOutIcon />
                                </button>

                                <button 
                                    onClick={handleUnlink} 
                                    disabled={!match}
                                    title={match ? "ยกเลิกการจับคู่" : "No match to unlink"} 
                                    className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                        match
                                        ? 'text-pink-600 bg-pink-50 hover:bg-pink-100 hover:text-pink-700 dark:bg-pink-900/20 dark:text-pink-400'
                                        : 'text-gray-300 bg-gray-50 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                    }`}
                                >
                                    <UnlinkIcon />
                                </button>

                                {showCarDeleteButton && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={isSold}
                                        title={isSold ? "Cannot delete a sold car" : "Delete Car"}
                                        className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors ${
                                            isSold
                                            ? 'text-gray-300 bg-gray-50 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                            : 'text-red-600 bg-red-50 hover:bg-red-100 hover:text-red-700 dark:bg-red-900/20 dark:text-red-400'
                                        }`}
                                    >
                                        <TrashIcon />
                                    </button>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-row lg:flex-col gap-2">
                                <button onClick={handleEdit} title={editTitle} className="flex items-center justify-center w-10 h-10 rounded-xl text-sky-600 bg-sky-50 hover:bg-sky-100 hover:text-sky-700 dark:bg-sky-900/20 dark:text-sky-400 dark:hover:bg-sky-900/40 transition-colors shadow-sm">
                                    <EditIcon />
                                </button>
                                {(showCarDeleteButton || showMatchDeleteButton) && (
                                    <button
                                        onClick={handleDelete}
                                        disabled={isSold && view !== 'matching'}
                                        title={isSold && view !== 'matching' ? "Cannot delete a sold car" : mainActionTitle}
                                        className={`flex items-center justify-center w-10 h-10 rounded-xl transition-colors shadow-sm ${
                                            isSold && view !== 'matching'
                                            ? 'text-gray-400 bg-gray-100 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
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
                        <button onClick={handleEdit} title="View Details" className="flex items-center justify-center w-10 h-10 rounded-xl text-sky-600 bg-sky-50 hover:bg-sky-100 dark:bg-sky-900/20 dark:text-sky-400 transition-colors shadow-sm">
                            <EyeIcon />
                        </button>
                    </div>
                )}
            </div>
          </div>
        </div>
      )})}
      {cars.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-300 dark:border-gray-700">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 mb-4">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">ไม่พบข้อมูลรถยนต์</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">ลองปรับเปลี่ยนการค้นหาหรือล้างตัวกรอง</p>
        </div>
      )}
    </div>
  );
};

export default CarTable;
