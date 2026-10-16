import type { Metadata } from "next";
import Link from "next/link";
import { Page, Sample } from "@/components/Marketing";

export const metadata: Metadata = { title: "Client portal", description: "A tour of what a client sees." };

export default function ClientPortalTour() {
  return (
    <Page
      title="Client portal"
      lede="One sign-in for everything a client needs: what to do next, their galleries, paperwork, payments and messages."
    >
      <Sample>
        SAMPLE tour: the people, prices and dates below are made up to show the layout. No photographs appear here.
      </Sample>
      <h2>What needs you</h2>
      <ul className="mk-cards" aria-label="Sample tasks">
        <li>
          <h3>Sign: Event photography agreement</h3>
          <p>Read it, type your name, tick the boxes. Done in a minute.</p>
        </li>
        <li>
          <h3>Invoice 2027-0001 · $XX</h3>
          <p>Pay by card or bank transfer. A PDF receipt is one click.</p>
        </li>
        <li>
          <h3>Questions: Event details</h3>
          <p>Start time, must-have moments, anyone who should not be photographed.</p>
        </li>
      </ul>
      <h2>Where your photographs are</h2>
      <ol className="mk-steps" aria-label="Sample progress">
        <li>
          <strong>Booked</strong>
        </li>
        <li>
          <strong>Shot</strong>
        </li>
        <li>
          <strong>Editing</strong> <p>Estimated delivery: a date you can plan around.</p>
        </li>
        <li>
          <strong>Delivered</strong>
        </li>
      </ol>
      <h2>Also in the portal</h2>
      <ul>
        <li>Messages, together with every email I sent you, in one thread.</li>
        <li>Move or cancel an appointment inside the policy window.</li>
        <li>Choose which emails you get, change your password, or use an emailed sign-in link instead.</li>
      </ul>
      <p>
        Already a client? <Link href="/client/login">Sign in</Link> or{" "}
        <Link href="/client">open a gallery with its passcode</Link>.
      </p>
    </Page>
  );
}
