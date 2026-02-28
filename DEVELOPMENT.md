# Development Guide - Washington Gaming Forum

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

## Development Workflow

### 1. Creating a New Page

```bash
# Create page directory
mkdir src/pages/NewPage

# Create page component
touch src/pages/NewPage/NewPage.tsx
```

Example page structure:

```typescript
import { useState, useEffect } from 'react';

export const NewPage = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Load data
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-display font-bold">New Page</h1>
      {/* Page content */}
    </div>
  );
};
```

Add route in `App.tsx`:

```typescript
<Route path="/new-page" element={<NewPage />} />
```

### 2. Creating a New Component

```bash
# Create component file
touch src/components/ui/NewComponent.tsx
```

Example component:

```typescript
import { FC } from 'react';

interface NewComponentProps {
  title: string;
  data: any[];
  onAction?: () => void;
}

export const NewComponent: FC<NewComponentProps> = ({ title, data, onAction }) => {
  return (
    <div className="card">
      <h3 className="text-lg font-display font-bold mb-4">{title}</h3>
      {/* Component content */}
    </div>
  );
};
```

### 3. Creating a New Service

```bash
# Create service file
touch src/services/newFeature.service.ts
```

Example service:

```typescript
import { apiClient } from './api';
import { ApiResponse, PaginatedResponse } from '@/types';

export const newFeatureService = {
  async getItems(params?: any): Promise<PaginatedResponse<Item>> {
    return apiClient.get('/feature/items', { params });
  },

  async getItem(id: string): Promise<ApiResponse<Item>> {
    return apiClient.get(`/feature/items/${id}`);
  },

  async createItem(data: Partial<Item>): Promise<ApiResponse<Item>> {
    return apiClient.post('/feature/items', data);
  },

  async updateItem(id: string, data: Partial<Item>): Promise<ApiResponse<Item>> {
    return apiClient.put(`/feature/items/${id}`, data);
  },

  async deleteItem(id: string): Promise<ApiResponse<void>> {
    return apiClient.delete(`/feature/items/${id}`);
  },
};
```

### 4. Using React Query

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { newFeatureService } from '@/services/newFeature.service';

// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['items', filters],
  queryFn: () => newFeatureService.getItems(filters),
});

// Create/Update data
const queryClient = useQueryClient();
const createMutation = useMutation({
  mutationFn: newFeatureService.createItem,
  onSuccess: () => {
    queryClient.invalidateQueries(['items']);
    toast.success('Item created successfully');
  },
  onError: (error) => {
    toast.error('Failed to create item');
  },
});

// Use mutation
const handleCreate = () => {
  createMutation.mutate(newItemData);
};
```

### 5. Form Handling with React Hook Form

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.string(),
});

type FormData = z.infer<typeof schema>;

export const MyForm = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await service.create(data);
      toast.success('Created successfully');
    } catch (error) {
      toast.error('Failed to create');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Title</label>
        <input
          {...register('title')}
          className="input-field w-full"
        />
        {errors.title && (
          <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
        )}
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting}>
        {isSubmitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  );
};
```

### 6. State Management with Zustand

```typescript
// src/store/newFeature.store.ts
import { create } from 'zustand';

interface NewFeatureStore {
  items: Item[];
  selectedItem: Item | null;
  setItems: (items: Item[]) => void;
  setSelectedItem: (item: Item | null) => void;
  addItem: (item: Item) => void;
  removeItem: (id: string) => void;
}

export const useNewFeatureStore = create<NewFeatureStore>((set) => ({
  items: [],
  selectedItem: null,
  
  setItems: (items) => set({ items }),
  
  setSelectedItem: (item) => set({ selectedItem: item }),
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item],
  })),
  
  removeItem: (id) => set((state) => ({
    items: state.items.filter((item) => item.id !== id),
  })),
}));

// Usage
const { items, addItem } = useNewFeatureStore();
```

## Styling Guidelines

### Using Tailwind CSS

Prefer utility classes:

