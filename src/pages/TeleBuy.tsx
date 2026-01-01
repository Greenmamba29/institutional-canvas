import { useState } from 'react';
import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Video, Plus, MessageSquare, FileText, PenTool, ShoppingCart, Package, Loader2 } from "lucide-react";
import { SterlingAgent } from "@/components/elevenlabs";
import { useTelebuySessions, useUpcomingSessions } from '@/hooks/useTelebuy';
import { SessionCard } from '@/components/telebuy/SessionCard';
import { CreateSessionModal } from '@/components/telebuy/CreateSessionModal';
import { VideoCallRoom } from '@/components/telebuy/VideoCallRoom';
import { EmptyState } from '@/components/shared/EmptyState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TeleBuy() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeSession, setActiveSession] = useState<{
    id: string;
    meetingUrl: string;
    meetingToken?: string;
    dealName: string;
    supplierName?: string;
  } | null>(null);

  const { data: sessions, isLoading: sessionsLoading, refetch } = useTelebuySessions();
  const { data: upcomingSessions, isLoading: upcomingLoading } = useUpcomingSessions(5);

  const handleJoinSession = (session: any) => {
    if (session.meeting_url) {
      setActiveSession({
        id: session.id,
        meetingUrl: session.meeting_url,
        meetingToken: session.meeting_token,
        dealName: session.notes || 'TeleBuy Session',
        supplierName: session.suppliers?.name,
      });
    }
  };

  const handleLeaveSession = () => {
    setActiveSession(null);
    refetch();
  };

  // If in active video call, show video room
  if (activeSession) {
    return (
      <LayoutShell>
        <PageHeader
          title="TeleBuy Connect"
          description={`In call: ${activeSession.dealName}`}
        />
        <div className="mt-6">
          <VideoCallRoom
            meetingUrl={activeSession.meetingUrl}
            meetingToken={activeSession.meetingToken}
            sessionId={activeSession.id}
            dealName={activeSession.dealName}
            supplierName={activeSession.supplierName}
            onLeave={handleLeaveSession}
          />
        </div>
      </LayoutShell>
    );
  }

  return (
    <LayoutShell>
      <PageHeader
        title="TeleBuy Connect"
        description="Video-first negotiation platform for B2B lithium deals"
      />

      <div className="flex gap-6 mt-6">
        {/* Left Rail Navigation */}
        <div className="hidden md:flex flex-col gap-2 w-16 shrink-0">
          <Button variant="ghost" size="icon" className="h-12 w-12 bg-primary/10 text-primary">
            <MessageSquare className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12">
            <Package className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12">
            <FileText className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12">
            <PenTool className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-12 w-12">
            <ShoppingCart className="h-5 w-5" />
          </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button 
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              New TeleBuy Session
            </Button>
          </div>

          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList>
              <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
              <TabsTrigger value="all">All Sessions</TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="mt-4">
              {upcomingLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : upcomingSessions && upcomingSessions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingSessions.map((session: any) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoinSession}
                    />
                  ))}
                  <SterlingAgent />
                </div>
              ) : (
                <EmptyState
                  icon={Video}
                  title="No upcoming sessions"
                  description="Schedule a TeleBuy session to start negotiating with suppliers"
                  action={{
                    label: 'Schedule Session',
                    onClick: () => setShowCreateModal(true),
                    icon: Plus,
                  }}
                />
              )}
            </TabsContent>

            <TabsContent value="all" className="mt-4">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sessions && sessions.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {sessions.map((session: any) => (
                    <SessionCard
                      key={session.id}
                      session={session}
                      onJoin={handleJoinSession}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={Video}
                  title="No sessions yet"
                  description="Your TeleBuy video sessions will appear here"
                  action={{
                    label: 'Schedule Session',
                    onClick: () => setShowCreateModal(true),
                    icon: Plus,
                  }}
                />
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <CreateSessionModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onSuccess={() => refetch()}
      />
    </LayoutShell>
  );
}
