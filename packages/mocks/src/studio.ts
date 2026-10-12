import { mockId, type MockStore } from "./store";
import type { Cents } from "./money";

/**
 * Photography studio domain (Q37): clients, shoots, client galleries, contracts, invoices, bookings. Every record is
 * obviously fake ("Sample Client A") and lives in a MockStore (localStorage in the browser). The Phase 3 repository keeps
 * the same method names over the real database.
 */
export const SHOOT_STEPS = ["inquiry", "booked", "shot", "editing", "delivered", "paid"] as const;
export type ShootStep = (typeof SHOOT_STEPS)[number];

export type Client = { id: string; name: string; email: string };
export type Shoot = { id: string; clientId: string; title: string; date: string; step: ShootStep };
export type Gallery = {
  id: string;
  shootId: string;
  clientId: string;
  title: string;
  passcode: string;
  clientEmail: string;
  photos: { id: string; label: string; hue: number }[];
  favourites: string[];
};
export type Contract = {
  id: string;
  shootId: string;
  title: string;
  body: string;
  status: "draft" | "sent" | "signed";
  envelopeId?: string;
  signedBy?: string;
  signedAt?: string;
};
export type InvoiceLine = { description: string; amountCents: Cents };
export type Invoice = {
  id: string;
  shootId: string;
  lines: InvoiceLine[];
  status: "draft" | "sent" | "paid";
  intentId?: string;
  receiptId?: string;
  paidAt?: string;
};
export type Booking = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  createdAt: string;
  status: "new" | "converted";
};

export type StudioData = {
  clients: Client[];
  shoots: Shoot[];
  galleries: Gallery[];
  contracts: Contract[];
  invoices: Invoice[];
  bookings: Booking[];
};

const KEY = "studio";

/** Contract template. TODO(owner, lawyer): real terms, jurisdiction, licence wording (Q37). */
export const CONTRACT_TEMPLATE = `MOCK CONTRACT TEMPLATE (sample text, not legal advice)

1. Services. The photographer will photograph the event described above.
2. Delivery. Edited photographs are delivered in an online gallery.
3. Licence. The client receives a personal, non-commercial licence unless agreed otherwise. All rights are reserved by the photographer.
4. Payment. The invoice is due as stated. Photographs are released when it is paid.
5. Cancellation. TODO(owner): terms.

Signed by typing a name below (mock: no real e-signature service is used in Phase 2.5).`;

const hues = [210, 350, 40, 150, 280, 20];
export const sampleGalleryPhotos = (n = 12) =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    label: `Sample frame ${i + 1}`,
    hue: hues[i % hues.length],
  }));

export function seedStudio(now = new Date()): StudioData {
  const iso = (d: number) => new Date(now.getTime() + d * 86_400_000).toISOString().slice(0, 10);
  const clients: Client[] = [
    { id: "c1", name: "Sample Client A", email: "client.a@example.test" },
    { id: "c2", name: "Sample Client B", email: "client.b@example.test" },
  ];
  const shoots: Shoot[] = [
    { id: "s1", clientId: "c1", title: "SAMPLE: Spring recital", date: iso(-20), step: "delivered" },
    { id: "s2", clientId: "c2", title: "SAMPLE: Community event", date: iso(12), step: "booked" },
  ];
  return {
    clients,
    shoots,
    galleries: [
      {
        id: "g1",
        shootId: "s1",
        clientId: "c1",
        title: "SAMPLE: Spring recital",
        passcode: "sample-1234",
        clientEmail: "client.a@example.test",
        photos: sampleGalleryPhotos(),
        favourites: [],
      },
    ],
    contracts: [
      {
        id: "k1",
        shootId: "s1",
        title: "Photography agreement",
        body: CONTRACT_TEMPLATE,
        status: "sent",
        envelopeId: "env_mock_seed",
      },
    ],
    invoices: [
      {
        id: "i1",
        shootId: "s1",
        lines: [
          { description: "SAMPLE: Event coverage, 3 hours", amountCents: 45000 },
          { description: "SAMPLE: Edited gallery", amountCents: 15000 },
        ],
        status: "sent",
      },
    ],
    bookings: [
      {
        id: "b1",
        name: "Sample Visitor",
        email: "visitor@example.test",
        topic: "Event",
        message: "SAMPLE inquiry: a one-day community event.",
        createdAt: now.toISOString(),
        status: "new",
      },
    ],
  };
}

export class StudioRepo {
  constructor(
    private store: MockStore,
    private now: () => Date = () => new Date(),
  ) {}

  data(): StudioData {
    const d = this.store.get<StudioData | null>(KEY, null);
    if (d) return d;
    const s = seedStudio(this.now());
    this.store.set(KEY, s);
    return s;
  }
  private save(d: StudioData) {
    this.store.set(KEY, d);
  }
  reset() {
    this.store.remove(KEY);
  }

