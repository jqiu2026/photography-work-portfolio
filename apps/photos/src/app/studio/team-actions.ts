"use server";

import { StudioError } from "@jerryqiu/db/studio";
import * as team from "@jerryqiu/db/team";
import { getSite } from "@jerryqiu/sites";
import { z } from "zod";
import { studioOwner } from "@/lib/studio-run";

const id = z.string().uuid();

export async function inviteMemberAction(input: { email: string; name?: string; role: string }) {
  return studioOwner(async ({ db, user }) => {
    const memberId = await team.inviteMember(db, input, user.email);
    return {
      message: `${input.email.trim().toLowerCase()} can now sign in with Google at ${getSite("photos").url}/studio`,
      audit: {
        action: "studio.team.invite",
        entity: "user",
        entityId: memberId,
        summary: `Invited ${input.email.trim().toLowerCase()} as ${input.role}`,
      },
    };
  });
}
export async function changeMemberRoleAction(input: { memberId: string; role: string }) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(input.memberId);
    if (!p.success) throw new StudioError("Unknown person.");
    await team.changeMemberRole(db, p.data, input.role);
    return {
      message: "Role changed",
      audit: {
        action: "studio.team.role",
        entity: "user",
        entityId: p.data,
        summary: `Changed a role to ${input.role}`,
      },
    };
  });
}
export async function setMemberActiveAction(input: { memberId: string; active: boolean }) {
  return studioOwner(async ({ db }) => {
    const p = id.safeParse(input.memberId);
    if (!p.success) throw new StudioError("Unknown person.");
    await team.setMemberActive(db, p.data, input.active);
    return {
      message: input.active ? "Signed in again allowed" : "Switched off: they can no longer sign in",
      audit: {
        action: "studio.team.active",
        entity: "user",
        entityId: p.data,
        summary: input.active ? "Switched a team member on" : "Switched a team member off",
      },
    };
  });
}

export async function setUndoMinutesAction(minutes: number) {
  return studioOwner(async ({ db }) => {
    const m = await team.setUndoMinutes(db, Math.round(Number(minutes)));
    return {
      message: m
        ? `Helpers can take back what they added for ${m} minute${m === 1 ? "" : "s"}`
        : "Helpers can no longer remove anything",
      audit: {
        action: "studio.team.undo",
        entity: "setting",
        entityId: "team-undo",
        summary: `Take-back window set to ${m} minutes`,
      },
    };
  });
}
