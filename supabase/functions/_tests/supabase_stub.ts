// Minimal supabase-js stand-in: records every write so tests can inspect it.
export const logged: unknown[] = [];
export const writes: { table: string; op: string; row?: unknown; eq?: [string, unknown] }[] = [];
export function createClient() {
  return {
    from: (table: string) => ({
      insert: async (row: unknown) => {
        logged.push(row);
        writes.push({ table, op: 'insert', row });
        return { error: null };
      },
      update: (row: unknown) => ({
        eq: async (col: string, val: unknown) => {
          writes.push({ table, op: 'update', row, eq: [col, val] });
          return { error: null };
        },
      }),
      delete: () => ({
        eq: async (col: string, val: unknown) => {
          writes.push({ table, op: 'delete', eq: [col, val] });
          return { error: null };
        },
      }),
    }),
  };
}
