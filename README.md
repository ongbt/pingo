# Pingo — Premium Real-Time Bingo 🚀

Pingo is a modern, real-time multiplayer Bingo application designed for
high-energy interactions. Built with **React (Vite)** and **Convex**, it
features curated room codes, randomized board generation, instant victory
celebrations, and a custom sheet builder.

## ✨ Key Features

- **Real-Time Multiplayer**: Instant sync of player status, scores, and board
  marks using Convex reactive queries.
- **Dynamic Board Randomization**: Every player receives a unique shuffle of the
  bingo sheet to ensure a competitive experience.
- **6-Character Room Codes**: Secure alphanumeric room codes (curated to avoid
  ambiguity) with collision protection.
- **Custom Sheet Builder**: Players can create, name, and manage their own bingo
  sheets via the My Sheets page. Features include previewing existing sheets in
  a mobile-optimized modal and cloning sheets via Duplication.
- **Share / Invite Links**: Lobby share button generates a deep-link
  (`/join?code=XXXXXX`) that pre-fills the code on the Join page — works via
  native OS share sheet on mobile or clipboard fallback on desktop.
- **User Engagement**:
  - **Tiered Scoring System**: First player to bingo earns a bonus, followed by
    diminishing bonuses to keep the competition fierce.
  - Visual victory celebrations with confetti and grand winner modals.
  - Quick-join flow with persistent nickname memory via localStorage.
  - "Copy to Clipboard" and Share shortcut directly from the lobby.
- **Host Controls**:
  - Start the game — enforced via Convex mutations. Non-hosts cannot start the
    game.
  - Auto-assign randomized boards to all players in parallel.
  - Force-end the game at any time with a confirmation modal ("End Game").
  - Real-time reactivity ensures all players instantly see the "Game Over"
    screen with final standings.
- **Player Controls**:
  - Non-host players can quit mid-game; their record is removed from the game in
    real-time.
- **Security & Integrity**:
  - **Session Robustness**: Inactive games and stale lobbies auto-terminate
    after 15-30 minutes of inactivity.
  - **Minimum Player Rule**: Games configured for a minimum of 2 players will
    automatically finish if disconnects/quits drop the lobby size to 1.
  - Lobby access is gated — URL visitors without a valid player session see an
    Access Denied screen and are redirected home after 3 seconds.
- **Premium UI/UX**: Ultra-modern design with smooth Framer Motion transitions,
  dark mode aesthetics, and interactive player leaderboards. Fully audited for
  Accessibility and UX cognitive load.
- **Search Optimized**: Fully compliant with SEO fundamentals and page hierarchy
  standards.

## 🛠️ Technology Stack

- **Framework**: React 18+ (Vite)
- **Routing**: React Router DOM v6
- **Backend/Realtime**: Convex (Reactive Database + Auth + Functions)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Visuals**: Lucide Icons, DiceBear Avatars, Canvas-Confetti
- **CI/CD**: GitHub Actions (Automated Linting, Unit Testing, and Production
  Builds)
- **Testing**: Vitest + React Testing Library (85%+ High Coverage) & Playwright
  (Multiplayer E2E)
  - E2E tests now run with automatic retries (1 locally, 2 on CI) to reduce
    flakiness.
  - Use `npm run test:e2e` for headless runs or `npm run test:e2e:ui` for
    interactive debugging. (Multiplayer E2E)
  - **Preparing Convex for E2E Tests**: To avoid flakiness, cleanly start the
    Convex dev server by clearing existing data: stop your `npx convex dev`
    server, run `Remove-Item -Recurse -Force convex/.convex`, and restart it.

## 🛠️ Developer Onboarding

> **New developer?** See the **[Developer Guide](./DEVELOPER_GUIDE.md)** for a
> complete walkthrough: installing dependencies, environment setup, running
> tests, quality checklist, and deploying to production.

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- Python 3.10+ (for `.agent/` audit scripts)

### 5-Minute Setup

```powershell
# 1. Install
npm install

# 2. Start Convex backend (Terminal 1)
npm run dev

# 4. Run E2E Tests (Optional)
npx playwright test
```

Open [http://localhost:5173](http://localhost:5173).

See [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) for full environment setup, test
instructions, and deployment steps.

## 📁 Project Structure

```
pingo/
├── src/
│   ├── pages/          # Application views (9 routes)
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Shared hooks (auth, timeout)
│   ├── types/          # TypeScript interfaces
│   └── lib/            # Shared utilities
├── convex/
│   ├── schema.ts       # Database schema
│   ├── auth.ts         # Convex Auth configuration
│   ├── games.ts        # Game logic mutations & queries
│   ├── players.ts      # Player logic mutations & queries
│   └── sheets.ts       # Sheet logic mutations & queries
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
  - Environment Variables: `VITE_CONVEX_URL`
- **Backend**: Convex Cloud

---

Built with 🧡 by Antigravity.
