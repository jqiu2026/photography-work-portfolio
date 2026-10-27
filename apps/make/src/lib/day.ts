/** "2026-10-27" from a Date or the ISO string it becomes after passing through the data cache. */
export const day = (d: Date | string) => new Date(d).toISOString().slice(0, 10);
