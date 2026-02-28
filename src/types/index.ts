// User Types
export interface User {
    id: string;
    username: string;
    email: string;
    avatar?: string;
    joinDate: string;
    lastSeen: string;
    isOnline: boolean;
    totalPosts: number;
    totalLikes: number;
    followers: number;
    following: number;
    roles: UserRole[];
    discordConnection?: DiscordConnection;
    sampConnection?: SAMPConnection;
    factionId?: string;
    factionRank?: string;
}

export interface UserRole {
    id: string;
    name: string;
    color: string;
    priority: number;
    permissions: string[];
}

export interface DiscordConnection {
    id: string;
    username: string;
    discriminator: string;
    avatar: string;
    roles: DiscordRole[];
    lastSync: string;
}

export interface DiscordRole {
    id: string;
    name: string;
    color: string;
    position: number;
}

export interface SAMPConnection {
    accountId: number;
    characterName: string;
    level: number;
    playTime: number;
    lastSeen: string;
}

// Forum Types
export interface Thread {
    id: string;
    title: string;
    content: string;
    authorId: string;
    author: User;
    categoryId: string;
    category: Category;
    isPinned: boolean;
    isLocked: boolean;
    views: number;
    replies: number;
    likes: number;
    createdAt: string;
    updatedAt: string;
    lastReplyAt: string;
    lastReplyBy?: User;
    tags: string[];
}

export interface Reply {
    id: string;
    threadId: string;
    content: string;
    authorId: string;
    author: User;
    likes: number;
    createdAt: string;
    updatedAt: string;
    isEdited: boolean;
    parentReplyId?: string;
}

export interface Category {
    id: string;
    name: string;
    description: string;
    icon: string;
    order: number;
    parentId?: string;
    threadCount: number;
    replyCount: number;
    lastThread?: Thread;
    permissions: CategoryPermissions;
}

export interface CategoryPermissions {
    canView: boolean;
    canPost: boolean;
    canReply: boolean;
    minRolePriority: number;
}

// Faction Types
export interface Faction {
    id: string;
    name: string;
    tag: string;
    type: FactionType;
    color: string;
    banner?: string;
    description: string;
    memberCount: number;
    maxMembers: number;
    isOpen: boolean;
    founded: string;
    leaders: User[];
    members: FactionMember[];
    ranks: FactionRank[];
    categoryId: string;
    stats: FactionStats;
}

export type FactionType = 'government' | 'legal' | 'illegal' | 'mafia' | 'gang';

export interface FactionMember {
    userId: string;
    user: User;
    rankId: string;
    rank: FactionRank;
    joinedAt: string;
    isOnline: boolean;
}

export interface FactionRank {
    id: string;
    name: string;
    level: number;
    permissions: string[];
    color?: string;
}

export interface FactionStats {
    totalThreads: number;
    totalPosts: number;
    onlineMembers: number;
    weeklyActivity: number;
}

// Application Types
export interface ApplicationTemplate {
    id: string;
    code: string;
    name: string;
    description: string;
    category: ApplicationCategory;
    minRolePriority: number;
    reviewerRolePriority: number;
    fields: FormField[];
    isActive: boolean;
    requiresDiscord: boolean;
    requiresSAMP: boolean;
    autoResponse?: string;
}

export type ApplicationCategory = 'appeal' | 'staff' | 'faction' | 'report' | 'other';

export interface FormField {
    id: string;
    type: FieldType;
    label: string;
    placeholder?: string;
    required: boolean;
    validation?: ValidationRule[];
    options?: string[];
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
}

export type FieldType = 'text' | 'textarea' | 'email' | 'number' | 'select' | 'radio' | 'checkbox' | 'file' | 'date';

export interface ValidationRule {
    type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
    value?: any;
    message: string;
}

export interface ApplicationSubmission {
    id: string;
    templateId: string;
    template: ApplicationTemplate;
    userId: string;
    user: User;
    data: Record<string, any>;
    status: SubmissionStatus;
    reviewerId?: string;
    reviewer?: User;
    reviewNote?: string;
    createdAt: string;
    updatedAt: string;
    reviewedAt?: string;
}

export type SubmissionStatus = 'pending' | 'under_review' | 'approved' | 'rejected';

// Activity Types
export interface Activity {
    id: string;
    type: ActivityType;
    userId: string;
    user: User;
    targetId?: string;
    targetType?: string;
    content: string;
    metadata?: Record<string, any>;
    createdAt: string;
}

export type ActivityType =
    | 'thread_created'
    | 'reply_posted'
    | 'thread_liked'
    | 'user_followed'
    | 'faction_joined'
    | 'application_submitted'
    | 'role_updated'
    | 'achievement_earned';

// Notification Types
export interface Notification {
    id: string;
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    isRead: boolean;
    createdAt: string;
}

export type NotificationType = 'reply' | 'mention' | 'like' | 'follow' | 'application' | 'faction' | 'system';

// Search Types
export interface SearchResult {
    type: 'thread' | 'user' | 'faction' | 'application';
    id: string;
    title: string;
    description: string;
    url: string;
    relevance: number;
    metadata?: Record<string, any>;
}

export interface SearchFilters {
    scope: 'all' | 'threads' | 'replies' | 'users' | 'factions' | 'applications';
    dateRange?: {
        start: string;
        end: string;
    };
    categoryId?: string;
    factionId?: string;
    userId?: string;
}

// Stats Types
export interface ForumStats {
    totalThreads: number;
    totalReplies: number;
    totalUsers: number;
    totalFactions: number;
    onlineUsers: number;
    onlineGuests: number;
    newestUser: User;
    todaysPosts: number;
}

// Admin Types
export interface AdminDashboard {
    stats: AdminStats;
    recentActivity: Activity[];
    pendingReviews: number;
    reportedContent: number;
}

export interface AdminStats {
    usersToday: number;
    threadsToday: number;
    repliesToday: number;
    applicationsToday: number;
    bansPending: number;
}

// API Response Types
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> {
    data: T[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}

// Auth Types
export interface LoginCredentials {
    email: string;
    password: string;
    rememberMe?: boolean;
}

export interface RegisterData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}