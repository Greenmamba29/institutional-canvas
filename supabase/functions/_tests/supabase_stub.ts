export const logged: unknown[] = [];
export function createClient() { return { from: () => ({ insert: async (row: unknown) => { logged.push(row); return { error: null }; } }) }; }
