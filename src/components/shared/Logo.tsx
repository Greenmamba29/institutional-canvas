import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  variant?: 'full' | 'icon' | 'wordmark';
  className?: string;
  layoutLabel?: string;
}

const sizeMap = {
  sm: { icon: 'h-8 w-8', text: 'text-lg' },
  md: { icon: 'h-10 w-10', text: 'text-xl' },
  lg: { icon: 'h-12 w-12', text: 'text-2xl' },
  xl: { icon: 'h-16 w-16', text: 'text-3xl' },
};

export function Logo({ 
  size = 'md', 
  showText = true, 
  variant = 'full',
  className,
  layoutLabel = 'Verified Marketplace'
}: LogoProps) {
  const sizes = sizeMap[size];

  if (variant === 'wordmark') {
    return (
      <div className={cn('flex flex-col', className)}>
        <span className={cn('font-bold tracking-tight', sizes.text)}>
          LithiumBuy
        </span>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
          {layoutLabel}
        </span>
      </div>
    );
  }

  if (variant === 'icon') {
    return (
      <img 
        src={logoImage} 
        alt="LithiumBuy" 
        className={cn(sizes.icon, 'object-contain', className)} 
      />
    );
  }

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img 
        src={logoImage} 
        alt="LithiumBuy" 
        className={cn(sizes.icon, 'object-contain')} 
      />
      {showText && (
        <div className="flex flex-col">
          <span className={cn('font-bold tracking-tight', sizes.text)}>
            LithiumBuy
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest">
            {layoutLabel}
          </span>
        </div>
      )}
    </div>
  );
}
