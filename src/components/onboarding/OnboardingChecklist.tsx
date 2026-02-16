import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, User, Store, FileText, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const LS_DISMISSED = 'lithiumbuy_checklist_dismissed';
const LS_MARKETPLACE = 'lithiumbuy_marketplace_visited';

interface ChecklistItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  done: boolean;
}

export function OnboardingChecklist() {
  const [dismissed, setDismissed] = useState(true);
  const { user } = useAuth();
  const [marketplaceVisited, setMarketplaceVisited] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(LS_DISMISSED) === 'true');
    setMarketplaceVisited(localStorage.getItem(LS_MARKETPLACE) === 'true');
  }, []);

  if (dismissed) return null;

  const hasProfile = !!user?.user_metadata?.full_name;

  const items: ChecklistItem[] = [
    { id: 'profile', label: 'Complete your profile', path: '/settings', icon: User, done: hasProfile },
    { id: 'marketplace', label: 'Explore the marketplace', path: '/marketplace', icon: Store, done: marketplaceVisited },
    { id: 'rfq', label: 'Create your first RFQ', path: '/rfqs', icon: FileText, done: false },
  ];

  const completed = items.filter(i => i.done).length;
  const progress = Math.round((completed / items.length) * 100);

  const handleDismiss = () => {
    localStorage.setItem(LS_DISMISSED, 'true');
    setDismissed(true);
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">Getting Started</CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={handleDismiss}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-3">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="text-xs font-medium text-muted-foreground">{completed}/{items.length}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 pt-0">
        {items.map(item => (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => { if (item.id === 'marketplace') localStorage.setItem(LS_MARKETPLACE, 'true'); }}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-secondary/50 transition-colors group"
          >
            {item.done ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
            ) : (
              <Circle className="h-5 w-5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors" />
            )}
            <span className={`text-sm ${item.done ? 'line-through text-muted-foreground' : 'font-medium'}`}>
              {item.label}
            </span>
            <item.icon className="h-4 w-4 text-muted-foreground ml-auto shrink-0" />
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
