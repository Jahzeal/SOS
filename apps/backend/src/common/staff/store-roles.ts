/**
 * Store roles and what each plan allows. One place for the rules, used by the
 * server guards, staff invites and the seat checks at sign-in.
 */
export const STORE_ROLES = ['OWNER', 'MANAGER', 'SALES', 'TECHNICIAN'] as const;
export type StoreRoleName = (typeof STORE_ROLES)[number];

export const ROLE_LABELS: Record<StoreRoleName, string> = {
  OWNER: 'Owner',
  MANAGER: 'Manager',
  SALES: 'Sales staff',
  TECHNICIAN: 'Technician',
};

/** Roles that must not see cost prices or profit. */
export const ROLES_WITHOUT_COSTS: StoreRoleName[] = ['SALES', 'TECHNICIAN'];

/** Roles an owner may give staff on each plan (the owner role itself is never given). */
export function assignableRolesForPlan(planCode: string | null | undefined): StoreRoleName[] {
  const code = String(planCode || '').toUpperCase();
  if (code.startsWith('STARTER')) return ['SALES', 'TECHNICIAN'];
  if (code.startsWith('GOLD') || code.startsWith('BUSINESS') || code.startsWith('ENTERPRISE')) return ['MANAGER', 'SALES', 'TECHNICIAN'];
  return []; // Free: the owner works alone
}

/** Fallback limits if a plan row has no value (0 = unlimited). Matches the migration defaults. */
export function defaultLimits(planCode: string | null | undefined): { maxStaff: number; maxBranches: number } {
  const code = String(planCode || '').toUpperCase();
  if (code.startsWith('STARTER')) return { maxStaff: 3, maxBranches: 1 };
  if (code.startsWith('GOLD') || code.startsWith('BUSINESS')) return { maxStaff: 10, maxBranches: 2 };
  if (code.startsWith('ENTERPRISE')) return { maxStaff: 0, maxBranches: 0 };
  return { maxStaff: 1, maxBranches: 1 };
}

/** Who may give which role: an owner can give any staff role, a manager only sales and technician. */
export function canAssignRole(actor: StoreRoleName, role: StoreRoleName): boolean {
  if (role === 'OWNER') return false;
  if (actor === 'OWNER') return true;
  if (actor === 'MANAGER') return role === 'SALES' || role === 'TECHNICIAN';
  return false;
}
