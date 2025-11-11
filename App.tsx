import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Car, CarStatus, Match, MatchStatus } from './types';
import CarTable from './components/CarTable';
import MatchingTable from './components/MatchingTable';
import SoldCarTable from './components/SoldCarTable';
import CarFormModal from './components/CarFormModal';
import MatchingFormModal from './components/MatchingFormModal';
import ImportModal from './components/ImportModal';
import AddFromAllocationModal from './components/AddFromAllocationModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ConfirmMatchDeleteModal from './components/ConfirmMatchDeleteModal';
import MultiSelectFilter from './components/MultiSelectFilter';
import StatisticsPage from './components/StatisticsPage';
import { PlusIcon, ClipboardPlusIcon, CarIcon, ChartBarIcon, CollectionIcon, ArchiveIcon, LinkIcon, ShoppingCartIcon, FilterIcon, CalendarIcon } from './components/icons';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';


type SortableKeys = keyof Car;
type FilterKeys = 'dealerCode' | 'model' | 'color' | 'carType' | 'poType' | 'stockLocation' | 'status';
type View = 'allocation' | 'stock' | 'matching' | 'stats' | 'sold';


const App: React.FC = () => {
  const { user, token, logout, isLoading: isAuthLoading } = useAuth();
  
  const [cars, setCars] = useState<Car[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddFromAllocationModalOpen, setIsAddFromAllocationModalOpen] = useState(false);
  const [isMatchFormModalOpen, setIsMatchFormModalOpen] = useState(false);
  
  // Editing/Deleting State
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [deleteRequestContext, setDeleteRequestContext] = useState<View | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [activeView, setActiveView] = useState<View>('allocation');
  
  // Filters
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [stagedSearchTerm, setStagedSearchTerm] = useState('');
  const [stagedStatus, setStagedStatus] = useState('All');
  const [stagedAllocationType, setStagedAllocationType] = useState('All');
  const [stagedDate, setStagedDate] = useState('');

  // Active Filters
  const [activeSearchTerm, setActiveSearchTerm] = useState('');
  const [activeStatus, setActiveStatus] = useState('All');
  const [activeAllocationType, setActiveAllocationType] = useState('All');
  const [activeDate, setActiveDate] = useState('');

  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({
    key: 'allocationDate', direction: 'descending',
  });
    
  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const [carsRes, matchesRes] = await Promise.all([
        fetch('/api/cars', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/matches', { headers: { 'Authorization': `Bearer ${token}` } }),
      ]);
      if (!carsRes.ok || !matchesRes.ok) throw new Error('Failed to fetch data');
      
      const carsData = await carsRes.json();
      const matchesData = await matchesRes.json();
      
      setCars(carsData);
      setMatches(matchesData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Car CRUD
  const handleOpenAddCarModal = () => {
    setEditingCar(null);
    setIsFormModalOpen(true);
  };
  
  const handleOpenEditCarModal = (car: Car) => {
    setEditingCar(car);
    setIsFormModalOpen(true);
  };

  const handleSaveCar = async (car: Car) => {
    const isEditing = !!editingCar;
    const url = isEditing ? `/api/cars/${car.id}` : '/api/cars';
    const method = isEditing ? 'PUT' : 'POST';

    try {
        const response = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(car)
        });
        if (!response.ok) {
            const err = await response.json();
            throw new Error(err.message || 'Failed to save car');
        }
        await fetchData(); // Refetch all data
        setIsFormModalOpen(false);
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    }
  };
  
  const handleDeleteRequest = (car: Car) => {
    setCarToDelete(car);
    setDeleteRequestContext(activeView);
  };

  const handleConfirmDelete = async () => {
    if (!carToDelete || !deleteRequestContext) return;

    try {
        if (deleteRequestContext === 'stock') {
            // "Delete" from stock means resetting its stock status
            const updatedCar = { ...carToDelete, status: CarStatus.UNLOADED, stockInDate: undefined, stockLocation: undefined };
            const response = await fetch(`/api/cars/${carToDelete.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedCar)
            });
            if (!response.ok) throw new Error('Failed to remove car from stock');

        } else if (deleteRequestContext === 'allocation') {
            // Deleting from allocation is a permanent delete.
            const response = await fetch(`/api/cars/${carToDelete.id}`, { 
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            if (!response.ok) {
                 if(response.status === 403) throw new Error('Permission Denied. Admins cannot delete cars.');
                 throw new Error('Failed to delete car');
            }
        }
        await fetchData();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    } finally {
        setCarToDelete(null);
        setDeleteRequestContext(null);
    }
  };

  const handleCancelDelete = () => {
    setCarToDelete(null);
    setDeleteRequestContext(null);
  };

  // Match CRUD
  const handleOpenAddMatchModal = () => {
    setEditingMatch(null);
    setIsMatchFormModalOpen(true);
  };

  const handleOpenEditMatchModal = (match: Match) => {
    setEditingMatch(match);
    setIsMatchFormModalOpen(true);
  };
  
  const handleSaveMatch = async (match: Match) => {
    const isEditing = !!editingMatch;
    const url = isEditing ? `/api/matches/${match.id}` : '/api/matches';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      // First, save the match
      const matchResponse = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(match)
      });
      if (!matchResponse.ok) throw new Error('Failed to save match');

      // Then, update the car's status based on the match
      const newCarStatus = (match.status === MatchStatus.DELIVERED && match.saleDate)
          ? CarStatus.SOLD 
          : CarStatus.RESERVED;
      
      const carToUpdate = cars.find(c => c.id === match.carId);
      if (carToUpdate && carToUpdate.status !== newCarStatus) {
          const carResponse = await fetch(`/api/cars/${match.carId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ ...carToUpdate, status: newCarStatus })
          });
          if (!carResponse.ok) throw new Error('Failed to update car status');
      }

      await fetchData(); // Refetch all data
      setIsMatchFormModalOpen(false);

    } catch (error: any) {
        alert(`Error: ${error.message}`);
    }
  };
  
  const handleDeleteMatchRequest = (match: Match) => {
    setMatchToDelete(match);
  };

  const handleConfirmDeleteMatch = async () => {
    if (!matchToDelete) return;

    try {
        // Delete the match
        const matchResponse = await fetch(`/api/matches/${matchToDelete.id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!matchResponse.ok) throw new Error('Failed to delete match');

        // Revert car status to In Stock
        const carToUpdate = cars.find(c => c.id === matchToDelete.carId);
        if (carToUpdate) {
            const carResponse = await fetch(`/api/cars/${matchToDelete.carId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ ...carToUpdate, status: CarStatus.IN_STOCK })
            });
            if (!carResponse.ok) throw new Error('Failed to update car status');
        }
        
        await fetchData();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    } finally {
        setMatchToDelete(null);
    }
  };

  const handleCancelDeleteMatch = () => {
    setMatchToDelete(null);
  };

  // Other Modals
  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsImportModalOpen(false);
    setIsAddFromAllocationModalOpen(false);
    setIsMatchFormModalOpen(false);
    setEditingCar(null);
    setEditingMatch(null);
  };

  const handleImportCars = async (newCars: Car[]) => {
    let successCount = 0;
    let duplicateCount = 0;

    for (const car of newCars) {
        const response = await fetch('/api/cars', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(car)
        });
        if (response.ok) {
            successCount++;
        } else if (response.status === 409) {
            duplicateCount++;
        }
    }
    
    let message = `เพิ่มรถใหม่สำเร็จ ${successCount} รายการ`;
    if (duplicateCount > 0) {
      message += `\nข้าม ${duplicateCount} รายการเนื่องจากเลขตัวถังซ้ำกับรถที่มีอยู่แล้วในระบบ`;
    }
    alert(message);

    if (successCount > 0) {
      await fetchData();
    }
    handleCloseModals();
  };
  
  const handleAddFromAllocation = async (carIds: string[], stockInDate: string, stockLocation: 'มหาสารคาม' | 'กาฬสินธุ์') => {
      const updatePromises = cars
        .filter(car => carIds.includes(car.id))
        .map(car => {
          const updatedCar = { ...car, stockInDate, stockLocation, status: CarStatus.IN_STOCK };
          return fetch(`/api/cars/${car.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updatedCar)
          });
        });
      
      try {
        await Promise.all(updatePromises);
        await fetchData();
        handleCloseModals();
      } catch (error) {
        alert("An error occurred while adding cars to stock.");
      }
    };

  // Filtering and Sorting
  const handleApplyFilters = () => {
    setActiveSearchTerm(stagedSearchTerm);
    setActiveStatus(stagedStatus);
    setActiveAllocationType(stagedAllocationType);
    setActiveDate(stagedDate);
  }

  const handleClearFilters = () => {
      setStagedSearchTerm('');
      setStagedStatus('All');
      setStagedAllocationType('All');
      setStagedDate('');
      
      setActiveSearchTerm('');
      setActiveStatus('All');
      setActiveAllocationType('All');
      setActiveDate('');
  };

  // Memoized Data for Views
  const allocatedCars = useMemo(() => cars, [cars]);
  const stockCars = useMemo(() => cars.filter(car => car.stockInDate && car.status !== CarStatus.SOLD), [cars]);
  const soldCars = useMemo(() => cars.filter(car => car.status === CarStatus.SOLD), [cars]);

  const soldData = useMemo(() => {
    const matchesByCarId = new Map(matches.map(m => [m.carId, m]));
    return soldCars.map(car => ({
      car,
      match: matchesByCarId.get(car.id)
    })).filter(item => item.match);
  }, [soldCars, matches]);
  
  const carsNotInStock = useMemo(() => cars.filter(car => !car.stockInDate), [cars]);
  const carsInStockForMatching = useMemo(() => cars.filter(c => c.status === CarStatus.IN_STOCK), [cars]);

  const processedCars = useMemo(() => {
    if (!['allocation', 'stock'].includes(activeView)) return [];
    const sourceCars = activeView === 'stock' ? stockCars : allocatedCars;
    
    let filtered = sourceCars.filter(car => {
      const searchLower = activeSearchTerm.toLowerCase();
      const matchesSearch = activeSearchTerm ? (
        Object.values(car).some(val => String(val).toLowerCase().includes(searchLower))
      ) : true;

      const matchesStatus = activeStatus === 'All' || car.status === activeStatus;
      const matchesAllocationType = activeAllocationType === 'All' || car.poType === activeAllocationType;

      const dateFieldToFilter = activeView === 'stock' ? car.stockInDate : car.allocationDate;
      const matchesDate = !activeDate || (dateFieldToFilter && dateFieldToFilter.startsWith(activeDate));

      return matchesSearch && matchesStatus && matchesAllocationType && matchesDate;
    });

    const { key, direction } = sortConfig;
    filtered.sort((a, b) => {
        const valA = a[key];
        const valB = b[key];
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;

        let comparison = 0;
        if (key === 'allocationDate' || key === 'stockInDate') {
            comparison = new Date(valA as string).getTime() - new Date(valB as string).getTime();
        } else if (key === 'price') {
            comparison = (valA as number) - (valB as number);
        } else {
            comparison = String(valA).localeCompare(String(valB));
        }
        return direction === 'ascending' ? comparison : -comparison;
    });
    return filtered;
  }, [allocatedCars, stockCars, activeSearchTerm, activeStatus, activeAllocationType, activeDate, sortConfig, activeView]);
  

  const stats = useMemo(() => {
    const carStats = cars.reduce((acc, car) => {
        acc[car.status] = (acc[car.status] || 0) + 1;
        return acc;
    }, {} as Record<CarStatus, number>);

    return {
      total: cars.length,
      [CarStatus.WAITING_FOR_TRAILER]: carStats[CarStatus.WAITING_FOR_TRAILER] || 0,
      [CarStatus.ON_TRAILER]: carStats[CarStatus.ON_TRAILER] || 0,
      [CarStatus.UNLOADED]: carStats[CarStatus.UNLOADED] || 0,
      [CarStatus.IN_STOCK]: carStats[CarStatus.IN_STOCK] || 0,
      [CarStatus.RESERVED]: carStats[CarStatus.RESERVED] || 0,
      [CarStatus.SOLD]: carStats[CarStatus.SOLD] || 0,
    };
  }, [cars]);


  const NavButton: React.FC<{view: View, label: string, icon: React.ReactNode}> = ({ view, label, icon }) => (
    <button
      onClick={() => setActiveView(view)}
      className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        activeView === view
          ? 'bg-sky-100 text-sky-700 dark:bg-sky-800/50 dark:text-sky-300'
          : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
  
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">Loading...</div>;
  }
  
  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
        <div className="py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <div className="text-sky-600 dark:text-sky-400">
                        <CarIcon />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Car Allocation</h1>
                </div>
                <div className="flex items-center space-x-2">
                    {user.role !== 'user' && (
                    <>
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    >
                        <ClipboardPlusIcon /> <span className="ml-2 hidden sm:block">Import Excel</span>
                    </button>
                    <button
                        onClick={handleOpenAddCarModal}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                    >
                        <PlusIcon /> <span className="ml-2 hidden sm:block">Add New Car</span>
                    </button>
                    </>
                    )}
                    <button onClick={logout} className="text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white ml-2 sm:ml-4">Logout</button>
                </div>
            </div>
        </div>
         <nav className="px-4 sm:px-6 lg:px-8 border-t border-gray-200 dark:border-gray-700">
            <div className="flex space-x-2 py-2 overflow-x-auto">
                <NavButton view="allocation" label={`Car allocation (${allocatedCars.length})`} icon={<CollectionIcon className="h-5 w-5"/>} />
                <NavButton view="stock" label={`Stock (${stockCars.length})`} icon={<ArchiveIcon className="h-5 w-5"/>} />
                <NavButton view="matching" label={`Matching (${matches.length})`} icon={<LinkIcon />} />
                <NavButton view="sold" label={`Sold Cars (${soldCars.length})`} icon={<ShoppingCartIcon />} />
                <NavButton view="stats" label="Statistics" icon={<ChartBarIcon />} />
            </div>
        </nav>
      </header>

      <main className="py-6 px-4 sm:px-6 lg:px-8">
            {isLoading ? <div className="text-center">Loading data...</div> : error ? <div className="text-center text-red-500">Error: {error}</div> : (
              <>
              {(activeView === 'allocation' || activeView === 'stock') && (
                <>
                <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                    {/* Main Filter Controls */}
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        {/* Search Input */}
                        <div className="lg:col-span-2">
                             <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                             <input type="text" name="search" id="search" placeholder="VIN, Dealer, Model..." value={stagedSearchTerm} onChange={(e) => setStagedSearchTerm(e.target.value)}
                                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                        </div>
                        {/* Status Filter */}
                        <div>
                             <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                             <select id="status" name="status" value={stagedStatus} onChange={e => setStagedStatus(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option>All</option>
                                {Object.values(CarStatus).map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                        </div>
                        {/* Allocation Type Filter */}
                        <div>
                             <label htmlFor="allocationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Allocation Type</label>
                             <select id="allocationType" name="allocationType" value={stagedAllocationType} onChange={e => setStagedAllocationType(e.target.value)} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                                <option>All</option>
                                {[...new Set(cars.map(c => c.poType).filter(Boolean))].map(pt => <option key={pt} value={pt}>{pt}</option>)}
                            </select>
                        </div>
                         {/* Date Range Filter */}
                        <div className="relative">
                             <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date Range</label>
                             <div className="relative mt-1">
                                <input type="date" name="dateRange" id="dateRange" value={stagedDate} onChange={e => setStagedDate(e.target.value)} className="block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 pl-3 pr-10 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <CalendarIcon/>
                                </div>
                             </div>
                        </div>
                     </div>
                     {/* Action Buttons */}
                     <div className="mt-4 flex justify-end space-x-2">
                        <button onClick={handleApplyFilters} className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                            <FilterIcon/> <span className="ml-2">Apply Filters</span>
                        </button>
                        <button onClick={handleClearFilters} className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                           Clear
                        </button>
                     </div>
                </div>

                {activeView === 'stock' && user.role !== 'user' && (
                      <div className="mb-4 flex justify-end">
                        <button
                            onClick={() => setIsAddFromAllocationModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            <PlusIcon /> <span className="ml-2 hidden sm:block">เพิ่มรถเข้าสต็อก</span>
                        </button>
                      </div>
                  )}
      
                <CarTable 
                  cars={processedCars} 
                  onEdit={handleOpenEditCarModal}
                  onDelete={handleDeleteRequest}
                  view={activeView}
                  userRole={user.role}
                />
                </>
              )}
              {activeView === 'matching' && (
                  <>
                  <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                          รายการจับคู่รถ ({matches.length})
                      </h2>
                      {user.role !== 'user' && (
                        <button
                            onClick={handleOpenAddMatchModal}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                        >
                            <PlusIcon /> <span className="ml-2 hidden sm:block">เพิ่มรายการจับคู่</span>
                        </button>
                      )}
                  </div>
                  <MatchingTable 
                      matches={matches} 
                      cars={cars} 
                      onEdit={handleOpenEditMatchModal}
                      onDelete={handleDeleteMatchRequest} 
                      userRole={user.role}
                  />
                  </>
              )}
               {activeView === 'sold' && (
                  <>
                  <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
                          รายการรถที่ขายแล้ว ({soldData.length})
                      </h2>
                  </div>
                  <SoldCarTable
                      soldData={soldData}
                      onEditMatch={handleOpenEditMatchModal}
                      userRole={user.role}
                  />
                  </>
              )}
              {activeView === 'stats' && (
                  <StatisticsPage stats={stats} />
              )}
            </>
          )}
      </main>

      <CarFormModal isOpen={isFormModalOpen} onClose={handleCloseModals} onSave={handleSaveCar} carToEdit={editingCar} userRole={user.role} />
      <ImportModal isOpen={isImportModalOpen} onClose={handleCloseModals} onImport={handleImportCars} />
      <AddFromAllocationModal 
        isOpen={isAddFromAllocationModalOpen} 
        onClose={handleCloseModals} 
        onSave={handleAddFromAllocation}
        allocatedCars={carsNotInStock}
      />
      <MatchingFormModal
        isOpen={isMatchFormModalOpen}
        onClose={handleCloseModals}
        onSave={handleSaveMatch}
        matchToEdit={editingMatch}
        cars={cars}
        availableCars={carsInStockForMatching}
        userRole={user.role}
      />
      <ConfirmDeleteModal
        isOpen={!!carToDelete}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        car={carToDelete}
        viewContext={deleteRequestContext}
      />
      <ConfirmMatchDeleteModal
        isOpen={!!matchToDelete}
        onClose={handleCancelDeleteMatch}
        onConfirm={handleConfirmDeleteMatch}
        match={matchToDelete}
        car={matchToDelete ? cars.find(c => c.id === matchToDelete.carId) || null : null}
      />
    </div>
  );
};

export default App;