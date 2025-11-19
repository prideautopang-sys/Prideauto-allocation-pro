import React, { useState } from 'react';
import { Car, Match, CarStatus } from '../types';
import { ArrowLeftIcon, DocumentDownloadIcon } from '../components/icons';
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
  
  const headers = [
      "Dealer Code", "Dealer Name", "Model", "VIN", "Front Motor No", "Rear Motor No", 
      "Battery No", "Engine No", "Color", "Car Type", "Allocation Date", "PO Type", "Price",
      "วันที่นำเข้าสต็อก", "สต็อกสาขา", "เลขสต็อก", "วันที่ตัดรถ", "Aging (Days)", "ชื่อลูกค้า",
      "เซลล์", "สถานะการขาย", "ทะเบียนรถ", "หมายเหตุ"
  ];

  const formatDataForExport = (data: Car[], matchesByCarId: Map<string, Match>): any[][] => {
    const today = new Date();
    return data.map(car => {
      const match = matchesByCarId.get(car.id!);
      
      const allocationDate = car.allocationDate ? new Date(car.allocationDate) : null;
      const aging = allocationDate 
        ? Math.floor((today.getTime() - allocationDate.getTime()) / (1000 * 60 * 60 * 24))
        : '';

      return [
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
        car.price,
        car.stockInDate ? new Date(car.stockInDate).toLocaleDateString('en-CA') : '',
        car.stockLocation || '',
        car.stockNo || '',
        match?.saleDate ? new Date(match.saleDate).toLocaleDateString('en-CA') : '',
        aging,
        match?.customerName || '',
        match?.salesperson || '',
        match?.status || '',
        match?.licensePlate || '',
        match?.notes || ''
      ];
    });
  };
  
  const handleExport = (type: 'allocated' | 'stock' | 'matching' | 'sold') => {
    let filteredCars: Car[] = [];
    let fileName = 'export';
    let dateField: keyof Car | undefined;
    let startDate: string = '';
    let endDate: string = '';

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
            const start = dates.soldStart ? new Date(dates.soldStart) : null;
            if(start) start.setHours(0,0,0,0);
            const end = dates.soldEnd ? new Date(dates.soldEnd) : null;
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

    if (dateField) { // Only apply date filtering for non-sold types here
        filteredCars = filteredCars.filter(car => {
            const dateValue = car[dateField as keyof Car];
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

    const dataToExport = [headers, ...formatDataForExport(filteredCars, matchesByCarId)];
    const finalFileName = `${fileName}_${new Date().toISOString().split('T')[0]}`;
    exportToXLSX(dataToExport, finalFileName);
  };
  
  const exportOptions = [
    {
      type: 'allocated' as const,
      title: 'All Allocated Cars',
      description: 'All cars in the system, filterable by Allocation Date.',
      dateLabel: 'Allocation Date',
      startName: 'allocatedStart',
      endName: 'allocatedEnd',
    },
    {
      type: 'stock' as const,
      title: 'In-Stock Cars',
      description: "Only cars with 'In Stock' status, filterable by Stock-In Date.",
      dateLabel: 'Stock-In Date',
      startName: 'stockStart',
      endName: 'stockEnd',
    },
    {
      type: 'matching' as const,
      title: 'Reserved (Matching) Cars',
      description: 'Only reserved cars, filterable by Stock-In Date.',
      dateLabel: 'Stock-In Date',
      startName: 'matchingStart',
      endName: 'matchingEnd',
    },
    {
      type: 'sold' as const,
      title: 'Sold Cars',
      description: 'Only sold cars, filterable by Sale Date.',
      dateLabel: 'Sale Date',
      startName: 'soldStart',
      endName: 'soldEnd',
    }
  ];


  return (
    <>
      <div className="mb-4">
        <button onClick={onBack} className="flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          <ArrowLeftIcon />
          <span className="ml-2">Back to Settings</span>
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md divide-y divide-gray-200 dark:divide-gray-700">
        {exportOptions.map(option => (
            <div key={option.type} className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                {/* Column 1: Title and Description */}
                <div className="md:col-span-5">
                    <h3 className="font-bold text-gray-900 dark:text-white">{option.title}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{option.description}</p>
                </div>

                {/* Column 2: Date Pickers */}
                <div className="md:col-span-5 grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor={`${option.startName}-date`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{option.dateLabel} (From)</label>
                        <input 
                            type="date" 
                            id={`${option.startName}-date`}
                            name={option.startName} 
                            value={dates[option.startName as keyof typeof dates]} 
                            onChange={handleDateChange} 
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        />
                    </div>
                    <div>
                        <label htmlFor={`${option.endName}-date`} className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{option.dateLabel} (To)</label>
                        <input 
                            type="date" 
                            id={`${option.endName}-date`}
                            name={option.endName} 
                            value={dates[option.endName as keyof typeof dates]} 
                            onChange={handleDateChange} 
                            className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" 
                        />
                    </div>
                </div>
                
                {/* Column 3: Export Button */}
                <div className="md:col-span-2 flex justify-start md:justify-end">
                    <button 
                        onClick={() => handleExport(option.type)} 
                        className="w-full md:w-auto inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
                    >
                        <DocumentDownloadIcon />
                        <span className="ml-2">Export</span>
                    </button>
                </div>
            </div>
        ))}
      </div>
    </>
  );
};

export default ExportPage;
