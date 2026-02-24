# Pingo - Multiplayer Bingo Mobile App

A modern, highly customizable multiplayer bingo game designed for mobile play,
allowing users to create their own themes (User Generated Content) or use fun
pre-set templates.

## 📱 Product Overview

Pingo allows players to create live bingo sessions with friends or colleagues
using custom or themed "sheets". It's designed for social interaction,
townhalls, and casual group play.

## 🚀 Core Features

### 🧩 Layout & Content

- **5x5 Grid**: Standard bingo layout with 25 cells.
- **Dynamic Content**: Cells can contain either words or numbers.
- **UGC Sheets**: Users can create, save, and edit their own sets of items
  (sheets).
- **Default Packs**: Includes ready-to-play sheets (e.g., "Corporate Townhall
  Catchphrases").

### 🤝 Multiplayer & Social

- **Global Multiplayer**: Real-time synchronization between all players.
- **Room System**:
  - **Host (Game Master)**: Creates the game and manages settings.
  - **Joiners**: Join via a unique generated game code.
- **Lobby**: Waiting area for players to gather before the host starts the
  session.
- **Real-time Leaderboard**: Displays scores for all players or the Top 5 in
  real-time.

### 🎮 Game Mechanics

- **Randomized Boards**: Every player receives a unique, randomized 5x5 layout
  based on the selected sheet.
- **Interaction**: Tap cells to mark them as selected.
- **Scoring**: Persistent score tracking during the session.
- **Win Condition**: Valid Bingo (Vertical, Horizontal, or Diagonal line).
- **Global Broadcast**: Winner announcement is sent to all devices instantly
  upon Bingo.

## ⚙️ Configuration & Modes

### End Game Logic

- **Competitive**: End game immediately when the first player hits Bingo.
- **Casual**: Allow continued play (to be defined by GM).

### Security & Fairness

- **Anti-Cheating Mode**: An optional setting where a cell is only officially
  "marked" if at least 2 different players select the same item (useful for
  townhall-style verification).

### Game Master (GM) Controls

- Selection of sheet (pre-set or custom).
- Triggering the game start from the lobby.
- Manual "End Game" override at any point.

### Session Management

- **Lobby Timeout**: If the host does not start the game within a configurable
  time period, the lobby is automatically cancelled.
- **Game Timeout**: If the game does not start (or remains inactive) within a
  configurable time period, the game session is automatically terminated.

### Access & Authentication

- **Guest Play**: Players can join and play games using a room code without
  needing to register or log in.
- **Creator Login**: To host or create a new game (or custom sheet), a user must
  be registered and logged in.

## 👤 User Roles

| Role                   | Permissions                                          | Authentication Required |
| ---------------------- | ---------------------------------------------------- | ----------------------- |
| **Guest/Joiner**       | Join games via code, play, mark cells.               | No                      |
| **Game Master (Host)** | Select/Create sheet, configure game, start/end game. | Yes                     |
| **Sheet Creator**      | Create, save, and edit custom Bingo sheets (UGC).    | Yes                     |

## 🏁 Success Criteria

- Reliable real-time sync across multiple mobile devices.
- Seamless creation and usage of User Generated Content (UGC).
- Clear, engaging UI for the bingo grid and leaderboard.
