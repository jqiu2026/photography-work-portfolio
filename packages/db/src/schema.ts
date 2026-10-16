import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/*
 * One schema for every site. `site` scopes content: "hub" | "photos" | "music" | "flying" (or "all").
 * Soft delete (`deleted_at`) powers Trash; `updated_by` and the audit log record who changed what.
 * `studio_id` is nullable and unused: multi-tenancy could be added later, but is not built (non-goal).
 */
export const siteEnum = pgEnum("site", ["hub", "photos", "music", "flying", "all"]);
export const roleEnum = pgEnum("role", ["owner", "editor", "client"]);
export const statusEnum = pgEnum("status", ["draft", "scheduled", "published"]);
export const timelineCategoryEnum = pgEnum("timeline_category", [
  "work",
  "education",
  "leadership",
  "volunteering",
  "flying",
  "music",
  "photography",
  "other",
]);
export const projectTypeEnum = pgEnum("project_type", ["photography", "software", "design", "writing", "other"]);
export const mediaKindEnum = pgEnum("media_kind", ["image", "audio", "video", "file"]);
export const licenseEnum = pgEnum("license", ["all-rights-reserved", "cc-by", "cc-by-nc", "cc-by-sa", "cc0"]);
export const reviewEnum = pgEnum("review_status", ["ok", "needs_review"]);
export const rightsEnum = pgEnum("music_rights", ["original", "cover", "licensed", "third-party-embed"]);
export const musicKindEnum = pgEnum("music_kind", ["recording", "performance"]);
export const flightKindEnum = pgEnum("flight_kind", ["milestone", "flight"]);
export const inboxStatusEnum = pgEnum("inbox_status", ["new", "read", "replied", "archived", "spam"]);

const stamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: text("updated_by"),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  studioId: uuid("studio_id"),
};

/** Allow-list of people who may sign in. Google proves identity; this table grants access. */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    image: text("image"),
    role: roleEnum("role").notNull().default("editor"),
    active: boolean("active").notNull().default(true),
    addedBy: text("added_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSignInAt: timestamp("last_sign_in_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("users_email_idx").on(t.email)],
);

/** Key/value site settings: profile, seo, nav, theme, protection, home... (`value` is validated by zod in code). */
export const settings = pgTable(
  "settings",
  {
    site: siteEnum("site").notNull(),
    key: text("key").notNull(),
    value: jsonb("value").notNull().$type<unknown>(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: text("updated_by"),
  },
  (t) => [primaryKey({ columns: [t.site, t.key] })],
);

export const socialLinks = pgTable("social_links", {
  id: uuid("id").primaryKey().defaultRandom(),
  site: siteEnum("site").notNull().default("all"),
  label: text("label").notNull(),
  href: text("href").notNull(),
  icon: text("icon").notNull().default("web"),
  sort: integer("sort").notNull().default(0),
  showHeader: boolean("show_header").notNull().default(false),
  showFooter: boolean("show_footer").notNull().default(true),
  visible: boolean("visible").notNull().default(true),
  ...stamps,
});

export const timelineEntries = pgTable("timeline_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: timelineCategoryEnum("category").notNull().default("other"),
  title: text("title").notNull(),
  org: text("org"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  current: boolean("current").notNull().default(false),
  summary: text("summary"),
  link: text("link"),
  visible: boolean("visible").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  ...stamps,
});

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: mediaKindEnum("kind").notNull().default("image"),
    filename: text("filename").notNull(),
    mime: text("mime").notNull(),
    bytes: integer("bytes").notNull().default(0),
    width: integer("width"),
    height: integer("height"),
    color: text("color"),
    blur: text("blur"),
    phash: text("phash"),
    /** SHA-256 of the original file (hex): exact-duplicate detection on upload. */
    sha256: text("sha256"),
    /** Private storage key of the original (never exposed). */
    originalKey: text("original_key").notNull(),
    /** Public-safe derivatives: [{ width, format, key }] with GPS/personal EXIF stripped. */
    derivatives: jsonb("derivatives")
      .notNull()
      .$type<{ width: number; format: string; key: string }[]>()
      .default(sql`'[]'::jsonb`),
    alt: text("alt"),
    caption: text("caption"),
    license: licenseEnum("license").notNull().default("all-rights-reserved"),
    containsPeople: boolean("contains_people").notNull().default(false),
    releaseOnFile: boolean("release_on_file").notNull().default(false),
    minors: boolean("minors").notNull().default(false),
    reviewStatus: reviewEnum("review_status").notNull().default("ok"),
    exif: jsonb("exif").$type<Record<string, unknown>>(),
    createdBy: text("created_by"),
    ...stamps,
  },
  (t) => [index("media_phash_idx").on(t.phash), index("media_review_idx").on(t.reviewStatus)],
);

export const posts = pgTable(
  "posts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    site: siteEnum("site").notNull().default("hub"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    summary: text("summary"),
    body: text("body").notNull().default(""),
    coverMediaId: uuid("cover_media_id").references(() => media.id),
    tags: text("tags").array().notNull().default(sql`'{}'::text[]`),
    status: statusEnum("status").notNull().default("draft"),
    publishAt: timestamp("publish_at", { withTimezone: true }),
    featured: boolean("featured").notNull().default(false),
    seo: jsonb("seo").$type<{ title?: string; description?: string; ogImage?: string }>(),
    readingMinutes: integer("reading_minutes").notNull().default(1),
    ...stamps,
  },
  (t) => [uniqueIndex("posts_site_slug_idx").on(t.site, t.slug), index("posts_status_idx").on(t.status)],
);

