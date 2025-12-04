

import React, { useState, useEffect } from 'react';
import { Car, CarStatus, Match, MatchStatus, Salesperson, CarFormData } from '../types';
import { XIcon } from './icons';

type UserRole = 'executive' | 'admin' | 'user';

interface CarFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (car: CarFormData) => void;
  carToEdit?: Car | null;
  matchToEdit?: Match | null;
  salespersons: Salesperson[];
  userRole: UserRole;
}

const CarFormModal: React.FC<CarFormModalProps> = ({ isOpen, onClose, onSave, carToEdit, matchToEdit, salespersons, userRole }) => {
  const getInitialState = (): CarFormData => {
      const initialCar: Car = {
        dealerCode: '',
        dealerName: '',
        model: '',
        vin: '',
        frontMotorNo: '',
        rearMotorNo: '',
        batteryNo: '',
        engineNo: '',
        color: '',
        carType: '',
        allocationDate: new Date().toISOString().split('T')[0],
        poType: '',
        price: 0,
        status: CarStatus.WAITING_FOR_TRAILER,
      };

      const carPart = carToEdit ? {
        ...carToEdit,
        allocationDate: carToEdit.allocationDate ? new Date(carToEdit.allocationDate).toISOString().split('T')[0] : '',
        stockInDate: carToEdit.stockInDate ? new Date(carToEdit.stockInDate).toISOString().split('T')[0] : undefined,
      } : initialCar;

      const matchPart = matchToEdit ? {
        matchId: matchToEdit.id,
        matchCustomerName: matchToEdit.customerName,
        matchSalesperson: matchToEdit.salesperson,
        matchSaleDate: matchToEdit.saleDate ? new Date(matchToEdit.saleDate).toISOString().split('T')[0] : '',
        matchStatus: matchToEdit.status,
        matchLicensePlate: matchToEdit.licensePlate,
        matchNotes: matchToEdit.notes,
      } : {};

      return { ...carPart, ...matchPart };
  };

  const [formData, setFormData] = useState<CarFormData>(getInitialState());

  useEffect(() => {
    setFormData(getInitialState());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carToEdit, matchToEdit, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'price' ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'user') return;
    onSave(formData);
  };

  const inputFields = [
      { name: 'dealerCode', label: 'Dealer Code', required: true },
      { name: 'dealerName', label: 'Dealer Name', required: true },
      { name: 'model', label: 'Model', required: true },
      { name: 'vin', label: 'VIN No.', required: true },
      { name: 'frontMotorNo', label: 'Front Motor No.', required: false },
      { name: 'rearMotorNo', label: 'Rear Motor No.', required: false },
      { name: 'batteryNo', label: 'Battery No.', required: false },
      { name: 'engineNo', label: 'Engine No.', required: false },
      { name: 'color', label: 'Color', required: true },
      { name: 'carType', label: 'Car Type', required: false },
      { name: 'poType', label: 'PO Type', required: false },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex justify-center items-center p-4 transition-opacity animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-white/20 dark:border-gray-700 animate-scale-in">
        <form onSubmit={handleSubmit}>
          <div className="p-6 sm:p-8">
             <div className="flex justify-between items-center mb-8 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{carToEdit ? 'แก้ไขข้อมูลรถยนต์' : 'เพิ่มรถใหม่'}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">กรอกข้อมูลรายละเอียดของรถยนต์ด้านล่าง</p>
                </div>
                <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-gray-100 dark:bg-gray-700 p-2 rounded-full hover:bg-gray-200">
                    <XIcon />
                </button>
            </div>
            
            <fieldset disabled={userRole === 'user'} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {inputFields.map(field => (
                    <div key={field.name}>
                        <label htmlFor={field.name} className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
                            {field.label}
                        </label>
                        <input 
                            type="text" 
                            name={field.name} 
                            id={field.name} 
                            value={(formData as any)[field.name]} 
                            onChange={handleChange} 
                            required={field.required}
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-all" />
                    </div>
                ))}
                 <div>
                    <label htmlFor="allocationDate" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Allocation Date</label>
                    <input type="date" name="allocationDate" id="allocationDate" value={formData.allocationDate} onChange={handleChange} required 
                           className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-all" />
                </div>
                 <div>
                    <label htmlFor="price" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Sum of Price (บาท)</label>
                    <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required 
                           className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-all" />
                </div>
                 <div>
                    <label htmlFor="status" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">Car Status</label>
                    <select
                        name="status"
                        id="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-gray-800 transition-all"
                    >
                        {Object.values(CarStatus).map(status => (
                            <option key={status} value={status}>{status}</option>
                        ))}
                    </select>
                </div>
            </fieldset>

            {carToEdit && (
                <>
                    <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                             <span className="w-1 h-6 bg-sky-500 rounded-full"></span>
                             Stock & Sale Information
                        </h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 ml-3">
                            จัดการข้อมูลสต็อกและการขายสำหรับรถคันนี้
                        </p>
                    </div>
                    <fieldset disabled={userRole === 'user'} className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Stock Fields */}
                        <div className="bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl border border-blue-100 dark:border-blue-900/30 md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label htmlFor="stockInDate" className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-1.5">วันที่นำเข้าสต็อก</label>
                                <input type="date" name="stockInDate" id="stockInDate" value={formData.stockInDate || ''} onChange={handleChange}
                                    className="block w-full border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            </div>
                            <div>
                                <label htmlFor="stockLocation" className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-1.5">สต็อกสาขา</label>
                                <select name="stockLocation" id="stockLocation" value={formData.stockLocation || ''} onChange={handleChange}
                                    className="block w-full border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                                    <option value="">-- เลือกสาขา --</option>
                                    <option value="มหาสารคาม">มหาสารคาม</option>
                                    <option value="กาฬสินธุ์">กาฬสินธุ์</option>
                                </select>
                            </div>
                            <div>
                                <label htmlFor="stockNo" className="block text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wide mb-1.5">เลขสต็อก</label>
                                <input type="text" name="stockNo" id="stockNo" value={formData.stockNo || ''} onChange={handleChange}
                                    className="block w-full border border-blue-200 dark:border-blue-800 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white" />
                            </div>
                        </div>

                        {/* Match Fields */}
                        <div className="md:col-span-2">
                            <label htmlFor="matchCustomerName" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">ชื่อลูกค้า</label>
                            <input type="text" name="matchCustomerName" id="matchCustomerName" value={formData.matchCustomerName || ''} onChange={handleChange}
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="matchSalesperson" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">เซลล์</label>
                            <select name="matchSalesperson" id="matchSalesperson" value={formData.matchSalesperson || ''} onChange={handleChange}
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="">-- เลือกเซลล์ --</option>
                                {salespersons.map(sp => <option key={sp.id} value={sp.name}>{sp.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="matchSaleDate" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">วันที่ตัดขาย</label>
                            <input type="date" name="matchSaleDate" id="matchSaleDate" value={formData.matchSaleDate || ''} onChange={handleChange}
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div>
                            <label htmlFor="matchStatus" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">สถานะการขาย</label>
                            <select name="matchStatus" id="matchStatus" value={formData.matchStatus || ''} onChange={handleChange}
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option value="">-- เลือกสถานะ --</option>
                                {Object.values(MatchStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="matchLicensePlate" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">ทะเบียนรถ</label>
                            <input type="text" name="matchLicensePlate" id="matchLicensePlate" value={formData.matchLicensePlate || ''} onChange={handleChange}
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                        <div className="md:col-span-3">
                            <label htmlFor="matchNotes" className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">หมายเหตุ</label>
                            <textarea name="matchNotes" id="matchNotes" value={formData.matchNotes || ''} onChange={handleChange} rows={3}
                                className="block w-full border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white" />
                        </div>
                    </fieldset>
                </>
            )}

          </div>
          <div className="bg-gray-50 dark:bg-gray-700/50 px-8 py-5 sm:flex sm:flex-row-reverse rounded-b-3xl border-t border-gray-100 dark:border-gray-700 backdrop-blur-md">
            {userRole !== 'user' && (
              <button type="submit" className="w-full inline-flex justify-center rounded-xl border border-transparent shadow-lg shadow-sky-500/20 px-6 py-2.5 bg-sky-600 text-base font-bold text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm transition-all transform hover:-translate-y-0.5">
                บันทึกข้อมูล
              </button>
            )}
            <button type="button" onClick={onClose} className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm px-6 py-2.5 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors">
              {userRole === 'user' ? 'ปิด' : 'ยกเลิก'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarFormModal;
