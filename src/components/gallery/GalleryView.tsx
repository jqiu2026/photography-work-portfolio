"use client";

import { Media, MasonryGrid, RevealFx } from "@once-ui-system/core";

export default function GalleryView({ images }: any) {
  const columns = 2;
  return (
    <MasonryGrid columns={columns} s={{ columns: 1 }}>
      {images.map((image: any, index: number) => (
        <RevealFx delay={((index % Math.ceil(images.length / 2)) * 0.12) + (Math.floor(index / Math.ceil(images.length / 2)) * 0.12)}>
        <Media
          enlarge
          priority={index < 10}
          sizes="(max-width: 560px) 100vw, 50vw"
          key={index}
          radius="m"
          aspectRatio={image.orientation === "horizontal" ? "16 / 9" : "3 / 4"}
          src={image.src}
          alt={image.alt}
        />
        </RevealFx>
      ))}
    </MasonryGrid>
  );
}