
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Car, CarStatus, Match, MatchStatus, Salesperson, AppUser, CarFormData } from './types';
import CarTable from './components/CarTable';
import MatchingTable from './components/MatchingTable';
import SoldCarTable from './components/SoldCarTable';
import CarFormModal from './components/CarFormModal';
import MatchingFormModal from './components/MatchingFormModal';
import ImportModal from './components/ImportModal';
import AddFromAllocationModal from './components/AddFromAllocationModal';
import AddToStockModal from './components/AddToStockModal';
import ConfirmDeleteModal from './components/ConfirmDeleteModal';
import ConfirmMatchDeleteModal from './components/ConfirmMatchDeleteModal';
import ConfirmStockDeleteModal from './components/ConfirmStockDeleteModal';
import StatisticsPage from './components/StatisticsPage';
import { PlusIcon, ClipboardPlusIcon, UserIcon, UserGroupIcon, ChartBarIcon, CollectionIcon, ArchiveIcon, LinkIcon, ShoppingCartIcon, FilterIcon, CogIcon } from './components/icons';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/LoginPage';
import MultiSelectFilter from './components/MultiSelectFilter';
import UserManagementPage from './pages/UserManagementPage';
import SalespersonManagementPage from './pages/SalespersonManagementPage';
import SettingsPage from './pages/SettingsPage';
import LogoUploader from './components/LogoUploader';
import ExportPage from './pages/ExportPage';


type View = 'allocation' | 'stock' | 'matching' | 'stats' | 'sold' | 'settings' | 'users' | 'salespersons' | 'export';

// FIX: Defined SortableKeys as a keyof Car to resolve TypeScript error.
type SortableKeys = keyof Car;

// UPDATE: Changed single-select filters to string arrays for multi-select functionality.
interface Filters {
  searchTerm: string;
  startDate: string;
  endDate: string;
  dealerCode: string[];
  model: string[];
  color: string[];
  carType: string[];
  poType: string[];
  stockLocation: string[];
  matchStatus: string[];
  salesperson: string[];
  carStatus: string[];
}

// UPDATE: Changed initial filter values from 'All' to empty arrays for multi-select.
const initialFilters: Filters = {
  searchTerm: '',
  startDate: '',
  endDate: '',
  dealerCode: [],
  model: [],
  color: [],
  carType: [],
  poType: [],
  stockLocation: [],
  matchStatus: [],
  salesperson: [],
  carStatus: [],
};

