import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';

const LS_KEY = 'lithiumbuy_welcome_seen';

export function WelcomeModal() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const seen = localStorage.getItem(LS_KEY);
    const isNew = sessionStorage.getItem('is_new_user');
    if (!seen && isNew) {
      setOpen(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(LS_KEY, 'true');
    sessionStorage.removeItem('is_new_user');
    setOpen(false);
  };

  const startTour = () => {
    dismiss();
    navigate('/onboarding');
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) dismiss(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-4 pt-2">
          <div className="flex justify-center">
            <div className="p-4 rounded-2xl bg-gradient-gold">
              <Sparkles className="h-8 w-8 text-accent-foreground" />
            </div>
          </div>
          <DialogTitle className="text-2xl">Welcome to LithiumBuy! 🎉</DialogTitle>
          <DialogDescription className="text-base">
            You've joined the world's leading B2B marketplace for lithium procurement and battery recycling. 
            Let's get you started with a quick tour of the platform.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 pt-4">
          <Button onClick={startTour} className="w-full gap-2">
            Take a Quick Tour <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={dismiss} className="w-full text-muted-foreground">
            Skip for Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
