import { Eyebrow } from "@halation/ui";
import { RevealText } from "@halation/ui/motion";
import { ShaderHero } from "@halation/ui/webgl";
import type { ReactNode } from "react";

export function Hero({
  src,
  srcSet,
  alt,
  children,
}: { src: string; srcSet?: string; alt: string; children?: ReactNode }) {
  return (
    <div className="hl-hero">
      <ShaderHero src={src} srcSet={srcSet} sizes="100vw" alt={alt} className="hl-hero__frame" intensity={1.1}>
        <div className="hl-hero__inner">
          <Eyebrow>Jerry Qiu · New York</Eyebrow>
          <RevealText as="h1" text="Photography" className="hl-heading hl-heading--display" delay={0.1} />
          {children}
        </div>
      </ShaderHero>
    </div>
  );
}
