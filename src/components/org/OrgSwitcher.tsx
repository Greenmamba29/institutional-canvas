import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useOrganization } from '@/context/OrganizationContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building2, ChevronDown, Check, Plus } from 'lucide-react';

export function OrgSwitcher() {
  const { currentOrg, organizations, switchOrg, isLoading } = useOrganization();
  const [open, setOpen] = useState(false);

  if (isLoading || !currentOrg) {
    return null;
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-9">
          <Building2 className="h-4 w-4 text-muted-foreground" />
          <span className="max-w-[120px] truncate">{currentOrg.name}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Organizations</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              switchOrg(org.id);
              setOpen(false);
            }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{org.name}</span>
            </div>
            {org.id === currentOrg.id && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/onboarding" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>Create Organization</span>
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
