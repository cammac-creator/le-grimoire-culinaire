import { test, expect } from '@playwright/test'

test.describe('Search', () => {
  test('search page renders with filters', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByRole('heading', { name: /rechercher/i })).toBeVisible()
    await expect(page.getByLabel(/rechercher une recette/i)).toBeVisible()
  })

  test('filters render and are clickable', async ({ page }) => {
    await page.goto('/search')
    await expect(page.getByText('Testées')).toBeVisible()
    await page.getByText('Testées').click()
    // The badge should become active
    await expect(page.getByText('Réinitialiser')).toBeVisible()
  })

  test('search with text shows results or empty state', async ({ page }) => {
    await page.goto('/search')
    await page.getByLabel(/rechercher une recette/i).fill('poulet')
    await page.waitForTimeout(500) // debounce
    // Either results or empty state
    const results = page.locator('[class*="grid"]')
    const empty = page.getByText(/aucun résultat|resultat/i)
    await expect(results.or(empty)).toBeVisible({ timeout: 5000 })
  })
})
