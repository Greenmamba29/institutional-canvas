import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface CompareItem {
  id: string;
  name: string;
  type: "supplier" | "product";
  data: Record<string, unknown>;
}

interface CompareContextType {
  items: CompareItem[];
  addItem: (item: CompareItem) => void;
  removeItem: (id: string) => void;
  clearAll: () => void;
  isInCompare: (id: string) => boolean;
  canAdd: boolean;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

const MAX_COMPARE_ITEMS = 4;

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CompareItem[]>([]);

  const addItem = useCallback((item: CompareItem) => {
    setItems((prev) => {
      if (prev.length >= MAX_COMPARE_ITEMS) return prev;
      if (prev.some((i) => i.id === item.id)) return prev;
      return [...prev, item];
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setItems([]);
  }, []);

  const isInCompare = useCallback(
    (id: string) => items.some((i) => i.id === id),
    [items]
  );

  const canAdd = items.length < MAX_COMPARE_ITEMS;

  return (
    <CompareContext.Provider
      value={{ items, addItem, removeItem, clearAll, isInCompare, canAdd }}
    >
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error("useCompare must be used within CompareProvider");
  }
  return context;
}
