import { LayoutShell } from "@/components/layout/LayoutShell";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Users, Clock, Plus, MessageSquare, FileText, PenTool, ShoppingCart, Package } from "lucide-react";

const mockSessions = [
  {
    id: "session-001",
    dealName: "Lithium Carbonate Q1 Supply",
    participants: ["Diego Santos", "Maria Chen", "John Smith"],
    scheduledAt: "Today, 2:00 PM",
    status: "scheduled",
  },
  {
    id: "session-002",
    dealName: "Hydroxide Pricing Negotiation",
    participants: ["Alex Rivera", "Sarah Kim"],
    scheduledAt: "Tomorrow, 10:00 AM",
    status: "scheduled",
  },
];

export default function TeleBuy() {
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
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Plus className="h-4 w-4 mr-2" />
              New TeleBuy Session
            </Button>
            <Button variant="outline">
              <Video className="h-4 w-4 mr-2" />
              Join Meeting
            </Button>
          </div>

          {/* Sessions Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {mockSessions.map((session) => (
              <Card key={session.id} className="hover:border-primary/30 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base font-semibold">
                      {session.dealName}
                    </CardTitle>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      {session.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{session.scheduledAt}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{session.participants.join(", ")}</span>
                  </div>
                  <Button className="w-full" variant="default">
                    <Video className="h-4 w-4 mr-2" />
                    Join Session
                  </Button>
                </CardContent>
              </Card>
            ))}

            {/* Mediator/AI Controls Tile */}
            <Card className="border-dashed border-2 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-base">Privacy & AI Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Configure recording, transcription, and AI assistance settings for your sessions.
                </p>
                <div className="text-xs text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                  {/* TODO: Realtime publish later: subscribe to session events + notification events */}
                  AI features require Pro subscription
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </LayoutShell>
  );
}
