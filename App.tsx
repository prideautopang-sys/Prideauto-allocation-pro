import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Car, CarStatus, Match, MatchStatus, Salesperson, AppUser } from './types';
import CarTable from './components/CarTable';
import MatchingTable from './components/MatchingTable';
import SoldCarTable from './components/SoldCarTable';
import CarFormModal from './components/CarFormModal';
import MatchingFormModal from './components/MatchingFormModal';
import ImportModal from './components/ImportModal';
import AddFromAllocationModal from './components/AddFromAllocationModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ConfirmMatchDeleteModal from './components/ConfirmMatchDeleteModal';
import StatisticsPage from './components/StatisticsPage';
import { PlusIcon, ClipboardPlusIcon, UserIcon, UserGroupIcon, ChartBarIcon, CollectionIcon, ArchiveIcon, LinkIcon, ShoppingCartIcon, FilterIcon, CogIcon } from './components/icons';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import MultiSelectFilter from './components/MultiSelectFilter';
import UserManagementPage from './pages/UserManagementPage';
import SalespersonManagementPage from './pages/SalespersonManagementPage';
import SettingsPage from './pages/SettingsPage';


type SortableKeys = keyof Car;
type View = 'allocation' | 'stock' | 'matching' | 'stats' | 'sold' | 'settings' | 'users' | 'salespersons';

interface Filters {
  searchTerm: string;
  startDate: string;
  endDate: string;
  dealerCode: string;
  model: string[];
  color: string;
  carType: string;
  poType: string;
  stockLocation: string;
}

const initialFilters: Filters = {
  searchTerm: '',
  startDate: '',
  endDate: '',
  dealerCode: 'All',
  model: [],
  color: 'All',
  carType: 'All',
  poType: 'All',
  stockLocation: 'All',
};

