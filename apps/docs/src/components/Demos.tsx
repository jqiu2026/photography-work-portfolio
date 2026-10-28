"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertTitle,
  Animate,
  Badge,
  Button,
  Card,
  CardHeader,
  CardTitle,
  Checkbox,
  Container,
  CountUp,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Field,
  Heading,
  IconButton,
  Inline,
  Input,
  Kbd,
  Marquee,
  Progress,
  Segment,
  SegmentedControl,
  Select,
  Skeleton,
  Slider,
  Spinner,
  Stack,
  Stat,
  Tab,
  TabList,
  TabPanel,
  Tabs,
  Text,
  Textarea,
  Toggle,
  Tooltip,
  Typewriter,
  useToast,
} from "@holominimal/ui";
import { Plus } from "lucide-react";
import type { ReactNode } from "react";

function ToastDemo() {
  const { toast } = useToast();
  return <Button onClick={() => toast({ title: "Saved", tone: "success" })}>Show a toast</Button>;
}

const demos: Record<string, () => ReactNode> = {
  Container: () => (
    <Container size="sm" style={{ border: "1px dashed var(--hm-line-strong)", padding: "1rem" }}>
      A small container
    </Container>
  ),
  Stack: () => (
    <Stack gap={2}>
      <Badge>One</Badge>
      <Badge>Two</Badge>
      <Badge>Three</Badge>
    </Stack>
  ),
  Inline: () => (
    <Inline gap={2}>
      <Badge>One</Badge>
      <Badge>Two</Badge>
      <Badge>Three</Badge>
    </Inline>
  ),
  Heading: () => <Heading level={2}>Galleries</Heading>,
  Text: () => (
    <Stack gap={1}>
      <Text>Default text</Text>
      <Text tone="muted">Muted text</Text>
      <Text eyebrow>Eyebrow</Text>
    </Stack>
  ),
  Kbd: () => (
    <Text>
      Press <Kbd>⌘</Kbd> <Kbd>K</Kbd>
    </Text>
  ),
  Button: () => (
    <Inline gap={2}>
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Delete</Button>
      <Button loading>Saving</Button>
    </Inline>
  ),
  IconButton: () => (
    <IconButton aria-label="Add">
      <Plus size={18} />
    </IconButton>
  ),
  SegmentedControl: () => (
    <SegmentedControl defaultValue="day" aria-label="Range">
      <Segment value="day">Day</Segment>
      <Segment value="week">Week</Segment>
      <Segment value="month">Month</Segment>
    </SegmentedControl>
  ),
  Toggle: () => <Toggle aria-label="Bold">B</Toggle>,
  Field: () => (
    <Field label="Email" hint="We never share it." error="That doesn't look like an email address.">
      <Input type="email" defaultValue="nope" />
    </Field>
  ),
  Input: () => (
    <Field label="Name">
      <Input placeholder="Ada" />
    </Field>
  ),
  Textarea: () => (
    <Field label="Message">
      <Textarea autoGrow />
    </Field>
  ),
  Select: () => (
    <Field label="Size">
      <Select
        name="size"
        defaultValue="m"
        options={[
          { value: "s", label: "Small" },
          { value: "m", label: "Medium" },
          { value: "l", label: "Large" },
        ]}
      />
    </Field>
  ),
  Checkbox: () => (
    <Stack gap={2}>
      <Checkbox label="Show captions" defaultChecked />
      <Checkbox label="Notify me" appearance="switch" />
    </Stack>
  ),
  Slider: () => <Slider aria-label="Volume" defaultValue={40} />,
  Badge: () => (
    <Inline gap={2}>
      <Badge>Draft</Badge>
      <Badge tone="success">Live</Badge>
      <Badge tone="warning">Expiring</Badge>
      <Badge tone="danger">Closed</Badge>
    </Inline>
  ),
  Alert: () => (
    <Alert tone="info">
      <AlertTitle>Backups run nightly</AlertTitle>
    </Alert>
  ),
  Progress: () => <Progress value={40} aria-label="Upload" />,
  Spinner: () => <Spinner label="Loading" />,
  Skeleton: () => <Skeleton width="60%" height="20px" />,
  ToastProvider: () => <ToastDemo />,
  Card: () => (
    <Card>
      <CardHeader>
        <CardTitle>Reyes family</CardTitle>
      </CardHeader>
    </Card>
  ),
  Stat: () => <Stat label="Revenue, 30 days" value="$14,755" detail="Up 12%" trend="up" />,
  EmptyState: () => <EmptyState>No galleries yet. Make one from a shoot.</EmptyState>,
  Tabs: () => (
    <Tabs defaultValue="a">
      <TabList aria-label="Gallery sections">
        <Tab value="a">Photos</Tab>
        <Tab value="b">Albums</Tab>
      </TabList>
      <TabPanel value="a">Photos panel</TabPanel>
      <TabPanel value="b">Albums panel</TabPanel>
    </Tabs>
  ),
  Accordion: () => (
    <Accordion type="single" collapsible>
      <AccordionItem value="1">
        <AccordionTrigger>What do you deliver?</AccordionTrigger>
        <AccordionContent>A private gallery with full-size downloads.</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
  Dialog: () => (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary">Open a dialog</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>Delete this gallery?</DialogTitle>
        <Text tone="muted">Clients lose access straight away.</Text>
      </DialogContent>
    </Dialog>
  ),
  Tooltip: () => (
    <Tooltip content="Copy the link">
      <Button variant="secondary">Hover me</Button>
    </Tooltip>
  ),
  Animate: () => (
    <Animate animation="fade-up" trigger="view">
      <Text>Rises into place</Text>
    </Animate>
  ),
  Typewriter: () => <Typewriter text={["photographs", "music", "flights"]} loop />,
  CountUp: () => <CountUp value={240} />,
  Marquee: () => (
    <Marquee>
      <Text>Photography · Music · Flying · Make ·</Text>
    </Marquee>
  ),
};

export const hasDemo = (name: string) => name in demos;
export function Demo({ name }: { name: string }) {
  const D = demos[name];
  return D ? <div className="docs-demo">{D()}</div> : null;
}
