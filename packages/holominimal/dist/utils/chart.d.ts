export type Point = [x: number, y: number];
/**
 * An SVG path through the points. `smooth` uses monotone cubic interpolation (the curve never overshoots the data, so
 * a flat run stays flat and a peak is never drawn higher than its value).
 */
export declare function chartPath(points: Point[], smooth?: boolean): string;
/** Scales values into a `width` by `height` box (y grows downward), padding the top so the line never touches the edge. */
export declare function scalePoints(values: number[], width: number, height: number, pad?: number, floor?: number): Point[];
/** Arc segments of a donut: each gets its share of 100 (a circle drawn with `pathLength={100}`) and a start offset. */
export declare function donutSegments(values: number[], gap?: number): Array<{
    start: number;
    length: number;
    share: number;
}>;
