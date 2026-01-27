import { WifiOff, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function Offline() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
            <WifiOff className="h-8 w-8 text-muted-foreground" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">You're Offline</h1>
            <p className="text-muted-foreground">
              It looks like you've lost your internet connection. Some features may be unavailable until you're back online.
            </p>
          </div>

          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full gap-2">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
            
            <p className="text-xs text-muted-foreground">
              LithiumBuy works best with an active internet connection. Your data will sync automatically when connectivity is restored.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
