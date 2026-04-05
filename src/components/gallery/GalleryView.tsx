"use client";

import { useState } from "react";
import { Button, Column, Row, Media, MasonryGrid } from "@once-ui-system/core";
import { gallery } from "@/resources";

export default function GalleryView() {
  const [activeType, setActiveType] = useState<string>("All");

  const filterTypes = ["All", ...new Set(gallery.images.map((image) => image.alt))];
  const filteredImages =
    activeType === "All" ? gallery.images : gallery.images.filter((image) => image.alt === activeType);

  return (
    <Column fillWidth gap="16">
      <Row wrap gap="8">
        {filterTypes.map((type) => (
          <Button
            key={type}
            size="s"
            variant={activeType === type ? "primary" : "secondary"}
            onClick={() => setActiveType(type)}
          >
            {type}
          </Button>
        ))}
      </Row>

      <MasonryGrid columns={2} s={{ columns: 1 }}>
        {filteredImages.map((image, index) => (
          <Media
            enlarge
            priority={index < 10}
            sizes="(max-width: 560px) 100vw, 50vw"
            key={image.src}
            radius="m"
            aspectRatio={image.orientation === "horizontal" ? "16 / 9" : "3 / 4"}
            src={image.src}
            alt={image.alt}
          />
        ))}
      </MasonryGrid>
    </Column>
  );
}