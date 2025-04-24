import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useParams, useLocation } from "wouter";
import { 
  Send, 
  Search, 
  ArrowLeft,
  Loader2,
  User as UserIcon
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Navbar from "@/pages/dashboard/shared/navbar";
import Sidebar from "@/pages/dashboard/shared/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format, formatDistanceToNow } from "date-fns";

export default function Messages() {
  const { id: otherUserId } = useParams();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef(null);
  
  // Fetch conversations list
  const { 
    data: conversations, 
    isLoading: isLoadingConversations 
  } = useQuery({
    queryKey: ['/api/messages'],
    queryFn: async () => {
      const res = await fetch('/api/messages', {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch conversations');
      return res.json();
    },
    enabled: !!user,
  });
  
  // Fetch specific conversation if otherUserId is provided
  const { 
    data: activeConversation,
    isLoading: isLoadingConversation,
    refetch: refetchConversation
  } = useQuery({
    queryKey: ['/api/messages', otherUserId],
    queryFn: async () => {
      const res = await fetch(`/api/messages/${otherUserId}`, {
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Failed to fetch conversation');
      return res.json();
    },
    enabled: !!user && !!otherUserId,
  });
  
  // Filter conversations based on search query
  const filteredConversations = conversations?.filter(conversation => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return conversation.user.fullName.toLowerCase().includes(query);
  });
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/messages", {
        receiverId: Number(otherUserId),
        content: messageText
      });
    },
    onSuccess: () => {
      setMessageText("");
      refetchConversation();
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send message",
        description: error.message || "Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Scroll to bottom of messages when conversation changes
  useEffect(() => {
    if (activeConversation && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeConversation]);
  
  // Handle form submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageText.trim() && otherUserId) {
      sendMessageMutation.mutate();
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Messages - Assignment Kore Dibo</title>
      </Helmet>
      
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        
        <div className="flex flex-col flex-1">
          <Navbar />
          
          <main className="flex-1 flex overflow-hidden">
            {/* Conversations List */}
            <div className={`w-full md:w-80 border-r border-gray-200 bg-white flex-shrink-0 ${otherUserId ? 'hidden md:block' : ''}`}>
              <div className="h-full flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <h1 className="text-xl font-bold text-gray-900 mb-4">Messages</h1>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Search conversations..."
                      className="pl-10"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto">
                  {isLoadingConversations ? (
                    <div className="flex justify-center items-center h-40">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : !conversations || conversations.length === 0 ? (
                    <div className="text-center p-6">
                      <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No conversations yet</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        When you message someone, they'll appear here.
                      </p>
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="text-center p-6">
                      <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900">No results</h3>
                      <p className="mt-2 text-sm text-gray-600">
                        No conversations match your search.
                      </p>
                    </div>
                  ) : (
                    <ul>
                      {filteredConversations.map(conversation => (
                        <li key={conversation.user.id}>
                          <button
                            onClick={() => navigate(`/messages/${conversation.user.id}`)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start ${
                              otherUserId === conversation.user.id.toString() ? 'bg-gray-50' : ''
                            }`}
                          >
                            <div className="relative flex-shrink-0">
                              <Avatar className="h-10 w-10 mr-3">
                                <AvatarImage src={conversation.user.profileImage} alt={conversation.user.fullName} />
                                <AvatarFallback>{getInitials(conversation.user.fullName)}</AvatarFallback>
                              </Avatar>
                              {conversation.unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-baseline">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {conversation.user.fullName}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), { 
                                    addSuffix: false 
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Badge
                                  variant="outline"
                                  className="px-1.5 py-0.5 text-xs rounded-sm mr-2"
                                >
                                  {conversation.user.userType === 'student' ? 'Student' : 'Helper'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 truncate mt-1">
                                {conversation.lastMessage.senderId === user?.id ? 'You: ' : ''}
                                {conversation.lastMessage.content}
                              </p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
            
            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-white">
              {otherUserId ? (
                <>
                  {/* Chat Header */}
                  <div className="px-4 py-3 border-b border-gray-200 flex items-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden mr-2"
                      onClick={() => navigate('/messages')}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    
                    {isLoadingConversation ? (
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse mr-3"></div>
                        <div className="space-y-2">
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                    ) : activeConversation?.user ? (
                      <div className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={activeConversation.user.profileImage} alt={activeConversation.user.fullName} />
                          <AvatarFallback>{getInitials(activeConversation.user.fullName)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium text-gray-900">{activeConversation.user.fullName}</h3>
                          <Badge
                            variant="outline"
                            className="px-1.5 py-0.5 text-xs rounded-sm"
                          >
                            {activeConversation.user.userType === 'student' ? 'Student' : 'Helper'}
                          </Badge>
                        </div>
                      </div>
                    ) : (
                      <div>Loading user...</div>
                    )}
                  </div>
                  
                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto">
                    {isLoadingConversation ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !activeConversation?.messages || activeConversation.messages.length === 0 ? (
                      <div className="text-center py-12">
                        <Send className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900">No messages yet</h3>
                        <p className="mt-2 text-sm text-gray-600">
                          Send a message to start the conversation.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {activeConversation.messages.map((message) => {
                          const isSender = message.senderId === user?.id;
                          return (
                            <div 
                              key={message.id} 
                              className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className="flex items-end">
                                {!isSender && (
                                  <Avatar className="h-8 w-8 mr-2">
                                    <AvatarImage 
                                      src={activeConversation.user.profileImage} 
                                      alt={activeConversation.user.fullName} 
                                    />
                                    <AvatarFallback>{getInitials(activeConversation.user.fullName)}</AvatarFallback>
                                  </Avatar>
                                )}
                                <div 
                                  className={`max-w-md px-4 py-2 rounded-lg ${
                                    isSender 
                                      ? 'bg-primary-600 text-white' 
                                      : 'bg-gray-100 text-gray-800'
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p 
                                    className={`text-xs mt-1 ${
                                      isSender ? 'text-primary-100' : 'text-gray-500'
                                    }`}
                                  >
                                    {format(new Date(message.createdAt), 'p')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    )}
                  </div>
                  
                  {/* Message Input */}
                  <div className="p-4 border-t border-gray-200">
                    <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                      <Input
                        type="text"
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        className="flex-1"
                      />
                      <Button 
                        type="submit" 
                        disabled={!messageText.trim() || sendMessageMutation.isPending}
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center p-4">
                  <MessageSquareIcon className="h-16 w-16 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900">Select a conversation</h3>
                  <p className="mt-2 text-sm text-gray-600 max-w-md">
                    Choose a conversation from the sidebar to start messaging.
                  </p>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function MessageSquareIcon(props) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
    </svg>
  );
}

function getInitials(name: string = '') {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
}
