import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Shield,
  ShieldAlert,
  UserX,
  MoreVertical,
  Search,
  CheckCheck,
  Check,
  Lock,
  Flag,
  Sparkles,
  AlertCircle,
  X,
  Users,
  ChevronLeft,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { api } from '../../services/api';
import { getSocket } from '../../services/socket';
import { ConversationView, DirectMessageView, ReportReason } from '@projectx/common';

export const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeConvIdFromQuery = searchParams.get('conv');

  const [conversations, setConversations] = useState<ConversationView[]>([]);
  const [activeConversation, setActiveConversation] = useState<ConversationView | null>(null);
  const [messages, setMessages] = useState<DirectMessageView[]>([]);
  const [newMessageText, setNewMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Typing state
  const [typingUsers, setTypingUsers] = useState<{ [convId: string]: string[] }>({});
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Modals
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>(ReportReason.HARASSMENT);
  const [reportDetails, setReportDetails] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [isBlocking, setIsBlocking] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Fetch Conversations List
  const fetchConversations = async () => {
    try {
      setIsLoadingConvs(true);
      const res = await api.get('/messages/conversations');
      if (res.data.success) {
        setConversations(res.data.data);
        // If active query parameter is set, select it
        if (activeConvIdFromQuery) {
          const matched = res.data.data.find((c: ConversationView) => c.id === activeConvIdFromQuery);
          if (matched) {
            setActiveConversation(matched);
          }
        } else if (res.data.data.length > 0 && !activeConversation) {
          setActiveConversation(res.data.data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setIsLoadingConvs(false);
    }
  };

  // Fetch Messages for active conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const res = await api.get(`/messages/conversations/${conversationId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
        // Mark conversation as read
        await api.patch(`/messages/conversations/${conversationId}/read`);
        // Update local unread counter
        setConversations((prev) =>
          prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (activeConversation) {
      setSearchParams({ conv: activeConversation.id });
      fetchMessages(activeConversation.id);

      const socket = getSocket();
      socket.emit('join_conversation', activeConversation.id);

      return () => {
        socket.emit('leave_conversation', activeConversation.id);
      };
    }
  }, [activeConversation?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket.IO Real-time Listeners
  useEffect(() => {
    const socket = getSocket();

    const handleNewMessage = (msg: DirectMessageView) => {
      if (activeConversation && msg.conversationId === activeConversation.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Auto mark read if we are currently looking at the conversation
        api.patch(`/messages/conversations/${activeConversation.id}/read`).catch(() => {});
      }

      // Update conversation list preview & order
      setConversations((prev) => {
        const updated = prev.map((c) => {
          if (c.id === msg.conversationId) {
            return {
              ...c,
              latestMessage: {
                id: msg.id,
                content: msg.content,
                senderId: msg.senderId,
                senderName: msg.senderName,
                createdAt: msg.createdAt,
                isRead: msg.isRead,
              },
              unreadCount: activeConversation?.id === msg.conversationId ? 0 : c.unreadCount + 1,
              updatedAt: msg.createdAt,
            };
          }
          return c;
        });
        return updated.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      });
    };

    const handleMessagesRead = ({ conversationId }: { conversationId: string; userId: string }) => {
      if (activeConversation && activeConversation.id === conversationId) {
        setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
      }
    };

    const handleUserTyping = ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        if (!current.includes(userName)) {
          return { ...prev, [conversationId]: [...current, userName] };
        }
        return prev;
      });
    };

    const handleUserStoppedTyping = ({ conversationId, userName }: { conversationId: string; userName: string }) => {
      setTypingUsers((prev) => {
        const current = prev[conversationId] || [];
        return { ...prev, [conversationId]: current.filter((u) => u !== userName) };
      });
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
    };
  }, [activeConversation?.id]);

  // Handle typing debounce
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessageText(e.target.value);
    if (!activeConversation || !user) return;

    const socket = getSocket();
    socket.emit('typing_start', {
      conversationId: activeConversation.id,
      userName: user.name,
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('typing_stop', {
        conversationId: activeConversation.id,
        userName: user.name,
      });
    }, 2000);
  };

  // Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageText.trim() || !activeConversation || isSending) return;

    const content = newMessageText.trim();
    setNewMessageText('');
    setIsSending(true);

    const socket = getSocket();
    socket.emit('typing_stop', {
      conversationId: activeConversation.id,
      userName: user?.name,
    });

    try {
      const res = await api.post(`/messages/conversations/${activeConversation.id}/messages`, {
        content,
      });

      if (res.data.success) {
        const msg = res.data.data;
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error sending message.');
    } finally {
      setIsSending(false);
    }
  };

  // Submit Report
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversation?.otherParticipant) return;
    setIsSubmittingReport(true);

    try {
      const res = await api.post('/messages/report', {
        reportedUserId: activeConversation.otherParticipant.id,
        projectId: activeConversation.projectId || undefined,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });

      if (res.data.success) {
        alert('Thank you. Your report has been submitted to trust & safety.');
        setIsReportModalOpen(false);
        setReportDetails('');
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error submitting report.');
    } finally {
      setIsSubmittingReport(false);
    }
  };

  // Submit Block
  const handleConfirmBlock = async () => {
    if (!activeConversation?.otherParticipant) return;
    setIsBlocking(true);

    try {
      const res = await api.post('/messages/block', {
        blockedId: activeConversation.otherParticipant.id,
        reason: blockReason.trim() || undefined,
      });

      if (res.data.success) {
        alert(`${activeConversation.otherParticipant.name} has been blocked.`);
        setIsBlockModalOpen(false);
        setBlockReason('');
        fetchConversations();
        setActiveConversation(null);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error blocking user.');
    } finally {
      setIsBlocking(false);
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const title = c.title || '';
    const otherName = c.otherParticipant?.name || '';
    const projectTitle = c.projectTitle || '';
    const q = searchQuery.toLowerCase();
    return title.toLowerCase().includes(q) || otherName.toLowerCase().includes(q) || projectTitle.toLowerCase().includes(q);
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 h-[calc(100vh-5rem)] flex flex-col">
      <div className="flex-1 bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        
        {/* ==================================================== */}
        {/* LEFT SIDEBAR: CONVERSATION LIST */}
        {/* ==================================================== */}
        <div className={`w-full md:w-80 lg:w-96 border-r border-slate-800 flex flex-col bg-slate-950/60 ${activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {/* Header */}
          <div className="p-4 border-b border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h1 className="font-extrabold text-base text-slate-100">Messages & Chat</h1>
                  <p className="text-[11px] text-slate-400">Authorized project collaborators</p>
                </div>
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/50"
              />
            </div>
          </div>

          {/* Conversations Scrollable List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
            {isLoadingConvs ? (
              <div className="p-8 text-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Users className="w-8 h-8 text-slate-600 mx-auto" />
                <p className="text-xs font-semibold text-slate-300">No active conversations</p>
                <p className="text-[11px] text-slate-500">
                  Connect with project creators or team members to start messaging.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isActive = activeConversation?.id === conv.id;
                const isProject = conv.type === 'PROJECT_TEAM';

                return (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv)}
                    className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                      isActive ? 'bg-brand-500/10 border-l-2 border-brand-400' : 'hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      {isProject ? (
                        <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                          <Users className="w-5 h-5" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-emerald-600/30 border border-brand-500/30 flex items-center justify-center font-bold text-slate-200">
                          {conv.otherParticipant?.avatarUrl ? (
                            <img
                              src={conv.otherParticipant.avatarUrl}
                              alt=""
                              className="w-full h-full object-cover rounded-2xl"
                            />
                          ) : (
                            conv.otherParticipant?.name.slice(0, 2).toUpperCase() || 'ST'
                          )}
                        </div>
                      )}
                    </div>

                    {/* Content Details */}
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-1">
                        <h3 className="font-bold text-xs text-slate-100 truncate">
                          {isProject ? `${conv.projectTitle || 'Project'} Team` : conv.otherParticipant?.name || 'Student'}
                        </h3>
                        {conv.latestMessage && (
                          <span className="text-[10px] text-slate-500 shrink-0 font-mono">
                            {new Date(conv.latestMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {isProject ? conv.projectTitle : conv.otherParticipant?.collegeName}
                      </p>

                      {conv.latestMessage && (
                        <p className="text-[11px] text-slate-300 truncate">
                          <span className="text-slate-500">{conv.latestMessage.senderId === user?.id ? 'You: ' : ''}</span>
                          {conv.latestMessage.content}
                        </p>
                      )}
                    </div>

                    {/* Unread Counter Badge */}
                    {conv.unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-brand-500 text-slate-950 shrink-0 shadow-glow">
                        {conv.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* ==================================================== */}
        {/* RIGHT MAIN PANEL: MESSAGE STREAM & INPUT */}
        {/* ==================================================== */}
        <div className={`flex-1 flex flex-col bg-slate-900/40 ${!activeConversation ? 'hidden md:flex' : 'flex'}`}>
          {activeConversation ? (
            <>
              {/* Active Conversation Header */}
              <div className="p-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveConversation(null)}
                    className="md:hidden p-1.5 rounded-xl hover:bg-slate-800 text-slate-400"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-600/30 to-emerald-600/30 border border-brand-500/30 flex items-center justify-center font-bold text-slate-200 shrink-0">
                    {activeConversation.type === 'PROJECT_TEAM' ? (
                      <Users className="w-5 h-5 text-purple-400" />
                    ) : (
                      activeConversation.otherParticipant?.name.slice(0, 2).toUpperCase() || 'ST'
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold text-sm text-slate-100">
                        {activeConversation.type === 'PROJECT_TEAM'
                          ? `${activeConversation.projectTitle || 'Project'} Team Chat`
                          : activeConversation.otherParticipant?.name || 'Direct Chat'}
                      </h2>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <Lock className="w-2.5 h-2.5" />
                        Safe Channel
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                      <span>{activeConversation.otherParticipant?.collegeName || activeConversation.projectTitle}</span>
                      {activeConversation.projectId && (
                        <>
                          <span>•</span>
                          <button
                            onClick={() => navigate(`/workspace/${activeConversation.projectId}`)}
                            className="text-brand-400 hover:underline"
                          >
                            Open Workspace →
                          </button>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                {/* Safety & Action Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
                    className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>

                  {showOptionsDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl z-20 overflow-hidden py-1">
                      <button
                        onClick={() => {
                          setShowOptionsDropdown(false);
                          setIsReportModalOpen(true);
                        }}
                        className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-slate-900 flex items-center gap-2 transition-colors"
                      >
                        <Flag className="w-3.5 h-3.5" />
                        Report User / Chat
                      </button>

                      {activeConversation.type === 'DIRECT' && (
                        <button
                          onClick={() => {
                            setShowOptionsDropdown(false);
                            setIsBlockModalOpen(true);
                          }}
                          className="w-full px-4 py-2 text-left text-xs font-semibold text-rose-400 hover:bg-slate-900 flex items-center gap-2 transition-colors"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          Block User
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Privacy Notice Banner */}
              <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-brand-400" />
                  Private project approach & source code remain protected under Level 3/4 progressive disclosure.
                </span>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                {isLoadingMessages ? (
                  <div className="p-8 text-center">
                    <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                    <div className="w-12 h-12 rounded-3xl bg-brand-500/10 text-brand-400 flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-200">Start of conversation</h3>
                    <p className="text-xs text-slate-400 max-w-sm">
                      Messages in this conversation are end-to-end authorized between verified project participants.
                    </p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMe = msg.senderId === user?.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex items-end gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isMe && (
                          <div className="w-7 h-7 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-slate-200 shrink-0">
                            {msg.senderName.slice(0, 2).toUpperCase()}
                          </div>
                        )}

                        <div className={`max-w-[75%] sm:max-w-md space-y-1 ${isMe ? 'items-end' : 'items-start'}`}>
                          {!isMe && (
                            <div className="flex items-center gap-1.5 px-1">
                              <span className="text-[11px] font-bold text-slate-300">{msg.senderName}</span>
                              <span className="text-[10px] text-slate-500">({msg.senderCollege})</span>
                            </div>
                          )}

                          <div
                            className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                              isMe
                                ? 'bg-brand-500 text-slate-950 font-medium rounded-br-none shadow-glow'
                                : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700/60'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                          </div>

                          <div className={`flex items-center gap-1 px-1 text-[10px] text-slate-500 ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <span>
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isMe && (
                              <span>
                                {msg.isRead ? (
                                  <CheckCheck className="w-3 h-3 text-brand-400 inline" />
                                ) : (
                                  <Check className="w-3 h-3 text-slate-500 inline" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}

                {/* Typing Indicator */}
                {activeConversation && typingUsers[activeConversation.id]?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-slate-400 italic px-2">
                    <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
                    <span>{typingUsers[activeConversation.id].join(', ')} is typing...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Type your message... (Press Enter to send)"
                  value={newMessageText}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-brand-500/60"
                />

                <button
                  type="submit"
                  disabled={!newMessageText.trim() || isSending}
                  className="px-5 py-3 rounded-2xl font-bold text-xs bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-slate-950 shadow-glow flex items-center gap-2 transition-all shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-14 h-14 rounded-3xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h2 className="font-bold text-base text-slate-200">Select a conversation</h2>
              <p className="text-xs text-slate-400 max-w-sm">
                Choose a project channel or applicant conversation from the sidebar to start collaborating in real-time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ==================================================== */}
      {/* REPORT MODAL */}
      {/* ==================================================== */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-100">Report User or Chat</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Reason for Report</label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                >
                  <option value={ReportReason.HARASSMENT}>Harassment or Offensive Behavior</option>
                  <option value={ReportReason.SPAM}>Spam or Commercial Solicitation</option>
                  <option value={ReportReason.INAPPROPRIATE_CONTENT}>Inappropriate Content</option>
                  <option value={ReportReason.IP_LEAK}>Unauthorized IP or Data Leakage</option>
                  <option value={ReportReason.OTHER}>Other Concern</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Details (Optional)</label>
                <textarea
                  rows={3}
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  placeholder="Provide context for our trust and moderation team..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReport}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition-colors"
                >
                  {isSubmittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* BLOCK MODAL */}
      {/* ==================================================== */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-rose-400">
                <UserX className="w-5 h-5" />
                <h3 className="font-bold text-base text-slate-100">Block User</h3>
              </div>
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p>
                Are you sure you want to block <strong className="text-slate-100">{activeConversation?.otherParticipant?.name}</strong>?
              </p>
              <p className="text-slate-400 text-[11px]">
                They will no longer be able to message you or view your direct messages.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">Reason (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Unsolicited messages"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBlockModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBlock}
                disabled={isBlocking}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition-colors"
              >
                {isBlocking ? 'Blocking...' : 'Block User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
