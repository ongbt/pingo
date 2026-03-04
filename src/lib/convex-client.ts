import { ConvexReactClient } from 'convex/react';

const convexUrl = import.meta.env.VITE_CONVEX_URL;

if (!convexUrl) {
  console.error(
    'Missing Convex environment variables. ' +
      'Ensure VITE_CONVEX_URL is set in your .env.local file.'
  );
}

export const convex = new ConvexReactClient(
  convexUrl || 'http://127.0.0.1:3210'
);
