import { AsyncLocalStorage } from 'node:async_hooks';

/**
 * Who is making the current request, available anywhere in the server without
 * passing it through every function. Set by RequestContextInterceptor for every
 * signed-in store request; empty for public pages and background work.
 */
export interface RequestContext {
  businessId: string;
  userId: string;
  storeRole: string;
  /** Branch new phones, sales, repairs and quotes are filed under. */
  writeBranchId: string | null;
  /** When set, lists and lookups only show this branch's records. */
  readBranchId: string | null;
}

const storage = new AsyncLocalStorage<RequestContext>();

export const requestContext = {
  run<T>(ctx: RequestContext, fn: () => T): T {
    return storage.run(ctx, fn);
  },
  get(): RequestContext | undefined {
    return storage.getStore();
  },
  /**
   * Runs a check across the whole store, ignoring the branch filter. Used for
   * things that must be store-wide: duplicate IMEIs, device limits, numbering.
   */
  //
  // Database lookups only run when awaited, so the await must happen inside the
  // wrapper: these helpers are async and await the work themselves.
  async storeWide<T>(fn: () => T | PromiseLike<T>): Promise<T> {
    const ctx = storage.getStore();
    if (!ctx || !ctx.readBranchId) return await fn();
    return storage.run({ ...ctx, readBranchId: null }, async () => await fn());
  },
  /** Runs work with no store context at all (e.g. platform-wide lookups). */
  async outside<T>(fn: () => T | PromiseLike<T>): Promise<T> {
    return storage.exit(async () => await fn());
  },
};
