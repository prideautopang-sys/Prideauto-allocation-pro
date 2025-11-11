import React from 'react';
import { CarStatus } from '../types';
import { ArchiveIcon, BookmarkIcon, CheckCircleIcon, ClockIcon, CollectionIcon, DownloadIcon, TruckIcon } from './icons';

interface StatisticsPageProps {
  stats: Record<CarStatus | 'total', number>;
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


const StatisticsPage: React.FC<StatisticsPageProps> = ({ stats }) => {
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
        
        {/* Total card */}
        <div className="mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 flex items-center space-x-6 border-l-4 border-sky-500">
                <div className="flex-shrink-0 bg-sky-100 dark:bg-sky-900/50 p-4 rounded-full">
                    <CollectionIcon />
                </div>
                <div>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">รถยนต์ทั้งหมดในระบบ</p>
                    <p className="text-5xl font-extrabold text-sky-600 dark:text-sky-400 mt-1">
                        {(stats.total || 0).toLocaleString()}
                    </p>
                </div>
            </div>
        </div>

        {/* Status cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCardsData.map(data => (
                <StatCard key={data.title} {...data} />
            ))}
        </div>
    </div>
  );
};

export default StatisticsPage;