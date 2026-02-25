# Pingo — Premium Real-Time Bingo 🚀

Pingo is a modern, real-time multiplayer Bingo application designed for
high-energy interactions. Built with Next.js and Supabase, it features curated
room codes, randomized board generation, and instant victory celebrations.

## ✨ Key Features

- **Real-Time Multiplayer**: Instant sync of player status, scores, and board
  marks using Supabase Realtime.
- **Dynamic Board Randomization**: Every player receives a unique shuffle of the
  bingo sheet to ensure a competitive experience.
- **Alphanumeric Room System**: Secure 6-character room codes (curated to avoid
  ambiguity) with collision protection.
- **User Engagement**:
  - Visual victory celebrations with confetti and grand winner modals.
  - Quick-join flow with persistent nickname memory.
  - "Copy to Clipboard" sharing directly from the lobby.
- **Host Controls**: The host can force-end the game at any time using the
  in-game **End Game** button. A real-time broadcast ensures all players
  instantly see the "Game Over" screen with final standings.
- **Premium UI/UX**: Ultra-modern design with smooth Framer Motion transitions,
  dark mode support, and interactive player leaderboards.

## 🛠️ Technology Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS
- **Database/Realtime**: Supabase (Postgres)
- **Animations**: Framer Motion
- **Visuals**: Lucide Icons, DiceBear Avatars, Canvas-Confetti

## 🚀 Getting Started

### 1. Prerequisite (Supabase Local)

Start the local Supabase stack if you are developing locally:

```bash
npx supabase start
```

### 2. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) for the high-octane Bingo
experience.

## 📁 Project Structure

- `app/`: Next.js pages and routing.
- `lib/`: Shared utilities and Supabase client.
- `supabase/`: Migrations and schema definitions.
- `types/`: TypeScript interfaces.

---

Built with 🧡 by Antigravity.
