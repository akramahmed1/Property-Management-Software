# Contributing Guide

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Code Standards](#code-standards)
4. [Pull Request Process](#pull-request-process)
5. [Issue Reporting](#issue-reporting)
6. [Feature Requests](#feature-requests)
7. [Documentation](#documentation)
8. [Testing](#testing)
9. [Release Process](#release-process)

## Getting Started

Thank you for your interest in contributing to the Property Management Software! This guide will help you get started with contributing to the project.

### Types of Contributions

We welcome various types of contributions:

- **Bug Fixes**: Fix existing issues
- **Feature Development**: Implement new features
- **Documentation**: Improve documentation
- **Testing**: Add or improve tests
- **Performance**: Optimize code and performance
- **Security**: Improve security measures
- **UI/UX**: Enhance user interface and experience

### Prerequisites

Before contributing, ensure you have:

- Node.js 18+ installed
- Git installed and configured
- A GitHub account
- Basic knowledge of TypeScript/JavaScript
- Understanding of React Native and Node.js

## Development Setup

### 1. Fork and Clone

1. **Fork the Repository**
   - Go to the main repository
   - Click "Fork" button
   - This creates your own copy

2. **Clone Your Fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/property-management-software.git
   cd property-management-software
   ```

3. **Add Upstream Remote**
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/property-management-software.git
   ```

### 2. Install Dependencies

```bash
# Install all dependencies
npm install

# Install backend dependencies
cd src/backend && npm install

# Install frontend dependencies
cd ../frontend && npm install

# Install test dependencies
cd ../../tests && npm install
```

### 3. Environment Setup

```bash
# Copy environment file
cp env.example .env

# Configure your environment variables
# Edit .env with your local settings
```

### 4. Database Setup

```bash
# Start PostgreSQL and Redis
# (Install and start these services locally)

# Run database migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### 5. Start Development Servers

```bash
# Start all services
npm run dev

# Or start individually
npm run dev:backend    # Backend API
npm run dev:frontend   # React Native
```

## Code Standards

### TypeScript Guidelines

1. **Type Safety**
   ```typescript
   // Use strict typing
   interface User {
     id: string;
     name: string;
     email: string;
   }
   
   // Avoid any type
   const user: User = await getUserById(id);
   ```

2. **Error Handling**
   ```typescript
   try {
     const result = await riskyOperation();
     return { success: true, data: result };
   } catch (error) {
     logger.error('Operation failed:', error);
     return { success: false, error: error.message };
   }
   ```

3. **Async/Await**
   ```typescript
   // Prefer async/await over promises
   const fetchUser = async (id: string): Promise<User> => {
     const user = await prisma.user.findUnique({ where: { id } });
     if (!user) throw new Error('User not found');
     return user;
   };
   ```

### Code Style

1. **ESLint Configuration**
   - Follow the existing ESLint rules
   - Run `npm run lint` before committing
   - Fix any linting errors

2. **Prettier Formatting**
   - Use Prettier for code formatting
   - Run `npm run lint:fix` to auto-fix
   - Configure your editor to format on save

3. **Naming Conventions**
   ```typescript
   // Variables and functions: camelCase
   const userName = 'john';
   const getUserById = (id: string) => { };
   
   // Classes: PascalCase
   class UserService { }
   
   // Constants: UPPER_SNAKE_CASE
   const MAX_RETRY_ATTEMPTS = 3;
   
   // Interfaces: PascalCase with I prefix
   interface IUserRepository { }
   ```

### File Organization

1. **Backend Structure**
   ```
   src/backend/src/
   ├── config/          # Configuration files
   ├── controllers/     # API controllers
   ├── middleware/      # Express middleware
   ├── routes/          # API routes
   ├── services/        # Business logic
   ├── utils/           # Utility functions
   └── types/           # TypeScript types
   ```

2. **Frontend Structure**
   ```
   src/frontend/src/
   ├── components/      # Reusable components
   ├── screens/         # App screens
   ├── navigation/      # Navigation setup
   ├── services/        # API services
   ├── store/           # Redux store
   ├── theme/           # UI theme
   └── utils/           # Utility functions
   ```

### Git Workflow

1. **Branch Naming**
   ```bash
   # Feature branches
   feature/user-authentication
   feature/property-search
   
   # Bug fix branches
   bugfix/login-error
   bugfix/payment-gateway
   
   # Hotfix branches
   hotfix/security-patch
   hotfix/critical-bug
   ```

2. **Commit Messages**
   ```bash
   # Format: type(scope): description
   
   # Examples:
   feat(auth): add two-factor authentication
   fix(api): resolve payment processing error
   docs(readme): update installation instructions
   test(unit): add user service tests
   refactor(ui): improve property card component
   ```

3. **Commit Types**
   - `feat`: New feature
   - `fix`: Bug fix
   - `docs`: Documentation changes
   - `style`: Code style changes
   - `refactor`: Code refactoring
   - `test`: Test additions/changes
   - `chore`: Build process or auxiliary tool changes

## Pull Request Process

### 1. Create a Branch

```bash
# Create and switch to new branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b bugfix/issue-description
```

### 2. Make Changes

1. **Write Code**
   - Follow coding standards
   - Add appropriate comments
   - Write tests for new features
   - Update documentation if needed

2. **Test Your Changes**
   ```bash
   # Run all tests
   npm test
   
   # Run specific test suites
   npm run test:unit
   npm run test:integration
   npm run test:e2e
   
   # Check code quality
   npm run lint
   npm run type-check
   ```

3. **Commit Changes**
   ```bash
   # Add changes
   git add .
   
   # Commit with descriptive message
   git commit -m "feat(auth): add password reset functionality"
   ```

### 3. Push and Create PR

```bash
# Push to your fork
git push origin feature/your-feature-name

# Create Pull Request on GitHub
# Fill out the PR template
# Request review from maintainers
```

### 4. PR Review Process

1. **Automated Checks**
   - CI/CD pipeline runs
   - Tests must pass
   - Code quality checks
   - Security scans

2. **Code Review**
   - Maintainers review code
   - Address feedback
   - Make requested changes
   - Update tests if needed

3. **Approval and Merge**
   - At least one approval required
   - All checks must pass
   - Merge to main branch
   - Delete feature branch

### PR Template

When creating a PR, use this template:

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes
```

## Issue Reporting

### Before Creating an Issue

1. **Search Existing Issues**
   - Check if issue already exists
   - Look for similar problems
   - Check closed issues

2. **Gather Information**
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots/logs if applicable

### Issue Template

Use this template for bug reports:

```markdown
## Bug Description
Clear description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '...'
3. Scroll down to '...'
4. See error

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., iOS 14, Android 11]
- App Version: [e.g., 1.4.0]
- Device: [e.g., iPhone 12, Samsung Galaxy S21]

## Screenshots
If applicable, add screenshots

## Additional Context
Any other relevant information
```

## Feature Requests

### Before Requesting a Feature

1. **Check Roadmap**
   - Review planned features
   - Check if already planned
   - Understand priority

2. **Research**
   - Look for existing solutions
   - Consider alternatives
   - Think about implementation

### Feature Request Template

```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should this be implemented?

## Alternatives Considered
What other solutions were considered?

## Additional Context
Any other relevant information
```

## Documentation

### Documentation Standards

1. **Code Documentation**
   ```typescript
   /**
    * Creates a new property in the system
    * @param propertyData - The property information
    * @param userId - The ID of the user creating the property
    * @returns Promise<Property> - The created property
    * @throws {ValidationError} When property data is invalid
    * @throws {DatabaseError} When database operation fails
    */
   async createProperty(propertyData: CreatePropertyDto, userId: string): Promise<Property> {
     // Implementation
   }
   ```

2. **API Documentation**
   - Use Swagger/OpenAPI annotations
   - Document all endpoints
   - Include request/response examples
   - Add error responses

3. **README Updates**
   - Update installation instructions
   - Add new features to feature list
   - Update configuration options
   - Add troubleshooting information

### Documentation Types

1. **Code Comments**
   - Explain complex logic
   - Document business rules
   - Add TODO comments for future work
   - Include examples where helpful

2. **API Documentation**
   - Endpoint descriptions
   - Request/response schemas
   - Authentication requirements
   - Error codes and messages

3. **User Documentation**
   - Feature descriptions
   - Step-by-step guides
   - Screenshots and examples
   - Troubleshooting guides

## Testing

### Test Types

1. **Unit Tests**
   ```typescript
   describe('UserService', () => {
     it('should create user with valid data', async () => {
       const userData = { name: 'John', email: 'john@example.com' };
       const user = await userService.createUser(userData);
       expect(user.name).toBe('John');
       expect(user.email).toBe('john@example.com');
     });
   });
   ```

2. **Integration Tests**
   ```typescript
   describe('Property API', () => {
     it('should create property via API', async () => {
       const response = await request(app)
         .post('/api/properties')
         .send(propertyData)
         .expect(201);
       
       expect(response.body.success).toBe(true);
       expect(response.body.data.name).toBe(propertyData.name);
     });
   });
   ```

3. **End-to-End Tests**
   ```typescript
   describe('Property Booking Flow', () => {
     it('should complete booking process', async () => {
       // Login
       await page.goto('/login');
       await page.fill('[data-testid=email]', 'user@example.com');
       await page.fill('[data-testid=password]', 'password');
       await page.click('[data-testid=login-button]');
       
       // Navigate to properties
       await page.goto('/properties');
       await page.click('[data-testid=property-card]');
       
       // Create booking
       await page.click('[data-testid=book-button]');
       await page.fill('[data-testid=booking-amount]', '500000');
       await page.click('[data-testid=confirm-booking]');
       
       // Verify booking created
       await expect(page.locator('[data-testid=success-message]')).toBeVisible();
     });
   });
   ```

### Test Guidelines

1. **Test Coverage**
   - Aim for 80%+ code coverage
   - Test critical business logic
   - Test error conditions
   - Test edge cases

2. **Test Data**
   - Use factories for test data
   - Clean up after tests
   - Use realistic test data
   - Avoid hardcoded values

3. **Test Organization**
   - Group related tests
   - Use descriptive test names
   - Follow AAA pattern (Arrange, Act, Assert)
   - Keep tests independent

## Release Process

### Version Numbering

We use [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Steps

1. **Prepare Release**
   ```bash
   # Update version in package.json
   npm version patch  # or minor/major
   
   # Update CHANGELOG.md
   # Create release notes
   ```

2. **Create Release**
   ```bash
   # Create git tag
   git tag v1.4.0
   git push origin v1.4.0
   
   # Create GitHub release
   # Upload build artifacts
   ```

3. **Deploy**
   - Deploy to staging
   - Run smoke tests
   - Deploy to production
   - Monitor for issues

## Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors.

### Expected Behavior

- Be respectful and inclusive
- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other community members

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or inflammatory comments
- Public or private harassment
- Publishing private information
- Inappropriate sexual attention or advances
- Other unprofessional conduct

### Enforcement

Instances of unacceptable behavior may be reported to the project maintainers. All complaints will be reviewed and investigated.

## Getting Help

### Resources

1. **Documentation**
   - README.md
   - API documentation
   - Developer guide
   - User guide

2. **Community**
   - GitHub Discussions
   - Discord server
   - Stack Overflow (tag: property-management-software)

3. **Direct Support**
   - Create GitHub issue
   - Contact maintainers
   - Email: dev@propertymanagement.com

### Common Questions

1. **How do I get started?**
   - Follow the development setup guide
   - Look for "good first issue" labels
   - Join the community discussions

2. **How do I choose what to work on?**
   - Check the issue tracker
   - Look for "help wanted" labels
   - Ask maintainers for guidance

3. **How do I get my PR reviewed?**
   - Ensure all checks pass
   - Request review from maintainers
   - Address feedback promptly
   - Be patient with review process

## Recognition

### Contributors

We recognize all contributors in our:
- README.md contributors section
- Release notes
- Annual contributor report

### Types of Recognition

- **Code Contributors**: Code, tests, documentation
- **Issue Reporters**: Bug reports, feature requests
- **Community Helpers**: Answering questions, helping others
- **Maintainers**: Long-term project maintenance

Thank you for contributing to the Property Management Software project!