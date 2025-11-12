import React, { useState, useMemo } from 'react';
import { Car, Match, CarStatus } from '../types';
import { ArrowLeftIcon } from '../components/icons';
import { exportToXLSX } from '../lib/export';

interface ExportPageProps {
  cars: Car[];
  matches: Match[];
  onBack: () => void;
}

const ExportPage: React.FC<ExportPageProps> = ({ cars, matches, onBack }) => {
  const [dates, setDates] = useState({
    allocatedStart: '',
    allocatedEnd: '',
    stockStart: '',
    stockEnd: '',
    matchingStart: '',
    matchingEnd: '',
    soldStart: '',
    soldEnd: '',
  });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDates(prev => ({ ...prev, [name]: value }));
  };
  
  const headers = ["Dealer Code", "Dealer Name", "Model", "VIN", "Front Motor No", "Rear Motor No", "Battery No", "Engine No", "Color", "Car Type", "Allocation Date", "PO Type", "Price"];

  const formatDataForExport = (data: Car[]): any[][] => {
    return data.map(car => [
      car.dealerCode,
      car.dealerName,
      car.model,
      car.vin,
      car.frontMotorNo,
      car.rearMotorNo,
      car.batteryNo,
      car.engineNo,
      car.color,
      car.carType,
      car.allocationDate ? new Date(car.allocationDate).toLocaleDateString('en-CA') : '', // YYYY-MM-DD
      car.poType,
      car.price
    ]);
  };
  
  const handleExport = (type: 'allocated' | 'stock' | 'matching' | 'sold') => {
    let filteredCars: Car[] = [];
    let fileName = 'export';
    let dateField: keyof Car = 'allocationDate';
    let startDate: string = '';
    let endDate: string = '';

    // FIX: Explicitly type the Map to resolve a TypeScript type inference issue.
    const matchesByCarId = new Map<string, Match>(matches.map(m => [m.carId, m]));

    switch (type) {
        case 'allocated':
            filteredCars = cars;
            fileName = `allocated_cars`;
            dateField = 'allocationDate';
            startDate = dates.allocatedStart;
            endDate = dates.allocatedEnd;
            break;
        case 'stock':
            filteredCars = cars.filter(c => c.status === CarStatus.IN_STOCK);
            fileName = `stock_cars`;
            dateField = 'stockInDate';
            startDate = dates.stockStart;
            endDate = dates.stockEnd;
            break;
        case 'matching':
            filteredCars = cars.filter(c => c.status === CarStatus.RESERVED);
            fileName = `matching_cars`;
            dateField = 'stockInDate';
            startDate = dates.matchingStart;
            endDate = dates.matchingEnd;
            break;
        case 'sold':
            const soldCars = cars.filter(c => c.status === CarStatus.SOLD);
            const start = startDate ? new Date(dates.soldStart) : null;
            if(start) start.setHours(0,0,0,0);
            const end = endDate ? new Date(dates.soldEnd) : null;
            if(end) end.setHours(23,59,59,999);

            filteredCars = soldCars.filter(car => {
                const match = matchesByCarId.get(car.id!);
                if (!match?.saleDate) return false;
                if (!dates.soldStart && !dates.soldEnd) return true;
                const saleDate = new Date(match.saleDate);
                return (!start || saleDate >= start) && (!end || saleDate <= end);
            });

            fileName = `sold_cars`;
            break;
    }

    if (type !== 'sold') {
        filteredCars = filteredCars.filter(car => {
            const dateValue = car[dateField];
            if (!dateValue || typeof dateValue !== 'string') return false;
            if (!startDate && !endDate) return true;
            const carDate = new Date(dateValue);
            const start = startDate ? new Date(startDate) : null;
            if(start) start.setHours(0,0,0,0);
            const end = endDate ? new Date(endDate) : null;
            if(end) end.setHours(23,59,59,999);
            return (!start || carDate >= start) && (!end || carDate <= end);
        });
    }

    if (filteredCars.length === 0) {
        alert('ไม่พบข้อมูลตามเงื่อนไขที่เลือก');
        return;
    }

    const dataToExport = [headers, ...formatDataForExport(filteredCars)];
    const finalFileName = `${fileName}_${new Date().toISOString().split('T')[0]}`;
    exportToXLSX(dataToExport, finalFileName);
  };
  
  const ExportCard: React.FC<{
      title: string;
      description: string;
      dateLabel: string;
      onExport: () => void;
      startDate: string;
      endDate: string;
      onDateChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
      startName: string;
      endName: string;
  }> = ({ title, description, dateLabel, onExport, startDate, endDate, onDateChange, startName, endName }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">{description}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{dateLabel} (เริ่มต้น)</label>
                <input type="date" name={startName} value={startDate} onChange={onDateChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{dateLabel} (สิ้นสุด)</label>
                <input type="date" name={endName} value={endDate} onChange={onDateChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            </div>
        </div>
        <div className="flex justify-end">
            <button onClick={onExport} className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                Export to XLSX
            </button>
        </div>
    </div>
  );


  return (
    <>
      <div className="mb-4">
        <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <ArrowLeftIcon />
          <span className="ml-2">Back to Settings</span>
        </button>
      </div>
      <div className="space-y-6">
        <ExportCard 
            title="รถที่ Allocation"
            description="Export รถทุกคันในระบบ (รวมทุกสถานะ) โดยกรองตามวันที่ได้รับ Allocation"
            dateLabel="Allocation Date"
            onExport={() => handleExport('allocated')}
            startDate={dates.allocatedStart}
            endDate={dates.allocatedEnd}
            onDateChange={handleDateChange}
            startName="allocatedStart"
            endName="allocatedEnd"
        />
        <ExportCard 
            title="รถใน Stock"
            description="Export เฉพาะรถที่อยู่ในสต็อก (สถานะ In Stock) โดยกรองตามวันที่นำเข้าสต็อก"
            dateLabel="Stock-In Date"
            onExport={() => handleExport('stock')}
            startDate={dates.stockStart}
            endDate={dates.stockEnd}
            onDateChange={handleDateChange}
            startName="stockStart"
            endName="stockEnd"
        />
        <ExportCard 
            title="รถที่ Matching"
            description="Export เฉพาะรถที่ถูกจับคู่จองแล้ว (สถานะ Reserved) โดยกรองตามวันที่นำเข้าสต็อก"
            dateLabel="Stock-In Date"
            onExport={() => handleExport('matching')}
            startDate={dates.matchingStart}
            endDate={dates.matchingEnd}
            onDateChange={handleDateChange}
            startName="matchingStart"
            endName="matchingEnd"
        />
        <ExportCard 
            title="รถที่ตัดขายแล้ว"
            description="Export เฉพาะรถที่ขายแล้ว (สถานะ Sold) โดยกรองตามวันที่ตัดขาย"
            dateLabel="Sale Date"
            onExport={() => handleExport('sold')}
            startDate={dates.soldStart}
            endDate={dates.soldEnd}
            onDateChange={handleDateChange}
            startName="soldStart"
            endName="soldEnd"
        />
      </div>
    </>
  );
};

export default ExportPage;
