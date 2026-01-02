import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';
import { VideoControls } from './VideoControls';

interface VideoCallRoomProps {
  roomUrl: string;
  onLeave?: () => void;
  showControls?: boolean;
}

export function VideoCallRoom({ roomUrl, onLeave, showControls = true }: VideoCallRoomProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callState, setCallState] = useState<'idle' | 'joining' | 'joined' | 'left'>('idle');

  useEffect(() => {
    if (!roomUrl) {
      setError('No room URL provided');
      setIsLoading(false);
      return;
    }

    // Validate Daily.co URL format
    if (!roomUrl.includes('daily.co')) {
      setError('Invalid Daily.co room URL');
      setIsLoading(false);
      return;
    }

    setCallState('joining');
    setIsLoading(false);

    // Listen for messages from Daily.co iframe
    const handleMessage = (event: MessageEvent) => {
      // Only accept messages from Daily.co
      if (!event.origin.includes('daily.co')) return;

      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        switch (data.action) {
          case 'joined-meeting':
            setCallState('joined');
            break;
          case 'left-meeting':
            setCallState('left');
            onLeave?.();
            break;
          case 'error':
            setError(data.errorMsg || 'An error occurred during the call');
            break;
        }
      } catch (err) {
        console.error('Error parsing Daily.co message:', err);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [roomUrl, onLeave]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  if (error) {
    return (
      <Card className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </Card>
    );
  }

  return (
    <div className="relative w-full">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10 rounded-lg">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-gold" />
            <p className="text-sm text-muted-foreground">Connecting to video call...</p>
          </div>
        </div>
      )}

      <div className="relative bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <iframe
          ref={iframeRef}
          src={roomUrl}
          allow="camera; microphone; fullscreen; speaker; display-capture"
          className="w-full h-full border-0"
          onLoad={handleIframeLoad}
          title="Video Call"
        />
      </div>

      {showControls && callState === 'joined' && (
        <div className="mt-4">
          <VideoControls
            roomUrl={roomUrl}
            onLeave={() => {
              setCallState('left');
              onLeave?.();
            }}
          />
        </div>
      )}

      {callState === 'left' && (
        <Card className="mt-4 p-4">
          <p className="text-center text-muted-foreground">You have left the call</p>
        </Card>
      )}
    </div>
  );
}
