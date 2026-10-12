import { Eyebrow } from "@placeholder/ui";
import { RevealText } from "@placeholder/ui/motion";
import { ShaderHero } from "@placeholder/ui/webgl";
import type { ReactNode } from "react";

export function Hero({
  src,
  srcSet,
  alt,
  children,
}: { src: string; srcSet?: string; alt: string; children?: ReactNode }) {
  return (
    <div className="ph-hero">
      <ShaderHero src={src} srcSet={srcSet} sizes="100vw" alt={alt} className="ph-hero__frame" intensity={1.1}>
        <div className="ph-hero__inner">
          <Eyebrow>Jerry Qiu · New York</Eyebrow>
          <RevealText as="h1" text="Photography" className="ph-heading ph-heading--display" delay={0.1} />
          {children}
        </div>
      </ShaderHero>
    </div>
  );
}
