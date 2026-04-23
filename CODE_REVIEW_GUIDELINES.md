# Frontend Code Review Guidelines

## 🎯 **Overview**
This document outlines the code review standards for our React/TypeScript frontend repository. All code must pass these guidelines before merging.

## 📏 **File Size & Complexity Limits**

### **Component Files**
- **Maximum lines:** 150 lines per component file
- **Maximum complexity:** 10 cyclomatic complexity
- **Maximum parameters:** 5 props per component
- **Maximum nested levels:** 4 levels deep

### **Hook Files**
- **Maximum lines:** 100 lines per hook file
- **Single responsibility:** One hook = one concern
- **Maximum return values:** 8 return values per hook

### **Page Files**
- **Maximum lines:** 200 lines per page file
- **Composition over inheritance:** Use smaller components
- **Custom hooks:** Extract logic into hooks

## 🔍 **Code Quality Standards**

### **1. Component Structure**
```typescript
// ✅ GOOD: Clean, focused component
interface ButtonProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ variant, size, children, onClick }) => {
  return (
    <button 
      className={`btn btn-${variant} btn-${size}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

// ❌ BAD: Too many responsibilities
export const UserDashboard = () => {
  // 200+ lines of mixed concerns
  // API calls, state management, UI rendering, validation
};
```

### **2. Custom Hooks**
```typescript
// ✅ GOOD: Single responsibility hook
export const useUserData = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  
  const fetchUser = async (id: string) => {
    setLoading(true);
    try {
      const userData = await userApi.getUser(id);
      setUser(userData);
    } finally {
      setLoading(false);
    }
  };
  
  return { user, loading, fetchUser };
};

// ❌ BAD: Multiple responsibilities
export const useEverything = () => {
  // User data, auth, notifications, settings, etc.
};
```

### **3. TypeScript Standards**
```typescript
// ✅ GOOD: Proper typing
interface ApiResponse<T> {
  data: T;
  status: number;
  message: string;
}

// ✅ GOOD: Generic interfaces
interface TableColumn<T> {
  key: keyof T;
  label: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
}

// ❌ BAD: Any types
const handleData = (data: any) => {
  // No type safety
};
```

## 🧪 **Testing Requirements**

### **Component Tests**
- **Coverage:** Minimum 80% line coverage
- **Test files:** `ComponentName.test.tsx`
- **Test cases:** Happy path, edge cases, error states

### **Hook Tests**
- **Coverage:** Minimum 90% line coverage
- **Test files:** `useHookName.test.ts`
- **Mocking:** Mock external dependencies

```typescript
// ✅ GOOD: Comprehensive test
describe('useUserData', () => {
  it('should fetch user data successfully', async () => {
    const mockUser = { id: '1', name: 'John' };
    jest.spyOn(userApi, 'getUser').mockResolvedValue(mockUser);
    
    const { result } = renderHook(() => useUserData());
    
    await act(async () => {
      await result.current.fetchUser('1');
    });
    
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.loading).toBe(false);
  });
});
```

## 🎨 **UI/UX Standards**

### **Accessibility**
- **ARIA labels:** Required for interactive elements
- **Keyboard navigation:** All components must be keyboard accessible
- **Color contrast:** Minimum 4.5:1 ratio
- **Screen reader:** Test with screen readers

### **Responsive Design**
- **Mobile-first:** Design for mobile, enhance for desktop
- **Breakpoints:** Use consistent breakpoints
- **Touch targets:** Minimum 44px touch targets

### **Performance**
- **Bundle size:** Monitor bundle size increases
- **Lazy loading:** Use React.lazy for route components
- **Memoization:** Use React.memo, useMemo, useCallback appropriately

## 🔒 **Security Standards**

### **Input Validation**
```typescript
// ✅ GOOD: Input validation
const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// ❌ BAD: No validation
const handleSubmit = (data: any) => {
  // Direct API call without validation
  api.submit(data);
};
```

### **XSS Prevention**
- **Sanitization:** Sanitize user inputs
- **Dangerous HTML:** Avoid dangerouslySetInnerHTML
- **Content Security Policy:** Implement CSP headers

## 📝 **Documentation Requirements**

### **Component Documentation**
```typescript
/**
 * Button component for user interactions
 * 
 * @param variant - Visual style variant
 * @param size - Button size
 * @param children - Button content
 * @param onClick - Click handler
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click me
 * </Button>
 */
