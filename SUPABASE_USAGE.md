# Supabase Usage in Pingo

Pingo is a real-time multiplayer Bingo game that leverages several core features
of Supabase to deliver a seamless, synchronised user experience. Below is a
detailed breakdown of how various Supabase features are implemented within the
application, complete with examples from the codebase.

## 1. Authentication

Pingo uses Supabase Authentication to manage user sign-ups, sign-ins, and
session states. It supports both email/password authentication and OAuth (such
as Google Auth).

**Implementation Details:**

- **Context Provider:** The `AuthContext.tsx` file provides a global
  authentication state (`session`, `user`, `profile`).
- **State Listener:** It invokes `supabase.auth.onAuthStateChange()` to listen
  for sign-in, sign-out, and token refresh events, automatically updating the
  context.

**Example: Listening to Auth State Changes**

```typescript
// src/context/AuthContext.tsx
const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
            fetchProfile(newSession.user.id);
        } else {
            setProfile(null);
            setIsLoading(false);
        }
    },
);
```

---

## 2. Postgres Database & Queries

The robust PostgreSQL database is used to store persistent data types such as
`game`, `player`, `sheet`, and `profile`. The frontend interacts directly with
these tables using the Supabase JavaScript client for standard CRUD operations.

**Implementation Details:**

- Initial data loading relies on `supabase.from().select()`. For example, when a
  user enters a game or lobby, we fetch the `game` along with its associated
  `sheet`.

**Example: Fetching a Game and its Sheet**

```typescript
// src/pages/LobbyPage.tsx
const { data: gameData, error: gameError } = await supabase
    .from("game")
    .select("*, sheet(*)")
    .eq("id", gameId)
    .single();
```

---

## 3. Realtime Subscriptions (Supabase Channels)

Since Pingo is a multiplayer game, real-time synchronization is paramount. Pingo
establishes Postgres Changes subscriptions via Supabase Channels to broadcast
state updates locally to all players in a room instantly.

**Implementation Details:**

- **Lobby Syncing:** Subscribed to `INSERT`, `UPDATE`, and `DELETE` events on
  the `player` table so everyone can see who joined or left the lobby.
- **Game State Syncing:** Subscribed to `UPDATE` events on the `game` table
  (`game_status:${id}`) to trigger a unified progression when the host starts or
  ends a game.
- **Live Board Updates:** Subscribed to `UPDATE` events on the `player` table
  during a game to broadcast when a player marks a tile or achieves a Bingo.

**Example: Listening for Player Updates in a Game**

```typescript
// src/pages/GamePage.tsx
const playerChannel = supabase.channel(`players:${id}`)
    .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "player",
        filter: `game_id=eq.${id}`,
    }, (payload) => {
        if (payload.eventType === "UPDATE") {
            const updated = payload.new as Player;
            // Update local player state
            setPlayers((prev) =>
                prev.map((p) => p.id === updated.id ? updated : p)
            );

            // Trigger animations if someone just won finding Bingo!
            if (!oldPlayer?.is_winner && updated.is_winner) {
                // ... launch confetti ...
            }
        }
    })
    .subscribe();
```

---

## 4. Remote Procedure Calls (RPCs / Postgres Functions)

Client-side checks can be bypassed. Pingo shifts critical, race-condition-prone,
or security-sensitive actions to the database level through Postgres Functions
(RPCs).

**Implementation Details:**

- **`start_game`:** Instead of relying on the client to verify if the requester
  is the host, the `start_game` RPC natively asserts user privileges (`is_host`)
  server-side before updating the game status.
- **`claim_bingo`:** Automatically assigns a rank natively in the DB avoiding
  race conditions where two players might claim "Rank 1" at the exact same time.

**Example: Invoking an RPC from the Client**

```typescript
// src/pages/GamePage.tsx
const { error: claimError } = await supabase.rpc("claim_bingo", {
    p_game_id: game.id,
    p_player_id: currentPlayer.id,
});
```

**Example: Server-Side RPC Definition (PL/pgSQL)**

```sql
-- supabase/migrations/20260226050000_start_game_rpc.sql
CREATE OR REPLACE FUNCTION public.start_game(
  p_game_id  UUID,
  p_player_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_host BOOLEAN;
BEGIN
  -- Verify the caller is actually the host of this game
  SELECT is_host INTO v_is_host FROM player WHERE id = p_player_id AND game_id = p_game_id;
  IF v_is_host IS NULL OR v_is_host = FALSE THEN
    RAISE EXCEPTION 'Forbidden: only the host can start the game';
  END IF;

  UPDATE game SET status = 'active' WHERE id = p_game_id;
END;
$$;
```

---

## 5. Row Level Security (RLS)

Supabase’s Postgres database comes with RLS capabilities. Pingo uses RLS
policies to enforce data isolation and authorization dynamically based on
session data.

**Implementation Details:**

- Pingo caters to an array of user types (Anonymous Guests vs Authenticated
  Users).
- RLS rules are carefully defined in the migrations to separate guests playing
  in temporary sessions from logged-in users tracking custom saved Sheets.
  Guests are granted specific localized permissions solely for the duration of
  an active Game ID they have joined to prevent horizontal data tampering.
