/**
 * Conversation History Component
 * Displays agent conversation transcripts with sentiment and intent analysis
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { User, Bot, Clock, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getConversationHistory, AgentMessage } from '@/services/elevenlabs-multi-agent.service';
import { format } from 'date-fns';

interface ConversationHistoryProps {
  agentSessionId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface Message extends AgentMessage {
  id: string;
  timestamp: string;
  confidence_score?: number;
}

export function ConversationHistory({
  agentSessionId,
  autoRefresh = false,
  refreshInterval = 5000,
}: ConversationHistoryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const { data } = await getConversationHistory(agentSessionId, 100);
      if (data) {
        // Transform AgentMessage to Message with required fields
        const transformed: Message[] = data.map((msg, idx) => ({
          ...msg,
          id: `msg_${idx}_${Date.now()}`,
          timestamp: new Date().toISOString(),
        }));
        setMessages(transformed);
      }
    } catch (error) {
      console.error('Failed to fetch conversation history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();

    if (autoRefresh) {
      const interval = setInterval(fetchMessages, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [agentSessionId, autoRefresh, refreshInterval]);

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'negative':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-50 border-green-200';
      case 'negative':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading conversation...</p>
        </CardContent>
      </Card>
    );
  }

  if (messages.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conversation History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No messages yet. Start the agent to begin the conversation.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Conversation History</CardTitle>
          <Badge variant="outline">{messages.length} messages</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg border ${getSentimentColor(message.sentiment)}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {message.speaker_role === 'user' ? (
                      <User className="h-4 w-4 text-blue-600" />
                    ) : (
                      <Bot className="h-4 w-4 text-purple-600" />
                    )}
                    <span className="text-xs font-medium capitalize">
                      {message.speaker_role}
                    </span>
                    {message.sentiment && (
                      <div className="flex items-center gap-1">
                        {getSentimentIcon(message.sentiment)}
                        <span className="text-xs text-muted-foreground capitalize">
                          {message.sentiment}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(message.timestamp), 'HH:mm:ss')}
                  </div>
                </div>
                <p className="text-sm mb-2">{message.content}</p>
                <div className="flex flex-wrap gap-2">
                  {message.language && (
                    <Badge variant="secondary" className="text-xs">
                      {message.language.toUpperCase()}
                    </Badge>
                  )}
                  {message.intent && (
                    <Badge variant="outline" className="text-xs">
                      Intent: {message.intent}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
