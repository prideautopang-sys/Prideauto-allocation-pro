
import React, { useState, useRef } from 'react';
import { Car, CarStatus } from '../types';
import { XIcon, DocumentDownloadIcon, ArchiveInIcon } from './icons';

// Declare XLSX global from the CDN script
declare var XLSX: any;

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper to parse Excel serial dates
const excelDateToJSDate = (serial: number) => {
   const utc_days  = Math.floor(serial - 25569);
   const utc_value = utc_days * 86400;                                        
   const date_info = new Date(utc_value * 1000);
   return date_info.toISOString().split('T')[0];
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<{type: 'success' | 'error', message: string}[]>([]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setFile(e.target.files[0]);
          setLogs([]);
          setProgress(0);
      }
  };

  const resetModal = () => {
      setFile(null);
      setLogs([]);
      setProgress(0);
      setIsUploading(false);
      if(fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleProcessAndUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setLogs([]);
    setProgress(0);

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target?.result as ArrayBuffer);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Assume data is in the first sheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            
            // Convert sheet to JSON with header array to handle manual column mapping
            // header: 1 results in an array of arrays
            const jsonData: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

            const carsToImport: Car[] = [];
            const validationErrors: string[] = [];

            // Config: Data starts at Row 4 (Index 3) because headers are at B3:N3
            // Columns: B=1, C=2, ..., N=13
            const START_ROW_INDEX = 3; 

            for (let i = START_ROW_INDEX; i < jsonData.length; i++) {
                const row = jsonData[i];
                
                // Check if Dealer Code (Column B, Index 1) exists. If empty, skip (assume end of data).
                if (!row[1]) continue;

                // Extract Data based on specific columns B through N
                const dealerCode = row[1]?.toString().trim();
                const dealerName = row[2]?.toString().trim();
                const model = row[3]?.toString().trim();
                const vin = row[4]?.toString().trim();
                const frontMotorNo = row[5]?.toString().trim();
                const rearMotorNo = row[6]?.toString().trim();
                const batteryNo = row[7]?.toString().trim();
                const engineNo = row[8]?.toString().trim();
                const color = row[9]?.toString().trim();
                const carType = row[10]?.toString().trim();
                const rawAllocDate = row[11];
                const poType = row[12]?.toString().trim();
                const rawPrice = row[13];

                // Validation
                if (!dealerCode || !dealerName || !model || !vin) {
                    validationErrors.push(`Row ${i + 1}: Missing required fields (Dealer, Model, or VIN).`);
                    continue;
                }

                // Date Parsing
                let allocationDate = '';
                if (typeof rawAllocDate === 'number') {
                    allocationDate = excelDateToJSDate(rawAllocDate);
                } else if (typeof rawAllocDate === 'string') {
                    // Try to parse string date
                    const dateObj = new Date(rawAllocDate);
                    if (!isNaN(dateObj.getTime())) {
                        allocationDate = dateObj.toISOString().split('T')[0];
                    } else {
                        validationErrors.push(`Row ${i + 1}: Invalid Date format.`);
                        continue;
                    }
                } else {
                     allocationDate = new Date().toISOString().split('T')[0];
                }

                const price = typeof rawPrice === 'number' ? rawPrice : parseFloat(rawPrice?.toString().replace(/,/g, '') || '0');

                const car: Car = {
                    dealerCode,
                    dealerName,
                    model,
                    vin,
                    frontMotorNo: frontMotorNo || '',
                    rearMotorNo: rearMotorNo || '',
                    batteryNo: batteryNo || '',
                    engineNo: engineNo || '',
                    color,
                    carType: carType || '',
                    allocationDate,
                    poType: poType || '',
                    price,
                    status: CarStatus.WAITING_FOR_TRAILER
                };

                carsToImport.push(car);
            }

            if (validationErrors.length > 0) {
                setLogs(prev => [...prev, ...validationErrors.map(msg => ({ type: 'error' as const, message: msg }))]);
            }

            if (carsToImport.length === 0) {
                setLogs(prev => [...prev, { type: 'error', message: 'ไม่พบข้อมูลรถยนต์ที่ถูกต้องในไฟล์ (ตรวจสอบแถว B4 เป็นต้นไป)' }]);
                setIsUploading(false);
                return;
            }

            // Batch Upload Logic
            const BATCH_SIZE = 20;
            const totalCars = carsToImport.length;
            let successCount = 0;
            let failCount = 0;

            // Get token from localStorage manually since we are inside a callback
            const token = localStorage.getItem('authToken');

            for (let i = 0; i < totalCars; i += BATCH_SIZE) {
                const batch = carsToImport.slice(i, i + BATCH_SIZE);
                
                try {
                    const response = await fetch('/api/cars', {
                        method: 'POST',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(batch)
                    });

                    const result = await response.json();

                    if (response.ok) {
                        const batchFailures = result.errors ? result.errors.length : 0;
                        const batchSuccess = batch.length - batchFailures;
                        
                        successCount += batchSuccess;
                        failCount += batchFailures;

                        if (result.errors && result.errors.length > 0) {
                             result.errors.forEach((err: any) => {
                                 setLogs(prev => [...prev, { type: 'error', message: `VIN ${err.vin}: ${err.error}` }]);
                             });
                        }
                    } else {
                        failCount += batch.length;
                        setLogs(prev => [...prev, { type: 'error', message: `Batch failed: ${result.message}` }]);
                    }

                } catch (error: any) {
                    failCount += batch.length;
                    setLogs(prev => [...prev, { type: 'error', message: `Network error: ${error.message}` }]);
                }

                // Update Progress
                const currentProgress = Math.min(100, Math.round(((i + batch.length) / totalCars) * 100));
                setProgress(currentProgress);
            }

            // Final Summary
            setLogs(prev => [
                { type: 'success', message: `----------------------------------------` },
                { type: 'success', message: `ประมวลผลเสร็จสิ้น: สำเร็จ ${successCount} คัน` },
                ...(failCount > 0 ? [{ type: 'error' as const, message: `ล้มเหลว ${failCount} คัน (ดูรายละเอียดด้านบน)` }] : [])
            ]);

            setIsUploading(false);
            if (successCount > 0) {
                onSuccess();
            }

        } catch (error: any) {
            console.error("Parse error", error);
            setLogs(prev => [...prev, { type: 'error', message: `เกิดข้อผิดพลาดในการอ่านไฟล์: ${error.message}` }]);
            setIsUploading(false);
        }
    };
    reader.readAsArrayBuffer(file);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-40 flex justify-center items-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">นำเข้าข้อมูล (Excel)</h2>
            <button type="button" onClick={onClose} disabled={isUploading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50">
                <XIcon />
            </button>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
            
            {/* Instructions */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-start">
                    <DocumentDownloadIcon />
                    <div className="ml-3">
                        <h3 className="text-sm font-bold text-blue-800 dark:text-blue-200">รูปแบบไฟล์ Excel ที่รองรับ</h3>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1 leading-relaxed">
                            1. ไฟล์นามสกุล <strong>.xlsx</strong> หรือ <strong>.xls</strong><br/>
                            2. หัวตารางอยู่ที่แถว <strong>B3 ถึง N3</strong><br/>
                            3. ข้อมูลเริ่มที่แถว <strong>B4</strong> เป็นต้นไป<br/>
                            4. คอลัมน์เรียงตามลำดับ: Dealer Code (B), Name, Model, VIN, F.Motor, R.Motor, Battery, Engine, Color, Type, Date, PO, Price (N)
                        </p>
                    </div>
                </div>
            </div>

            {/* File Input */}
            <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">เลือกไฟล์ Excel</label>
                <div className="flex items-center space-x-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        disabled={isUploading}
                        className="block w-full text-sm text-gray-500 dark:text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-md file:border-0
                            file:text-sm file:font-semibold
                            file:bg-sky-50 file:text-sky-700
                            dark:file:bg-sky-900/50 dark:file:text-sky-300
                            hover:file:bg-sky-100 dark:hover:file:bg-sky-800"
                    />
                </div>
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="mb-6">
                    <div className="flex justify-between mb-1">
                        <span className="text-sm font-medium text-sky-700 dark:text-sky-300">กำลังอัพโหลด...</span>
                        <span className="text-sm font-medium text-sky-700 dark:text-sky-300">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-sky-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {/* Logs Area */}
            {logs.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md p-4 h-48 overflow-y-auto">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">สถานะการทำงาน</h4>
                    <ul className="space-y-1">
                        {logs.map((log, idx) => (
                            <li key={idx} className={`text-sm flex items-start ${log.type === 'error' ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                                <span className="mr-2 mt-1">•</span>
                                <span>{log.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
          <button
            type="button"
            onClick={handleProcessAndUpload}
            disabled={!file || isUploading}
            className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-sky-600 text-base font-medium text-white hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isUploading ? (
                <>
                   <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    กำลังประมวลผล...
                </>
            ) : (
                <>
                    <ArchiveInIcon /> 
                    <span className="ml-2">เริ่มอัพโหลด</span>
                </>
            )}
          </button>
          <button
            type="button"
            onClick={logs.length > 0 ? resetModal : onClose}
            disabled={isUploading}
            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-500 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
          >
            {logs.length > 0 ? 'ล้างข้อมูล / เริ่มใหม่' : 'ยกเลิก'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
