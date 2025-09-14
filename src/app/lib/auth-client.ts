import { inferAdditionalFields, adminClient, customSessionClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "http://localhost:3000",
  plugins: [
    customSessionClient(),
    adminClient(),
    inferAdditionalFields({
      user: {
        role: {
          type: "string",
          required: false,
        },
        nickname: {
          type: "string",
          required: false,
        },
      },
    }),
  ],
});
