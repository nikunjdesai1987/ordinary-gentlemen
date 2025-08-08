# Development Guide

## Environment Setup

### Development with Test Mode (Recommended for Development)
```bash
npm run dev:test
```
- Uses mock data and test authentication
- No need for Firebase setup
- Auto-authenticates with test users
- Perfect for development and testing

### Development with Real Authentication
```bash
npm run dev
```
- Requires Firebase configuration
- Uses real FPL API calls
- Requires whitelisted users

### Test Build
```bash
npm run build:test
```
- Builds the application with test mode enabled
- Used for testing the production build with mock data

### Production Build
```bash
npm run build
```
- Builds the application for production
- Uses real authentication and APIs

## Test User Available

When using test mode, a default test user is automatically available:

1. **Default Test User**
   - Email: test@example.com
   - FPL ID: 123456
   - Access: Standard user features (no admin privileges)

## Development Workflow

1. **Start Development**: `npm run dev:test`
2. **Make Changes**: Edit your code
3. **Test Changes**: Verify in browser
4. **Test Build**: `npm run build:test` to test production build
5. **Production Build**: `npm run build` when ready for deployment

## Common Issues and Solutions

### Port Already in Use
```bash
pkill -f "next"
```

### Clear Cache
```bash
rm -rf .next
```

### Reset Test Data
```bash
npm run test:setup
```

## Environment Variables

- `NEXT_PUBLIC_TEST_MODE=true` - Enables test mode
- `NEXT_PUBLIC_MOCK_API=true` - Uses mock API responses
- `NODE_ENV=test` - Sets test environment

## File Structure

- `app/page.tsx` - Main application page
- `components/` - React components
- `contexts/AuthContext.tsx` - Authentication logic
- `lib/` - Utility functions and API calls
- `test.config.js` - Test configuration
- `lib/test-utils.ts` - Test utilities
