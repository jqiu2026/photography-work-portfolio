import { Flex, Meta, Schema } from "@once-ui-system/core";
import GalleryView from "@/components/gallery/GalleryView";
import { baseURL, gallery, person } from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: gallery.title,
    description: gallery.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(gallery.title)}`,
    path: gallery.path,
  });
}

async function getShootproofImages() {
  const res = await fetch(
    "https://photos.jerryqiu.com/gallery/c30c33e0-811e-418d-9fe8-0caff7e33b34/data?cr=1",
    { cache: "no-store" }
  );

  const data = await res.json();

  return data.photos.map((photo: any) => ({
    src: `https://d2rxqglyhdohqf.cloudfront.net/ph/${photo.key}/l/${photo.id}.jpg`,
    alt: "",
    orientation: photo.w > photo.g ? "horizontal" : "vertical"
  }));
}

export default async function Gallery() {
  const images = await getShootproofImages();

  return (
    <Flex maxWidth="l">
      <Schema
        as="webPage"
        baseURL={baseURL}
        title={gallery.title}
        description={gallery.description}
        path={gallery.path}
        image={`/api/og/generate?title=${encodeURIComponent(gallery.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}${gallery.path}`,
          image: `${baseURL}${person.avatar}`,
        }}
      />

      <GalleryView images={images} />
    </Flex>
  );
}