const App: React.FC = () => {
  const { user, token, logout, isLoading: isAuthLoading } = useAuth();
  
  const [cars, setCars] = useState<Car[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [allSalespersons, setAllSalespersons] = useState<Salesperson[]>([]);

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
  const [deleteRequestContext, setDeleteRequestContext] = useState<'allocation' | 'stock' | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);

  // UI State
  const [activeView, setActiveView] = useState<View>('allocation');
  
  // Filters
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [stagedFilters, setStagedFilters] = useState<Filters>(initialFilters);
  const [activeFilters, setActiveFilters] = useState<Filters>(initialFilters);

  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({
    key: 'allocationDate', direction: 'descending',
  });
    
  const fetchData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const fetches = [
        fetch('/api/cars', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/matches', { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch('/api/salespersons?status=active', { headers: { 'Authorization': `Bearer ${token}` } }),
      ];

      if (user?.role === 'executive') {
        fetches.push(fetch('/api/salespersons', { headers: { 'Authorization': `Bearer ${token}` } }));
      }

      const responses = await Promise.all(fetches);
      
      for (const res of responses) {
        if (!res.ok) throw new Error('Failed to fetch data');
      }

      const [carsData, matchesData, activeSalespersonsData] = await Promise.all(responses.slice(0, 3).map(res => res.json()));
      
      setCars(carsData);
      setMatches(matchesData);
      setSalespersons(activeSalespersonsData);
      
      if (user?.role === 'executive' && responses[3]) {
        const allSalespersonsData = await responses[3].json();
        setAllSalespersons(allSalespersonsData);
      } else {
        setAllSalespersons(activeSalespersonsData);
      }

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [token, user?.role]);

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
    if (activeView === 'allocation' || activeView === 'stock') {
      setCarToDelete(car);
      setDeleteRequestContext(activeView);
    }
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

    // FIX: Enforce that a saleDate is required when the status is DELIVERED.
    // This prevents errors and ensures the car status is correctly updated to 'Sold'.
    if (match.status === MatchStatus.DELIVERED && !match.saleDate) {
      alert('กรุณาระบุ "วันที่ตัดขาย" เมื่อสถานะเป็น "รับรถแล้ว"');
      return;
    }

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
        .filter(car => carIds.includes(car.id!))
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
  const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStagedFilters(prev => ({ ...prev, [name]: value }));
  };
  
  const handleMultiSelectChange = (filterName: 'model') => (selected: string[]) => {
    setStagedFilters(prev => ({ ...prev, [filterName]: selected }));
  };
  
  const handleApplyFilters = () => {
    setActiveFilters(stagedFilters);
  }

  const handleClearFilters = () => {
      setStagedFilters(initialFilters);
      setActiveFilters(initialFilters);
  };

  const filterOptions = useMemo(() => {
    const unique = (key: keyof Car) => [...new Set(cars.map(c => c[key]).filter(Boolean))] as string[];
    return {
        dealerCodes: unique('dealerCode'),
        models: unique('model'),
        colors: unique('color'),
        carTypes: unique('carType'),
        poTypes: unique('poType'),
        stockLocations: unique('stockLocation'),
    };
  }, [cars]);


  // Memoized Data for Views
  const allocatedCars = useMemo(() => cars, [cars]);
  const stockCars = useMemo(() => cars.filter(car => car.stockInDate && car.status !== CarStatus.SOLD), [cars]);
  const matchingCarsData = useMemo(() => cars.filter(car => car.status === CarStatus.RESERVED), [cars]);
  const soldCarsData = useMemo(() => cars.filter(car => car.status === CarStatus.SOLD), [cars]);

  const carsNotInStock = useMemo(() => cars.filter(car => !car.stockInDate), [cars]);
  const carsInStockForMatching = useMemo(() => cars.filter(c => c.status === CarStatus.IN_STOCK), [cars]);

  const processedCars = useMemo(() => {
    let sourceCars: Car[] = [];
    if (activeView === 'allocation') sourceCars = allocatedCars;
    else if (activeView === 'stock') sourceCars = stockCars;
    else if (activeView === 'matching') sourceCars = matchingCarsData;
    else if (activeView === 'sold') sourceCars = soldCarsData;
    else return [];

    let filtered = sourceCars.filter(car => {
      const { searchTerm, startDate, endDate, dealerCode, model, color, carType, poType, stockLocation } = activeFilters;
      
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = searchTerm ? (
        Object.values(car).some(val => String(val).toLowerCase().includes(searchLower))
      ) : true;

      const matchesDealer = dealerCode === 'All' || car.dealerCode === dealerCode;
      const matchesModel = model.length === 0 || model.includes(car.model);
      const matchesColor = color === 'All' || car.color === color;
      const matchesCarType = carType === 'All' || car.carType === carType;
      const matchesPoType = poType === 'All' || car.poType === poType;
      const matchesStockLocation = (activeView === 'stock' || activeView === 'matching' || activeView === 'sold') ? (stockLocation === 'All' || car.stockLocation === stockLocation) : true;
      
      let matchesDate = true;
      if (startDate || endDate) {
          let dateField: string | undefined;
          if (activeView === 'allocation') dateField = car.allocationDate;
          if (activeView === 'stock' || activeView === 'matching') dateField = car.stockInDate;
          if (activeView === 'sold') {
            const match = matches.find(m => m.carId === car.id);
            dateField = match?.saleDate;
          }

          if (!dateField) {
              matchesDate = false;
          } else {
              const carDate = new Date(dateField);
              carDate.setHours(0, 0, 0, 0); 
              const start = startDate ? new Date(startDate) : null;
              if (start) start.setHours(0, 0, 0, 0);
              const end = endDate ? new Date(endDate) : null;
              if (end) end.setHours(0, 0, 0, 0);
              matchesDate = (!start || carDate >= start) && (!end || carDate <= end);
          }
      }

      return matchesSearch && matchesDealer && matchesModel && matchesColor && matchesCarType && matchesPoType && matchesStockLocation && matchesDate;
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
  }, [allocatedCars, stockCars, matchingCarsData, soldCarsData, activeFilters, sortConfig, activeView, matches]);
  

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

  const FilterDropdown: React.FC<{ label: string; name: keyof Filters; options: string[] }> = ({ label, name, options }) => (
    <div>
        <label htmlFor={name as string} className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <select 
            id={name as string} 
            name={name as string} 
            value={stagedFilters[name] as string} 
            onChange={handleFilterChange} 
            className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
            <option value="All">All</option>
            {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
    </div>
  );
  
  if (isAuthLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">Loading...</div>;
  }
  
  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch(activeView) {
      case 'allocation':
      case 'stock':
      case 'matching':
      case 'sold':
        return (
          <CarTable 
            cars={processedCars}
            matches={matches}
            onEdit={handleOpenEditCarModal}
            onDelete={handleDeleteRequest}
            onEditMatch={handleOpenEditMatchModal}
            onDeleteMatch={handleDeleteMatchRequest}
            view={activeView}
            userRole={user.role}
          />
        );
      case 'stats':
        return <StatisticsPage stats={stats} />;
       case 'settings':
        return <SettingsPage onNavigate={(view) => setActiveView(view)} />;
      case 'users':
        if (user.role === 'executive') {
          return <UserManagementPage token={token} currentUser={user} onBack={() => setActiveView('settings')} />;
        }
        return null;
      case 'salespersons':
        if (user.role === 'executive') {
          return <SalespersonManagementPage token={token} salespersons={allSalespersons} onDataChange={fetchData} onBack={() => setActiveView('settings')} />;
        }
        return null;
      default:
        return null;
    }
  };

  const getPageTitle = () => {
    switch(activeView) {
      case 'allocation': return `Car Allocation (${processedCars.length})`;
      case 'stock': return `Stock (${processedCars.length})`;
      case 'matching': return `Matching (${processedCars.length})`;
      case 'sold': return `Sold Cars (${processedCars.length})`;
      case 'settings': return `Settings`;
      case 'users': return `User Management`;
      case 'salespersons': return `Salesperson Management`;
      default: return '';
    }
  };


  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-30">
        <div className="py-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
                 <div className="flex items-center space-x-3">
                    <div className="flex flex-row items-baseline justify-center space-x-1.5">
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-2xl">PRIDE</span>
                        <span className="font-bold text-gray-800 dark:text-gray-200 text-2xl">AUTO</span>
                    </div>
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
                <NavButton view="matching" label={`Matching (${matchingCarsData.length})`} icon={<LinkIcon />} />
                <NavButton view="sold" label={`Sold Cars (${soldCarsData.length})`} icon={<ShoppingCartIcon />} />
                <NavButton view="stats" label="Statistics" icon={<ChartBarIcon />} />
                {user.role === 'executive' && (
                    <NavButton view="settings" label="Settings" icon={<CogIcon />} />
                )}
            </div>
        </nav>
      </header>

      <main className="py-6 px-4 sm:px-6 lg:px-8">
            {isLoading ? <div className="text-center">Loading data...</div> : error ? <div className="text-center text-red-500">Error: {error}</div> : (
              <>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {getPageTitle()}
                  </h2>
                  <div className="flex items-center gap-2">
                      {activeView === 'stock' && user.role !== 'user' && (
                        <button
                            onClick={() => setIsAddFromAllocationModalOpen(true)}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                        >
                            <PlusIcon /> <span className="ml-2 hidden sm:block">เพิ่มรถเข้าสต็อก</span>
                        </button>
                      )}
                      {activeView === 'matching' && user.role !== 'user' && (
                        <button
                            onClick={handleOpenAddMatchModal}
                            className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
                        >
                            <PlusIcon /> <span className="ml-2 hidden sm:block">เพิ่มรายการจับคู่</span>
                        </button>
                      )}
                      {(['allocation', 'stock', 'matching', 'sold'].includes(activeView)) && (
                        <button 
                          onClick={() => setIsFilterVisible(!isFilterVisible)}
                          className={`inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 ${
                              isFilterVisible 
                              ? 'bg-sky-100 dark:bg-sky-800/50 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-200' 
                              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                          }`}
                        >
                          <FilterIcon/>
                          <span className="ml-2">ตัวกรอง</span>
                        </button>
                      )}
                  </div>
              </div>

              {isFilterVisible && (['allocation', 'stock', 'matching', 'sold'].includes(activeView)) && (
                  <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                          <div className="lg:col-span-2 xl:col-span-1">
                              <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search</label>
                              <input type="text" name="searchTerm" id="searchTerm" placeholder="VIN, Dealer, Model..." value={stagedFilters.searchTerm} onChange={handleFilterChange}
                                  className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                          </div>
                          <div className="relative">
                              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                {activeView === 'sold' ? 'วันที่ตัดขาย เริ่มต้น' : (activeView === 'stock' || activeView === 'matching') ? 'วันที่ Stock เริ่มต้น' : 'วันที่ Allocate เริ่มต้น'}
                              </label>
                              <input type="date" name="startDate" id="startDate" value={stagedFilters.startDate} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                          </div>
                          <div className="relative">
                              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                 {activeView === 'sold' ? 'วันที่ตัดขาย สิ้นสุด' : (activeView === 'stock' || activeView === 'matching') ? 'วันที่ Stock สิ้นสุด' : 'วันที่ Allocate สิ้นสุด'}
                              </label>
                              <input type="date" name="endDate" id="endDate" value={stagedFilters.endDate} onChange={handleFilterChange} className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                          </div>
                          <FilterDropdown label="รหัส Dealer" name="dealerCode" options={filterOptions.dealerCodes} />
                          <MultiSelectFilter label="รุ่นรถ" options={filterOptions.models} selectedOptions={stagedFilters.model} onChange={handleMultiSelectChange('model')} />
                          <FilterDropdown label="สีรถ" name="color" options={filterOptions.colors} />
                          <FilterDropdown label="Car Type" name="carType" options={filterOptions.carTypes} />
                          <FilterDropdown label="PO Type" name="poType" options={filterOptions.poTypes} />
                           {(activeView === 'stock' || activeView === 'matching' || activeView === 'sold') && (
                              <FilterDropdown label="สาขาที่ Stock" name="stockLocation" options={filterOptions.stockLocations} />
                          )}
                      </div>
                      <div className="mt-4 flex justify-end space-x-2">
                          <button onClick={handleApplyFilters} className="inline-flex items-center justify-center rounded-md border border-transparent bg-sky-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                              <FilterIcon/> <span className="ml-2">Apply Filters</span>
                          </button>
                          <button onClick={handleClearFilters} className="inline-flex items-center justify-center rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2">
                          Clear
                          </button>
                      </div>
                  </div>
              )}
    
              {renderContent()}

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
        salespersons={salespersons}
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