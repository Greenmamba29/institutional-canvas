/**
 * Follow Button Component
 * 
 * Displays follow status and allows users to follow/unfollow organizations.
 * Gating for messaging - must have mutual follow to message.
 */

import { Button } from '@/components/ui/button';
import { useFollowStatus, useFollowOrg } from '@/hooks/useMessaging';
import { UserPlus, UserCheck, Clock, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FollowButtonProps {
  targetOrgId: string;
  showMessageButton?: boolean;
  onMessageClick?: () => void;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function FollowButton({
  targetOrgId,
  showMessageButton = true,
  onMessageClick,
  className,
  size = 'default',
}: FollowButtonProps) {
  const { data: status, isLoading } = useFollowStatus(targetOrgId);
  const followMutation = useFollowOrg();

  if (isLoading) {
    return (
      <Button variant="outline" size={size} disabled className={className}>
        <Clock className="h-4 w-4 animate-pulse" />
      </Button>
    );
  }

  const handleFollow = () => {
    followMutation.mutate(targetOrgId);
  };

  // Mutual follow - can message
  if (status?.can_message) {
    return (
      <div className={cn('flex gap-2', className)}>
        <Button variant="outline" size={size} disabled>
          <UserCheck className="h-4 w-4 mr-2" />
          Following
        </Button>
        {showMessageButton && (
          <Button size={size} onClick={onMessageClick}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Message
          </Button>
        )}
      </div>
    );
  }

  // I follow them, waiting for acceptance
  if (status?.i_follow_them && status.my_follow_status === 'accepted') {
    if (status.their_follow_status === 'pending') {
      return (
        <Button variant="secondary" size={size} disabled className={className}>
          <Clock className="h-4 w-4 mr-2" />
          Awaiting Their Response
        </Button>
      );
    }
    return (
      <Button variant="secondary" size={size} disabled className={className}>
        <UserCheck className="h-4 w-4 mr-2" />
        Following (Waiting for Mutual)
      </Button>
    );
  }

  // I sent a follow request, pending
  if (status?.i_follow_them && status.my_follow_status === 'pending') {
    return (
      <Button variant="secondary" size={size} disabled className={className}>
        <Clock className="h-4 w-4 mr-2" />
        Request Pending
      </Button>
    );
  }

  // They follow me but I don't follow them - show follow back
  if (status?.they_follow_me && !status?.i_follow_them) {
    return (
      <Button 
        size={size} 
        onClick={handleFollow}
        disabled={followMutation.isPending}
        className={className}
      >
        <UserPlus className="h-4 w-4 mr-2" />
        Follow Back
      </Button>
    );
  }

  // Not following - show follow button
  return (
    <Button 
      variant="outline" 
      size={size} 
      onClick={handleFollow}
      disabled={followMutation.isPending}
      className={className}
    >
      <UserPlus className="h-4 w-4 mr-2" />
      {followMutation.isPending ? 'Sending...' : 'Follow'}
    </Button>
  );
}
