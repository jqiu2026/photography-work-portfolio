/** Key-value storage behind every mock. Browser: localStorage. Tests and server rendering: memory. */
export interface MockStore {
  get<T>(key: string, fallback: T): T;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
}

export class MemoryStore implements MockStore {
  private data = new Map<string, string>();
  get<T>(key: string, fallback: T): T {
    const raw = this.data.get(key);
    if (raw === undefined) return fallback;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  }
  set<T>(key: string, value: T) {
    this.data.set(key, JSON.stringify(value));
  }
  remove(key: string) {
    this.data.delete(key);
  }
}

/** localStorage with a prefix, wrapped in try/catch (it can be blocked or throw). Falls back to memory. */
export class LocalStore implements MockStore {
  private fallback = new MemoryStore();
  constructor(private prefix = "mock:") {}
  private ok() {
    try {
      return typeof localStorage !== "undefined";
    } catch {
      return false;
    }
  }
  get<T>(key: string, fallback: T): T {
    if (!this.ok()) return this.fallback.get(key, fallback);
    try {
      const raw = localStorage.getItem(this.prefix + key);
      return raw === null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return this.fallback.get(key, fallback);
    }
  }
  set<T>(key: string, value: T) {
    this.fallback.set(key, value);
    if (!this.ok()) return;
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {}
  }
  remove(key: string) {
    this.fallback.remove(key);
    if (!this.ok()) return;
    try {
      localStorage.removeItem(this.prefix + key);
    } catch {}
  }
}

let n = 0;
/** Short readable ids for mock records (never used for security). */
export function mockId(prefix: string): string {
  n += 1;
  return `${prefix}_${Date.now().toString(36)}${n.toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
