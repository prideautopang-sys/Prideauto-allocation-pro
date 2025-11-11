import React, { useState } from 'react';
import { Car, CarStatus } from '../types';
import { XIcon } from './icons';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (cars: Car[]) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [pastedText, setPastedText] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;
  
  const handleImport = () => {
    setError(null);
    const newCars: Car[] = [];
    const errors: string[] = [];
    const processingRows = pastedText.trim().split('\n').filter(row => row.trim() !== '');

    if (processingRows.length === 0) {
        setError('กรุณาวางข้อมูลก่อนนำเข้า');
        return;
    }

    processingRows.forEach((row, index) => {
      const originalRowNumber = index + 1;
      let columns = row.split(/\t+/).map(c => c.trim());
      
      // Handle optional leading row number copied from Excel
      if (columns.length === 14 && !isNaN(parseInt(columns[0], 10))) {
          columns = columns.slice(1);
      }
      
      if (columns.length !== 13) {
        errors.push(`แถวที่ ${originalRowNumber}: จำนวนคอลัมน์ไม่ถูกต้อง (ต้องการ 13, พบ ${columns.length})`);
        return;
      }

      const [
          dealerCode, dealerName, model, vin, frontMotorNo, rearMotorNo,
          batteryNo, engineNo, color, carType, allocationDateStr, poType, priceStr
      ] = columns;

      const price = parseFloat(priceStr.replace(/,/g, ''));

      if (!dealerCode || !dealerName || !model || !vin) {
          errors.push(`แถวที่ ${originalRowNumber}: ข้อมูล Dealer Code, Dealer Name, Model, หรือ VIN เป็นค่าว่าง`);
          return;
      }

      if (isNaN(price)) {
        errors.push(`แถวที่ ${originalRowNumber}: ข้อมูล Price (คอลัมน์สุดท้าย) ไม่ใช่ตัวเลขที่ถูกต้อง`);
        return;
      }
      
      if (vin.length < 10) {
          errors.push(`แถวที่ ${originalRowNumber}: เลขตัวถัง (${vin}) ดูเหมือนจะไม่ถูกต้อง`);
          return;
      }

      // Handle different date formats (DD/MM/YYYY or YYYY-MM-DD)
      let allocationDate = allocationDateStr;
      if (allocationDateStr.includes('/')) {
        const parts = allocationDateStr.split('/');
        if (parts.length === 3) {
            let [day, month, year] = parts;
            
            if (year.length !== 4) {
                 errors.push(`แถวที่ ${originalRowNumber}: ปี (${year}) ในวันที่ (${allocationDateStr}) ต้องเป็น 4 หลัก`);
                 return;
            }

            // Pad day and month to ensure 2 digits
            day = day.padStart(2, '0');
            month = month.padStart(2, '0');

            const formattedDate = `${year}-${month}-${day}`;
            // Final check if the constructed date is valid
            if (isNaN(new Date(formattedDate).getTime())) {
                errors.push(`แถวที่ ${originalRowNumber}: วันที่ (${allocationDateStr}) ไม่ถูกต้อง`);
                return;
            }
            allocationDate = formattedDate;
        } else {
             errors.push(`แถวที่ ${originalRowNumber}: รูปแบบวันที่ (${allocationDateStr}) ไม่ถูกต้อง`);
             return;
        }
      } else if (!allocationDateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
           errors.push(`แถวที่ ${originalRowNumber}: รูปแบบวันที่ (${allocationDateStr}) ไม่ถูกต้อง ควรเป็น DD/MM/YYYY หรือ YYYY-MM-DD`);
           return;
      }

      const newCar: Car = {
        id: `imported-${Date.now()}-${index}`,
        dealerCode,
        dealerName,
        model,
        vin,
        frontMotorNo,
        rearMotorNo,
        batteryNo,
        engineNo,
        color,
        carType,
        allocationDate,
        poType,
        price,
        status: CarStatus.WAITING_FOR_TRAILER,
      };
      newCars.push(newCar);
    });

    if (errors.length > 0) {
      setError(errors.join('\n'));
    } else {
      onImport(newCars);
      setPastedText('');
      onClose();
    }
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">นำเข้าข้อมูลจาก Excel</h2>
            <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <XIcon />
            </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-md">
                <h3 className="font-semibold text-blue-800 dark:text-blue-200">คำแนะนำ:</h3>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                    คัดลอกข้อมูลจาก Excel (ไม่รวมหัวตาราง) แล้ววางลงในช่องด้านล่าง. ข้อมูลต้องเป็น Tab-separated และมี 13 คอลัมน์เรียงตามลำดับ.
                    วันที่ (Allocation Date) ควรอยู่ในรูปแบบ <span className="font-semibold">DD/MM/YYYY</span> หรือ <span className="font-semibold">YYYY-MM-DD</span>.
                </p>
                <div className="text-xs font-mono bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-md mt-2 text-gray-800 dark:text-gray-200 overflow-x-auto">
                    <p>Dealer Code &rarr; Dealer Name &rarr; Model &rarr; VIN No. &rarr; Front Motor no. &rarr; Rear Motor no. &rarr; Battery No. &rarr; Engine No. &rarr; Color &rarr; Car Type &rarr; Allocation Date &rarr; PO Type &rarr; Price</p>
                </div>
            </div>
            
            <textarea
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              placeholder="วางข้อมูลที่คัดลอกจาก Excel ที่นี่..."
              rows={10}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm p-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono"
            />
            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 rounded-md">
                    <h4 className="font-semibold text-red-800 dark:text-red-200">พบข้อผิดพลาด:</h4>
                    <pre className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">{error}</pre>
                </div>
            )}
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            onClick={handleImport}
            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm"
          >
            นำเข้าข้อมูล
          </button>
          <button
            type="button"
            onClick={onClose}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
          >
            ยกเลิก
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;