export const studioSections = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  { id: "galleries", label: "All galleries" },
  { id: "visitors", label: "Visitors" },
  { id: "music", label: "Music" },
  { id: "watermarks", label: "Watermarks" },
  { id: "orders", label: "Store" },
  { id: "billing", label: "Payments" },
  { id: "pipeline", label: "Pipeline" },
  { id: "calendar", label: "Calendar" },
  { id: "bookings", label: "Inquiries" },
  { id: "shoots", label: "Shoots" },
  { id: "tasks", label: "Tasks" },
  { id: "clients", label: "Clients" },
  { id: "quotes", label: "Quotes" },
  { id: "packages", label: "Packages" },
  { id: "contracts", label: "Contracts" },
  { id: "forms", label: "Forms" },
  { id: "invoices", label: "Invoices" },
  { id: "inbox", label: "Email" },
  { id: "reports", label: "Reports" },
  { id: "brand", label: "Brand" },
  { id: "users", label: "Users" },
  { id: "plan", label: "Plan" },
  { id: "automations", label: "Automations" },
  { id: "expenses", label: "Expenses" },
  { id: "testimonials", label: "Testimonials" },
  { id: "gear", label: "Gear" },
  { id: "callsheets", label: "Call sheets" },
  { id: "rights", label: "Rights" },
  { id: "subscribers", label: "Subscribers" },
  { id: "privacy", label: "Privacy" },
] as const;

/**
 * The sidebar shows these groups (the same shape as the tools photographers already know); each page shows its
 * siblings as tabs, never more than six. Configuration (brand, packages, forms, automations, users, plan) lives in
 * Settings, look-back views (pipeline, activity) in Reports, and everything that bills in Sales.
 */
export const studioGroups = [
  { id: "overview", label: "Dashboard", sections: ["overview", "tasks"], hue: 210 },
  { id: "galleries", label: "Galleries", sections: ["galleries", "visitors", "watermarks", "music"], hue: 330 },
  {
    id: "clients",
    label: "Clients",
    sections: ["clients", "bookings", "contracts", "inbox", "testimonials", "rights"],
    hue: 265,
  },
  { id: "calendar", label: "Calendar", sections: ["calendar", "shoots", "callsheets", "gear"], hue: 285 },
  { id: "store", label: "Sales", sections: ["orders", "quotes", "invoices", "billing"], hue: 150 },
  {
    id: "reports",
    label: "Reports",
    sections: ["reports", "expenses", "subscribers", "privacy", "pipeline", "activity"],
    hue: 38,
  },
  {
    id: "settings",
    label: "Settings",
    sections: ["brand", "packages", "forms", "automations", "users", "plan"],
    hue: 190,
  },
] as const;

export const sectionInfo: Record<string, string> = {
  overview: "Today at a glance.",
  activity: "What happened in the studio, newest first.",
  galleries: "Client galleries and how they are delivered.",
  visitors: "People who gave their email to open a gallery.",
  music: "Tracks any gallery can play.",
  watermarks: "Visible marks for delivered copies.",
  orders: "What visitors can buy, the price sheets, and every order.",
  billing: "Payments, refunds, instalments and recurring invoices.",
  pipeline: "Every job from inquiry to paid.",
  calendar: "Appointments, hours you are open and days off.",
  bookings: "People who asked about a shoot, best leads first.",
  shoots: "Jobs, dates and delivery estimates.",
  tasks: "Things to do, including the ones the studio adds for you.",
  clients: "The people you work with.",
  quotes: "Quotes sent to clients.",
  packages: "What you sell: packages, add-ons and promo codes.",
  contracts: "Agreements and who signed them.",
  forms: "Questionnaires, contract templates and policies.",
  invoices: "What is billed and what is paid.",
  inbox: "Messages and every email the studio sent.",
  reports: "Sales, orders, files, products and invoices for any period.",
  brand: "Your name and contact details, shown in galleries and emails.",
  users: "Who can sign in to the studio.",
  plan: "Your plan, what you use, and your billing history.",
  automations: "Reminders and follow-ups that run by themselves.",
  expenses: "What the business spends and the miles it drives, ready for tax time.",
  testimonials: "What clients said. Nothing is public until they agree.",
  gear: "Cameras, lenses and lights, and which job each is on.",
  callsheets: "Call time, place, people and the shot list for each shoot.",
  rights: "Who may use your photographs, for what, and until when.",
  subscribers: "People who asked for your newsletter. Only confirmed addresses count.",
  privacy: "People who asked to be taken out of a photograph.",
};

export const groupOf = (section: string) =>
  studioGroups.find((g) => (g.sections as readonly string[]).includes(section)) ?? studioGroups[0];

/**
 * Which pages each role sees. The owner sees everything. A photographer sees shoots, galleries, the calendar, clients
 * and gear (no money, no settings). A bookkeeper sees the money side (sales, payments, expenses, reports) and the
 * client list (no galleries, no settings). A page a role cannot see is a 404 for them, and the sidebar leaves it out.
 */
const PHOTOGRAPHER = new Set([
  "overview",
  "tasks",
  "galleries",
  "visitors",
  "watermarks",
  "music",
  "calendar",
  "shoots",
  "callsheets",
  "gear",
  "clients",
  "bookings",
]);
const BOOKKEEPER = new Set([
  "overview",
  "orders",
  "quotes",
  "invoices",
  "billing",
  "expenses",
  "reports",
  "pipeline",
  "activity",
  "clients",
]);
export function canSeeSection(role: string | undefined, section: string): boolean {
  if (role === "owner") return true;
  if (role === "photographer") return PHOTOGRAPHER.has(section);
  if (role === "bookkeeper") return BOOKKEEPER.has(section);
  return false;
}
/** The groups and pages a role sees (empty groups are dropped). */
export function groupsFor(role: string | undefined) {
  return studioGroups
    .map((g) => ({ ...g, sections: g.sections.filter((id) => canSeeSection(role, id)) }))
    .filter((g) => g.sections.length > 0);
}
