# Washington Gaming Forum - Frontend

Professional, high-performance React + TypeScript frontend for the Washington Gaming SA-MP Roleplay Community Forum.

## Features

- **Modern Stack**: React 18, TypeScript, Vite, Tailwind CSS
- **State Management**: Zustand for global state
- **Data Fetching**: React Query with optimistic updates
- **Form Handling**: React Hook Form + Zod validation
- **Routing**: React Router DOM v6
- **Animations**: Framer Motion for smooth transitions
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## Project Structure

```
washington-forum/
├── src/
│   ├── components/
│   │   ├── layout/         # Layout components (Header, Footer, Sidebar)
│   │   ├── ui/             # Reusable UI components
│   │   ├── forum/          # Forum-specific components
│   │   ├── factions/       # Faction components
│   │   ├── applications/   # Application form components
│   │   └── admin/          # Admin panel components
│   ├── pages/
│   │   ├── Home/           # Home page
│   │   ├── Staff/          # Staff listing
│   │   ├── Members/        # Member listing
│   │   ├── Activity/       # Activity feed
│   │   ├── Factions/       # Faction pages
│   │   ├── Applications/   # Application system
│   │   ├── Admin/          # Admin panel
│   │   ├── Profile/        # User profiles
│   │   └── Settings/       # User settings
│   ├── hooks/              # Custom React hooks
│   ├── store/              # Zustand stores
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── App.tsx             # Main app component
│   ├── main.tsx            # Entry point
│   └── index.css           # Global styles
├── public/                 # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Backend API running on `http://localhost:8000`

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd washington-forum
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Update `.env` with your configuration:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

5. Start development server:
```bash
npm run dev
# or
yarn dev
```

6. Open browser to `http://localhost:3000`

## Building for Production

```bash
npm run build
# or
yarn build
```

The build output will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
# or
yarn preview
```

## Features Implemented

### Core Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Dark theme with custom color system
- ✅ Role-based color coding
- ✅ Real-time search functionality
- ✅ Notification system
- ✅ User authentication flow
- ✅ Forum home page (Valrise-inspired layout)

### Pages

#### Home Page
- Forum categories with nested structure
- Recent posts sidebar
- Online users display
- Forum statistics
- Thread previews with metadata

#### Staff Page (To Implement)
- Staff member grid/list view
- Filter by role/department
- Online status indicators
- Contact options

#### Members Page (To Implement)
- Advanced search and filtering
- Grid/list view toggle
- Sort by various criteria
- Follow/unfollow functionality

#### Activity Page (To Implement)
- All activity feed
- Content I posted
- Following activity
- Tracked threads

#### Factions Page (To Implement)
- Faction categories
- Faction cards with stats
- Individual faction pages
- Member management
- Applications

#### Applications System (To Implement)
- 13 dynamic form templates
- Submission workflow
- Review dashboard for staff
- Status tracking

#### Admin Panel (To Implement)
- User management
- Content moderation
- Faction management
- Application review
- System settings

## API Integration

The frontend is designed to work with the Washington Gaming Backend API. All API calls are centralized in the `src/services/` directory.

### API Services

- `api.ts` - Base API client with interceptors
- `auth.service.ts` - Authentication endpoints
- `forum.service.ts` - Forum threads, replies, categories
- `faction.service.ts` - Faction management
- `application.service.ts` - Application system
- `user.service.ts` - User profiles and management

### API Base URL

Configure in `.env`:
```env
VITE_API_URL=http://localhost:8000/api/v1
```

## Role System

The forum uses Discord role priorities for permissions:

| Role | Priority | Color |
|------|----------|-------|
| Founder | 1000 | #FF0000 |
| Server Manager | 900 | #FF8C00 |
| Administrator | 450 | #00FF7F |
| Moderator | 300 | #7CFC00 |
| Helper | 200 | #20B2AA |
| VIP | 80 | #FF1493 |
| Verified | 15 | #00FF00 |
| Guest | 1 | #808080 |

## Styling

### Tailwind Configuration

Custom color scheme based on role colors:
```javascript
colors: {
  founder: '#FF0000',
  serverManager: '#FF8C00',
  administrator: '#00FF7F',
  // ... etc
}
```

### Custom CSS Classes

- `.btn-primary` - Primary action button
- `.btn-secondary` - Secondary button
- `.btn-ghost` - Transparent button
- `.card` - Card container
- `.card-hover` - Card with hover effects
- `.badge` - Badge component
- `.role-{rolename}` - Role-specific badge styling

## Performance Optimizations

- Code splitting by route
- Image lazy loading
- List virtualization for large lists
- React Query caching (5 minute stale time)
- Bundle optimization with Vite
- Tree shaking
- Compression

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name forum.washington.com;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Development Guidelines

### Code Style

- Use TypeScript strict mode
- Use functional components with hooks
- Follow React best practices
- Use Tailwind CSS for styling
- Keep components small and focused
- Write meaningful commit messages

### Component Guidelines

1. **File Naming**: PascalCase for components (e.g., `UserCard.tsx`)
2. **Props Interface**: Define interfaces for all component props
3. **Exports**: Use named exports for components
4. **Styling**: Use Tailwind classes, avoid inline styles
5. **State**: Use Zustand for global state, useState for local state
6. **Effects**: Cleanup effects properly
7. **Error Handling**: Use error boundaries

### Git Workflow

1. Create feature branch from `main`
2. Make changes
3. Test thoroughly
4. Commit with descriptive message
5. Push and create pull request
6. Code review
7. Merge to `main`

## Testing (To Implement)

```bash
npm run test
# or
yarn test
```

## Troubleshooting

### Common Issues

**Issue**: API requests failing
**Solution**: Check `.env` file and ensure backend is running

**Issue**: Styles not loading
**Solution**: Clear browser cache and rebuild

**Issue**: TypeScript errors
**Solution**: Run `npm run lint` and fix errors

## Contributing

1. Fork the repository
2. Create feature branch
3. Make your changes
4. Write/update tests
5. Submit pull request

## License

Proprietary - Washington Gaming

## Contact

For questions or support, contact the development team.

---

**Built with ❤️ for Washington Gaming Community**