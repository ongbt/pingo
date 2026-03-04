import { test, expect } from '@playwright/test';

// Define the multiplayer test scenario
test.skip('host and guest multiplayer flow', async ({ browser }) => {
  // Create two isolated browser contexts
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();

  const hostPage = await hostContext.newPage();
  const guestPage = await guestContext.newPage();

  // 1. Host registers an account: Since we want to use anonymous auth,
  // we can use a clever trick: submitting a dummy code on the Join page
  // signs the user in anonymously before checking the code.
  await hostPage.goto('/join');
  await hostPage.getByLabel('Room Code').fill('000000');
  await hostPage.getByLabel('Your Nickname').fill('TestHost');
  await hostPage.getByRole('button', { name: /Let's Play/i }).click();

  // Wait for the "Game not found" error to confirm sign-in
  await expect(hostPage.getByText(/Game not found/i)).toBeVisible();

  // The host is authenticated now (anonymously). Navigate to Create Game
  await hostPage.goto('/create');

  // The host should bypass the "You must be signed in" barrier and see the Nickname field
  await expect(hostPage.getByLabel('Your Nickname')).toBeVisible();
  await hostPage.getByLabel('Your Nickname').fill('TestHost');

  // Create the Lobby
  await hostPage.getByRole('button', { name: /Create Lobby/i }).click();

  // Host is now in Lobby
  await expect(hostPage).toHaveURL(/.*\/lobby\/.*/);

  // Extract Room Code
  // The room code is likely the only h1 or can be grabbed by getting the element with text XXXXXX
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

  // They are redirected to /join. Fill in the code and name.
  await expect(guestPage).toHaveURL(/.*\/join/);
  await guestPage.getByLabel('Room Code').fill(roomCode);
  await guestPage.getByLabel('Your Nickname').fill('TestGuest');
  await guestPage.getByRole('button', { name: /Let's Play/i }).click();

  // Guest is now in the Lobby
  await expect(guestPage).toHaveURL(/.*\/lobby\/.*/);

  // 3. Host sees the guest and starts the game
  // Wait for guest to appear in host's lobby display
  await expect(hostPage.getByText('TestGuest')).toBeVisible();

  // Wait for the start game button to become active and click it
  const startGameBtn = hostPage.getByRole('button', { name: /Start Game/i });
  await expect(startGameBtn).toBeEnabled();
  await startGameBtn.click();

  // Both should navigate to Game Board
  await expect(hostPage).toHaveURL(/.*\/game\/.*/);
  await expect(guestPage).toHaveURL(/.*\/game\/.*/);

  // Optionally, Host can end the game
  await hostPage.getByRole('button', { name: /End Game/i }).click();

  // Wait for confirm End Game modal and click confirm
  await hostPage
    .getByRole('dialog')
    .getByRole('button', { name: /End Game/i })
    .click();

  // Wait for Game Over screen to appear for both players
  await expect(hostPage.getByText(/Game Over/i)).toBeVisible();
  await expect(guestPage.getByText(/Game Over/i)).toBeVisible();

  await hostContext.close();
  await guestContext.close();
});
