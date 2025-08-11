# Development Guide

## Environment Setup

### Development with Real Authentication
```bash
npm run dev
```
- Requires Firebase configuration
- Uses real FPL API calls
- Requires whitelisted users

### Staging Build
```bash
npm run build:staging
```
- Builds the application for staging environment
- Uses staging configuration

### Production Build
```bash
npm run build
```
- Builds the application for production
- Uses real authentication and APIs

## Development Workflow

1. **Start Development**: `npm run dev`
2. **Make Changes**: Edit your code
3. **Test Changes**: Verify in browser
4. **Staging Build**: `npm run build:staging` for staging environment
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

## Environment Variables

- `NEXT_PUBLIC_MOCK_API=true` - Uses mock API responses (for development)
- `NEXT_PUBLIC_SKIP_WHITELIST=true` - Skips whitelist enforcement (for development only)

## File Structure

- `app/page.tsx` - Main application page
- `components/` - React components
- `contexts/AuthContext.tsx` - Authentication logic
- `lib/` - Utility functions and API calls
