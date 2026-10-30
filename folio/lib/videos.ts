/**
 * The videos on the Videos page, newest first. Add one object per video:
 *   { title: "...", note: "one line, optional", src: "/videos/file.mp4", poster: "/videos/file.jpg" }   a file in `public/videos`
 *   { title: "...", note: "...", youtube: "VIDEO_ID" }                                                  loads only when play is pressed
 */
export type Video = { title: string; note?: string; src?: string; poster?: string; youtube?: string };
export const VIDEOS: Video[] = [];
