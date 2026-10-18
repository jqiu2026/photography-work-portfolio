import { Container, Section, Text } from "@/components/ui";
import { PageHeader } from "@/components/PageHeader";
import { getDb } from "@jerryqiu/db";
import * as cal from "@jerryqiu/db/calendar";
import type { Metadata } from "next";
import { MiniPicker, type MiniGroup } from "@/components/MiniPicker";
import { Shell } from "@/components/Shell";
import "../../globals.css";

export const metadata: Metadata = { title: "Mini-sessions", description: "Short, fixed-length sessions on set days." };
export const dynamic = "force-dynamic";

export default async function Minis() {
  const db = getDb();
  const groups: MiniGroup[] = [];
  if (db) {
    const c = await cal.getCalendarSettings(db);
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: c.timezone,
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    for (const a of await cal.openMinislots(db)) {
      const label = a.groupLabel ?? "Mini-session";
      let g = groups.find((x) => x.label === label);
      if (!g) {
        g = { label, location: a.location, slots: [] };
        groups.push(g);
      }
      g.slots.push({ id: a.id, time: fmt.format(a.startsAt) });
    }
  }
  return (
    <Shell cta={false}>
      <PageHeader title={"Mini-sessions"} intro={"Short, fixed-length sessions on set days. Pick a slot."} />
      <Section style={{ paddingTop: 0 }}>
        <Container>
          <MiniPicker groups={groups} />
        </Container>
      </Section>
    </Shell>
  );
}
