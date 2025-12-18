import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbNavProps {
  items: BreadcrumbItem[];
}

export function BreadcrumbNav({ items }: BreadcrumbNavProps) {
  return (
    <nav className="flex items-center gap-1 text-xs font-medium tracking-wider">
      {items.map((item, index) => (
        <span key={index} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          <span className={index === items.length - 1 ? "text-accent" : "text-muted-foreground"}>
            {item.label}
          </span>
        </span>
      ))}
    </nav>
  );
}
