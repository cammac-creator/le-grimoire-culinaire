import { test, expect } from '@playwright/test'

test.describe('Shopping List', () => {
  test('shopping list page redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/shopping-list')
    await expect(page).toHaveURL(/\/login/)
  })
})
