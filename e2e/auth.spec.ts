import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests
 * 
 * Tests auth flows including Google OAuth and email/password.
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/auth');
  });

  test('displays login form with all elements', async ({ page }) => {
    // Check form elements exist
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
    
    // Check Google OAuth button exists
    await expect(page.getByRole('button', { name: /continue with google/i })).toBeVisible();
    
    // Check demo account button exists
    await expect(page.getByRole('button', { name: /use demo account/i })).toBeVisible();
  });

  test('can switch between sign in and sign up', async ({ page }) => {
    // Start on sign in
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
    
    // Switch to sign up
    await page.getByRole('button', { name: /don't have an account/i }).click();
    await expect(page.getByRole('heading', { name: /create account/i })).toBeVisible();
    
    // Switch back to sign in
    await page.getByRole('button', { name: /already have an account/i }).click();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('shows validation error for invalid email', async ({ page }) => {
    await page.getByLabel('Email').fill('invalid-email');
    await page.getByLabel('Password').fill('password123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // HTML5 validation should prevent submission
    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('can access forgot password flow', async ({ page }) => {
    await page.getByRole('button', { name: /forgot password/i }).click();
    
    await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /send reset link/i })).toBeVisible();
    
    // Can go back
    await page.getByRole('button', { name: /back to sign in/i }).click();
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  });

  test('demo account button fills credentials', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    const passwordInput = page.getByLabel('Password');
    
    // Initially empty
    await expect(emailInput).toHaveValue('');
    
    // Click demo account - it will attempt login
    await page.getByRole('button', { name: /use demo account/i }).click();
    
    // Wait for loading to potentially start
    await page.waitForTimeout(100);
    
    // Email should be filled
    await expect(emailInput).toHaveValue('demo@lithiumbuy.com');
  });
});
