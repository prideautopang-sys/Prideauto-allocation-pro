import React, { useState } from 'react';
import { XIcon } from './icons';

interface BatchAddToStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (stockInDate: string, stockLocation: 'มหาสารคาม' | 'กาฬสินธุ์') => void;
  selectedCarsCount: number;
}

const BatchAddToStockModal: React.FC<BatchAddToStockModalProps> = ({ isOpen, onClose, onSave, selectedCarsCount }) => {
  const [stockInDate, setStockInDate] = useState(new Date().toISOString().split('T')[0]);
  const [stockLocation, setStockLocation] = useState<'มหาสารคาม' | 'กาฬสินธุ์'>('มหาสารคาม');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(stockInDate, stockLocation);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">ยืนยันการเพิ่มรถเข้าสต็อก</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <XIcon />
                </button>
            </div>
          </div>
          <div className="p-6 flex-grow">
             <div className="mb-6 p-4 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-800 dark:text-white">
                    คุณกำลังจะย้ายรถยนต์ <span className="text-sky-600 dark:text-sky-400 font-bold text-lg">{selectedCarsCount}</span> คันเข้าสู่สต็อก
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">กรุณายืนยันวันที่และสาขาที่นำเข้า</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" disabled={selectedCarsCount === 0} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed">
              ยืนยันเพิ่มเข้าสต็อก ({selectedCarsCount})
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

export default BatchAddToStockModal;