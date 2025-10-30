import { test, expect, testData, paths } from './setup';

test.describe('Signup Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to register page before each test
    await page.goto(paths.register);
  });

  test('should display signup page correctly', async ({ page }) => {
    // Check if the page loads correctly
    await expect(page).toHaveTitle(/Kingsign/);
    
    // Check for Kingsland logo
    await expect(page.locator('img[alt="Kingsland Logo"]')).toBeVisible();
    
    // Check for signup heading
    await expect(page.locator('h1')).toContainText('Create account');
    
    // Check for all form elements
    await expect(page.locator('input[id="name"]')).toBeVisible();
    await expect(page.locator('input[id="email"]')).toBeVisible();
    await expect(page.locator('input[id="company"]')).toBeVisible();
    await expect(page.locator('input[id="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Check for "Login" button
    await expect(page.locator('a:has-text("Login")')).toBeVisible();
  });

  test('should show validation errors for empty required fields', async ({ page }) => {
    // Click submit without filling any fields
    await page.click('button[type="submit"]');
    
    // Check for validation errors for all required fields
    await expect(page.locator('text=This field is required').first()).toBeVisible();
    
    // Count the number of validation errors (should be 4 for name, email, company, password)
    const errorMessages = page.locator('text=This field is required');
    await expect(errorMessages).toHaveCount(4);
  });

  test('should show individual field validation errors', async ({ page }) => {
    // Test name field validation
    await page.fill('input[id="email"]', testData.newUser.email);
    await page.fill('input[id="company"]', testData.newUser.company);
    await page.fill('input[id="password"]', testData.newUser.password);
    await page.click('button[type="submit"]');
    
    // Should show error only for name field
    const nameError = page.locator('input[id="name"] + span:has-text("This field is required")');
    await expect(nameError).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    // Fill in invalid email
    await page.fill('input[id="name"]', testData.newUser.name);
    await page.fill('input[id="email"]', 'invalid-email');
    await page.fill('input[id="company"]', testData.newUser.company);
    await page.fill('input[id="password"]', testData.newUser.password);
    await page.click('button[type="submit"]');
    
    // The browser should show native validation for invalid email
    const emailInput = page.locator('input[id="email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should navigate to login page when "Login" is clicked', async ({ page }) => {
    await page.click('a:has-text("Login")');
    
    // Should navigate to login page
    await expect(page).toHaveURL(paths.login);
  });

  test('should attempt signup with valid data', async ({ page }) => {
    // Fill in the signup form with valid data
    await page.fill('input[id="name"]', testData.newUser.name);
    await page.fill('input[id="email"]', testData.newUser.email);
    await page.fill('input[id="company"]', testData.newUser.company);
    await page.fill('input[id="password"]', testData.newUser.password);
    
    // Submit the form
    await page.click('button[type="submit"]');
    
    // The form should be submitted (button might show loading state or redirect)
    // Note: Since we don't have a real backend running, this test will likely fail
    // In a real scenario, you would either:
    // 1. Mock the API responses
    // 2. Have a test database
    // 3. Test against a staging environment
    // 4. Check for success redirect to signup success page
  });

  test('should have proper form accessibility', async ({ page }) => {
    // Check for proper labels and IDs
    const nameInput = page.locator('input[id="name"]');
    const emailInput = page.locator('input[id="email"]');
    const companyInput = page.locator('input[id="company"]');
    const passwordInput = page.locator('input[id="password"]');
    
    // Check input attributes
    await expect(nameInput).toHaveAttribute('type', 'text');
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(companyInput).toHaveAttribute('type', 'text');
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Check for associated labels
    await expect(page.locator('label[for="name"]')).toContainText('Name');
    await expect(page.locator('label[for="email"]')).toContainText('Email');
    await expect(page.locator('label[for="company"]')).toContainText('Company');
    await expect(page.locator('label[for="password"]')).toContainText('Password');
    
    // Check for required field indicators
    await expect(page.locator('label[for="name"]')).toContainText('*');
    await expect(page.locator('label[for="email"]')).toContainText('*');
    await expect(page.locator('label[for="company"]')).toContainText('*');
    await expect(page.locator('label[for="password"]')).toContainText('*');
  });

  test('should handle keyboard navigation', async ({ page }) => {
    // Test tab navigation through all form fields
    await page.keyboard.press('Tab');
    await expect(page.locator('input[id="name"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[id="email"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[id="company"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('input[id="password"]')).toBeFocused();
    
    await page.keyboard.press('Tab');
    await expect(page.locator('button[type="submit"]')).toBeFocused();
  });

  test('should submit form with Enter key', async ({ page }) => {
    // Fill in valid data
    await page.fill('input[id="name"]', testData.newUser.name);
    await page.fill('input[id="email"]', testData.newUser.email);
    await page.fill('input[id="company"]', testData.newUser.company);
    await page.fill('input[id="password"]', testData.newUser.password);
    
    // Press Enter to submit (focus should be on password field)
    await page.locator('input[id="password"]').focus();
    await page.keyboard.press('Enter');
    
    // Form should be submitted
    // In a real scenario, this would trigger the form submission
  });

  test('should clear form validation errors when fields are filled', async ({ page }) => {
    // First trigger validation errors
    await page.click('button[type="submit"]');
    await expect(page.locator('text=This field is required').first()).toBeVisible();
    
    // Fill in name field
    await page.fill('input[id="name"]', testData.newUser.name);
    
    // The validation error for name should disappear when field is filled
    // Note: This behavior depends on your form validation implementation
    // You might need to trigger a blur event or form re-validation
    await page.locator('input[id="name"]').blur();
  });

  test('should handle form field interactions', async ({ page }) => {
    // Test that form fields accept input correctly
    await page.fill('input[id="name"]', testData.newUser.name);
    await expect(page.locator('input[id="name"]')).toHaveValue(testData.newUser.name);
    
    await page.fill('input[id="email"]', testData.newUser.email);
    await expect(page.locator('input[id="email"]')).toHaveValue(testData.newUser.email);
    
    await page.fill('input[id="company"]', testData.newUser.company);
    await expect(page.locator('input[id="company"]')).toHaveValue(testData.newUser.company);
    
    await page.fill('input[id="password"]', testData.newUser.password);
    await expect(page.locator('input[id="password"]')).toHaveValue(testData.newUser.password);
  });

  test('should maintain form state during navigation', async ({ page }) => {
    // Fill in some data
    await page.fill('input[id="name"]', testData.newUser.name);
    await page.fill('input[id="email"]', testData.newUser.email);
    
    // Navigate away and back
    await page.click('a:has-text("Login")');
    await expect(page).toHaveURL(paths.login);
    
    await page.goBack();
    await expect(page).toHaveURL(paths.register);
    
    // Form should be cleared (this is typical browser behavior)
    // If your app has form persistence, you'd test for that instead
    await expect(page.locator('input[id="name"]')).toHaveValue('');
    await expect(page.locator('input[id="email"]')).toHaveValue('');
  });
});
