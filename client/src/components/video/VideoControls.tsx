import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Monitor,
  MonitorOff,
  PhoneOff,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoControlsProps {
  roomUrl: string;
  onLeave: () => void;
}

export function VideoControls({ roomUrl, onLeave }: VideoControlsProps) {
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  // Send control messages to Daily.co iframe
  const sendControlMessage = (action: string, data?: any) => {
    const iframe = document.querySelector('iframe[title="Video Call"]') as HTMLIFrameElement;
    if (iframe && iframe.contentWindow) {
      iframe.contentWindow.postMessage(
        {
          action,
          ...data,
        },
        '*'
      );
    }
  };

  const toggleCamera = () => {
    const newState = !cameraOn;
    setCameraOn(newState);
    sendControlMessage('set-camera', { on: newState });
  };

  const toggleMic = () => {
    const newState = !micOn;
    setMicOn(newState);
    sendControlMessage('set-microphone', { on: newState });
  };

  const toggleScreenShare = () => {
    const newState = !screenShareOn;
    setScreenShareOn(newState);
    sendControlMessage(newState ? 'start-screen-share' : 'stop-screen-share');
  };

  const toggleSpeaker = () => {
    const newState = !speakerOn;
    setSpeakerOn(newState);
    sendControlMessage('set-speaker', { on: newState });
  };

  const handleLeave = () => {
    sendControlMessage('leave-meeting');
    onLeave();
  };

  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-card rounded-lg border border-border">
      {/* Camera Toggle */}
      <Button
        variant={cameraOn ? 'default' : 'destructive'}
        size="icon"
        onClick={toggleCamera}
        className={cn(
          'h-12 w-12 rounded-full',
          cameraOn ? 'bg-muted hover:bg-muted/80' : ''
        )}
        title={cameraOn ? 'Turn off camera' : 'Turn on camera'}
      >
        {cameraOn ? (
          <Video className="h-5 w-5" />
        ) : (
          <VideoOff className="h-5 w-5" />
        )}
      </Button>

      {/* Microphone Toggle */}
      <Button
        variant={micOn ? 'default' : 'destructive'}
        size="icon"
        onClick={toggleMic}
        className={cn(
          'h-12 w-12 rounded-full',
          micOn ? 'bg-muted hover:bg-muted/80' : ''
        )}
        title={micOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micOn ? (
          <Mic className="h-5 w-5" />
        ) : (
          <MicOff className="h-5 w-5" />
        )}
      </Button>

      {/* Screen Share Toggle */}
      <Button
        variant={screenShareOn ? 'default' : 'outline'}
        size="icon"
        onClick={toggleScreenShare}
        className={cn(
          'h-12 w-12 rounded-full',
          screenShareOn ? 'bg-gold hover:bg-gold/90 text-black' : 'bg-muted hover:bg-muted/80'
        )}
        title={screenShareOn ? 'Stop screen share' : 'Share screen'}
      >
        {screenShareOn ? (
          <MonitorOff className="h-5 w-5" />
        ) : (
          <Monitor className="h-5 w-5" />
        )}
      </Button>

      {/* Speaker Toggle */}
      <Button
        variant={speakerOn ? 'default' : 'outline'}
        size="icon"
        onClick={toggleSpeaker}
        className={cn(
          'h-12 w-12 rounded-full',
          speakerOn ? 'bg-muted hover:bg-muted/80' : ''
        )}
        title={speakerOn ? 'Mute speaker' : 'Unmute speaker'}
      >
        {speakerOn ? (
          <Volume2 className="h-5 w-5" />
        ) : (
          <VolumeX className="h-5 w-5" />
        )}
      </Button>

      {/* Spacer */}
      <div className="w-px h-8 bg-border mx-2" />

      {/* Leave Call */}
      <Button
        variant="destructive"
        size="icon"
        onClick={handleLeave}
        className="h-12 w-12 rounded-full"
        title="Leave call"
      >
        <PhoneOff className="h-5 w-5" />
      </Button>
    </div>
  );
}
