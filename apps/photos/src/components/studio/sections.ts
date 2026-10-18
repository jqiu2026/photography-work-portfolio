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
] as const;

/**
 * The sidebar shows these groups (the same shape as the tools photographers already know); each page shows its
 * siblings as tabs, never more than six. Configuration (brand, packages, forms, automations, users, plan) lives in
 * Settings, look-back views (pipeline, activity) in Reports, and everything that bills in Sales.
 */
export const studioGroups = [
  { id: "overview", label: "Dashboard", sections: ["overview", "tasks"], hue: 210 },
  { id: "galleries", label: "Galleries", sections: ["galleries", "visitors", "watermarks", "music"], hue: 330 },
  { id: "clients", label: "Clients", sections: ["clients", "bookings", "contracts", "inbox"], hue: 265 },
  { id: "calendar", label: "Calendar", sections: ["calendar", "shoots"], hue: 285 },
  { id: "store", label: "Sales", sections: ["orders", "quotes", "invoices", "billing"], hue: 150 },
  { id: "reports", label: "Reports", sections: ["reports", "pipeline", "activity"], hue: 38 },
  { id: "settings", label: "Settings", sections: ["brand", "packages", "forms", "automations", "users", "plan"], hue: 190 },
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
};

export const groupOf = (section: string) =>
  studioGroups.find((g) => (g.sections as readonly string[]).includes(section)) ?? studioGroups[0];
