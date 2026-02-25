# Phase 8: Authentication & Profiles

## Goal

Implement Supabase authentication (sign up, sign in, sign out) and a user
profile page to allow users to preserve their identity and access custom sheets
across sessions.

## Tasks

- [x] Task 1: Create Supabase DB migration to add `user_id` to `profile` table,
      linked to `auth.users`, and apply RLS policies. → Verify: Migration
      applies cleanly.
- [x] Task 2: Create `src/context/AuthContext.tsx` to handle session state, user
      context, and Supabase auth methods. → Verify: Context can be imported
      without errors.
- [x] Task 3: Create `src/pages/SignUpPage.tsx` and `src/pages/SignInPage.tsx`.
      → Verify: Pages render correctly and handle form input. Included Google
      Login.
- [x] Task 4: Create `src/pages/ProfilePage.tsx` to display/edit identity and
      list "My Sheets" link. → Verify: Page renders and provides basic
      interface.
- [x] Task 5: Add routes to `src/App.tsx`, protecting `/profile`. → Verify:
      Navigating to `/profile` when unauthenticated redirects to `/signin`.
- [x] Task 6: Update `HomePage.tsx` (and other headers as needed) to show user
      avatar/initials + Sign Out when logged in, or Sign In/Up buttons
      otherwise. → Verify: Visual updates dynamically based on auth state.
- [x] Task 7: Update Create/Join flows to use the authenticated user's profile
      nickname directly rather than prompting if available. → Verify: Logged-in
      users skip nickname prompt.

## Done When

- [x] Users can sign up, sign in, and sign out securely either via Email or
      Google Auth.
- [x] Authenticated users can view and update their profile.
- [x] Profile state smoothly flows into game lobbies without requiring re-entry
      of name.