export const postVersions = pgTable("post_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id")
    .notNull()
    .references(() => posts.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by"),
});

export type Block =
  | { type: "text"; markdown: string }
  | { type: "image"; mediaId: string; caption?: string }
  | { type: "gallery"; mediaIds: string[] }
  | { type: "quote"; text: string; cite?: string }
  | { type: "video"; provider: "youtube" | "vimeo"; id: string; title: string }
  | { type: "columns"; left: string; right: string };

export const projects = pgTable(
  "projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    site: siteEnum("site").notNull().default("hub"),
    slug: text("slug").notNull(),
    type: projectTypeEnum("type").notNull().default("photography"),
    title: text("title").notNull(),
    summary: text("summary"),
    date: date("date"),
    client: text("client"),
    role: text("role"),
    category: text("category"),
    coverMediaId: uuid("cover_media_id").references(() => media.id),
    blocks: jsonb("blocks").notNull().$type<Block[]>().default(sql`'[]'::jsonb`),
    credits: jsonb("credits")
      .notNull()
      .$type<{ name: string; role: string; url?: string }[]>()
      .default(sql`'[]'::jsonb`),
    related: text("related").array().notNull().default(sql`'{}'::text[]`),
    status: statusEnum("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    protectedPage: boolean("protected_page").notNull().default(false),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex("projects_site_slug_idx").on(t.site, t.slug)],
);

export const projectVersions = pgTable("project_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id")
    .notNull()
    .references(() => projects.id, { onDelete: "cascade" }),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull().$type<Record<string, unknown>>(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  createdBy: text("created_by"),
});

export const galleries = pgTable(
  "galleries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    site: siteEnum("site").notNull().default("photos"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    coverMediaId: uuid("cover_media_id").references(() => media.id),
    visible: boolean("visible").notNull().default(true),
    /** none | light | strict: image protection policy for this gallery. */
    protection: text("protection").notNull().default("light"),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex("galleries_site_slug_idx").on(t.site, t.slug)],
);

export const galleryItems = pgTable(
  "gallery_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => galleries.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id),
    caption: text("caption"),
    alt: text("alt"),
    hidden: boolean("hidden").notNull().default(false),
    sort: integer("sort").notNull().default(0),
  },
  (t) => [index("gallery_items_gallery_idx").on(t.galleryId, t.sort)],
);

export const musicItems = pgTable("music_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: musicKindEnum("kind").notNull().default("recording"),
  title: text("title").notNull(),
  date: date("date"),
  venue: text("venue"),
  ensemble: text("ensemble"),
  note: text("note"),
  provider: text("provider"),
  embedId: text("embed_id"),
  audioMediaId: uuid("audio_media_id").references(() => media.id),
  coverMediaId: uuid("cover_media_id").references(() => media.id),
  rights: rightsEnum("rights").notNull().default("original"),
  needsReview: boolean("needs_review").notNull().default(false),
  featured: boolean("featured").notNull().default(false),
  visible: boolean("visible").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  ...stamps,
});

export const flightEntries = pgTable("flight_entries", {
  id: uuid("id").primaryKey().defaultRandom(),
  kind: flightKindEnum("kind").notNull().default("milestone"),
  title: text("title").notNull(),
  date: date("date"),
  story: text("story"),
  aircraft: text("aircraft"),
  photoMediaId: uuid("photo_media_id").references(() => media.id),
  /** "Safe to publish" checklist: no real-time location, no tail numbers unless the owner opts in. */
  safeToPublish: boolean("safe_to_publish").notNull().default(false),
  visible: boolean("visible").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  ...stamps,
});

export const aircraft = pgTable("aircraft", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  note: text("note"),
  flown: boolean("flown").notNull().default(true),
  visible: boolean("visible").notNull().default(true),
  sort: integer("sort").notNull().default(0),
  ...stamps,
});

export const pages = pgTable(
  "pages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    site: siteEnum("site").notNull().default("hub"),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    kind: text("kind").notNull().default("page"),
    status: statusEnum("status").notNull().default("draft"),
    ...stamps,
  },
  (t) => [uniqueIndex("pages_site_slug_idx").on(t.site, t.slug)],
);

export const inboxMessages = pgTable("inbox_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  site: siteEnum("site").notNull().default("hub"),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic"),
  message: text("message").notNull(),
  status: inboxStatusEnum("status").notNull().default("new"),
  notes: text("notes"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    actor: text("actor").notNull(),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: text("entity_id"),
    site: siteEnum("site"),
    summary: text("summary"),
    diff: jsonb("diff").$type<Record<string, unknown>>(),
  },
  (t) => [index("audit_at_idx").on(t.at), index("audit_entity_idx").on(t.entity, t.entityId)],
);

export const redirects = pgTable(
  "redirects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    site: siteEnum("site").notNull().default("hub"),
    fromPath: text("from_path").notNull(),
    toPath: text("to_path").notNull(),
    permanent: boolean("permanent").notNull().default(true),
    hits: integer("hits").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("redirects_site_from_idx").on(t.site, t.fromPath)],
);

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  count: integer("count").notNull().default(0),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------------------------------------------------------
 * Phase 3: photography studio (clients, jobs, client galleries, contracts, invoices, payments, bookings).
 * Money is integer cents. Link tokens and passcodes are stored only as hashes. `studio_id` stays nullable and unused.
 * ---------------------------------------------------------------------------------------------------------------- */
