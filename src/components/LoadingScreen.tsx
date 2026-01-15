/**
 * Loading Screen Component
 * 
 * Full-screen loading indicator for Suspense boundaries and initial load.
 */

import { Loader2 } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingScreen({ 
  message = 'Loading...', 
  size = 'md' 
}: LoadingScreenProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
      <p className="mt-4 text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * Inline loading indicator for components
 */
export function LoadingSpinner({ 
  size = 'sm',
  className = '' 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <Loader2 
      className={`animate-spin text-muted-foreground ${sizeClasses[size]} ${className}`} 
    />
  );
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className="rounded-lg border bg-card p-6 animate-pulse"
        >
          <div className="h-4 bg-muted rounded w-3/4 mb-4" />
          <div className="h-3 bg-muted rounded w-1/2 mb-2" />
          <div className="h-3 bg-muted rounded w-2/3" />
        </div>
      ))}
    </>
  );
}

/**
 * Table skeleton for loading states
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {/* Header */}
      <div className="flex gap-4 border-b pb-3">
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
        <div className="h-4 bg-muted rounded w-1/4" />
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-2">
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
          <div className="h-4 bg-muted rounded w-1/4" />
        </div>
      ))}
    </div>
  );
}

export default LoadingScreen;
