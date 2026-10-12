"use client";

import {
  Accordion,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Container,
  Dialog,
  EmbedFacade,
  Field,
  Footer,
  Grid,
  Header,
  Heading,
  IconButton,
  Input,
  InterestHero,
  Menu,
  Popover,
  Progress,
  ProfileHeader,
  Quote,
  RadioGroup,
  Row,
  Select,
  Separator,
  SiteSwitcher,
  SitePreviewCard,
  Skeleton,
  Slider,
  SkillTags,
  Spinner,
  Stack,
  Stat,
  Switch,
  Tabs,
  Text,
  Textarea,
  Timeline,
  ToastProvider,
  Tooltip,
  TooltipProvider,
  useToast,
  Eyebrow,
  Breadcrumbs,
  Pagination,
  Prose,
  CodeBlock,
  type Preset,
  type Theme,
} from "@placeholder/ui";
import { Bell } from "lucide-react";
import { useState } from "react";

const sites = [
  { id: "hub", name: "Jerry Qiu", description: "About me, my work and writing", url: "#" },
  { id: "photos", name: "Photography", description: "Portfolio and galleries", url: "#" },
  { id: "music", name: "Music", description: "What I play and where to hear it", url: "#" },
  { id: "flying", name: "Flying", description: "How I learned to fly", url: "#" },
];

function ToastDemo() {
  const toast = useToast();
  return (
    <Button variant="ghost" onClick={() => toast("Saved. This is a polite live-region toast.")}>
      Show toast
    </Button>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ padding: "2.5rem 0", borderTop: "1px solid var(--ph-line)" }}>
      <Eyebrow style={{ marginBottom: "1.25rem" }}>{title}</Eyebrow>
      {children}
    </section>
  );
}

