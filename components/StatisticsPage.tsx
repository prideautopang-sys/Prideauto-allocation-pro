import React, { useState, useMemo } from 'react';
import { Car, Match, CarStatus, MatchStatus } from '../types';
import { ArchiveIcon, BookmarkIcon, CheckCircleIcon, ClockIcon, CollectionIcon, DownloadIcon, TruckIcon } from './icons';
import LineChart from './LineChart';
import PieChart from './PieChart';
import BarChart from './BarChart';

interface StatisticsPageProps {
  stats: Record<CarStatus | 'total', number>;
  cars: Car[];
  matches: Match[];
}

interface StatCardProps {
    title: string;
    value: number;
    icon: React.ReactNode;
    colorClass: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, colorClass }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center justify-between transition-all duration-300 hover:shadow-xl hover:scale-105 ${colorClass}`}>
        <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
            <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{value.toLocaleString()}</p>
        </div>
        <div className="opacity-80">
            {icon}
        </div>
    </div>
);


const StatisticsPage: React.FC<StatisticsPageProps> = ({ stats, cars, matches }) => {
  const [timeframe, setTimeframe] = useState<'monthly' | 'yearly'>('monthly');
  const [salesAnalysisDate, setSalesAnalysisDate] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format

  const lineChartData = useMemo(() => {
    const dataMap = new Map<string, { allocated: number; stocked: number; sold: number }>();
    const now = new Date();

    const labels = Array.from({ length: timeframe === 'monthly' ? 12 : 5 }).map((_, i) => {
      let label;
      if (timeframe === 'monthly') {
        const date = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        label = date.toLocaleString('default', { month: 'short', year: '2-digit' });
      } else { // yearly
        label = String(now.getFullYear() - (4 - i));
      }
      dataMap.set(label, { allocated: 0, stocked: 0, sold: 0 });
      return label;
    });

    cars.forEach(car => {
      if (car.allocationDate) {
        const date = new Date(car.allocationDate);
        const label = timeframe === 'monthly'
          ? date.toLocaleString('default', { month: 'short', year: '2-digit' })
          : String(date.getFullYear());
        if (dataMap.has(label)) dataMap.get(label)!.allocated++;
      }
      if (car.stockInDate) {
        const date = new Date(car.stockInDate);
        const label = timeframe === 'monthly'
          ? date.toLocaleString('default', { month: 'short', year: '2-digit' })
          : String(date.getFullYear());
        if (dataMap.has(label)) dataMap.get(label)!.stocked++;
      }
    });

    matches
      .filter(match => match.status === MatchStatus.DELIVERED && match.saleDate)
      .forEach(match => {
        const date = new Date(match.saleDate!);
        const label = timeframe === 'monthly'
          ? date.toLocaleString('default', { month: 'short', year: '2-digit' })
          : String(date.getFullYear());
        if (dataMap.has(label)) dataMap.get(label)!.sold++;
      });

    const allocatedData = labels.map(label => dataMap.get(label)!.allocated);
    const stockedData = labels.map(label => dataMap.get(label)!.stocked);
    const soldData = labels.map(label => dataMap.get(label)!.sold);

    return {
      labels,
      datasets: [
        { label: 'Allocated', data: allocatedData, borderColor: 'rgb(59, 130, 246)', backgroundColor: 'rgba(59, 130, 246, 0.5)', tension: 0.1 },
        { label: 'Stocked', data: stockedData, borderColor: 'rgb(139, 92, 246)', backgroundColor: 'rgba(139, 92, 246, 0.5)', tension: 0.1 },
        { label: 'Sold', data: soldData, borderColor: 'rgb(22, 163, 74)', backgroundColor: 'rgba(22, 163, 74, 0.5)', tension: 0.1 },
      ],
    };
  }, [cars, matches, timeframe]);

  const salesPerformanceData = useMemo(() => {
    // FIX: Explicitly type the Map and use non-null assertion for car ID to fix type inference issues.
    const carsById = new Map<string, Car>(cars.map(c => [c.id!, c]));
    const [year, month] = salesAnalysisDate.split('-').map(Number);
    
    const relevantMatches = matches.filter(match => {
        if (match.status !== MatchStatus.DELIVERED || !match.saleDate) return false;
        const saleDate = new Date(match.saleDate);
        return saleDate.getFullYear() === year && saleDate.getMonth() === month - 1;
    });

    const getAllModels = () => {
        const counts = new Map<string, number>();
        relevantMatches.forEach(match => {
            const itemKey = carsById.get(match.carId)?.model;
            if (itemKey) {
                counts.set(itemKey, (counts.get(itemKey) || 0) + 1);
            }
        });

        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        
        return {
            labels: sorted.map(item => item[0]),
            data: sorted.map(item => item[1]),
        };
    };

    const getAllSalespersons = () => {
        const counts = new Map<string, number>();
        relevantMatches.forEach(match => {
            const itemKey = match.salesperson;
            if (itemKey) {
                counts.set(itemKey, (counts.get(itemKey) || 0) + 1);
            }
        });
        const sorted = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
        return {
            labels: sorted.map(item => item[0]),
            data: sorted.map(item => item[1]),
        };
    };

    const allModels = getAllModels();
    const allSalespersons = getAllSalespersons();

    return {
        modelsPieChart: {
            labels: allModels.labels,
            datasets: [{ label: 'Units Sold', data: allModels.data }]
        },
        salespersonsPieChart: {
            labels: allSalespersons.labels,
            datasets: [{ 
              label: 'Units Sold', 
              data: allSalespersons.data,
            }]
        }
    };
  }, [cars, matches, salesAnalysisDate]);
  
  const stockByModelData = useMemo(() => {
    const stockCars = cars.filter(car => car.status === CarStatus.IN_STOCK);
    
    const counts = new Map<string, number>();
    stockCars.forEach(car => {
        const model = car.model;
        if (model) {
            counts.set(model, (counts.get(model) || 0) + 1);
        }
    });

    const sorted = Array.from(counts.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    
    return {
        labels: sorted.map(item => item[0]),
        datasets: [{
            label: 'Cars in Stock',
            data: sorted.map(item => item[1]),
            backgroundColor: 'rgba(54, 162, 235, 0.7)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1,
        }],
    };
  }, [cars]);


  const statCardsData = [
    { title: CarStatus.WAITING_FOR_TRAILER, value: stats[CarStatus.WAITING_FOR_TRAILER], icon: <ClockIcon />, colorClass: "border-l-4 border-yellow-500" },
    { title: CarStatus.ON_TRAILER, value: stats[CarStatus.ON_TRAILER], icon: <TruckIcon />, colorClass: "border-l-4 border-orange-500" },
    { title: CarStatus.UNLOADED, value: stats[CarStatus.UNLOADED], icon: <DownloadIcon />, colorClass: "border-l-4 border-cyan-500" },
    { title: CarStatus.IN_STOCK, value: stats[CarStatus.IN_STOCK], icon: <ArchiveIcon />, colorClass: "border-l-4 border-blue-500" },
    { title: CarStatus.RESERVED, value: stats[CarStatus.RESERVED], icon: <BookmarkIcon />, colorClass: "border-l-4 border-purple-500" },
    { title: CarStatus.SOLD, value: stats[CarStatus.SOLD], icon: <CheckCircleIcon />, colorClass: "border-l-4 border-green-500" },
  ];

  return (
    <div className="p-4 sm:p-0">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">สรุปภาพรวมสต็อกรถยนต์</h2>
        
        <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center space-x-6 border-l-4 border-sky-500">
                <div className="flex-shrink-0 bg-sky-100 dark:bg-sky-900/50 p-4 rounded-full"> <CollectionIcon /> </div>
                <div>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">รถยนต์ทั้งหมดในระบบ</p>
                    <p className="text-5xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">{(stats.total || 0).toLocaleString()}</p>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCardsData.map(data => <StatCard key={data.title} {...data} />)}
        </div>

        <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Analysis</h3>
                     <div className="flex space-x-1 bg-gray-200 dark:bg-gray-700 p-1 rounded-lg self-start sm:self-center">
                        <button onClick={() => setTimeframe('monthly')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${timeframe === 'monthly' ? 'bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>Monthly</button>
                        <button onClick={() => setTimeframe('yearly')} className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${timeframe === 'yearly' ? 'bg-white dark:bg-gray-900 text-sky-600 dark:text-sky-400 shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-300/50 dark:hover:bg-gray-600/50'}`}>Yearly</button>
                     </div>
                </div>
                <div className="h-80 w-full"> <LineChart chartData={lineChartData} /> </div>
            </div>
        </div>
        
        <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Performance Analysis</h3>
                     <input 
                        type="month" 
                        value={salesAnalysisDate}
                        onChange={(e) => setSalesAnalysisDate(e.target.value)}
                        className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg text-sm font-medium text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500"
                     />
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-4">
                    <div>
                        <h4 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-2">Sales by Model</h4>
                        <div className="h-80 w-full relative">
                           {salesPerformanceData.modelsPieChart.labels.length > 0 ? (
                                <PieChart chartData={salesPerformanceData.modelsPieChart} />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">No sales data for this month.</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-center font-semibold text-gray-700 dark:text-gray-300 mb-2">Sales by Salesperson</h4>
                         <div className="h-80 w-full relative">
                           {salesPerformanceData.salespersonsPieChart.labels.length > 0 ? (
                                <PieChart chartData={salesPerformanceData.salespersonsPieChart} />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-gray-500">No sales data for this month.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <div className="mt-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Current Stock by Model</h3>
                </div>
                <div className="h-96 w-full relative">
                   {stockByModelData.labels.length > 0 ? (
                        <BarChart chartData={stockByModelData} />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">No cars currently in stock.</div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default StatisticsPage;