/**
 * Messages Page - Direct messaging with follow-gating
 * 
 * Users can only message organizations they have mutually followed.
 */

import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { TabBar } from "@/components/shared/TabBar";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { 
  MessageSquare, Search, Send, Paperclip, MoreVertical, 
  Phone, Video, Star, UserPlus, Check, X, Bell 
} from "lucide-react";
import { useOrganization } from "@/context/OrganizationContext";
import { 
  useConversations, 
  useMessages, 
  useSendMessage, 
  usePendingFollowRequests,
  useRespondToFollow 
} from "@/hooks/useMessaging";
import type { DMConversation, DirectMessage } from "@/services/messaging.service";
import { formatDistanceToNow } from "date-fns";

export default function Messages() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<DMConversation | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { currentOrg } = useOrganization();
  const { data: conversations, isLoading: loadingConversations } = useConversations();
  const { data: pendingRequests, isLoading: loadingRequests } = usePendingFollowRequests();
  const { data: messages, isLoading: loadingMessages } = useMessages(selectedConversation?.id);
  const sendMessageMutation = useSendMessage();
  const respondToFollowMutation = useRespondToFollow();

  const tabs = [
    { id: 'all', label: 'ALL MESSAGES' },
    { id: 'requests', label: `FOLLOW REQUESTS${pendingRequests?.length ? ` (${pendingRequests.length})` : ''}` },
  ];

  const breadcrumbs = [
    { label: 'PLATFORM' },
    { label: 'COMMUNICATIONS' },
    { label: 'MESSAGES' },
  ];

  const filteredConversations = conversations?.filter(c => 
    !searchQuery || 
    c.other_org?.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const handleAcceptFollow = (followId: string) => {
    respondToFollowMutation.mutate({ followId, accept: true });
  };

  const handleDeclineFollow = (followId: string) => {
    respondToFollowMutation.mutate({ followId, accept: false });
  };

  const formatMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <BreadcrumbNav items={breadcrumbs} />
        
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Bell className="h-4 w-4" />
            <span>Messaging requires mutual follows for safety</span>
          </div>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'requests' ? (
          <FollowRequestsList 
            requests={pendingRequests || []}
            isLoading={loadingRequests}
            onAccept={handleAcceptFollow}
            onDecline={handleDeclineFollow}
            isPending={respondToFollowMutation.isPending}
          />
        ) : (
          <div className="glass-panel rounded-xl overflow-hidden h-[600px] flex">
            {/* Conversation List */}
            <div className="w-80 border-r border-border/50 flex flex-col">
              <div className="p-3 border-b border-border/50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 bg-secondary/50"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {loadingConversations ? (
                  <ConversationListSkeleton />
                ) : filteredConversations.length === 0 ? (
                  <EmptyConversations />
                ) : (
                  filteredConversations.map((conv) => (
                    <ConversationItem
                      key={conv.id}
                      conversation={conv}
                      isSelected={selectedConversation?.id === conv.id}
                      onClick={() => setSelectedConversation(conv)}
                      myOrgId={currentOrg?.id || ''}
                    />
                  ))
                )}
              </div>
            </div>

            {/* Message View */}
            {selectedConversation ? (
              <div className="flex-1 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                      {selectedConversation.other_org?.name?.slice(0, 2).toUpperCase() || '??'}
                    </div>
                    <div>
                      <p className="font-semibold">{selectedConversation.other_org?.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {selectedConversation.other_org?.org_type}
                      </p>
                    </div>
                    <StatusPill status="active" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon"><Phone className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Video className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Star className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {loadingMessages ? (
                    <MessagesSkeleton />
                  ) : messages?.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <p>No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages?.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isOwn={msg.sender_org_id === currentOrg?.id}
                      />
                    ))
                  )}
                </div>

                {/* Input */}
                <div className="p-4 border-t border-border/50">
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                      className="flex-1"
                      disabled={sendMessageMutation.isPending}
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium">Select a conversation</p>
                  <p className="text-sm mt-1">Or find a supplier in the Marketplace and follow them to start messaging</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </LayoutShell>
  );
}

// ============ Sub-Components ============

function ConversationItem({ 
  conversation, 
  isSelected, 
  onClick,
  myOrgId 
}: { 
  conversation: DMConversation; 
  isSelected: boolean; 
  onClick: () => void;
  myOrgId: string;
}) {
  const initials = conversation.other_org?.name?.slice(0, 2).toUpperCase() || '??';
  const timeAgo = conversation.last_message_at 
    ? formatDistanceToNow(new Date(conversation.last_message_at), { addSuffix: true })
    : '';

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full p-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30",
        isSelected && "bg-secondary"
      )}
    >
      <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm flex-shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-sm truncate">{conversation.other_org?.name}</p>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-[10px] text-muted-foreground capitalize">
          {conversation.other_org?.org_type}
        </p>
      </div>
    </button>
  );
}

function MessageBubble({ message, isOwn }: { message: DirectMessage; isOwn: boolean }) {
  return (
    <div className={cn("flex", isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-2",
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-secondary rounded-bl-md'
        )}
      >
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          "text-[10px] mt-1",
          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
        </p>
      </div>
    </div>
  );
}

function FollowRequestsList({ 
  requests, 
  isLoading, 
  onAccept, 
  onDecline,
  isPending 
}: { 
  requests: Array<{ id: string; follower_org?: { id: string; name: string; org_type: string } }>;
  isLoading: boolean;
  onAccept: (id: string) => void;
  onDecline: (id: string) => void;
  isPending: boolean;
}) {
  if (isLoading) {
    return (
      <div className="glass-panel rounded-xl p-6 space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <div className="glass-panel rounded-xl p-12 text-center">
        <UserPlus className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <p className="font-medium">No pending follow requests</p>
        <p className="text-sm text-muted-foreground mt-1">
          When someone wants to connect, their request will appear here
        </p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-xl divide-y divide-border/50">
      {requests.map((req) => (
        <div key={req.id} className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
              {req.follower_org?.name?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div>
              <p className="font-semibold">{req.follower_org?.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {req.follower_org?.org_type} • wants to connect
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onDecline(req.id)}
              disabled={isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Decline
            </Button>
            <Button 
              size="sm"
              onClick={() => onAccept(req.id)}
              disabled={isPending}
            >
              <Check className="h-4 w-4 mr-1" />
              Accept
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyConversations() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <MessageSquare className="h-10 w-10 text-muted-foreground/50 mb-3" />
      <p className="font-medium text-sm">No conversations yet</p>
      <p className="text-xs text-muted-foreground mt-1">
        Follow suppliers in the Marketplace to start messaging
      </p>
      <Button variant="outline" size="sm" className="mt-4" asChild>
        <a href="/marketplace">Browse Marketplace</a>
      </Button>
    </div>
  );
}

function ConversationListSkeleton() {
  return (
    <div className="p-3 space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex items-start gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <Skeleton className="h-16 w-48 rounded-2xl" />
      </div>
      <div className="flex justify-end">
        <Skeleton className="h-12 w-56 rounded-2xl" />
      </div>
      <div className="flex justify-start">
        <Skeleton className="h-20 w-64 rounded-2xl" />
      </div>
    </div>
  );
}
