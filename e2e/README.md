# End-to-End Tests

This directory contains Playwright end-to-end tests for the Kingsign application.

## Setup

The tests are already configured and ready to run. Playwright and its dependencies have been installed.

## Running Tests

### Basic Commands

```bash
# Run all e2e tests
pnpm test:e2e

# Run tests with UI mode (interactive)
pnpm test:e2e:ui

# Run tests in headed mode (see browser)
pnpm test:e2e:headed

# Run tests in debug mode
pnpm test:e2e:debug

# Show test report
pnpm test:e2e:report
```

### Running Specific Tests

```bash
# Run only login tests
pnpm test:e2e login.spec.ts

# Run only signup tests
pnpm test:e2e signup.spec.ts

# Run tests in specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

## Test Structure

### Files

- `setup.ts` - Test configuration and shared utilities
- `login.spec.ts` - Login flow tests
- `signup.spec.ts` - Signup/registration flow tests

### Test Data

Test data is defined in `setup.ts` and includes:
- Valid user credentials for login tests
- New user data for signup tests
- Invalid credentials for error testing

## Test Coverage

### Login Tests (`login.spec.ts`)
- ✅ Page display and layout
- ✅ Form validation (empty fields, invalid email)
- ✅ Navigation to registration page
- ✅ Login attempt with valid/invalid credentials
- ✅ Accessibility (labels, keyboard navigation)
- ✅ Form submission with Enter key

### Signup Tests (`signup.spec.ts`)
- ✅ Page display and layout
- ✅ Form validation (required fields, email format)
- ✅ Navigation to login page
- ✅ Registration attempt with valid data
- ✅ Accessibility (labels, keyboard navigation)
- ✅ Form interactions and state management

## Important Notes

### Backend Dependencies
These tests are designed to work with the frontend UI, but some tests that involve actual authentication will require:
1. A running backend API server
2. A test database with known credentials
3. Or mocked API responses

### Test Environment
- Tests run against `http://localhost:3000` by default
- The dev server is automatically started before tests run
- Tests use the same configuration as your development environment

### Customization
To modify test behavior:
1. Update `playwright.config.ts` for global settings
2. Update `setup.ts` for test data and utilities
3. Add new test files following the `*.spec.ts` naming convention

## Debugging Tests

### Visual Debugging
```bash
# Run with UI mode to see tests execute in real-time
pnpm test:e2e:ui

# Run in headed mode to see the browser
pnpm test:e2e:headed
```

### Debug Mode
```bash
# Step through tests line by line
pnpm test:e2e:debug
```

### Screenshots and Videos
- Screenshots are automatically taken on test failures
- Traces are recorded for failed tests
- Reports include visual evidence of test runs

## Best Practices

1. **Keep tests independent** - Each test should be able to run in isolation
2. **Use descriptive test names** - Test names should clearly describe what is being tested
3. **Test user journeys** - Focus on real user workflows rather than implementation details
4. **Handle async operations** - Use proper waits for dynamic content
5. **Clean up test data** - Ensure tests don't leave behind test data that affects other tests

## Extending Tests

To add new tests:
1. Create new `*.spec.ts` files in the `e2e` directory
2. Import from `./setup` for consistent configuration
3. Follow the existing patterns for test structure
4. Update this README with new test coverage information
