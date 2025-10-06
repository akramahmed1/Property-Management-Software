import { test, expect } from '@playwright/test';

test.describe('Property Management E2E Tests', () => {
  let authToken: string;
  let propertyId: string;
  let customerId: string;
  let bookingId: string;

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'test@example.com',
        password: 'testpassword123'
      }
    });

    const loginData = await loginResponse.json();
    authToken = loginData.data.token;
  });

  test.describe('Authentication Flow', () => {
    test('should register and login successfully', async ({ page }) => {
      await page.goto('/register');

      // Fill registration form
      await page.fill('[data-testid=name]', 'E2E Test User');
      await page.fill('[data-testid=email]', 'e2etest@example.com');
      await page.fill('[data-testid=password]', 'password123');
      await page.fill('[data-testid=phone]', '+1234567890');
      await page.selectOption('[data-testid=role]', 'AGENT');

      // Submit form
      await page.click('[data-testid=register-button]');

      // Should redirect to login or show success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Login with new credentials
      await page.goto('/login');
      await page.fill('[data-testid=email]', 'e2etest@example.com');
      await page.fill('[data-testid=password]', 'password123');
      await page.click('[data-testid=login-button]');

      // Should redirect to dashboard
      await expect(page.locator('[data-testid=dashboard]')).toBeVisible();
    });

    test('should show error for invalid login', async ({ page }) => {
      await page.goto('/login');
      await page.fill('[data-testid=email]', 'invalid@example.com');
      await page.fill('[data-testid=password]', 'wrongpassword');
      await page.click('[data-testid=login-button]');

      await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    });
  });

  test.describe('Property Management', () => {
    test('should create a new property', async ({ page }) => {
      await page.goto('/properties/create');
      
      // Fill property form
      await page.fill('[data-testid=property-name]', 'E2E Test Property');
      await page.selectOption('[data-testid=property-type]', 'APARTMENT');
      await page.fill('[data-testid=location]', 'E2E Test Location');
      await page.fill('[data-testid=address]', '123 E2E Test Street');
      await page.fill('[data-testid=city]', 'E2E Test City');
      await page.fill('[data-testid=state]', 'E2E Test State');
      await page.fill('[data-testid=country]', 'E2E Test Country');
      await page.fill('[data-testid=price]', '5000000');
      await page.fill('[data-testid=area]', '1200');
      await page.fill('[data-testid=bedrooms]', '3');
      await page.fill('[data-testid=bathrooms]', '2');
      await page.fill('[data-testid=description]', 'E2E Test Property Description');

      // Submit form
      await page.click('[data-testid=create-property-button]');

      // Should show success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Should redirect to properties list
      await expect(page.locator('[data-testid=properties-list]')).toBeVisible();
    });

    test('should view property details', async ({ page }) => {
      await page.goto('/properties');
      
      // Click on first property
      await page.click('[data-testid=property-card]:first-child');
      
      // Should show property details
      await expect(page.locator('[data-testid=property-details]')).toBeVisible();
      await expect(page.locator('[data-testid=property-name]')).toBeVisible();
      await expect(page.locator('[data-testid=property-price]')).toBeVisible();
    });

    test('should search and filter properties', async ({ page }) => {
      await page.goto('/properties');
      
      // Search for properties
      await page.fill('[data-testid=search-input]', 'E2E Test');
      await page.click('[data-testid=search-button]');
      
      // Should show filtered results
      await expect(page.locator('[data-testid=property-card]')).toHaveCount(1);
      
      // Apply filters
      await page.selectOption('[data-testid=type-filter]', 'APARTMENT');
      await page.fill('[data-testid=min-price]', '1000000');
      await page.fill('[data-testid=max-price]', '10000000');
      await page.click('[data-testid=apply-filters]');
      
      // Should show filtered results
      await expect(page.locator('[data-testid=property-card]')).toBeVisible();
    });
  });

  test.describe('Customer Management', () => {
    test('should create a new customer', async ({ page }) => {
      await page.goto('/customers/create');
      
      // Fill customer form
      await page.fill('[data-testid=customer-name]', 'E2E Test Customer');
      await page.fill('[data-testid=customer-email]', 'e2ecustomer@example.com');
      await page.fill('[data-testid=customer-phone]', '+1234567890');
      await page.fill('[data-testid=customer-address]', '123 E2E Customer Street');
      await page.fill('[data-testid=customer-city]', 'E2E Customer City');
      await page.fill('[data-testid=customer-state]', 'E2E Customer State');
      await page.fill('[data-testid=customer-country]', 'E2E Customer Country');
      await page.fill('[data-testid=customer-occupation]', 'Software Engineer');
      await page.fill('[data-testid=customer-income]', '1500000');

      // Submit form
      await page.click('[data-testid=create-customer-button]');

      // Should show success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Should redirect to customers list
      await expect(page.locator('[data-testid=customers-list]')).toBeVisible();
    });

    test('should view customer details', async ({ page }) => {
      await page.goto('/customers');
      
      // Click on first customer
      await page.click('[data-testid=customer-card]:first-child');
      
      // Should show customer details
      await expect(page.locator('[data-testid=customer-details]')).toBeVisible();
      await expect(page.locator('[data-testid=customer-name]')).toBeVisible();
      await expect(page.locator('[data-testid=customer-email]')).toBeVisible();
    });
  });

  test.describe('Lead Management', () => {
    test('should create a new lead', async ({ page }) => {
      await page.goto('/leads/create');
      
      // Fill lead form
      await page.fill('[data-testid=lead-name]', 'E2E Test Lead');
      await page.fill('[data-testid=lead-email]', 'e2elead@example.com');
      await page.fill('[data-testid=lead-phone]', '+1234567890');
      await page.selectOption('[data-testid=lead-source]', 'WEBSITE');
      await page.fill('[data-testid=lead-interest]', '3BHK Apartment');
      await page.fill('[data-testid=lead-budget]', '5000000');
      await page.fill('[data-testid=lead-notes]', 'E2E Test Lead Notes');

      // Submit form
      await page.click('[data-testid=create-lead-button]');

      // Should show success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Should redirect to leads list
      await expect(page.locator('[data-testid=leads-list]')).toBeVisible();
    });

    test('should update lead status', async ({ page }) => {
      await page.goto('/leads');
      
      // Click on first lead
      await page.click('[data-testid=lead-card]:first-child');
      
      // Update lead status
      await page.selectOption('[data-testid=lead-status]', 'QUALIFIED');
      await page.click('[data-testid=update-lead-button]');
      
      // Should show success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    });
  });

  test.describe('Booking Management', () => {
    test('should create a new booking', async ({ page }) => {
      await page.goto('/bookings/create');
      
      // Select property
      await page.click('[data-testid=property-selector]');
      await page.click('[data-testid=property-option]:first-child');
      
      // Select customer
      await page.click('[data-testid=customer-selector]');
      await page.click('[data-testid=customer-option]:first-child');
      
      // Fill booking details
      await page.fill('[data-testid=booking-amount]', '5000000');
      await page.fill('[data-testid=advance-amount]', '500000');
      await page.selectOption('[data-testid=payment-method]', 'UPI');
      await page.fill('[data-testid=booking-notes]', 'E2E Test Booking');

      // Submit form
      await page.click('[data-testid=create-booking-button]');

      // Should show success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();

      // Should redirect to bookings list
      await expect(page.locator('[data-testid=bookings-list]')).toBeVisible();
    });

    test('should confirm booking', async ({ page }) => {
      await page.goto('/bookings');
      
      // Click on first booking
      await page.click('[data-testid=booking-card]:first-child');
      
      // Confirm booking
      await page.click('[data-testid=confirm-booking-button]');
      
      // Should show success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    });
  });

  test.describe('Payment Processing', () => {
    test('should process payment', async ({ page }) => {
      await page.goto('/payments');
      
      // Click on first payment
      await page.click('[data-testid=payment-card]:first-child');
      
      // Process payment
      await page.click('[data-testid=process-payment-button]');
      
      // Should show payment form
      await expect(page.locator('[data-testid=payment-form]')).toBeVisible();
      
      // Fill payment details
      await page.selectOption('[data-testid=payment-method]', 'UPI');
      await page.fill('[data-testid=payment-amount]', '500000');
      
      // Submit payment
      await page.click('[data-testid=submit-payment-button]');
      
      // Should show success message
      await expect(page.locator('[data-testid=success-message]')).toBeVisible();
    });
  });

  test.describe('Reports and Analytics', () => {
    test('should view dashboard analytics', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should show dashboard metrics
      await expect(page.locator('[data-testid=total-properties]')).toBeVisible();
      await expect(page.locator('[data-testid=total-bookings]')).toBeVisible();
      await expect(page.locator('[data-testid=total-revenue]')).toBeVisible();
      await expect(page.locator('[data-testid=conversion-rate]')).toBeVisible();
    });

    test('should generate sales report', async ({ page }) => {
      await page.goto('/reports/sales');
      
      // Select date range
      await page.fill('[data-testid=start-date]', '2025-01-01');
      await page.fill('[data-testid=end-date]', '2025-12-31');
      
      // Generate report
      await page.click('[data-testid=generate-report-button]');
      
      // Should show report
      await expect(page.locator('[data-testid=sales-report]')).toBeVisible();
      await expect(page.locator('[data-testid=report-chart]')).toBeVisible();
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile devices', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Should show mobile navigation
      await expect(page.locator('[data-testid=mobile-nav]')).toBeVisible();
      
      // Should be able to navigate
      await page.click('[data-testid=mobile-nav-properties]');
      await expect(page.locator('[data-testid=properties-list]')).toBeVisible();
    });
  });

  test.describe('Offline Functionality', () => {
    test('should work offline', async ({ page, context }) => {
      await page.goto('/');
      
      // Go offline
      await context.setOffline(true);
      
      // Should show offline indicator
      await expect(page.locator('[data-testid=offline-indicator]')).toBeVisible();
      
      // Should still be able to view cached data
      await page.click('[data-testid=mobile-nav-properties]');
      await expect(page.locator('[data-testid=properties-list]')).toBeVisible();
      
      // Go back online
      await context.setOffline(false);
      
      // Should hide offline indicator
      await expect(page.locator('[data-testid=offline-indicator]')).not.toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      await page.goto('/properties');
      
      // Simulate network error
      await page.route('**/api/properties', route => route.abort());
      
      // Should show error message
      await expect(page.locator('[data-testid=error-message]')).toBeVisible();
    });

    test('should handle validation errors', async ({ page }) => {
      await page.goto('/properties/create');
      
      // Submit empty form
      await page.click('[data-testid=create-property-button]');
      
      // Should show validation errors
      await expect(page.locator('[data-testid=validation-error]')).toBeVisible();
    });
  });

  test.afterAll(async ({ request }) => {
    // Clean up test data
    if (authToken) {
      await request.post('/api/auth/logout', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
    }
  });
});
