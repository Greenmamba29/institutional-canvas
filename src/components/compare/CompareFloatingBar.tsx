import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCompare } from "@/context/CompareContext";
import { Scale, X, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { CompareModal } from "./CompareModal";

export function CompareFloatingBar() {
  const { items, removeItem, clearAll } = useCompare();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (items.length === 0) return null;

  return (
    <>
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="glass-panel border border-border/50 rounded-full px-4 py-2 shadow-lg flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">
              Compare
            </span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {items.length}/4
            </Badge>
          </div>

          <div className="flex items-center gap-1">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1 bg-muted/50 rounded-full pl-2 pr-1 py-0.5"
              >
                <span className="text-xs truncate max-w-20">{item.name}</span>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-0.5 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-xs h-7 px-2"
            >
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="h-7 px-3 gap-1"
            >
              <ChevronUp className="h-3 w-3" />
              Compare Now
            </Button>
          </div>
        </div>
      </div>

      <CompareModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}
