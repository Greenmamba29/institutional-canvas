import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, FileText, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useMutation, useQuery } from '@tanstack/react-query';

interface MeetingNotesProps {
  meetingId: string;
  roomName: string;
}

interface Note {
  id?: string;
  meeting_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
}

export function MeetingNotes({ meetingId, roomName }: MeetingNotesProps) {
  const [notes, setNotes] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { toast } = useToast();

  // Fetch existing notes
  const { data: existingNotes, isLoading } = useQuery<{ data: Note }>({
    queryKey: ['meeting-notes', meetingId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/meetings/${meetingId}/notes`);
      return res.json();
    },
    enabled: !!meetingId,
  });

  // Load existing notes into textarea
  useEffect(() => {
    if (existingNotes?.data?.content) {
      setNotes(existingNotes.data.content);
      setLastSaved(existingNotes.data.updated_at ? new Date(existingNotes.data.updated_at) : null);
    }
  }, [existingNotes]);

  // Save notes mutation
  const saveMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await apiRequest('POST', `/api/meetings/${meetingId}/notes`, {
        content,
      });
      return res.json();
    },
    onSuccess: () => {
      setLastSaved(new Date());
      toast({
        title: 'Notes saved',
        description: 'Meeting notes have been saved successfully.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to save notes',
        description: error.message || 'An error occurred while saving notes.',
        variant: 'destructive',
      });
    },
  });

  const handleSave = () => {
    if (!notes.trim()) {
      toast({
        title: 'Empty notes',
        description: 'Please write some notes before saving.',
        variant: 'destructive',
      });
      return;
    }
    saveMutation.mutate(notes);
  };

  // Auto-save every 30 seconds if there are unsaved changes
  useEffect(() => {
    const interval = setInterval(() => {
      if (notes && notes !== existingNotes?.data?.content) {
        saveMutation.mutate(notes);
      }
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [notes, existingNotes]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-gold" />
            <CardTitle>Meeting Notes</CardTitle>
          </div>
          {lastSaved && (
            <Badge variant="secondary" className="text-xs">
              Last saved: {lastSaved.toLocaleTimeString()}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {roomName || 'Video Call Session'}
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            <Textarea
              placeholder="Take notes during the meeting..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[300px] resize-none"
            />
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                {notes.length} characters • Auto-saves every 30 seconds
              </p>
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending || !notes.trim()}
                size="sm"
                className="gap-2"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Notes
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
