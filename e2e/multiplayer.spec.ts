import { test, expect } from '@playwright/test';

// Define the multiplayer test scenario
test('host and guest multiplayer flow', async ({ browser }) => {
  // Create two isolated browser contexts
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  // 1. Host registers an account
  await hostPage.goto('/signup');
  const uniqueEmail = `host${Date.now()}@example.com`;

  // Fill the sign up form
  await hostPage.getByLabel('Email').fill(uniqueEmail);
  await hostPage.getByLabel('Password').fill('password123');
  await hostPage.getByRole('button', { name: 'Sign Up', exact: true }).click();

  // Wait for success screen
  await expect(hostPage.getByText(/Check your email/i)).toBeVisible({
    timeout: 15000,
  });

  // Navigate to Create Game
  await hostPage.goto('/create');

  // Choose nickname and host
  await expect(hostPage.getByLabel('Your Nickname')).toBeVisible();
  await hostPage.getByLabel('Your Nickname').fill('TestHost');
  await hostPage.getByRole('button', { name: /Create Lobby/i }).click();

  // Host is now in Lobby
  await expect(hostPage).toHaveURL(/.*\/lobby\/.*/);

  // Extract Room Code
  const roomCodeLocator = hostPage
    .locator('h1')
    .filter({ hasText: /^[A-Z0-9]{6}$/ });
  await expect(roomCodeLocator).toBeVisible();
  const roomCodeText = await roomCodeLocator.innerText();
  const roomCode = roomCodeText.trim();
  console.log('Room Code created:', roomCode);

  // 2. Guest joins the game
  await guestPage.goto('/');
  await guestPage.getByRole('link', { name: /Join a Game/i }).click();

  await expect(guestPage).toHaveURL(/.*\/join/);
  await guestPage.getByLabel('Room Code').fill(roomCode);
  await guestPage.getByLabel('Your Nickname').fill('TestGuest');
  console.log('Guest joining with code:', roomCode);
  await guestPage.getByRole('button', { name: /Let's Play/i }).click();

  // Guest is now in the Lobby
  await expect(guestPage).toHaveURL(/.*\/lobby\/.*/);
  console.log('Guest joined lobby successfully');

  // 3. Host sees the guest and starts the game
  console.log('Waiting for host to see TestGuest...');
  await expect(hostPage.getByText(/TestGuest/i)).toBeVisible();
  console.log('Host saw TestGuest');

  const startGameBtn = hostPage.getByRole('button', { name: /Start Game/i });
  await expect(startGameBtn).toBeEnabled();
  await startGameBtn.click();

  // Both should navigate to Game Board
  await expect(hostPage).toHaveURL(/.*\/game\/.*/);
  await expect(guestPage).toHaveURL(/.*\/game\/.*/);

  // Host can end the game
  await hostPage.getByRole('button', { name: /End Game/i }).click();

  // Wait for confirm End Game modal and click confirm
  await hostPage
    .getByRole('button', { name: 'End Game', exact: true })
    .nth(1)
    .click();

  // Wait for Game Over screen to appear
  await expect(hostPage.getByText(/Game Over/i)).toBeVisible();
  await expect(guestPage.getByText(/Game Over/i)).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
