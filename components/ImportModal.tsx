
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
  const [isDragOver, setIsDragOver] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          setFile(e.target.files[0]);
          setLogs([]);
          setProgress(0);
      }
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
           // Check if it's an excel file
           const droppedFile = e.dataTransfer.files[0];
           if (!droppedFile.name.match(/\.(xlsx|xls)$/)) {
               setLogs([{ type: 'error', message: 'กรุณาอัพโหลดไฟล์ .xlsx หรือ .xls เท่านั้น' }]);
               return;
           }
           setFile(droppedFile);
           setLogs([]);
           setProgress(0);
      }
  };

  const handleBrowseClick = () => {
      if (!isUploading) {
          fileInputRef.current?.click();
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
    <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-50 flex justify-center items-center p-4 transition-opacity animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-white/20 dark:border-gray-700 animate-scale-in">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white/50 dark:bg-gray-800/50 backdrop-blur-md rounded-t-3xl">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <ArchiveInIcon /> นำเข้าข้อมูล (Excel)
            </h2>
            <button type="button" onClick={onClose} disabled={isUploading} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 disabled:opacity-50 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <XIcon />
            </button>
        </div>
        
        <div className="p-8 flex-grow overflow-y-auto">
            
            {/* Drag & Drop Area */}
            <div 
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                className={`mb-8 border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                    isDragOver 
                    ? 'border-sky-500 bg-sky-50 dark:bg-sky-900/30 scale-[1.02]' 
                    : 'border-gray-300 dark:border-gray-600 hover:border-sky-400 hover:bg-gray-50 dark:hover:bg-gray-700/30'
                }`}
            >
                 <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx, .xls"
                    onChange={handleFileChange}
                    disabled={isUploading}
                    className="hidden"
                />
                
                {file ? (
                     <div className="animate-fade-in">
                        <div className="h-16 w-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <DocumentDownloadIcon />
                        </div>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">{file.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                        <p className="text-xs text-sky-600 dark:text-sky-400 mt-3 font-medium hover:underline">คลิกเพื่อเปลี่ยนไฟล์</p>
                     </div>
                ) : (
                    <div>
                        <div className="h-16 w-16 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <ArchiveInIcon />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">ลากไฟล์ Excel มาวางที่นี่</h3>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">หรือคลิกเพื่อเลือกไฟล์จากคอมพิวเตอร์</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">รองรับไฟล์ .xlsx, .xls (เริ่มอ่านข้อมูลจากแถว B4)</p>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            {progress > 0 && (
                <div className="mb-6 animate-fade-in">
                    <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium text-sky-700 dark:text-sky-300 flex items-center gap-2">
                            {isUploading && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                            {isUploading ? 'กำลังอัพโหลดข้อมูล...' : 'อัพโหลดเสร็จสิ้น'}
                        </span>
                        <span className="text-sm font-bold text-sky-700 dark:text-sky-300">{progress}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3 dark:bg-gray-700 overflow-hidden">
                        <div className="bg-gradient-to-r from-sky-400 to-indigo-500 h-3 rounded-full transition-all duration-300 shadow-lg shadow-sky-500/30" style={{ width: `${progress}%` }}></div>
                    </div>
                </div>
            )}

            {/* Logs Area */}
            {logs.length > 0 && (
                <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 h-48 overflow-y-auto custom-scrollbar animate-slide-up">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 sticky top-0 bg-gray-50 dark:bg-gray-900/90 pb-2 backdrop-blur-sm">สถานะการทำงาน</h4>
                    <ul className="space-y-2">
                        {logs.map((log, idx) => (
                            <li key={idx} className={`text-sm flex items-start p-2 rounded-lg ${log.type === 'error' ? 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300' : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'}`}>
                                <span className={`mr-2 mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${log.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'}`}></span>
                                <span>{log.message}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800/80 px-8 py-5 sm:flex sm:flex-row-reverse rounded-b-3xl border-t border-gray-100 dark:border-gray-700 backdrop-blur-md">
          <button
            type="button"
            onClick={handleProcessAndUpload}
            disabled={!file || isUploading}
            className="w-full inline-flex justify-center items-center rounded-xl border border-transparent shadow-lg shadow-sky-500/20 px-6 py-3 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-base font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:-translate-y-0.5"
          >
            {isUploading ? 'กำลังประมวลผล...' : 'เริ่มนำเข้าข้อมูล'}
          </button>
          <button
            type="button"
            onClick={logs.length > 0 ? resetModal : onClose}
            disabled={isUploading}
            className="mt-3 w-full inline-flex justify-center rounded-xl border border-gray-300 dark:border-gray-600 shadow-sm px-6 py-3 bg-white dark:bg-gray-700 text-base font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 transition-colors"
          >
            {logs.length > 0 ? 'ล้างข้อมูล' : 'ยกเลิก'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;
