/**
 * Video Controls Component
 * 
 * Provides camera, mic, screen share, and speaker controls
 * Uses Daily.co SDK methods directly (not PostMessage)
 */

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
import type DailyIframe from '@daily-co/daily-js';

interface VideoControlsProps {
  callFrame: ReturnType<typeof DailyIframe.createFrame> | null;
  onLeave: () => void;
}

export function VideoControls({ callFrame, onLeave }: VideoControlsProps) {
  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const [screenShareOn, setScreenShareOn] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(true);

  const toggleCamera = async () => {
    if (!callFrame) return;
    const newState = !cameraOn;
    setCameraOn(newState);
    await callFrame.setLocalVideo(newState);
  };

  const toggleMic = async () => {
    if (!callFrame) return;
    const newState = !micOn;
    setMicOn(newState);
    await callFrame.setLocalAudio(newState);
  };

  const toggleScreenShare = async () => {
    if (!callFrame) return;
    const newState = !screenShareOn;
    setScreenShareOn(newState);
    if (newState) {
      await callFrame.startScreenShare();
    } else {
      await callFrame.stopScreenShare();
    }
  };

  const toggleSpeaker = () => {
    // Speaker control is handled via browser audio - toggle mute all remote participants
    const newState = !speakerOn;
    setSpeakerOn(newState);
    // Note: Daily doesn't have direct speaker mute - this is a UI indicator
    // Audio output is controlled at the browser/OS level
  };

  const handleLeave = () => {
    if (callFrame) {
      callFrame.leave();
    }
    onLeave();
  };

  return (
    <div className="flex items-center justify-center gap-2 p-4 bg-card rounded-lg border border-border">
      {/* Camera Toggle */}
      <Button
        variant={cameraOn ? 'outline' : 'destructive'}
        size="icon"
        onClick={toggleCamera}
        className={cn('h-12 w-12 rounded-full')}
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
        variant={micOn ? 'outline' : 'destructive'}
        size="icon"
        onClick={toggleMic}
        className={cn('h-12 w-12 rounded-full')}
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
        variant={screenShareOn ? 'secondary' : 'outline'}
        size="icon"
        onClick={toggleScreenShare}
        className={cn('h-12 w-12 rounded-full')}
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
        variant={speakerOn ? 'outline' : 'secondary'}
        size="icon"
        onClick={toggleSpeaker}
        className={cn('h-12 w-12 rounded-full')}
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