const App: React.FC = () => {
  const { user, token, logout, isLoading: isAuthLoading } = useAuth();
  
  const [cars, setCars] = useState<Car[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [allSalespersons, setAllSalespersons] = useState<Salesperson[]>([]);
  const [logo, setLogo] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddFromAllocationModalOpen, setIsAddFromAllocationModalOpen] = useState(false);
  const [isMatchFormModalOpen, setIsMatchFormModalOpen] = useState(false);
  const [isAddToStockModalOpen, setIsAddToStockModalOpen] = useState(false);
  
  // Editing/Deleting State
  const [editingCar, setEditingCar] = useState<Car | null>(null);
  const [carToMatch, setCarToMatch] = useState<Car | null>(null);
  const [carToAddToStock, setCarToAddToStock] = useState<Car | null>(null);
  const [carToDelete, setCarToDelete] = useState<Car | null>(null);
  const [deleteRequestContext, setDeleteRequestContext] = useState<'allocation' | 'stock' | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [matchToDelete, setMatchToDelete] = useState<Match | null>(null);
  const [carToUnstock, setCarToUnstock] = useState<Car | null>(null);

  // UI State
  const [activeView, setActiveView] = useState<View>('allocation');
  
  // Filters
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [stagedFilters, setStagedFilters] = useState<Filters>(initialFilters);
  const [activeFilters, setActiveFilters] = useState<Filters>(initialFilters);

  const [sortConfig, setSortConfig] = useState<{ key: SortableKeys; direction: 'ascending' | 'descending' }>({
    key: 'allocationDate', direction: 'descending',
  });
    
  const fetchLogo = useCallback(async () => {
    try {
        const res = await fetch('/api/assets/logo');
        if (res.ok) {
            const data = await res.json();
            if (data.logo) {
                setLogo(data.logo);
            }
        }
    } catch (err) {
        console.error("Failed to fetch logo", err);
    }
  }, []);

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
    fetchLogo();
    if (token) {
        fetchData();
    } else if (!isAuthLoading) {
        setIsLoading(false);
    }
  }, [fetchData, fetchLogo, token, isAuthLoading]);

  // Car CRUD
  const handleOpenAddCarModal = () => {
    setEditingCar(null);
    setIsFormModalOpen(true);
  };
  
  const handleOpenEditCarModal = (car: Car) => {
    setEditingCar(car);
    setIsFormModalOpen(true);
  };

  const handleSaveCar = async (formData: CarFormData) => {
    const isEditing = !!formData.id;

    const {
        matchId, matchCustomerName, matchSalesperson, matchSaleDate,
        matchStatus, matchLicensePlate, matchNotes,
        ...carData
    } = formData;

    // --- Car Data Preparation ---
    const carToSave: Car = { ...carData };
    
    // --- Business Logic for Car Status ---
    const isMatchDataPresent = !!(matchCustomerName || matchSalesperson || matchStatus || matchSaleDate || matchLicensePlate || matchNotes);
    const hasExistingMatch = !!matchId;

    if (isMatchDataPresent) {
        carToSave.status = (matchStatus === MatchStatus.DELIVERED && matchSaleDate) ? CarStatus.SOLD : CarStatus.RESERVED;
    } else if (hasExistingMatch) { // Match data was just cleared
        carToSave.status = carToSave.stockInDate ? CarStatus.IN_STOCK : CarStatus.UNLOADED;
    } else if (carToSave.stockInDate && carToSave.status === CarStatus.UNLOADED) {
        // Handle case where stock date is added to a non-stock, non-reserved car
        carToSave.status = CarStatus.IN_STOCK;
    }

    if (!isEditing) {
        // --- CREATE NEW CAR ---
        try {
            const response = await fetch('/api/cars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(carToSave)
            });
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Failed to save new car');
            }
            await fetchData();
            handleCloseModals();
        } catch (error: any) {
            alert(`Error creating car: ${error.message}`);
        }
        return; // Exit after creating
    }

    // --- EDIT EXISTING CAR ---
    try {
        const apiCalls: Promise<Response>[] = [];

        // 1. Always update the car
        apiCalls.push(fetch(`/api/cars/${carToSave.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(carToSave)
        }));

        // 2. Conditionally handle the match data
        if (isMatchDataPresent) {
            const matchPayload: Omit<Match, 'id'> & { id?: string } = {
                carId: carToSave.id!,
                customerName: matchCustomerName || '',
                salesperson: matchSalesperson || '',
                status: matchStatus || MatchStatus.WAITING_FOR_CONTRACT,
                saleDate: matchSaleDate || undefined,
                licensePlate: matchLicensePlate || undefined,
                notes: matchNotes || undefined,
            };

            if (hasExistingMatch) { // Update existing match
                apiCalls.push(fetch(`/api/matches/${matchId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ ...matchPayload, id: matchId })
                }));
            } else { // Create new match
                apiCalls.push(fetch(`/api/matches`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(matchPayload)
                }));
            }
        } else if (hasExistingMatch) { // Delete cleared match
            apiCalls.push(fetch(`/api/matches/${matchId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }));
        }

        const responses = await Promise.all(apiCalls);

        for (const response of responses) {
            if (!response.ok) {
                // Try to get a meaningful error message
                const errorData = await response.json().catch(() => ({ message: `An API call failed with status ${response.status} ${response.statusText}` }));
                throw new Error(errorData.message);
            }
        }

        await fetchData();
        handleCloseModals();

    } catch (error: any) {
        alert(`Error saving changes: ${error.message}`);
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
            const updatedCar = { ...carToDelete, status: CarStatus.UNLOADED, stockInDate: undefined, stockLocation: undefined, stockNo: undefined };
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
  
  const handleDeleteStockRequest = (car: Car) => {
    setCarToUnstock(car);
  };

  const handleConfirmDeleteStock = async () => {
    if (!carToUnstock) return;
    try {
        const updatedCar = { 
            ...carToUnstock, 
            status: CarStatus.UNLOADED, 
            stockInDate: undefined, 
            stockLocation: undefined, 
            stockNo: undefined 
        };
        const response = await fetch(`/api/cars/${carToUnstock.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(updatedCar)
        });
        if (!response.ok) throw new Error('Failed to remove car from stock');
        await fetchData();
    } catch (error: any) {
        alert(`Error: ${error.message}`);
    } finally {
        setCarToUnstock(null);
    }
  };

  const handleCancelDeleteStock = () => {
    setCarToUnstock(null);
  };

  // Match CRUD
  const handleOpenAddMatchModal = () => {
    setEditingMatch(null);
    setCarToMatch(null);
    setIsMatchFormModalOpen(true);
  };

  const handleOpenEditMatchModal = (match: Match) => {
    setEditingMatch(match);
    setCarToMatch(null);
    setIsMatchFormModalOpen(true);
  };
  
  const handleOpenAddMatchModalForCar = (car: Car) => {
    setEditingMatch(null);
    setCarToMatch(car);
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
      const matchResponse = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(match)
      });
      if (!matchResponse.ok) throw new Error('Failed to save match');

      const carToUpdate = cars.find(c => c.id === match.carId);
      if (carToUpdate) {
        const newStatus = (match.status === MatchStatus.DELIVERED && match.saleDate) ? CarStatus.SOLD : CarStatus.RESERVED;
        if (carToUpdate.status !== newStatus) {
            const updatedCar = { ...carToUpdate, status: newStatus };
            const carResponse = await fetch(`/api/cars/${updatedCar.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedCar)
            });
            if (!carResponse.ok) throw new Error('Failed to update car status after saving match');
        }
      }
      
      await fetchData();
      handleCloseModals();
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
        const deleteResponse = await fetch(`/api/matches/${matchToDelete.id}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` } 
        });
        if (!deleteResponse.ok) throw new Error('Failed to delete match');

        const carToUpdate = cars.find(c => c.id === matchToDelete.carId);
        if (carToUpdate) {
            const newStatus = carToUpdate.stockInDate ? CarStatus.IN_STOCK : CarStatus.UNLOADED;
            if (carToUpdate.status !== newStatus) {
                const updatedCar = { ...carToUpdate, status: newStatus };
                const carResponse = await fetch(`/api/cars/${updatedCar.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(updatedCar)
                });
                if (!carResponse.ok) throw new Error('Failed to update car status after deleting match');
            }
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
  
  const handleBatchImport = async (newCars: Car[]) => {
      try {
          const response = await fetch('/api/cars/batch', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(newCars)
          });
          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.message || 'Failed to import cars');
          }
          await fetchData();
          setIsImportModalOpen(false);
      } catch (error: any) {
          alert(`Error importing cars: ${error.message}`);
      }
  };
  
  const handleBatchAddToStock = async (carIds: string[], stockInDate: string, stockLocation: 'มหาสารคาม' | 'กาฬสินธุ์', stockNo: string) => {
      try {
          const response = await fetch('/api/cars/batch-stock', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ carIds, stockInDate, stockLocation, stockNo })
          });
          if (!response.ok) {
              const err = await response.json();
              throw new Error(err.message || 'Failed to add cars to stock');
          }
          await fetchData();
          setIsAddFromAllocationModalOpen(false);
      } catch (error: any) {
          alert(`Error: ${error.message}`);
      }
  };
  
  const handleOpenAddToStockModal = (car: Car) => {
    setCarToAddToStock(car);
    setIsAddToStockModalOpen(true);
  };

  const handleAddToStock = async (carId: string, stockInDate: string, stockLocation: 'มหาสารคาม' | 'กาฬสินธุ์', stockNo: string) => {
      const carToUpdate = cars.find(c => c.id === carId);
      if (!carToUpdate) {
          alert("Car not found!");
          return;
      }

      try {
          const updatedCar = { 
              ...carToUpdate, 
              status: CarStatus.IN_STOCK, 
              stockInDate,
              stockLocation,
              stockNo
          };
          const response = await fetch(`/api/cars/${carId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify(updatedCar)
          });
          if (!response.ok) throw new Error('Failed to add car to stock');
          await fetchData();
          handleCloseModals();
      } catch (error: any) {
          alert(`Error: ${error.message}`);
      }
  };

  const handleCloseModals = () => {
    setIsFormModalOpen(false);
    setIsImportModalOpen(false);
    setIsAddFromAllocationModalOpen(false);
    setIsMatchFormModalOpen(false);
    setIsAddToStockModalOpen(false);
    setEditingCar(null);
    setEditingMatch(null);
    setCarToMatch(null);
    setCarToAddToStock(null);
  };

  // --- Filtering & Sorting Logic ---
  const sortedCars = useMemo(() => {
    return [...cars].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue === null || aValue === undefined) return 1;
      if (bValue === null || bValue === undefined) return -1;

      if (aValue < bValue) {
        return sortConfig.direction === 'ascending' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
  }, [cars, sortConfig]);

  const filteredCars = useMemo(() => {
    const { searchTerm, startDate, endDate, ...selectFilters } = activeFilters;
    const lowercasedTerm = searchTerm.toLowerCase();
    
    return sortedCars.filter(car => {
      // Search term filter
      const matchesSearch = searchTerm === '' ||
        Object.values(car).some(val =>
          String(val).toLowerCase().includes(lowercasedTerm)
        );
      if (!matchesSearch) return false;

      // Date range filter (on allocationDate)
      const allocationDate = new Date(car.allocationDate);
      const matchesStartDate = !startDate || allocationDate >= new Date(startDate);
      const matchesEndDate = !endDate || allocationDate <= new Date(endDate);
      if (!matchesStartDate || !matchesEndDate) return false;
      
      // Multi-select filters
      for (const key of Object.keys(selectFilters) as Array<keyof typeof selectFilters>) {
          const filterValues = selectFilters[key];
          if (filterValues.length > 0) {
              if (key === 'matchStatus' || key === 'salesperson') {
                  const match = matches.find(m => m.carId === car.id);
                  if (!match) return false; // If filtering by match status/salesperson, car must have a match
                  if (key === 'matchStatus' && !filterValues.includes(match.status)) return false;
                  if (key === 'salesperson' && !filterValues.includes(match.salesperson)) return false;
              } else {
                  const carValue = car[key as keyof Car];
                  if (carValue === null || carValue === undefined) return false;
                  if (!filterValues.includes(String(carValue))) return false;
              }
          }
      }

      return true;
    });
  }, [sortedCars, activeFilters, matches]);

  const matchesByCarId = useMemo(() => new Map(matches.map(match => [match.carId, match])), [matches]);

  const availableForMatching = cars.filter(c => c.status === CarStatus.IN_STOCK);
  const allocatedCars = cars.filter(c => !c.stockInDate && c.status !== CarStatus.RESERVED && c.status !== CarStatus.SOLD);
  const stockCars = filteredCars.filter(c => c.stockInDate && c.status !== CarStatus.RESERVED && c.status !== CarStatus.SOLD);
  const matchingCars = filteredCars.filter(c => c.status === CarStatus.RESERVED);
  const soldCars = filteredCars.filter(c => c.status === CarStatus.SOLD);
  
  const soldCarData = useMemo(() => {
    return soldCars.map(car => ({
      car,
      match: matchesByCarId.get(car.id!),
    })).filter(item => item.match);
  }, [soldCars, matchesByCarId]);


  // Stats calculation
  const stats = useMemo(() => {
    const carStats = cars.reduce((acc, car) => {
      acc[car.status] = (acc[car.status] || 0) + 1;
      return acc;
    }, {} as Record<CarStatus, number>);
    return { ...carStats, total: cars.length };
  }, [cars]);


  const handleFilterChange = (filterName: keyof Filters, value: any) => {
    setStagedFilters(prev => ({ ...prev, [filterName]: value }));
  };
  
  const applyFilters = () => {
      setActiveFilters(stagedFilters);
  };
  
  const clearFilters = () => {
      setStagedFilters(initialFilters);
      setActiveFilters(initialFilters);
  };

  // --- Filter Options ---
  const filterOptions = useMemo(() => {
    const createOptions = (key: keyof Car) => [...new Set(cars.map(c => c[key]).filter(Boolean))] as string[];
    return {
        dealerCode: createOptions('dealerCode'),
        model: createOptions('model'),
        color: createOptions('color'),
        carType: createOptions('carType'),
        poType: createOptions('poType'),
        stockLocation: createOptions('stockLocation'),
        carStatus: Object.values(CarStatus),
        matchStatus: Object.values(MatchStatus),
        salesperson: [...new Set(matches.map(m => m.salesperson).filter(Boolean))],
    };
  }, [cars, matches]);

  if (isAuthLoading) {
     return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 dark:border-white"></div></div>;
  }
  
  if (!user) {
    return <LoginPage logo={logo} />;
  }
  
  const renderContent = () => {
    if (isLoading) {
       return <div className="text-center p-8">Loading data...</div>
    }
    if (error) {
       return <div className="text-center p-8 text-red-500">Error loading data: {error}</div>
    }
    
    switch (activeView) {
      case 'allocation':
      case 'stock':
        const carsForView = activeView === 'allocation' ? filteredCars : stockCars;
        return (
          <CarTable
            cars={carsForView}
            matches={matches}
            view={activeView}
            userRole={user!.role}
            onEdit={handleOpenEditCarModal}
            onAddToStock={handleOpenAddToStockModal}
            onDelete={handleDeleteRequest}
            onDeleteStockRequest={handleDeleteStockRequest}
            onDeleteMatch={handleDeleteMatchRequest}
            onMatchCar={handleOpenAddMatchModalForCar}
          />
        );
      case 'matching':
        return <MatchingTable matches={matches.filter(m => matchingCars.some(c => c.id === m.carId))} cars={matchingCars} onEdit={handleOpenEditMatchModal} onDelete={handleDeleteMatchRequest} userRole={user.role}/>
      case 'sold':
        return <SoldCarTable soldData={soldCarData} onEditMatch={handleOpenEditMatchModal} userRole={user.role} />;
      case 'stats':
        return <StatisticsPage stats={stats} cars={cars} matches={matches} />;
      case 'settings':
        return <SettingsPage onNavigate={setActiveView} />;
      case 'users':
        return <UserManagementPage token={token} currentUser={{ id: user.id, role: user.role }} onBack={() => setActiveView('settings')} />;
      case 'salespersons':
        return <SalespersonManagementPage token={token} salespersons={allSalespersons} onDataChange={fetchData} onBack={() => setActiveView('settings')} />;
      case 'export':
        return <ExportPage cars={cars} matches={matches} onBack={() => setActiveView('settings')} />;
      default:
        return null;
    }
  };
  
  const navigationItems = [
    { view: 'allocation', label: 'Allocation', icon: CollectionIcon },
    { view: 'stock', label: 'Stock', icon: ArchiveIcon },
    { view: 'matching', label: 'Matching', icon: LinkIcon },
    { view: 'sold', label: 'Sold', icon: ShoppingCartIcon },
    { view: 'stats', label: 'Statistics', icon: ChartBarIcon },
  ];
  
  if (user.role === 'executive') {
    navigationItems.push({ view: 'settings', label: 'Settings', icon: CogIcon });
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      <nav className="bg-white dark:bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                  <LogoUploader logo={logo} userRole={user.role} onLogoUpdate={fetchLogo} />
              </div>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  {navigationItems.map(item => (
                    <button
                      key={item.view}
                      onClick={() => setActiveView(item.view)}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeView === item.view
                          ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/50 dark:text-sky-300'
                          : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                    >
                      <item.icon className="h-5 w-5 mr-2" />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center">
                <div className="text-sm">
                    <div className="font-medium text-gray-800 dark:text-white">{user.username}</div>
                    <div className="text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                </div>
                <button onClick={logout} className="ml-4 p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center flex-wrap gap-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white capitalize">{activeView}</h1>
          {['allocation', 'stock', 'matching', 'sold'].includes(activeView) && (
             <div className="flex items-center space-x-2">
                {user.role !== 'user' && (
                    <>
                    {activeView === 'allocation' && (
                       <button onClick={handleOpenAddCarModal} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                          <PlusIcon/> <span className="ml-2 hidden sm:inline">เพิ่มรถใหม่</span>
                       </button>
                    )}
                    {activeView === 'allocation' && (
                       <button onClick={() => setIsImportModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                           <ClipboardPlusIcon /> <span className="ml-2 hidden sm:inline">นำเข้าจาก Excel</span>
                       </button>
                    )}
                     {activeView === 'stock' && (
                         <button onClick={() => setIsAddFromAllocationModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                           <PlusIcon/> <span className="ml-2 hidden sm:inline">เพิ่มรถเข้าสต็อก</span>
                       </button>
                    )}
                     {activeView === 'matching' && (
                         <button onClick={handleOpenAddMatchModal} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
                           <PlusIcon/> <span className="ml-2 hidden sm:inline">เพิ่มรายการจับคู่</span>
                       </button>
                    )}
                    </>
                )}
                 <button onClick={() => setIsFilterVisible(!isFilterVisible)} className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 ${isFilterVisible ? 'bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                    <FilterIcon /> <span className="ml-2 hidden sm:inline">ตัวกรอง</span>
                </button>
            </div>
          )}
        </div>
      </header>
      
      {isFilterVisible && ['allocation', 'stock', 'matching', 'sold'].includes(activeView) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                   <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      <div className="md:col-span-3 lg:col-span-4">
                          <label htmlFor="searchTerm" className="block text-sm font-medium text-gray-700 dark:text-gray-300">ค้นหาทั่วไป</label>
                          <input type="text" id="searchTerm" value={stagedFilters.searchTerm} onChange={e => handleFilterChange('searchTerm', e.target.value)}
                                 className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                 placeholder="VIN, Model, Color, Customer name..."
                          />
                      </div>
                       <MultiSelectFilter label="Dealer Code" options={filterOptions.dealerCode} selectedOptions={stagedFilters.dealerCode} onChange={(val) => handleFilterChange('dealerCode', val)} />
                       <MultiSelectFilter label="Model" options={filterOptions.model} selectedOptions={stagedFilters.model} onChange={(val) => handleFilterChange('model', val)} />
                       <MultiSelectFilter label="Color" options={filterOptions.color} selectedOptions={stagedFilters.color} onChange={(val) => handleFilterChange('color', val)} />
                       <MultiSelectFilter label="Car Status" options={filterOptions.carStatus} selectedOptions={stagedFilters.carStatus} onChange={(val) => handleFilterChange('carStatus', val)} />
                       <MultiSelectFilter label="Match Status" options={filterOptions.matchStatus} selectedOptions={stagedFilters.matchStatus} onChange={(val) => handleFilterChange('matchStatus', val)} />
                       <MultiSelectFilter label="Salesperson" options={filterOptions.salesperson} selectedOptions={stagedFilters.salesperson} onChange={(val) => handleFilterChange('salesperson', val)} />
                       <MultiSelectFilter label="Stock Location" options={filterOptions.stockLocation} selectedOptions={stagedFilters.stockLocation} onChange={(val) => handleFilterChange('stockLocation', val)} />
                   </div>
                   <div className="mt-4 flex justify-end space-x-2">
                       <button onClick={clearFilters} className="px-4 py-2 border border-gray-300 dark:border-gray-500 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">Clear</button>
                       <button onClick={applyFilters} className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700">Apply Filters</button>
                   </div>
              </div>
          </div>
      )}

      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
            {renderContent()}
        </div>
      </main>

      {/* --- Modals --- */}
      <CarFormModal 
        isOpen={isFormModalOpen} 
        onClose={handleCloseModals} 
        onSave={handleSaveCar}
        carToEdit={editingCar}
        matchToEdit={editingCar ? matches.find(m => m.carId === editingCar.id) : null}
        salespersons={salespersons}
        userRole={user!.role}
      />
      <ImportModal isOpen={isImportModalOpen} onClose={handleCloseModals} onImport={handleBatchImport} />
      <AddFromAllocationModal 
        isOpen={isAddFromAllocationModalOpen} 
        onClose={handleCloseModals}
        onSave={handleBatchAddToStock}
        allocatedCars={allocatedCars}
       />
       <MatchingFormModal
            isOpen={isMatchFormModalOpen}
            onClose={handleCloseModals}
            onSave={handleSaveMatch}
            matchToEdit={editingMatch}
            carToMatch={carToMatch}
            cars={cars}
            availableCars={availableForMatching}
            userRole={user!.role}
            salespersons={salespersons}
        />
        <AddToStockModal
            isOpen={isAddToStockModalOpen}
            onClose={handleCloseModals}
            onSave={handleAddToStock}
            car={carToAddToStock}
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
        <ConfirmStockDeleteModal
            isOpen={!!carToUnstock}
            onClose={handleCancelDeleteStock}
            onConfirm={handleConfirmDeleteStock}
            car={carToUnstock}
        />

    </div>
  );
};

export default App;