export function ComponentGallery() {
  const [preset, setPreset] = useState<Preset>("hub");
  const [theme, setTheme] = useState<Theme>("light");
  const [val, setVal] = useState([40]);
  return (
    <div
      data-preset={preset}
      data-theme={theme}
      className="ph-root"
      style={{ minHeight: 0, borderRadius: 20, border: "1px solid var(--ph-line)", overflow: "hidden" }}
    >
      <ToastProvider>
        <TooltipProvider>
          <Header
            transparentTop={false}
            brand={<SiteSwitcher sites={sites} currentId={preset} />}
            links={[
              { label: "Work", href: "#" },
              { label: "Writing", href: "#" },
              { label: "About", href: "#", current: true },
            ]}
            actions={
              <Button size="sm" variant="solid">
                Connect
              </Button>
            }
          />
          <Container size="md" style={{ paddingBlock: "2rem 4rem" }}>
            <Row gap={3} wrap style={{ marginBottom: "1.5rem" }}>
              <Eyebrow>Preview</Eyebrow>
              {(["hub", "photos", "music", "flying"] as Preset[]).map((p) => (
                <Button key={p} size="sm" variant={p === preset ? "solid" : "ghost"} onClick={() => setPreset(p)}>
                  {p}
                </Button>
              ))}
              <Separator vertical />
              {(["light", "dark"] as Theme[]).map((t) => (
                <Button key={t} size="sm" variant={t === theme ? "solid" : "ghost"} onClick={() => setTheme(t)}>
                  {t}
                </Button>
              ))}
            </Row>

            <Block title="Typography">
              <Stack gap={4}>
                <Heading as="h1" size="display" display>
                  Hello, I'm Jerry.
                </Heading>
                <Heading size="3xl" display>
                  A calm second headline
                </Heading>
                <Text size="lg" tone="muted">
                  Body text is set in the sans face with a comfortable measure. It stays legible at every size and never
                  fights the photographs.
                </Text>
                <Prose>
                  <p>
                    Long-form text uses <a href="#">underlined links</a> and a restrained rhythm.
                  </p>
                  <blockquote>Quotes get a thin accent rule.</blockquote>
                </Prose>
              </Stack>
            </Block>

            <Block title="Buttons">
              <Row gap={3} wrap>
                <Button>Solid</Button>
                <Button variant="accent">Accent</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="quiet">Quiet</Button>
                <Button loading>Loading</Button>
                <Button size="sm">Small</Button>
                <Button size="lg">Large</Button>
                <IconButton label="Notifications">
                  <Bell size={18} />
                </IconButton>
              </Row>
            </Block>

            <Block title="Forms">
              <Grid cols={2} gap={6}>
                <Field label="Your name" hint="As you'd like it to appear.">
                  <Input placeholder="Jerry Qiu" />
                </Field>
                <Field label="Email" error="Please enter a valid email address.">
                  <Input type="email" defaultValue="nope" />
                </Field>
                <Field label="Topic">
                  <Select>
                    <option>Photography</option>
                    <option>Music</option>
                    <option>Flying</option>
                  </Select>
                </Field>
                <Field label="Message">
                  <Textarea placeholder="Say hello" />
                </Field>
                <Stack gap={4}>
                  <Checkbox label="Send me a copy" defaultChecked />
                  <Switch label="Notify me about replies" />
                  <RadioGroup
                    defaultValue="a"
                    aria-label="Contact preference"
                    options={[
                      { value: "a", label: "Email" },
                      { value: "b", label: "Phone" },
                    ]}
                  />
                </Stack>
                <Stack gap={2}>
                  <Text size="sm" tone="muted">
                    Slider: {val[0]}
                  </Text>
                  <Slider label="Demo" value={val} onValueChange={setVal} max={100} />
                </Stack>
              </Grid>
            </Block>

            <Block title="Overlays and feedback">
              <Row gap={3} wrap>
                <Dialog
                  title="A dialog"
                  description="Focus is trapped and Escape closes it."
                  trigger={<Button variant="ghost">Dialog</Button>}
                >
                  <Text>Content goes here.</Text>
                </Dialog>
                <Popover trigger={<Button variant="ghost">Popover</Button>}>
                  <Text size="sm">Small floating panel.</Text>
                </Popover>
                <Menu
                  trigger={<Button variant="ghost">Menu</Button>}
                  items={[{ label: "Edit" }, { label: "Duplicate" }, { label: "Delete", destructive: true }]}
                />
                <Tooltip content="A short hint">
                  <Button variant="quiet">Tooltip</Button>
                </Tooltip>
                <ToastDemo />
                <Spinner />
                <Badge>Draft</Badge>
                <Badge tone="accent">New</Badge>
                <Badge tone="success">Live</Badge>
              </Row>
              <Stack gap={3} style={{ marginTop: "1.5rem", maxWidth: 480 }}>
                <Progress value={62} label="Upload progress" />
                <Skeleton style={{ height: 18 }} />
                <Skeleton style={{ height: 18, width: "70%" }} />
              </Stack>
              <Tabs
                className="x"
                tabs={[
                  { value: "a", label: "Overview", content: <Text>Tab panel one.</Text> },
                  { value: "b", label: "Details", content: <Text>Tab panel two.</Text> },
                ]}
              />
              <Accordion
                items={[
                  { value: "1", title: "Do you take commissions?", content: "TODO(owner): answer in your own words." },
                  { value: "2", title: "How do I get in touch?", content: "Use the Connect page." },
                ]}
              />
            </Block>

            <Block title="Profile and site components">
              <ProfileHeader
                portrait={<Avatar name="Jerry Qiu" size={160} />}
                name="Jerry Qiu"
                headline="TODO(owner): one plain line about what you do."
                location="New York"
                currently="TODO(owner): what you're working on now"
                links={[
                  { label: "LinkedIn", href: "https://www.linkedin.com/in/jqiu2026/", icon: "linkedin" },
                  { label: "Instagram", href: "https://ig.jerryqiu.com", icon: "instagram" },
                  { label: "YouTube", href: "https://www.youtube.com/@jqiu2026", icon: "youtube" },
                  { label: "Email", href: "mailto:hello@jerryqiu.com", icon: "email" },
                ]}
              />
              <div style={{ height: 32 }} />
              <SkillTags tags={["Photography", "Lightroom", "Python", "Part 107"]} />
              <div style={{ height: 32 }} />
              <Timeline
                items={[
                  {
                    title: "Student Teaching Assistant",
                    org: "Monroe YABC",
                    period: "Feb – Jun 2025",
                    summary: "Helped teach a drone piloting class.",
                  },
                  { title: "Stuyvesant High School", period: "to Jun 2026" },
                ]}
              />
              <div style={{ height: 32 }} />
              <Grid min="14rem" gap={6}>
                {sites.slice(1).map((s) => (
                  <SitePreviewCard key={s.id} title={s.name} description={s.description} href="#" />
                ))}
              </Grid>
              <div style={{ height: 32 }} />
              <Row gap={8}>
                <Stat value="23" label="Photos in the portfolio" />
                <Stat value="5" label="Projects" />
              </Row>
              <div style={{ height: 32 }} />
              <Quote cite="TODO(owner): real quote only">Quotes appear only if real ones are supplied.</Quote>
              <div style={{ height: 32 }} />
              <EmbedFacade
                provider="youtube"
                id="aqz-KE-bpKQ"
                title="Click-to-load video (demo: Big Buck Bunny, Blender Foundation, CC BY)"
              />
              <div style={{ height: 32 }} />
              <Card interactive>
                <Text>Interactive card</Text>
              </Card>
              <div style={{ height: 24 }} />
              <Breadcrumbs items={[{ label: "Home", href: "#" }, { label: "Work", href: "#" }, { label: "Project" }]} />
              <Pagination page={2} pages={4} hrefFor={(p) => `#${p}`} />
              <CodeBlock language="ts" code={"const hello = 'world';"} />
            </Block>
          </Container>
          <Footer
            sites={sites}
            currentId={preset}
            social={[
              { label: "Instagram", href: "https://ig.jerryqiu.com", icon: "instagram" },
              { label: "YouTube", href: "https://www.youtube.com/@jqiu2026", icon: "youtube" },
            ]}
            legal={[
              { label: "Privacy", href: "#" },
              { label: "Terms", href: "#" },
              { label: "Licensing", href: "#" },
              { label: "Accessibility", href: "#" },
            ]}
            note="© 2026 Jerry Qiu"
          />
        </TooltipProvider>
      </ToastProvider>
    </div>
  );
}
