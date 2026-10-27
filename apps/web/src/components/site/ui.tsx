import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  Container as HmContainer,
  Field as HmField,
  type FieldProps,
  type ContainerProps,
  Grid as HmGrid,
  Surface,
  Heading as HmHeading,
  type HeadingProps as HmHeadingProps,
} from "@holominimal/ui";
import Link from "next/link";
import { type CSSProperties, cloneElement, type HTMLAttributes, type ReactElement, type ReactNode } from "react";

/**
 * The site's page-building vocabulary (Container, Section, Heading, Eyebrow, Prose...) on Holominimal. Pages import
 * from here, so a page never names the design system and a later re-skin touches this file and the tokens only.
 */
export {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  DataList,
  DataListItem,
  EmptyState,
  Input,
  PageActions,
  PageDescription,
  PageEyebrow,
  PageHeader,
  PageTitle,
  Select,
  Separator,
  Status,
  Step,
  Stepper,
  Surface,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tag,
  Text,
  Textarea,
} from "@holominimal/ui";

/** Holominimal's Field, plus `required`: the control is marked required and the label gets a quiet asterisk. */
export function Field({ required, label, children, ...rest }: FieldProps & { required?: boolean }) {
  return (
    <HmField
      {...rest}
      label={
        required ? (
          <>
            {label}{" "}
            <span aria-hidden="true" style={{ color: "var(--hm-muted)" }}>
              *
            </span>
          </>
        ) : (
          label
        )
      }
    >
      {required ? cloneElement(children as ReactElement<Record<string, unknown>>, { required: true }) : children}
    </HmField>
  );
}

export function Container({ size, ...rest }: Omit<ContainerProps, "size"> & { size?: ContainerProps["size"] }) {
  return <HmContainer size={size ?? "lg"} {...rest} />;
}

export function Section({
  tone,
  style,
  ...rest
}: HTMLAttributes<HTMLElement> & { tone?: "surface"; style?: CSSProperties }) {
  return (
    <section
      {...rest}
      data-tone={tone}
      style={{
        paddingBlock: "clamp(2rem, 5vw, 4rem)",
        ...(tone ? { background: "var(--hm-surface)" } : null),
        ...style,
      }}
    />
  );
}

type Size = "display" | "4xl" | HmHeadingProps["size"];
export function Heading({
  size,
  display: _display,
  ...rest
}: Omit<HmHeadingProps, "size"> & { size?: Size; display?: boolean }) {
  const s = size === "display" || size === "4xl" ? "3xl" : size;
  return <HmHeading {...rest} size={s} />;
}

export function Eyebrow(props: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...props} className={["hm-eyebrow", props.className].filter(Boolean).join(" ")} />;
}

export function Prose(props: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={["hm-prose", props.className].filter(Boolean).join(" ")} />;
}

export function Grid({
  cols,
  gap,
  ...rest
}: { cols?: number; gap?: number; children?: ReactNode; style?: CSSProperties }) {
  return <HmGrid columns={cols} gap={gap ? `${gap}px` : undefined} {...rest} />;
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <Breadcrumb>
      {items.map((i) => (
        <BreadcrumbItem key={i.label}>
          {i.href ? (
            <BreadcrumbLink asChild>
              <Link href={i.href}>{i.label}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{i.label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
}

/**
 * The answer to a form: an error (role alert, Holominimal's field-error style) or a confirmation (role status). A
 * paragraph, so it sits under the button it answers. `className` lets older screens keep their hook (`st-error`).
 */
export function FormMessage({
  ok,
  children,
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement> & { ok?: boolean }) {
  if (!children) return null;
  return (
    <p
      {...rest}
      role={ok ? "status" : "alert"}
      className={[ok ? "hm-field-hint pm-ok" : "hm-field-error", className].filter(Boolean).join(" ")}
    >
      {children}
    </p>
  );
}

/** The end of a client document flow (signed, paid, answers sent): a quiet card with a title and what happened. */
export function ResultCard({
  eyebrow,
  title,
  message,
  tone = "success",
  level = 1,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  message?: ReactNode;
  tone?: "success" | "neutral";
  level?: 1 | 2;
  children?: ReactNode;
}) {
  const H = level === 1 ? "h1" : "h2";
  return (
    <Surface variant="outlined" padding="lg" className="pm-stack pm-result" data-tone={tone} role="status">
      {eyebrow ? <p className="hm-eyebrow">{eyebrow}</p> : null}
      <H className="pm-doc-title">{title}</H>
      {message ? <p className="pm-result__msg">{message}</p> : null}
      {children}
    </Surface>
  );
}
