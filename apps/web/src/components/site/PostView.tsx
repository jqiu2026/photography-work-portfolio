import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from "@holominimal/ui";
import { Container, Eyebrow, Heading, Section, Text } from "@/components/kit";
import type { ReactNode } from "react";
import { RenderMarkdown } from "@jerryqiu/render";

export type PostData = {
  title: string;
  subtitle?: string | null;
  body: string;
  publishedAt?: Date | null;
  author: string;
  cover?: ReactNode;
};

const fmt = (d: Date) => d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

/** The article layout, shared by the public writing page (database posts) and the admin preview. */
export function PostView({ post }: { post: PostData }) {
  return (
    <>
      <Container size="md" style={{ paddingTop: "clamp(2rem, 6vw, 4rem)" }}>
        <Breadcrumb>
          <BreadcrumbItem>
            <BreadcrumbLink href="/writing">Writing</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>{post.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </Breadcrumb>
        <Eyebrow style={{ margin: "2.5rem 0 1rem" }}>
          {post.publishedAt ? fmt(post.publishedAt) : "Draft"} · {post.author}
        </Eyebrow>
        <Heading as="h1" size="4xl" display>
          {post.title}
        </Heading>
        {post.subtitle ? (
          <Text size="xl" tone="muted" style={{ marginTop: "1.25rem", fontStyle: "italic" }}>
            {post.subtitle}
          </Text>
        ) : null}
      </Container>
      {post.cover ? (
        <div className="work-detail__hero" style={{ marginTop: "3rem" }}>
          {post.cover}
        </div>
      ) : null}
      <Section>
        <Container size="sm">
          <RenderMarkdown source={post.body} />
        </Container>
      </Section>
    </>
  );
}
