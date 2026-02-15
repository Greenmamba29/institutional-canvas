import { useState } from "react";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { BreadcrumbNav } from "@/components/shared/BreadcrumbNav";
import { TabBar } from "@/components/shared/TabBar";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { MessageSquare, Search, Send, Paperclip, MoreVertical, Phone, Video, Star } from "lucide-react";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'other';
  timestamp: string;
}

interface Conversation {
  id: string;
  contact: string;
  company: string;
  avatar: string;
  lastMessage: string;
  timestamp: string;
  unread: number;
  online: boolean;
  messages: Message[];
}

const mockConversations: Conversation[] = [
  {
    id: '1',
    contact: 'Sarah Chen',
    company: 'EV Battery Solutions',
    avatar: 'SC',
    lastMessage: 'Thanks for the quote. We would like to proceed with the order.',
    timestamp: '2m ago',
    unread: 2,
    online: true,
    messages: [
      { id: '1', content: 'Hi, I saw your listing for battery-grade lithium carbonate.', sender: 'other', timestamp: '10:30 AM' },
      { id: '2', content: 'Yes, we have 60MT available at $66,500/MT.', sender: 'user', timestamp: '10:32 AM' },
      { id: '3', content: 'Can you provide COA and shipping terms?', sender: 'other', timestamp: '10:35 AM' },
      { id: '4', content: 'Absolutely. I will send over the documentation shortly.', sender: 'user', timestamp: '10:38 AM' },
      { id: '5', content: 'Thanks for the quote. We would like to proceed with the order.', sender: 'other', timestamp: '10:45 AM' },
    ]
  },
  {
    id: '2',
    contact: 'Michael Torres',
    company: 'Pacific Mining Corp',
    avatar: 'MT',
    lastMessage: 'The shipment has cleared customs. ETA is next Monday.',
    timestamp: '1h ago',
    unread: 0,
    online: false,
    messages: [
      { id: '1', content: 'Any update on the shipment?', sender: 'user', timestamp: '9:00 AM' },
      { id: '2', content: 'The shipment has cleared customs. ETA is next Monday.', sender: 'other', timestamp: '9:15 AM' },
    ]
  },
  {
    id: '3',
    contact: 'Lisa Wang',
    company: 'CleanTech Ventures',
    avatar: 'LW',
    lastMessage: 'We need to discuss the purity specifications.',
    timestamp: '3h ago',
    unread: 1,
    online: true,
    messages: [
      { id: '1', content: 'We need to discuss the purity specifications.', sender: 'other', timestamp: '7:30 AM' },
    ]
  },
];

export default function Messages() {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(mockConversations[0]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { id: 'all', label: 'ALL MESSAGES' },
    { id: 'unread', label: 'UNREAD' },
    { id: 'starred', label: 'STARRED' },
    { id: 'archived', label: 'ARCHIVED' },
  ];

  const breadcrumbs = [
    { label: 'PLATFORM' },
    { label: 'COMMUNICATIONS' },
    { label: 'MESSAGES' },
  ];

  const filteredConversations = activeTab === 'unread' 
    ? mockConversations.filter(c => c.unread > 0)
    : mockConversations;

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    // Send message logic here - do not log message content
    setNewMessage('');
  };

  return (
    <LayoutShell>
      <div className="space-y-6 animate-fade-in">
        <BreadcrumbNav items={breadcrumbs} />
        
        <div className="flex items-center justify-between px-1">
          <h1 className="text-2xl font-bold tracking-tight">Messages</h1>
          <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
            <MessageSquare className="h-4 w-4 mr-2" />
            New Message
          </Button>
        </div>

        <TabBar tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

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
              {filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv)}
                  className={cn(
                    "w-full p-3 flex items-start gap-3 hover:bg-secondary/50 transition-colors text-left border-b border-border/30",
                    selectedConversation?.id === conv.id && "bg-secondary"
                  )}
                >
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                      {conv.avatar}
                    </div>
                    {conv.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-sm truncate">{conv.contact}</p>
                      <span className="text-[10px] text-muted-foreground">{conv.timestamp}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{conv.company}</p>
                    <p className="text-xs text-muted-foreground truncate mt-1">{conv.lastMessage}</p>
                  </div>
                  {conv.unread > 0 && (
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] font-bold flex items-center justify-center">
                      {conv.unread}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Message View */}
          {selectedConversation ? (
            <div className="flex-1 flex flex-col">
              {/* Header */}
              <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold text-sm">
                      {selectedConversation.avatar}
                    </div>
                    {selectedConversation.online && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-background" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">{selectedConversation.contact}</p>
                    <p className="text-xs text-muted-foreground">{selectedConversation.company}</p>
                  </div>
                  {selectedConversation.online && (
                    <StatusPill status="active" />
                  )}
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
                {selectedConversation.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex",
                      msg.sender === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[70%] rounded-2xl px-4 py-2",
                        msg.sender === 'user'
                          ? 'bg-primary text-primary-foreground rounded-br-md'
                          : 'bg-secondary rounded-bl-md'
                      )}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className={cn(
                        "text-[10px] mt-1",
                        msg.sender === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground'
                      )}>
                        {msg.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
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
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1"
                  />
                  <Button onClick={handleSendMessage} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </LayoutShell>
  );
}
