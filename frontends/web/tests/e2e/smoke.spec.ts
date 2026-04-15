import { test, expect } from '@playwright/test';

test('Smoke test with @airscan/backend-mock', async ({ page }) => {
  // Navigate to the app
  await page.goto('/');

  await page.waitForTimeout(500);
  
  // Wait for page to load
  await expect(page).toHaveTitle('AirScan 🛜');

  // Open transport settings modal
  const settingsButton = page.locator('button[aria-label="Transport settings"]');
  await settingsButton.click();

  // Wait for modal to appear
  await expect(page.getByRole('heading', { name: 'Transport Settings' })).toBeVisible();

  // Select WebSocket transport type (should already be selected by default)
  const webSocketButton = page.locator('button:has-text("WebSocket")');
  webSocketButton.click();

  // Ensure URL is set to ws://localhost:8080 (default)
  const urlInput = page.locator('input[type="url"]');
  await expect(urlInput).toHaveValue('ws://localhost:8080');

  // Save settings
  const saveButton = page.locator('button:has-text("Save Settings")');
  await saveButton.click();

  // Wait for modal to close
  await expect(page.locator('text=Transport Settings')).not.toBeVisible();

  // Now the connect button should show "Not Connected" (config saved)
  // Locate the connect button (first button inside the flex container)
  const connectButton = page.locator('div.flex.items-stretch > button').first();
  await expect(connectButton).toContainText('Connect');
  await connectButton.click();

  // Wait for connection state to become "Connected"
  // The button text changes to "Connected"
  await expect(page.locator('button:has-text("Connected")')).toBeVisible({ timeout: 10000 });

  // Verify that the device is connected (state is "connected")
  await expect(page.locator('button:has-text("Connected")')).toBeVisible();

  // Click the "Start" button in the scan feature to start scanning
  const startScanButton = page.locator('button:has-text("Start")');
  await startScanButton.click();

  // Wait for at least one access point to appear
  await expect(page.locator('h2:has-text("Access Points (")')).not.toHaveText('Access Points (0)');
  await expect(page.locator('h2:has-text("Access Points")')).toContainText(/Access Points \((\d+)\)/, { timeout: 15000 });

  // Wait for at least one client to appear
  await expect(page.locator('h2:has-text("Clients (")')).not.toHaveText('Clients (0)');
  await expect(page.locator('h2:has-text("Clients")')).toContainText(/Clients \((\d+)\)/, { timeout: 15000 });
});