export const jobStatusEnum = pgEnum("studio_job_status", [
  "inquiry",
  "booked",
  "shot",
  "editing",
  "delivered",
  "paid",
  "cancelled",
]);
export const clientGalleryStatusEnum = pgEnum("studio_gallery_status", ["draft", "published", "archived"]);
export const accessModeEnum = pgEnum("studio_access_mode", ["passcode", "magic-link", "both"]);
export const downloadPolicyEnum = pgEnum("studio_download_policy", ["none", "preview", "web", "full"]);
export const contractStatusEnum = pgEnum("studio_contract_status", [
  "draft",
  "sent",
  "viewed",
  "signed",
  "declined",
  "void",
]);
export const invoiceStatusEnum = pgEnum("studio_invoice_status", [
  "draft",
  "sent",
  "viewed",
  "partial",
  "paid",
  "void",
  "refunded",
]);
export const paymentStatusEnum = pgEnum("studio_payment_status", ["pending", "succeeded", "failed", "refunded"]);
export const bookingStatusEnum = pgEnum("studio_booking_status", ["new", "converted", "archived"]);

export const studioClients = pgTable(
  "studio_clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    /** Stored lower-cased; unique among live clients. */
    email: text("email").notNull(),
    phone: text("phone"),
    notes: text("notes"),
    tags: jsonb("tags").notNull().$type<string[]>().default(sql`'[]'::jsonb`),
    ...stamps,
  },
  (t) => [uniqueIndex("studio_clients_email_idx").on(t.email).where(sql`${t.deletedAt} is null`)],
);

export const studioJobs = pgTable(
  "studio_jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => studioClients.id),
    title: text("title").notNull(),
    type: text("type").notNull().default("event"),
    date: date("date"),
    location: text("location"),
    status: jobStatusEnum("status").notNull().default("inquiry"),
    feeCents: integer("fee_cents").notNull().default(0),
    notes: text("notes"),
    /** Estimated delivery date shown to the client on the delivery status page. */
    deliveryEta: date("delivery_eta"),
    ...stamps,
  },
  (t) => [index("studio_jobs_client_idx").on(t.clientId), index("studio_jobs_status_idx").on(t.status)],
);

export const studioGalleries = pgTable(
  "studio_galleries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => studioJobs.id),
    title: text("title").notNull(),
    status: clientGalleryStatusEnum("status").notNull().default("draft"),
    accessMode: accessModeEnum("access_mode").notNull().default("passcode"),
    /** scrypt hash "salt:hash" of the passcode. Never the passcode itself. */
    passcodeHash: text("passcode_hash"),
    downloadPolicy: downloadPolicyEnum("download_policy").notNull().default("preview"),
    watermark: boolean("watermark").notNull().default(true),
    coverMediaId: uuid("cover_media_id").references(() => media.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    /** Shown above the photographs (a thank-you, instructions). Per-gallery branding: accent colour too. */
    welcome: text("welcome"),
    accent: text("accent"),
    /** scrypt hash of a PIN that must be entered before any download (optional). */
    downloadPinHash: text("download_pin_hash"),
    /** Most photographs a client may pick (album picks); null = no limit. */
    selectionLimit: integer("selection_limit"),
    selectionSentAt: timestamp("selection_sent_at", { withTimezone: true }),
    allowComments: boolean("allow_comments").notNull().default(true),
    allowRatings: boolean("allow_ratings").notNull().default(true),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    /** When the "your gallery expires soon" email last went out (once per expiry date). */
    expiryReminderAt: timestamp("expiry_reminder_at", { withTimezone: true }),
    reactivatedAt: timestamp("reactivated_at", { withTimezone: true }),
    /** How the client sees the photographs: grid, masonry or rows; dark or light; thumbnail size. */
    layout: text("layout").notNull().default("grid"),
    theme: text("theme").notNull().default("dark"),
    density: text("density").notNull().default("medium"),
    /** Publishes itself (and emails the client) when this time passes. */
    publishAt: timestamp("publish_at", { withTimezone: true }),
    /** Private notes for the studio, never shown to the client. */
    notes: text("notes"),
    /** Protection settings and look (validated in galleries.ts; empty = defaults). */
    security: jsonb("security").$type<Record<string, unknown>>().notNull().default({}),
    style: jsonb("style").$type<Record<string, unknown>>().notNull().default({}),
    /** The gallery's own web address: /g/<slug>. Unique, set by the studio. */
    slug: text("slug"),
    /** passcode: only the client's passcode (/client) | link: anyone with the link | link-passcode: the link plus the passcode. */
    visibility: text("visibility").notNull().default("passcode"),
    /** Shop and proofing settings (validated in gallery-shop.ts; empty = defaults). */
    shop: jsonb("shop").$type<Record<string, unknown>>().notNull().default({}),
    ...stamps,
  },
  (t) => [index("studio_galleries_job_idx").on(t.jobId), uniqueIndex("studio_galleries_slug_idx").on(t.slug)],
);

