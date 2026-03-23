
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Car, CarStatus, Match, MatchStatus, Salesperson, AppUser, CarFormData } from './types';
import CarTable from './components/CarTable';
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

type SortableKeys = keyof Car;

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
    
  // Reset filters when changing views to prevent filter state from leaking between views.
  useEffect(() => {
    setStagedFilters(initialFilters);
    setActiveFilters(initialFilters);
  }, [activeView]);

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

    const carToSave: Car = { ...carData };
    
    const isMatchDataPresent = !!(matchCustomerName || matchSalesperson || matchStatus || matchSaleDate || matchLicensePlate || matchNotes);
    const hasExistingMatch = !!matchId;

    if (isMatchDataPresent) {
        carToSave.status = (matchStatus === MatchStatus.DELIVERED && matchSaleDate) ? CarStatus.SOLD : CarStatus.RESERVED;
    } else if (hasExistingMatch) { 
        carToSave.status = carToSave.stockInDate ? CarStatus.IN_STOCK : CarStatus.UNLOADED;
    } else if (carToSave.stockInDate && carToSave.status === CarStatus.UNLOADED) {
        carToSave.status = CarStatus.IN_STOCK;
    }

    if (!isEditing) {
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
        return;
    }

    try {
        const apiCalls: Promise<Response>[] = [];

        apiCalls.push(fetch(`/api/cars/${carToSave.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(carToSave)
        }));

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

            if (hasExistingMatch) { 
                apiCalls.push(fetch(`/api/matches/${matchId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ ...matchPayload, id: matchId })
                }));
            } else { 
                apiCalls.push(fetch(`/api/matches`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(matchPayload)
                }));
            }
        } else if (hasExistingMatch) { 
            apiCalls.push(fetch(`/api/matches/${matchId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            }));
        }

        const responses = await Promise.all(apiCalls);

        for (const response of responses) {
            if (!response.ok) {
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
            const updatedCar = { ...carToDelete, status: CarStatus.UNLOADED, stockInDate: undefined, stockLocation: undefined, stockNo: undefined };
            const response = await fetch(`/api/cars/${carToDelete.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedCar)
            });
            if (!response.ok) throw new Error('Failed to remove car from stock');

        } else if (deleteRequestContext === 'allocation') {
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
  
  const handleImportSuccess = async () => {
      await fetchData();
  };
  
  const handleBatchAddToStock = async (carIds: string[], stockInDate: string, stockLocation: 'มหาสารคาม' | 'กาฬสินธุ์', stockNo: string) => {
      try {
          const response = await fetch('/api/cars', {
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
  
  const matchesByCarId = useMemo(() => new Map(matches.map(match => [match.carId, match])), [matches]);

  const filteredCars = useMemo(() => {
    const { searchTerm, startDate, endDate, ...selectFilters } = activeFilters;
    const lowercasedTerm = searchTerm.toLowerCase();

    const start = startDate ? new Date(startDate) : null;
    if(start) start.setHours(0,0,0,0);
    const end = endDate ? new Date(endDate) : null;
    if(end) end.setHours(23,59,59,999);
    
    return sortedCars.filter(car => {
      const match = matchesByCarId.get(car.id!);
      const searchableValues = [
          ...Object.values(car),
          ...(match ? Object.values(match) : [])
      ];
      const matchesSearch = searchTerm === '' ||
        searchableValues.some(val => 
          val !== null && val !== undefined && String(val).toLowerCase().includes(lowercasedTerm)
        );
      
      if (!matchesSearch) return false;

      if (start || end) {
          let dateToCompare: Date | null = null;
          // Filtering logic based on active view's specific context
          if (activeView === 'allocation') dateToCompare = car.allocationDate ? new Date(car.allocationDate) : null;
          else if (activeView === 'stock' || activeView === 'matching') dateToCompare = car.stockInDate ? new Date(car.stockInDate) : null;
          else if (activeView === 'sold') dateToCompare = match?.saleDate ? new Date(match.saleDate) : null;
          
          if (!dateToCompare) return false;
          const matchesStartDate = !start || dateToCompare >= start;
          const matchesEndDate = !end || dateToCompare <= end;
          if (!matchesStartDate || !matchesEndDate) return false;
      }
      
      for (const key of Object.keys(selectFilters) as Array<keyof typeof selectFilters>) {
          const filterValues = selectFilters[key];
          if (filterValues.length > 0) {
              if (key === 'matchStatus' || key === 'salesperson') {
                  if (!match) return false;
                  if (key === 'matchStatus' && !filterValues.includes(match.status)) return false;
                  if (key === 'salesperson' && !filterValues.includes(match.salesperson)) return false;
              } else if (key === 'carStatus') {
                  if (!filterValues.includes(car.status)) return false;
              } else {
                  const carValue = car[key as keyof Car];
                  if (carValue === null || carValue === undefined) return false;
                  if (!filterValues.includes(String(carValue))) return false;
              }
          }
      }

      return true;
    });
  }, [sortedCars, activeFilters, matchesByCarId, activeView]);

  const availableForMatching = cars.filter(c => c.status === CarStatus.IN_STOCK);
  const allocatedCars = cars.filter(c => !c.stockInDate && c.status !== CarStatus.RESERVED && c.status !== CarStatus.SOLD);
  
  const stockCars = cars.filter(c => c.status === CarStatus.IN_STOCK);
  const matchingCars = cars.filter(c => c.status === CarStatus.RESERVED);
  const soldCars = cars.filter(c => c.status === CarStatus.SOLD);

  const viewStockCars = filteredCars.filter(c => c.status === CarStatus.IN_STOCK);
  const viewMatchingCars = filteredCars.filter(c => c.status === CarStatus.RESERVED);
  const viewSoldCars = filteredCars.filter(c => c.status === CarStatus.SOLD);

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
     return <div className="flex justify-center items-center h-screen bg-slate-50 dark:bg-slate-900"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-sky-600 dark:border-sky-400"></div></div>;
  }
  
  if (!user) {
    return <LoginPage logo={logo} />;
  }
  
  const renderContent = () => {
    if (isLoading) {
       return (
        <div className="flex flex-col items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-600 dark:border-sky-400 mb-4"></div>
            <div className="text-gray-500 font-medium">Loading data...</div>
        </div>
       );
    }
    if (error) {
       return <div className="text-center p-8 text-red-500 bg-red-50 rounded-lg border border-red-200">Error loading data: {error}</div>
    }
    
    switch (activeView) {
      case 'allocation':
        return (
          <CarTable
            cars={filteredCars}
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
      case 'stock':
        return (
          <CarTable
            cars={viewStockCars}
            matches={matches}
            view={activeView}
            userRole={user!.role}
            onEdit={handleOpenEditCarModal}
            onDelete={handleDeleteRequest}
            onMatchCar={handleOpenAddMatchModalForCar}
            onDeleteMatch={handleDeleteMatchRequest}
          />
        );
      case 'matching':
        return <CarTable
            cars={viewMatchingCars}
            matches={matches}
            view="matching"
            userRole={user!.role}
            onEditMatch={handleOpenEditMatchModal}
            onDeleteMatch={handleDeleteMatchRequest}
          />
      case 'sold':
        return <CarTable
            cars={viewSoldCars}
            matches={matches}
            view="sold"
            userRole={user!.role}
            onEditMatch={handleOpenEditMatchModal}
          />;
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

  // Determine standard counts vs filtered counts for badges
  const getNavCount = (view: string) => {
    switch (view) {
      case 'allocation': return activeFilters === initialFilters ? cars.length : filteredCars.length;
      case 'stock': return activeFilters === initialFilters ? stockCars.length : viewStockCars.length;
      case 'matching': return activeFilters === initialFilters ? matchingCars.length : viewMatchingCars.length;
      case 'sold': return activeFilters === initialFilters ? soldCars.length : viewSoldCars.length;
      default: return undefined;
    }
  }
  
  const navigationItems = [
    { view: 'allocation', label: 'Allocation', icon: CollectionIcon, count: getNavCount('allocation') },
    { view: 'stock', label: 'Stock', icon: ArchiveIcon, count: getNavCount('stock') },
    { view: 'matching', label: 'Matching', icon: LinkIcon, count: getNavCount('matching') },
    { view: 'sold', label: 'Sold', icon: ShoppingCartIcon, count: getNavCount('sold') },
    { view: 'stats', label: 'Statistics', icon: ChartBarIcon },
  ];
  
  if (user.role === 'executive') {
    navigationItems.push({ view: 'settings', label: 'Settings', icon: CogIcon });
  }
  
  let dateFilterLabel = 'Date';
  if (activeView === 'allocation') dateFilterLabel = 'Allocation Date';
  else if (activeView === 'stock') dateFilterLabel = 'In Stock Date';
  else if (activeView === 'matching') dateFilterLabel = 'In Stock Date';
  else if (activeView === 'sold') dateFilterLabel = 'Sold Date';

  // Helper for showing "Showing X of Y" in the header
  const getHeaderBadge = () => {
    if (!['allocation', 'stock', 'matching', 'sold'].includes(activeView)) return 'Overview';
    const totalMap: any = { allocation: cars.length, stock: stockCars.length, matching: matchingCars.length, sold: soldCars.length };
    const filteredMap: any = { allocation: filteredCars.length, stock: viewStockCars.length, matching: viewMatchingCars.length, sold: viewSoldCars.length };
    const totalCount = totalMap[activeView] || 0;
    const filteredCount = filteredMap[activeView] || 0;
    
    if (activeFilters === initialFilters) return `ทั้งหมด ${totalCount} คัน`;
    return `แสดงผล ${filteredCount} จาก ${totalCount} คัน`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-gray-800 dark:text-gray-200 font-sans">
      <nav className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 transition-transform hover:scale-105">
                  <LogoUploader logo={logo} userRole={user.role} onLogoUpdate={fetchLogo} />
              </div>
              <div className="hidden lg:block">
                <div className="ml-10 flex items-baseline space-x-2">
                  {navigationItems.map(item => (
                    <button
                      key={item.view}
                      onClick={() => setActiveView(item.view as View)}
                      className={`flex items-center px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        activeView === item.view
                          ? 'bg-sky-100 text-sky-700 shadow-sm dark:bg-sky-900/50 dark:text-sky-300'
                          : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white'
                      }`}
                    >
                      <item.icon className={`h-5 w-5 mr-2 ${activeView === item.view ? 'text-sky-600 dark:text-sky-400' : 'text-gray-400 dark:text-gray-500 group-hover:text-gray-500'}`} />
                      {item.label}
                      {item.count !== undefined && (
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold transition-all duration-300 ${
                          activeView === item.view
                            ? 'bg-sky-200 text-sky-800 dark:bg-sky-800 dark:text-sky-200'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                        } ${activeFilters !== initialFilters && activeView === item.view ? 'ring-2 ring-sky-500 dark:ring-sky-400' : ''}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-semibold text-gray-800 dark:text-white">{user.username}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user.role}</div>
                </div>
                <button onClick={logout} className="p-2 rounded-full text-gray-400 hover:text-white hover:bg-red-500 dark:hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
          </div>
        </div>
      </nav>

      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white capitalize tracking-tight flex items-center">
            {activeView}
             <span className={`ml-3 px-3 py-1 rounded-full text-sm font-medium hidden sm:inline-block transition-all duration-300 ${activeFilters !== initialFilters ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300 ring-1 ring-sky-200 dark:ring-sky-800' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                {getHeaderBadge()}
             </span>
          </h1>
          {['allocation', 'stock', 'matching', 'sold'].includes(activeView) && (
             <div className="flex items-center space-x-3 flex-wrap justify-center md:justify-end">
                {user.role !== 'user' && (
                    <>
                    {activeView === 'allocation' && (
                       <button onClick={handleOpenAddCarModal} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
                          <PlusIcon/> <span className="ml-2">เพิ่มรถใหม่</span>
                       </button>
                    )}
                    {activeView === 'allocation' && (
                       <button onClick={() => setIsImportModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
                           <ClipboardPlusIcon /> <span className="ml-2">นำเข้า Excel</span>
                       </button>
                    )}
                     {activeView === 'stock' && (
                         <button onClick={() => setIsAddFromAllocationModalOpen(true)} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
                           <PlusIcon/> <span className="ml-2">เพิ่มรถเข้าสต็อก</span>
                       </button>
                    )}
                     {activeView === 'matching' && (
                         <button onClick={handleOpenAddMatchModal} className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors">
                           <PlusIcon/> <span className="ml-2">เพิ่มรายการจับคู่</span>
                       </button>
                    )}
                    </>
                )}
                 <button onClick={() => setIsFilterVisible(!isFilterVisible)} className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-colors ${isFilterVisible ? 'bg-sky-50 dark:bg-sky-900/30 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600'}`}>
                    <FilterIcon /> <span className="ml-2">ตัวกรอง</span>
                </button>
            </div>
          )}
        </div>
      </header>
      
      {isFilterVisible && ['allocation', 'stock', 'matching', 'sold'].includes(activeView) && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700/50">
                   <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      <div className="md:col-span-3 lg:col-span-4">
                          <label htmlFor="searchTerm" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">ค้นหาทั่วไป</label>
                          <input type="text" id="searchTerm" value={stagedFilters.searchTerm} onChange={e => handleFilterChange('searchTerm', e.target.value)}
                                 className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white transition-shadow"
                                 placeholder="Search by VIN, Model, Color, Customer name..."
                          />
                      </div>
                      <div className="md:col-span-3 lg:col-span-4 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-gray-100 dark:border-gray-700 pt-6 mt-2">
                          <div>
                              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{dateFilterLabel} (From)</label>
                              <input type="date" id="startDate" name="startDate" value={stagedFilters.startDate} onChange={e => handleFilterChange('startDate', e.target.value)}
                                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                          </div>
                          <div>
                              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{dateFilterLabel} (To)</label>
                              <input type="date" id="endDate" name="endDate" value={stagedFilters.endDate} onChange={e => handleFilterChange('endDate', e.target.value)}
                                      className="block w-full border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                              />
                          </div>
                      </div>
                       <MultiSelectFilter label="Dealer Code" options={filterOptions.dealerCode} selectedOptions={stagedFilters.dealerCode} onChange={(val) => handleFilterChange('dealerCode', val)} />
                       <MultiSelectFilter label="Model" options={filterOptions.model} selectedOptions={stagedFilters.model} onChange={(val) => handleFilterChange('model', val)} />
                       <MultiSelectFilter label="Color" options={filterOptions.color} selectedOptions={stagedFilters.color} onChange={(val) => handleFilterChange('color', val)} />
                       <MultiSelectFilter label="Car Status" options={filterOptions.carStatus} selectedOptions={stagedFilters.carStatus} onChange={(val) => handleFilterChange('carStatus', val)} />
                       <MultiSelectFilter label="Match Status" options={filterOptions.matchStatus} selectedOptions={stagedFilters.matchStatus} onChange={(val) => handleFilterChange('matchStatus', val)} />
                       <MultiSelectFilter label="Salesperson" options={filterOptions.salesperson} selectedOptions={stagedFilters.salesperson} onChange={(val) => handleFilterChange('salesperson', val)} />
                       <MultiSelectFilter label="Stock Location" options={filterOptions.stockLocation} selectedOptions={stagedFilters.stockLocation} onChange={(val) => handleFilterChange('stockLocation', val)} />
                   </div>
                   <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                       <button onClick={clearFilters} className="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Clear All</button>
                       <button onClick={applyFilters} className="px-5 py-2.5 border border-transparent text-sm font-medium rounded-lg text-white bg-sky-600 hover:bg-sky-700 shadow-md hover:shadow-lg transition-all">Apply Filters</button>
                   </div>
              </div>
          </div>
      )}

      <main className="pb-24 lg:pb-12 pt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
      <ImportModal isOpen={isImportModalOpen} onClose={handleCloseModals} onSuccess={handleImportSuccess} />
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

        {/* --- Mobile Navigation --- */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] z-40 pb-safe">
            <div className="flex justify-around items-center h-16">
                {navigationItems.map(item => (
                    <button
                        key={item.view}
                        onClick={() => setActiveView(item.view as View)}
                        title={item.label}
                        className={`relative flex-grow flex flex-col items-center justify-center h-16 transition-colors focus:outline-none ${
                            activeView === item.view
                            ? 'text-sky-600 dark:text-sky-400'
                            : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                        aria-label={item.label}
                        aria-current={activeView === item.view ? 'page' : undefined}
                    >
                        <item.icon className={`h-6 w-6 mb-1 ${activeView === item.view ? 'transform scale-110' : ''} transition-transform`} />
                        <span className="text-[10px] font-medium">{item.label}</span>
                        {item.count !== undefined && (
                            <span className={`absolute top-2 right-1/2 translate-x-3 transform px-1.5 py-0.5 rounded-full text-[9px] font-bold leading-none transition-all duration-300 ${
                                activeView === item.view
                                ? 'bg-sky-500 text-white shadow-sm'
                                : 'bg-gray-300 text-white dark:bg-gray-600 dark:text-gray-200'
                            } ${activeFilters !== initialFilters && activeView === item.view ? 'ring-2 ring-white' : ''}`}>
                                {item.count}
                            </span>
                        )}
                    </button>
                ))}
            </div>
        </div>
    </div>
  );
};

export default App;
