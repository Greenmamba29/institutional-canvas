/**
 * TeleBuy Page - Video-first B2B negotiation platform
 * 
 * Features:
 * - Schedule video negotiation sessions with suppliers
 * - Real-time session status updates
 * - Session detail view with VideoCallRoom
 * - AI transcription and document management
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Video,
  Users,
  Clock,
  Plus,
  MessageSquare,
  FileText,
  PenTool,
  ShoppingCart,
  Package,
  Calendar,
  ExternalLink,
  XCircle,
  CheckCircle2,
  PlayCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { CreateTelebuySessionDialog } from "@/components/telebuy/CreateTelebuySessionDialog";
import { VideoCallRoom } from "@/components/telebuy/VideoCallRoom";
import {
  useTelebuySessions,
  useUpcomingSessions,
  useUpdateSessionStatus,
  useTelebuySession,
} from "@/hooks/useTelebuy";
import type { TelebuySession } from "@/services/telebuy.service";
import { cn } from "@/lib/utils";

// Status badge configurations
const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon: React.ElementType }> = {
  scheduled: { label: 'Scheduled', variant: 'outline', icon: Calendar },
  in_progress: { label: 'In Progress', variant: 'default', icon: PlayCircle },
  completed: { label: 'Completed', variant: 'secondary', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', variant: 'destructive', icon: XCircle },
};

function formatSessionDate(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, yyyy h:mm a');
}

interface SessionCardProps {
  session: TelebuySession;
  onJoinSession: (session: TelebuySession) => void;
}

function SessionCard({ session, onJoinSession }: SessionCardProps) {
  const updateStatus = useUpdateSessionStatus();
  const config = statusConfig[session.status] || statusConfig.scheduled;
  const StatusIcon = config.icon;
  
  const handleJoin = () => {
    // For Google Meet, open in new tab
    if (session.meeting_url?.includes('meet.google.com')) {
      window.open(session.meeting_url, '_blank');
    } else {
      // For Daily.co or demo sessions, navigate to session view
      onJoinSession(session);
    }
    
    // Mark as in_progress when joining
    if (session.status === 'scheduled') {
      updateStatus.mutate({
        sessionId: session.id,
        status: 'in_progress',
      });
    }
  };

  const handleComplete = () => {
    updateStatus.mutate({
      sessionId: session.id,
      status: 'completed',
    });
  };

  const handleCancel = () => {
    updateStatus.mutate({
      sessionId: session.id,
      status: 'cancelled',
    });
  };

  return (
    <Card className="hover:border-primary/30 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-base font-semibold">
            Session #{session.id.slice(-6).toUpperCase()}
          </CardTitle>
          <Badge
            variant={config.variant}
            className={cn(
              session.status === 'scheduled' && 'bg-primary/10 text-primary border-primary/20',
              session.status === 'in_progress' && 'bg-green-500/20 text-green-700 border-green-500/30'
            )}
          >
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
        {session.notes && (
          <CardDescription className="line-clamp-2 mt-1">
            {session.notes}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{formatSessionDate(session.scheduled_at)}</span>
        </div>
        
        {session.meeting_url && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-4 w-4" />
            <span className="truncate text-xs">{session.meeting_url}</span>
          </div>
        )}

        {/* Action buttons based on status */}
        <div className="flex gap-2">
          {session.status === 'scheduled' && (
            <>
              <Button className="flex-1" variant="default" onClick={handleJoin}>
                <Video className="h-4 w-4 mr-2" />
                Join Session
              </Button>
              <Button variant="outline" size="icon" onClick={handleCancel}>
                <XCircle className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {session.status === 'in_progress' && (
            <>
              <Button className="flex-1" variant="default" onClick={handleJoin}>
                <Video className="h-4 w-4 mr-2" />
                Rejoin Session
              </Button>
              <Button variant="secondary" size="icon" onClick={handleComplete}>
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </>
          )}
          
          {(session.status === 'completed' || session.status === 'cancelled') && (
            <Button className="w-full" variant="outline" disabled>
              <FileText className="h-4 w-4 mr-2" />
              View Recording
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SessionsLoading() {
  return (
    <>
      {[1, 2].map((i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-5 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      ))}
    </>
  );
}

function EmptyState() {
  return (
    <Card className="border-dashed border-2 bg-muted/20 col-span-full">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <Video className="h-12 w-12 text-muted-foreground/50 mb-4" />
        <h3 className="font-semibold text-lg mb-2">No TeleBuy Sessions</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">
          Schedule your first video negotiation session with a supplier to get started.
        </p>
        <CreateTelebuySessionDialog />
      </CardContent>
    </Card>
  );
}

// Session Detail View Component
function SessionDetailView({ sessionId }: { sessionId: string }) {
  const navigate = useNavigate();
  const { data: session, isLoading, error } = useTelebuySession(sessionId);
  const updateStatus = useUpdateSessionStatus();
  
  const handleLeaveSession = () => {
    navigate('/telebuy');
  };
  
  const handleEndSession = () => {
    updateStatus.mutate({
      sessionId,
      status: 'completed',
    });
    navigate('/telebuy');
  };
  
  if (isLoading) {
    return (
      <>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/telebuy')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-48" />
        </div>
        <Skeleton className="h-[600px] w-full" />
      </>
    );
  }
  
  if (error || !session) {
    return (
      <>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/telebuy')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <PageHeader title="Session Not Found" />
        </div>
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="py-8 text-center">
            <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Session Not Found</h3>
            <p className="text-muted-foreground mb-4">
              The session you're looking for doesn't exist or has been removed.
            </p>
            <Button onClick={() => navigate('/telebuy')}>
              Back to TeleBuy
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }
  
  // Determine if this is a Daily.co session or demo
  const isDailySession = session.meeting_url?.includes('daily.co') || !session.meeting_url;
  
  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={handleLeaveSession}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">
                Session #{session.id.slice(-6).toUpperCase()}
              </h1>
              <p className="text-sm text-muted-foreground">
                {formatSessionDate(session.scheduled_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className="bg-green-500/20 text-green-700 border-green-500/30"
            >
              <PlayCircle className="h-3 w-3 mr-1" />
              Live
            </Badge>
            <Button variant="destructive" onClick={handleEndSession}>
              End Session
            </Button>
          </div>
        </div>
        
        {/* Video Room */}
        {isDailySession ? (
          <VideoCallRoom 
            meetingUrl={session.meeting_url || `https://lithiumbuy.daily.co/demo-${sessionId.slice(-8)}`}
            sessionId={sessionId}
            dealName={`Session #${session.id.slice(-6).toUpperCase()}`}
            supplierName={session.supplier_id ? 'Supplier' : undefined}
            supplierId={session.supplier_id ?? undefined}
            onLeave={handleLeaveSession}
          />
        ) : (
          <Card className="h-[600px] flex items-center justify-center bg-muted/50">
            <CardContent className="text-center">
              <Video className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">External Meeting</h3>
              <p className="text-muted-foreground mb-4 max-w-sm">
                This session uses an external video platform. Click below to join.
              </p>
              <Button asChild>
                <a href={session.meeting_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Meeting
                </a>
              </Button>
            </CardContent>
          </Card>
        )}
        
        {/* Session Info */}
        {session.notes && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Session Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{session.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}

// Main TeleBuy Page
export default function TeleBuy() {
  const { id: sessionId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: sessions, isLoading, error } = useTelebuySessions();
  const { data: upcomingSessions } = useUpcomingSessions();
  const [activeTab, setActiveTab] = useState<'chat' | 'products' | 'docs' | 'sign' | 'cart'>('chat');

  // If we have a session ID in the URL, show the session detail view
  if (sessionId) {
    return <SessionDetailView sessionId={sessionId} />;
  }

  const handleJoinSession = (session: TelebuySession) => {
    navigate(`/telebuy/session/${session.id}`);
  };

  const navItems = [
    { id: 'chat' as const, icon: MessageSquare, label: 'Chat' },
    { id: 'products' as const, icon: Package, label: 'Products' },
    { id: 'docs' as const, icon: FileText, label: 'Documents' },
    { id: 'sign' as const, icon: PenTool, label: 'E-Sign' },
    { id: 'cart' as const, icon: ShoppingCart, label: 'Cart' },
  ];

  return (
    <>
      <PageHeader
        title="TeleBuy Connect"
        description="Video-first negotiation platform for B2B lithium and recycling deals"
      />

      <div className="flex gap-6 mt-6">
        {/* Left Rail Navigation */}
        <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
          {navItems.map(({ id, icon: Icon, label }) => (
            <Button
              key={id}
              variant="ghost"
              size="icon"
              className={cn(
                "h-12 w-12",
                activeTab === id && "bg-primary/10 text-primary"
              )}
              onClick={() => setActiveTab(id)}
              title={label}
            >
              <Icon className="h-5 w-5" />
            </Button>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Stats Summary */}
          {upcomingSessions && upcomingSessions.length > 0 && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-accent" />
              <span className="text-sm">
                <strong>{upcomingSessions.length}</strong> upcoming session{upcomingSessions.length !== 1 && 's'} in the next 24 hours
              </span>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <CreateTelebuySessionDialog />
            <Button variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Join Meeting
            </Button>
          </div>

          {/* Error State */}
          {error && (
            <Card className="border-destructive bg-destructive/10">
              <CardContent className="py-4 flex items-center gap-3">
                <XCircle className="h-5 w-5 text-destructive" />
                <span className="text-sm text-destructive">
                  Failed to load sessions. Please try again.
                </span>
              </CardContent>
            </Card>
          )}

          {/* Sessions Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {isLoading && <SessionsLoading />}
            
            {!isLoading && !error && sessions?.length === 0 && <EmptyState />}
            
            {!isLoading && sessions?.map((session) => (
              <SessionCard 
                key={session.id} 
                session={session} 
                onJoinSession={handleJoinSession}
              />
            ))}

            {/* Privacy & AI Controls Tile */}
            <Card className="border-dashed border-2 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Privacy & AI Controls
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure recording, transcription, and AI assistance settings for your sessions.
                </p>
                <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  AI-powered transcription and negotiation insights available with Pro subscription
                </div>
                <Button variant="outline" className="w-full" asChild>
                  <a href="/settings/billing">Upgrade to Pro</a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
