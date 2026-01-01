import { Button } from "@/components/ui/button";
import { useCompare, CompareItem } from "@/context/CompareContext";
import { Scale, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AddToCompareButtonProps {
  item: CompareItem;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function AddToCompareButton({
  item,
  variant = "outline",
  size = "sm",
  className,
}: AddToCompareButtonProps) {
  const { addItem, removeItem, isInCompare, canAdd } = useCompare();
  const inCompare = isInCompare(item.id);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    if (inCompare) {
      removeItem(item.id);
    } else if (canAdd) {
      addItem(item);
    }
  };

  return (
    <Button
      variant={inCompare ? "secondary" : variant}
      size={size}
      onClick={handleClick}
      disabled={!inCompare && !canAdd}
      className={cn("gap-1.5", className)}
    >
      {inCompare ? (
        <>
          <Check className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Comparing</span>
        </>
      ) : (
        <>
          <Scale className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Compare</span>
        </>
      )}
    </Button>
  );
}
