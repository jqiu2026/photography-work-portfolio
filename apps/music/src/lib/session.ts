import "server-only";
import { cookies } from "next/headers";
import { TTL, makeSession, readSession } from "@/lib/session-token";

/**
 * The buyer's library session: a signed cookie holding the buyer id and an expiry. No password. The only way to get one
 * is a one-time link sent to an address that has bought (see music.ts createBuyerLink).
 */
const NAME = "mu_buyer";
export async function buyerId(): Promise<string | null> {
  return readSession((await cookies()).get(NAME)?.value);
}

export async function startSession(id: string) {
  (await cookies()).set(NAME, makeSession(id), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL,
  });
}

export async function endSession() {
  (await cookies()).delete(NAME);
}
