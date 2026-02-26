# Pingo — Premium Real-Time Bingo 🚀

Pingo is a modern, real-time multiplayer Bingo application designed for
high-energy interactions. Built with **React (Vite)** and **Supabase**, it
features curated room codes, randomized board generation, instant victory
celebrations, and a custom sheet builder.

## ✨ Key Features

- **Real-Time Multiplayer**: Instant sync of player status, scores, and board
  marks using Supabase Realtime.
- **Dynamic Board Randomization**: Every player receives a unique shuffle of the
  bingo sheet to ensure a competitive experience.
- **6-Character Room Codes**: Secure alphanumeric room codes (curated to avoid
  ambiguity) with collision protection.
- **Custom Sheet Builder**: Players can create, name, and manage their own bingo
  sheets via the My Sheets page, persisted in localStorage.
- **Share / Invite Links**: Lobby share button generates a deep-link
  (`/join?code=XXXXXX`) that pre-fills the code on the Join page — works via
  native OS share sheet on mobile or clipboard fallback on desktop.
- **User Engagement**:
  - Visual victory celebrations with confetti and grand winner modals.
  - Quick-join flow with persistent nickname memory via localStorage.
  - "Copy to Clipboard" and Share shortcut directly from the lobby.
- **Host Controls**:
  - Start the game — enforced server-side via a `SECURITY DEFINER` Postgres RPC
    (`start_game`). Non-hosts cannot start the game even by calling the API
    directly.
  - Auto-assign randomized boards to all players in parallel.
  - Force-end the game at any time with a confirmation modal ("End Game").
  - A real-time broadcast ensures all players instantly see the "Game Over"
    screen with final standings.
- **Player Controls**:
  - Non-host players can quit mid-game; their record is deleted from Supabase
    and removed from other players' leaderboards in real-time.
- **Security**:
  - Lobby access is gated — URL visitors without a valid player session see an
    Access Denied screen and are redirected home after 3 seconds.
  - Game start is enforced at the database layer via a `SECURITY DEFINER` RPC,
    not just a client-side guard.
- **Premium UI/UX**: Ultra-modern design with smooth Framer Motion transitions,
  dark mode aesthetics, and interactive player leaderboards.

## 🛠️ Technology Stack

- **Framework**: React 18+ (Vite)
- **Routing**: React Router DOM v6
- **Styling**: Tailwind CSS
- **Database/Realtime**: Supabase (Postgres + Realtime)
- **Animations**: Framer Motion
- **Visuals**: Lucide Icons, DiceBear Avatars, Canvas-Confetti

## 🚀 Getting Started

### 1. Prerequisites

- Node.js 20+
- Docker Desktop (for local Supabase)

### 2. Start Local Supabase

```bash
npx supabase start
```

### 3. Configure Environment

Copy `.env.local` and fill in your local Supabase credentials:

```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=<your-local-anon-key>
```

### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) for the high-octane Bingo
experience.

## 📁 Project Structure

```
pingo/
├── src/
│   ├── pages/          # Application views (6 routes)
│   ├── components/     # Reusable UI components
│   ├── lib/            # Supabase client & shared utilities
│   └── types/          # TypeScript interfaces
├── supabase/
│   ├── migrations/     # All DB migrations (12 total)
│   └── seed.sql        # Default bingo sheets seed
├── public/
│   └── _redirects      # Cloudflare SPA routing
└── dist/               # Production build output
```

## 🌐 Routes

| Route        | Page        | Description                                            |
| ------------ | ----------- | ------------------------------------------------------ |
| `/`          | HomePage    | Landing — host or join a game                          |
| `/create`    | CreatePage  | Select/create a sheet and launch a lobby               |
| `/join`      | JoinPage    | Enter room code + nickname (supports `?code=` prefill) |
| `/lobby/:id` | LobbyPage   | Waiting room before game start                         |
| `/game/:id`  | GamePage    | Live bingo game board                                  |
| `/sheets`    | SheetsPage  | Manage custom bingo sheets                             |
| `/profile`   | ProfilePage | View/edit profile (auth required)                      |
| `/signin`    | SignInPage  | Email/password + Google sign in                        |
| `/signup`    | SignUpPage  | Create a new account                                   |

## 🚢 Deployment

- **Frontend**: Cloudflare Pages (Vite SPA)
  - Build Command: `npm run build`
  - Output Directory: `dist`
  - Environment Variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- **Backend**: Supabase Cloud (`ap-southeast-1` — Singapore)
  - Project ID: `uzcumjicbmnlehrdjirl`
  - Realtime enabled for `game` and `player` tables.

See `DEPLOYMENT.md` for full setup checklist and troubleshooting.

---

Built with 🧡 by Antigravity.
