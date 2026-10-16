import "server-only";
import { getDb, schema } from "@jerryqiu/db";
import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { accountSession } from "@/lib/account-session";

/** Every signed-in portal page starts here: the account, or a redirect to the sign-in page. */
export async function requireAccount() {
  const me = await accountSession();
  const db = getDb();
  if (!me || !db) redirect("/client/login");
  const unread = (
    await db
      .select({ id: schema.studioMessages.id })
      .from(schema.studioMessages)
      .where(
        and(
          eq(schema.studioMessages.clientId, me.client.id),
          eq(schema.studioMessages.direction, "out"),
          isNull(schema.studioMessages.readAt),
        ),
      )
  ).length;
  return { me, db, unread };
}

export const STEPS = ["inquiry", "booked", "shot", "editing", "delivered", "paid"] as const;
export const STEP_LABEL: Record<string, string> = {
  inquiry: "Inquiry",
  booked: "Booked",
  shot: "Shot",
  editing: "Editing",
  delivered: "Delivered",
  paid: "Paid",
  cancelled: "Cancelled",
};
