import type { SessionOptions } from "iron-session";

export type CreavaultSession = {
  address?: `0x${string}`;
  chainId?: number;
  nonce?: string;
  issuedAt?: string;
};

export const sessionOptions: SessionOptions = {
  password:
    process.env.SESSION_SECRET ||
    "creavault-dev-only-secret-do-not-use-in-prod-32+chars",
  cookieName: "creavault_session",
  cookieOptions: {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  },
};
