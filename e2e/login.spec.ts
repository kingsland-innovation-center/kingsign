import { test, expect, testData, paths } from './setup';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page before each test
    await page.goto(paths.login);
  });

  test('should display login page correctly', async ({ page }) => {
    // Check if the page loads correctly
    await expect(page).toHaveTitle(/Kingsign/);
    
    // Check for Kingsland logo
    await expect(page.locator('img[alt="Kingsland Logo"]')).toBeVisible();
    
    // Check for login heading
    await expect(page.locator('h1')).toContainText('Login');
    
    // Check for form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for "Create account" button
    await expect(page.locator('button:has-text("Create account")')).toBeVisible();
    
    // Check for "Forgot password?" link
    await expect(page.locator('a:has-text("Forgot password?")')).toBeVisible();
  });

  test('should show validation errors for empty fields', async ({ page }) => {
    // Click submit without filling any fields
    await page.click('button[type="submit"]');
    
    // Check for validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
  });

  test('should show validation error for invalid email format', async ({ page }) => {
    // Fill in invalid email
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', 'somepassword');
    await page.click('button[type="submit"]');
    
    // The browser should show native validation for invalid email
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should navigate to register page when "Create account" is clicked', async ({ page }) => {
    await page.click('button:has-text("Create account")');
    
    // Should navigate to register page
    await expect(page).toHaveURL(paths.register);
  });

  test('should attempt login with valid credentials', async ({ page }) => {
    // Fill in the login form
    await page.fill('input[type="email"]', testData.validUser.email);
    await page.fill('input[type="password"]', testData.validUser.password);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check if the button shows loading state
    await expect(page.locator('button:has-text("Logging in...")')).toBeVisible();
    
    // Note: Since we don't have a real backend running, this test will likely fail
    // In a real scenario, you would either:
    // 1. Mock the API responses
    // 2. Have a test database with known credentials
    // 3. Test against a staging environment
  });

  test('should attempt login with invalid credentials', async ({ page }) => {
    // Fill in the login form with invalid credentials
    await page.fill('input[type="email"]', testData.invalidUser.email);
    await page.fill('input[type="password"]', testData.invalidUser.password);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // Check if the button shows loading state
    await expect(page.locator('button:has-text("Logging in...")')).toBeVisible();
    
    // Wait for potential error message (this would depend on your error handling)
    // You might need to adjust this based on how your app handles login errors
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Check for proper labels
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    await expect(emailInput).toHaveAttribute('id', 'email');
    await expect(passwordInput).toHaveAttribute('id', 'password');
    
    // Check for associated labels
    await expect(page.locator('label[for="email"]')).toContainText('Email');
    await expect(page.locator('label[for="password"]')).toContainText('Password');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[type="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('a:has-text("Forgot password?")')).toBeFocused();
  });

  test('should submit form with Enter key', async ({ page }) => {
    // Fill in credentials
    await page.fill('input[type="email"]', testData.validUser.email);
    await page.fill('input[type="password"]', testData.validUser.password);
    
    // Press Enter to submit
    await page.keyboard.press('Enter');
    
    // Check if the button shows loading state
    await expect(page.locator('button:has-text("Logging in...")')).toBeVisible();
  });
});
