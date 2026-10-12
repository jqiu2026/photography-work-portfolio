import { Column, Heading, Meta, Schema, TypeFx, RevealFx } from "@once-ui-system/core";
import { Mailchimp } from "@/components";
import { Posts } from "@/components/blog/Posts";
import { baseURL, blog, person, newsletter} from "@/resources";

export async function generateMetadata() {
  return Meta.generate({
    title: blog.title,
    description: blog.description,
    baseURL: baseURL,
    image: `/api/og/generate?title=${encodeURIComponent(blog.title)}`,
    path: blog.path,
  });
}

export default function Blog() {
  return (
    <Column maxWidth="m" paddingTop="24">
      <Schema
        as="blogPosting"
        baseURL={baseURL}
        title={blog.title}
        description={blog.description}
        path={blog.path}
        image={`/api/og/generate?title=${encodeURIComponent(blog.title)}`}
        author={{
          name: person.name,
          url: `${baseURL}/blog`,
          image: `${baseURL}${person.avatar}`,
        }}
      />
      <Heading marginBottom="l" variant="heading-strong-xl" align="center">
        <TypeFx center="true" 
        words={blog.description}
        trigger="instant"
        speed={25}
        />
      </Heading>
      <Column fillWidth flex={1} gap="40">
        <RevealFx center delay={0}>
        <Posts range={[1, 1]} thumbnail />
        </RevealFx>
        <RevealFx center delay={0.1}>
        <Posts range={[2, 3]} columns="2" thumbnail direction="column" />
        </RevealFx>
        <Mailchimp marginBottom="l" />
        <RevealFx center delay={0.2}>
        <Heading as="h2" variant="heading-strong-xl" marginLeft="l">
          Earlier posts
        </Heading>
        <Posts range={[4]} columns="2" />
        </RevealFx>
      </Column>
    </Column>
  );
}
