export const studioSections = [
  { id: "overview", label: "Overview" },
  { id: "pipeline", label: "Pipeline" },
  { id: "calendar", label: "Calendar" },
  { id: "bookings", label: "Inquiries" },
  { id: "activity", label: "Activity" },
  { id: "tasks", label: "Tasks" },
  { id: "inbox", label: "Inbox" },
  { id: "quotes", label: "Quotes" },
  { id: "packages", label: "Packages" },
  { id: "clients", label: "Clients" },
  { id: "shoots", label: "Shoots" },
  { id: "galleries", label: "Galleries" },
  { id: "contracts", label: "Contracts" },
  { id: "forms", label: "Forms" },
  { id: "invoices", label: "Invoices" },
  { id: "orders", label: "Shop" },
  { id: "billing", label: "Billing" },
  { id: "automations", label: "Automations" },
] as const;

/** The sidebar shows these few groups; each page shows its siblings as quiet tabs. */
export const studioGroups = [
  { id: "overview", label: "Overview", sections: ["overview", "activity"], hue: 210 },
  { id: "work", label: "Work", sections: ["pipeline", "calendar", "bookings", "shoots", "tasks"], hue: 38 },
  { id: "clients", label: "Clients", sections: ["clients", "inbox", "forms", "contracts"], hue: 265 },
  { id: "galleries", label: "Galleries", sections: ["galleries"], hue: 330 },
  { id: "money", label: "Money", sections: ["quotes", "packages", "orders", "invoices", "billing"], hue: 150 },
  { id: "automations", label: "Automations", sections: ["automations"], hue: 190 },
] as const;

export const sectionInfo: Record<string, string> = {
  overview: "Today at a glance.",
  activity: "What happened in the studio, newest first.",
  pipeline: "Every job from inquiry to paid.",
  calendar: "Appointments, hours you are open and days off.",
  bookings: "People who asked about a shoot, best leads first.",
  shoots: "Jobs, dates and delivery estimates.",
  tasks: "Things to do, including the ones the studio adds for you.",
  clients: "The people you work with.",
  inbox: "Messages and every email the studio sent.",
  forms: "Questionnaires and the forms clients fill in.",
  contracts: "Agreements and who signed them.",
  galleries: "Client galleries and how they are delivered.",
  quotes: "Quotes sent to clients.",
  packages: "What you sell: packages, add-ons and promo codes.",
  invoices: "What is billed and what is paid.",
  orders: "What visitors can buy from your galleries: the price list and every order.",
  billing: "Payments, refunds, instalments and recurring invoices.",
  automations: "Reminders and follow-ups that run by themselves.",
};

export const groupOf = (section: string) =>
  studioGroups.find((g) => (g.sections as readonly string[]).includes(section)) ?? studioGroups[0];
