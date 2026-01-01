import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Users, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SessionCardProps {
  session: {
    id: string;
    scheduled_at: string;
    status: string;
    notes?: string | null;
    meeting_url?: string;
    suppliers?: {
      name?: string | null;
      logo_url?: string | null;
    } | null;
  };
  onJoin?: (session: SessionCardProps['session']) => void;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-primary/10 text-primary border-primary/20',
  in_progress: 'bg-green-500/10 text-green-500 border-green-500/20',
  completed: 'bg-muted text-muted-foreground',
  cancelled: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function SessionCard({ session, onJoin }: SessionCardProps) {
  const scheduledDate = new Date(session.scheduled_at);
  const isUpcoming = scheduledDate > new Date();
  const canJoin = session.status === 'scheduled' || session.status === 'in_progress';

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">
            {session.suppliers?.name || 'TeleBuy Session'}
          </CardTitle>
          <Badge variant="outline" className={statusColors[session.status] || statusColors.scheduled}>
            {session.status.replace('_', ' ')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>{format(scheduledDate, 'EEEE, MMM d, yyyy')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{format(scheduledDate, 'h:mm a')}</span>
        </div>
        {session.notes && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {session.notes}
          </p>
        )}
        <Button 
          className="w-full" 
          variant={canJoin ? 'default' : 'secondary'}
          disabled={!canJoin}
          onClick={() => onJoin?.(session)}
        >
          <Video className="h-4 w-4 mr-2" />
          {canJoin ? 'Join Session' : 'Session Ended'}
        </Button>
      </CardContent>
    </Card>
  );
}
