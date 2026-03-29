import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test('deve carregar a página inicial corretamente', async ({ page }) => {
    // Navega para a página inicial
    await page.goto('/');

    // Verifica se a página carregou com o título sugerindo wamini
    // Baseado na estrutura da página "O que você comprará hoje?"
    await expect(page).toHaveTitle(/Wamini/i);
    
    // Verifica a presença de um cabeçalho ou texto importante (ex. Logo Wamini)
    const logo = page.locator('header').getByText(/Wamini/i, { exact: false }).first();
    await expect(logo).toBeVisible();
  });
});
