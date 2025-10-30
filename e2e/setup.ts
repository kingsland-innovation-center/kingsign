import { test as base } from '@playwright/test';

// Test data for consistent testing
export const testData = {
  validUser: {
    email: 'test@example.com',
    password: 'testpassword123',
  },
  newUser: {
    name: 'Test User',
    email: 'newuser@example.com',
    company: 'Test Company',
    password: 'newpassword123',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
};

// Base URLs and paths
export const paths = {
  login: '/auth/login',
  register: '/auth/register',
  dashboard: '/dashboard',
  signupSuccess: '/auth/signup-sucessful',
};

// Extend base test with custom fixtures if needed
export const test = base.extend({
  // Add custom fixtures here if needed in the future
});

export { expect } from '@playwright/test';
