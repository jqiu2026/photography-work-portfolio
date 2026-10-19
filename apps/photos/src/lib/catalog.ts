import "server-only";
import { getDb } from "@jerryqiu/db";
import * as com from "@jerryqiu/db/commerce";
import { priceLabel } from "@jerryqiu/db/pricing";

export type PublicPackage = {
  id: string;
  name: string;
  tagline: string | null;
  featured: boolean;
  price: string;
  isSample: boolean;
  deliverables: { label: string; value: string }[];
  fees: string[];
  included: { name: string; standalone: string }[];
};
export type PublicAddOn = {
  name: string;
  description: string | null;
  price: string;
  unit: string;
  isFee: boolean;
  isSample: boolean;
};

/** What the public Packages page shows: the database catalog, or the shipped SAMPLE one before a database exists. Sample prices show as $XX. */
export async function getPublicCatalog(): Promise<{
  packages: PublicPackage[];
  addOns: PublicAddOn[];
  anySample: boolean;
}> {
  const db = getDb();
  let addOns: {
    slug: string;
    name: string;
    description: string | null;
    priceCents: number;
    unit: string;
    isFee: boolean;
    isSample: boolean;
  }[];
  let packages: {
    id: string;
    name: string;
    tagline: string | null;
    featured: boolean;
    priceCents: number;
    isSample: boolean;
    deliverables: { label: string; value: string }[];
    mandatoryFees: { label: string; cents: number }[];
    includedAddOns: string[];
  }[];
  if (db) {
    addOns = await com.listAddOns(db, { publicOnly: true });
    packages = await com.listPackages(db, { publicOnly: true });
  } else {
    const slug = (n: string) =>
      n
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    addOns = com.SAMPLE_CATALOG.addOns.map((a) => ({ ...a, slug: slug(a.name), isSample: true }));
    packages = com.SAMPLE_CATALOG.packages.map((p, i) => ({
      id: `sample-${i}`,
      name: p.name,
      tagline: p.tagline,
      featured: Boolean((p as { featured?: boolean }).featured),
      priceCents: p.priceCents,
      isSample: true,
      deliverables: p.deliverables,
      mandatoryFees: com.SAMPLE_CATALOG.mandatoryFees,
      includedAddOns: p.includedAddOns,
    }));
  }
  const bySlug = new Map(addOns.map((a) => [a.slug, a]));
  return {
    anySample: packages.some((p) => p.isSample) || addOns.some((a) => a.isSample),
    packages: packages.map((p) => ({
      id: p.id,
      name: p.name,
      tagline: p.tagline,
      featured: p.featured,
      price: priceLabel(p.priceCents, p.isSample),
      isSample: p.isSample,
      deliverables: p.deliverables,
      fees: p.mandatoryFees.map((f) => `${f.label} included`),
      included: p.includedAddOns.flatMap((s) => {
        const a = bySlug.get(s);
        return a ? [{ name: a.name, standalone: priceLabel(a.priceCents, a.isSample) }] : [];
      }),
    })),
    addOns: addOns.map((a) => ({
      name: a.name,
      description: a.description,
      price: priceLabel(a.priceCents, a.isSample),
      unit: a.unit,
      isFee: a.isFee,
      isSample: a.isSample,
    })),
  };
}
