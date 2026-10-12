"use client";

import {
  Accordion, Avatar, Badge, BrandIcon, Breadcrumbs, Button, Card, Checkbox, CodeBlock, Container, Dialog, DialogClose, EmbedFacade, Eyebrow, Field, Grid,
  Heading, IconButton, Input, Link, Menu, Pagination, Popover, Progress, ProfileHeader, Prose, Quote, RadioGroup, Row,
  Section, Select, Separator, Sheet, SkillTags, Skeleton, Slider, SocialLinks, Spinner, Stack, Stat, Switch, Table, TableOfContents, Tabs,
  Text, Textarea, Timeline, ToastProvider, Tooltip, useToast, VisuallyHidden,
} from "@halation/ui";
import { Gallery, Image, ProtectedImage, type ImageAsset } from "@halation/ui/media";
import { InView, Parallax, RevealText, TiltCard } from "@halation/ui/motion";
import type { ReactNode } from "react";
import manifest from "../../public/demo/manifest.json";

const m = manifest as Record<string, ImageAsset>;
const imgs = ["g1", "g2", "g3", "g2", "g1", "g3"].map((k, i) => ({ ...m[k], alt: `Generated gradient ${i + 1}` }));
const links = [{ label: "Instagram", href: "https://example.com", icon: "instagram" }, { label: "GitHub", href: "https://example.com", icon: "github" }, { label: "Email", href: "mailto:a@example.com", icon: "email" }];
const Box = ({ children }: { children?: ReactNode }) => <div style={{ padding: "1rem", border: "1px dashed var(--hl-line)", borderRadius: 4 }}>{children ?? "Content"}</div>;
function ToastBtn() {
  const toast = useToast();
  return <Button onClick={() => toast("Saved")}>Show toast</Button>;
}

