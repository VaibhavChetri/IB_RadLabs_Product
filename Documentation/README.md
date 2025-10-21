# 📚 IB Dashboard Documentation

## 🎯 Overview
This documentation is organized by **module/feature area** to make it easy to find relevant information for specific parts of the application.

## 📁 Documentation Structure

### 🏗️ **Architecture** (`/01-Architecture/`)
Core system architecture and design patterns:
- **Architecture Overview** - High-level system design
- **Redux State Management** - State management patterns and Redux implementation
- **API Integration** - API service layer and integration patterns
- **Component Architecture** - Component design patterns and composition

### 👥 **Client Management** (`/02-Client-Management/`)
Client-related features and functionality:
- **Client Management Pages** - Add Client, Edit Client, Manage Clients, Disable Clients
- **Client CRUD Operations** - Create, Read, Update, Delete operations
- **Client Data Flow** - How client data flows through the application

### 🚛 **Transit Plan** (`/03-Transit-Plan/`)
Transit plan management and operations:
- **Master Plan Listing** - Transit plan listing dashboard with filters and pagination
- **Master Plan Creation** - Dynamic form for creating master plans with dispatch/pickup sections
- **Transit Plan API** - API endpoints and data structures
- **Transit Plan Workflow** - Business logic and user workflows

### 🎛️ **Menu Management** (`/05-Menu-Management/`)
Menu system and navigation management:
- **Menu Management** - Creating and managing hierarchical menus
- **Menu Permissions** - Role-based access control for menus
- **Menu API** - Menu-related API endpoints and operations

### 🎨 **UI Components** (`/04-UI-Components/`)
Reusable UI components and design system:
- **UI Components** - Individual component documentation (SearchButton, Dropdowns, etc.)
- **Reusable Components Architecture** - Component design patterns and best practices
- **Design System** - Design tokens, colors, spacing, and typography

### 🔌 **API Reference** (`/06-API-Reference/`)
API documentation and integration guides:
- **Master Plan Creation API** - Complete API documentation for master plan creation
- **API Endpoints** - Complete list of available API endpoints
- **API Authentication** - Authentication and authorization
- **API Error Handling** - Error handling patterns and responses

---

## 🚀 Quick Navigation

### For **Frontend Developers**
- Start with: [Architecture Overview](./01-Architecture/01-Architecture-Overview.md)
- Then: [Component Architecture](./01-Architecture/04-Component-Architecture.md)
- UI Components: [UI Components Guide](./04-UI-Components/03-UI-Components.md)

### For **Backend Integration**
- Start with: [API Integration](./01-Architecture/03-API-Integration.md)
- Then: [API Reference](./06-API-Reference/) (coming soon)
- Authentication: [Redux State Management](./01-Architecture/02-Redux-State-Management.md)

### For **Feature Development**
- **Client Features**: [Client Management](./02-Client-Management/)
- **Transit Features**: [Transit Plan](./03-Transit-Plan/)
- **Menu Features**: [Menu Management](./05-Menu-Management/)

### For **Component Development**
- **New Components**: [Reusable Components Architecture](./04-UI-Components/04-Reusable-Components-Architecture.md)
- **Existing Components**: [UI Components](./04-UI-Components/03-UI-Components.md)

---

## 📋 Documentation Standards

### 📝 File Naming Convention
- **Hierarchical Numbering**: Folders numbered `01-`, `02-`, `03-` for reading order
- **Module Files**: Start from `01-` within each folder: `01-Feature-Name.md`
- **Use hyphens**: For spaces in names: `Client-Management.md`
- **Reading Order**: Start with `01-Architecture`, then `02-Client-Management`, etc.

### 🎯 Content Structure
Each documentation file should include:
1. **Overview** - What this covers
2. **Implementation Details** - How it works
3. **Usage Examples** - Code examples
4. **API Reference** - If applicable
5. **Troubleshooting** - Common issues and solutions

### 🔗 Cross-References
- Link to related documentation using relative paths
- Use consistent formatting for code blocks
- Include table of contents for long documents

---

## 🆕 Recent Updates

### ✅ **Completed**
- ✅ Moved Master Plan Listing documentation to Transit-Plan module
- ✅ Reorganized documentation by feature area
- ✅ Created clear folder structure for each module
- ✅ Updated documentation with current implementation details
- ✅ Implemented hierarchical numbering system (01-Architecture, 02-Client-Management, etc.)
- ✅ Updated all cross-references and links

### 🔄 **In Progress**
- 🔄 Creating API Reference documentation
- 🔄 Adding more detailed component examples
- 🔄 Expanding troubleshooting guides

### 📋 **Planned**
- 📋 Storybook integration for component documentation
- 📋 Visual diagrams for architecture documentation
- 📋 Video tutorials for complex features
- 📋 API testing documentation

---

## 🤝 Contributing to Documentation

### 📝 How to Add Documentation
1. **Identify the Module** - Which feature area does this belong to?
2. **Choose the Right Location** - Place in appropriate folder
3. **Follow Naming Convention** - Use descriptive, numbered filenames
4. **Include Examples** - Always provide code examples
5. **Cross-Reference** - Link to related documentation

### 🔧 Documentation Maintenance
- Keep examples up-to-date with code changes
- Update API references when endpoints change
- Review and update troubleshooting sections regularly
- Ensure all links work and point to correct locations

---

## 📞 Getting Help

### 🆘 **Can't Find What You're Looking For?**
1. Check the **Quick Navigation** section above
2. Look in the **Architecture** folder for system-wide concepts
3. Check the **UI Components** folder for component-specific help
4. Search for keywords across all documentation files

### 🐛 **Found an Issue?**
- Documentation errors: Update the file directly
- Missing documentation: Create new file in appropriate folder
- Outdated examples: Update with current implementation

---

## 📊 Documentation Status

| Module | Status | Last Updated | Coverage |
|--------|--------|--------------|----------|
| Architecture | ✅ Complete | Recent | High |
| Client Management | ✅ Complete | Recent | High |
| Transit Plan | ✅ Complete | Recent | High |
| Menu Management | ✅ Complete | Recent | Medium |
| UI Components | ✅ Complete | Recent | High |
| API Reference | ✅ Complete | Recent | Medium |

---

*This documentation structure is designed to scale with the application. As new features are added, new documentation folders can be created following the same patterns.*
