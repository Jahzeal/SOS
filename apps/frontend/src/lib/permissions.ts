/**
 * What each store role can see and do in the app. The server enforces the same
 * rules on every request; this only decides what to show, so nobody is offered
 * a button that would be refused.
 */
export type StoreRole = 'OWNER' | 'MANAGER' | 'SALES' | 'TECHNICIAN';

export const ROLE_LABELS: Record<StoreRole, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  SALES: 'Sales staff',
  TECHNICIAN: 'Technician',
};

export const ROLE_DESCRIPTIONS: Record<StoreRole, string> = {
  OWNER: 'Everything, including billing and staff.',
  MANAGER: 'Runs the shop: stock, sales, repairs, reports and profit. Can add sales staff and technicians.',
  SALES: 'Registers phones, sells, issues receipts and serves customers. Cannot see cost prices or profit.',
  TECHNICIAN: 'Handles repairs and checks devices. Cannot sell or see prices.',
};

export type Permission =
  | 'sell' // receipts, invoices, quotes, checkout
  | 'registerDevices'
  | 'editDevices' // change or delete device records, invoices and quotes
  | 'seeCosts' // cost prices, profit, margins
  | 'reports'
  | 'manageStaff'
  | 'storeSettings'
  | 'billing'
  | 'manageBranches';

const RULES: Record<Permission, StoreRole[]> = {
  sell: ['OWNER', 'MANAGER', 'SALES'],
  registerDevices: ['OWNER', 'MANAGER', 'SALES'],
  editDevices: ['OWNER', 'MANAGER'],
  seeCosts: ['OWNER', 'MANAGER'],
  reports: ['OWNER', 'MANAGER'],
  manageStaff: ['OWNER', 'MANAGER'],
  storeSettings: ['OWNER', 'MANAGER'],
  billing: ['OWNER'],
  manageBranches: ['OWNER'],
};

/** Accounts created before roles existed have no storeRole: they are the store owner. */
export function storeRoleOf(user: { storeRole?: string | null; role?: string } | null | undefined): StoreRole {
  const role = String(user?.storeRole || 'OWNER').toUpperCase();
  return (['OWNER', 'MANAGER', 'SALES', 'TECHNICIAN'].includes(role) ? role : 'OWNER') as StoreRole;
}

export function can(user: { storeRole?: string | null; role?: string } | null | undefined, permission: Permission): boolean {
  if (user?.role === 'ADMIN') return true;
  return RULES[permission].includes(storeRoleOf(user));
}
