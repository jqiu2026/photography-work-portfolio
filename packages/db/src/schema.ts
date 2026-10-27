import { sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  bigserial,
  boolean,
  date,
  doublePrecision,
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
export const roleEnum = pgEnum("role", ["owner", "editor", "client", "bookkeeper", "photographer"]);
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
    /** A team member invited by the owner who signs in with any verified Google account (not only the Workspace domain). */
    external: boolean("external").notNull().default(false),
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
  /** the piece this recording or performance is of (null for an item that is not tied to a catalog entry) */
  workId: uuid("work_id").references((): AnyPgColumn => musicWorks.id),
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
    /** Mailing address, free text. */
    address: text("address"),
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
    /** Shown above the photographs (a thank-you, instructions). Per-gallery branding: accent color too. */
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
    /** The date of the shoot or event, and the date client orders are due (both optional). */
    shootDate: date("shoot_date"),
    orderDueDate: date("order_due_date"),
    /** Visitors give their email address before they can view the gallery. */
    emailRequired: boolean("email_required").notNull().default(false),
    /** Archive the gallery by itself when its expiry date passes. */
    autoArchive: boolean("auto_archive").notNull().default(false),
    /** passcode: only the client's passcode (/client) | link: anyone with the link can view and shop (proofing stays with the passcode). */
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
    /** contract | model-release | property-release | parental-consent | license */
    kind: text("kind").notNull().default("contract"),
    templateId: uuid("template_id"),
    /** Who or what a release covers (a person, a property). */
    subject: text("subject"),
    minor: boolean("minor").notNull().default(false),
    guardianName: text("guardian_name"),
    signerEmail: text("signer_email"),
    /** ESIGN/UETA: the signer agreed to sign and keep records electronically (captured with the signature). */
    consentElectronic: boolean("consent_electronic").notNull().default(false),
    /** License terms granted (personal, commercial, term in months; null = no end). Feeds the usage-rights tracker. */
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
    /** null: works on any quote or gallery order. Set: only for that gallery's shop. */
    galleryId: uuid("gallery_id").references(() => studioGalleries.id, { onDelete: "cascade" }),
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
    /** Extra details the owner adds to a quote (venue, event date, headcount...), shown on the quote. */
    fields: jsonb("fields").notNull().$type<{ label: string; value: string }[]>().default(sql`'[]'::jsonb`),
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
    /** contract | model-release | property-release | parental-consent | license */
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
 * Operations: tasks, automation runs (the dedupe log: one run per key, ever), the owner's notification center.
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
    /** How this viewer got into the gallery, in words (passcode, an email they typed, a portal sign-in). */
    via: text("via"),
    /** Browser and system, in a few words. */
    device: text("device"),
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
    /** The price sheet this product belongs to (null = the default sheet). */
    sheetId: uuid("sheet_id"),
    ...stamps,
  },
  (t) => [index("studio_products_kind_idx").on(t.kind)],
);

/** A named price list. A gallery picks one; the default sheet is used when it does not. */
export const studioPriceSheets = pgTable("studio_price_sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  isDefault: boolean("is_default").notNull().default(false),
  ...stamps,
});

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

/* ------------------------------------------------------------------------------------------------------------------
 * Gallery extras: visitors who gave their email, free-download rules, watermarks, music, plan charges.
 * ---------------------------------------------------------------------------------------------------------------- */
export const studioVisitors = pgTable(
  "studio_visitors",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    name: text("name"),
    visits: integer("visits").notNull().default(1),
    firstAt: timestamp("first_at", { withTimezone: true }).notNull().defaultNow(),
    lastAt: timestamp("last_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("studio_visitors_gallery_email_idx").on(t.galleryId, t.email)],
);

export const studioWatermarks = pgTable("studio_watermarks", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** text | image */
  kind: text("kind").notNull().default("text"),
  text: text("text"),
  /** Storage key of an uploaded PNG (kind image). */
  imageKey: text("image_key"),
  /** center | bottom-right | bottom-left | top-right | top-left | tile */
  position: text("position").notNull().default("bottom-right"),
  opacity: integer("opacity").notNull().default(45),
  /** Width of the mark as a percent of the picture's width. */
  sizePct: integer("size_pct").notNull().default(22),
  isDefault: boolean("is_default").notNull().default(false),
  ...stamps,
});

/** Who may download what for free: a size, a limit per visitor, an optional watermark and PIN, for a whole gallery or one album. */
export const studioDownloadRules = pgTable(
  "studio_download_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    galleryId: uuid("gallery_id")
      .notNull()
      .references(() => studioGalleries.id, { onDelete: "cascade" }),
    albumId: uuid("album_id"),
    name: text("name").notNull(),
    /** original | high (80% of full size) | low (50%) | social (longest side 1920 px) | preview (watermarked) | custom (maxPx). */
    preset: text("preset").notNull().default("custom"),
    /** Longest side in pixels for the custom size; null = the original file. */
    maxPx: integer("max_px"),
    /** The big centered words on a preview download. */
    previewText: text("preview_text"),
    /** Most downloads per visitor under this rule; null = unlimited. */
    perVisitor: integer("per_visitor"),
    watermarkId: uuid("watermark_id"),
    pinHash: text("pin_hash"),
    /** A license the visitor must accept before downloading. */
    printRelease: text("print_release"),
    showAll: boolean("show_all").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_download_rules_gallery_idx").on(t.galleryId)],
);

export const studioTracks = pgTable("studio_tracks", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  artist: text("artist"),
  storageKey: text("storage_key").notNull(),
  mime: text("mime").notNull().default("audio/mpeg"),
  bytes: integer("bytes").notNull().default(0),
  ...stamps,
});

/** What the studio is billed for its own plan (the owner's Full Frame plan is comped at 100% off, so its charges are $0). */
export const studioPlanCharges = pgTable("studio_plan_charges", {
  id: uuid("id").primaryKey().defaultRandom(),
  description: text("description").notNull(),
  amountCents: integer("amount_cents").notNull().default(0),
  /** paid | free | failed */
  status: text("status").notNull().default("paid"),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
});
export type StudioVisitor = typeof studioVisitors.$inferSelect;
export type StudioWatermark = typeof studioWatermarks.$inferSelect;
export type StudioDownloadRule = typeof studioDownloadRules.$inferSelect;
export type StudioTrack = typeof studioTracks.$inferSelect;
export type StudioPriceSheet = typeof studioPriceSheets.$inferSelect;

/* ------------------------------------------------------------------------------------------------------------------
 * Business operations: expenses and mileage, testimonials with recorded consent, gear, call sheets.
 * ---------------------------------------------------------------------------------------------------------------- */
export const studioExpenses = pgTable(
  "studio_expenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** expense | mileage */
    kind: text("kind").notNull().default("expense"),
    spentOn: date("spent_on").notNull(),
    category: text("category").notNull().default("other"),
    description: text("description").notNull().default(""),
    vendor: text("vendor"),
    /** What it cost (for mileage: miles times the rate that was in force on the day, so old entries never change). */
    amountCents: integer("amount_cents").notNull().default(0),
    /** Tenths of a mile (mileage only). */
    tenthMiles: integer("tenth_miles"),
    rateCentsPerMile: integer("rate_cents_per_mile"),
    jobId: uuid("job_id").references(() => studioJobs.id),
    /** Where the paper or file receipt is kept (free text until receipt uploads are switched on). */
    receiptNote: text("receipt_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_expenses_date_idx").on(t.spentOn)],
);

export const studioTestimonials = pgTable("studio_testimonials", {
  id: uuid("id").primaryKey().defaultRandom(),
  clientId: uuid("client_id").references(() => studioClients.id),
  jobId: uuid("job_id").references(() => studioJobs.id),
  /** How the person wants to be named in public ("Maria R.", "A parent"). */
  displayName: text("display_name").notNull(),
  role: text("role"),
  quote: text("quote").notNull(),
  /** When and how they agreed to it being public. A testimonial cannot be published without this. */
  consentAt: timestamp("consent_at", { withTimezone: true }),
  consentNote: text("consent_note"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const studioGear = pgTable("studio_gear", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** camera | lens | light | drone | audio | other */
  kind: text("kind").notNull().default("other"),
  notes: text("notes"),
  retiredAt: timestamp("retired_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** One piece of gear is on one job on one day (a second job that day is a warning, not a block). */
export const studioGearUses = pgTable(
  "studio_gear_uses",
  {
    gearId: uuid("gear_id")
      .notNull()
      .references(() => studioGear.id, { onDelete: "cascade" }),
    jobId: uuid("job_id")
      .notNull()
      .references(() => studioJobs.id, { onDelete: "cascade" }),
    onDate: date("on_date").notNull(),
  },
  (t) => [primaryKey({ columns: [t.gearId, t.jobId, t.onDate] }), index("studio_gear_uses_date_idx").on(t.onDate)],
);

export const studioCallSheets = pgTable("studio_call_sheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: uuid("job_id")
    .notNull()
    .unique()
    .references(() => studioJobs.id, { onDelete: "cascade" }),
  callTime: text("call_time"),
  location: text("location"),
  notes: text("notes"),
  /** Shot list: [{ text, done }] */
  shots: jsonb("shots").$type<{ text: string; done: boolean }[]>().notNull().default([]),
  /** People on the day: [{ name, role, phone }] */
  contacts: jsonb("contacts").$type<{ name: string; role: string; phone: string }[]>().notNull().default([]),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export type StudioExpense = typeof studioExpenses.$inferSelect;
export type StudioTestimonial = typeof studioTestimonials.$inferSelect;
export type StudioGearRow = typeof studioGear.$inferSelect;
export type StudioCallSheet = typeof studioCallSheets.$inferSelect;

/** Newsletter list with double opt-in. Tokens are stored as hashes; an address counts only once it is confirmed. */
export const studioSubscribers = pgTable(
  "studio_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Stored lower-cased. */
    email: text("email").notNull(),
    /** sha256 of the one token used for both the confirm and the unsubscribe links. */
    tokenHash: text("token_hash").notNull(),
    source: text("source"),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("studio_subscribers_email_idx").on(t.email),
    uniqueIndex("studio_subscribers_token_idx").on(t.tokenHash),
  ],
);
export type StudioSubscriber = typeof studioSubscribers.$inferSelect;

/**
 * Who added what, and when, for the things a team member may take back within a few minutes. A photographer can remove
 * what they added in the last 5 minutes (a slip) and nothing else; the owner can remove anything.
 */
export const studioCreated = pgTable(
  "studio_created",
  {
    entity: text("entity").notNull(),
    entityId: text("entity_id").notNull(),
    byEmail: text("by_email").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.entity, t.entityId] })],
);

/**
 * "Please remove me from a photograph": someone who appears in a published photograph asks for it to come down. The
 * studio tracks each request until the photographs are hidden and the person is told.
 */
export const studioPrivacyRequests = pgTable("studio_privacy_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  /** Where they saw it (a page address) and which photograph or event, in their words. */
  details: text("details").notNull(),
  /** open | done | declined */
  status: text("status").notNull().default("open"),
  /** What the studio did or why it said no (kept for the record, never shown publicly). */
  resolution: text("resolution"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  handledAt: timestamp("handled_at", { withTimezone: true }),
});
export type StudioPrivacyRequest = typeof studioPrivacyRequests.$inferSelect;

/** Endpoints that get a signed message when something happens in the studio (an inquiry, a payment, a gallery going live). */
export const studioWebhooks = pgTable("studio_webhooks", {
  id: uuid("id").primaryKey().defaultRandom(),
  url: text("url").notNull(),
  /** Shown once when the endpoint is made; messages are signed with it (HMAC-SHA256). */
  secret: text("secret").notNull(),
  events: jsonb("events").$type<string[]>().notNull().default([]),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});
export const studioWebhookDeliveries = pgTable(
  "studio_webhook_deliveries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    webhookId: uuid("webhook_id")
      .notNull()
      .references(() => studioWebhooks.id, { onDelete: "cascade" }),
    event: text("event").notNull(),
    status: integer("status"),
    error: text("error"),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("studio_webhook_deliveries_hook_idx").on(t.webhookId, t.at)],
);
export type StudioWebhook = typeof studioWebhooks.$inferSelect;

/** Keys for the owner's read-only REST API (`/api/v1`). Only a hash is kept; the key itself is shown once when made. */
export const studioApiKeys = pgTable("studio_api_keys", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  /** The first characters of the key, so the owner can tell keys apart. */
  prefix: text("prefix").notNull(),
  keyHash: text("key_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});
export type StudioApiKey = typeof studioApiKeys.$inferSelect;

/*
 * Music: the catalog, the score store, buyers, licenses, commissions and the newsletter (apps/music). Prices are cents.
 * A work is a piece of music; a product is something sold about it (a score at a license tier, or a bundle).
 */
export const workStatusEnum = pgEnum("music_work_status", ["draft", "published"]);
export const workRightsEnum = pgEnum("music_work_rights", [
  "original",
  "public-domain-arrangement",
  "arrangement-copyrighted",
]);
export const scoreFileKindEnum = pgEnum("music_file_kind", [
  "full-score",
  "parts",
  "piano-reduction",
  "midi",
  "practice-audio",
  "other",
]);
export const productKindEnum = pgEnum("music_product_kind", ["score", "bundle"]);
export const licenseTierEnum = pgEnum("music_license_tier", ["personal", "ensemble", "institution"]);
export const musicOrderStatusEnum = pgEnum("music_order_status", ["pending", "paid", "refunded", "canceled"]);
export const commissionStatusEnum = pgEnum("music_commission_status", [
  "new",
  "talking",
  "accepted",
  "declined",
  "done",
]);

export const musicWorks = pgTable(
  "music_works",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    year: integer("year"),
    /** the forces as written on the score, for example "2 trumpets, horn, trombone" */
    forces: text("forces"),
    /** searchable instrument tags, lowercase, for example ["trombone", "brass quartet"] */
    instruments: jsonb("instruments").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    genre: text("genre"),
    difficulty: text("difficulty"),
    durationSec: integer("duration_sec"),
    summary: text("summary"),
    programNote: text("program_note"),
    rightsType: workRightsEnum("rights_type").notNull().default("original"),
    /** a license for an arrangement of a copyrighted work is on file: unlocks the store for that piece */
    licenseOnFile: boolean("license_on_file").notNull().default(false),
    licenseNote: text("license_note"),
    status: workStatusEnum("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    coverMediaId: uuid("cover_media_id").references(() => media.id),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex("music_works_slug_idx").on(t.slug), index("music_works_status_idx").on(t.status, t.sort)],
);

/** A deliverable file of a work: the full score, parts, a reduction, MIDI or practice audio. Stored privately. */
export const musicScoreFiles = pgTable(
  "music_score_files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    workId: uuid("work_id")
      .notNull()
      .references(() => musicWorks.id),
    kind: scoreFileKindEnum("kind").notNull().default("full-score"),
    label: text("label").notNull(),
    filename: text("filename").notNull(),
    mime: text("mime").notNull().default("application/pdf"),
    storageKey: text("storage_key").notNull(),
    bytes: integer("bytes").notNull().default(0),
    pages: integer("pages"),
    /** free preview: the first pages are shown to everyone, never the file itself */
    previewPages: integer("preview_pages").notNull().default(2),
    version: integer("version").notNull().default(1),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [index("music_score_files_work_idx").on(t.workId, t.sort)],
);

export const musicProducts = pgTable(
  "music_products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    kind: productKindEnum("kind").notNull().default("score"),
    /** null for a bundle */
    workId: uuid("work_id").references(() => musicWorks.id),
    title: text("title").notNull(),
    description: text("description"),
    tier: licenseTierEnum("tier").notNull().default("personal"),
    priceCents: integer("price_cents").notNull(),
    /** which files the buyer gets; empty means every file of the work */
    fileIds: jsonb("file_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    active: boolean("active").notNull().default(true),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [index("music_products_work_idx").on(t.workId)],
);

export const musicBundleItems = pgTable(
  "music_bundle_items",
  {
    bundleId: uuid("bundle_id")
      .notNull()
      .references(() => musicProducts.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => musicProducts.id),
  },
  (t) => [primaryKey({ columns: [t.bundleId, t.productId] })],
);

export const musicBuyers = pgTable(
  "music_buyers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("music_buyers_email_idx").on(t.email)],
);

/** One-time sign-in links for the buyer library. Only a hash of the token is stored. */
export const musicBuyerLinks = pgTable(
  "music_buyer_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    buyerId: uuid("buyer_id")
      .notNull()
      .references(() => musicBuyers.id),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("music_buyer_links_hash_idx").on(t.tokenHash)],
);

export const musicOrders = pgTable(
  "music_orders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    seq: bigserial("seq", { mode: "number" }).notNull(),
    buyerId: uuid("buyer_id").references(() => musicBuyers.id),
    email: text("email").notNull(),
    holderName: text("holder_name").notNull(),
    /** the ensemble or institution a non-personal license names */
    organization: text("organization"),
    status: musicOrderStatusEnum("status").notNull().default("pending"),
    subtotalCents: integer("subtotal_cents").notNull(),
    discountCents: integer("discount_cents").notNull().default(0),
    feeCents: integer("fee_cents").notNull().default(0),
    totalCents: integer("total_cents").notNull(),
    currency: text("currency").notNull().default("usd"),
    provider: text("provider"),
    providerRef: text("provider_ref"),
    /** the link in the receipt email: opens the order and its downloads without signing in */
    accessTokenHash: text("access_token_hash").notNull(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    refundedAt: timestamp("refunded_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("music_orders_seq_idx").on(t.seq),
    uniqueIndex("music_orders_access_idx").on(t.accessTokenHash),
    index("music_orders_buyer_idx").on(t.buyerId),
  ],
);

export const musicOrderLines = pgTable(
  "music_order_lines",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => musicOrders.id),
    productId: uuid("product_id")
      .notNull()
      .references(() => musicProducts.id),
    workId: uuid("work_id").references(() => musicWorks.id),
    title: text("title").notNull(),
    tier: licenseTierEnum("tier").notNull(),
    priceCents: integer("price_cents").notNull(),
    fileIds: jsonb("file_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
  },
  (t) => [index("music_order_lines_order_idx").on(t.orderId)],
);

/** A license issued when an order is paid: one per work delivered. Revoked on refund. */
export const musicLicenses = pgTable(
  "music_licenses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseNo: text("license_no").notNull(),
    orderId: uuid("order_id")
      .notNull()
      .references(() => musicOrders.id),
    orderLineId: uuid("order_line_id")
      .notNull()
      .references(() => musicOrderLines.id),
    buyerId: uuid("buyer_id").references(() => musicBuyers.id),
    workId: uuid("work_id")
      .notNull()
      .references(() => musicWorks.id),
    tier: licenseTierEnum("tier").notNull(),
    holder: text("holder").notNull(),
    organization: text("organization"),
    fileIds: jsonb("file_ids").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    downloadLimit: integer("download_limit").notNull().default(10),
    issuedAt: timestamp("issued_at", { withTimezone: true }).notNull().defaultNow(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("music_licenses_no_idx").on(t.licenseNo), index("music_licenses_buyer_idx").on(t.buyerId)],
);

export const musicDownloads = pgTable(
  "music_downloads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    licenseId: uuid("license_id")
      .notNull()
      .references(() => musicLicenses.id),
    fileId: uuid("file_id")
      .notNull()
      .references(() => musicScoreFiles.id),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("music_downloads_license_idx").on(t.licenseId)],
);

export const musicCommissions = pgTable("music_commissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  organization: text("organization"),
  forces: text("forces"),
  occasion: text("occasion"),
  deadline: date("deadline"),
  budget: text("budget"),
  message: text("message").notNull(),
  status: commissionStatusEnum("status").notNull().default("new"),
  ownerNote: text("owner_note"),
  ipHash: text("ip_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Newsletter with double opt-in: a subscriber counts only once `confirmedAt` is set. */
export const musicSubscribers = pgTable(
  "music_subscribers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    tokenHash: text("token_hash").notNull(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("music_subscribers_email_idx").on(t.email)],
);

/*
 * Make (apps/make): a curated showcase of a few projects with write-ups, screenshots checked before they show, and a
 * "now" log. The studio's vocabulary (bench, shelf, scrap bin, tool wall) is a styling layer over these plain fields.
 */
export const makeStatusEnum = pgEnum("make_project_status", ["building", "shipped", "archived"]);

export const makeProjects = pgTable(
  "make_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    summary: text("summary"),
    /** Markdown: what it is, how it works, what I learned. */
    body: text("body"),
    status: makeStatusEnum("status").notNull().default("building"),
    year: integer("year"),
    role: text("role"),
    stack: jsonb("stack").$type<string[]>().notNull().default(sql`'[]'::jsonb`),
    links: jsonb("links")
      .$type<{ label: string; url: string; kind: "demo" | "source" | "writeup" | "other" }[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    /** what went wrong or what I would do differently: shown on the scrap bin and at the end of a write-up */
    lessons: text("lessons"),
    published: boolean("published").notNull().default(false),
    sort: integer("sort").notNull().default(0),
    ...stamps,
  },
  (t) => [uniqueIndex("make_projects_slug_idx").on(t.slug), index("make_projects_pub_idx").on(t.published, t.sort)],
);

/** A screenshot. It is only shown publicly once `reviewed` is ticked: someone looked for secrets and member data. */
export const makeImages = pgTable(
  "make_images",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => makeProjects.id),
    storageKey: text("storage_key").notNull(),
    mime: text("mime").notNull().default("image/webp"),
    width: integer("width"),
    height: integer("height"),
    alt: text("alt").notNull().default(""),
    caption: text("caption"),
    reviewed: boolean("reviewed").notNull().default(false),
    cover: boolean("cover").notNull().default(false),
    sort: integer("sort").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("make_images_project_idx").on(t.projectId, t.sort)],
);

export const makeNow = pgTable("make_now", {
  id: uuid("id").primaryKey().defaultRandom(),
  body: text("body").notNull(),
  projectId: uuid("project_id").references(() => makeProjects.id),
  visible: boolean("visible").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

/*
 * Flying (apps/flying): airports the owner has been to and past flights. A flight stores NO registration (tail number) and no
 * live position: only the airports, the date it landed (shown to the month, and only 7+ days later), the aircraft TYPE and a note.
 */
export const flyingAirports = pgTable(
  "flying_airports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    lat: doublePrecision("lat").notNull(),
    lon: doublePrecision("lon").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("flying_airports_code_idx").on(t.code)],
);

export const flyingFlights = pgTable(
  "flying_flights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromCode: text("from_code").notNull(),
    toCode: text("to_code").notNull(),
    landedOn: date("landed_on").notNull(),
    aircraftType: text("aircraft_type"),
    note: text("note"),
    visible: boolean("visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => [index("flying_flights_landed_idx").on(t.landedOn)],
);
