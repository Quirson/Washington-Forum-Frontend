# API Integration Guide

This document describes how the frontend integrates with the Washington Gaming Backend API.

## Base Configuration

### API Client Setup

The API client is configured in `src/services/api.ts`:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
```

### Authentication

All authenticated requests include the JWT token in the Authorization header:

```typescript
Authorization: Bearer <token>
```

Tokens are stored in localStorage and automatically attached by the API client interceptor.

## API Endpoints Used

### Authentication Endpoints

```typescript
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/logout
GET  /api/v1/auth/me
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
```

### Discord Integration

```typescript
GET  /api/v1/discord/connect?action=register|connect
GET  /api/v1/discord/callback
GET  /api/v1/discord/status
POST /api/v1/discord/sync
DELETE /api/v1/discord/disconnect
```

### Forum Endpoints

```typescript
// Threads
GET    /api/v1/forum/threads
GET    /api/v1/forum/threads/:id
POST   /api/v1/forum/threads
PUT    /api/v1/forum/threads/:id
DELETE /api/v1/forum/threads/:id
POST   /api/v1/forum/threads/:id/like
GET    /api/v1/forum/threads/search

// Replies
GET    /api/v1/forum/threads/:threadId/replies
POST   /api/v1/forum/threads/:threadId/replies
PUT    /api/v1/forum/replies/:id
DELETE /api/v1/forum/replies/:id
POST   /api/v1/forum/replies/:id/like

// Categories
GET    /api/v1/forum/categories
GET    /api/v1/forum/categories/:id
```

### User Endpoints

```typescript
GET    /api/v1/users
GET    /api/v1/users/:id
GET    /api/v1/users/:id/roles
GET    /api/v1/users/:id/followers
GET    /api/v1/users/:id/following
POST   /api/v1/users/:id/follow
DELETE /api/v1/users/:id/follow
GET    /api/v1/users/search
```

### Faction Endpoints

```typescript
GET    /api/v1/factions
GET    /api/v1/factions/:id
GET    /api/v1/factions/:id/members
GET    /api/v1/factions/:id/threads
POST   /api/v1/factions/:id/join
POST   /api/v1/factions/:id/leave
PUT    /api/v1/factions/:factionId/members/:memberId/rank
```

### Application Endpoints

```typescript
GET    /api/v1/applications/templates
GET    /api/v1/applications/templates/:id
POST   /api/v1/applications/:code/submit
GET    /api/v1/applications/submissions
GET    /api/v1/applications/submissions/:id
POST   /api/v1/applications/submissions/:id/review
GET    /api/v1/applications/reviews/pending
```

### Activity & Notifications

```typescript
GET    /api/v1/activity/all
GET    /api/v1/users/me/threads
GET    /api/v1/users/me/following/activity
GET    /api/v1/notifications
PUT    /api/v1/notifications/:id/read
```

## Request/Response Examples

### Login Request

```typescript
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "123",
      "username": "john_doe",
      "email": "user@example.com",
      "avatar": "https://...",
      "roles": [...]
    },
    "token": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### Get Threads Request

```typescript
GET /api/v1/forum/threads?page=1&limit=20&sort=latest&categoryId=abc
Authorization: Bearer <token>

Response:
{
  "data": [
    {
      "id": "thread-1",
      "title": "Welcome to the forum",
      "content": "...",
      "author": {...},
      "category": {...},
      "replies": 10,
      "views": 150,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### Create Thread Request

```typescript
POST /api/v1/forum/threads
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "New thread title",
  "content": "Thread content here...",
  "categoryId": "category-123",
  "tags": ["discussion", "help"]
}

Response:
{
  "success": true,
  "data": {
    "id": "thread-new",
    "title": "New thread title",
    ...
  }
}
```

## Error Handling

### Error Response Format

```typescript
{
  "success": false,
  "error": "Error message here",
  "code": "ERROR_CODE"
}
```

### Common Error Codes

- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `422` - Unprocessable Entity
- `429` - Too Many Requests (rate limit)
- `500` - Internal Server Error

### Frontend Error Handling

```typescript
try {
  const response = await apiClient.get('/endpoint');
  // Handle success
} catch (error) {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response;
    
    if (status === 401) {
      // Redirect to login
      window.location.href = '/login';
    } else if (status === 403) {
      // Show permission error
      toast.error('You do not have permission');
    } else {
      // Show generic error
      toast.error(data.error || 'Something went wrong');
    }
  } else {
    // Network error
    toast.error('Network error. Please try again.');
  }
}
```

## Data Caching Strategy

### React Query Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

### Cache Keys

```typescript
// User data
['user', userId]
['users', 'list', filters]

// Forum data
['threads', 'list', filters]
['thread', threadId]
['categories']

// Faction data
['factions']
['faction', factionId]
['faction', factionId, 'members']
```

### Invalidating Cache

```typescript
// After creating a thread
queryClient.invalidateQueries(['threads', 'list']);

// After updating user
queryClient.invalidateQueries(['user', userId]);
```

## WebSocket Integration (Future)

For real-time features:

```typescript
const socket = new WebSocket('wss://api.washington.com/ws');

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch (data.type) {
    case 'new_reply':
      // Update thread
      queryClient.invalidateQueries(['thread', data.threadId]);
      break;
    case 'notification':
      // Show notification
      toast.info(data.message);
      break;
  }
};
```

## Rate Limiting

The API implements rate limiting:

- **Anonymous users**: 60 requests per hour
- **Authenticated users**: 300 requests per hour
- **Staff members**: 1000 requests per hour

Rate limit headers in response:
```
X-RateLimit-Limit: 300
X-RateLimit-Remaining: 299
X-RateLimit-Reset: 1640995200
```

## CORS Configuration

The backend should be configured with:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # Development
    "https://forum.washington.com",  # Production
]
```

