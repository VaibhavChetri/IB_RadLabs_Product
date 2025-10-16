# IB Dashboard

A professional dashboard application built with React, TypeScript, TailwindCSS v4, and Redux Toolkit.

## 🚀 Features

- **Modern Tech Stack**: React 18, TypeScript, TailwindCSS v4, Vite, Redux Toolkit
- **Comprehensive Design System**: Complete UI component library with customizable design tokens
- **Responsive Design**: Mobile-first approach with consistent breakpoints
- **Type Safety**: Full TypeScript support with comprehensive type definitions
- **Performance Optimized**: Fast development and production builds with Vite
- **Industry Standards**: ESLint, Prettier, and modern development practices

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript
- **Styling**: TailwindCSS v4, CSS Custom Properties
- **Build Tool**: Vite
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **Icons**: Lucide React
- **Code Quality**: ESLint, Prettier

## 📦 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd IB-Dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:5173
   ```

## 🎨 Design System

The project includes a comprehensive design system with:

- **Design Tokens**: Colors, typography, spacing, shadows
- **UI Components**: Buttons, inputs, cards, alerts, forms, navigation, data display
- **Layout Components**: Grid, flex, containers, responsive utilities
- **Feedback Components**: Badges, tooltips, snackbars

### Demo Credentials
- **Email**: `admin@example.com`
- **Password**: `password123`

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                 # Design system components
│   ├── Layout.tsx          # Main layout component
│   ├── Sidebar.tsx         # Navigation sidebar
│   └── Header.tsx          # Top header
├── pages/
│   ├── Dashboard.tsx       # Main dashboard page
│   └── Login.tsx           # Authentication page
├── store/
│   ├── slices/             # Redux slices
│   └── index.ts            # Store configuration
├── design-system/
│   ├── tokens.ts           # Design tokens
│   └── utils.ts            # Design utilities
├── data/
│   ├── navigation.ts       # Navigation structure
│   └── secondaryNavigation.ts
└── utils/
    └── cn.ts               # Utility functions
```

## 🚀 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run type-check` - Run TypeScript type checking

## 🎯 Development

### Adding New Components
1. Create component in `src/components/ui/`
2. Export from `src/components/ui/index.ts`
3. Add to showcase page for testing
4. Update documentation

### Customizing Design System
1. Modify CSS custom properties in `src/index.css`
2. Update design tokens in `src/design-system/tokens.ts`
3. Test across all components

### Adding New Pages
1. Create page component in `src/pages/`
2. Add route to `src/App.tsx`
3. Add navigation item to `src/data/navigation.ts`

## 🔧 Configuration

### ESLint
- Configured for React, TypeScript, and modern JavaScript
- Includes accessibility rules
- Custom rules for project standards

### Prettier
- Consistent code formatting
- Integrated with ESLint
- Configured for TypeScript and JSX

### TailwindCSS v4
- Uses CSS custom properties for configuration
- Custom design tokens
- Responsive utilities

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Contributing

1. Follow the established patterns
2. Add TypeScript types for all props
3. Include accessibility features
4. Test across different screen sizes
5. Update documentation

## 📞 Support

For support and questions, please contact the development team.

---

Built with ❤️ using React, TypeScript, and TailwindCSS v4
