declare module "bun:sqlite" {
  export class Database {
    constructor(filename: string, options?: { readonly?: boolean; create?: boolean });
    exec(sql: string): void;
    query<T = Record<string, unknown>>(sql: string): {
      all(...params: unknown[]): T[];
      get(...params: unknown[]): T | null;
      run(...params: unknown[]): void;
    };
    close(): void;
  }
}