export const Button: React.FC<ButtonProps> = ({ ... }) => {
  // Component implementation
};
```

### **API Documentation**
- **JSDoc comments:** Required for all public functions
- **Type definitions:** Document complex types
- **Usage examples:** Provide usage examples

## 🚀 **Performance Guidelines**

### **Bundle Optimization**
- **Code splitting:** Split by routes and features
- **Tree shaking:** Remove unused code
- **Dynamic imports:** Use dynamic imports for large dependencies

### **Runtime Performance**
- **Re-renders:** Minimize unnecessary re-renders
- **Memory leaks:** Clean up subscriptions and timers
- **Debouncing:** Debounce user inputs

## 🔄 **Git Workflow**

### **Branch Naming**
- **Feature:** `feature/component-name`
- **Bugfix:** `bugfix/issue-description`
- **Hotfix:** `hotfix/critical-issue`

### **Commit Messages**
```
type(scope): description

feat(auth): add login validation
fix(ui): resolve button alignment issue
docs(readme): update installation guide
```

### **Pull Request Template**
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No console errors
```

## 🛠 **Tooling Requirements**

### **ESLint Configuration**
```json
{
  "rules": {
    "max-lines": ["error", 150],
    "complexity": ["error", 10],
    "max-params": ["error", 5],
    "max-depth": ["error", 4],
    "@typescript-eslint/no-explicit-any": "error",
    "react-hooks/exhaustive-deps": "error"
  }
}
```

### **Prettier Configuration**
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

## 📊 **Code Review Checklist**

### **Before Submitting**
- [ ] Code compiles without errors
- [ ] All tests pass
- [ ] ESLint warnings resolved
- [ ] File size within limits
- [ ] TypeScript types properly defined
- [ ] Documentation updated

### **Reviewer Checklist**
- [ ] Code follows architecture patterns
- [ ] Performance implications considered
- [ ] Security vulnerabilities checked
- [ ] Accessibility requirements met
- [ ] Error handling implemented
- [ ] Edge cases covered

## 🚫 **Common Anti-Patterns**

### **Avoid These**
```typescript
// ❌ BAD: Large component with mixed concerns
export const UserDashboard = () => {
  // 300+ lines of mixed logic
};

// ❌ BAD: Any types
const handleData = (data: any) => {};

// ❌ BAD: Inline styles
<div style={{ margin: '10px', padding: '5px' }}>

// ❌ BAD: Missing error handling
const fetchData = async () => {
  const data = await api.getData(); // No try-catch
  return data;
};
```

## 📈 **Metrics & Monitoring**

### **Code Quality Metrics**
- **Cyclomatic complexity:** < 10 per function
- **Test coverage:** > 80% overall
- **Bundle size:** Monitor for increases
- **Performance:** Core Web Vitals compliance

### **Review Metrics**
- **Review time:** Target < 24 hours
- **Review iterations:** Target < 3 rounds
- **Defect rate:** < 5% post-merge bugs

---

## 🎯 **Quick Reference**

| Metric | Limit | Tool |
|--------|-------|------|
| File lines | 150 | ESLint |
| Complexity | 10 | ESLint |
| Parameters | 5 | ESLint |
| Nesting | 4 | ESLint |
| Test coverage | 80% | Jest |
| Bundle increase | < 5% | Webpack |

**Remember:** Code reviews are about improving code quality, not personal criticism. Focus on the code, not the person! 🚀
