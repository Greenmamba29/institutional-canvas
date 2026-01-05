import { useEffect, useState, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Package, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { VideoControls } from './VideoControls';
import { TeleBuyActionBar } from './TeleBuyActionBar';
import { CreatePurchaseModal } from './CreatePurchaseModal';
import { DealReviewModal } from './DealReviewModal';
import { ConfirmPurchaseFlow } from './ConfirmPurchaseFlow';

interface VideoCallRoomProps {
  meetingUrl: string;
  meetingToken?: string;
  sessionId: string;
  dealName: string;
  supplierName?: string;
  supplierId?: string;
  dealId?: string;
  onLeave?: () => void;
}

export function VideoCallRoom({
  meetingUrl,
  meetingToken,
  sessionId,
  dealName,
  supplierName,
  supplierId,
  dealId,
  onLeave,
}: VideoCallRoomProps) {
  const [callFrame, setCallFrame] = useState<ReturnType<typeof DailyIframe.createFrame> | null>(null);
  const [notes, setNotes] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showCreatePurchaseModal, setShowCreatePurchaseModal] = useState(false);
  const [showDealReviewModal, setShowDealReviewModal] = useState(false);
  const [showConfirmPurchaseFlow, setShowConfirmPurchaseFlow] = useState(false);
  const queryClient = useQueryClient();

  // Save notes mutation using Supabase RPC
  const saveNotesMutation = useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await supabase
        .from('telebuy_sessions')
        .update({ notes: content })
        .eq('id', sessionId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      setLastSaved(new Date());
      toast.success('Notes saved');
      queryClient.invalidateQueries({ queryKey: ['telebuy-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to save notes:', error);
      toast.error('Failed to save notes');
    },
  });

  const handleSaveNotes = useCallback(() => {
    if (!notes.trim()) {
      toast.error('Please write some notes before saving');
      return;
    }
    saveNotesMutation.mutate(notes);
  }, [notes, saveNotesMutation]);

  // Auto-save notes every 30 seconds
  useEffect(() => {
    if (!notes || !isConnected) return;
    
    const interval = setInterval(() => {
      if (notes.trim()) {
        saveNotesMutation.mutate(notes);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [notes, isConnected, saveNotesMutation]);

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
      showLeaveButton: false, // We have our own controls
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

  const handleLeave = () => {
    // Save notes before leaving
    if (notes.trim()) {
      saveNotesMutation.mutate(notes);
    }
    onLeave?.();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-[calc(100vh-280px)]">
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
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Meeting Notes
                </CardTitle>
                {lastSaved && (
                  <Badge variant="outline" className="text-xs">
                    Saved {lastSaved.toLocaleTimeString()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <Textarea
                placeholder="Take notes during the call..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="min-h-[150px] text-sm"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Auto-saves every 30s
                </p>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleSaveNotes} 
                  disabled={saveNotesMutation.isPending}
                >
                  {saveNotesMutation.isPending ? (
                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-3 w-3 mr-2" />
                  )}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Video Controls Bar */}
      <VideoControls callFrame={callFrame} onLeave={handleLeave} />

      {/* TeleBuy Action Bar */}
      <TeleBuyActionBar
        onAddToCart={() => setShowCreatePurchaseModal(true)}
        onReviewAgreement={() => setShowDealReviewModal(true)}
        onConfirmPurchase={() => setShowConfirmPurchaseFlow(true)}
        isDisabled={!isConnected}
      />

      {/* Modals */}
      <CreatePurchaseModal
        open={showCreatePurchaseModal}
        onOpenChange={setShowCreatePurchaseModal}
        supplierId={supplierId}
        supplierName={supplierName}
        dealId={dealId}
      />

      <DealReviewModal
        open={showDealReviewModal}
        onOpenChange={setShowDealReviewModal}
        dealId={dealId}
      />

      <ConfirmPurchaseFlow
        open={showConfirmPurchaseFlow}
        onOpenChange={setShowConfirmPurchaseFlow}
        supplierId={supplierId}
        supplierName={supplierName}
        sessionId={sessionId}
      />
    </div>
  );
}
