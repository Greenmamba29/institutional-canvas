import { useEffect, useState } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Phone, FileText, Package, Save } from 'lucide-react';
import { toast } from 'sonner';

interface VideoCallRoomProps {
  meetingUrl: string;
  meetingToken?: string;
  sessionId: string;
  dealName: string;
  supplierName?: string;
  onLeave?: () => void;
}

export function VideoCallRoom({
  meetingUrl,
  meetingToken,
  sessionId,
  dealName,
  supplierName,
  onLeave,
}: VideoCallRoomProps) {
  const [callFrame, setCallFrame] = useState<ReturnType<typeof DailyIframe.createFrame> | null>(null);
  const [notes, setNotes] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const container = document.getElementById('daily-video-container');
    if (!container) return;

    const frame = DailyIframe.createFrame(container, {
      iframeStyle: {
        width: '100%',
        height: '100%',
        border: '0',
        borderRadius: '8px',
      },
      showLeaveButton: true,
      showFullscreenButton: true,
    });

    frame.on('joined-meeting', () => {
      setIsConnected(true);
      toast.success('Connected to meeting');
    });

    frame.on('left-meeting', () => {
      setIsConnected(false);
      onLeave?.();
    });

    frame.on('error', (error) => {
      console.error('Daily.co error:', error);
      toast.error('Video call error occurred');
    });

    const joinOptions: { url: string; token?: string } = { url: meetingUrl };
    if (meetingToken) {
      joinOptions.token = meetingToken;
    }

    frame.join(joinOptions).catch((err) => {
      console.error('Failed to join meeting:', err);
      toast.error('Failed to join meeting');
    });

    setCallFrame(frame);

    return () => {
      frame.destroy();
    };
  }, [meetingUrl, meetingToken, onLeave]);

  const handleEndCall = () => {
    if (callFrame) {
      callFrame.leave();
    }
  };

  const handleSaveNotes = () => {
    // TODO: Save notes to session via RPC
    console.log('Saving notes for session:', sessionId, notes);
    toast.success('Notes saved');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-200px)]">
      {/* Video Container */}
      <div className="lg:col-span-3 bg-muted rounded-lg overflow-hidden">
        <div id="daily-video-container" className="w-full h-full min-h-[400px]" />
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Session Info */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4" />
              Session Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Deal</p>
              <p className="text-sm font-medium">{dealName}</p>
            </div>
            {supplierName && (
              <div>
                <p className="text-xs text-muted-foreground">Supplier</p>
                <p className="text-sm font-medium">{supplierName}</p>
              </div>
            )}
            <Badge variant={isConnected ? 'default' : 'secondary'}>
              {isConnected ? 'Connected' : 'Connecting...'}
            </Badge>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Meeting Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Textarea
              placeholder="Take notes during the call..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[150px] text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleSaveNotes} className="w-full">
              <Save className="h-3 w-3 mr-2" />
              Save Notes
            </Button>
          </CardContent>
        </Card>

        {/* End Call Button */}
        <Button variant="destructive" onClick={handleEndCall} className="w-full">
          <Phone className="h-4 w-4 mr-2" />
          End Call
        </Button>
      </div>
    </div>
  );
}
