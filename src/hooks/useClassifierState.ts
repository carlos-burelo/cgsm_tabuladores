import { useState, useEffect } from 'react';
import { getUnclassifiedConceptsAction, getServiceTypesAction } from '@/lib/actions';
import { toast } from 'sonner';

export interface Concept {
  id: number;
  name: string;
  proveedor: string;
  precio?: number;
}

export interface ServiceType {
  id: number;
  name: string;
  description?: string | null;
}

export function useClassifierState() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [standardName, setStandardName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [sortBy, setSortBy] = useState<'name' | 'price-asc' | 'price-desc'>('name');
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>([]);
  const [selectedServiceType, setSelectedServiceType] = useState<number | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargar tipos de servicio
        const types = await getServiceTypesAction();
        setServiceTypes(types);
        if (types.length > 0) {
          setSelectedServiceType(types[0].id);
        }
      } catch (error) {
        console.error('Error loading service types:', error);
        toast.error('Error al cargar tipos de servicio');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    const loadConcepts = async () => {
      try {
        const unclassified = await getUnclassifiedConceptsAction(selectedServiceType || undefined);
        setConcepts(unclassified);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Error al cargar conceptos');
      }
    };

    if (selectedServiceType) {
      loadConcepts();
    }
  }, [selectedServiceType]);

  const getFilteredAndSortedConcepts = (): Concept[] => {
    return concepts
      .filter(c => c.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => {
        if (sortBy === 'name') {
          return a.name.localeCompare(b.name);
        } else if (sortBy === 'price-asc') {
          return (a.precio ?? 0) - (b.precio ?? 0);
        } else if (sortBy === 'price-desc') {
          return (b.precio ?? 0) - (a.precio ?? 0);
        }
        return 0;
      });
  };

  const toggleSelect = (id: number) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  return {
    concepts,
    setConcepts,
    isLoading,
    filter,
    setFilter,
    selectedIds,
    setSelectedIds,
    standardName,
    setStandardName,
    isSaving,
    setIsSaving,
    sortBy,
    setSortBy,
    getFilteredAndSortedConcepts,
    toggleSelect,
    serviceTypes,
    selectedServiceType,
    setSelectedServiceType,
  };
}
