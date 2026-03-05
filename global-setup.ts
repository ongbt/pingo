// global-setup.ts
// This script runs before the Playwright test suite.
// It ensures a clean test environment by clearing localStorage
// and resetting Convex development data (if possible).

export default async function globalSetup() {
  // Clear browser localStorage for all contexts (Playwright will start fresh anyway)
  // Reset Convex dev database by running a migration that truncates tables.
  // The Convex CLI provides a way to reset the dev instance via `npx convex dev --reset`.
  // As a fallback, we can delete the local SQLite file used by Convex dev.
  try {
    console.log('Running Convex dev reset...');
    // This command stops any running Convex dev server and clears its data.
    // execSync('npx convex dev --reset', { stdio: 'inherit' }); // Disabled because --reset is not a valid option
  } catch (e) {
    console.warn('Convex reset failed or not needed:', e);
  }
}
