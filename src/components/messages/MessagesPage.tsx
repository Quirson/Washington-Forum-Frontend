import { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    MessageSquare, Send, Search, Users, UserPlus,
    ChevronLeft, MoreVertical, Check, CheckCheck,
    Video, Phone, Image as ImageIcon, Smile, X, ArrowLeft
} from 'lucide-react';
import { apiClient } from '@/services/api';
import { useAuthStore } from '@/store/auth.store';
import toast from 'react-hot-toast';
import './MessagesPage.css';

export const MessagesPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const hasProcessedNewUser = useRef(false);

    const newUserId = searchParams.get('new');
    const [activeConversation, setActiveConversation] = useState<string | null>(
        newUserId ? `new_${newUserId}` : null
    );
    const [messageText, setMessageText] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(true);

    // Process URL parameter "new"
    useEffect(() => {
        if (hasProcessedNewUser.current) return;

        if (newUserId) {
            hasProcessedNewUser.current = true;
            startNewConversation(newUserId);

            if (window.history.replaceState) {
                const url = new URL(window.location.href);
                url.searchParams.delete('new');
                window.history.replaceState({}, '', url);
            }
        }
    }, [newUserId]);

    // Fetch conversations
    const { data: conversationsData, refetch: refetchConversations } = useQuery({
        queryKey: ['conversations'],
        queryFn: async () => {
            const response = await apiClient.get('/messages');
            return {
                conversations: response.conversations || [],
                count: response.count || 0
            };
        },
        refetchInterval: 30000,
    });

    // Fetch messages
    const { data: messagesData } = useQuery({
        queryKey: ['messages', activeConversation],
        queryFn: async () => {
            if (!activeConversation) return null;

            if (activeConversation.startsWith('new_')) {
                return { messages: [], count: 0, conversation_id: activeConversation };
            }

            const response = await apiClient.get(`/messages/${activeConversation}`);
            return {
                messages: response.messages || [],
                count: response.count || 0,
                conversation_id: response.conversation_id || activeConversation
            };
        },
        enabled: !!activeConversation && !activeConversation.startsWith('new_'),
    });

    // Send message mutation
    const sendMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!activeConversation && newUserId) {
                return apiClient.post('/messages/send', {
                    to_user_id: newUserId,
                    content: content,
                });
            }

            return apiClient.post('/messages/send', {
                conversation_id: activeConversation,
                content: content,
            });
        },
        onSuccess: (response) => {
            setMessageText('');

            if (response.message?.conversation_id) {
                setActiveConversation(response.message.conversation_id);
            }
            queryClient.invalidateQueries({ queryKey: ['conversations'] });
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        },
        onError: () => {
            toast.error('Failed to send message');
        }
    });

    const markAsRead = useCallback((conversationId: string) => {
        console.log("📖 Mark as read:", conversationId);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        if (activeConversation && messagesData?.messages) {
            markAsRead(activeConversation);
        }
    }, [messagesData, activeConversation, markAsRead]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();

        const canSend = messageText.trim() && (activeConversation || newUserId);

        if (!canSend) {
            toast.error('Please select a conversation first');
            return;
        }

        sendMessageMutation.mutate(messageText);
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 1) return 'now';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
        return date.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric'
        });
    };

    const startNewConversation = async (toUserId: string) => {
        try {
            const response = await apiClient.get(`/messages/check/${toUserId}`);

            if (response.exists && response.conversation_id) {
                setActiveConversation(response.conversation_id);
            } else {
                setActiveConversation('');
                toast.success('Start typing your first message!');
            }
        } catch (error) {
            toast.error('Failed to start conversation');
        }
    };

    const getAvatarUrl = (avatarUrl: string, username: string) => {
        if (!avatarUrl) {
            return `https://ui-avatars.com/api/?name=${username}&background=0ea5e9&color=fff&size=128`;
        }

        if (avatarUrl.startsWith('data:')) {
            return avatarUrl;
        }

        if (avatarUrl.startsWith('/')) {
            return `https://api.washingtongaming.tech${avatarUrl}`;
        }

        return avatarUrl;
    };

    const activeConv = conversationsData?.conversations?.find((c: any) => c.id === activeConversation);

    return (
        <div className="messages-page">
            <div className="messages-container">
                {/* Sidebar */}
                <aside className={`messages-sidebar ${showSidebar ? 'show' : ''}`}>
                    {/* Sidebar Header */}
                    <div className="sidebar-header">
                        <div className="sidebar-header-top">
                            <h2 className="sidebar-title">
                                <MessageSquare size={24} />
                                Messages
                            </h2>
                            <button className="btn-icon-primary" title="New Conversation">
                                <UserPlus size={20} />
                            </button>
                        </div>

                        {/* Search */}
                        <div className="search-box">
                            <Search size={18} className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="search-input"
                            />
                        </div>
                    </div>

                    {/* Conversations List */}
                    <div className="conversations-list">
                        {conversationsData?.conversations?.length === 0 ? (
                            <div className="empty-state">
                                <MessageSquare size={48} />
                                <p>No conversations yet</p>
                                <span>Start a new conversation!</span>
                            </div>
                        ) : (
                            conversationsData?.conversations
                                ?.filter((conv: any) =>
                                    !searchQuery ||
                                    conv.name?.toLowerCase().includes(searchQuery.toLowerCase())
                                )
                                .map((conv: any) => (
                                    <div
                                        key={conv.id}
                                        onClick={() => {
                                            setActiveConversation(conv.id);
                                            if (window.innerWidth < 768) {
                                                setShowSidebar(false);
                                            }
                                        }}
                                        className={`conversation-item ${activeConversation === conv.id ? 'active' : ''}`}
                                    >
                                        <div className="conversation-avatar-wrapper">
                                            <img
                                                src={getAvatarUrl(conv.avatar_url, conv.name)}
                                                alt={conv.name}
                                                className="conversation-avatar"
                                                onError={(e) => {
                                                    e.currentTarget.src = `https://ui-avatars.com/api/?name=${conv.name}&background=0ea5e9&color=fff&size=128`;
                                                }}
                                            />
                                            {conv.is_online && <span className="online-indicator"></span>}
                                        </div>

                                        <div className="conversation-content">
                                            <div className="conversation-header">
                                                <h3 className="conversation-name">{conv.name || 'Conversation'}</h3>
                                                <span className="conversation-time">{formatTime(conv.last_message_at)}</span>
                                            </div>
                                            <div className="conversation-preview">
                                                <p className={`preview-text ${conv.unread_count > 0 ? 'unread' : ''}`}>
                                                    {conv.last_message || 'No messages yet'}
                                                </p>
                                                {conv.unread_count > 0 && (
                                                    <span className="unread-badge">{conv.unread_count}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                </aside>

                {/* Chat Area */}
                <main className="chat-main">
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <header className="chat-header">
                                <div className="chat-header-left">
                                    <button
                                        className="btn-back"
                                        onClick={() => {
                                            if (window.innerWidth < 768) {
                                                setShowSidebar(true);
                                                setActiveConversation(null);
                                            } else {
                                                navigate(-1);
                                            }
                                        }}
                                    >
                                        <ArrowLeft size={20} />
                                    </button>

                                    <div className="chat-header-avatar-wrapper">
                                        <img
                                            src={getAvatarUrl(activeConv?.avatar_url, activeConv?.name || 'User')}
                                            alt={activeConv?.name || 'User'}
                                            className="chat-header-avatar"
                                            onError={(e) => {
                                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${activeConv?.name || 'User'}&background=0ea5e9&color=fff&size=128`;
                                            }}
                                        />
                                        {activeConv?.is_online && <span className="online-indicator"></span>}
                                    </div>

                                    <div className="chat-header-info">
                                        <h2 className="chat-header-name">
                                            {activeConv?.name || 'New Conversation'}
                                        </h2>
                                        <span className="chat-header-status">
                                            {activeConv?.is_online ? 'Online' : 'Offline'}
                                        </span>
                                    </div>
                                </div>

                                <div className="chat-header-actions">
                                    <button className="btn-icon" title="Voice Call">
                                        <Phone size={20} />
                                    </button>
                                    <button className="btn-icon" title="Video Call">
                                        <Video size={20} />
                                    </button>
                                    <button className="btn-icon" title="More Options">
                                        <MoreVertical size={20} />
                                    </button>
                                </div>
                            </header>

                            {/* Messages Area */}
                            <div className="messages-area">
                                {messagesData?.messages?.length === 0 ? (
                                    <div className="empty-chat">
                                        <MessageSquare size={64} />
                                        <h3>No messages yet</h3>
                                        <p>Start the conversation by sending a message!</p>
                                    </div>
                                ) : (
                                    <div className="messages-list">
                                        {messagesData?.messages?.map((msg: any) => (
                                            <div
                                                key={msg.id}
                                                className={`message-wrapper ${msg.is_own ? 'own' : 'other'}`}
                                            >
                                                {!msg.is_own && (
                                                    <img
                                                        src={getAvatarUrl(msg.avatar_url, msg.username)}
                                                        alt={msg.username}
                                                        className="message-avatar"
                                                        onError={(e) => {
                                                            e.currentTarget.src = `https://ui-avatars.com/api/?name=${msg.username}&background=667eea&color=fff&size=128`;
                                                        }}
                                                    />
                                                )}

                                                <div className="message-content-wrapper">
                                                    <div className={`message-bubble ${msg.is_own ? 'own' : 'other'}`}>
                                                        {!msg.is_own && (
                                                            <span className="message-sender">{msg.username}</span>
                                                        )}
                                                        <p className="message-text">{msg.content}</p>
                                                    </div>

                                                    <div className="message-meta">
                                                        <span className="message-time">{formatTime(msg.created_at)}</span>
                                                        {msg.is_own && (
                                                            <span className="message-status">
                                                                {msg.is_read ? (
                                                                    <CheckCheck size={14} className="read" />
                                                                ) : (
                                                                    <Check size={14} className="sent" />
                                                                )}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </div>

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="message-input-form">
                                <button type="button" className="btn-icon" title="Emoji">
                                    <Smile size={20} />
                                </button>

                                <button type="button" className="btn-icon" title="Attach Image">
                                    <ImageIcon size={20} />
                                </button>

                                <input
                                    type="text"
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type a message..."
                                    className="message-input"
                                />

                                <button
                                    type="submit"
                                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                                    className="btn-send"
                                >
                                    <Send size={20} />
                                    <span className="btn-send-text">Send</span>
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="no-conversation-selected">
                            <MessageSquare size={80} />
                            <h2>Select a conversation</h2>
                            <p>Choose from your existing conversations or start a new one</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};