const demos: Record<string, () => ReactNode> = {
  Container: () => <Container size="sm"><Box>Centered, max 40rem</Box></Container>,
  Stack: () => <Stack gap={3}><Box>One</Box><Box>Two</Box><Box>Three</Box></Stack>,
  Row: () => <Row gap={3} justify="between"><Box>Left</Box><Box>Right</Box></Row>,
  Grid: () => <Grid min="9rem" gap={3}>{[1, 2, 3, 4].map((n) => <Box key={n}>{n}</Box>)}</Grid>,
  Section: () => <Section tone="surface" style={{ padding: "2rem" }}>A surface section</Section>,
  Heading: () => <Stack><Heading as="h3" size="display" display>Display</Heading><Heading as="h3" size="2xl">Heading 2xl</Heading></Stack>,
  Text: () => <Stack><Text>Default body text.</Text><Text tone="muted">Muted text.</Text><Text tone="accent">Accent text.</Text></Stack>,
  Eyebrow: () => <Eyebrow>Selected work</Eyebrow>,
  Link: () => <Row><Link href="/about">Internal</Link><Link href="https://example.com">External</Link></Row>,
  Separator: () => <Separator />,
  VisuallyHidden: () => <Button><VisuallyHidden>Open menu</VisuallyHidden>☰</Button>,
  Prose: () => <Prose><h2>A heading</h2><p>Body copy with a <a href="#x">link</a>.</p><blockquote>A quote.</blockquote></Prose>,
  Button: () => <Row wrap><Button>Solid</Button><Button variant="accent">Accent</Button><Button variant="ghost">Ghost</Button><Button variant="quiet">Quiet</Button><Button loading>Loading</Button></Row>,
  IconButton: () => <IconButton label="Star" variant="ghost">★</IconButton>,
  Field: () => <Field label="Email" hint="We reply by email." error="Please enter a valid address."><Input defaultValue="nope" /></Field>,
  Input: () => <Field label="Name"><Input placeholder="Ada Lovelace" /></Field>,
  Textarea: () => <Field label="Message"><Textarea /></Field>,
  Select: () => <Field label="Topic"><Select><option>Photography</option><option>Music</option></Select></Field>,
  Checkbox: () => <Checkbox label="Send me a copy" defaultChecked />,
  Switch: () => <Switch label="Notify me" />,
  RadioGroup: () => <RadioGroup aria-label="Contact" defaultValue="a" options={[{ value: "a", label: "Email" }, { value: "b", label: "Phone" }]} />,
  Slider: () => <Slider label="Volume" defaultValue={[40]} />,
  Dialog: () => <Dialog title="A dialog" description="Focus is trapped; Escape closes." trigger={<Button>Open dialog</Button>}><DialogClose asChild><Button variant="ghost">Close</Button></DialogClose></Dialog>,
  Sheet: () => <Sheet title="A sheet" trigger={<Button>Open sheet</Button>}><Text>Panel content</Text></Sheet>,
  DialogClose: () => <Dialog title="Confirm" trigger={<Button>Open</Button>}><DialogClose asChild><Button>Cancel</Button></DialogClose></Dialog>,
  Popover: () => <Popover trigger={<Button variant="ghost">Popover</Button>}><Text size="sm">Small floating panel.</Text></Popover>,
  Tooltip: () => <Tooltip content="A short hint"><Button variant="ghost">Hover or focus</Button></Tooltip>,
  Menu: () => <Menu trigger={<Button variant="ghost">Actions</Button>} items={[{ label: "Edit" }, { label: "Delete", destructive: true }]} />,
  Tabs: () => <Tabs tabs={[{ value: "a", label: "One", content: "Panel one" }, { value: "b", label: "Two", content: "Panel two" }]} />,
  Accordion: () => <Accordion items={[{ value: "1", title: "Question one", content: "Answer one." }, { value: "2", title: "Question two", content: "Answer two." }]} />,
  ToastProvider: () => <ToastProvider><ToastBtn /></ToastProvider>,
  Spinner: () => <Spinner />,
  Skeleton: () => <Stack gap={2}><Skeleton style={{ height: 16 }} /><Skeleton style={{ height: 16, width: "60%" }} /></Stack>,
  Badge: () => <Row><Badge>Draft</Badge><Badge tone="accent">New</Badge><Badge tone="success">Live</Badge><Badge tone="danger">Error</Badge></Row>,
  Progress: () => <Progress value={62} label="Upload progress" />,
  TableOfContents: () => <TableOfContents items={[{ id: "a", label: "Section A" }, { id: "b", label: "Section B" }]} />,
  Breadcrumbs: () => <Breadcrumbs items={[{ label: "Work", href: "#" }, { label: "Project" }]} />,
  Pagination: () => <Pagination page={2} pages={4} hrefFor={(p) => `#${p}`} />,
  Card: () => <Grid min="12rem" gap={3}><Card>Static card</Card><Card interactive as="a" href="#x">Interactive card</Card></Grid>,
  Avatar: () => <Row><Avatar name="Ada Lovelace" /><Avatar name="Grace Hopper" size={64} /></Row>,
  Stat: () => <Row gap={8}><Stat value="23" label="Photos" /><Stat value="5" label="Projects" /></Row>,
  Quote: () => <Quote cite="Someone, who said it">A real quote goes here.</Quote>,
  CodeBlock: () => <CodeBlock code={"const hello = 'world';"} language="ts" />,
  Table: () => <Table><thead><tr><th scope="col">Name</th><th scope="col">Role</th></tr></thead><tbody><tr><td>Ada</td><td>Engineer</td></tr></tbody></Table>,
  BrandIcon: () => <Row>{["github", "instagram", "youtube", "linkedin", "spotify"].map((n) => <BrandIcon key={n} name={n} size={24} />)}</Row>,
  SocialLinks: () => <SocialLinks links={links} />,
  SkillTags: () => <SkillTags tags={["Python", "Lightroom", "Figma"]} />,
  ProfileHeader: () => <ProfileHeader name="Ada Lovelace" nameAs="h3" nameSize="3xl" headline="Mathematician and writer." location="London" links={links} portrait={<Avatar name="Ada Lovelace" size={96} />} />,
  Timeline: () => <Timeline items={[{ title: "Role", org: "Company", period: "2025", summary: "What I did." }, { title: "School", period: "2021 to 2025" }]} />,
  EmbedFacade: () => <div style={{ maxWidth: 420 }}><EmbedFacade provider="youtube" id="aqz-KE-bpKQ" title="Demo video (Big Buck Bunny, Blender Foundation, CC BY)" /></div>,
  InView: () => <InView><Card>Lifts into place once.</Card></InView>,
  RevealText: () => <RevealText text="Words rise out of a quiet mask." as="h3" className="hl-heading hl-heading--display" />,
  Parallax: () => <div style={{ maxWidth: 480 }}><Parallax speed={0.2}><Image asset={m.g3} alt="" sizes="480px" /></Parallax></div>,
  TiltCard: () => <div style={{ maxWidth: 280 }}><TiltCard><Card interactive>Tilts toward the mouse.</Card></TiltCard></div>,
  Image: () => <div style={{ maxWidth: 420 }}><Image asset={m.g1} alt="A generated blue gradient" sizes="420px" /></div>,
  Gallery: () => <Gallery images={imgs} rowHeight={140} />,
  ProtectedImage: () => <div style={{ maxWidth: 360 }}><ProtectedImage asset={m.g3} alt="A generated green gradient" sizes="360px" /></div>,
};

export function hasDemo(name: string) {
  return name in demos;
}

export function Demo({ name }: { name: string }) {
  const render = demos[name];
  return render ? <div className="docs-demo">{render()}</div> : null;
}