## File Upload

For file uploads (avatars, attachments):

```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('type', 'avatar');

await apiClient.post('/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  onUploadProgress: (progressEvent) => {
    const progress = (progressEvent.loaded / progressEvent.total) * 100;
    setUploadProgress(progress);
  },
});
```

## Testing API Integration

### Mock API Responses (Development)

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

export const handlers = [
  rest.get('/api/v1/forum/threads', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        data: mockThreads,
        pagination: mockPagination,
      })
    );
  }),
];
```

### Testing with Real API

```bash
# Set API URL to staging
VITE_API_URL=https://staging-api.washington.com npm run dev
```

## Best Practices

1. **Always handle errors** - Use try-catch blocks
2. **Show loading states** - Use React Query's isLoading
3. **Debounce search requests** - Wait for user to stop typing
4. **Batch requests** - Combine multiple requests when possible
5. **Cache aggressively** - Use React Query for caching
6. **Validate data** - Use Zod for runtime validation
7. **Monitor API usage** - Track slow endpoints
8. **Handle offline mode** - Show appropriate messages

## Support

For API issues or questions:
- Check backend documentation
- Contact backend team
- Check API logs




prompt
Me Ajude! a Minha Pagina nao le o CSS Porque cara? estou no meio de um Desenvolvimento Front-end Pesado e Muito Bom! me ajude a Resolver isso eu Vou te Passar a Estrutura do meu Codigo e o Proprio Codigo so as Coisas que eu Fiz!

washington-forum/
│
├── public/
│   ├── banner.jpg              (VOCÊ ADICIONA - Imagem do banner hero)
│   ├── logo.png                (VOCÊ ADICIONA - Logo do forum)
│   ├── favicon.svg             (VOCÊ ADICIONA - Ícone do site)
│   ├── avatars/
│   │   └── (imagens de avatares dos usuários)
│   └── servers/
│       └── (imagens dos servidores SAMP/MC)
│
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   └── Header.tsx      ✅ JÁ CRIADO
│   │   ├── ui/
│   │   │   └── (componentes reutilizáveis - criar depois)
│   │   ├── forum/
│   │   │   └── (componentes do fórum - criar depois)
│   │   ├── factions/
│   │   │   └── (componentes de facções - criar depois)
│   │   ├── applications/
│   │   │   └── (componentes de formulários - criar depois)
│   │   ├── admin/
│   │   │   └── (componentes admin - criar depois)
│   │   └── index.ts            ✅ JÁ CRIADO
│   │
│   ├── pages/
│   │   ├── Home/
│   │   │   └── HomePage.tsx    ✅ JÁ CRIADO
│   │   ├── Staff/
│   │   │   └── (criar depois)
│   │   ├── Members/
│   │   │   └── (criar depois)
│   │   ├── Activity/
│   │   │   └── (criar depois)
│   │   ├── Factions/
│   │   │   └── (criar depois)
│   │   ├── Applications/
│   │   │   └── (criar depois)
│   │   ├── Admin/
│   │   │   └── (criar depois)
│   │   ├── Profile/
│   │   │   └── (criar depois)
│   │   ├── Settings/
│   │   │   └── (criar depois)
│   │   └── index.ts            ✅ JÁ CRIADO
│   │
│   ├── services/
│   │   ├── api.ts              ✅ JÁ CRIADO
│   │   ├── auth.service.ts     ✅ JÁ CRIADO
│   │   └── forum.service.ts    ✅ JÁ CRIADO
│   │
│   ├── store/
│   │   └── auth.store.ts       ✅ JÁ CRIADO
│   │
│   ├── hooks/
│   │   └── (custom hooks - criar depois)
│   │
│   ├── utils/
│   │   └── (funções úteis - criar depois)
│   │
│   ├── types/
│   │   └── index.ts            ✅ JÁ CRIADO
│   │
│   ├── App.tsx                 ✅ JÁ CRIADO
│   ├── main.tsx                ✅ JÁ CRIADO
│   └── index.css               ✅ JÁ CRIADO
│
├── .env.example                ✅ JÁ CRIADO
├── .gitignore                  ✅ JÁ CRIADO
├── Dockerfile                  ✅ JÁ CRIADO
├── docker-compose.yml          ✅ JÁ CRIADO
├── index.html                  ✅ JÁ CRIADO
├── nginx.conf                  ✅ JÁ CRIADO
├── package.json                ✅ JÁ CRIADO
├── postcss.config.js           ✅ JÁ CRIADO
├── tailwind.config.js          ✅ JÁ CRIADO
├── tsconfig.json               ✅ JÁ CRIADO
├── tsconfig.node.json          ✅ JÁ CRIADO
├── vite.config.ts              ✅ JÁ CRIADO
│
├── README.md                   ✅ JÁ CRIADO
├── DEVELOPMENT.md              ✅ JÁ CRIADO
├── DEPLOYMENT.md               ✅ JÁ CRIADO
├── API_INTEGRATION.md          ✅ JÁ CRIADO
└── PROJECT_OVERVIEW.md         ✅ JÁ CRIADO





import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Bell, Menu, X, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';

export const Header = () => {
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [showSearch, setShowSearch] = useState(false);
const [scrolled, setScrolled] = useState(false);
const { user, isAuthenticated } = useAuthStore();
const navigate = useNavigate();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navigationLinks = [
        { label: 'Home', path: '/' },
        { label: 'Staff', path: '/staff' },
        { label: 'Members', path: '/members' },
        { label: 'Activity', path: '/activity' },
        { label: 'Factions', path: '/factions' },
        { label: 'Applications', path: '/applications' },
    ];

    return (
        <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-dark-100/95 backdrop-blur-xl shadow-lg' : 'bg-transparent'}`}>
            {/* Banner Hero Section */}
            <div className="relative h-48 md:h-64 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-100/50 to-dark-100"></div>
                <img
                    src="/banner.jpg"
                    alt="Washington Gaming"
                    className="w-full h-full object-cover object-center"
                    style={{ objectPosition: 'center 30%' }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-dark-100/90 via-dark-100/50 to-transparent"></div>

                {/* Banner Content */}
                <div className="absolute inset-0 flex items-center">
                    <div className="container-custom">
                        <div className="flex items-center gap-6">
                            {/* Logo */}
                            <div className="flex-shrink-0">
                                <img
                                    src="/logo.png"
                                    alt="Washington Gaming"
                                    className="h-24 md:h-32 w-auto drop-shadow-2xl"
                                />
                            </div>

                            {/* Title */}
                            <div>
                                <h1 className="text-3xl md:text-5xl font-display font-bold text-white drop-shadow-lg">
                                    WASHINGTON GAMING
                                </h1>
                                <p className="text-sm md:text-lg text-gray-300 mt-2 font-light tracking-wide">
                                    SA-MP Roleplay Community Forum
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Bar */}
            <nav className="bg-dark-200 border-b border-border-color">
                <div className="container-custom">
                    <div className="flex items-center justify-between h-16">
                        {/* Left Section - Navigation Links */}
                        <div className="flex items-center gap-1">
                            {/* Mobile Menu Button */}
                            <button
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                className="lg:hidden p-2 hover:bg-dark-300 rounded-lg transition-colors"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>

                            {/* Desktop Navigation */}
                            <div className="hidden lg:flex items-center gap-1">
                                {navigationLinks.map((link) => (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className="px-4 py-2 rounded-lg hover:bg-dark-300 transition-colors text-sm font-medium text-text-secondary hover:text-white"
                                    >
                                        {link.label}
                                    </Link>
                                ))}

                                {/* Useful Links Dropdown */}
                                <div className="relative group">
                                    <button className="px-4 py-2 rounded-lg hover:bg-dark-300 transition-colors text-sm font-medium text-text-secondary hover:text-white flex items-center gap-1">
                                        Useful Links
                                        <ChevronDown size={16} />
                                    </button>

                                    <div className="absolute top-full left-0 mt-1 w-48 bg-dark-200 border border-border-color rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                        <a
                                            href="https://panel.washington.com"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white"
                                        >
                                            UCP Panel
                                        </a>
                                        <Link
                                            to="/factions"
                                            className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white"
                                        >
                                            Factions
                                        </Link>
                                        <a
                                            href="https://panel.washington.com/donate"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white"
                                        >
                                            Donate
                                        </a>
                                        <Link
                                            to="/rules"
                                            className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white"
                                        >
                                            Server Rules
                                        </Link>
                                        <Link
                                            to="/faq"
                                            className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white"
                                        >
                                            FAQ
                                        </Link>
                                        <Link
                                            to="/bug-report"
                                            className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white rounded-b-lg"
                                        >
                                            Bug Reports
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Section - Search, Notifications, User */}
                        <div className="flex items-center gap-3">
                            {/* Search */}
                            <div className="relative hidden md:block">
                                <div className="flex items-center bg-dark-300 rounded-lg overflow-hidden border border-border-color focus-within:border-primary-500 transition-colors">
                                    <input
                                        type="search"
                                        placeholder="Search forum..."
                                        className="bg-transparent px-4 py-2 text-sm text-white placeholder-text-secondary focus:outline-none w-64"
                                    />
                                    <button className="px-4 py-2 hover:bg-dark-400 transition-colors">
                                        <Search size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Mobile Search Toggle */}
                            <button
                                onClick={() => setShowSearch(!showSearch)}
                                className="md:hidden p-2 hover:bg-dark-300 rounded-lg transition-colors"
                            >
                                <Search size={20} />
                            </button>

                            {isAuthenticated ? (
                                <>
                                    {/* Notifications */}
                                    <button className="relative p-2 hover:bg-dark-300 rounded-lg transition-colors">
                                        <Bell size={20} />
                                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                    </button>

                                    {/* Create Button */}
                                    <button
                                        onClick={() => navigate('/create-thread')}
                                        className="hidden md:flex items-center gap-2 btn-primary"
                                    >
                                        Create
                                    </button>

                                    {/* User Menu */}
                                    <div className="relative group">
                                        <button className="flex items-center gap-2 p-1.5 hover:bg-dark-300 rounded-lg transition-colors">
                                            <img
                                                src={user?.avatar || '/default-avatar.png'}
                                                alt={user?.username}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                            <span className="hidden md:block text-sm font-medium">
                        {user?.username}
                      </span>
                                            <ChevronDown size={16} className="hidden md:block" />
                                        </button>

                                        {/* Dropdown */}
                                        <div className="absolute top-full right-0 mt-1 w-48 bg-dark-200 border border-border-color rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                                            <Link
                                                to={`/profile/${user?.id}`}
                                                className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white"
                                            >
                                                My Profile
                                            </Link>
                                            <Link
                                                to="/settings"
                                                className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white"
                                            >
                                                Settings
                                            </Link>
                                            {user?.roles?.some(r => r.priority >= 300) && (
                                                <Link
                                                    to="/admin"
                                                    className="block px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-text-secondary hover:text-white border-t border-border-color"
                                                >
                                                    Admin Panel
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => {
                                                    useAuthStore.getState().logout();
                                                    navigate('/login');
                                                }}
                                                className="w-full text-left px-4 py-3 hover:bg-dark-300 transition-colors text-sm text-red-400 hover:text-red-300 rounded-b-lg border-t border-border-color"
                                            >
                                                Logout
                                            </button>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link to="/login" className="btn-ghost text-sm">
                                        Login
                                    </Link>
                                    <Link to="/register" className="btn-primary text-sm">
                                        Register
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Search Bar */}
                    {showSearch && (
                        <div className="md:hidden pb-4">
                            <div className="flex items-center bg-dark-300 rounded-lg overflow-hidden border border-border-color">
                                <input
                                    type="search"
                                    placeholder="Search forum..."
                                    className="bg-transparent px-4 py-2 text-sm text-white placeholder-text-secondary focus:outline-none flex-1"
                                />
                                <button className="px-4 py-2 hover:bg-dark-400 transition-colors">
                                    <Search size={18} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="lg:hidden bg-dark-300 border-t border-border-color">
                        <div className="container-custom py-4 space-y-1">
                            {navigationLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className="block px-4 py-3 rounded-lg hover:bg-dark-400 transition-colors text-sm font-medium text-text-secondary hover:text-white"
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}
            </nav>
        </header>
    );
};

index do Components
// Layout Components
export { Header } from './layout/Header';

// UI Components
// Export UI components here as they're created

// Forum Components
// Export forum components here

// Faction Components
// Export faction components here

// Application Components
// Export application components here

// Admin Components
// Export admin components here


Home page
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, Users, TrendingUp, Clock, ChevronRight, Pin } from 'lucide-react';
import { forumService } from '@/services/forum.service';
import { Thread, Category, User } from '@/types';

export const HomePage = () => {
const [categories, setCategories] = useState<Category[]>([]);
const [recentPosts, setRecentPosts] = useState<any[]>([]);
const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadForumData();
    }, []);

    const loadForumData = async () => {
        try {
            setLoading(true);
            // Load categories and recent posts
            const [categoriesRes] = await Promise.all([
                forumService.getCategories(),
            ]);

            setCategories(categoriesRes.data || []);

            // Mock recent posts data
            setRecentPosts([
                {
                    id: '1',
                    title: 'Caso_Trucker banned by Roberto_Makaveli, glass',
                    author: { username: 'Chip', avatar: '/avatars/chip.png' },
                    time: 'Posted 13 hours ago',
                    excerpt: 'Hello, Caso_Trucker! Thank you for submitting an urban request, our staff members will review it shortly...',
                },
                {
                    id: '2',
                    title: 'Caso_Trucker banned by Roberto_Makaveli, glass',
                    author: { username: 'Caso_Trucker', avatar: '/avatars/caso.png' },
                    time: 'Posted 13 hours ago',
                    excerpt: 'What is your in-game name? Caso_Trucker. Which staff member banned you? Roberto_Makaveli, glass...',
                },
                {
                    id: '3',
                    title: '[Unbanned] Billy Major banned by Frosty',
                    author: { username: 'glass', avatar: '/avatars/glass.png' },
                    time: 'Posted Yesterday at 12:04 AM',
                    excerpt: 'Unbanned',
                },
                {
                    id: '4',
                    title: 'Mike Hawthornvale banned by Glass',
                    author: { username: 'Chip', avatar: '/avatars/chip.png' },
                    time: 'Posted Wednesday at 10:22 PM',
                    excerpt: 'Hello, Mike Hawthornvale! Thank you for...',
                },
            ]);
        } catch (error) {
            console.error('Error loading forum data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Mock forum sections data matching Valrise layout
    const forumSections = [
        {
            id: 'community',
            name: 'The Community',
            icon: '🎮',
            categories: [
                {
                    id: 'news',
                    icon: '📢',
                    name: 'News and Announcements',
                    description: 'Important community news and announcements.',
                    threads: 1100,
                    posts: 1100,
                    lastPost: {
                        title: 'MUDOO AWARDS - 2020 EDITION',
                        author: 'bllaijack',
                        date: 'September 4, 2025',
                    },
                },
                {
                    id: 'discord',
                    icon: '💬',
                    name: 'Discord',
                    description: 'Join our Discord server, Ban appeals',
                    threads: 1700,
                    posts: 1700,
                    lastPost: {
                        title: 'Yurinazario banned from Discord',
                        author: 'Kelly_Rae',
                        date: 'Saturday at 10:54 PM',
                    },
                    tags: ['Join our Discord server', 'Ban appeals'],
                },
            ],
        },
        {
            id: 'servers',
            name: 'Servers',
            icon: '🖥️',
            categories: [
                {
                    id: 'samp-valrise',
                    icon: '🎮',
                    name: '[SA:MP] Valrise RPG',
                    description: 'Main server discussions',
                    threads: 79600,
                    posts: 79600,
                    image: '/servers/samp-banner.jpg',
                    tags: [
                        'General',
                        'Server Rules',
                        "You're banned? Appeal it here!",
                        'Need help? Make a ticket here!',
                        'Want to join our Staff Team? Join us here!',
                        'You have an idea, or a bug to report? Let us know!',
                        'Check out the Government forum!',
                        'In Character',
                    ],
                    lastPost: {
                        title: 'Caso_Trucker banned by R...',
                        author: 'Chip',
                        date: '13 hours ago',
                    },
                },
                {
                    id: 'valcraft',
                    icon: '⛏️',
                    name: '[MC] Valcraft SMP',
                    description: 'Whitelist application',
                    threads: 36,
                    posts: 36,
                    image: '/servers/mc-banner.jpg',
                    tags: ['Whitelist application'],
                    lastPost: {
                        title: 'Welcome to Valrise SMP',
                        author: 'Mozi',
                        date: 'August 24, 2025',
                    },
                },
            ],
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {/* Breadcrumb */}
            <div className="bg-dark-200 border-b border-border-color">
                <div className="container-custom py-3">
                    <div className="flex items-center gap-2 text-sm">
                        <Link to="/" className="text-text-secondary hover:text-white transition-colors">
                            Home
                        </Link>
                    </div>
                </div>
            </div>

            <div className="container-custom py-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Forum Content - Left Side (2/3 width) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Forums Header */}
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-display font-bold">Forums</h2>
                            <div className="flex items-center gap-2">
                                <button className="px-4 py-2 text-sm text-text-secondary hover:text-white transition-colors">
                                    <Users size={16} className="inline mr-2" />
                                    Unread Content
                                </button>
                                <button className="px-4 py-2 text-sm text-text-secondary hover:text-white transition-colors">
                                    Mark site read
                                </button>
                                <button className="btn-primary">
                                    Start new topic
                                </button>
                            </div>
                        </div>

                        {/* Forum Sections */}
                        <div className="space-y-6">
                            {forumSections.map((section) => (
                                <div key={section.id} className="card">
                                    {/* Section Header */}
                                    <div className="flex items-center justify-between mb-4 pb-4 border-b border-border-color">
                                        <h3 className="text-lg font-display font-bold flex items-center gap-2">
                                            <span>{section.icon}</span>
                                            {section.name}
                                        </h3>
                                        <button className="text-text-secondary hover:text-white transition-colors">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>

                                    {/* Categories */}
                                    <div className="space-y-4">
                                        {section.categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className="flex items-start gap-4 p-4 rounded-lg hover:bg-dark-300 transition-colors cursor-pointer"
                                            >
                                                {/* Icon */}
                                                <div className="flex-shrink-0">
                                                    {category.image ? (
                                                        <img
                                                            src={category.image}
                                                            alt={category.name}
                                                            className="w-12 h-12 rounded-lg object-cover"
                                                        />
                                                    ) : (
                                                        <div className="w-12 h-12 rounded-lg bg-primary-600/20 flex items-center justify-center text-2xl">
                                                            {category.icon}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 min-w-0">
                                                    <Link
                                                        to={`/category/${category.id}`}
                                                        className="text-lg font-semibold hover:text-primary-500 transition-colors"
                                                    >
                                                        {category.name}
                                                    </Link>

                                                    {category.description && (
                                                        <p className="text-sm text-text-secondary mt-1">
                                                            {category.description}
                                                        </p>
                                                    )}

                                                    {/* Tags */}
                                                    {category.tags && (
                                                        <div className="flex flex-wrap gap-2 mt-2">
                                                            {category.tags.map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="text-xs px-2 py-1 bg-dark-400 rounded text-text-secondary hover:text-white transition-colors"
                                                                >
                                  {tag}
                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Stats & Last Post */}
                                                <div className="flex-shrink-0 text-right">
                                                    <div className="text-sm text-text-secondary mb-2">
                                                        <div>{category.threads.toLocaleString()}</div>
                                                        <div className="text-xs">posts</div>
                                                    </div>

                                                    {category.lastPost && (
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-xs font-bold">
                                                                {category.lastPost.author[0]}
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="text-xs font-medium line-clamp-1">
                                                                    {category.lastPost.title}
                                                                </div>
                                                                <div className="text-xs text-text-secondary">
                                                                    By {category.lastPost.author}, {category.lastPost.date}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sidebar - Right Side (1/3 width) */}
                    <div className="space-y-6">
                        {/* Posts Widget */}
                        <div className="card">
                            <h3 className="text-lg font-display font-bold mb-4">Posts</h3>
                            <div className="space-y-4">
                                {recentPosts.map((post) => (
                                    <div key={post.id} className="flex gap-3">
                                        <img
                                            src={post.author.avatar || '/default-avatar.png'}
                                            alt={post.author.username}
                                            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                to={`/thread/${post.id}`}
                                                className="text-sm font-medium hover:text-primary-500 transition-colors line-clamp-2"
                                            >
                                                {post.title}
                                            </Link>
                                            <div className="text-xs text-text-secondary mt-1">
                                                By <span className="text-red-500">{post.author.username}</span> · {post.time}
                                            </div>
                                            {post.excerpt && (
                                                <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                                                    {post.excerpt}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Online Users */}
                        <div className="card">
                            <h3 className="text-lg font-display font-bold mb-4">
                                Online Users
                            </h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Members Online</span>
                                    <span className="font-semibold text-primary-500">24</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Guests Online</span>
                                    <span className="font-semibold">156</span>
                                </div>
                                <div className="pt-2 border-t border-border-color">
                                    <div className="flex flex-wrap gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                                            <img
                                                key={i}
                                                src={`/avatars/user${i}.png`}
                                                alt={`User ${i}`}
                                                className="w-8 h-8 rounded-full object-cover"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Forum Stats */}
                        <div className="card">
                            <h3 className="text-lg font-display font-bold mb-4">
                                Forum Statistics
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Total Threads</span>
                                    <span className="font-semibold">12,456</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Total Posts</span>
                                    <span className="font-semibold">89,234</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Total Members</span>
                                    <span className="font-semibold">3,421</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-text-secondary">Newest Member</span>
                                    <Link to="/profile/123" className="font-semibold text-primary-500 hover:underline">
                                        John_Doe
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

index.ts do Pages
// Page exports
export { HomePage } from './Home/HomePage';

// Export other pages as they're created
// export { StaffPage } from './Staff/StaffPage';
// export { MembersPage } from './Members/MembersPage';
// export { ActivityPage } from './Activity/ActivityPage';
// export { FactionsPage } from './Factions/FactionsPage';
// export { ApplicationsPage } from './Applications/ApplicationsPage';
// export { AdminPage } from './Admin/AdminPage';
// export { ProfilePage } from './Profile/ProfilePage';
// export { SettingsPage } from './Settings/SettingsPage';

Api
import axios, { AxiosInstance, AxiosRequestConfig, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.washingtongaming.tech/api/v1';

class ApiClient {
private client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            withCredentials: true,
        });

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor
        this.client.interceptors.response.use(
            (response) => response,
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    localStorage.removeItem('auth_token');
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    async get<T>(url: string, config?: AxiosRequestConfig) {
        const response = await this.client.get<T>(url, config);
        return response.data;
    }

    async post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
        const response = await this.client.post<T>(url, data, config);
        return response.data;
    }

    async put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
        const response = await this.client.put<T>(url, data, config);
        return response.data;
    }

    async patch<T>(url: string, data?: any, config?: AxiosRequestConfig) {
        const response = await this.client.patch<T>(url, data, config);
        return response.data;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig) {
        const response = await this.client.delete<T>(url, config);
        return response.data;
    }
}

export const apiClient = new ApiClient();

auth.service.ts
import { apiClient } from './api';
import { ApiResponse, User, LoginCredentials, RegisterData } from '@/types';

export const authService = {
async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
return apiClient.post('/auth/login', credentials);
},

    async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
        return apiClient.post('/auth/register', data);
    },

    async logout(): Promise<ApiResponse<void>> {
        return apiClient.post('/auth/logout');
    },

    async getCurrentUser(): Promise<ApiResponse<User>> {
        return apiClient.get('/auth/me');
    },

    async forgotPassword(email: string): Promise<ApiResponse<void>> {
        return apiClient.post('/auth/forgot-password', { email });
    },

    async resetPassword(token: string, newPassword: string): Promise<ApiResponse<void>> {
        return apiClient.post('/auth/reset-password', { token, newPassword });
    },

    async connectDiscord(action: 'register' | 'connect'): Promise<{ url: string }> {
        return apiClient.get(`/discord/connect?action=${action}`);
    },

    async getDiscordStatus(): Promise<ApiResponse<any>> {
        return apiClient.get('/discord/status');
    },

    async syncDiscord(): Promise<ApiResponse<void>> {
        return apiClient.post('/discord/sync');
    },

    async disconnectDiscord(): Promise<ApiResponse<void>> {
        return apiClient.delete('/discord/disconnect');
    },
};

forum.service.ts
import { apiClient } from './api';
import { ApiResponse, PaginatedResponse, Thread, Reply, Category } from '@/types';

export const forumService = {
// Threads
async getThreads(params?: {
page?: number;
limit?: number;
sort?: string;
categoryId?: string;
}): Promise<PaginatedResponse<Thread>> {
return apiClient.get('/forum/threads', { params });
},

    async getThread(id: string): Promise<ApiResponse<Thread>> {
        return apiClient.get(`/forum/threads/${id}`);
    },

    async createThread(data: Partial<Thread>): Promise<ApiResponse<Thread>> {
        return apiClient.post('/forum/threads', data);
    },

    async updateThread(id: string, data: Partial<Thread>): Promise<ApiResponse<Thread>> {
        return apiClient.put(`/forum/threads/${id}`, data);
    },

    async deleteThread(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete(`/forum/threads/${id}`);
    },

    async likeThread(id: string): Promise<ApiResponse<void>> {
        return apiClient.post(`/forum/threads/${id}/like`);
    },

    // Replies
    async getReplies(threadId: string, page?: number): Promise<PaginatedResponse<Reply>> {
        return apiClient.get(`/forum/threads/${threadId}/replies`, { params: { page } });
    },

    async createReply(threadId: string, data: Partial<Reply>): Promise<ApiResponse<Reply>> {
        return apiClient.post(`/forum/threads/${threadId}/replies`, data);
    },

    async updateReply(replyId: string, data: Partial<Reply>): Promise<ApiResponse<Reply>> {
        return apiClient.put(`/forum/replies/${replyId}`, data);
    },

    async deleteReply(replyId: string): Promise<ApiResponse<void>> {
        return apiClient.delete(`/forum/replies/${replyId}`);
    },

    async likeReply(replyId: string): Promise<ApiResponse<void>> {
        return apiClient.post(`/forum/replies/${replyId}/like`);
    },

    // Categories
    async getCategories(): Promise<ApiResponse<Category[]>> {
        return apiClient.get('/forum/categories');
    },

    async getCategory(id: string): Promise<ApiResponse<Category>> {
        return apiClient.get(`/forum/categories/${id}`);
    },

    // Search
    async searchThreads(query: string, filters?: any): Promise<PaginatedResponse<Thread>> {
        return apiClient.get('/forum/threads/search', { params: { q: query, ...filters } });
    },
};

authStore
import { create } from 'zustand';
import { User } from '@/types';

interface AuthStore {
user: User | null;
token: string | null;
isAuthenticated: boolean;
isLoading: boolean;
setUser: (user: User | null) => void;
setToken: (token: string | null) => void;
setLoading: (loading: boolean) => void;
logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
user: null,
token: localStorage.getItem('auth_token'),
isAuthenticated: !!localStorage.getItem('auth_token'),
isLoading: true,

    setUser: (user) => set({ user, isAuthenticated: !!user }),

    setToken: (token) => {
        if (token) {
            localStorage.setItem('auth_token', token);
        } else {
            localStorage.removeItem('auth_token');
        }
        set({ token, isAuthenticated: !!token });
    },

    setLoading: (loading) => set({ isLoading: loading }),

    logout: () => {
        localStorage.removeItem('auth_token');
        set({ user: null, token: null, isAuthenticated: false });
    },
}));


types/index
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

app.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { Header } from '@/components/layout/Header';
import { HomePage } from './pages/Home/HomePage';

// Create Query Client
const queryClient = new QueryClient({
defaultOptions: {
queries: {
refetchOnWindowFocus: false,
retry: 1,
staleTime: 5 * 60 * 1000, // 5 minutes
},
},
});

function App() {
return (
<QueryClientProvider client={queryClient}>
<Router>
<div className="min-h-screen bg-dark-100">
<Header />

                    {/* Main Content - Add padding-top to account for fixed header */}
                    <main className="pt-[400px] md:pt-[352px]">
                        <Routes>
                            <Route path="/" element={<HomePage />} />
                            {/* Add more routes as needed */}
                        </Routes>
                    </main>

                    {/* Toast Notifications */}
                    <Toaster
                        position="top-right"
                        toastOptions={{
                            duration: 4000,
                            style: {
                                background: '#1c1c24',
                                color: '#fff',
                                border: '1px solid #2a2a36',
                            },
                            success: {
                                iconTheme: {
                                    primary: '#0ea5e9',
                                    secondary: '#fff',
                                },
                            },
                            error: {
                                iconTheme: {
                                    primary: '#ef4444',
                                    secondary: '#fff',
                                },
                            },
                        }}
                    />
                </div>
            </Router>
        </QueryClientProvider>
    );
}

export default App;

index.css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
/* Role Colors */
--color-founder: #FF0000;
--color-server-manager: #FF8C00;
--color-administrator: #00FF7F;
--color-moderator: #7CFC00;
--color-helper: #20B2AA;
--color-vip: #FF1493;
--color-verified: #00FF00;
--color-guest: #808080;

    /* Theme Colors */
    --background-primary: #0a0a0b;
    --background-secondary: #14141a;
    --background-tertiary: #1c1c24;
    --text-primary: #ffffff;
    --text-secondary: #a8a8b3;
    --border-color: #2a2a36;
    --accent-blue: #0ea5e9;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  }

body {
font-family: 'Sora', system-ui, sans-serif;
background-color: var(--background-primary);
color: var(--text-primary);
line-height: 1.6;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
overflow-x: hidden;
}

#root {
min-height: 100vh;
display: flex;
flex-direction: column;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
width: 8px;
height: 8px;
}

::-webkit-scrollbar-track {
background: var(--background-secondary);
}

::-webkit-scrollbar-thumb {
background: var(--border-color);
border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
background: #3a3a46;
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
font-family: 'Orbitron', sans-serif;
font-weight: 700;
line-height: 1.2;
}

/* Animations */
@keyframes shimmer {
0% {
background-position: -1000px 0;
}
100% {
background-position: 1000px 0;
}
}

.shimmer {
background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
background-size: 1000px 100%;
animation: shimmer 2s infinite;
}

/* Glass Effect */
.glass {
background: rgba(255, 255, 255, 0.05);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.1);
}

/* Gradient Text */
.gradient-text {
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
background-clip: text;
}

/* Button Styles */
.btn-primary {
@apply bg-primary-600 hover:bg-primary-700 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95;
}

.btn-secondary {
@apply bg-dark-300 hover:bg-dark-400 text-white font-medium px-6 py-2.5 rounded-lg transition-all duration-200;
}

.btn-ghost {
@apply bg-transparent hover:bg-dark-200 text-text-secondary hover:text-text-primary font-medium px-6 py-2.5 rounded-lg transition-all duration-200;
}

/* Input Styles */
.input-field {
@apply bg-dark-200 border border-border-color text-white px-4 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200;
}

/* Card Styles */
.card {
@apply bg-dark-200 border border-border-color rounded-lg p-6 transition-all duration-200;
}

.card-hover {
@apply card hover:border-primary-500 hover:shadow-lg hover:shadow-primary-500/20 hover:-translate-y-1;
}

/* Badge Styles */
.badge {
@apply inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold;
}

/* Role Badge Colors */
.role-founder {
@apply bg-founder/20 text-founder border border-founder/30;
}

.role-server-manager {
@apply bg-serverManager/20 text-serverManager border border-serverManager/30;
}

.role-administrator {
@apply bg-administrator/20 text-administrator border border-administrator/30;
}

.role-moderator {
@apply bg-moderator/20 text-moderator border border-moderator/30;
}

.role-helper {
@apply bg-helper/20 text-helper border border-helper/30;
}

.role-vip {
@apply bg-vip/20 text-vip border border-vip/30;
}

.role-verified {
@apply bg-verified/20 text-verified border border-verified/30;
}

.role-guest {
@apply bg-guest/20 text-guest border border-guest/30;
}

/* Loading Spinner */
.spinner {
border: 2px solid rgba(255, 255, 255, 0.1);
border-left-color: var(--accent-blue);
border-radius: 50%;
width: 20px;
height: 20px;
animation: spin 0.6s linear infinite;
}

@keyframes spin {
to {
transform: rotate(360deg);
}
}

/* Utility Classes */
.container-custom {
@apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

.section-spacing {
@apply py-12 md:py-16 lg:py-20;
}


import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
<React.StrictMode>
<App />
</React.StrictMode>
);

index.html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Washington Gaming - SA-MP Roleplay Community Forum" />
    <meta name="keywords" content="SA-MP, roleplay, gaming, forum, Washington" />

    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800;900&family=Sora:wght@100;200;300;400;500;600;700;800&display=swap" rel="stylesheet" />

    <title>Washington Gaming Forum</title>

    <!-- CRITICAL CSS INLINE -->
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Sora', system-ui, sans-serif;
            background-color: #0a0a0b;
            color: #ffffff;
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }

        #root {
            min-height: 100vh;
        }

        h1, h2, h3, h4, h5, h6 {
            font-family: 'Orbitron', sans-serif;
            font-weight: 700;
        }
    </style>
</head>
<body>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>

{
"name": "washington-forum",
"version": "1.0.0",
"description": "Washington Gaming SA-MP Forum - Professional Frontend",
"type": "module",
"scripts": {
"dev": "vite",
"build": "tsc && vite build",
"preview": "vite preview",
"lint": "eslint . --ext ts,tsx",
"format": "prettier --write \"src/**/*.{ts,tsx,css}\""
},
"dependencies": {
"react": "^18.2.0",
"react-dom": "^18.2.0",
"react-router-dom": "^6.20.0",
"@tanstack/react-query": "^5.14.2",
"axios": "^1.6.2",
"zustand": "^4.4.7",
"react-hook-form": "^7.48.2",
"zod": "^3.22.4",
"@hookform/resolvers": "^3.3.2",
"react-hot-toast": "^2.4.1",
"lucide-react": "^0.294.0",
"clsx": "^2.0.0",
"date-fns": "^2.30.0",
"react-window": "^1.8.10",
"framer-motion": "^10.16.16"
},
"devDependencies": {
"@types/react": "^18.2.43",
"@types/react-dom": "^18.2.17",
"@types/react-window": "^1.8.8",
"@typescript-eslint/eslint-plugin": "^6.14.0",
"@typescript-eslint/parser": "^6.14.0",
"@vitejs/plugin-react": "^4.2.1",
"autoprefixer": "^10.4.16",
"eslint": "^8.55.0",
"eslint-plugin-react-hooks": "^4.6.0",
"eslint-plugin-react-refresh": "^0.4.5",
"postcss": "^8.4.32",
"prettier": "^3.1.1",
"tailwindcss": "^3.3.6",
"typescript": "^5.3.3",
"vite": "^5.0.8"
}
}
postcss.config....
export default {
plugins: {
tailwindcss: {},
autoprefixer: {},
},
};

tailwindo.config
/** @type {import('tailwindcss').Config} */
export default {
content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
theme: {
extend: {
colors: {
// Role colors from Discord hierarchy
founder: '#FF0000',
serverManager: '#FF8C00',
administrator: '#00FF7F',
moderator: '#7CFC00',
helper: '#20B2AA',
vip: '#FF1493',
verified: '#00FF00',
guest: '#808080',
// Forum theme colors
primary: {
50: '#f0f9ff',
100: '#e0f2fe',
200: '#bae6fd',
300: '#7dd3fc',
400: '#38bdf8',
500: '#0ea5e9',
600: '#0284c7',
700: '#0369a1',
800: '#075985',
900: '#0c4a6e',
},
dark: {
50: '#18181b',
100: '#1c1c1f',
200: '#27272a',
300: '#3f3f46',
400: '#52525b',
500: '#71717a',
600: '#a1a1aa',
700: '#d4d4d8',
800: '#e4e4e7',
900: '#f4f4f5',
},
},
fontFamily: {
sans: ['Sora', 'system-ui', 'sans-serif'],
display: ['Orbitron', 'sans-serif'],
body: ['Inter', 'system-ui', 'sans-serif'],
},
animation: {
'fade-in': 'fadeIn 0.5s ease-in-out',
'slide-up': 'slideUp 0.5s ease-out',
'slide-down': 'slideDown 0.5s ease-out',
'scale-in': 'scaleIn 0.3s ease-out',
pulse: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
},
keyframes: {
fadeIn: {
'0%': { opacity: '0' },
'100%': { opacity: '1' },
},
slideUp: {
'0%': { transform: 'translateY(20px)', opacity: '0' },
'100%': { transform: 'translateY(0)', opacity: '1' },
},
slideDown: {
'0%': { transform: 'translateY(-20px)', opacity: '0' },
'100%': { transform: 'translateY(0)', opacity: '1' },
},
scaleIn: {
'0%': { transform: 'scale(0.9)', opacity: '0' },
'100%': { transform: 'scale(1)', opacity: '1' },
},
},
backgroundImage: {
'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
},
},
},
plugins: [],
};

tsconfig
{
"compilerOptions": {
"target": "ES2020",
"useDefineForClassFields": true,
"lib": ["ES2020", "DOM", "DOM.Iterable"],
"module": "ESNext",
"skipLibCheck": true,
"moduleResolution": "bundler",
"allowImportingTsExtensions": true,
"resolveJsonModule": true,
"isolatedModules": true,
"noEmit": true,
"jsx": "react-jsx",
"strict": true,
"noUnusedLocals": true,
"noUnusedParameters": true,
"noFallthroughCasesInSwitch": true,
"baseUrl": ".",
"paths": {
"@/*": ["./src/*"],
"@/components/*": ["./src/components/*"],
"@/pages/*": ["./src/pages/*"],
"@/hooks/*": ["./src/hooks/*"],
"@/store/*": ["./src/store/*"],
"@/services/*": ["./src/services/*"],
"@/utils/*": ["./src/utils/*"],
"@/types/*": ["./src/types/*"]
},
"allowSyntheticDefaultImports": true
},
"include": ["src"],
"references": [{ "path": "./tsconfig.node.json" }]
}

Vite config
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
plugins: [react()],
resolve: {
alias: {
'@': path.resolve(__dirname, './src'),
'@/components': path.resolve(__dirname, './src/components'),
'@/pages': path.resolve(__dirname, './src/pages'),
'@/hooks': path.resolve(__dirname, './src/hooks'),
'@/store': path.resolve(__dirname, './src/store'),
'@/services': path.resolve(__dirname, './src/services'),
'@/utils': path.resolve(__dirname, './src/utils'),
'@/types': path.resolve(__dirname, './src/types'),
},
},
server: {
port: 3000,
proxy: {
'/api': {
target: 'http://localhost:8000',
changeOrigin: true,
},
},
},
build: {
rollupOptions: {
output: {
manualChunks: {
vendor: ['react', 'react-dom', 'react-router-dom'],
ui: ['lucide-react', 'framer-motion'],
},
},
},
},
});


Entao Qual e a Idea cara me ajude!