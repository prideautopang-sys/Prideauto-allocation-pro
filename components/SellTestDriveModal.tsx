
import React, { useState, useEffect } from 'react';
import { Car, Salesperson } from '../types';
import { XIcon } from './icons';

interface SellTestDriveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { customerName: string; salesperson: string; saleDate: string; licensePlate: string }) => void;
  car: Car | null;
  salespersons: Salesperson[];
}

const SellTestDriveModal: React.FC<SellTestDriveModalProps> = ({ isOpen, onClose, onConfirm, car, salespersons }) => {
  const [customerName, setCustomerName] = useState('');
  const [salesperson, setSalesperson] = useState('');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [licensePlate, setLicensePlate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setCustomerName('');
      setSalesperson('');
      setSaleDate(new Date().toISOString().split('T')[0]);
      setLicensePlate('');
    }
  }, [isOpen]);

  if (!isOpen || !car) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !salesperson || !saleDate) {
      alert('กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อลูกค้า, ชื่อเซลล์, วันที่ตัดขาย)');
      return;
    }
    onConfirm({ customerName, salesperson, saleDate, licensePlate });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">ขายรถ Test Drive</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <XIcon />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800/30 mb-2">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">{car.model} ({car.color})</p>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono mt-1">VIN: {car.vin}</p>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">ชื่อลูกค้า <span className="text-red-500">*</span></label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="ระบุชื่อลูกค้า"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">ชื่อเซลล์ <span className="text-red-500">*</span></label>
            <select
              required
              value={salesperson}
              onChange={(e) => setSalesperson(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            >
              <option value="">เลือกชื่อเซลล์</option>
              {salespersons.map(sp => (
                <option key={sp.id} value={sp.name}>{sp.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">วันที่ตัดขาย <span className="text-red-500">*</span></label>
            <input
              type="date"
              required
              value={saleDate}
              onChange={(e) => setSaleDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">ทะเบียนรถ</label>
            <input
              type="text"
              value={licensePlate}
              onChange={(e) => setLicensePlate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
              placeholder="ระบุทะเบียนรถ (ถ้ามี)"
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 focus:ring-4 focus:ring-emerald-500/20 transition-all shadow-lg shadow-emerald-500/20"
            >
              ยืนยันการขาย
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellTestDriveModal;
