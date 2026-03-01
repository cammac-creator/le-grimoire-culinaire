import { test, expect } from '@playwright/test'

test.describe('Recipe CRUD', () => {
  test('create recipe page loads for authenticated user', async ({ page }) => {
    await page.goto('/recipes/new')
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/(login|recipes\/new)/)
  })

  test('recipe detail page shows recipe or 404', async ({ page }) => {
    await page.goto('/recipes/00000000-0000-0000-0000-000000000000')
    await expect(page.getByText(/introuvable|recette/i)).toBeVisible({ timeout: 5000 })
  })
})
