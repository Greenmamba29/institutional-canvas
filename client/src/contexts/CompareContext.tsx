import { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  name: string;
  country: string;
  rating: number;
  verification_tier: string;
}

interface CompareContextType {
  selectedSuppliers: Supplier[];
  addSupplier: (supplier: Supplier) => void;
  removeSupplier: (supplierId: string) => void;
  clearSuppliers: () => void;
  isSelected: (supplierId: string) => boolean;
  isCompareOpen: boolean;
  setIsCompareOpen: (open: boolean) => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selectedSuppliers, setSelectedSuppliers] = useState<Supplier[]>([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const { toast } = useToast();

  const addSupplier = (supplier: Supplier) => {
    // Check if already selected
    if (selectedSuppliers.some((s) => s.id === supplier.id)) {
      toast({
        title: 'Already added',
        description: `${supplier.name} is already in your comparison list.`,
        variant: 'default',
      });
      return;
    }

    // Check max limit (4 suppliers)
    if (selectedSuppliers.length >= 4) {
      toast({
        title: 'Maximum reached',
        description: 'You can compare up to 4 suppliers at once. Remove one to add another.',
        variant: 'destructive',
      });
      return;
    }

    setSelectedSuppliers((prev) => [...prev, supplier]);
    toast({
      title: 'Added to comparison',
      description: `${supplier.name} added. Compare ${selectedSuppliers.length + 1} of 4 suppliers.`,
    });
  };

  const removeSupplier = (supplierId: string) => {
    setSelectedSuppliers((prev) => prev.filter((s) => s.id !== supplierId));
  };

  const clearSuppliers = () => {
    setSelectedSuppliers([]);
    setIsCompareOpen(false);
  };

  const isSelected = (supplierId: string) => {
    return selectedSuppliers.some((s) => s.id === supplierId);
  };

  return (
    <CompareContext.Provider
      value={{
        selectedSuppliers,
        addSupplier,
        removeSupplier,
        clearSuppliers,
        isSelected,
        isCompareOpen,
        setIsCompareOpen,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error('useCompare must be used within CompareProvider');
  }
  return context;
}
