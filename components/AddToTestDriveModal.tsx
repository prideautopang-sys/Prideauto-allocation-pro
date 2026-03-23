import React, { useState, useEffect } from 'react';
import { Car } from '../types';
import { XIcon } from './icons';

interface AddToTestDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (carId: string, testDriveDate: string, testDriveBranch: string, testDriveNo: string) => void;
  car: Car | null;
}

const AddToTestDriveModal: React.FC<AddToTestDriveModalProps> = ({ isOpen, onClose, onSave, car }) => {
  const [testDriveDate, setTestDriveDate] = useState(new Date().toISOString().split('T')[0]);
  const [testDriveBranch, setTestDriveBranch] = useState('มหาสารคาม');
  const [testDriveNo, setTestDriveNo] = useState('TC');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setTestDriveDate(car?.testDriveDate ? new Date(car.testDriveDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
      setTestDriveBranch(car?.testDriveBranch || 'มหาสารคาม');
      setTestDriveNo(car?.testDriveNo || 'TC');
    }
  }, [isOpen, car]);
  
  if (!isOpen || !car) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(car.id!, testDriveDate, testDriveBranch, testDriveNo);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
             <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">นำรถเข้า Test Drive</h2>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                    <XIcon />
                </button>
            </div>
          </div>
          <div className="p-6">
            <div className="mb-6 p-4 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <p className="font-semibold text-gray-800 dark:text-white">{car.model} ({car.color})</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-mono mt-1">VIN: {car.vin}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label htmlFor="testDriveDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">วันที่นำเข้า Test Drive</label>
                    <input
                        type="date"
                        id="testDriveDate"
                        value={testDriveDate}
                        onChange={(e) => setTestDriveDate(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
                 <div>
                    <label htmlFor="testDriveBranch" className="block text-sm font-medium text-gray-700 dark:text-gray-300">สาขา</label>
                    <select
                        id="testDriveBranch"
                        value={testDriveBranch}
                        onChange={(e) => setTestDriveBranch(e.target.value)}
                        required
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="มหาสารคาม">มหาสารคาม</option>
                        <option value="กาฬสินธุ์">กาฬสินธุ์</option>
                    </select>
                </div>
                <div className="md:col-span-2">
                    <label htmlFor="testDriveNo" className="block text-sm font-medium text-gray-700 dark:text-gray-300">เลขที่ Test Drive (TCxxxx)</label>
                    <input
                        type="text"
                        id="testDriveNo"
                        value={testDriveNo}
                        onChange={(e) => setTestDriveNo(e.target.value)}
                        required
                        pattern="^TC.*$"
                        title="ต้องขึ้นต้นด้วย TC"
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                </div>
            </div>
          </div>
          <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
            <button type="submit" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm">
              บันทึก
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

export default AddToTestDriveModal;