export const studioGalleryItems = pgTable(
  "studio_gallery_items",
  {
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id),
    sort: integer("sort").notNull().default(0),
    hidden: boolean("hidden").notNull().default(false),
    albumId: uuid("album_id"),
  },
  (t) => [primaryKey({ columns: [t.galleryId, t.mediaId] })],
);

export const studioFavorites = pgTable(
  "studio_favorites",
  {
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.galleryId, t.mediaId] })],
);

export const studioContracts = pgTable(
  "studio_contracts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => studioJobs.id),
    title: text("title").notNull(),
    body: text("body").notNull(),
    status: contractStatusEnum("status").notNull().default("draft"),
    /** sha256 of the signing link token. */
    tokenHash: text("token_hash"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    signedAt: timestamp("signed_at", { withTimezone: true }),
    signerName: text("signer_name"),
    /** one-way hashes only (privacy): sha256(ip + AUTH_SECRET-derived salt) */
    signerIpHash: text("signer_ip_hash"),
    signerUserAgent: text("signer_user_agent"),
    /** sha256 of the exact text that was signed */
    documentSha256: text("document_sha256"),
    /** contract | model-release | property-release | parental-consent | licence */
    kind: text("kind").notNull().default("contract"),
    templateId: uuid("template_id"),
    /** Who or what a release covers (a person, a property). */
    subject: text("subject"),
    minor: boolean("minor").notNull().default(false),
    guardianName: text("guardian_name"),
    signerEmail: text("signer_email"),
    /** ESIGN/UETA: the signer agreed to sign and keep records electronically (captured with the signature). */
    consentElectronic: boolean("consent_electronic").notNull().default(false),
    /** Licence terms granted (personal, commercial, term in months; null = no end). Feeds the usage-rights tracker. */
    usageRights: jsonb("usage_rights").$type<{
      personal: boolean;
      commercial: boolean;
      termMonths: number | null;
    } | null>(),
    licenseExpiresAt: timestamp("license_expires_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [uniqueIndex("studio_contracts_token_idx").on(t.tokenHash), index("studio_contracts_job_idx").on(t.jobId)],
);

export type InvoiceLine = { description: string; amountCents: number };

export const studioInvoices = pgTable(
  "studio_invoices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Human number, e.g. "2026-0001" (unique). */
    number: text("number").notNull(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => studioJobs.id),
    lines: jsonb("lines").notNull().$type<InvoiceLine[]>().default(sql`'[]'::jsonb`),
    currency: text("currency").notNull().default("usd"),
    totalCents: integer("total_cents").notNull().default(0),
    status: invoiceStatusEnum("status").notNull().default("draft"),
    dueDate: date("due_date"),
    /** standard | deposit | balance | installment | recurring | retainer */
    kind: text("kind").notNull().default("standard"),
    planId: uuid("plan_id"),
    installmentNo: integer("installment_no"),
    installmentOf: integer("installment_of"),
    recurringId: uuid("recurring_id"),
    /** Set on a gallery extension or reactivation invoice: paying it extends that gallery. */
    galleryId: uuid("gallery_id"),
    /** sha256 of the payment link token. */
    tokenHash: text("token_hash"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    ...stamps,
  },
  (t) => [
    uniqueIndex("studio_invoices_number_idx").on(t.number),
    uniqueIndex("studio_invoices_token_idx").on(t.tokenHash),
    index("studio_invoices_job_idx").on(t.jobId),
  ],
);

export const studioPayments = pgTable(
  "studio_payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => studioInvoices.id),
    /** "stripe" | "manual" | "mock" */
    provider: text("provider").notNull(),
    /** Provider's id (payment_intent id). Unique per provider: makes webhooks and retries idempotent. */
    providerRef: text("provider_ref").notNull(),
    amountCents: integer("amount_cents").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    receiptRef: text("receipt_ref"),
    raw: jsonb("raw").$type<Record<string, unknown>>(),
    /** Part of `amount_cents` that is a tip or a card surcharge (not credited to the invoice). */
    tipCents: integer("tip_cents").notNull().default(0),
    surchargeCents: integer("surcharge_cents").notNull().default(0),
    /** card | ach | manual | mock */
    method: text("method"),
    refundedCents: integer("refunded_cents").notNull().default(0),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("studio_payments_provider_ref_idx").on(t.provider, t.providerRef),
    index("studio_payments_invoice_idx").on(t.invoiceId),
  ],
);

/**
 * Inquiries (leads). A public inquiry form creates one; the owner converts it to a client and a job. `score` is a 0 to 100
 * explainable lead score (see `scoreLead` in studio.ts); `source` records where the visitor came from.
 */
export const studioBookings = pgTable("studio_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull().default("General"),
  message: text("message").notNull(),
  status: bookingStatusEnum("status").notNull().default("new"),
  clientId: uuid("client_id").references(() => studioClients.id),
  phone: text("phone"),
  shootType: text("shoot_type"),
  eventDate: date("event_date"),
  location: text("location"),
  budget: text("budget"),
  guests: integer("guests"),
  source: text("source"),
  referrer: text("referrer"),
  utm: jsonb("utm").$type<Record<string, string>>(),
  details: jsonb("details").$type<Record<string, string>>(),
  score: integer("score").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Every email the platform sends or would send. `status`: sent (provider accepted), mock (recorded by the labelled
 * outbox, nothing left the machine), skipped (no provider configured in production), failed. Bodies are kept so the
 * studio inbox and the client portal can show the thread.
 */
export const emailLog = pgTable(
  "email_log",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: text("kind").notNull(),
    toEmail: text("to_email").notNull(),
    fromEmail: text("from_email").notNull(),
    replyTo: text("reply_to"),
    subject: text("subject").notNull(),
    bodyText: text("body_text").notNull(),
    bodyHtml: text("body_html"),
    provider: text("provider").notNull(),
    status: text("status").notNull(),
    providerId: text("provider_id"),
    error: text("error"),
    relatedType: text("related_type"),
    relatedId: text("related_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("email_log_to_idx").on(t.toEmail), index("email_log_related_idx").on(t.relatedType, t.relatedId)],
);

/** Provider webhook events already processed (idempotency). */
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Client-gallery view log: one row per (viewer, photograph) per hour. `code` is the 8-hex invisible-watermark code
 * embedded in the served derivative, so a leaked image can be traced to a viewer. Never holds the image itself.
 */
export const studioViewEvents = pgTable(
  "studio_view_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mediaId: uuid("media_id").notNull(),
    viewer: text("viewer").notNull(),
    code: text("code").notNull(),
    ipHash: text("ip_hash"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_view_events_code_idx").on(t.code), index("studio_view_events_media_idx").on(t.mediaId)],
);

/* ------------------------------------------------------------------------------------------------------------------
 * Calendar and booking. Times are timestamptz (UTC); the studio time zone lives in studio_settings ("calendar").
 * `blocked_start`/`blocked_end` are the appointment widened by its buffers and travel time; a Postgres EXCLUDE constraint
 * (added in migration 0006) makes overlapping live appointments impossible even under concurrent requests.
 * ---------------------------------------------------------------------------------------------------------------- */
export const appointmentKindEnum = pgEnum("appointment_kind", ["shoot", "consult", "minislot", "block"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["open", "hold", "confirmed", "cancelled"]);

/** Key/value studio configuration (calendar, deposit, policies...). `value` is validated by zod in code. */
export const studioSettings = pgTable("studio_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().$type<unknown>(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Weekly bookable hours (weekday 0 = Sunday). A day can have several windows. */
export const availabilityRules = pgTable("availability_rules", {
  id: uuid("id").primaryKey().defaultRandom(),
  weekday: integer("weekday").notNull(),
  startMinute: integer("start_minute").notNull(),
  endMinute: integer("end_minute").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const blackoutDates = pgTable("blackout_dates", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull().unique(),
  reason: text("reason"),
});

export const appointments = pgTable(
  "appointments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: appointmentKindEnum("kind").notNull().default("shoot"),
    status: appointmentStatusEnum("status").notNull().default("confirmed"),
    title: text("title").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    bufferBeforeMin: integer("buffer_before_min").notNull().default(0),
    bufferAfterMin: integer("buffer_after_min").notNull().default(0),
    travelMin: integer("travel_min").notNull().default(0),
    blockedStart: timestamp("blocked_start", { withTimezone: true }).notNull(),
    blockedEnd: timestamp("blocked_end", { withTimezone: true }).notNull(),
    location: text("location"),
    notes: text("notes"),
    jobId: uuid("job_id").references(() => studioJobs.id),
    clientId: uuid("client_id").references(() => studioClients.id),
    bookingId: uuid("booking_id").references(() => studioBookings.id),
    invoiceId: uuid("invoice_id").references(() => studioInvoices.id),
    /** Mini-session group: slots created together share a label ("Fall minis, Oct 25"). */
    groupLabel: text("group_label"),
    /** A hold lapses at this time unless the deposit is paid. */
    holdUntil: timestamp("hold_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("appointments_start_idx").on(t.startsAt), index("appointments_job_idx").on(t.jobId)],
);

export const waitlist = pgTable("waitlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  /** A date (YYYY-MM-DD) or a mini-session group label the person is waiting for. */
  wanted: text("wanted").notNull(),
  shootType: text("shoot_type"),
  notifiedAt: timestamp("notified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------------------------------------------------------
 * Commerce: packages, add-ons, quotes and proposals, promo and referral codes, gift cards. Money is integer cents.
 * Every price the owner has not set yet is flagged `isSample` and shown as "$XX" (Q61).
 * ---------------------------------------------------------------------------------------------------------------- */
export type PackageDeliverable = { label: string; value: string };
export type QuoteLine = {
  kind: "package" | "addon" | "fee" | "optional-fee" | "discount";
  description: string;
  qty: number;
  unitCents: number;
  amountCents: number;
  refId?: string;
  /** The standalone price when this line is bundled (shown next to bundles, e.g. an extension that sells for $30). */
  standaloneCents?: number;
};

export const quoteStatusEnum = pgEnum("studio_quote_status", [
  "draft",
  "sent",
  "viewed",
  "accepted",
  "declined",
  "expired",
  "void",
]);

export const studioPackages = pgTable(
  "studio_packages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    tagline: text("tagline"),
    /** What the client gets: coverage hours, edited images, gallery time. Deliverables, never editing hours. */
    deliverables: jsonb("deliverables").notNull().$type<PackageDeliverable[]>().default(sql`'[]'::jsonb`),
    priceCents: integer("price_cents").notNull().default(0),
    /** Mandatory fees included in the headline price (travel inside a radius, booking fee). Shown, never hidden. */
    mandatoryFees: jsonb("mandatory_fees")
      .notNull()
      .$type<{ label: string; cents: number }[]>()
      .default(sql`'[]'::jsonb`),
    /** Add-on slugs bundled into this package (their standalone price is shown beside the bundle). */
    includedAddOns: jsonb("included_add_ons").notNull().$type<string[]>().default(sql`'[]'::jsonb`),
    tier: integer("tier").notNull().default(1),
    featured: boolean("featured").notNull().default(false),
    visible: boolean("visible").notNull().default(true),
    isSample: boolean("is_sample").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex("studio_packages_slug_idx").on(t.slug)],
);

export const studioAddOns = pgTable(
  "studio_add_ons",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    /** The real standalone price, always shown next to bundles. */
    priceCents: integer("price_cents").notNull().default(0),
    unit: text("unit").notNull().default("each"),
    maxQty: integer("max_qty").notNull().default(1),
    /** An optional fee (travel, rush) rather than a product: listed separately from the headline price. */
    isFee: boolean("is_fee").notNull().default(false),
    /** Offered as an upsell on the quote page. */
    upsell: boolean("upsell").notNull().default(true),
    visible: boolean("visible").notNull().default(true),
    isSample: boolean("is_sample").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex("studio_add_ons_slug_idx").on(t.slug)],
);

export const studioPromoCodes = pgTable(
  "studio_promo_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    /** percent | amount | referral (a percent code owned by a referring client). */
    kind: text("kind").notNull().default("percent"),
    percentOff: integer("percent_off"),
    amountOffCents: integer("amount_off_cents"),
    minSubtotalCents: integer("min_subtotal_cents").notNull().default(0),
    maxUses: integer("max_uses"),
    uses: integer("uses").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    active: boolean("active").notNull().default(true),
    referrerClientId: uuid("referrer_client_id").references(() => studioClients.id),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("studio_promo_codes_code_idx").on(t.code)],
);

export const studioGiftCards = pgTable(
  "studio_gift_cards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stored hashed-comparable lowercase code; shown to the buyer once. */
    code: text("code").notNull(),
    initialCents: integer("initial_cents").notNull(),
    balanceCents: integer("balance_cents").notNull(),
    purchaserEmail: text("purchaser_email"),
    recipientName: text("recipient_name"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("studio_gift_cards_code_idx").on(t.code)],
);

export const studioGiftLedger = pgTable("studio_gift_ledger", {
  id: uuid("id").primaryKey().defaultRandom(),
  cardId: uuid("card_id")
    .notNull()
    .references(() => studioGiftCards.id),
  deltaCents: integer("delta_cents").notNull(),
  quoteId: uuid("quote_id"),
  note: text("note"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});

export const studioQuotes = pgTable(
  "studio_quotes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => studioClients.id),
    jobId: uuid("job_id").references(() => studioJobs.id),
    title: text("title").notNull(),
    intro: text("intro"),
    terms: text("terms"),
    status: quoteStatusEnum("status").notNull().default("draft"),
    packageId: uuid("package_id").references(() => studioPackages.id),
    lines: jsonb("lines").notNull().$type<QuoteLine[]>().default(sql`'[]'::jsonb`),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    discountCents: integer("discount_cents").notNull().default(0),
    taxRateBp: integer("tax_rate_bp").notNull().default(0),
    taxCents: integer("tax_cents").notNull().default(0),
    taxLabel: text("tax_label"),
    totalCents: integer("total_cents").notNull().default(0),
    giftCents: integer("gift_cents").notNull().default(0),
    depositCents: integer("deposit_cents").notNull().default(0),
    currency: text("currency").notNull().default("usd"),
    promoCode: text("promo_code"),
    giftCode: text("gift_code"),
    validUntil: timestamp("valid_until", { withTimezone: true }),
    tokenHash: text("token_hash"),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    viewedAt: timestamp("viewed_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    acceptedBy: text("accepted_by"),
    acceptedIpHash: text("accepted_ip_hash"),
    /** SHA-256 of the quote content at acceptance, so later edits cannot change what was agreed. */
    acceptedHash: text("accepted_hash"),
    invoiceId: uuid("invoice_id").references(() => studioInvoices.id),
    isSample: boolean("is_sample").notNull().default(false),
    ...stamps,
  },
  (t) => [index("studio_quotes_client_idx").on(t.clientId), uniqueIndex("studio_quotes_number_idx").on(t.number)],
);

export type StudioQuote = typeof studioQuotes.$inferSelect;

/* ------------------------------------------------------------------------------------------------------------------
 * Contract and release templates (merge fields), and questionnaires. Sample text is labelled "sample only: have a lawyer
 * review" and flagged `is_sample` until the owner edits it.
 * ---------------------------------------------------------------------------------------------------------------- */
export const studioContractTemplates = pgTable(
  "studio_contract_templates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    /** contract | model-release | property-release | parental-consent | licence */
    kind: text("kind").notNull().default("contract"),
    body: text("body").notNull(),
    usageRights: jsonb("usage_rights").$type<{
      personal: boolean;
      commercial: boolean;
      termMonths: number | null;
    } | null>(),
    isSample: boolean("is_sample").notNull().default(true),
    ...stamps,
  },
  (t) => [uniqueIndex("studio_contract_templates_slug_idx").on(t.slug)],
);

export type QuestionField = {
  id: string;
  label: string;
  type: "text" | "longtext" | "choice" | "yesno" | "date";
  required?: boolean;
  options?: string[];
  hint?: string;
};
export const studioQuestionnaires = pgTable(
  "studio_questionnaires",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    fields: jsonb("fields").notNull().$type<QuestionField[]>().default(sql`'[]'::jsonb`),
    isSample: boolean("is_sample").notNull().default(true),
    ...stamps,
  },
  (t) => [uniqueIndex("studio_questionnaires_slug_idx").on(t.slug)],
);

export const studioQuestionnaireSends = pgTable(
  "studio_questionnaire_sends",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    questionnaireId: uuid("questionnaire_id")
      .notNull()
      .references(() => studioQuestionnaires.id),
    clientId: uuid("client_id")
      .notNull()
      .references(() => studioClients.id),
    jobId: uuid("job_id").references(() => studioJobs.id),
    /** A snapshot of the fields at send time, so later edits do not change what was asked. */
    fields: jsonb("fields").notNull().$type<QuestionField[]>(),
    title: text("title").notNull(),
    tokenHash: text("token_hash").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    answers: jsonb("answers").$type<Record<string, string>>(),
  },
  (t) => [uniqueIndex("studio_questionnaire_sends_token_idx").on(t.tokenHash)],
);

export type StudioContractTemplate = typeof studioContractTemplates.$inferSelect;

export const studioRefunds = pgTable("studio_refunds", {
  id: uuid("id").primaryKey().defaultRandom(),
  paymentId: uuid("payment_id")
    .notNull()
    .references(() => studioPayments.id),
  amountCents: integer("amount_cents").notNull(),
  reason: text("reason"),
  /** Provider refund id (re_...), or "manual". */
  providerRef: text("provider_ref"),
  by: text("by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** An instalment plan: one invoice per instalment, the first sent at once, the rest sent as they come due. */
export const studioPaymentPlans = pgTable("studio_payment_plans", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => studioJobs.id),
  name: text("name").notNull(),
  totalCents: integer("total_cents").notNull(),
  count: integer("count").notNull(),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Recurring billing (a retainer, a monthly service): an invoice every `interval_months` until it ends. */
export const studioRecurring = pgTable("studio_recurring", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .references(() => studioJobs.id),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull(),
  intervalMonths: integer("interval_months").notNull().default(1),
  nextRunOn: date("next_run_on").notNull(),
  endsOn: date("ends_on"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/* ------------------------------------------------------------------------------------------------------------------
 * Client portal: accounts (password and/or magic link), one-time login tokens, messages.
 * ---------------------------------------------------------------------------------------------------------------- */
export type PortalPrefs = { galleryReady: boolean; reminders: boolean; news: boolean };
export const clientAccounts = pgTable(
  "client_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => studioClients.id),
    email: text("email").notNull(),
    /** scrypt "salt:hash"; null until the client sets a password (a magic link always works). */
    passwordHash: text("password_hash"),
    prefs: jsonb("prefs")
      .notNull()
      .$type<PortalPrefs>()
      .default(sql`'{"galleryReady":true,"reminders":true,"news":false}'::jsonb`),
    failedAttempts: integer("failed_attempts").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("client_accounts_client_idx").on(t.clientId),
    uniqueIndex("client_accounts_email_idx").on(t.email),
  ],
);

export const clientLoginTokens = pgTable(
  "client_login_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => clientAccounts.id),
    /** magic | reset | invite */
    kind: text("kind").notNull(),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("client_login_tokens_hash_idx").on(t.tokenHash)],
);

export const studioMessages = pgTable(
  "studio_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: uuid("client_id")
      .notNull()
      .references(() => studioClients.id),
    jobId: uuid("job_id").references(() => studioJobs.id),
    /** in = from the client, out = from the studio */
    direction: text("direction").notNull(),
    body: text("body").notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_messages_client_idx").on(t.clientId)],
);

/* ------------------------------------------------------------------------------------------------------------------
 * Galleries v2: albums, proofing (ratings, approvals, comments), download log.
 * ---------------------------------------------------------------------------------------------------------------- */
export const studioAlbums = pgTable(
  "studio_albums",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sort: integer("sort").notNull().default(0),
    /** A sub-album sits under another album of the same gallery (one level of nesting in the studio, any in the schema). */
    parentId: uuid("parent_id"),
    description: text("description"),
    coverMediaId: uuid("cover_media_id"),
    /** scrypt hash of a passcode that unlocks this album; null = open. A locked album's photographs stay hidden until then. */
    passcodeHash: text("passcode_hash"),
    /** Hidden albums are not listed; their photographs still show under "All photos" unless also hidden. */
    hidden: boolean("hidden").notNull().default(false),
  },
  (t) => [index("studio_albums_gallery_idx").on(t.galleryId)],
);

/** A client's rating (1 to 5) and approval per photograph (one row), plus any number of comments. `kind` says which. */
export const studioProofs = pgTable(
  "studio_proofs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id")
      .notNull()
      .references(() => media.id),
    /** rating | approval | comment */
    kind: text("kind").notNull(),
    rating: integer("rating"),
    /** approved | rejected */
    decision: text("decision"),
    body: text("body"),
    /** client | studio */
    author: text("author").notNull().default("client"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_proofs_gallery_idx").on(t.galleryId, t.mediaId)],
);

export const studioDownloadEvents = pgTable(
  "studio_download_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id, { onDelete: "cascade" }),
    mediaId: uuid("media_id"),
    /** web | full | zip-web | zip-full */
    kind: text("kind").notNull(),
    /** Which ZIP part (1-based) for zip kinds. */
    part: integer("part"),
    viewer: text("viewer"),
    ipHash: text("ip_hash"),
    bytes: integer("bytes"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_download_events_gallery_idx").on(t.galleryId)],
);

export type StudioGallery = typeof studioGalleries.$inferSelect;

/* ------------------------------------------------------------------------------------------------------------------
 * Operations: tasks, automation runs (the dedupe log: one run per key, ever), the owner's notification centre.
 * ---------------------------------------------------------------------------------------------------------------- */
export const studioTasks = pgTable(
  "studio_tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    dueOn: date("due_on"),
    notes: text("notes"),
    jobId: uuid("job_id").references(() => studioJobs.id),
    clientId: uuid("client_id").references(() => studioClients.id),
    doneAt: timestamp("done_at", { withTimezone: true }),
    /** Set when an automation or the system made the task. */
    source: text("source"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_tasks_due_idx").on(t.dueOn)],
);

export const studioAutomationRuns = pgTable(
  "studio_automation_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** e.g. `invoice-due:<invoiceId>:2027-03-01`. Unique: a rule never acts twice on the same thing and date. */
    dedupeKey: text("dedupe_key").notNull(),
    rule: text("rule").notNull(),
    entityType: text("entity_type"),
    entityId: text("entity_id"),
    status: text("status").notNull().default("done"),
    detail: text("detail"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("studio_automation_runs_key_idx").on(t.dedupeKey),
    index("studio_automation_runs_rule_idx").on(t.rule),
  ],
);

export const studioNotifications = pgTable(
  "studio_notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** inquiry | payment | contract | quote | message | selection | gallery | booking | system */
    kind: text("kind").notNull(),
    title: text("title").notNull(),
    body: text("body"),
    link: text("link"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_notifications_created_idx").on(t.createdAt)],
);

/** What the page guard noticed while a client had a gallery open (screenshot keys, save, print, devtools, capture attempts), and the locks that followed. */
export const studioSecurityEvents = pgTable(
  "studio_security_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id, { onDelete: "cascade" }),
    viewer: text("viewer").notNull(),
    /** screenshot | save | print | source | devtools | capture | devtools-open | lock | idle */
    kind: text("kind").notNull(),
    combo: text("combo"),
    /** What the studio did about it: logged | warned | locked */
    action: text("action").notNull().default("logged"),
    ipHash: text("ip_hash"),
    /** Only on a lock: the gallery is closed to this viewer (and address) until then. */
    until: timestamp("until", { withTimezone: true }),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_security_events_gallery_idx").on(t.galleryId, t.at)],
);

/* ------------------------------------------------------------------------------------------------------------------
 * Shop: a price list (downloads and prints), orders placed from a gallery, and what each order contains. An order is
 * paid through an invoice (kind "shop"), so payments, receipts and refunds use the one billing path.
 * ---------------------------------------------------------------------------------------------------------------- */
export const studioProducts = pgTable(
  "studio_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** digital-web | digital-full | digital-all | print | canvas | album | card */
    kind: text("kind").notNull(),
    /** For prints: the print lab's product code (see @jerryqiu/prints). */
    sku: text("sku"),
    name: text("name").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull().default(0),
    /** True until the owner has set a real price: the shop shows it as SAMPLE. */
    sample: boolean("sample").notNull().default(true),
    active: boolean("active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [index("studio_products_kind_idx").on(t.kind)],
);

export const studioOrders = pgTable(
  "studio_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    number: text("number").notNull(),
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id),
    invoiceId: uuid("invoice_id").references(() => studioInvoices.id),
    /** pending (awaiting payment) | paid | fulfilled | cancelled | refunded */
    status: text("status").notNull().default("pending"),
    buyerName: text("buyer_name").notNull(),
    buyerEmail: text("buyer_email").notNull(),
    ship: jsonb("ship").$type<Record<string, string>>(),
    subtotalCents: integer("subtotal_cents").notNull().default(0),
    shippingCents: integer("shipping_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull().default(0),
    /** sha256 of the link that opens the buyer's downloads. */
    tokenHash: text("token_hash").notNull(),
    /** Print lab order id once submitted (after payment only). */
    labOrderId: text("lab_order_id"),
    reminderAt: timestamp("reminder_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("studio_orders_number_idx").on(t.number),
    uniqueIndex("studio_orders_token_idx").on(t.tokenHash),
    index("studio_orders_gallery_idx").on(t.galleryId),
  ],
);

export const studioOrderItems = pgTable(
  "studio_order_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => studioOrders.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => studioProducts.id),
    /** Kept so the order still reads right if the price list changes later. */
    kind: text("kind").notNull(),
    name: text("name").notNull(),
    sku: text("sku"),
    mediaId: uuid("media_id"),
    qty: integer("qty").notNull().default(1),
    unitCents: integer("unit_cents").notNull(),
  },
  (t) => [index("studio_order_items_order_idx").on(t.orderId)],
);
export type StudioAlbum = typeof studioAlbums.$inferSelect;
export type StudioProduct = typeof studioProducts.$inferSelect;
export type StudioOrder = typeof studioOrders.$inferSelect;
export type StudioOrderItem = typeof studioOrderItems.$inferSelect;
