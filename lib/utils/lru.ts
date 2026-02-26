export class LruCache<K, V> {
  private readonly cache = new Map<K, V>();

  private readonly maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = Number.isFinite(maxSize) && maxSize > 0 ? Math.floor(maxSize) : 1;
  }

  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      return undefined;
    }

    const value = this.cache.get(key) as V;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    this.cache.set(key, value);

    if (this.cache.size > this.maxSize) {
      const oldestKey = this.cache.keys().next().value as K;
      this.cache.delete(oldestKey);
    }
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  keys(): K[] {
    return [...this.cache.keys()];
  }

  size(): number {
    return this.cache.size;
  }
}
