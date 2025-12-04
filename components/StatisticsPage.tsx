
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
    gradientClass: string;
    iconColor: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, gradientClass, iconColor }) => (
    <div className={`relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
        <div className={`absolute top-0 right-0 w-32 h-32 rounded-full transform translate-x-8 -translate-y-8 opacity-10 ${gradientClass}`}></div>
        <div className="flex justify-between items-start z-10">
            <div>
                 <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">{title}</p>
                 <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-2">{value.toLocaleString()}</p>
            </div>
            <div className={`p-3 rounded-xl ${gradientClass} ${iconColor} bg-opacity-20`}>
                {icon}
            </div>
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
    { title: CarStatus.WAITING_FOR_TRAILER, value: stats[CarStatus.WAITING_FOR_TRAILER] || 0, icon: <ClockIcon />, gradientClass: "bg-yellow-500", iconColor: "text-yellow-600" },
    { title: CarStatus.ON_TRAILER, value: stats[CarStatus.ON_TRAILER] || 0, icon: <TruckIcon />, gradientClass: "bg-orange-500", iconColor: "text-orange-600" },
    { title: CarStatus.UNLOADED, value: stats[CarStatus.UNLOADED] || 0, icon: <DownloadIcon />, gradientClass: "bg-cyan-500", iconColor: "text-cyan-600" },
    { title: CarStatus.IN_STOCK, value: stats[CarStatus.IN_STOCK] || 0, icon: <ArchiveIcon />, gradientClass: "bg-blue-500", iconColor: "text-blue-600" },
    { title: CarStatus.RESERVED, value: stats[CarStatus.RESERVED] || 0, icon: <BookmarkIcon />, gradientClass: "bg-purple-500", iconColor: "text-purple-600" },
    { title: CarStatus.SOLD, value: stats[CarStatus.SOLD] || 0, icon: <CheckCircleIcon />, gradientClass: "bg-green-500", iconColor: "text-green-600" },
  ];

  return (
    <div className="p-4 sm:p-0 space-y-8">
        
        <div className="bg-gradient-to-r from-sky-500 to-indigo-600 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
             <div className="relative z-10 flex items-center gap-6">
                <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                    <CollectionIcon className="h-10 w-10 text-white" />
                </div>
                <div>
                    <p className="text-sky-100 font-medium text-lg">รถยนต์ทั้งหมดในระบบ</p>
                    <p className="text-5xl font-extrabold mt-1 tracking-tight">{(stats.total || 0).toLocaleString()}</p>
                </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-black opacity-10 rounded-full transform -translate-x-8 translate-y-8"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCardsData.map(data => <StatCard key={data.title} {...data} />)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">Trend Analysis</h3>
                     <div className="bg-gray-100 dark:bg-gray-700 p-1 rounded-xl flex">
                        <button onClick={() => setTimeframe('monthly')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === 'monthly' ? 'bg-white dark:bg-gray-600 text-sky-600 dark:text-sky-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Monthly</button>
                        <button onClick={() => setTimeframe('yearly')} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${timeframe === 'yearly' ? 'bg-white dark:bg-gray-600 text-sky-600 dark:text-sky-300 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}>Yearly</button>
                     </div>
                </div>
                <div className="h-80 w-full"> <LineChart chartData={lineChartData} /> </div>
            </div>

             <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                <div className="flex justify-between items-center mb-6">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">Current Stock by Model</h3>
                </div>
                <div className="h-80 w-full relative">
                   {stockByModelData.labels.length > 0 ? (
                        <BarChart chartData={stockByModelData} />
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">No cars currently in stock.</div>
                    )}
                </div>
            </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b border-gray-100 dark:border-gray-700 pb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sales Performance Analysis</h3>
                    <input 
                    type="month" 
                    value={salesAnalysisDate}
                    onChange={(e) => setSalesAnalysisDate(e.target.value)}
                    className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                    <h4 className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Sales by Model</h4>
                    <div className="h-64 w-full relative">
                        {salesPerformanceData.modelsPieChart.labels.length > 0 ? (
                            <PieChart chartData={salesPerformanceData.modelsPieChart} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No sales data for this month.</div>
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="text-center text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Sales by Salesperson</h4>
                        <div className="h-64 w-full relative">
                        {salesPerformanceData.salespersonsPieChart.labels.length > 0 ? (
                            <PieChart chartData={salesPerformanceData.salespersonsPieChart} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">No sales data for this month.</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default StatisticsPage;
