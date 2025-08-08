# Test Environment Setup

This document explains how to set up and use the test environment for the Ordinary Gentlemen FPL application.

## Overview

The test environment provides:
- Isolated test data
- Mock API responses
- Test user accounts
- Visual test controls
- Easy data reset functionality

## Quick Start

### 1. Start the Test Environment

```bash
# Start the development server in test mode
npm run dev:test
```

This will:
- Set `NODE_ENV=test`
- Enable `NEXT_PUBLIC_TEST_MODE=true`
- Initialize test data automatically
- Show test mode indicators in the UI

### 2. Access Test Controls

When running in test mode, you'll see:
- **Yellow "TEST MODE" indicator** in the top-left corner
- **Blue "Show Test Controls" button** in the top-right corner

Click the "Show Test Controls" button to access:
- Initialize/Clear/Reset test data
- View test user information
- See mock data details

## Test Data

### Test User
- **Email**: test@example.com
- **Name**: Test User
- **UID**: test-user-123

### Mock Data
- **Gameweek**: 1
- **Teams**: Arsenal, Chelsea, Liverpool, Manchester City, Manchester United
- **Players**: Salah, Haaland, Kane, De Bruyne, Son

### Sample Predictions
- Arsenal 2-1 Chelsea (Saka)
- Liverpool 1-2 Manchester City (Haaland)

## Available Scripts

```bash
# Development in test mode
npm run dev:test

# Build for test environment
npm run build:test

# Start test production server
npm run start:test

# Initialize test database
npm run test:init

# Clear test data
npm run test:clear

# Reset test data (clear + init)
npm run test:setup
```

## Environment Variables

The test environment uses these environment variables:

```env
NODE_ENV=test
NEXT_PUBLIC_TEST_MODE=true
NEXT_PUBLIC_MOCK_API=true
NEXT_PUBLIC_TEST_DB_NAME=FPLTestDatabase
NEXT_PUBLIC_TEST_USER_EMAIL=test@example.com
NEXT_PUBLIC_TEST_USER_PASSWORD=testpassword123
```

## Testing Workflows

### 1. Authentication Testing
- Use the test user credentials
- Test login/logout flows
- Verify whitelist functionality

### 2. Dashboard Testing
- Test all tab components
- Verify data loading
- Test user interactions

### 3. Prediction Testing
- Submit test predictions
- View prediction history
- Test scoring calculations

### 4. API Testing
- Test FPL API integration
- Verify mock responses
- Test error handling

## File Structure

```
├── test.config.js           # Test configuration
├── lib/test-utils.ts        # Test utilities
├── components/TestEnvironment.tsx  # Test UI controls
├── TEST_SETUP.md           # This documentation
└── .env.test.local         # Test environment variables (gitignored)
```

## Troubleshooting

### Test Data Not Loading
1. Check browser console for errors
2. Verify test mode is enabled
3. Try resetting test data via controls
4. Check IndexedDB in browser dev tools

### Test Controls Not Showing
1. Ensure `NEXT_PUBLIC_TEST_MODE=true`
2. Check for JavaScript errors
3. Verify TestEnvironment component is loaded

### Mock API Not Working
1. Check `NEXT_PUBLIC_MOCK_API=true`
2. Verify API endpoint configuration
3. Check network tab for requests

## Best Practices

1. **Always use test mode** for development and testing
2. **Reset test data** before starting new test sessions
3. **Check test indicators** to ensure you're in test mode
4. **Use test user** for consistent testing
5. **Monitor console** for test-related logs

## Integration with CI/CD

For automated testing, you can:

```bash
# Set up test environment
npm run test:setup

# Run tests
npm run test

# Clean up
npm run test:clear
```

## Support

If you encounter issues with the test environment:
1. Check this documentation
2. Review browser console logs
3. Verify environment variables
4. Reset test data and try again 