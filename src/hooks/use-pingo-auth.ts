import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export function usePingoAuth() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut: convexSignOut } = useAuthActions();
  
  // In Convex Auth, we added a query in auth_queries.ts
  const user = useQuery(api.auth_queries.currentUser);
  
  // Map Convex user to the expected Profile type if needed
  // Profile in Pingo: { id, nickname, avatar_url }
  const profile = user ? {
    id: user._id,
    nickname: user.name || "Anonymous",
    avatar_url: user.image || null,
  } : null;

  const signOut = async () => {
    await convexSignOut();
  };

  return {
    user,
    profile,
    isLoading,
    signOut,
    isAuthenticated,
  };
}
