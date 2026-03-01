import { test, expect } from '@playwright/test'

test.describe('Favorites', () => {
  test('favorites page redirects to login if not authenticated', async ({ page }) => {
    await page.goto('/favorites')
    await expect(page).toHaveURL(/\/login/)
  })
})