```tsx
// Good
<div className="flex items-center justify-between p-4 bg-dark-200 rounded-lg hover:bg-dark-300 transition-colors">

// Avoid
<div style={{ display: 'flex', padding: '16px' }}>
```

### Custom Classes

For complex repeated styles, use custom classes in `index.css`:

```css
.custom-button {
  @apply px-6 py-2.5 rounded-lg font-medium transition-all duration-200;
  @apply bg-primary-600 hover:bg-primary-700 text-white;
  @apply transform hover:scale-105 active:scale-95;
}
```

### Responsive Design

```tsx
<div className="
  grid 
  grid-cols-1      // Mobile: 1 column
  md:grid-cols-2   // Tablet: 2 columns
  lg:grid-cols-3   // Desktop: 3 columns
  gap-6
">
```

## TypeScript Best Practices

### Define Interfaces

```typescript
// Good
interface UserCardProps {
  user: User;
  onFollow?: () => void;
  showActions?: boolean;
}

// Avoid
const UserCard = ({ user, onFollow, showActions }: any) => {
```

### Use Type Inference

```typescript
// Good
const [count, setCount] = useState(0); // TypeScript infers number

// Unnecessary
const [count, setCount] = useState<number>(0);
```

### Generic Components

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}

function List<T>({ items, renderItem }: ListProps<T>) {
  return <div>{items.map(renderItem)}</div>;
}
```

## Testing (Future)

### Component Testing

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClick = jest.fn();
    render(<MyComponent onClick={onClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});
```

## Performance Optimization

### Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<div className="spinner"></div>}>
      <HeavyComponent />
    </Suspense>
  );
}
```

### Memoization

```typescript
import { useMemo, useCallback } from 'react';

// Expensive computation
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// Callback memoization
const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);
```

### Virtual Scrolling

```typescript
import { FixedSizeList } from 'react-window';

const VirtualList = ({ items }) => (
  <FixedSizeList
    height={600}
    itemCount={items.length}
    itemSize={80}
    width="100%"
  >
    {({ index, style }) => (
      <div style={style}>
        <ItemComponent item={items[index]} />
      </div>
    )}
  </FixedSizeList>
);
```

## Debugging

### React DevTools

Install React DevTools browser extension for debugging.

### Console Logging

```typescript
// Development only
if (import.meta.env.DEV) {
  console.log('Debug info:', data);
}
```

### Error Boundaries

```typescript
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  state = { hasError: false };

  static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong.</div>;
    }

    return this.props.children;
  }
}
```

## Common Patterns

### Loading States

```typescript
if (isLoading) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="spinner"></div>
    </div>
  );
}

if (error) {
  return (
    <div className="text-center text-red-500">
      Error: {error.message}
    </div>
  );
}
```

### Pagination

```typescript
const [page, setPage] = useState(1);
const limit = 20;

const { data } = useQuery({
  queryKey: ['items', page],
  queryFn: () => service.getItems({ page, limit }),
});

const handleNextPage = () => setPage(prev => prev + 1);
const handlePrevPage = () => setPage(prev => Math.max(1, prev - 1));
```

### Modal Pattern

```typescript
const [isOpen, setIsOpen] = useState(false);

const Modal = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-200 rounded-lg p-6 max-w-md w-full">
        <button onClick={onClose} className="float-right">×</button>
        {children}
      </div>
    </div>
  );
};
```

## Git Workflow

### Branch Naming

- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `refactor/what-changed` - Code refactoring
- `docs/what-documented` - Documentation

### Commit Messages

Follow conventional commits:

```
feat: add user profile page
fix: resolve login redirect issue
refactor: optimize thread rendering
docs: update API integration guide
style: format code with prettier
```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation

## Testing
- [ ] Tested locally
- [ ] Tested with real API
- [ ] Mobile responsive

## Screenshots
(if applicable)
```

## Resources

- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [React Query](https://tanstack.com/query/latest/docs/react/overview)
- [Zustand](https://github.com/pmndrs/zustand)