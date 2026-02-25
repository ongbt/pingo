# How to Set Up Google Auth in Supabase

This guide walks you through the complete process of configuring Google OAuth
for your Pingo application, both for your local development and production
Supabase environments.

## 1. Obtain Google OAuth Credentials

You need to create a project in the Google Cloud Console to get an OAuth Client
ID and Secret.

1. **Go to the Google Cloud Console**: Navigate to
   [https://console.cloud.google.com/](https://console.cloud.google.com/).
2. **Create a New Project**: Click the project dropdown near the top left, and
   create a new project named "Pingo" (or similar).
3. **Configure the OAuth Consent Screen**:
   - Go to **APIs & Services > OAuth consent screen**.
   - Select **External** (unless you only want users in your own Google
     Workspace organization to use the app).
   - Click **Create**.
   - Fill in the required fields: App name ("Pingo"), User support email, and
     Developer contact information.
   - You don't necessarily need to add detailed scopes right now; the default
     email/profile scopes are enough.
   - Save and continue through the remaining steps.
4. **Create Credentials**:
   - Go to **APIs & Services > Credentials**.
   - Click **+ CREATE CREDENTIALS** at the top and select **OAuth client ID**.
   - **Application type**: Select **Web application**.
   - **Name**: Give it a recognizable name (e.g., "Pingo Web App").
   - **Authorized JavaScript origins**: We will not be using implicit flow, so
     you can leave this blank or add your domains (`http://localhost:5173` and
     your production URL).
   - **Authorized redirect URIs**: This is the crucial step. You need to add the
     callback URLs for your Supabase environments.
     - _Format_: `https://<project-ref>.supabase.co/auth/v1/callback`
     - You will get the exact URLs from your Supabase dashboard in the next
       step.
5. **Get your Keys**: Once created, a popup will show your **Client ID** and
   **Client Secret**. Copy these to a secure place.

---

## 2. Configure Supabase Local Environment

To test Google Auth locally, you need to configure your local Supabase instance.

1. **Locate your local configuration**: Open the `supabase/config.toml` file in
   your project.
2. **Enable the Google Provider**: Find the `[auth.external.google]` section.
   Update it as follows:

   ```toml
   [auth.external.google]
   enabled = true
   client_id = "env(SUPABASE_AUTH_GOOGLE_CLIENT_ID)"
   secret = "env(SUPABASE_AUTH_GOOGLE_SECRET)"
   # Optional: If you want to force account selection or redirect to a specific URI
   redirect_uri = "http://localhost:5173"
   ```

   _Note: Using `env()` references allows you to keep the actual secrets out of
   your repository._

3. **Set the Local Environment Variables**: You need to provide the secrets to
   the local Supabase instance. You can do this by exporting them in your
   terminal before running `supabase start`, or if you're using a `.env` file
   that the CLI picks up, add them there:

   ```bash
   SUPABASE_AUTH_GOOGLE_CLIENT_ID="your-client-id-from-google"
   SUPABASE_AUTH_GOOGLE_SECRET="your-client-secret-from-google"
   ```

4. **Restart Local Supabase**: Run `supabase stop` followed by `supabase start`
   to apply the changes.
5. **Update Google Redirect URIs**: Ensure you added
   `http://127.0.0.1:54321/auth/v1/callback` (or whatever URL your local
   Supabase API is running on) to the **Authorized redirect URIs** in the Google
   Cloud Console.

---

## 3. Configure Supabase Production Environment

Now deploy the settings to your live Suapbase database.

1. **Go to your Supabase Dashboard**: Log in to
   [supabase.com](https://supabase.com).
2. **Select your project**: Open the "Pingo" project.
3. **Navigate to Authentication Providers**:
   - On the left sidebar, click **Authentication**.
   - Click **Providers** under Configuration.
4. **Enable Google**:
   - Find **Google** in the list and click it to expand.
   - Toggle **Enable Google** on.
   - Paste the **Client ID** you copied from Google.
   - Paste the **Client Secret** you copied from Google.
   - Click **Save**.
5. **Update Google Redirect URIs**:
   - While still in the Google Provider settings in Supabase, look for the
     **Callback URL (for OAuth)**.
   - **Copy this URL**.
   - Go back to the **Google Cloud Console > APIs & Services > Credentials**,
     edit your OAuth client ID, and add this Supabase Callback URL to the
     **Authorized redirect URIs** list.
6. **Set Site URL and Redirect URIs in Supabase**:
   - In Supabase, go to **Authentication > URL Configuration**.
   - Set the **Site URL** to your production domain (e.g.,
     `https://pingo.bouncybison.click/`).
   - Under **Redirect URLs**, add the full URL where users should land after
     logging in (e.g., `https://pingo.bouncybison.click/*`). This acts as an
     allowlist for the `options.redirectTo` parameter used in the frontend code.

---

## 4. Test the Integration

1. Start your local dev server (`npm run dev`).
2. Navigate to the Sign In or Sign Up page.
3. Click "Continue with Google".
4. You should be redirected to the Google login screen. After authenticating,
   you should be redirected back to the Pingo app as a signed-in user.

### Troubleshooting

- **`redirect_uri_mismatch` error**: The callback URL configured in Supabase
  does not exactly match the one added to the Google Cloud Console. Double-check
  the URLs in both places.
- **Provider not properly configured**: Make sure you hit "Save" in the Supabase
  dashboard after entering the credentials.
