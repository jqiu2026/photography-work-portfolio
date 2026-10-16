import { redirect } from "next/navigation";

/** The client portal was retired: clients open their gallery from its own link (/g/<address>). */
export default function Retired() {
  redirect("/");
}
