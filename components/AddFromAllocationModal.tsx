
import React, { useState, useMemo } from 'react';
import { Car } from '../types';
import { XIcon } from './icons';

interface AddFromAllocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (carIds: string[], stockInDate: string, stockLocation: 'มหาสารคาม' | 'กาฬสินธุ์', stockNo: string) => void;
  allocatedCars: Car[];
}

const AddFromAllocationModal: React.FC<AddFromAllocationModalProps> = ({ isOpen, onClose, onSave, allocatedCars }) => {
  const [selectedCarIds, setSelectedCarIds] = useState<string[]>([]);
  const [stockInDate, setStockInDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockLocation, setStockLocation] = useState<'มหาสารคาม' | 'กาฬสินธุ์'>('มหาสารคาม');
  const [stockNo, setStockNo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCars = useMemo(() => {
    if (!searchTerm) return allocatedCars;
    const lowercasedTerm = searchTerm.toLowerCase();
    return allocatedCars.filter(car =>
      Object.values(car).some(val =>
        String(val).toLowerCase().includes(lowercasedTerm)
      )
    );
  }, [allocatedCars, searchTerm]);

  // Reset state when modal is opened/closed
  React.useEffect(() => {
      if (!isOpen) {
        setSelectedCarIds([]);
        setSearchTerm('');
        setStockNo('');
      }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleSelect = (carId: string) => {
    setSelectedCarIds(prev =>
      prev.includes(carId) ? prev.filter(id => id !== carId) : [...prev, carId]
    );
  };

  const handleToggleSelectAll = () => {
    const allFilteredIds = filteredCars.map(car => car.id!);
    const areAllSelected = allFilteredIds.length > 0 && allFilteredIds.every(id => selectedCarIds.includes(id!));

    if (areAllSelected) {
      setSelectedCarIds(prev => prev.filter(id => !allFilteredIds.includes(id)));
    } else {
      setSelectedCarIds(prev => [...new Set([...prev, ...allFilteredIds])]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCarIds.length === 0) {
        alert('กรุณาเลือกรถยนต์อย่างน้อย 1 คัน');
        return;
    }
    onSave(selectedCarIds, stockInDate, stockLocation, stockNo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">เพิ่มรถเข้าสตอกจาก Allocation</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <XIcon />
                </button>
            </div>
          </div>
          <div className="p-6 flex-grow overflow-y-auto">
            <input
                type="text"
                placeholder="ค้นหารถยนต์ (Model, VIN, Dealer...)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full mb-4 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            <div className="border rounded-lg overflow-hidden dark:border-gray-700 max-h-80 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-left">
                                <input type="checkbox"
                                    checked={filteredCars.length > 0 && filteredCars.every(c => selectedCarIds.includes(c.id!))}
                                    onChange={handleToggleSelectAll}
                                    className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Model</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">VIN</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Color</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Dealer</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredCars.map(car => (
                            <tr key={car.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${selectedCarIds.includes(car.id!) ? 'bg-sky-50 dark:bg-sky-900/50' : ''}`}>
                                <td className="px-4 py-2">
                                    <input type="checkbox"
                                        checked={selectedCarIds.includes(car.id!)}
                                        onChange={() => handleToggleSelect(car.id!)}
                                        className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                                    />
                                </td>
                                <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">{car.model}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 font-mono">{car.vin}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{car.color}</td>
                                <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">{car.dealerName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredCars.length === 0 && (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">ไม่พบรถใน Allocation หรือไม่ตรงกับคำค้นหา</p>
                )}
            </div>
            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <label htmlFor="stockInDateModal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันที่นำเข้าสต็อก</label>
                    <input
                        type="date"
                        id="stockInDateModal"
                        value={stockInDate}
                        onChange={(e) => setStockInDate(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                 <div>
                    <label htmlFor="stockLocationModal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">สต็อกสาขา</label>
                    <select
                        id="stockLocationModal"
                        value={stockLocation}
                        onChange={(e) => setStockLocation(e.target.value as 'มหาสารคาม' | 'กาฬสินธุ์')}
                        required
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="มหาสารคาม">มหาสารคาม</option>
                        <option value="กาฬสินธุ์">กาฬสินธุ์</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="stockNoModal" className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลขสต็อก (ถ้ามี)</label>
                    <input
                        type="text"
                        id="stockNoModal"
                        value={stockNo}
                        onChange={(e) => setStockNo(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" disabled={selectedCarIds.length === 0} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
              ยืนยันเพิ่มเข้าสต็อก ({selectedCarIds.length})
            </button>
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
              ยกเลิก
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddFromAllocationModal;