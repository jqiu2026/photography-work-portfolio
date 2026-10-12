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

/** Encrypted third-party connections (ShootProof OAuth tokens). Values are AES-256-GCM, key derived from AUTH_SECRET. */
export const externalConnections = pgTable("external_connections", {
  provider: text("provider").primaryKey(),
  data: text("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Temporarily imported external photos (derivatives only, TTL). Purged by a cron route. */
export const externalCache = pgTable(
  "external_cache",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title"),
    storageKey: text("storage_key").notNull(),
    width: integer("width"),
    height: integer("height"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("external_cache_unique").on(t.provider, t.externalId),
    index("external_cache_expiry_idx").on(t.expiresAt),
  ],
);

/* ------------------------------------------------------------------------------------------------------------------
 * Phase 3: photography studio (clients, jobs, client galleries, contracts, invoices, payments, bookings).
 * Money is integer cents. Link tokens and passcodes are stored only as hashes. `studio_id` stays nullable and unused.
 * ---------------------------------------------------------------------------------------------------------------- */
export const jobStatusEnum = pgEnum("studio_job_status", ["inquiry", "booked", "shot", "editing", "delivered", "paid", "cancelled"]);
export const clientGalleryStatusEnum = pgEnum("studio_gallery_status", ["draft", "published", "archived"]);
export const accessModeEnum = pgEnum("studio_access_mode", ["passcode", "magic-link", "both"]);
export const downloadPolicyEnum = pgEnum("studio_download_policy", ["none", "preview", "web", "full"]);
export const contractStatusEnum = pgEnum("studio_contract_status", ["draft", "sent", "viewed", "signed", "declined", "void"]);
export const invoiceStatusEnum = pgEnum("studio_invoice_status", ["draft", "sent", "viewed", "partial", "paid", "void"]);
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
    ...stamps,
  },
  (t) => [index("studio_galleries_job_idx").on(t.jobId)],
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
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("studio_payments_provider_ref_idx").on(t.provider, t.providerRef), index("studio_payments_invoice_idx").on(t.invoiceId)],
);

export const studioBookings = pgTable("studio_bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull().default("General"),
  message: text("message").notNull(),
  status: bookingStatusEnum("status").notNull().default("new"),
  clientId: uuid("client_id").references(() => studioClients.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Provider webhook events already processed (idempotency). */
export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  provider: text("provider").notNull(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});
