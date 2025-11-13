import React from 'react';
import { Car } from '../types';
import { XIcon, ExclamationIcon } from './icons';

interface ConfirmStockDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  car: Car | null;
}

const ConfirmStockDeleteModal: React.FC<ConfirmStockDeleteModalProps> = ({ isOpen, onClose, onConfirm, car }) => {
  if (!isOpen || !car) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationIcon />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                นำรถออกจากสต็อก
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  คุณแน่ใจหรือไม่ว่าต้องการนำรถคันนี้ออกจากสต็อก? ข้อมูลสต็อกจะถูกล้าง และสถานะรถจะเปลี่ยนเป็น "รถลงแล้ว"
                </p>
                <div className="mt-4 p-3 rounded-md bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                    <p className="font-semibold text-gray-800 dark:text-white">{car.model} ({car.color})</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mt-1">VIN: {car.vin}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 dark:focus:ring-offset-gray-800 sm:ml-3 sm:w-auto sm:text-sm"
          >
            ยืนยัน
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 dark:focus:ring-offset-gray-800 sm:mt-0 sm:w-auto sm:text-sm"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmStockDeleteModal;
