import NextLink from "next/link";
import { Button } from "@/components/site/ui";

export default function NotFound() {
  return (
    <div className="hb-wrap" style={{ paddingBlock: "6rem" }}>
      <h1 style={{ margin: "0 0 1rem", fontSize: "clamp(2.5rem, 7vw, 4.5rem)" }}>Not found</h1>
      <p className="hb-lede">That page doesn't exist, or it moved.</p>
      <Button asChild>
        <NextLink href="/">Back home</NextLink>
      </Button>
    </div>
  );
}
