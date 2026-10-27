"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button, Field, Input, Select } from "@/components/ui";

type Facets = { instruments: string[]; genres: string[]; difficulties: string[] };
const ANY = "any";

/** Search and filters for the catalog. Plain query parameters, so every filtered view is a shareable link. */
export function CatalogFilters({
  facets,
  current,
  basePath,
}: { facets: Facets; current: Record<string, string | undefined>; basePath: string }) {
  const router = useRouter();
  const [q, setQ] = useState(current.q ?? "");
  const [vals, setVals] = useState({
    instrument: current.instrument ?? ANY,
    genre: current.genre ?? ANY,
    difficulty: current.difficulty ?? ANY,
    sale: current.sale ?? ANY,
    listen: current.listen ?? ANY,
  });
  const set = (k: keyof typeof vals) => (v: string) => setVals((p) => ({ ...p, [k]: v }));
  const opts = (xs: string[], all: string) => [{ value: ANY, label: all }, ...xs.map((x) => ({ value: x, label: x }))];

  function go(next = { q, ...vals }) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(next)) if (v && v !== ANY) sp.set(k, v);
    router.push(sp.size ? `${basePath}?${sp}` : basePath);
  }

  return (
    <form
      className="mu-filters"
      role="search"
      aria-label="Filter compositions"
      onSubmit={(e) => {
        e.preventDefault();
        go();
      }}
    >
      <div className="mu-filters__q">
        <Field label="Search">
          <Input name="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Title, instrument, style" />
        </Field>
      </div>
      <Field label="Instrument">
        <Select
          name="instrument"
          value={vals.instrument}
          onValueChange={set("instrument")}
          options={opts(facets.instruments, "Any instrument")}
        />
      </Field>
      <Field label="Style">
        <Select
          name="genre"
          value={vals.genre}
          onValueChange={set("genre")}
          options={opts(facets.genres, "Any style")}
        />
      </Field>
      <Field label="Difficulty">
        <Select
          name="difficulty"
          value={vals.difficulty}
          onValueChange={set("difficulty")}
          options={opts(facets.difficulties, "Any level")}
        />
      </Field>
      <Field label="Score">
        <Select
          name="sale"
          value={vals.sale}
          onValueChange={set("sale")}
          options={[
            { value: ANY, label: "With or without" },
            { value: "1", label: "For sale" },
          ]}
        />
      </Field>
      <Field label="Recording">
        <Select
          name="listen"
          value={vals.listen}
          onValueChange={set("listen")}
          options={[
            { value: ANY, label: "With or without" },
            { value: "1", label: "Has a recording" },
          ]}
        />
      </Field>
      <div className="mu-row">
        <Button type="submit">Apply</Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setQ("");
            setVals({ instrument: ANY, genre: ANY, difficulty: ANY, sale: ANY, listen: ANY });
            router.push(basePath);
          }}
        >
          Clear
        </Button>
      </div>
    </form>
  );
}
