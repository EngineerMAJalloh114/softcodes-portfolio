"use client";

import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

/** Browser auth client. Same-origin: talks to /api/auth/*. */
export const authClient = createAuthClient({
  plugins: [twoFactorClient()],
});
