/**
 * Chain of Custody Page
 * 
 * Tracks material provenance from origin to delivery.
 * Essential for B2B lithium trading compliance and transparency.
 */

import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Package, 
  ArrowLeft, 
  Filter, 
  Search,
  TrendingUp,
  Shield,
  FileCheck,
  MapPin
} from 'lucide-react';
import { LayoutShell } from '@/components/layout/LayoutShell';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CustodyTimeline } from '@/components/chain-of-custody/CustodyTimeline';
import { useCustodyChains, useCustodyChain } from '@/hooks/useCustodyEvents';
import { custodyEventConfig, type CustodyChain } from '@/services/custody.service';
import { cn } from '@/lib/utils';

function ChainCard({ chain, isSelected, onClick }: { 
  chain: CustodyChain; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const statusConfig = custodyEventConfig[chain.currentStatus];
  const isComplete = chain.currentStatus === 'delivery';
  
  return (
    <Card 
      className={cn(
        "cursor-pointer transition-all hover:border-primary/50",
        isSelected && "border-primary ring-2 ring-primary/20"
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-primary" />
            <span className="font-medium">{chain.productType}</span>
          </div>
          <Badge 
            variant="outline" 
            className={cn(statusConfig.bgColor, statusConfig.color, "border-0 text-xs")}
          >
            {statusConfig.label}
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>{chain.originCountry}</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>{chain.quantity} {chain.unit}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-3 pt-3 border-t text-xs text-muted-foreground">
          <span>{chain.events.length} events</span>
          <span>•</span>
          <span>{chain.events.filter(e => e.verifiedBy).length} verified</span>
          {isComplete && (
            <>
              <span>•</span>
              <span className="text-green-600 font-medium">Complete</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ChainsLoading() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-1" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-2">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <Shield className="h-16 w-16 text-muted-foreground/30 mb-4" />
        <h3 className="font-semibold text-xl mb-2">No Chain of Custody Records</h3>
        <p className="text-muted-foreground max-w-md mb-6">
          Chain of custody records will appear here once orders are placed and materials begin their journey through the supply chain.
        </p>
        <Button asChild>
          <Link to="/orders">View Orders</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ChainOfCustody() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedChainId = searchParams.get('chain');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: chains = [], isLoading } = useCustodyChains();
  const { data: selectedChain } = useCustodyChain(selectedChainId || undefined);
  
  // Filter chains by search query
  const filteredChains = chains.filter(chain => 
    chain.productType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chain.originCountry.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chain.orderId.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  // Auto-select first chain if none selected
  const displayChain = selectedChain || (filteredChains.length > 0 ? filteredChains[0] : null);
  
  const handleChainSelect = (chainId: string) => {
    setSearchParams({ chain: chainId });
  };
  
  return (
    <LayoutShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <PageHeader
            title="Chain of Custody"
            description="Track material provenance from origin to delivery with verified documentation"
          />
        </div>
        
        {/* Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{chains.length}</p>
                <p className="text-xs text-muted-foreground">Active Chains</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Shield className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {chains.reduce((acc, c) => acc + c.events.filter(e => e.verifiedBy).length, 0)}
                </p>
                <p className="text-xs text-muted-foreground">Verified Events</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <FileCheck className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {chains.reduce((acc, c) => acc + c.events.reduce((a, e) => a + e.documents.length, 0), 0)}
                </p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <TrendingUp className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {chains.filter(c => c.currentStatus === 'delivery').length}
                </p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Chain List Sidebar */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search chains..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
            
            {isLoading ? (
              <ChainsLoading />
            ) : filteredChains.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="py-8 text-center text-sm text-muted-foreground">
                  {searchQuery ? 'No chains match your search' : 'No chains available'}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {filteredChains.map((chain) => (
                  <ChainCard
                    key={chain.id}
                    chain={chain}
                    isSelected={chain.id === (selectedChainId || displayChain?.id)}
                    onClick={() => handleChainSelect(chain.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Timeline Detail */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <Card>
                <CardContent className="p-6">
                  <Skeleton className="h-8 w-1/2 mb-4" />
                  <Skeleton className="h-4 w-3/4 mb-6" />
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                  </div>
                </CardContent>
              </Card>
            ) : displayChain ? (
              <CustodyTimeline chain={displayChain} />
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
