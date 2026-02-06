/**
 * SkillActionButton
 * 
 * A button that executes a skill action with proper loading state
 * and error handling. Used for common skill-backed operations.
 */

import React from 'react';
import { Button, ButtonProps } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface SkillActionButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick: () => Promise<unknown>;
  loadingText?: string;
}

export function SkillActionButton({
  onClick,
  loadingText = 'Processing...',
  children,
  disabled,
  ...props
}: SkillActionButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleClick = async () => {
    if (isLoading || disabled) return;
    
    setIsLoading(true);
    try {
      await onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
