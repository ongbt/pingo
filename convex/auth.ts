import { convexAuth } from "@convex-dev/auth/server"; // Touch to trigger recompilation
import Google from "@auth/core/providers/google";
import { Password } from "@convex-dev/auth/providers/Password";
import { Anonymous } from "@convex-dev/auth/providers/Anonymous";

export const { auth, signIn, signOut, store } = convexAuth({
  providers: [Google, Password, Anonymous],
});
