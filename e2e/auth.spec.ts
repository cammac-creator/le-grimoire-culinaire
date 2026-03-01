import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test('login page renders', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i)).toBeVisible()
  })

  test('register page renders', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByRole('heading', { name: /inscription/i })).toBeVisible()
  })

  test('login with invalid credentials shows error', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/email/i).fill('invalid@test.com')
    await page.getByLabel(/mot de passe/i).fill('wrongpassword')
    await page.getByRole('button', { name: /connexion/i }).click()
    await expect(page.getByText(/erreur|invalide/i)).toBeVisible({ timeout: 5000 })
  })

  test('unauthenticated user is redirected from protected routes', async ({ page }) => {
    await page.goto('/my-recipes')
    await expect(page).toHaveURL(/\/login/)
  })
})