  addClient(name: string, email: string) {
    if (name.trim().length < 2) throw new Error("Enter the client's name.");
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error("Enter a valid email.");
    const d = this.data();
    const c: Client = { id: mockId("c"), name: name.trim(), email: email.trim() };
    this.save({ ...d, clients: [...d.clients, c] });
    return c;
  }
  addShoot(clientId: string, title: string, date: string) {
    const d = this.data();
    if (!d.clients.some((c) => c.id === clientId)) throw new Error("Pick a client.");
    if (title.trim().length < 2) throw new Error("Give the shoot a title.");
    const s: Shoot = { id: mockId("s"), clientId, title: title.trim(), date, step: "inquiry" };
    this.save({ ...d, shoots: [...d.shoots, s] });
    return s;
  }
  advanceShoot(id: string): Shoot {
    const d = this.data();
    const s = d.shoots.find((x) => x.id === id);
    if (!s) throw new Error("Unknown shoot.");
    const i = SHOOT_STEPS.indexOf(s.step);
    if (i >= SHOOT_STEPS.length - 1) return s;
    const next = { ...s, step: SHOOT_STEPS[i + 1] };
    this.save({ ...d, shoots: d.shoots.map((x) => (x.id === id ? next : x)) });
    return next;
  }
  createGallery(shootId: string, passcode: string) {
    const d = this.data();
    const shoot = d.shoots.find((x) => x.id === shootId);
    if (!shoot) throw new Error("Unknown shoot.");
    const client = d.clients.find((c) => c.id === shoot.clientId)!;
    if (passcode.trim().length < 6) throw new Error("A passcode needs at least 6 characters.");
    if (d.galleries.some((g) => g.passcode.toLowerCase() === passcode.trim().toLowerCase()))
      throw new Error("That passcode is already used.");
    const g: Gallery = {
      id: mockId("g"),
      shootId,
      clientId: client.id,
      title: shoot.title,
      passcode: passcode.trim(),
      clientEmail: client.email,
      photos: sampleGalleryPhotos(),
      favourites: [],
    };
    this.save({ ...d, galleries: [...d.galleries, g] });
    return g;
  }
  toggleFavourite(galleryId: string, photoId: string): string[] {
    const d = this.data();
    const g = d.galleries.find((x) => x.id === galleryId);
    if (!g) throw new Error("Unknown gallery.");
    const favs = g.favourites.includes(photoId)
      ? g.favourites.filter((f) => f !== photoId)
      : [...g.favourites, photoId];
    this.save({ ...d, galleries: d.galleries.map((x) => (x.id === galleryId ? { ...x, favourites: favs } : x)) });
    return favs;
  }
  createContract(shootId: string): Contract {
    const d = this.data();
    if (!d.shoots.some((s) => s.id === shootId)) throw new Error("Unknown shoot.");
    const k: Contract = {
      id: mockId("k"),
      shootId,
      title: "Photography agreement",
      body: CONTRACT_TEMPLATE,
      status: "draft",
    };
    this.save({ ...d, contracts: [...d.contracts, k] });
    return k;
  }
  updateContract(id: string, patch: Partial<Contract>) {
    const d = this.data();
    this.save({ ...d, contracts: d.contracts.map((k) => (k.id === id ? { ...k, ...patch } : k)) });
  }
  createInvoice(shootId: string, lines: InvoiceLine[]): Invoice {
    const d = this.data();
    if (!d.shoots.some((s) => s.id === shootId)) throw new Error("Unknown shoot.");
    const clean = lines.filter((l) => l.description.trim() && Number.isInteger(l.amountCents) && l.amountCents > 0);
    if (!clean.length) throw new Error("Add at least one line with an amount.");
    const inv: Invoice = { id: mockId("i"), shootId, lines: clean, status: "draft" };
    this.save({ ...d, invoices: [...d.invoices, inv] });
    return inv;
  }
  updateInvoice(id: string, patch: Partial<Invoice>) {
    const d = this.data();
    this.save({ ...d, invoices: d.invoices.map((i) => (i.id === id ? { ...i, ...patch } : i)) });
  }
  addBooking(b: Omit<Booking, "id" | "createdAt" | "status">) {
    const d = this.data();
    const booking: Booking = { ...b, id: mockId("b"), createdAt: this.now().toISOString(), status: "new" };
    this.save({ ...d, bookings: [booking, ...d.bookings] });
    return booking;
  }
  convertBooking(id: string): Client {
    const d = this.data();
    const b = d.bookings.find((x) => x.id === id);
    if (!b) throw new Error("Unknown booking.");
    const existing = d.clients.find((c) => c.email.toLowerCase() === b.email.toLowerCase());
    const client = existing ?? { id: mockId("c"), name: b.name, email: b.email };
    this.save({
      ...d,
      clients: existing ? d.clients : [...d.clients, client],
      bookings: d.bookings.map((x) => (x.id === id ? { ...x, status: "converted" as const } : x)),
    });
    return client;
  }
}

export const invoiceTotal = (i: Invoice): Cents => i.lines.reduce((n, l) => n + l.amountCents, 0);
