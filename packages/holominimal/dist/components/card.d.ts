import type { ElementType, HTMLAttributes } from "react";
import { type SurfaceProps } from "./surface";
export type CardProps = SurfaceProps;
/**
 * A titled block of content. Defaults to the studio's flat `section` material (a hairline above, no box); pass
 * `variant="outlined" | "elevated" | "glass" | "holo"` for a contained card.
 *
 *   <Card aria-labelledby="up"><CardHeader><CardTitle id="up">Upcoming</CardTitle><a href="/cal">Calendar</a></CardHeader>
 *     <CardContent>...</CardContent></Card>
 */
export declare function Card({ as, className, ...rest }: CardProps): import("react").JSX.Element;
/** Title row: the title on the left, a quiet link or meta on the right. */
export declare function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export declare function CardTitle({ as: As, className, ...rest }: HTMLAttributes<HTMLHeadingElement> & {
    as?: ElementType;
}): import("react").JSX.Element;
export declare function CardDescription({ className, ...rest }: HTMLAttributes<HTMLParagraphElement>): import("react").JSX.Element;
export declare function CardContent({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
export declare function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>): import("react").JSX.Element;
